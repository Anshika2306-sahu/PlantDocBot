import React, { useState } from "react";
import axios from "axios";

export default function ImagePredict() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select an image!");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/predict/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      alert("Error predicting image.");
    }
    setLoading(false);
  };

  return (
    <div className="predict-card">
      <h2>🌱 Upload Leaf Image</h2>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Predicting..." : "Predict"}
      </button>
      {result && (
        <div className="result-box">
          <p><strong>Prediction:</strong> {result.prediction}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
}
