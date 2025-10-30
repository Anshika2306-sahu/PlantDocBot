import React, { useState, useEffect } from 'react';
import ImageClassifier from './components/ImageClassifier';
import TextClassifier from './components/TextClassifier';
import { healthCheck } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('image');
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      await healthCheck();
      setApiStatus('online');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-primary-500">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 p-3 rounded-xl text-4xl">
                🌿
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Plant Disease Detection
                </h1>
                <p className="text-gray-600 mt-1">
                  AI-Powered Plant Health Analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${apiStatus === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
              <span className={`text-sm font-medium ${apiStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                {apiStatus === 'checking' ? 'Checking...' : apiStatus === 'online' ? 'API Online' : 'API Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'image'
                ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              🖼️ Image Classification
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'text'
                ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              💬 Text Classification
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {activeTab === 'image' ? <ImageClassifier /> : <TextClassifier />}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>Powered by FastAPI & React • Built with ❤️ for Plant Health</p>
        </div>
      </footer>
    </div>
  );
}

export default App;