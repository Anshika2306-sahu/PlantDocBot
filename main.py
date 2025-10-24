from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import io
from pathlib import Path
import numpy as np

import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up FastAPI application...")
    
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down FastAPI application...")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load disease classes and treatments
current_dir = Path(__file__).parent
with open(current_dir / "models" / "plant_disease_classes.json") as f:
    disease_classes = json.load(f)

with open(current_dir / "models" / "treatments.json") as f:
    treatments = json.load(f)

# Initialize model
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

try:
    weights = models.ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    num_classes = len(disease_classes)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    model = model.to(device)
    model.eval()  # Set to evaluation mode
    print("Model initialized successfully")
except Exception as e:
    print(f"Error initializing model: {str(e)}")
    model = None  # We'll check this later to ensure model is loaded

# Define image transformations with augmentation for better detection
preprocess = transforms.Compose([
    transforms.Resize((256, 256)),  # Slightly larger initial resize
    transforms.CenterCrop(224),     # Then crop to get most relevant part
    transforms.ColorJitter(brightness=0.1, contrast=0.1),  # Slight color adjustment
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

@app.get("/")
async def root():
    return {"message": "Plant Disease Diagnosis API"}

@app.post("/diagnose")
async def diagnose_plant(file: UploadFile = File(...)):
    if model is None:
        return {
            "disease": "Error",
            "description": "The diagnosis service is currently unavailable. Model failed to initialize.",
            "treatment": "Please try again later.",
            "prevention": "If the problem persists, contact support."
        }

    try:
        # Read and preprocess the image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Get original image size for quality check
        width, height = image.size
        if width < 200 or height < 200:
            return {
                "disease": "Unknown",
                "description": "The uploaded image is too small. Please provide a larger, clearer image of at least 200x200 pixels.",
                "treatment": treatments["Unknown"]["treatment"],
                "prevention": "Try taking a close-up photo with good lighting."
            }
            
        # Preprocess image and run inference
        input_tensor = preprocess(image)
        input_batch = input_tensor.unsqueeze(0).to(device)
        
        # Run model inference
        with torch.no_grad():
            output = model(input_batch)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            
        # Get top 2 predictions and their probabilities
        top_probs, top_indices = torch.topk(probabilities, k=2)
        predicted_idx = str(top_indices[0].item())
        
        # Calculate confidence margin (difference between top 2 predictions)
        confidence_margin = top_probs[0] - top_probs[1]
        
        # Lower base threshold but consider confidence margin
        if top_probs[0].item() < 0.3 or confidence_margin < 0.1:  # More permissive threshold
            # Provide more specific feedback about what might be wrong
            issues = []
            if top_probs[0].item() < 0.3:
                issues.append("The symptoms are not clear enough in the image")
            if confidence_margin < 0.1:
                issues.append("The symptoms could match multiple diseases")
                
            feedback = " and ".join(issues)
            return {
                "disease": "Unknown",
                "description": f"The analysis was inconclusive: {feedback}. Please ensure the image shows the affected plant area clearly with good lighting.",
                "treatment": "Try taking another photo that clearly shows the symptoms. Ensure good lighting and focus on the affected area.",
                "prevention": "For better results: 1) Take close-up shots of affected areas 2) Use natural lighting 3) Keep the image in focus",
                "confidence": float(top_probs[0].item()),
                "confidence_margin": float(confidence_margin.item())
            }
            return {
                "disease": "Unknown",
                "description": "The image analysis was inconclusive. Please ensure the image shows the affected plant area clearly and try again.",
                "treatment": treatments["Unknown"]["treatment"],
                "prevention": treatments["Unknown"]["prevention"]
            }

        predicted_disease = disease_classes[predicted_idx]
        
        # Get diagnosis details
        diagnosis = {
            "disease": predicted_disease,
            "description": treatments[predicted_disease]["description"],
            "treatment": treatments[predicted_disease]["treatment"],
            "prevention": treatments[predicted_disease]["prevention"],
            "confidence": float(top_probs[0].item()),
            "confidence_margin": float(confidence_margin.item())
        }
        
        return diagnosis
    except Exception as e:
        return {
            "disease": "Unknown",
            "description": treatments["Unknown"]["description"],
            "treatment": treatments["Unknown"]["treatment"],
            "prevention": treatments["Unknown"]["prevention"]
        }

# Only run the server directly if this file is run directly
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server from main...")
    try:
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="debug")
    except Exception as e:
        logger.error(f"Server failed to start: {str(e)}")
        raise