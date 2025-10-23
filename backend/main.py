# main.py
# -*- coding: utf-8 -*-
import os
import io
import json
import logging
from typing import Optional, Union

import torch
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
from torchvision import transforms
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from models.ImageClassificationModel import CNNModel  

# ----------------- Configuration -----------------
logging.basicConfig(level=logging.INFO)
app = FastAPI(title="🌿 Plant Disease Detection API")

# Paths (use os.path.join for portability)
LABELS_IMAGE_PATH = os.path.join("models", "plant_disease_classes.json")
LABELS_TEXT_PATH = os.path.join("models", "labels_text_model.json")
IMAGE_MODEL_WEIGHTS = os.path.join("models", "cnn_model_weights.pth")
TEXT_MODEL_PATH = "text_classification_model"

# ----------------- Helpers -----------------
def load_labels(path: str) -> Optional[Union[list, dict]]:
    """
    Load labels JSON and return it as-is.
    If JSON is list -> return list
    If JSON is dict -> return dict
    """
    if not os.path.exists(path):
        logging.warning(f"Labels file not found: {path}")
        return None
    with open(path, "r", encoding="utf-8") as f:
        labels = json.load(f)

    # Log shape/type
    try:
        length = len(labels)
    except Exception:
        length = None
    logging.info(f"Loaded labels from {path} (type={type(labels)}, len={length})")
    return labels


# ----------------- Load labels -----------------
image_class_labels = load_labels(LABELS_IMAGE_PATH)
text_class_labels = load_labels(LABELS_TEXT_PATH)

# ----------------- Device -----------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logging.info(f"Using device: {device}")

# ----------------- Image model load -----------------
image_model = None
try:
    # Determine number of classes whether labels is list or dict
    if image_class_labels is None:
        num_image_classes = 15
    elif isinstance(image_class_labels, dict):
        num_image_classes = len(image_class_labels)
    elif isinstance(image_class_labels, list):
        num_image_classes = len(image_class_labels)
    else:
        num_image_classes = 15

    image_model = CNNModel(num_classes=num_image_classes)
    state = torch.load(IMAGE_MODEL_WEIGHTS, map_location=device)
    # if saved as state_dict or full model, handle both
    if isinstance(state, dict) and "state_dict" in state and isinstance(state["state_dict"], dict):
        image_model.load_state_dict(state["state_dict"])
    else:
        image_model.load_state_dict(state)
    image_model.to(device)
    image_model.eval()
    logging.info("✅ Image classification model loaded successfully.")
except Exception as e:
    logging.exception(f"❌ Error loading image model: {e}")
    image_model = None

# ----------------- Image preprocessing -----------------
# Use same mean/std as training
MEAN = [0.4760, 0.5004, 0.4266]
STD  = [0.1775, 0.1509, 0.1960]

image_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD)
])

# ----------------- Text model load -----------------
text_model = None
tokenizer = None
try:
    tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL_PATH)
    text_model = AutoModelForSequenceClassification.from_pretrained(TEXT_MODEL_PATH)
    text_model.to(device)
    text_model.eval()
    logging.info("✅ Text classification model loaded successfully.")
except Exception as e:
    logging.exception(f"❌ Error loading text model: {e}")
    text_model = None

# ----------------- Utility -----------------
def labels_length(labels: Optional[Union[list, dict]]) -> Optional[int]:
    if labels is None:
        return None
    try:
        return len(labels)
    except Exception:
        return None

def check_len_against_labels(logits: torch.Tensor, labels_list: Optional[Union[list, dict]], model_name: str = "model") -> bool:
    """
    Accepts logits tensor shape (..., num_classes) and labels as list or dict.
    """
    if labels_list is None:
        return True
    lab_len = labels_length(labels_list)
    if lab_len is None:
        return True
    if logits.shape[-1] != lab_len:
        logging.error(f"{model_name} logits length {logits.shape[-1]} != labels length {lab_len}")
        return False
    return True

def get_label_by_index(labels: Optional[Union[list, dict]], idx: int) -> str:
    """
    Safely get label by index. Supports list or dict.
    Falls back to returning str(idx) if fetch fails.
    """
    if labels is None:
        return str(idx)
    try:
        if isinstance(labels, list):
            return labels[idx]
        elif isinstance(labels, dict):
            # dict might have string keys or int keys
            if idx in labels:
                return labels[idx]
            # try string key
            sidx = str(idx)
            return labels.get(sidx, str(idx))
        else:
            return str(idx)
    except Exception:
        logging.exception("Error fetching label by index")
        return str(idx)

# ----------------- Endpoints -----------------
@app.get("/health-check")
def health_check():
    return {"status": "ok", "message": "API running successfully"}

@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...)):
    """Accept an image and return predicted label, index and confidence."""
    if image_model is None:
        raise HTTPException(status_code=500, detail="Image model not loaded")

    try:
        image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Preprocess (same transform as training)
    image_tensor = image_transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = image_model(image_tensor)   # logits shape: (1, num_classes)
        probs = torch.softmax(outputs, dim=1)[0]  # shape: (num_classes,)
        top_idx = int(torch.argmax(probs).item())
        top_prob = float(probs[top_idx])

    top_label = get_label_by_index(image_class_labels, top_idx)

    return JSONResponse({
        "prediction": top_label,
        "class_index": top_idx,
        "confidence": round(top_prob, 4)
    })

@app.post("/predict/text")
async def predict_text(text: str = Form(...)):
    """Accept a text input and return predicted class label, index and confidence."""
    if text_model is None or tokenizer is None:
        raise HTTPException(status_code=500, detail="Text model/tokenizer not loaded")
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text input required")

    # Tokenize and move tensors to device
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        logits = text_model(**inputs).logits  
        if not check_len_against_labels(logits, text_class_labels, model_name="text_model"):
            return JSONResponse({
                "error": "label length mismatch",
                "logits_shape": list(logits.shape),
                "labels_len": labels_length(text_class_labels)
            }, status_code=500)

        probs = torch.softmax(logits, dim=1)[0]  # shape: (num_classes,)
        pred_idx = int(torch.argmax(probs).item())
        confidence = float(probs[pred_idx])

    pred_label = get_label_by_index(text_class_labels, pred_idx)

    return JSONResponse({
        "prediction": pred_label,
        "class_index": pred_idx,
        "confidence": round(confidence, 4)
    })

# ----------------- Run -----------------
# uvicorn main:app --reload
