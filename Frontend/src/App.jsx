import { useState } from 'react'

// --- An SVG component for our loading spinner ---
const LoadingSpinner = () => (
  <svg 
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    ></circle>
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// --- A helper function to format the prediction text ---
const formatPrediction = (predictionClass) => {
  if (!predictionClass) return "";
  // Replaces underscores with spaces
  const parts = predictionClass.split('___');
  if (parts.length === 2) {
    const plant = parts[0].replace(/_/g, ' ');
    const disease = parts[1].replace(/_/g, ' ');
    return `${plant} (${disease})`;
  }
  return predictionClass.replace(/_/g, ' ');
};


function App() {
  const [file, setFile] = useState(null); 
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null); // --- State for image preview URL

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPrediction(null); // Clear old prediction
      
      // --- Create a preview URL for the selected image ---
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append("image_file", file); 

    try {
      const response = await fetch("http://127.0.0.1:8000/image-prediction", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setPrediction(data); 
      
    } catch (error) {
      console.error("Error uploading file:", error);
      setPrediction({ error: "Failed to get prediction." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold">
          🌿 PlantDoc Image Classifier
        </h1>

        {/* --- Show image preview if it exists --- */}
        {preview && (
          <div className="mb-4 overflow-hidden rounded-lg">
            <img 
              src={preview} 
              alt="Selected plant" 
              className="h-auto w-full object-cover"
            />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-400
                       file:mr-4 file:rounded-md file:border-0
                       file:bg-green-600 file:px-4 file:py-2
                       file:text-sm file:font-semibold file:text-white
                       hover:file:bg-green-700 cursor-pointer"
          />
          <button 
            type="submit"
            disabled={!file || loading} // Disable button if no file or loading
            className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 
                       font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {/* --- Show spinner when loading, text otherwise --- */}
            {loading ? (
              <>
                <LoadingSpinner />
                <span>Analyzing...</span>
              </>
            ) : (
              "Get Prediction"
            )}
          </button>
        </form>

        {prediction && (
          <div className="mt-6 w-full rounded-md bg-gray-700 p-4">
            <h2 className="text-xl font-semibold">Prediction:</h2>
            {prediction.error ? (
              <p className="text-red-400">{prediction.error}</p>
            ) : (
              <div>
                {/* --- Use the formatting function --- */}
                <p className="text-lg text-green-300">
                  Class: {formatPrediction(prediction.class)}
                </p>
                <p className="text-lg text-green-300">
                  Confidence: {(prediction.confidence * 100).toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App

