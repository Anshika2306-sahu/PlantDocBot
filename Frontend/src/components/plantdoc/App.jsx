// src/components/plantdoc/App.jsx
import React, { useState, useEffect } from "react";
import Header from "./sections/Header";
import ImageUploadSection from "./sections/ImageUploadSection";
import TextAnalysisSection from "./sections/TextAnalysisSection";
import PredictionResult from "./sections/PredictionResult";
import AnalyticsPanel from "./sections/AnalyticsPanel";
import HistoryPanel from "./sections/HistoryPanel";
import { IMAGE_ENDPOINT, TEXT_ENDPOINT } from "./api/config";
import { diseaseDatabase } from "./data/diseaseDatabase";
import sanitizeKey from "./utils/sanitizeKey";

export default function PlantDocApp() {
  const [mode, setMode] = useState("image");
  const [imageFile, setImageFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);

  // Load and store history in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("plantdoc_history_v2");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("plantdoc_history_v2", JSON.stringify(history.slice(0, 50)));
  }, [history]);

  // 🌱 Image Prediction
  const handleImagePredict = async () => {
    if (!imageFile) return setError("Please select an image first");
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image_file", imageFile);

      const res = await fetch(IMAGE_ENDPOINT, { method: "POST", body: fd });
      const data = await res.json();

      const item = {
        source: "image",
        class: data.class || "Unknown",
        confidence: Number(data.confidence || 0),
        diseaseKey: data.diseaseKey || sanitizeKey(data.class || "unknown"),
        time: new Date().toISOString(),
        raw: data,
      };
      setPrediction(item);
      setHistory((prev) => [item, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Prediction failed. Ensure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  };

  // 🌿 Text Prediction
  const handleTextPredict = async () => {
    if (!textInput.trim()) return setError("Please describe the symptoms");
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("symptoms", textInput);

      const res = await fetch(TEXT_ENDPOINT, { method: "POST", body: fd });
      const data = await res.json();

      const item = {
        source: "text",
        class: data.class || "Unknown",
        confidence: Number(data.confidence || 0),
        diseaseKey: data.diseaseKey || sanitizeKey(data.class || "unknown"),
        time: new Date().toISOString(),
        raw: data,
      };
      setPrediction(item);
      setHistory((prev) => [item, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Text prediction failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  // 🌾 Reset all states
  const clearAll = () => {
    setImageFile(null);
    setTextInput("");
    setPrediction(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-200 via-gray-200 to-purple-200 p-6 text-gray-800">
      <Header mode={mode} setMode={setMode} />

      {mode === "image" && (
        <ImageUploadSection
          imageFile={imageFile}
          setImageFile={setImageFile}
          handlePredict={handleImagePredict}
          loading={loading}
          error={error}
          clearAll={clearAll}
        />
      )}

      {mode === "text" && (
        <TextAnalysisSection
          textInput={textInput}
          setTextInput={setTextInput}
          handlePredict={handleTextPredict}
          loading={loading}
          error={error}
          clearAll={clearAll}
        />
      )}

      <PredictionResult
        result={prediction}
        recommendations={diseaseDatabase[prediction?.diseaseKey]}
      />

      <AnalyticsPanel history={history} />
      <HistoryPanel history={history} setHistory={setHistory} />
    </div>
  );
}

