import React, { useState } from "react";
// Define the variable for the background image URL
const HERO_BG_IMAGE_URL = 'https://png.pngtree.com/png-clipart/20220125/ourmid/pngtree-leaves-spring-green-decorative-border-png-image_4364434.png';

// --- Diagnosis Result Type ---
const initialDiagnosis = {
    className: null,
    confidence: null,
    recommendation: null,
    previewUrl: null,
    isLoading: false,
    error: null,
};

// --- 1. UploadForm Component (Integrated) ---
const UploadForm = ({ setDiagnosisResult, diagnosisResult }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null); // <-- The state that holds the image URL

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        
        // **THIS IS THE KEY LOGIC FOR IMAGE PREVIEW**
        // 1. Clean up old URL
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl); 
        }
        
        // 2. Create the new local URL for the image object
        if (selectedFile) {
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url); 
            // Reset results when a new image is selected
            setDiagnosisResult(initialDiagnosis);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            console.log('Please select a file first.'); 
            return;
        }

        setDiagnosisResult(prev => ({ ...prev, isLoading: true, error: null }));
        
        // --- Mock Data Simulation ---
        const MOCK_DATA = {
            "Tomato___Early_blight": "Apply fungicide containing mancozeb. Improve ventilation.",
            "Potato___healthy": "Maintain consistent watering and fertilize every 2-3 weeks.",
            "Apple___Black_rot": "Prune out dead wood. Apply protective fungicides.",
            "Palm___Healthy": "Maintain bright, indirect light and allow the top inch of soil to dry out between waterings. Fertilize lightly during the growing season.",
            "Palm___Spider_mites": "Isolate the plant immediately. Increase humidity, wipe leaves with soapy water, and apply insecticidal soap or neem oil if infestation persists.",
        };
        const mockKeys = Object.keys(MOCK_DATA);
        const mockLabel = mockKeys[Math.floor(Math.random() * mockKeys.length)];
        const mockConfidence = Math.round(Math.random() * 20 + 75); 
        
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        // -----------------------------
        
        setDiagnosisResult({
            className: mockLabel,
            confidence: mockConfidence,
            recommendation: MOCK_DATA[mockLabel],
            previewUrl: previewUrl,
            isLoading: false,
            error: null,
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Image Preview Area */}
            <div className="h-64 mb-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                {/* Image tag uses the state to display the preview */}
                {previewUrl ? (
                    <img src={previewUrl} alt="Leaf Preview" className="object-contain w-full h-full" />
                ) : (
                    <div className="text-center text-gray-500 p-4">
                        <svg className="w-10 h-10 mx-auto mb-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <p className="text-sm">Upload a picture of your plant leaf to begin diagnosis.</p>
                    </div>
                )}
            </div>

            {/* Upload Button */}
            <label className="w-full cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300 flex items-center justify-center mb-4">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {file ? file.name : 'Select Image File'}
            </label>

            {/* Diagnose Button */}
            <button 
                onClick={handleSubmit} 
                disabled={!file || diagnosisResult.isLoading}
                className={`w-full font-bold py-3 px-4 rounded-lg transition duration-300 shadow-lg 
                    ${!file || diagnosisResult.isLoading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white transform hover:scale-[1.01]'
                    }`}
            >
                {diagnosisResult.isLoading ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                    </span>
                ) : 'Diagnose Plant'}
            </button>
        </div>
    );
};


// --- 2. ChatBox Component (Integrated) ---
const ChatBox = ({ diagnosisResult }) => {
    const { className, confidence, recommendation, isLoading, error } = diagnosisResult;
    
    const formatLabel = (label) => {
        if (!label) return 'N/A';
        return label.replace(/___/g, ' - ').replace(/_/g, ' ');
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-inner h-full flex items-center justify-center text-center">
                <span className="text-emerald-600 font-medium">Running deep learning analysis...</span>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="bg-red-50 p-6 rounded-lg shadow-inner h-full flex items-center justify-center text-center">
                <p className="text-red-700 font-medium">Error: {error}</p>
            </div>
        );
    }

    if (className) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-2xl border border-emerald-300 h-full flex flex-col justify-start text-left">
                <h3 className="text-2xl font-bold text-emerald-800 mb-4">Diagnosis Report</h3>
                
                <div className="space-y-3">
                    <p className="text-gray-700">
                        <span className="font-semibold text-lg">Plant Condition:</span> 
                        <span className="ml-2 text-red-600 font-extrabold">{formatLabel(className)}</span>
                    </p>
                    <p className="text-gray-700">
                        <span className="font-semibold text-lg">Confidence:</span> 
                        <span className="ml-2 text-emerald-600 font-bold">{confidence}%</span>
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-xl font-semibold text-emerald-700 mb-2">Recommended Care Plan:</h4>
                    <p className="text-gray-700 leading-relaxed bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                        {recommendation}
                    </p>
                </div>
            </div>
        );
    }

    // Default state
    return (
        <div className="bg-white p-6 rounded-lg shadow-inner h-full flex items-center justify-center text-center">
            <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 110 4m0 0v1a2 2 0 002 2h3m-3-3h3m-3 3h3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v2" />
                </svg>
                <p className="font-medium">Upload an image to receive instant diagnosis and care instructions.</p>
            </div>
        </div>
    );
};


