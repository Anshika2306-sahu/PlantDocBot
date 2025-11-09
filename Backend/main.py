from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
import torch
import os
import io
from PIL import Image
from torchvision import transforms
import joblib
import json
from models.PlantDiseaseModel import PlantDiseaseModel
from transformers import pipeline

# ------------------------------------------------------------
# 1. INITIAL SETUP
# ------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CLASS_NAMES_PATH = os.path.join(BASE_DIR, 'image_class_names.json')

# --- Load Class Names Safely ---
try:
    with open(CLASS_NAMES_PATH, 'r') as f:
        CLASS_NAMES = json.load(f)
        if isinstance(CLASS_NAMES, list):
            print(f"[WARNING] CLASS_NAMES was a list, converting it to dictionary...")
            CLASS_NAMES = {str(i): name for i, name in enumerate(CLASS_NAMES)}
        elif not isinstance(CLASS_NAMES, dict):
            raise ValueError("CLASS_NAMES must be a dictionary mapping indices to class names.")
except FileNotFoundError:
    print(f"[FATAL] Could not find class names file at {CLASS_NAMES_PATH}")
    exit()
except json.JSONDecodeError:
    print(f"[FATAL] Could not decode JSON from {CLASS_NAMES_PATH}")
    exit()
except Exception as e:
    print(f"[FATAL] Unexpected error loading CLASS_NAMES: {e}")
    exit()

print(f"[INFO] Class names loaded successfully with {len(CLASS_NAMES)} entries.")

# ------------------------------------------------------------
# 2. NORMALIZATION UTILITY
# ------------------------------------------------------------
def normalize_key(label: str) -> str:
    """Standardize prediction label keys to ensure consistent matching."""
    return (
        label.lower()
        .replace(" ", "_")
        .replace("___", "_")
        .replace("__", "_")
        .replace("(maize)", "corn")
        .replace("pepper__bell", "pepper_bell")
        .strip("_")
    )

# ------------------------------------------------------------
# 3. DISEASE RECOMMENDATIONS DATABASE
# ------------------------------------------------------------
DISEASE_RECOMMENDATIONS = {
    "pepper_bacterial_spot": {
        "display": "Pepper — Bacterial spot",
        "recommendations": [
            {"text": "Remove and destroy all infected plant tissue immediately.", "tone": "high", "priority": 1},
            {"text": "Apply copper-based bactericides every 7–10 days during wet periods.", "tone": "high", "priority": 2},
            {"text": "Avoid overhead watering to minimize bacterial spread.", "tone": "medium", "priority": 3},
            {"text": "Ensure good air circulation by spacing plants adequately.", "tone": "low", "priority": 4},
        ],
        "stats": {"occurrence": 34, "severity": 8.2, "recovery": 65, "region": "High"},
    },
    "potato_early_blight": {
        "display": "Potato — Early blight",
        "recommendations": [
            {"text": "Remove and destroy infected foliage promptly to prevent spread.", "tone": "high", "priority": 1},
            {"text": "Apply fungicides containing chlorothalonil or mancozeb preventively.", "tone": "high", "priority": 2},
            {"text": "Maintain adequate spacing for better air circulation.", "tone": "medium", "priority": 3},
            {"text": "Avoid excessive nitrogen fertilization.", "tone": "medium", "priority": 4},
        ],
        "stats": {"occurrence": 45, "severity": 6.5, "recovery": 70, "region": "Moderate"},
    },
    "corn_common_rust": {
        "display": "Corn — Common rust",
        "recommendations": [
            {"text": "Plant rust-resistant hybrid corn varieties.", "tone": "high", "priority": 1},
            {"text": "Remove infected debris post-harvest.", "tone": "medium", "priority": 2},
            {"text": "Apply fungicides if rust pressure is high.", "tone": "medium", "priority": 3},
        ],
        "stats": {"occurrence": 60, "severity": 5.5, "recovery": 80, "region": "Moderate"},
    },
    "strawberry_leaf_scorch": {
        "display": "Strawberry — Leaf scorch",
        "recommendations": [
            {"text": "Remove infected leaves and improve airflow between plants.", "tone": "high", "priority": 1},
            {"text": "Water early in the morning to avoid prolonged leaf wetness.", "tone": "medium", "priority": 2},
        ],
        "stats": {"occurrence": 30, "severity": 6.0, "recovery": 72, "region": "Moderate"},
    },
}

