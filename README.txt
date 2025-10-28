Plant Disease Diagnosis — Package

Contents:
- backend/main.py  (your FastAPI backend — copied from uploaded files)
- frontend/       (React + Material UI frontend using Axios)

How to run:

1) Backend
--------------
# create a virtualenv & install backend deps (example)
python -m venv venv
source venv/bin/activate   # on Windows: venv\Scripts\activate
pip install -r requirements.txt

# If you don't have a requirements.txt, install at least:
pip install fastapi uvicorn torch torchvision transformers pillow

# Run the backend:
uvicorn main:app --reload --port 8000

2) Frontend
--------------
# inside the frontend folder:
cd frontend

# If you want to use Create React App:
npx create-react-app .   # this will populate react-scripts and setup files

# Then overwrite the generated src/ and public/ with the files in this package (or copy them)
npm install
npm install axios @mui/material @mui/icons-material @emotion/react @emotion/styled

npm start

Notes:
- Backend expected at http://127.0.0.1:8000
- CORS is already enabled in your FastAPI main.py
- If your backend host/port differs, update BACKEND_URL in src/components/*.js

