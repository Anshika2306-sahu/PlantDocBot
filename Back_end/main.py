from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import random
from PIL import Image
import io

app = FastAPI(title="Plant Doc Bot API", version="1.0")

# =====================================
# Allow Streamlit frontend access
# =====================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:8501"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================
# Request schema
# =====================================
class TextInput(BaseModel):
    input: str

# =====================================
# Dummy disease labels and responses
# =====================================
DISEASES = [
    {"name": "Tomato Yellow Leaf Curl Virus", "recommendation": "Use virus-resistant seeds and control whiteflies."},
    {"name": "Powdery Mildew", "recommendation": "Apply sulfur-based fungicide and ensure good air circulation."},
    {"name": "Late Blight", "recommendation": "Use copper-based fungicide and avoid overhead watering."},
    {"name": "Healthy Plant", "recommendation": "No disease detected. Maintain regular care."}
]

# =====================================
# Routes
# =====================================

@app.get("/")
def root():
    return {"message": "🌿 Plant Doc Bot API is running!"}

@app.post("/text-prediction")
def predict_text(data: TextInput) -> Dict:
    text = data.input.lower()
    
    # Simple mock logic for demo
    disease = random.choice(DISEASES)
    confidence = round(random.uniform(0.7, 0.99), 2)

    return {
        "predicted_label": disease["name"],
        "confidence": confidence,
        "recommendation": disease["recommendation"]
    }

@app.post("/image-prediction")
async def predict_image(file: UploadFile = File(...)) -> Dict:
    try:
        # Load and check the image
        image = Image.open(io.BytesIO(await file.read()))
        disease = random.choice(DISEASES)
        confidence = round(random.uniform(0.7, 0.99), 2)

        return {
            "predicted_label": disease["name"],
            "confidence": confidence,
            "recommendation": disease["recommendation"]
        }

    except Exception as e:
        return {"error": f"Invalid image or server error: {e}"}
