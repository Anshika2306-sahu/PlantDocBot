import streamlit as st
import requests
from PIL import Image

# =========================
# CONFIGURATION
# =========================
API_URL = "http://127.0.0.1:8000"  # FastAPI backend URL

st.set_page_config(
    page_title="Plant Doc Bot",
    layout="wide",
    page_icon="🌱"
)

# =========================
# STYLES
# =========================
st.markdown("""
    <style>
    body {
        background-color: #f8f9fa;
    }
    .main-title {
        text-align: center;
        font-size: 40px;
        font-weight: 800;
        color: #2e7d32;
        margin-bottom: 10px;
    }
    .section-title {
        color: #1b5e20;
        font-size: 26px;
        margin-top: 30px;
    }
    .result-box {
        background-color: #e8f5e9;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #81c784;
        color: #1b5e20;
        font-size: 18px;
    }
    .error-box {
        background-color: #ffebee;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #e57373;
        color: #b71c1c;
        font-size: 18px;
    }
    .info-box {
        background-color: #e3f2fd;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #64b5f6;
        color: #0d47a1;
        font-size: 18px;
    }
    </style>
""", unsafe_allow_html=True)

# =========================
# APP TITLE
# =========================
st.markdown('<div class="main-title">🌿 Plant Doc Bot</div>', unsafe_allow_html=True)
st.write("AI Plant Disease Diagnosis via Chat and Image Upload. 👇")

# =========================
# TEXT PREDICTION
# =========================
st.markdown('<div class="section-title">📝 Text Prediction</div>', unsafe_allow_html=True)
text_input = st.text_area("Enter plant symptoms:", placeholder="E.g. Tomato leaf has yellow spots and curling edges")

if st.button("🔍 Predict from Text"):
    if not text_input.strip():
        st.warning("⚠️ Please enter some text before predicting.")
    else:
        try:
            res = requests.post(f"{API_URL}/text-prediction", json={"input": text_input})
            data = res.json()

            if "error" in data:
                st.markdown(f"<div class='error-box'>❌ {data['error']}</div>", unsafe_allow_html=True)
            else:
                st.markdown(f"<div class='result-box'>🧩 <b>Disease:</b> {data.get('predicted_label', 'N/A')}</div>", unsafe_allow_html=True)
                st.markdown(f"<div class='info-box'>📊 <b>Confidence:</b> {data.get('confidence', 0):.2f}</div>", unsafe_allow_html=True)
                st.markdown(f"<div class='result-box'>💡 <b>Recommendation:</b> {data.get('recommendation', 'No specific recommendation.')}</div>", unsafe_allow_html=True)
        except Exception as e:
            st.error(f"❌ Failed to connect to API: {e}")

# =========================
# IMAGE PREDICTION
# =========================
st.markdown('<div class="section-title">📷 Image Prediction</div>', unsafe_allow_html=True)
uploaded_file = st.file_uploader("Upload a plant leaf image", type=["jpg", "jpeg", "png"])

if uploaded_file:
    image = Image.open(uploaded_file)
    col1, col2 = st.columns(2)

    with col1:
        st.image(image, caption="📸 Uploaded Image", use_container_width=True)

    with col2:
        if st.button("🔍 Predict from Image"):
            try:
                files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
                res = requests.post(f"{API_URL}/image-prediction", files=files)
                data = res.json()

                if "error" in data:
                    st.markdown(f"<div class='error-box'>❌ {data['error']}</div>", unsafe_allow_html=True)
                else:
                    st.markdown(f"<div class='result-box'>🧩 <b>Disease:</b> {data.get('predicted_label', 'N/A')}</div>", unsafe_allow_html=True)
                    st.markdown(f"<div class='info-box'>📊 <b>Confidence:</b> {data.get('confidence', 0):.2f}</div>", unsafe_allow_html=True)
                    st.markdown(f"<div class='result-box'>💡 <b>Recommendation:</b> {data.get('recommendation', 'No specific recommendation.')}</div>", unsafe_allow_html=True)

            except Exception as e:
                st.error(f"❌ Prediction failed: {e}")

# to run:- streamlit run app.py