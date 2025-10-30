from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
import joblib
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
import os
import shutil

app = FastAPI()

# ==========================
# Load Text Classification Model
# ==========================
try:
    model = joblib.load("text_classification_model/model/model.pkl")
    vectorizer = joblib.load("text_classification_model/model/tfidf_vectorizer.pkl")
    print("==================> Text classification model loaded successfully.")
except Exception as e:
    print(f"================> Could not load text model: {e}")
    model, vectorizer = None, None

# ==========================
# Load Image Classification Model
# ==========================
try:
    model_image = tf.keras.models.load_model("image_classification_model/model/model.h5")
    meta = joblib.load("image_classification_model/model/label_classes.pkl")
    class_names = meta["class_names"]
    print("================> Image classification model loaded successfully.")
except Exception as e:
    print(f"================> Could not load image model: {e}")
    model_image, class_names = None, None
    

@app.get("/")
def root():
    return {"message": "FastAPI is working!"}

@app.get("/health-check")
def health():
    return {"status": "ok"}


class TextPredictionInputModel(BaseModel):
    input: str

# ==========================
# Text Prediction Endpoint
# ==========================
text_disease_recommendations = {
    "leaf spot": "Remove infected leaves and avoid overhead watering.",
    "powdery mildew": "Use a fungicide and improve air circulation.",
    "rust": "Remove affected leaves and apply a sulfur-based fungicide.",
    "blight": "Prune infected areas and keep foliage dry.",
    "mosaic virus": "No cure — destroy infected plants and disinfect tools.",
    "yellowleaf curl": (
        "Caused by whiteflies. Remove and destroy infected plants. "
        "Control whitefly population using insecticidal soap or yellow sticky traps."
    ),
    "target spot": (
        "Caused by the fungus Corynespora cassiicola. Remove infected leaves. "
        "Avoid overhead irrigation, ensure good air circulation and apply a copper-based fungicide if infection spreads."
    ),
    "spider mite": (
        "Infestation by two-spotted spider mites. Isolate affected plants. "
        "Spray undersides of leaves with water to remove mites. "
        "Use neem oil or miticide if infestation is severe and maintain humidity to deter mite activity."
    ),
    "bacterial spot": (
        "Caused by Xanthomonas bacteria. Remove infected leaves, avoid working with wet plants. "
        "Use copper-based bactericides weekly, and rotate crops to reduce future infections."
    ),
    "healthy": "Your plant looks healthy! Continue regular care and watering."
}

@app.post("/text-prediction")
def text_predict(input_data: TextPredictionInputModel):
    if not model or not vectorizer:
        return {"error": "Model not loaded properly."}

    user_input = input_data.input.strip()
    if not user_input:
        return {"error": "Input text is empty."}

    X = vectorizer.transform([user_input])
    label = model.predict(X)[0]
    confidence = model.predict_proba(X).max() if hasattr(model, "predict_proba") else 1.0

    THRESHOLD = 0.6
    if confidence < THRESHOLD:
        return {
            # "input_text": user_input,
            "predicted_label": "unknown",
            "confidence": float(confidence),
            "recommendation": "Input not recognized. Please describe symptoms more clearly."
        }

    matched_key = next((key for key in text_disease_recommendations if key.lower() in label.lower()), None)
    recommendation = text_disease_recommendations.get(
        matched_key, 
        "No specific recommendation available for this disease."
    )

    return {
        # "input_text": user_input,
        "predicted_label": label,
        "confidence": float(confidence),
        "recommendation": recommendation
    }


# ==========================
# Image Prediction Endpoint
# ==========================
image_disease_recommendations = {
    "spot": "Remove infected leaves and avoid overhead watering.",
    "powdery": "Use a fungicide and improve air circulation.",
    "rust": "Remove infected leaves and prune affected branches. Apply fungicides containing myclobutanil or propiconazole early in the season. Avoid planting apple and cedar trees close together, as spores can spread between them.",
    "blight": "Prune infected areas and keep foliage dry.",
    "curl": (
        "Caused by whiteflies. Remove and destroy infected plants. "
        "Control whitefly population using insecticidal soap or yellow sticky traps."
    ),
    "bacterial": (
        "Caused by Xanthomonas bacteria. Remove infected leaves, avoid working with wet plants. "
        "Use copper-based bactericides weekly, and rotate crops to reduce future infections."
    ),
    "mosaic": "No cure — destroy infected plants and disinfect tools.",
    "scab": "Remove and destroy fallen leaves and infected fruits to prevent reinfection. Apply fungicides containing captan, mancozeb, or sulfur at early leaf stages. Ensure good air circulation by pruning overcrowded branches and avoid overhead watering.",
    "rot": "Remove and destroy all infected leaves, fruits, and pruning debris. Apply fungicides with mancozeb, copper, or myclobutanil early in the season. Avoid overhead watering and maintain good air circulation.",
    "healthy": "Your plant looks healthy! Continue regular care and watering."
}

@app.post("/image-prediction")
async def image_predict(file: UploadFile = File(...)):
    if not model_image:
        return {"error": "Image model not loaded properly."}

    try:
        upload_dir = "uploaded_images"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        img_height, img_width = 128, 128
        img = image.load_img(file_path, target_size=(img_height, img_width))
        arr = image.img_to_array(img) / 255.0
        arr = np.expand_dims(arr, axis=0)

        preds = model_image.predict(arr)
        idx = int(np.argmax(preds, axis=1)[0])
        confidence = float(np.max(preds))
        label = class_names[idx] if class_names and idx < len(class_names) else f"Class {idx}"

        if confidence < 0.60:
            return {
                # "filename": file.filename,
                # "saved_path": file_path,
                "predicted_label": "Unknown / Unclear Image",
                "confidence": confidence,
                "recommendation": "Please upload a clear image of a plant leaf."
            }

        if "healthy" in label.lower():
            recommendation = "Your plant is healthy. Keep up the good work!"
        else:
            recommendation = "No specific recommendation available for this disease."
            for key, rec in image_disease_recommendations.items():
                if key.lower() in label.lower():
                    recommendation = rec
                    break

        return {
            # "filename": file.filename,
            # "saved_path": file_path,
            "predicted_label": label,
            "confidence": confidence,
            "recommendation": recommendation
        }

    except Exception as e:
        return {"error": f"Prediction failed: {e}"}
