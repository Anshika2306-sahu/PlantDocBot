from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import io
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from transformers import AutoTokenizer, AutoModelForSequenceClassification

app = FastAPI()

# ======= IMAGE CLASSIFIER SETUP =======

# Path to your EfficientNet-B0 checkpoint (.pth) as saved in your notebook
CKPT_PATH = "backend/ImageClassificationModel.ipynb.pth"

# Load checkpoint and build model
ckpt = torch.load(CKPT_PATH, map_location="cpu")
num_classes = len(ckpt["classes"])

# Build model architecture and load weights
image_model = models.efficientnet_b0(weights=None)
in_feats = image_model.classifier[1].in_features
image_model.classifier[1] = nn.Linear(in_feats, num_classes)
image_model.load_state_dict(ckpt["model_state"], strict=True)
image_model.eval()

# Store/restore label list for display
class_labels = ckpt["classes"]

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

@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    x = image_tf(image).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(image_model(x), dim=1)[0]
        top_idx = torch.argmax(probs).item()
        top_label = class_labels[top_idx]
        top_prob = float(probs[top_idx])
    return JSONResponse({"prediction": top_label, "probability": top_prob})

# ======= TEXT CLASSIFIER SETUP =======

TEXT_MODEL_PATH = "textclassificationModel.ipynb"

tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL_PATH)
text_model = AutoModelForSequenceClassification.from_pretrained(TEXT_MODEL_PATH)
text_model.eval()

@app.post("/predict/text")
async def predict_text(text: str = Form(...)):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
    with torch.no_grad():
        logits = text_model(**inputs).logits
        pred_idx = torch.argmax(logits, dim=1).item()
    return JSONResponse({"prediction": str(pred_idx)})

