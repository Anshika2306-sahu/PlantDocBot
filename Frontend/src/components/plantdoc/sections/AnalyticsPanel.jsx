import React from "react";
import MiniBarChart from "../charts/MiniBarChart";
import DonutChart from "../charts/DonutChart";

export default function AnalyticsPanel({ history = [] }) {
  // 🧠 Handle empty or invalid history
  if (!Array.isArray(history) || history.length === 0) {
    return (
      <section className="bg-white text-gray-700 p-6 rounded-2xl shadow-md mb-6 text-center">
        <h2 className="text-xl font-semibold mb-3">Analytics Overview</h2>
        <p className="text-gray-500 italic">No predictions made yet.</p>
      </section>
    );
  }

  // 📊 Calculate Image/Text usage
  const imageCount = history.filter((h) => h.source === "image").length;
  const textCount = history.filter((h) => h.source === "text").length;

  const byType = [
    { label: "Image", value: imageCount },
    { label: "Text", value: textCount },
  ];

  // 🌿 Calculate top predicted diseases
  const diseaseCount = history.reduce((acc, h) => {
    const key = h.class || h.label || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topDiseases = Object.entries(diseaseCount)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <section className="bg-white text-gray-800 p-8 rounded-2xl shadow-lg mb-6 transition-transform duration-300 hover:scale-[1.01]">
      <h2 className="text-2xl font-semibold mb-6 text-green-700 text-center">📈 Analytics Overview</h2>

      <div className="flex flex-wrap gap-10 justify-around items-start">
        {/* Donut Chart */}
        <div className="bg-green-50 p-5 rounded-xl shadow-sm w-64 flex flex-col items-center">
          <h4 className="font-medium mb-3 text-green-800">Mode Usage</h4>
          <DonutChart data={byType} />
          <div className="text-sm text-gray-600 mt-3 space-y-1 text-center">
            <p>🖼️ Image Predictions: <span className="font-semibold">{imageCount}</span></p>
            <p>💬 Text Predictions: <span className="font-semibold">{textCount}</span></p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-blue-50 p-5 rounded-xl shadow-sm w-80 flex flex-col items-center">
          <h4 className="font-medium mb-3 text-blue-800">Top Predicted Diseases</h4>
          <MiniBarChart data={topDiseases.length ? topDiseases : [{ label: "No Data", value: 1 }]} />
          <ul className="mt-3 text-sm text-gray-600 text-center space-y-1">
            {topDiseases.length ? (
              topDiseases.map((d, i) => (
                <li key={i}>
                  🌿 <span className="font-semibold">{d.label}</span> — {d.value} times
                </li>
              ))
            ) : (
              <li>No disease predictions yet.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
