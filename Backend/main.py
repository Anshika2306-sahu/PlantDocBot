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
import numpy as np
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
# 2. DISEASE RECOMMENDATIONS DATABASE
# ------------------------------------------------------------
DISEASE_RECOMMENDATIONS = {
    "pepper_bacterial_spot": {
        "display": "Pepper — Bacterial spot",
        "recommendations": [
            {"text": "Remove and destroy all infected plant tissue immediately to prevent spread.", "tone": "high", "priority": 1},
            {"text": "Apply copper-based bactericides every 7–10 days during wet conditions.", "tone": "high", "priority": 2},
            {"text": "Avoid overhead watering; use drip irrigation at the base of plants.", "tone": "medium", "priority": 3},
            {"text": "Ensure proper spacing between plants for better air circulation.", "tone": "low", "priority": 4},
            {"text": "Use disease-free seeds and transplants from certified sources.", "tone": "low", "priority": 5}
        ],
        "stats": {"occurrence": 34, "severity": 8.2, "recovery": 65, "region": "High"}
    },
    "tomato_early_blight": {
        "display": "Tomato — Early blight",
        "recommendations": [
            {"text": "Remove infected lower leaves and dispose of them away from the garden.", "tone": "high", "priority": 1},
            {"text": "Apply fungicide containing chlorothalonil or copper at first sign of symptoms.", "tone": "high", "priority": 2},
            {"text": "Mulch around plants to prevent soil splash onto lower leaves.", "tone": "medium", "priority": 3},
            {"text": "Practice 3-year crop rotation with non-solanaceous crops.", "tone": "medium", "priority": 4},
            {"text": "Water at the base of plants early in the day to allow foliage to dry.", "tone": "low", "priority": 5}
        ],
        "stats": {"occurrence": 42, "severity": 6.8, "recovery": 75, "region": "Moderate"}
    },
    "tomato_late_blight": {
        "display": "Tomato — Late blight",
        "recommendations": [
            {"text": "Destroy all infected plants immediately - this disease spreads rapidly.", "tone": "high", "priority": 1},
            {"text": "Apply preventive fungicides containing mancozeb or chlorothalonil weekly.", "tone": "high", "priority": 2},
            {"text": "Remove volunteer tomato and potato plants that may harbor the disease.", "tone": "high", "priority": 3},
            {"text": "Avoid overhead irrigation and water only in the morning.", "tone": "medium", "priority": 4},
            {"text": "Plant resistant varieties if available in your region.", "tone": "low", "priority": 5}
        ],
        "stats": {"occurrence": 28, "severity": 9.5, "recovery": 35, "region": "High"}
    },
    "potato_late_blight": {
        "display": "Potato — Late blight",
        "recommendations": [
            {"text": "Use certified disease-free seed potatoes from reputable sources.", "tone": "high", "priority": 1},
            {"text": "Destroy infected plants immediately and remove all plant debris.", "tone": "high", "priority": 2},
            {"text": "Apply preventive fungicides before symptoms appear in high-risk periods.", "tone": "high", "priority": 3},
            {"text": "Hill soil around plants to protect tubers from infection.", "tone": "medium", "priority": 4},
            {"text": "Harvest in dry weather and cure potatoes properly before storage.", "tone": "low", "priority": 5}
        ],
        "stats": {"occurrence": 28, "severity": 9.1, "recovery": 45, "region": "High"}
    },
    "corn_(maize)___common_rust": {
        "display": "Corn — Common rust",
        "recommendations": [
            {"text": "Plant resistant hybrid varieties suitable for your climate zone.", "tone": "high", "priority": 1},
            {"text": "Remove and destroy infected plant debris after harvest.", "tone": "medium", "priority": 2},
            {"text": "Apply fungicides if infection is severe during critical growth stages.", "tone": "medium", "priority": 3},
            {"text": "Monitor weather conditions; rust develops in cool, moist weather.", "tone": "low", "priority": 4},
            {"text": "Ensure adequate plant nutrition, especially nitrogen and potassium.", "tone": "low", "priority": 5}
        ],
        "stats": {"occurrence": 60, "severity": 5.5, "recovery": 80, "region": "Moderate"}
    },
    "tomato_bacterial_spot": {
        "display": "Tomato — Bacterial spot",
        "recommendations": [
            {"text": "Remove infected leaves and destroy them to limit bacterial spread.", "tone": "high", "priority": 1},
            {"text": "Apply copper-based bactericides as a preventive measure weekly.", "tone": "high", "priority": 2},
            {"text": "Use drip irrigation instead of overhead watering to keep foliage dry.", "tone": "medium", "priority": 3},
            {"text": "Practice crop rotation and avoid planting tomatoes in same location annually.", "tone": "medium", "priority": 4},
            {"text": "Disinfect tools and hands when working with infected plants.", "tone": "low", "priority": 5}
        ],
        "stats": {"occurrence": 38, "severity": 7.5, "recovery": 60, "region": "High"}
    },
    "potato_early_blight": {
        "display": "Potato — Early blight",
        "recommendations": [
            {"text": "Remove and destroy infected foliage promptly to prevent spread.", "tone": "high", "priority": 1},
            {"text": "Apply fungicides containing chlorothalonil or mancozeb preventively.", "tone": "high", "priority": 2},
            {"text": "Maintain adequate plant spacing for good air circulation.", "tone": "medium", "priority": 3},
            {"text": "Avoid excessive nitrogen fertilization which promotes disease.", "tone": "medium", "priority": 4},
            {"text": "Mulch to prevent soil splash and rotate crops every 2-3 years.", "tone": "low", "priority": 5}
        ],
        "stats": {"occurrence": 45, "severity": 6.5, "recovery": 70, "region": "Moderate"}
    },
    "grape___black_rot": {
        "display": "Grape — Black rot",
        "recommendations": [
            {"text": "Remove all mummified berries and infected canes during dormant pruning.", "tone": "high", "priority": 1},
            {"text": "Apply fungicides from bud break through 6 weeks after bloom.", "tone": "high", "priority": 2},
            {"text": "Ensure good canopy management to improve air circulation and sunlight penetration.", "tone": "medium", "priority": 3},
            {"text": "Remove weeds and grass around vines to reduce humidity.", "tone": "low", "priority": 4},
            {"text": "Consider resistant varieties if replanting vineyard sections.", "tone": "low", "priority": 5}
        ],
        "stats": {"occurrence": 35, "severity": 8.0, "recovery": 55, "region": "High"}
    },
    "apple___apple_scab": {
        "display": "Apple — Apple scab",
        "recommendations": [
            {"text": "Apply fungicides from green tip stage through petal fall regularly.", "tone": "high", "priority": 1},
            {"text": "Rake and remove fallen leaves in autumn to reduce overwintering spores.", "tone": "high", "priority": 2},
            {"text": "Prune trees to improve air circulation and reduce leaf wetness.", "tone": "medium", "priority": 3},
            {"text": "Consider planting scab-resistant apple varieties for new orchards.", "tone": "low", "priority": 4},
            {"text": "Avoid overhead irrigation during leaf emergence and flowering.", "tone": "low", "priority": 5}
        ],
        "stats": {"occurrence": 52, "severity": 7.2, "recovery": 68, "region": "Moderate"}
    },
    "strawberry___leaf_scorch": {
        "display": "Strawberry — Leaf scorch",
        "recommendations": [
            {"text": "Remove and destroy severely infected leaves and plants.", "tone": "high", "priority": 1},
            {"text": "Apply appropriate fungicides during bloom and fruit development.", "tone": "high", "priority": 2},
            {"text": "Ensure proper plant spacing for adequate air circulation.", "tone": "medium", "priority": 3},
            {"text": "Avoid excessive nitrogen fertilization which promotes disease.", "tone": "medium", "priority": 4},
            {"text": "Use disease-free planting material from certified nurseries.", "tone": "low", "priority": 5}
        ],
        "stats": {"occurrence": 30, "severity": 6.0, "recovery": 72, "region": "Moderate"}
    }
}