// --- 3. Main App Component ---
export default function App() {
    // 1. Initialize State for results in the parent App component
    const [diagnosisResult, setDiagnosisResult] = useState(initialDiagnosis);

    return (
        <div className="min-h-screen bg-[#f7fafc] font-sans"> 
          
            {/* === 1. Hero Section === */}
            <section 
                className="h-[60vh] md:h-[70vh] flex items-end relative bg-cover bg-center" 
                style={{
                    backgroundImage: `url('${HERO_BG_IMAGE_URL}')`,
                }}
            >
                <div className="absolute inset-0 bg-emerald-700 opacity-70"></div>
                <div className="relative z-10 w-full text-center pb-12 px-4">
                    <h1 className="text-white text-xl font-medium mb-10">Plant AI</h1>
                    <p className="text-white text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-snug">
                        Try our AI Powered <br className="sm:hidden" /> Disease Detection
                    </p>
                    <a href="#app-start" className="inline-flex items-center mt-8 bg-white text-emerald-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Try Now
                    </a>
                </div>
            </section>
          
            {/* === 2. Application Start Section (Upload and Chat) === */}
            <div 
                id="app-start" 
                className="bg-[#ECFDF5] py-16"
            >
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-emerald-800 mb-4">
                        Start Diagnosing Now
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                        Upload a photo of your leaf to instantly get a disease diagnosis, the leaf's name, and a recommended care plan.
                    </p>

                    <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl border border-emerald-200">
                        {/* 2. Pass state handlers to the integrated components */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[400px]">
                            <div className="h-full">
                                <h3 className="text-xl font-semibold text-emerald-700 mb-4 text-center lg:text-left">1. Select and Diagnose</h3>
                                <UploadForm setDiagnosisResult={setDiagnosisResult} diagnosisResult={diagnosisResult} />
                            </div>
                            <div className="h-full">
                                <h3 className="text-xl font-semibold text-emerald-700 mb-4 text-center lg:text-left">2. Diagnosis Chat</h3>
                                <ChatBox diagnosisResult={diagnosisResult} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* === 3. How It Works Section === */}
            <section className="bg-emerald-600 text-white py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">How it works?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                        
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 relative">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 110 4m0 0v1a2 2 0 002 2h3m-3-3h3m-3 3h3" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v2" />
                                </svg>
                                <span className="absolute -bottom-2 right-1/2 translate-x-1/2 w-6 h-6 bg-emerald-800 text-xs font-bold rounded-full flex items-center justify-center">1</span>
                            </div>
                            <h3 className="text-xl font-semibold mt-4 mb-2">Click a Pic</h3>
                            <p className="text-sm text-emerald-100">Take a Picture of your plant leaf</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 relative">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span className="absolute -bottom-2 right-1/2 translate-x-1/2 w-6 h-6 bg-emerald-800 text-xs font-bold rounded-full flex items-center justify-center">2</span>
                            </div>
                            <h3 className="text-xl font-semibold mt-4 mb-2">Upload on Plant AI</h3>
                            <p className="text-sm text-emerald-100">Visit Plant AI on your device and click on Try Now to upload your picture</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 relative">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-9 0V3h4v2m-4 0h4m-4 0H7m0 4h10M7 13h10M7 17h6" />
                                </svg>
                                <span className="absolute -bottom-2 right-1/2 translate-x-1/2 w-6 h-6 bg-emerald-800 text-xs font-bold rounded-full flex items-center justify-center">3</span>
                            </div>
                            <h3 className="text-xl font-semibold mt-4 mb-2">Get final Report</h3>
                            <p className="text-sm text-emerald-100">Plant AI will analyze your plant and will display a detailed report for you</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* === 4. Simple Footer === */}
            <footer className="bg-gray-800 text-white text-center py-6">
                <p className="text-sm">&copy; 2024 Plant AI. All rights reserved.</p>
            </footer>

        </div>
    );
}
