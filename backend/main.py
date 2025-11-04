from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import tensorflow as tf
import numpy as np, json, joblib, uvicorn, tempfile
from tensorflow.keras.preprocessing import image as keras_image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Load models ===
image_model = tf.keras.models.load_model("models/efficientnet_quickdemo.h5")
with open("models/class_names.json") as f:
    image_classes = json.load(f)

text_pipeline = pipeline("text-classification", model="models/text_quick", tokenizer="distilbert-base-uncased")
label_encoder = joblib.load("models/label_encoder.joblib")

@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await file.read())
        img_path = tmp.name
    img = keras_image.load_img(img_path, target_size=(224, 224))
    x = keras_image.img_to_array(img)
    x = tf.keras.applications.efficientnet.preprocess_input(x)
    x = np.expand_dims(x, 0)
    preds = image_model.predict(x)[0]
    label = image_classes[np.argmax(preds)]
    confidence = float(np.max(preds))
    return {"type": "image", "prediction": label, "confidence": confidence}

@app.post("/predict/text")
async def predict_text(description: str = Form(...)):
    pred = text_pipeline(description, top_k=None)[0]
    idx = int(pred["label"].replace("LABEL_", ""))
    disease = label_encoder.inverse_transform([idx])[0]
    confidence = float(pred["score"])
    return {"type": "text", "prediction": disease, "confidence": confidence}

@app.get("/")
def root():
    return {"message": "PlantDocBot API is running!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
