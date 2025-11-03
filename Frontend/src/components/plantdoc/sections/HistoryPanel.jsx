import React from "react";

export default function HistoryPanel({ history, setHistory }) {
  if (!history.length) return null;

  const clearHistory = () => {
    if (window.confirm("Clear all prediction history?")) setHistory([]);
  };

  return (
    <section className="bg-white text-gray-700 p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Prediction History</h2>
        <button
          className="text-sm text-red-600 hover:underline"
          onClick={clearHistory}
        >
          Clear History
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto divide-y divide-gray-200">
        {history.map((item, i) => (
          <div key={i} className="py-2 text-sm flex justify-between">
            <span>
              {item.class} ({(item.confidence ).toFixed(2)}%)
            </span>
            <span className="text-gray-500">
              {new Date(item.time).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
