import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaCloudUploadAlt } from "react-icons/fa";

const RAW_BACKEND = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
const BACKEND = RAW_BACKEND.replace(/\/+$/, ""); // remove trailing slash if any

export default function UploadPanel() {
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bars, setBars] = useState([]);       // optional: from /predict/image
  const [best, setBest] = useState(null);     // { label, probability }
  const [rec, setRec] = useState("");         // backend recommendation text

  const openPicker = () => inputRef.current?.click();

  const percent = (p) => {
    const n = Number.isFinite(p) ? p : 0;
    const clamped = Math.max(0, Math.min(1, n));
    return Math.round(clamped * 100);
  };

  const validateAndPick = (file) => {
    if (!file) return;

    const ok = new Set([
      "image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif", "image/tiff"
    ]);
    if (!ok.has(file.type)) {
      setError("Please choose a JPG, PNG, WebP, BMP, GIF or TIFF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Max size is 5MB.");
      return;
    }

    setError("");

    // Revoke old preview URL if any
    if (preview) URL.revokeObjectURL(preview);

    setFilename(file.name);
    const url = URL.createObjectURL(file);
    setPreview(url);

    analyze(file);
  };

  const analyze = async (file) => {
    // cancel any in-flight request before starting a new one
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setBest(null);
    setBars([]);
    setRec("");
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);

      // 1) Best + recommendation
      const { data } = await axios.post(`${BACKEND}/image-prediction`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: controller.signal,
        timeout: 20000,
      });
      // expected: { filename, label, confidence, recommendation }
      setBest({ label: data?.label ?? "Unknown", probability: data?.confidence ?? 0 });
      setRec(typeof data?.recommendation === "string" ? data.recommendation : "");

      // 2) Optional top-k bars
      try {
        const barsRes = await axios.post(`${BACKEND}/predict/image`, form, {
          headers: { "Content-Type": "multipart/form-data" },
          signal: controller.signal,
          timeout: 20000,
        });
        const topk = Array.isArray(barsRes.data?.top_k) ? barsRes.data.top_k : [];
        setBars(topk.slice(0, 5)); // cap to 5 just in case
      } catch (e) {
        // ignore bars failure
        if (!axios.isCancel(e)) console.debug("Top-k fetch skipped:", e?.message || e);
      }

    } catch (e) {
      if (axios.isCancel(e)) {
        // user picked another file or component unmounted
        return;
      }
      console.error(e);
      alert("Image analysis failed.");
      const detail =
        e?.response?.data?.detail ||
        e?.message ||
        "Upload failed.";
      setError(String(detail));
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFilename("");
    setBest(null);
    setBars([]);
    setRec("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    validateAndPick(f);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="upload-panel">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => validateAndPick(e.target.files?.[0])}
      />

      {!preview ? (
        <div
          className="dropzone"
          onClick={openPicker}
          onDragOver={onDragOver}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          aria-label="Upload a plant leaf image"
          onKeyDown={(e) => ["Enter", " "].includes(e.key) && openPicker()}
        >
          <FaCloudUploadAlt className="icon" />
          <p>
            <strong>Upload a plant leaf image</strong>
            <br />
            <small>Click to select or drag and drop (JPG, PNG, max 5MB)</small>
          </p>
        </div>
      ) : (
        <>
          <div className="preview-wrap">
            <img src={preview} alt="preview" className="preview" />
            <button className="btn-remove" onClick={clearImage} title="Remove image" aria-label="Remove image">
              ✖
            </button>
          </div>

          <div className="row mt-2">
            <span className="filename">{filename}</span>
            <button className="btn" onClick={openPicker} disabled={loading}>
              {loading ? "Analyzing..." : "Choose another"}
            </button>
          </div>
        </>
      )}

      {loading && (
        <div className="center-loading">
          <div className="center-spinner" />
          <p>Analyzing image...</p>
        </div>
      )}
      {error && <p className="status error">{error}</p>}

      {/* Best card */}
      {best && (
        <div className="best-card">
          <div className="best-icon">✔</div>
          <div className="best-text">
            <div className="best-title">{best.label}</div>
            <div className="best-sub">Confidence: {percent(best.probability)}%</div>
          </div>
        </div>
      )}

      {/* Analysis bars (optional) */}
      {bars?.length > 0 && (
        <div className="result-card">
          <h4 className="mt-2">Analysis Results</h4>
          <ul className="bars">
            {bars.map((x, i) => {
              const p = percent(x?.probability);
              return (
                <li key={`${x?.label ?? "lbl"}-${i}`}>
                  <div className="bar-label">{x?.label ?? "Unknown"}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${p}%` }} />
                  </div>
                  <div className="bar-val">{p}%</div>
                </li>
              );
            })}
          </ul>
          <small className="note">
            These are AI predictions. For critical decisions, consult agricultural experts.
          </small>
        </div>
      )}

      {/* Recommendation block from backend */}
      {rec && (
        <div className="rec-card">
          <div className="rec-title">Recommendation</div>
          <div className="rec-body">{rec}</div>
        </div>
      )}
    </div>
  );
}
