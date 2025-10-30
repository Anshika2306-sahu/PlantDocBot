import React from "react";

function Progress({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="bar">
      <div className="bar-fill" style={{ width: `${pct}%` }} />
      <span className="bar-label">{pct}%</span>
    </div>
  );
}

export default function ResultCard({
  fileName,
  imageUrl,
  result,       // { best: {label, probability}, top_k: [{label, probability}] }
  loading = false,
  onReset,
  onChoose,
}) {
  const toPct = (p) => Math.round((p || 0) * 100);

  return (
    <div className="result-wrap">
      <div className="preview-wrap">
        {imageUrl && <img className="preview-img" src={imageUrl} alt="uploaded" />}
        <button className="close-x" onClick={onReset} title="Remove">✖</button>
      </div>

      <div className="top-row">
        {fileName && <div className="file-pill" title={fileName}>{fileName}</div>}
        <button className="btn choose" onClick={onChoose}>Choose another</button>
      </div>

      <div className="best-card">
        <div className="best-icon">✔</div>
        <div>
          <div className="best-title">
            {loading ? "Analyzing…" : (result?.best?.label || "—")}
          </div>
          <div className="best-sub">
            Confidence: {loading ? "…" : `${toPct(result?.best?.probability || 0)}%`}
          </div>
        </div>
      </div>

      {!!(result?.top_k && result.top_k.length) && (
        <div className="analysis-card">
          <div className="analysis-header">
            <span className="spark">📈</span>
            <h3>Analysis Results</h3>
          </div>

         {result.top_k.map((item, i) => {
  const pct = toPct(item.probability);
  return (
    <div className="row-line" key={i}>
      <div className="row-head">
        <div className="row-label">{item.label}</div>
        <div className="row-pct">{pct}%</div>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
})}


          <p className="note">
          </p>
        </div>
      )}
    </div>
  );
}
