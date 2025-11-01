# PlantDocBot (Scaffold)

This archive contains a ready-to-run scaffold for your PlantDocBot project, including:
- backend/ : FastAPI backend with endpoints and recommendations mapping
- frontend/: React + Vite frontend to upload images and send symptom text

## What you MUST add (download these files and place them in backend/models/)
1. `plant_disease_model.pth` — your trained image model weights (place at backend/models/plant_disease_model.pth)
2. `text_classification_model/` folder — your HuggingFace-style text model (place as backend/models/text_classification_model/)

## How to run locally
1. Backend:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate   # Windows: venv\\Scripts\\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```
2. Frontend:
   ```
   cd frontend
   npm install
   npm run start
   ```