# Generic recommendations for unknown diseases
GENERIC_RECOMMENDATIONS = [
    {"text": "Remove and destroy visibly infected plant parts to prevent spread.", "tone": "high", "priority": 1},
    {"text": "Improve air circulation around plants through proper spacing and pruning.", "tone": "medium", "priority": 2},
    {"text": "Water at the base of plants early in the day to minimize leaf wetness.", "tone": "medium", "priority": 3},
    {"text": "Practice crop rotation and maintain good garden sanitation.", "tone": "low", "priority": 4},
    {"text": "Monitor plants regularly for early detection of disease symptoms.", "tone": "low", "priority": 5}
]

# ------------------------------------------------------------
# 3. LOAD TEXT MODEL
# ------------------------------------------------------------
try:
    TEXT_MODEL_PATH = os.path.join(BASE_DIR, "disease_detection_model")
    if not os.path.exists(TEXT_MODEL_PATH):
        raise FileNotFoundError(f"Text model directory not found: {TEXT_MODEL_PATH}")

    text_classifier = pipeline("text-classification", model=TEXT_MODEL_PATH)
    print("[INFO] Text classification model loaded successfully.")

    TEXT_ENCODER_PATH = os.path.join(BASE_DIR, "text_label_encoder.joblib")
    if not os.path.exists(TEXT_ENCODER_PATH):
        raise FileNotFoundError(f"Text encoder not found: {TEXT_ENCODER_PATH}")
    text_encoder = joblib.load(TEXT_ENCODER_PATH)
    print("[INFO] Text label encoder loaded successfully.")

