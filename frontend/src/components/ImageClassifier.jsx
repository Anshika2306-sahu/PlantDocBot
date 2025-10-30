import React, { useState, useRef } from 'react';
import { predictImage } from '../services/api';
import ResultCard from './ResultCard';

const ImageClassifier = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await predictImage(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to predict. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🖼️</span>
          <h2 className="text-2xl font-bold text-gray-800">Image Classification</h2>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-3 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-500 transition-colors duration-300 cursor-pointer bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {preview ? (
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 rounded-lg shadow-md"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg text-xl"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">📤</div>
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  Drop your image here or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports JPG, PNG, JPEG
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">❌ {error}</p>
          </div>
        )}

        <button
          onClick={handlePredict}
          disabled={!selectedFile || loading}
          className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin">⏳</span>
              Analyzing...
            </>
          ) : (
            <>
              <span>🔍</span>
              Detect Disease
            </>
          )}
        </button>
      </div>

      {result && <ResultCard result={result} type="image" />}
    </div>
  );
};

export default ImageClassifier;