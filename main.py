from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import io
import os
import imghdr
import torch
import torch.nn as nn
from torch.nn import functional as F
from torchvision import transforms, models
from PIL import Image, UnidentifiedImageError
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# App init
app = FastAPI(title="Plant Health Classifier", version="1.0")

# CORS if you call from a browser frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config
CKPT_PATH = os.getenv("IMAGE_CKPT_PATH", "effb0_best.pt")
TEXT_MODEL_PATH = os.getenv("TEXT_MODEL_PATH", "text_classification_model")
DEFAULT_NUM_CLASSES = 13
DEFAULT_IMG_SIZE = 224
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB cap for uploads
MAX_TEXT_LEN = 512
TOP_K = 3  # number of top image predictions to return

# Exact label mapping for text model (must match model.config.num_labels)
TEXT_CLASS_LABELS = [
    "Pepper bell Bacterial spot",
    "Pepper bell healthy",
    "Potato Early blight",
    "Potato Late blight",
    "Potato healthy",
    "Tomato Bacterial spot",
    "Tomato Early blight",
    "Tomato Late blight",
    "Tomato Leaf Mold",
    "Tomato Septoria leaf spot",
    "Tomato Spider mites Two spotted spider mite",
    "Tomato Target Spot",
    "Tomato YellowLeaf Curl Virus",
    "Tomato healthy",
    "Tomato mosaic virus",
]

# Models (loaded at startup)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_image_model():
    if not os.path.exists(CKPT_PATH):
        raise FileNotFoundError(f"Image checkpoint not found at {CKPT_PATH}")

    ckpt = torch.load(CKPT_PATH, map_location="cpu")
    num_classes = int(ckpt.get("num_classes", DEFAULT_NUM_CLASSES))
    img_size = int(ckpt.get("img_size", DEFAULT_IMG_SIZE))
    norm = ckpt.get("normalize", {})
    mean = norm.get("mean", [0.485, 0.456, 0.406])
    std = norm.get("std", [0.229, 0.224, 0.225])

    # Build model head to match checkpoint
    model = models.efficientnet_b0(weights=None)
    in_feats = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_feats, num_classes)

    state = ckpt.get("model_state", ckpt)  # support raw state_dict too
    missing, unexpected = model.load_state_dict(state, strict=False)
    if missing:
        # Often harmless (e.g., running stats), but log it
        print(f"[warn] Missing keys when loading image model: {missing}")
    if unexpected:
        print(f"[warn] Unexpected keys when loading image model: {unexpected}")

    model.to(device).eval()

    class_labels = ckpt.get("classes", [str(i) for i in range(num_classes)])
    tfm = transforms.Compose([
        transforms.Resize(int(img_size * 1.15)),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean, std),
    ])
    return model, class_labels, tfm

def load_text_model():
    if not os.path.exists(TEXT_MODEL_PATH):
        raise FileNotFoundError(f"Text model not found at {TEXT_MODEL_PATH}")
    tok = AutoTokenizer.from_pretrained(TEXT_MODEL_PATH)
    mdl = AutoModelForSequenceClassification.from_pretrained(TEXT_MODEL_PATH)
    mdl.to(device).eval()

    # Sanity check on label count
    num_labels = getattr(mdl.config, "num_labels", None)
    if num_labels is not None and num_labels != len(TEXT_CLASS_LABELS):
        print(f"[warn] text model num_labels={num_labels} "
              f"!= len(TEXT_CLASS_LABELS)={len(TEXT_CLASS_LABELS)}")
    return tok, mdl

# Actually load once on import
try:
    image_model, IMAGE_CLASS_LABELS, image_tf = load_image_model()
    tokenizer, text_model = load_text_model()
except Exception as e:
    # Fail fast on startup so orchestrators can restart the pod
    raise RuntimeError(f"Model load failed: {e}")

# Schemas
class ImagePrediction(BaseModel):
    label: str
    probability: float

class ImagePredictResponse(BaseModel):
    top_k: list[ImagePrediction] = Field(..., description="Top-K predictions sorted by probability desc")
    best: ImagePrediction

class TextPredictResponse(BaseModel):
    prediction: str
    class_index: int
    probability: float

# Utils
def _validate_image_bytes(b: bytes):
    if not b:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(b) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large (> {MAX_IMAGE_BYTES//(1024*1024)} MB)")
    # Quick format sniff (Pillow will still validate)
    kind = imghdr.what(None, b)
    if kind not in {"jpeg", "png", "bmp", "gif", "tiff", "webp"}:
        # Accept anyway; Pillow might still open, but warn
        pass

def _softmax_to_topk(probs: torch.Tensor, labels: list[str], k: int) -> list[ImagePrediction]:
    k = min(k, probs.numel())
    top_p, top_i = torch.topk(probs, k)
    out = []
    for p, i in zip(top_p.tolist(), top_i.tolist()):
        lab = labels[i] if i < len(labels) else str(i)
        out.append(ImagePrediction(label=lab, probability=round(float(p), 4)))
    return out

# Endpoints
@app.get("/health")
def health():
    return {"status": "ok", "device": str(device)}

@app.post("/predict/image", response_model=ImagePredictResponse)
async def predict_image(file: UploadFile = File(...)):
    # Basic content-type check (not foolproof)
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Content-Type must be image/*")

    raw = await file.read()
    _validate_image_bytes(raw)

    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Invalid image file")

    x = image_tf(image).unsqueeze(0).to(device)

    with torch.inference_mode():
        logits = image_model(x)
        probs = torch.softmax(logits, dim=1)[0]

    topk = _softmax_to_topk(probs, IMAGE_CLASS_LABELS, TOP_K)
    best = topk[0]
    return ImagePredictResponse(top_k=topk, best=best)

@app.post("/predict/text", response_model=TextPredictResponse)
async def predict_text(text: str = Form(...)):
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(status_code=400, detail="Text input required")
    clipped = text.strip()
    if len(clipped) > MAX_TEXT_LEN:
        clipped = clipped[:MAX_TEXT_LEN]

    inputs = tokenizer(
        clipped,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128
    ).to(device)

    with torch.inference_mode():
        logits = text_model(**inputs).logits
        probs = F.softmax(logits, dim=1)[0]
        pred_idx = int(torch.argmax(probs).item())
        pred_prob = float(probs[pred_idx])

    # Guard against label length mismatch
    if pred_idx < len(TEXT_CLASS_LABELS):
        pred_label = TEXT_CLASS_LABELS[pred_idx]
    else:
        pred_label = str(pred_idx)

    return TextPredictResponse(
        prediction=pred_label,
        class_index=pred_idx,
        probability=round(pred_prob, 4),
    )
