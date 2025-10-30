import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [imageResponse, setImageResponse] = useState(null);
  const [textResponse, setTextResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    const file = e.target.elements.image.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/image-prediction', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageResponse(res.data);
    } catch (err) {
      setImageResponse({ error: err.message });
    }
    setLoading(false);
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.elements.input.value.trim();
    if (!text) return;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/text-prediction', { input: text });
      setTextResponse(res.data);
    } catch (err) {
      setTextResponse({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="center-bg">
      <div className="app-card">
        <div className="plantdoc-header">
          <span role="img" aria-label="plant" className="logo-emoji">🌿</span>
          <span className="big-heading">PlantDocBot</span>
        </div>

        <section>
          <h2>Image Disease Detection</h2>
          <form onSubmit={handleImageSubmit}>
            <input type="file" name="image" accept="image/*" required />
            <button type="submit" disabled={loading}>Upload & Predict</button>
          </form>
          {imageResponse && (
            <div className={imageResponse.error ? "error-box" : "result-box"}>
              {imageResponse.error ? (
                <div>{imageResponse.error}</div>
              ) : (
                <>
                  <strong>Result:</strong>
                  <ul>
                    <li>Label: {imageResponse.label}</li>
                    <li>Confidence: {imageResponse.confidence}</li>
                    <li>Recommendation: {imageResponse.recommendation}</li>
                  </ul>
                </>
              )}
            </div>
          )}
        </section>

        <section>
          <h2>Text Disease Diagnosis</h2>
          <form onSubmit={handleTextSubmit}>
            <input type="text" name="input" placeholder="Describe the symptoms..." required />
            <button type="submit" disabled={loading}>Diagnose via Text</button>
          </form>
          {textResponse && (
            <div className={textResponse.error ? "error-box" : "result-box"}>
              {textResponse.error ? (
                <div>{textResponse.error}</div>
              ) : (
                <>
                  <strong>Result:</strong>
                  <ul>
                    <li>Label: {textResponse.label}</li>
                    <li>Confidence: {textResponse.confidence}</li>
                    <li>Recommendation: {textResponse.recommendation}</li>
                  </ul>
                </>
              )}
            </div>
          )}
        </section>
        {loading && <div className="loading-text">Loading...</div>}
      </div>
    </div>
  );
}

export default App;
