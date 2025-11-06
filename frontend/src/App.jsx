import React, { useState } from "react";
import ImagePredict from "./components/ImagePredict";
import TextPredict from "./components/TextPredict";
import "./styles/app.css";

export default function App() {
  const [mode, setMode] = useState("image");

  return (
    <div className="app">
      <h1>🌿 PlantDocBot</h1>
      <div className="mode-switch">
        <button
          className={mode === "image" ? "active" : ""}
          onClick={() => setMode("image")}
        >
          🖼️ Image Mode
        </button>
        <button
          className={mode === "text" ? "active" : ""}
          onClick={() => setMode("text")}
        >
          📝 Text Mode
        </button>
      </div>
      {mode === "image" ? <ImagePredict /> : <TextPredict />}
    </div>
  );
}
