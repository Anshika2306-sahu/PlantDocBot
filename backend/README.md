# Backend - Plant Disease Detection API

FastAPI backend server for the Plant Disease Detection System.

## 🚀 Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python main.py
```

Or use uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📦 Dependencies

See `requirements.txt` for the complete list of dependencies.

Key packages:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `torch` - Deep learning framework
- `transformers` - NLP models
- `pillow` - Image processing
- `scikit-learn` - ML utilities
- `python-multipart` - File upload support

## 🔧 Configuration

The backend automatically loads:
- Image classification model from `models/plant_disease_cnn.pth`
- Text classification model from `disease_detection_model/`
- Disease recommendations from `disease_recommendations.json`
- Class names from `image_class_names.json`

## 📡 API Endpoints

### Health Check
```
GET /health-check
```

### Get All Diseases
```
GET /api/diseases
```

### Get Disease Recommendations
```
GET /api/recommendations/{disease_name}
```

### Image Prediction
```
POST /api/image-prediction
Content-Type: multipart/form-data

Body: file (image file)
```

### Text Prediction
```
POST /api/text-prediction
Content-Type: application/json

Body: {
  "input": "description of symptoms"
}
```

## 📁 File Structure

```
backend/
├── main.py                      # FastAPI application
├── requirements.txt             # Python dependencies
├── disease_recommendations.json # Treatment recommendations
├── image_class_names.json       # Image classification labels
├── text_label_encoder.joblib    # Text encoder
├── models/
│   ├── PlantDiseaseModel.py     # CNN architecture
│   └── plant_disease_cnn.pth    # Trained weights
└── disease_detection_model/     # Text model directory
```

## 🛠️ Development

### Add New Disease Recommendations

Edit `disease_recommendations.json` following the existing format:

```json
{
  "Disease_Name": {
    "disease_name": "Display Name",
    "description": "Disease description",
    "symptoms": ["symptom1", "symptom2"],
    "treatment": ["treatment1", "treatment2"],
    "prevention": ["prevention1", "prevention2"],
    "organic_solutions": ["solution1", "solution2"]
  }
}
```

### CORS Configuration

CORS is enabled for all origins by default. For production, modify the CORS settings in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🔍 Debugging

Enable debug logging:
```bash
uvicorn main:app --reload --log-level debug
```

## 📊 Model Information

- **Image Model**: Custom CNN with 38 output classes
- **Text Model**: BERT-based transformer
- **Input Size**: 224x224 pixels for images
- **Normalization**: Mean=[0.4759, 0.5003, 0.4266], Std=[0.2102, 0.1888, 0.2262]

## 🚀 Deployment

### Production Server

Use gunicorn with uvicorn workers:
```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker (Optional)

Create a `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

Build and run:
```bash
docker build -t plant-disease-api .
docker run -p 8000:8000 plant-disease-api
```

## ⚠️ Notes

- Models are loaded on application startup
- First request may be slow due to model initialization
- Ensure all model files are present before starting the server
- Use GPU for faster inference (if available)

---

**Backend API - Plant Disease Detection System**
