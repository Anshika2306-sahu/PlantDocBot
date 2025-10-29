import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Camera, Zap, MessageSquare, Loader2, Leaf, AlertTriangle, CheckCircle } from 'lucide-react';
import './index.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

const initialPrediction = {
  label: null,
  confidence: null,
  recommendation: null,
  type: null,
  error: null,
};

// Tailwind Config
const TailwindConfigScript = () => {
  const configScript = `
    tailwind.config = {
      corePlugins: { preflight: false },
      theme: {
        extend: {
          colors: {
            'plant-green': '#38a169',
            'plant-dark': '#2f855a',
            'leaf-green': '#68d391',
            'blue-accent': '#3182ce',
          },
          animation: {
            'bounce-slow': 'bounce 2s infinite',
            'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          },
        },
      },
    }
  `;
  return <script dangerouslySetInnerHTML={{ __html: configScript }} />;
};

// Error Message
const ErrorMessage = ({ message, type }) => (
  <div
    className={`p-4 rounded-xl border-l-4 ${
      type === 'image'
        ? 'bg-red-50 border-red-500 text-red-700'
        : 'bg-yellow-50 border-yellow-500 text-yellow-700'
    } w-full max-w-2xl text-center shadow-lg transition duration-300 ease-in-out`}
  >
    <AlertTriangle className="w-6 h-6 inline mr-2" />
    <span className="font-semibold">
      {type === 'image' ? 'Image Analysis Error: ' : 'Symptom Analysis Error: '}
    </span>
    {message}
  </div>
);

