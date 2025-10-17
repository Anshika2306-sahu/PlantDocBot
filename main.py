# main.py

#upstream to remote branch
#create a branch remotely in gitub repo

from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
import torch
from models.PlantDiseaseModel import PlantDiseaseModel # Your CNN class
from transformers import pipeline # For the text model
import io
from PIL import Image
from torchvision import transforms

# --- 1. DEFINE YOUR MODELS AND CLASSES ---

# Pydantic model for text input
class TextPredictionInputModel(BaseModel):
    input: str

# A list of your class names for the image model.
# !!! IMPORTANT: This MUST have 38 class names in the correct order from your training notebook !!!
CLASS_NAMES = [
    # TODO: Replace these placeholders with the 38 actual class names
    "class_0", "class_1", "class_2", "class_3", "class_4", "class_5", 
    "class_6", "class_7", "class_8", "class_9", "class_10", "class_11", 
    "class_12", "class_13", "class_14", "class_15", "class_16", "class_17", 
    "class_18", "class_19", "class_20", "class_21", "class_22", "class_23", 
    "class_24", "class_25", "class_26", "class_27", "class_28", "class_29", 
    "class_30", "class_31", "class_32", "class_33", "class_34", "class_35", 
    "class_36", "class_37"
]


# --- 2. LOAD MODELS ON STARTUP ---

# Load the text classification model from the local folder
text_classifier = pipeline("text-classification", model="models/disease_detection_model")

# Load the image classification model (CNN)
image_model = PlantDiseaseModel()
# Make sure your .pth file name matches here
image_model.load_state_dict(torch.load("models/plant_disease_cnn.pth", map_location=torch.device('cpu')))
image_model.eval() # Set the model to evaluation mode


# --- 3. CREATE FASTAPI APP ---
app = FastAPI(title="Plant Doc API")


# --- 4. DEFINE API ENDPOINTS ---

@app.get("/health-check")
def health_check():
    return {"status": "Ok"}

@app.post("/image-prediction")
async def image_predict(file: UploadFile = File(...)):
    # Read the image file
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB") # Use .convert("RGB") to ensure 3 channels

    # Define image transformations (these now match your training script)
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.4759, 0.5003, 0.4266],
                             std=[0.2102, 0.1888, 0.2262])
    ])
    
    # Preprocess the image and add a batch dimension
    img_tensor = transform(image).unsqueeze(0)

    # Make a prediction
    with torch.no_grad():
        outputs = image_model(img_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, 1)
        
        predicted_class = CLASS_NAMES[predicted_idx.item()]
        confidence_score = confidence.item()
        
    return {
        "filename": file.filename,
        "predicted_class": predicted_class,
        "confidence": f"{confidence_score:.4f}"
    }


@app.post("/text-prediction")
def text_predict(input_data: TextPredictionInputModel):
    # Use the text classification pipeline to make a prediction
    prediction = text_classifier(input_data.input)
    
    return {
        "input_text": input_data.input,
        "prediction": prediction
    }