GENERIC_RECOMMENDATIONS = [
    {"text": "Remove and destroy visibly infected plant parts to prevent spread.", "tone": "high", "priority": 1},
    {"text": "Improve air circulation through proper spacing and pruning.", "tone": "medium", "priority": 2},
    {"text": "Water plants at the base early in the morning.", "tone": "medium", "priority": 3},
    {"text": "Practice crop rotation and keep the area clean.", "tone": "low", "priority": 4},
    {"text": "Inspect plants weekly for early signs of disease.", "tone": "low", "priority": 5},
]

# ------------------------------------------------------------
# 4. LOAD TEXT MODEL
# ------------------------------------------------------------
try:
    TEXT_MODEL_PATH = os.path.join(BASE_DIR, "disease_detection_model")
    text_classifier = pipeline("text-classification", model=TEXT_MODEL_PATH)
    text_encoder = joblib.load(os.path.join(BASE_DIR, "text_label_encoder.joblib"))
    print("[INFO] Text model and encoder loaded successfully.")
except Exception as e:
    print(f"[FATAL] Error loading text model or encoder: {e}")
    exit()

# ------------------------------------------------------------
# 5. LOAD IMAGE MODEL
# ------------------------------------------------------------
try:
    image_model = PlantDiseaseModel()
    IMAGE_MODEL_PATH = os.path.join(BASE_DIR, "models", "plant_disease_cnn.pth")
    weights = torch.load(IMAGE_MODEL_PATH, map_location=torch.device("cpu"))
    if isinstance(weights, dict) and "state_dict" in weights:
        image_model.load_state_dict(weights["state_dict"])
    elif isinstance(weights, dict):
        image_model.load_state_dict(weights)
    image_model.eval()
    print("[INFO] Image model loaded successfully.")
except Exception as e:
    print(f"[FATAL] Error loading image model: {e}")
    exit()

# ------------------------------------------------------------
# 6. RECOMMENDATION ENGINE (IMPROVED WITH STATS + RISK)
# ------------------------------------------------------------
def get_recommendations(disease_key: str):
    disease_key = normalize_key(disease_key)

    # --- HEALTHY CASE ---
    if "healthy" in disease_key:
        return {
            "display": "Healthy Plant",
            "recommendations": [
                {"text": "No visible disease detected.", "tone": "info", "priority": 1},
                {"text": "Maintain balanced watering and nutrients.", "tone": "info", "priority": 2},
                {"text": "Inspect plants weekly for early signs of stress.", "tone": "info", "priority": 3},
            ],
            "stats": {"occurrence": 0, "severity": 0, "recovery": 100, "region": "Safe"},
            "risk": "Low",
            "riskColor": "#16a34a",  # Green
        }

    # --- EXACT MATCH ---
    if disease_key in DISEASE_RECOMMENDATIONS:
        data = DISEASE_RECOMMENDATIONS[disease_key]
        stats = data.get("stats", {"occurrence": 20, "severity": 5, "recovery": 60, "region": "Unknown"})
        sev = stats.get("severity", 5)
        if sev >= 8:
            risk, color = "High", "#dc2626"
        elif sev >= 5:
            risk, color = "Moderate", "#facc15"
        else:
            risk, color = "Low", "#16a34a"

        return {
            "display": data.get("display", disease_key.title()),
            "recommendations": data["recommendations"],
            "stats": stats,
            "risk": risk,
            "riskColor": color,
        }

    # --- PARTIAL MATCH ---
    for key in DISEASE_RECOMMENDATIONS:
        if key in disease_key or disease_key in key:
            data = DISEASE_RECOMMENDATIONS[key]
            stats = data.get("stats", {"occurrence": 25, "severity": 5, "recovery": 60, "region": "Unknown"})
            sev = stats.get("severity", 5)
            if sev >= 8:
                risk, color = "High", "#dc2626"
            elif sev >= 5:
                risk, color = "Moderate", "#facc15"
            else:
                risk, color = "Low", "#16a34a"
            return {
                "display": data.get("display", key.title()),
                "recommendations": data["recommendations"],
                "stats": stats,
                "risk": risk,
                "riskColor": color,
            }

    # --- FALLBACK ---
    if any(w in disease_key for w in ["rust", "blight", "spot", "scorch"]):
        return {
            "display": "Fungal or Bacterial Infection (unspecified)",
            "recommendations": GENERIC_RECOMMENDATIONS,
            "stats": {"occurrence": 40, "severity": 6, "recovery": 65, "region": "Moderate"},
            "risk": "Moderate",
            "riskColor": "#facc15",
        }

    return {
        "display": "Unknown Disease",
        "recommendations": GENERIC_RECOMMENDATIONS,
        "stats": {"occurrence": 20, "severity": 5, "recovery": 60, "region": "Unknown"},
        "risk": "Unknown",
        "riskColor": "#9ca3af",
    }

