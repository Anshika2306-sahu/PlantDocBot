import React, { useState } from 'react';
import { predictText } from '../services/api';
import ResultCard from './ResultCard';

const TextClassifier = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePredict = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await predictText(text);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to predict. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearText = () => {
    setText('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">💬</span>
          <h2 className="text-2xl font-bold text-gray-800">Text Classification</h2>
        </div>

        <form onSubmit={handlePredict} className="space-y-4">
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your text for classification
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here..."
              rows="6"
              className="input-field resize-none"
            />
            <p className="mt-2 text-sm text-gray-500">
              {text.length} characters
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!text.trim() || loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Classifying...
                </>
              ) : (
                <>
                  <span>📨</span>
                  Classify Text
                </>
              )}
            </button>
            
            {text && (
              <button
                type="button"
                onClick={clearText}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {result && <ResultCard result={result} type="text" />}
    </div>
  );
};

export default TextClassifier;