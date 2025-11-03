import React from "react";
import { Activity, Alert } from "../icons";

export default function TextAnalysisSection({
  textInput,
  setTextInput,
  handlePredict,
  loading,
  error,
  clearAll,
}) {
  return (
    <section className="bg-white text-gray-700 p-6 rounded-2xl shadow-md mb-6">
      <h2 className="text-lg font-semibold mb-3">Describe Symptoms</h2>

      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="Example: Yellow spots on leaves, brown edges..."
        rows={4}
        className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {error && (
        <p className="mt-3 text-red-500 flex items-center gap-1">
          <Alert className="w-5 h-5" /> {error}
        </p>
      )}

      <div className="flex gap-3 mt-4">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? (
            <>
              <Activity className="w-4 h-4 animate-spin" /> Predicting...
            </>
          ) : (
            "Predict"
          )}
        </button>

        <button
          onClick={clearAll}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl"
        >
          Clear
        </button>
      </div>
    </section>
  );
}
