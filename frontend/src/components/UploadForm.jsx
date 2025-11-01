import React, { useState } from "react";

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPrediction(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
    console.log("📤 Sending image to:", import.meta.env.VITE_API_URL);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/image-prediction`, {
      method: "POST",
      body: formData,
    });

    console.log("📥 Raw Response:", response);

    const text = await response.text();
    console.log("📦 Raw Response Body:", text);

      if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${text}`);
    }

    const data = JSON.parse(text);
    console.log("✅ Parsed JSON:", data);

    setPrediction(data);
    setError(null);
  } catch (err) {
    console.error("❌ Error during fetch:", err);
    setError("Network Error");
  }
};

  return (
    <div className="bg-white p-6 rounded-xl shadow-md text-center">
      <h3 className="text-xl font-semibold text-emerald-800 mb-4">
        Upload a Leaf Image
      </h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />
      <br />
      <button
        onClick={handleSubmit}
        className="bg-emerald-700 text-white py-2 px-6 rounded hover:bg-emerald-800 transition"
      >
        Get Prediction
      </button>

      {prediction && (
        <div className="mt-6 text-lg">
          <p>
            <b>Class:</b> {prediction.class}
          </p>
          <p>
            <b>Confidence:</b> {prediction.confidence.toFixed(2)}%
          </p>
        </div>
      )}

      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
};
