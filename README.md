# Plant Disease Classification API

This project provides REST APIs for image and text-based plant disease classification using FastAPI.

## Project Structure

```
.
├── backend-api/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── image_classification_model.pth  # Image classification model
│   ├── text_classification_model/      # Text classification model files
│   │   ├── config.json
│   │   ├── tokenizer.json
│   │   └── model.bin
│   └── models/
│       ├── __init__.py
│       └── ImageClassificationModel.py
├── infosys1.ipynb              # Image classification training notebook
├── infosys_2.ipynb             # Text classification training notebook
└── .gitignore                  # Git ignore file
```

## API Endpoints

### Health Check
- `GET /health` - Check if the API is running and models are loaded

### Image Classification
- `POST /predict/image` - Predict plant disease from an image file

### Text Classification
- `POST /predict/text` - Predict plant disease from text description

## Installation

1. Create a virtual environment:
   ```bash
   python -m venv myenv
   ```

2. Activate the virtual environment:
   ```bash
   # On Windows
   myenv\Scripts\activate
   
   # On macOS/Linux
   source myenv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r backend-api/requirements.txt
   ```

## Running the API

```bash
cd backend-api
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Interactive API documentation: `http://localhost:8000/docs`
- Alternative API documentation: `http://localhost:8000/redoc`

## Model Files

- `image_classification_model.pth` - Pre-trained image classification model
- `text_classification_model/` - Directory containing text classification model files

## Notebooks

- `infosys1.ipynb` - Jupyter notebook for training image classification model
- `infosys_2.ipynb` - Jupyter notebook for training text classification model