# ------------------------------------------------------------
# 7. FASTAPI INITIALIZATION
# ------------------------------------------------------------
app = FastAPI(title="PlantDoc Backend", description="AI-powered plant disease prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# 8. HEALTH CHECK
# ------------------------------------------------------------
@app.get("/health-check", tags=["Utility"])
def health_check():
    return {"status": "OK", "message": "Backend running fine."}

# ------------------------------------------------------------
# 9. IMAGE PREDICTION ENDPOINT
# ------------------------------------------------------------
@app.post("/predict", tags=["Prediction"])
async def predict_image(image_file: UploadFile = File(...)):
    if not image_file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload a valid image file.")

    try:
        contents = await image_file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.4759, 0.5003, 0.4266],
                                 std=[0.2102, 0.1888, 0.2262])
        ])
        img_tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            outputs = image_model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)
            confidence_pct = float(confidence.item() * 100)
            predicted_class_name = CLASS_NAMES[str(predicted_idx.item())]

        disease_key = normalize_key(predicted_class_name)
        display_name = predicted_class_name.replace("___", ", ").replace("_", " ")

        disease_info = get_recommendations(disease_key)

        return {
            "class": display_name,
            "confidence": confidence_pct,
            "diseaseKey": disease_key,
            "recommendations": disease_info["recommendations"],
            "stats": disease_info["stats"],
            "displayName": disease_info["display"],
            "risk": disease_info["risk"],
            "riskColor": disease_info["riskColor"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------
# 10. TEXT PREDICTION ENDPOINT
# ------------------------------------------------------------
@app.post("/predict_text", tags=["Prediction"])
async def predict_text(symptoms: str = Form(...)):
    if not symptoms.strip():
        raise HTTPException(status_code=400, detail="Symptom text cannot be empty.")

    try:
        raw_prediction = text_classifier(symptoms)[0]
        confidence = raw_prediction["score"]
        label_str = raw_prediction["label"]
        label_idx = int(label_str.split("_")[-1])
        predicted_class_name = text_encoder.classes_[label_idx]
        disease_key = normalize_key(predicted_class_name)
        display_name = predicted_class_name.replace("___", ", ").replace("_", " ")

        disease_info = get_recommendations(disease_key)

        return {
            "class": display_name,
            "confidence": float(confidence * 100),
            "diseaseKey": disease_key,
            "recommendations": disease_info["recommendations"],
            "stats": disease_info["stats"],
            "displayName": disease_info["display"],
            "risk": disease_info["risk"],
            "riskColor": disease_info["riskColor"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
