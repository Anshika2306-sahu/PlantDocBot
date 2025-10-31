# Plant Disease Detection System

An AI-powered web application for detecting plant diseases using image recognition and text-based symptom analysis. This system provides comprehensive treatment recommendations for detected diseases.

## 🌟 Features

- **Image-Based Detection**: Upload plant images to identify diseases using a custom CNN model
- **Text-Based Analysis**: Describe symptoms to get disease predictions using transformer models
- **Treatment Recommendations**: Get detailed treatment plans, prevention methods, and organic solutions
- **History Tracking**: View prediction history with statistics
- **Data Export**: Export your prediction history as JSON
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode**: Toggle between light and dark themes

## 📁 Project Structure

```
plant-disease-detection/
├── backend/
│   ├── main.py                      # FastAPI backend server
│   ├── requirements.txt             # Python dependencies
│   ├── disease_recommendations.json # Disease treatment database
│   ├── image_class_names.json       # Image classification labels
│   ├── text_label_encoder.joblib    # Text classification encoder
│   ├── models/
│   │   ├── PlantDiseaseModel.py     # CNN model architecture
│   │   └── plant_disease_cnn.pth    # Trained model weights
│   └── disease_detection_model/     # Text classification model
├── frontend/
│   ├── index.html                   # Main HTML file
│   ├── css/
│   │   └── style.css               # Application styles
│   └── js/
│       └── app.js                   # Frontend logic
└── README.md
```

## 🚀 Quick Start - One Command!

### Easy Start (Recommended)

**Just double-click or run:**

**PowerShell:**
```powershell
.\start.ps1
```

**Command Prompt:**
```cmd
start.bat
```

This automatically:
- ✅ Activates virtual environment
- ✅ Starts the backend server
- ✅ Opens your browser to the app

### Manual Installation & Setup

If running for the first time, install dependencies:

1. Create a virtual environment (recommended):
```bash
python -m venv .venv
```

2. Activate it:
```bash
# On Windows PowerShell
.\.venv\Scripts\Activate.ps1

# On Windows Command Prompt
.venv\Scripts\activate.bat

# On macOS/Linux
source .venv/bin/activate
```

3. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Run the application:
```bash
# From project root
.\start.ps1

# Or manually
cd backend
python main.py
```

The server will start at `http://localhost:8000`

📖 **For detailed startup instructions, see [README_STARTUP.md](README_STARTUP.md)**

## 🎯 Usage

1. Open your web browser and navigate to `http://localhost:8000`

2. **Image Detection**:
   - Click "Upload Plant Image"
   - Select an image of the affected plant
   - Click "Analyze Image"
   - View results and treatment recommendations

3. **Text Detection**:
   - Describe the plant symptoms in the text area
   - Click "Analyze Symptoms"
   - View predicted disease and recommendations

## 🔧 API Endpoints

### Main Endpoints

- `GET /` - Serve the web application
- `GET /health-check` - Check API health status
- `GET /api/diseases` - Get list of all detectable diseases
- `GET /api/recommendations/{disease_name}` - Get recommendations for a specific disease
- `POST /api/image-prediction` - Analyze plant image
- `POST /api/text-prediction` - Analyze symptom description

### API Documentation

- Interactive API docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## 🌱 Supported Plants & Diseases

The system can detect 38 different plant conditions across multiple crops:

- **Apple**: Apple Scab, Black Rot, Cedar Apple Rust, Healthy
- **Blueberry**: Healthy
- **Cherry**: Powdery Mildew, Healthy
- **Corn**: Gray Leaf Spot, Common Rust, Northern Leaf Blight, Healthy
- **Grape**: Black Rot, Esca, Leaf Blight, Healthy
- **Orange**: Citrus Greening
- **Peach**: Bacterial Spot, Healthy
- **Pepper**: Bacterial Spot, Healthy
- **Potato**: Early Blight, Late Blight, Healthy
- **Raspberry**: Healthy
- **Soybean**: Healthy
- **Squash**: Powdery Mildew
- **Strawberry**: Leaf Scorch, Healthy
- **Tomato**: Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Yellow Leaf Curl Virus, Mosaic Virus, Healthy

## 💡 Treatment Recommendations

For each detected disease, the system provides:

- **Disease Description**: Detailed information about the disease
- **Symptoms**: Common signs to watch for
- **Treatment**: Step-by-step treatment protocols
- **Prevention**: Preventive measures to avoid future infections
- **Organic Solutions**: Environmentally friendly treatment options

## 🛠️ Technology Stack

### Backend
- FastAPI (Python web framework)
- PyTorch (Deep learning)
- Transformers (NLP models)
- Pillow (Image processing)
- scikit-learn (Machine learning utilities)

### Frontend
- HTML5
- CSS3 (Modern responsive design)
- Vanilla JavaScript
- LocalStorage (Client-side data persistence)

### Models
- Custom CNN for image classification
- BERT-based transformer for text classification

## 📊 Model Information

- **Image Model**: Custom Convolutional Neural Network
- **Text Model**: Fine-tuned transformer model
- **Training Dataset**: New Plant Diseases Dataset (Augmented)
- **Number of Classes**: 38 plant disease categories

## 🔒 Security & Privacy

- All predictions are processed locally
- No data is sent to external servers
- History is stored in browser's LocalStorage
- Can be deployed on-premises for complete data privacy

## 🤝 Contributing

This project was developed by Vanshika. For suggestions or improvements, please contact the developer.

## 📝 License

All Rights Reserved © 2025 Vanshika

## ⚠️ Disclaimer

This system is designed for educational and research purposes. For critical agricultural decisions, please consult with certified plant pathologists or agricultural extension services.

## 📞 Support

For issues, questions, or feedback, please refer to the application's About section or contact the development team.

## 🎓 Version History

- **v2.0.0** (October 2025) - Added comprehensive treatment recommendations system
- **v1.0.0** (Initial Release) - Basic disease detection functionality

## 🙏 Acknowledgments

- Plant disease dataset providers
- Open-source community
- Agricultural research institutions

---

**Developed with ❤️ by Vanshika**
