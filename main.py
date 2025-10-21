from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
import torch
import torch.nn as nn
from models.PlantDiseaseModel import PlantDiseaseModel

class TextPredictionInputModel(BaseModel):
    input: str

cnn = PlantDiseaseModel()

cnn.load_state_dict(torch.load("models/plant_disease_model.pth", map_location=torch.device('cpu')))

app = FastAPI()


@app.get("/health-check")
def greet():
    return "Ok"

@app.post("/image-prediction")
async def image_predict(file: UploadFile = File(...)):
    # Use the image classification model and make a prediction and return acurate output
    # Some logic
    return {
        "label": "Tomato healthy leaf",
        "confidence": 0.95,
        "recommendation": "Your plant is healthy. Keep up the good work!"
    }

@app.post("/text-prediction")
def text_predict(input_data: TextPredictionInputModel):
    # Use the text classification model and make a prediction and return acurate output
    # Some logic
    return {
        "label": "Tomato healthy leaf",
        "confidence": 0.95,
        "recommendation": "Your plant is healthy. Keep up the good work!"
    }

# @app.post("/test-endpoint/{id}") # This endpoint is taking input in the form of a path variable
# def image_predict(id: int):
#     return "This is a post request"

# @app.post("/test-endpoint-two") #This endpoint is taking input in the form of a query parameter
# def text_predict(input: str):
#     # Some code to take the input and give it to the model
#     return {
#         "label": "Tomato healthy leaf",
#         "confidence": 0.95,
#         "recommendation": "Your plant is healthy. Keep up the good work!"
#     }
