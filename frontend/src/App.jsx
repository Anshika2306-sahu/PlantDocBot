import React, { useState } from "react";
import ImageDiagnosis from "./components/ImageDiagnosis.jsx";
import TextDiagnosis from "./components/TextDiagnosis.jsx";

export default function App() {
  const [tab, setTab] = useState("image");

  return (
    <div className="app">
      <h1 className="title">PlantDocBot</h1>
      <p className="subtitle">
      </p>

      <div className="card">
        <div className="tabs">
          <button
            className={tab === "image" ? "active" : ""}
            onClick={() => setTab("image")}
          >
            Image Upload
          </button>
          <button
            className={tab === "chat" ? "active" : ""}
            onClick={() => setTab("chat")}
          >
            Symptom Chat
          </button>
        </div>

        <div className="panel">
          {tab === "image" ? <ImageDiagnosis /> : <TextDiagnosis />}
        </div>
      </div>

      <p className="footer">
      </p>
    </div>
  );
}
