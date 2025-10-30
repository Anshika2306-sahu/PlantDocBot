import React, { useRef, useState, useCallback } from "react";
import axios from "axios";
import ResultCard from "./ResultCard.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function ImageDiagnosis() {
  const inputRef = useRef(null); // always-mounted hidden input
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const chooseFile = () => inputRef.current?.click();

  const handleFiles = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    await analyze(file);
  };

  const onInputChange = (e) => handleFiles(e.target.files?.[0]);

  // drag & drop support
  const prevent = (e) => e.preventDefault();
  const onDrop = useCallback(async (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    await handleFiles(f);
  }, []);

  async function analyze(file) {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post(`${BACKEND}/predict/image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Image analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  const resetAll = () => {
    setPreviewUrl(null);
    setFileName("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="upload-panel">
      {/* Hidden input always mounted */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onInputChange}
      />

      {!previewUrl ? (
        <div
          className="dropzone"
          onClick={chooseFile}
          onDragOver={prevent}
          onDragEnter={prevent}
          onDragLeave={prevent}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
        >
          <div className="upload-icon">⬆</div>
          <p className="dz-title">
            <strong>Upload a plant leaf image</strong>
          </p>
          <p className="dz-sub">
            Click to select or drag and drop (JPG, PNG, max 5 MB)
          </p>
        </div>
      ) : (
        <ResultCard
          fileName={fileName}
          imageUrl={previewUrl}
          result={result}
          loading={loading}
          onReset={resetAll}
          onChoose={chooseFile} // ✅ fixed syntax
        />
      )}
    </div>
  );
}
