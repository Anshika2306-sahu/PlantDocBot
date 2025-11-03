import React from "react";
import { Check, Alert } from "../icons";
import StatBar from "../charts/StatBar";

export default function PredictionResult({ result }) {
  if (!result)
    return (
      <div className="text-gray-600 text-center italic mb-6">
        No prediction yet. Upload image or describe symptoms to begin.
      </div>
    );

  return (
    <section className="bg-white text-gray-700 p-6 rounded-2xl shadow-md mb-6">
      <h2 className="text-lg font-semibold mb-4">Prediction Result</h2>

      <div className="flex justify-between flex-wrap gap-3 items-center mb-4">
        <p className="text-xl font-bold text-green-700">
          {result.class}{" "}
          <span className="text-sm text-gray-500">
            ({(result.confidence ).toFixed(2)}% confidence)
          </span>
        </p>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            result.source === "image" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {result.source.toUpperCase()} MODE
        </span>
      </div>

      {/* {recommendations ? (
        <>
          <h3 className="font-semibold mb-2">Recommendations:</h3>
          <ul className="space-y-2">
            {recommendations.recommendations.map((r, i) => (
              <li
                key={i}
                className={`flex items-center gap-2 p-2 rounded-md ${
                  r.tone === "high"
                    ? "bg-red-100 text-red-800"
                    : r.tone === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                <Check className="w-4 h-4" /> {r.text}
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2">
            <StatBar label="Occurrence" value={recommendations.stats.occurrence} />
            <StatBar label="Severity" value={recommendations.stats.severity * 10} />
            <StatBar label="Recovery" value={recommendations.stats.recovery} />
          </div>
        </>
      ) : (
        <p className="flex items-center gap-2 text-red-500">
          <Alert className="w-5 h-5" /> No recommendations found for this disease.
        </p>
      )} */}
    </section>
  );
}
