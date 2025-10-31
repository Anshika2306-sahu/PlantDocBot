import React, { useState } from "react";

export default function TextUpload({ setPrediction, setConfidence, setRecommendation }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!text) return;
    setLoading(true);

    let res = await fetch("http://127.0.0.1:8000/predict_text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    let data = await res.json();
    setPrediction(data.predicted_class);
    setConfidence(data.confidence);
    setRecommendation(data.recommendation);
    setLoading(false);
  };

  return (
    <div className="card">
      <h3>Enter Leaf Symptoms</h3>

      <textarea
        className="textarea"
        rows="6"
        placeholder="Describe plant symptoms..."
        onChange={(e) => setText(e.target.value)}
      />

      <button className="btn" disabled={!text || loading} onClick={handlePredict}>
        {loading ? "Predicting..." : "Predict Disease"}
      </button>
    </div>
  );
}
