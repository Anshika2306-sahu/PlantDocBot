from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import io
import torch
import torch.nn as nn
from torch.nn import functional as F
from torchvision import transforms, models
from PIL import Image
from transformers import AutoTokenizer, AutoModelForSequenceClassification

app = FastAPI()

# ======= MODEL LOADING (RUNS ON SERVER START) =======
# Image Classification Model
CKPT_PATH = "effb0_best.pt"  # Model file is in backend/

ckpt = torch.load(CKPT_PATH, map_location="cpu")
num_classes = 13  # Set to number of classes in your dataset

image_model = models.efficientnet_b0(weights=None)
in_feats = image_model.classifier[1].in_features
image_model.classifier[1] = nn.Linear(in_feats, num_classes)
image_model.load_state_dict(ckpt["model_state"], strict=True)
image_model.eval()

class_labels = ckpt.get("classes", [str(i) for i in range(num_classes)])

IMG_SIZE = int(ckpt.get("img_size", 224))
norm = ckpt.get("normalize", {})
mean = norm.get("mean", [0.485, 0.456, 0.406])
std = norm.get("std", [0.229, 0.224, 0.225])

image_tf = transforms.Compose([
    transforms.Resize(int(IMG_SIZE * 1.15)),
    transforms.CenterCrop(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean, std),
])

# Text Classification Model
TEXT_MODEL_PATH = "text_classification_model"
tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL_PATH)
text_model = AutoModelForSequenceClassification.from_pretrained(TEXT_MODEL_PATH)
text_model.eval()

# Exact label mapping based on your LabelEncoder
text_class_labels = [
    "Pepper bell Bacterial spot",
    "Pepper bell healthy",
    "Potato Early blight",
    "Potato Late blight",
    "Potato healthy",
    "Tomato Bacterial spot",
    "Tomato Early blight",
    "Tomato Late blight",
    "Tomato Leaf Mold",
    "Tomato Septoria leaf spot",
    "Tomato Spider mites Two spotted spider mite",
    "Tomato Target Spot",
    "Tomato YellowLeaf Curl Virus",
    "Tomato healthy",
    "Tomato mosaic virus"
]

# ======= ENDPOINTS =======

@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...)):
    """Accept an image upload and return predicted label and probability."""
    try:
        image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")
    x = image_tf(image).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(image_model(x), dim=1)[0]
        top_idx = torch.argmax(probs).item()
        top_label = class_labels[top_idx]
        top_prob = float(probs[top_idx])
    return JSONResponse({
        "prediction": top_label,
        "probability": round(top_prob, 4)
    })

@app.post("/predict/text")
async def predict_text(text: str = Form(...)):
    """Accept text input and return predicted class label and probability."""
    if not isinstance(text, str) or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text input required")
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
    with torch.no_grad():
        logits = text_model(**inputs).logits
        # Softmax to get probabilities for all classes
        probs = F.softmax(logits, dim=1)[0]
        pred_idx = torch.argmax(probs, dim=0).item()
        pred_prob = float(probs[pred_idx])

    pred_label = text_class_labels[pred_idx] if pred_idx < len(text_class_labels) else str(pred_idx)
    return JSONResponse({
        "prediction": pred_label,
        "class_index": pred_idx,
        "probability": round(pred_prob, 4)  # 0.97 means 97% confidence
    })
