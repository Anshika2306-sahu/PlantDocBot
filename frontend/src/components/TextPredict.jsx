import React, { useState } from "react";
import axios from "axios";

export default function TextPredict() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!description.trim()) return alert("Please enter a description!");

    const formData = new FormData();
    formData.append("description", description);

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/predict/text", formData);
      setResult(res.data);
    } catch (err) {
      alert("Error predicting text.");
    }
    setLoading(false);
  };

  return (
    <div className="predict-card">
      <h2>🧾 Describe Plant Symptoms</h2>
      <textarea
        rows="4"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g. yellow spots on tomato leaves..."
      />
      <button onClick={handlePredict} disabled={loading}>
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