except Exception as e:
    print(f"[FATAL] Error loading text model or encoder: {e}")
    exit()

# ------------------------------------------------------------
# 4. LOAD IMAGE MODEL
# ------------------------------------------------------------
try:
    image_model = PlantDiseaseModel()
    IMAGE_MODEL_PATH = os.path.join(BASE_DIR, "models", "plant_disease_cnn.pth")

    if not os.path.exists(IMAGE_MODEL_PATH):
        raise FileNotFoundError(f"Image model weights not found: {IMAGE_MODEL_PATH}")

    weights = torch.load(IMAGE_MODEL_PATH, map_location=torch.device('cpu'))

    if isinstance(weights, dict) and 'state_dict' in weights:
        image_model.load_state_dict(weights['state_dict'])
    elif isinstance(weights, dict):
        image_model.load_state_dict(weights)
    else:
        print("[WARNING] Loaded weights may not be a state_dict; attempting direct load.")
        image_model.load_state_dict(weights)

    image_model.eval()
    print("[INFO] Image model loaded successfully and set to evaluation mode.")

except Exception as e:
    print(f"[FATAL] Error loading image model: {e}")
    exit()

# ------------------------------------------------------------
# 5. HELPER FUNCTION TO GET RECOMMENDATIONS
# ------------------------------------------------------------
def get_recommendations(disease_key):
    """
    Get recommendations for a given disease key.
    Returns recommendations and stats if available, otherwise generic recommendations.
    """
    # Try exact match first
    if disease_key in DISEASE_RECOMMENDATIONS:
        return DISEASE_RECOMMENDATIONS[disease_key]
    
    # Try with underscores normalized
    normalized_key = disease_key.lower().replace("___", "_").replace(" ", "_")
    if normalized_key in DISEASE_RECOMMENDATIONS:
        return DISEASE_RECOMMENDATIONS[normalized_key]
    
    # Try partial matching for common diseases
    for key in DISEASE_RECOMMENDATIONS.keys():
        if key in disease_key or disease_key in key:
            return DISEASE_RECOMMENDATIONS[key]
    
    # Return generic recommendations
    return {
        "display": "Unknown Disease",
        "recommendations": GENERIC_RECOMMENDATIONS,
        "stats": {"occurrence": 0, "severity": 0, "recovery": 0, "region": "Unknown"}
    }

