import React from "react";
import { Activity, Alert } from "../icons";

export default function ImageUploadSection({
  imageFile,
  setImageFile,
  handlePredict,
  loading,
  error,
  clearAll,
}) {
  return (
    <section className="bg-white text-gray-700 p-6 rounded-2xl shadow-md mb-6">
      <h2 className="text-lg font-semibold mb-3">Upload a Plant Image</h2>

      <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-green-400 p-6 rounded-xl">
        
        {imageFile ? (
          <img
            src={URL.createObjectURL(imageFile)}
            alt="preview"
            className="w-40 h-40 object-cover rounded-xl border border-gray-300"
          />
        ) : (
          <p className="text-gray-500"></p>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="mt-2"
        />
      </div>

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
