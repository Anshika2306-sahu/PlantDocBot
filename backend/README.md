# Backend (FastAPI) for PlantDocBot

## Run
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

## Add your models
- Place `plant_disease_model.pth` at backend/models/
- Place `text_classification_model/` folder at backend/models/