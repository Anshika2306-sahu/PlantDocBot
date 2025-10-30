// src/components/RecommendationCard.jsx
import React from "react";
import "./recommendation.css";

const severityBadge = (sev) => {
  switch ((sev || "").toLowerCase()) {
    case "low":
      return <span className="rec-badge rec-low">Low</span>;
    case "medium":
      return <span className="rec-badge rec-medium">Medium</span>;
    case "high":
      return <span className="rec-badge rec-high">High</span>;
    default:
      return null;
  }
};

export default function RecommendationCard({ label, probability, rec }) {
  if (!rec) return null;

  return (
    <div className="rec-card">
      <div className="rec-head">
        <div className="rec-title">
          <span className="rec-title-text">RECOMMENDATION</span>
          {severityBadge(rec.severity)}
        </div>
        <div className="rec-sub">
          {/* Optional: show what it’s based on */}
          Based on: <strong>{label || "prediction"}</strong>
          {Number.isFinite(probability) && (
            <> · Confidence: <strong>{Math.round(probability * 100)}%</strong></>
          )}
        </div>
      </div>

      <ul className="rec-list">
        {(rec.advice || []).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
