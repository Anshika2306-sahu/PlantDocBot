from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import io
import torch
from torchvision import transforms
import torch.nn.functional as F

app = FastAPI()

# Allow frontend (React) access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Mock Models (you can replace with real models) ===
# Let's simulate disease predictions for both image & text
# Mapping disease name -> recommendation
RECOMMENDATIONS = {
    "Tomato YellowLeaf Curl Virus": "Use virus-resistant varieties and control whiteflies.",
    "Tomato Late Blight": "Remove affected leaves and use fungicide sprays like copper-based ones.",
    "Tomato Leaf Mold": "Ensure good air circulation and use resistant varieties.",
    "Healthy": "No action needed. Maintain proper watering and nutrition."
}

# === Dummy Prediction Function for IMAGE ===
def predict_image(file: UploadFile):
    # Just simulating; in a real model you'd load and predict
    filename = file.filename.lower()
    if "curl" in filename:
        disease = "Tomato YellowLeaf Curl Virus"
        confidence = 0.98
    elif "blight" in filename:
        disease = "Tomato Late Blight"
        confidence = 0.94
    elif "mold" in filename:
        disease = "Tomato Leaf Mold"
        confidence = 0.91
    else:
        disease = "Healthy"
        confidence = 0.99

    recommendation = RECOMMENDATIONS.get(disease, "No specific recommendation available.")
    return {"disease": disease, "confidence": confidence, "recommendation": recommendation}


# === Dummy Prediction Function for TEXT ===
def predict_text(text: str):
    text_lower = text.lower()
    if "curl" in text_lower or "yellow" in text_lower:
        disease = "Tomato YellowLeaf Curl Virus"
        confidence = 0.96
    elif "blight" in text_lower or "spots" in text_lower:
        disease = "Tomato Late Blight"
        confidence = 0.93
    elif "mold" in text_lower or "patches" in text_lower:
        disease = "Tomato Leaf Mold"
        confidence = 0.9
    else:
        disease = "Healthy"
        confidence = 0.99

    recommendation = RECOMMENDATIONS.get(disease, "No specific recommendation available.")
    return {"disease": disease, "confidence": confidence, "recommendation": recommendation}


# === FastAPI Routes ===

@app.post("/predict/image")
async def predict_image_endpoint(file: UploadFile = File(...)):
    return predict_image(file)

@app.post("/predict/text")
async def predict_text_endpoint(text: str = Form(...)):
    return predict_text(text)

@app.get("/")
async def root():
    return {"message": "Backend running successfully"}
