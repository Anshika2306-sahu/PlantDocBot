import React, { useState } from "react";
import TextUpload from "./components/TextUpload";
import ImageUpload from "./components/ImageUpload";
import "./App.css";

export default function App() {
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState("");
  const [recommendation, setRecommendation] = useState("");

  return (
    <div className="app-container">
      <h1 className="title">Plant Disease Detector</h1>

      <div className="upload-section">
        <ImageUpload
          setPrediction={setPrediction}
          setConfidence={setConfidence}
          setRecommendation={setRecommendation}
        />

        <TextUpload
          setPrediction={setPrediction}
          setConfidence={setConfidence}
          setRecommendation={setRecommendation}
        />
      </div>

      <div className="result-box">
        <h2>Prediction Result</h2>
        <p><b>Disease:</b> {prediction}</p>
        <p><b>Confidence:</b> {confidence}%</p>
        <p><b>Recommendation:</b> {recommendation}</p>
      </div>
    </div>
  );
}
