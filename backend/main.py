from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import Dict
from io import BytesIO
from PIL import Image
# FIX: Added 'recommendation' dictionary to the import list
from utils.recommendation import get_recommendation, recommendation 
import torch, os, random

app = FastAPI(title="PlantDocBot API")

# ---------- CORS ----------
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    # Ensure your actual frontend origins are listed here
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ---------- Image Model Loader ----------
IMAGE_MODEL_PATH = "models/image_model.pth"
image_model = None
# FIX: The 'recommendation' dictionary is now imported and accessible here
image_classes = list(recommendation.keys()) 

if os.path.exists(IMAGE_MODEL_PATH):
    print("✅ Found image model file at", IMAGE_MODEL_PATH)
else:
    print("⚠️ Image model not found at", IMAGE_MODEL_PATH, "- using mock predictions.")

# ---------- Text Model Loader (Simplified for brevity/focus) ----------
TEXT_MODEL_DIR = "models/text_model.pkl"
text_tokenizer = None
text_model = None

if os.path.isdir(TEXT_MODEL_DIR):
    try:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        text_tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL_DIR)
        text_model = AutoModelForSequenceClassification.from_pretrained(TEXT_MODEL_DIR)
        text_model.to(DEVICE).eval()
        print("✅ Loaded text model from", TEXT_MODEL_DIR)
    except Exception as e:
        print("⚠️ Failed to load text model:", e)
else:
    print("⚠️ Text model directory not found at", TEXT_MODEL_DIR)

# ---------- Health Check ----------
@app.get("/health-check")
def health_check():
    return {"status": "ok"}

# ---------- Image Prediction ----------
@app.post("/image-prediction")
async def image_predict(file: UploadFile = File(...)) -> Dict:
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        # Read file contents and open as PIL Image
        img = Image.open(BytesIO(await file.read())).convert("RGB")

        # Mock prediction for demo (uses the imported recommendation dictionary keys)
        label = random.choice(list(recommendation.keys()))
        confidence = round(random.uniform(0.55, 0.95) * 100, 2)

        return {
            "class": label,
            "confidence": confidence,
            "recommendation": get_recommendation(label)
        }
    except Exception as e:
        # Note: In a real app, you would log 'e'
        raise HTTPException(status_code=500, detail=f"Image processing failed: {e}")

# ---------- Text Prediction ----------
class TextPredictionInputModel(BaseModel):
    input: str

@app.post("/text-prediction")
def text_predict(input_data: TextPredictionInputModel) -> Dict:
    text = input_data.input.lower()
    
    # Initialize variables to ensure they are defined outside conditional blocks
    label = "Unknown"
    conf = 50.0
    recommendation_text = "Please attach an image for better accuracy."

    if text_model is None or text_tokenizer is None:
        # Mock logic
        if "yellow" in text and "spots" in text:
            label = "Tomato___Early_blight"
            conf = 75.5
            recommendation_text = "Upload an image for precise diagnosis. Check nitrogen and potassium levels."
        else:
            label = "Unknown"
            conf = 60.0
            recommendation_text = "Please attach an image for better accuracy."
    else:
        try:
            inputs = text_tokenizer(text, return_tensors="pt", truncation=True, padding=True).to(DEVICE)
            with torch.no_grad():
                logits = text_model(**inputs).logits
                probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
                idx = int(probs.argmax())
                conf = round(float(probs[idx]) * 100, 2)
                label = text_model.config.id2label.get(idx, f"class_{idx}")
                recommendation_text = get_recommendation(label)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Text prediction failed: {e}")

    # Use the consistent variable name for the final result
    return {"class": label, "confidence": conf, "recommendation": recommendation_text}
