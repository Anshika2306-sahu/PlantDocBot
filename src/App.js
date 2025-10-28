import React, { useState } from "react";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [textResult, setTextResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Backend base URL
  const API_URL = "http://127.0.0.1:8000";

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedFile) {
      alert("Please upload an image first!");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/predict/image`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setImageResult(data);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error while predicting image");
    } finally {
      setLoading(false);
    }
  };

  // Handle text prediction
  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      alert("Please enter some text describing symptoms!");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("text", textInput);

    try {
      const response = await fetch(`${API_URL}/predict/text`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setTextResult(data);
    } catch (error) {
      console.error("Error predicting text:", error);
      alert("Error while predicting text");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>🌿 PlantDocBot</h1>
      <h2>AI Plant Disease Diagnosis via Image or Text</h2>

      <div className="section">
        <h3>🖼️ Image-based Diagnosis</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button onClick={handleImageUpload} disabled={loading}>
          {loading ? "Predicting..." : "Predict from Image"}
        </button>

        {imageResult && (
          <div className="result">
            <h4>Result:</h4>
            <p><strong>Disease:</strong> {imageResult.disease}</p>
            <p><strong>Confidence:</strong> {(imageResult.confidence * 100).toFixed(2)}%</p>
            {imageResult.recommendation && (
              <p><strong>Recommendation:</strong> {imageResult.recommendation}</p>
            )}
          </div>
        )}
      </div>

      <hr />

      <div className="section">
        <h3>💬 Text-based Diagnosis</h3>
        <textarea
          rows="4"
          placeholder="Describe the plant symptoms here..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        ></textarea>
        <br />
        <button onClick={handleTextSubmit} disabled={loading}>
          {loading ? "Predicting..." : "Predict from Text"}
        </button>

        {textResult && (
          <div className="result">
            <h4>Result:</h4>
            <p><strong>Disease:</strong> {textResult.disease}</p>
            <p><strong>Confidence:</strong> {(textResult.confidence * 100).toFixed(2)}%</p>
            {textResult.recommendation && (
              <p><strong>Recommendation:</strong> {textResult.recommendation}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
