from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sklearn.preprocessing import LabelEncoder
import numpy as np
from PIL import Image
from torchvision import transforms
import json
import io

app = FastAPI(title="Plant Disease Classifier API")

#TEXT CLASSIFIER 
MODEL_PATH = "best_plant_text_classifier"
ENCODER_PATH = "best_plant_text_classifier/encoder_classes.npy"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
text_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
text_model.eval()

encoder = LabelEncoder()
encoder.classes_ = np.load(ENCODER_PATH, allow_pickle=True)

class TextInput(BaseModel):
    text: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/predict_text")
def predict_text(input_data: TextInput):
    text = input_data.text
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = text_model(**inputs)
        logits = outputs.logits
        probs = F.softmax(logits, dim=-1)
        pred_idx = torch.argmax(probs, dim=-1).item()
        confidence = probs[0][pred_idx].item()
    pred_label = encoder.inverse_transform([pred_idx])[0]
    return {
        "input": text,
        "predicted_class": pred_label,
        "confidence": round(confidence*100, 2)
    }

#IMAGE CLASSIFIER 
IMG_MODEL_PATH = "plant_cnn.pth"
CLASS_MAPPING_PATH = "class_mapping.json"

# PlantCnn architecture
class PlantCNN(nn.Module):
    def __init__(self, num_classes):
        super(PlantCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, 1, 1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, 3, 1, 1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, 3, 1, 1)
        self.bn3 = nn.BatchNorm2d(128)
        self.conv4 = nn.Conv2d(128, 256, 3, 1, 1)
        self.bn4 = nn.BatchNorm2d(256)
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.5)
        self.fc1 = nn.Linear(256*8*8, 512)
        self.fc2 = nn.Linear(512, 38)  # 38 classes in dataset

    def forward(self, x):
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        x = self.pool(F.relu(self.bn4(self.conv4(x))))
        x = x.view(x.size(0), -1)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x


with open(CLASS_MAPPING_PATH, "r") as f:
    idx_to_class = json.load(f)

num_classes = len(idx_to_class)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


img_model = PlantCNN(num_classes).to(device)
img_model.load_state_dict(torch.load(IMG_MODEL_PATH, map_location=device))
img_model.eval()


transform = transforms.Compose([
    transforms.Resize((128,128)),
    transforms.ToTensor()
])

@app.post("/predict_image")
def predict_image(file: UploadFile = File(...)):
    image_bytes = file.file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = img_model(img_tensor)
        probs = F.softmax(outputs, dim=1)

    
    top2_prob, top2_idx = torch.topk(probs, 2)
    results = []
    for i in range(top2_idx.size(1)):
        cls_idx = top2_idx[0,i].item()
        conf = top2_prob[0,i].item()
        results.append({
            "predicted_class": idx_to_class[str(cls_idx)],
            "confidence": round(conf*100, 2)
        })
    return results