// Result Card
const ResultCard = ({ result }) => (
  <div className="bg-white p-6 rounded-2xl shadow-2xl border-t-4 border-plant-green w-full max-w-2xl transition-all duration-500 ease-in-out transform hover:scale-[1.01]">
    <div className="flex items-center mb-4 border-b pb-3">
      <CheckCircle className="w-8 h-8 text-plant-green mr-3 animate-pulse-slow" />
      <h3 className="text-2xl font-extrabold text-gray-800">Diagnosis Confirmed</h3>
    </div>

    <div className="space-y-4">
      <div className="p-3 bg-leaf-green/20 rounded-lg">
        <p className="text-sm font-medium text-plant-dark">
          Detected Disease (via {result.type}):
        </p>
        <p className="text-xl font-bold text-gray-800">{result.label || 'N/A'}</p>
      </div>

      <div className="p-3 bg-blue-accent/20 rounded-lg">
        <p className="text-sm font-medium text-blue-accent">Confidence Score:</p>
        <p className="text-lg font-bold text-gray-800">
          {result.confidence !== null ? `${(result.confidence * 100).toFixed(2)}%` : 'N/A'}
        </p>
      </div>

      <div className="p-3 border-t pt-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Recommendation:</p>
        <p className="text-base text-gray-700 italic border-l-4 border-plant-green pl-3 bg-gray-50 p-2 rounded-lg">
          {result.recommendation ||
            'No specific treatment found. Contact an expert for detailed care instructions.'}
        </p>
      </div>
    </div>
  </div>
);

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textLoading, setTextLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(initialPrediction);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPredictionResult(initialPrediction);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleTextChange = (e) => {
    setTextInput(e.target.value);
    setPredictionResult(initialPrediction);
  };

  const handleImagePredict = useCallback(async () => {
    if (!selectedFile) {
      setPredictionResult((prev) => ({
        ...prev,
        error: 'Please select an image file first.',
        type: 'image',
      }));
      return;
    }

    setPredictionResult(initialPrediction);
    setImageLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const imgRes = await axios.post(`${API_BASE_URL}/predict-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPredictionResult({
        label: imgRes.data.label,
        confidence: imgRes.data.confidence,
        recommendation: imgRes.data.recommendation,
        type: 'image',
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || 'Could not connect to the image model API.';
      setPredictionResult((prev) => ({ ...prev, error: errorMessage, type: 'image' }));
    } finally {
      setImageLoading(false);
    }
  }, [selectedFile]);

  const handleTextPredict = useCallback(async () => {
    if (textInput.trim() === '') {
      setPredictionResult((prev) => ({
        ...prev,
        error: 'Please enter symptoms to analyze.',
        type: 'text',
      }));
      return;
    }

    setPredictionResult(initialPrediction);
    setTextLoading(true);

    try {
      const txtRes = await axios.post(`${API_BASE_URL}/predict-text`, { text: textInput });

      setPredictionResult({
        label: txtRes.data.label,
        confidence: txtRes.data.confidence,
        recommendation: txtRes.data.recommendation,
        type: 'text',
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || 'Could not connect to the text model API.';
      setPredictionResult((prev) => ({ ...prev, error: errorMessage, type: 'text' }));
    } finally {
      setTextLoading(false);
    }
  }, [textInput]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      <TailwindConfigScript />

      <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-3xl shadow-3xl">
        <header className="text-center mb-10 pb-5 border-b border-gray-100">
          <h1 className="text-5xl font-extrabold text-plant-dark tracking-tight mb-2">
            PlantDoc AI Diagnostician
          </h1>
          <p className="text-xl text-gray-500 font-light">
            Analyze plant health using image recognition or symptom description.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* IMAGE CARD */}
          <div className="lg:w-1/2 p-6 bg-green-50 rounded-2xl shadow-xl border border-green-200 hover:shadow-2xl transition-all">
            <div className="flex items-center mb-4">
              <Camera className="w-8 h-8 text-plant-dark mr-3" />
              <h2 className="text-2xl font-bold text-plant-dark">Image Diagnosis</h2>
            </div>

            <div className="h-48 mb-4 border-4 border-dashed border-green-300 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center text-gray-400">
                  <Leaf className="w-10 h-10 mx-auto mb-1" />
                  <p>Upload a leaf image (.jpg, .png)</p>
                </div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600 mb-5 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-green-100 file:text-green-800 hover:file:bg-green-200 cursor-pointer"
            />

            {/* 🔥 Enhanced Button */}
            <button
              onClick={handleImagePredict}
              disabled={imageLoading || !selectedFile}
              className={`w-full py-3 rounded-xl flex items-center justify-center font-extrabold text-lg tracking-wide transition-all duration-300 transform ${
                imageLoading
                  ? 'bg-gradient-to-r from-green-400 to-green-600 text-white opacity-70 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {imageLoading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <Camera className="w-6 h-6 mr-3" />
                  Get Image Diagnosis
                </>
              )}
            </button>
          </div>

          {/* TEXT CARD */}
          <div className="lg:w-1/2 p-6 bg-blue-50 rounded-2xl shadow-xl border border-blue-200 hover:shadow-2xl transition-all">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-8 h-8 text-blue-accent mr-3" />
              <h2 className="text-2xl font-bold text-blue-accent">Symptom Chat</h2>
            </div>

            <textarea
              value={textInput}
              onChange={handleTextChange}
              rows="5"
              placeholder="E.g., 'My tomato plant has yellow spots on the leaves and the stems are brittle.'"
              className="w-full p-3 mb-4 rounded-lg border-2 border-blue-300 focus:border-blue-accent focus:ring-1 focus:ring-blue-accent transition duration-200 resize-none text-gray-700 placeholder-gray-400"
            ></textarea>

            {/* 🔥 Enhanced Button */}
            <button
              onClick={handleTextPredict}
              disabled={textLoading || textInput.trim() === ''}
              className={`w-full py-3 rounded-xl flex items-center justify-center font-extrabold text-lg tracking-wide transition-all duration-300 transform ${
                textLoading
                  ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white opacity-70 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {textLoading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Analyzing Text...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 mr-3" />
                  Get Text Diagnosis
                </>
              )}
            </button>
          </div>
        </div>

        {/* RESULTS */}
        <div className="mt-12 pt-8 border-t-2 border-gray-200 flex flex-col items-center">
          <h2 className="text-3xl font-bold text-gray-700 mb-8">Diagnosis Feedback</h2>

          {(imageLoading || textLoading) && (
            <div className="flex items-center text-xl text-gray-500 p-4">
              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
              Processing request...
            </div>
          )}

          {predictionResult.error && (
            <ErrorMessage message={predictionResult.error} type={predictionResult.type} />
          )}
          {predictionResult.label && <ResultCard result={predictionResult} />}

          {!predictionResult.error &&
            !predictionResult.label &&
            !imageLoading &&
            !textLoading && (
              <div className="p-10 bg-gray-100 rounded-xl border-4 border-dashed border-gray-300 w-full max-w-2xl text-center text-gray-500 shadow-inner transition-opacity duration-500">
                <Leaf className="w-12 h-12 mx-auto mb-3 text-gray-400 animate-bounce-slow" />
                <p className="text-lg font-semibold">
                  Start the analysis by uploading an image or describing symptoms.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;
