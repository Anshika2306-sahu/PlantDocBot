from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from PIL import Image
import io
import json
from torchvision import transforms
from torchvision.models import resnet18

# ----------------------------
# Configuration
# ----------------------------
TEXT_MODEL_PATH = "models/text_classification_model"
IMAGE_MODEL_PATH = "models/image_model.pth"
LABEL_MAP_PATH = "models/label_map.json"
API_BASE_URL = "http://127.0.0.1:8000"  # Update if deploying

# ----------------------------
# FastAPI App Initialization
# ----------------------------
app = FastAPI(
    title="Plant Disease Detection API",
    description="API for detecting plant diseases using text and image inputs"
)

# Enable CORS (for frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Load Label Map
# ----------------------------
try:
    with open(LABEL_MAP_PATH, 'r') as f:
        label_map = json.load(f)
except FileNotFoundError:
    raise RuntimeError(f"Label map not found at {LABEL_MAP_PATH}.")
except Exception as e:
    raise RuntimeError(f"Failed to load label map: {str(e)}")

# ----------------------------
# 🔹 Disease Recommendation Map
# ----------------------------
disease_recommendations = {
    "Apple___Apple_scab": "Remove infected leaves, apply fungicide like Mancozeb, and ensure good air circulation.",
    "Apple___Black_rot": "Prune infected branches, remove mummified fruits, and spray Captan or copper-based fungicide.",
    "Apple___Cedar_apple_rust": "Remove nearby juniper hosts, and use fungicides like Myclobutanil.",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": "Rotate crops, use resistant hybrids, and apply strobilurin fungicides.",
    "Corn_(maize)___Common_rust_": "Plant resistant varieties and apply fungicides like Azoxystrobin if infection is severe.",
    "Corn_(maize)___Northern_Leaf_Blight": "Use resistant hybrids and rotate crops to minimize spore survival.",
    "Potato___Early_blight": "Use certified seed, apply Chlorothalonil or Mancozeb, and avoid overhead irrigation.",
    "Potato___Late_blight": "Use resistant varieties, remove infected plants, and spray metalaxyl-based fungicide.",
    "Tomato___Early_blight": "Prune lower leaves, avoid water splash, and apply copper-based fungicide.",
    "Tomato___Late_blight": "Destroy infected plants and spray with copper oxychloride or Mancozeb.",
    "Tomato___Leaf_Mold": "Increase air circulation, avoid overcrowding, and apply fungicide like chlorothalonil.",
    "Tomato___Septoria_leaf_spot": "Remove diseased leaves, use drip irrigation, and apply fungicide like mancozeb.",
    "Tomato___Target_Spot": "Avoid water on foliage, use crop rotation, and apply fungicides such as difenoconazole.",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "Control whiteflies, remove infected plants, and use virus-resistant varieties.",
    "Tomato___Tomato_mosaic_virus": "Avoid handling wet plants, disinfect tools, and use resistant varieties.",
    "Pepper,_bell___Bacterial_spot": "Use certified seeds, apply copper sprays, and avoid working with wet plants.",
    "Peach___Bacterial_spot": "Apply copper-based fungicides before leaf drop and plant resistant varieties.",
    "Grape___Black_rot": "Prune and destroy infected vines, and apply myclobutanil during early growth.",
    "Orange___Haunglongbing_(Citrus_greening)": "Control psyllid vector, remove infected trees, and plant disease-free stock.",
    "Strawberry___Leaf_scorch": "Remove infected leaves, avoid overhead watering, and apply fungicides like captan."
}

# ----------------------------
# Load Text Model
# ----------------------------
try:
    tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL_PATH)
    text_model = AutoModelForSequenceClassification.from_pretrained(TEXT_MODEL_PATH)
    text_model.eval()
    print("✅ Text model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading text model: {str(e)}")
    raise RuntimeError("Failed to load text model. Check path and model files.")

# ----------------------------
# Load Image Model
# ----------------------------
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

try:
    num_classes = len(label_map)
    print(f"Number of classes: {num_classes}")

    checkpoint = torch.load(IMAGE_MODEL_PATH, map_location=device)

    if isinstance(checkpoint, dict):
        model_state = checkpoint.get('model_state_dict', checkpoint.get('state_dict', checkpoint))
    else:
        model_state = checkpoint

    new_state = {}
    for k, v in model_state.items():
        if k.startswith("model."):
            new_state[k[6:]] = v
        else:
            new_state[k] = v

    image_model = resnet18(weights=None)
    image_model.fc = torch.nn.Linear(image_model.fc.in_features, num_classes)

    image_model.load_state_dict(new_state, strict=False)
    image_model.to(device)
    image_model.eval()

    print("✅ Image model loaded successfully!")

except Exception as e:
    import traceback
    traceback.print_exc()
    raise RuntimeError(f"Failed to load image model: {str(e)}")

# ----------------------------
# Image Preprocessing
# ----------------------------
from torchvision import transforms
image_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ----------------------------
# Root Endpoint
# ----------------------------
@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "🌱 Plant Disease Detection API is running successfully!"}

# ----------------------------
# Text Prediction Endpoint
# ----------------------------
class TextRequest(BaseModel):
    text: str

@app.post("/predict-text")
async def predict_text(request: TextRequest):
    """Predict disease based on text description."""
    try:
        text = request.text
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)

        with torch.no_grad():
            outputs = text_model(**inputs)

        predictions = torch.softmax(outputs.logits, dim=1)
        predicted_class_id = torch.argmax(predictions, dim=1).item()
        confidence = float(predictions[0][predicted_class_id])

        disease_label = label_map.get(str(predicted_class_id), f"Unknown Disease (ID: {predicted_class_id})")

        # 🔹 Add recommendation system
        recommendation = disease_recommendations.get(
            disease_label,
            "No specific treatment found. Consult an agricultural expert."
        )

        return {
            "class_id": predicted_class_id,
            "label": disease_label,
            "confidence": round(confidence, 4),
            "recommendation": recommendation
        }

    except Exception as e:
        print(f"Text prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Text prediction failed due to internal error.")

# ----------------------------
# Image Prediction Endpoint
# ----------------------------
@app.post("/predict-image")
async def predict_image(file: UploadFile = File(...)):
    """Predict disease based on uploaded leaf image."""
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        image_tensor = image_transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = image_model(image_tensor)

        predictions = torch.softmax(outputs, dim=1)
        predicted_class_id = torch.argmax(predictions, dim=1).item()
        confidence = float(predictions[0][predicted_class_id])

        disease_label = label_map.get(str(predicted_class_id), f"Unknown Disease (ID: {predicted_class_id})")

        # 🔹 Add recommendation system
        recommendation = disease_recommendations.get(
            disease_label,
            "No specific treatment found. Consult an agricultural expert."
        )

        return {
            "class_id": predicted_class_id,
            "label": disease_label,
            "confidence": round(confidence, 4),
            "recommendation": recommendation
        }

    except Exception as e:
        print(f"Image prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Image prediction failed due to internal error.")

# ----------------------------
# Run the App
# ----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
