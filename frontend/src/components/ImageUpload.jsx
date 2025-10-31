import React, { useState } from "react";

export default function ImageUpload({ setPrediction, setConfidence, setRecommendation }) {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const selected = e.target.files[0];
    setImage(URL.createObjectURL(selected));
    setFile(selected);
  };

  const handlePredict = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    let res = await fetch("http://127.0.0.1:8000/predict_image", {
      method: "POST",
      body: formData,
    });

    let data = await res.json();
    setPrediction(data.predicted_class);
    setConfidence(data.confidence);
    setRecommendation(data.recommendation);
    setLoading(false);
  };

  return (
    <div className="card">
      <h3>Upload Leaf Image</h3>

      <input type="file" accept="image/*" onChange={handleFile} />

      {image && (
        <img src={image} alt="preview" className="preview-img" />
      )}

      <button className="btn" disabled={!file || loading} onClick={handlePredict}>
        {loading ? "Predicting..." : "Predict Disease"}
      </button>
    </div>
  );
}