# ------------------------------------------------------------
# 6. FASTAPI INITIALIZATION + CORS
# ------------------------------------------------------------
app = FastAPI(title="Plant Doc API", description="AI-powered plant disease prediction API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

print("[INFO] CORS middleware configured for frontend origins:", origins)

# ------------------------------------------------------------
# 7. HEALTH CHECK
# ------------------------------------------------------------
@app.get("/health-check", tags=["Utility"])
def health_check():
    print("[Backend] Health check requested.")
    return {"status": "Ok", "message": "Backend running fine."}

# ------------------------------------------------------------
# 8. IMAGE PREDICTION ENDPOINT
# ------------------------------------------------------------
@app.post("/predict", tags=["Prediction"])
async def predict_image(image_file: UploadFile = File(...)):
    print("[Backend] Received image prediction request.")
    if not image_file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        contents = await image_file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        print("[Backend] Image loaded successfully.")

        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.4759, 0.5003, 0.4266],
                                 std=[0.2102, 0.1888, 0.2262])
        ])
        img_tensor = transform(image).unsqueeze(0)
        print("[Backend] Image transformed for model input.")

        with torch.no_grad():
            outputs = image_model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)
            predicted_idx_str = str(predicted_idx.item())
            confidence_score = confidence.item()

        if predicted_idx_str not in CLASS_NAMES:
            raise HTTPException(status_code=500, detail=f"Class index '{predicted_idx_str}' not found in CLASS_NAMES.")

        predicted_class_name = CLASS_NAMES[predicted_idx_str]
        display_name = predicted_class_name.replace("___", ", ").replace("_", " ")
        disease_key = predicted_class_name.lower().replace("___", "_").replace(" ", "_")
        confidence_pct = float(confidence_score * 100)

        # Get recommendations
        disease_info = get_recommendations(disease_key)

        print(f"[Backend] Prediction: {display_name} ({confidence_pct:.2f}%)")

        return {
            "class": display_name,
            "confidence": confidence_pct,
            "diseaseKey": disease_key,
            "recommendations": disease_info["recommendations"],
            "stats": disease_info["stats"],
            "displayName": disease_info["display"]
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

# ------------------------------------------------------------
# 9. TEXT PREDICTION ENDPOINT
# ------------------------------------------------------------
@app.post("/predict_text", tags=["Prediction"])
async def predict_text(symptoms: str = Form(...)):
    print(f"[Backend] Received text prediction request: '{symptoms[:60]}...'")
    if not symptoms.strip():
        raise HTTPException(status_code=400, detail="Symptom text cannot be empty.")

    try:
        raw_prediction = text_classifier(symptoms)[0]
        confidence = raw_prediction["score"]
        label_str = raw_prediction["label"]

        try:
            label_idx = int(label_str.split("_")[-1])
        except Exception:
            raise HTTPException(status_code=500, detail="Unable to parse label index from model output.")

        predicted_class_name = None

        if hasattr(text_encoder, "classes_") and label_idx < len(text_encoder.classes_):
            predicted_class_name = text_encoder.classes_[label_idx]
        elif str(label_idx) in CLASS_NAMES:
            predicted_class_name = CLASS_NAMES[str(label_idx)]
        else:
            raise HTTPException(status_code=500, detail="Label index not found in encoders or CLASS_NAMES.")

        disease_key = predicted_class_name.lower().replace("___", "_").replace(" ", "_")
        display_name = predicted_class_name.replace("___", ", ").replace("_", " ")
        confidence_pct = float(confidence * 100)

        # Get recommendations
        disease_info = get_recommendations(disease_key)

        print(f"[Backend] Text Prediction: {display_name} ({confidence_pct:.2f}%)")

        return {
            "class": display_name,
            "confidence": confidence_pct,
            "diseaseKey": disease_key,
            "recommendations": disease_info["recommendations"],
            "stats": disease_info["stats"],
            "displayName": disease_info["display"]
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

# ------------------------------------------------------------
# 10. RUN LOCALLY (Optional)
# ------------------------------------------------------------
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)