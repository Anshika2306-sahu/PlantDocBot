from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import io
import json

class TextPredictionInputModel(BaseModel):
    input: str

# Load configurations
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)

# Load class names
with open(os.path.join(BASE_DIR, 'image_class_names.json'), 'r') as f:
    CLASS_NAMES = json.load(f)

# Load disease recommendations
with open(os.path.join(BASE_DIR, 'disease_recommendations.json'), 'r') as f:
    DISEASE_RECOMMENDATIONS = json.load(f)

image_model = None
text_classifier = None
text_encoder = None
models_loaded = False


async def _load_models():
    global image_model, text_classifier, text_encoder, models_loaded
    try:
        import torch
        import joblib
        from transformers import pipeline
        from PIL import Image
        from torchvision import transforms
        from models.PlantDiseaseModel import PlantDiseaseModel

        TEXT_MODEL_PATH = os.path.join(BASE_DIR, "disease_detection_model")
        text_classifier = pipeline("text-classification", model=TEXT_MODEL_PATH)

        TEXT_ENCODER_PATH = os.path.join(BASE_DIR, "text_label_encoder.joblib")
        text_encoder = joblib.load(TEXT_ENCODER_PATH)

        image_model = PlantDiseaseModel()
        IMAGE_MODEL_PATH = os.path.join(BASE_DIR, "models", "plant_disease_cnn.pth")
        try:
            with open(IMAGE_MODEL_PATH, 'rb') as f:
                weights = torch.load(f, map_location=torch.device('cpu'))
            image_model.load_state_dict(weights)
            image_model.eval()
        except FileNotFoundError:
            return False, f"Image model file not found at: {IMAGE_MODEL_PATH}"

        models_loaded = True
        return True, "Models loaded"

    except Exception as e:
        return False, str(e)


app = FastAPI(title="Plant Disease Detection API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend static files
frontend_path = os.path.join(PARENT_DIR, "frontend")
app.mount("/static", StaticFiles(directory=frontend_path), name="static")


@app.on_event("startup")
async def startup_event():
    success, msg = await _load_models()
    if not success:
        print(f"WARNING: models failed to load on startup: {msg}")


@app.get("/")
async def home():
    return FileResponse(os.path.join(frontend_path, "index.html"))


@app.get("/health-check")
def health_check():
    return {"status": "Ok", "models_loaded": models_loaded}


@app.get("/api/diseases")
def get_all_diseases():
    """Get list of all detectable diseases"""
    return {"diseases": CLASS_NAMES}


@app.get("/api/recommendations/{disease_name}")
def get_disease_recommendations(disease_name: str):
    """Get treatment recommendations for a specific disease"""
    # Normalize disease name
    disease_key = disease_name.replace(" ", "_")
    
    if disease_key in DISEASE_RECOMMENDATIONS:
        return DISEASE_RECOMMENDATIONS[disease_key]
    else:
        # Try to find a partial match
        for key in DISEASE_RECOMMENDATIONS:
            if disease_key.lower() in key.lower() or key.lower() in disease_key.lower():
                return DISEASE_RECOMMENDATIONS[key]
        
        raise HTTPException(
            status_code=404, 
            detail=f"No recommendations found for disease: {disease_name}"
        )


@app.post("/api/image-prediction")
async def image_predict(file: UploadFile = File(...)):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Image model not loaded yet")

    import torch
    from PIL import Image
    from torchvision import transforms

    contents = await file.read()
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

        predicted_class = CLASS_NAMES[predicted_idx.item()]
        confidence_score = confidence.item()

    # Get recommendations for the predicted disease
    recommendations = None
    if predicted_class in DISEASE_RECOMMENDATIONS:
        recommendations = DISEASE_RECOMMENDATIONS[predicted_class]

    return {
        "filename": file.filename,
        "predicted_class": predicted_class,
        "confidence": f"{confidence_score:.4f}",
        "recommendations": recommendations
    }


@app.post("/api/text-prediction")
def text_predict(input_data: TextPredictionInputModel):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Text model not loaded yet")

    raw_prediction = text_classifier(input_data.input)[0]

    label_id = int(raw_prediction['label'].split('_')[-1])
    predicted_label_name = text_encoder.inverse_transform([label_id])[0]

    # Get recommendations for the predicted disease
    recommendations = None
    if predicted_label_name in DISEASE_RECOMMENDATIONS:
        recommendations = DISEASE_RECOMMENDATIONS[predicted_label_name]

    return {
        "input_text": input_data.input,
        "predicted_disease": predicted_label_name,
        "confidence": f"{raw_prediction['score']:.4f}",
        "recommendations": recommendations
    }


# Legacy endpoints for backward compatibility
@app.post("/image-prediction")
async def image_predict_legacy(file: UploadFile = File(...)):
    return await image_predict(file)


@app.post("/text-prediction")
def text_predict_legacy(input_data: TextPredictionInputModel):
    return text_predict(input_data)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
