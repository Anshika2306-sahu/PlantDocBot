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
        # Ensure the JSON is a dictionary
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
# 2. LOAD TEXT MODEL
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
# 3. LOAD IMAGE MODEL
# ------------------------------------------------------------
try:
    image_model = PlantDiseaseModel()
    IMAGE_MODEL_PATH = os.path.join(BASE_DIR, "models", "plant_disease_cnn.pth")

    if not os.path.exists(IMAGE_MODEL_PATH):
        raise FileNotFoundError(f"Image model weights not found: {IMAGE_MODEL_PATH}")

    weights = torch.load(IMAGE_MODEL_PATH, map_location=torch.device('cpu'))

    # Handle state_dict variations
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
# 4. FASTAPI INITIALIZATION + CORS
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
# 5. HEALTH CHECK
# ------------------------------------------------------------
@app.get("/health-check", tags=["Utility"])
def health_check():
    print("[Backend] Health check requested.")
    return {"status": "Ok", "message": "Backend running fine."}

# ------------------------------------------------------------
# 6. IMAGE PREDICTION ENDPOINT
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

        print(f"[Backend] Prediction: {display_name} ({confidence_pct:.2f}%)")

        return {
            "class": display_name,
            "confidence": confidence_pct,
            "diseaseKey": disease_key
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

# ------------------------------------------------------------
# 7. TEXT PREDICTION ENDPOINT
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

        print(f"[Backend] Text Prediction: {display_name} ({confidence_pct:.2f}%)")

        return {
            "class": display_name,
            "confidence": confidence_pct,
            "diseaseKey": disease_key
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

# ------------------------------------------------------------
# 8. RUN LOCALLY (Optional)
# ------------------------------------------------------------
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
