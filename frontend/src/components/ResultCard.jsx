import React from 'react';

const ResultCard = ({ result, type }) => {
  if (!result) return null;

  const confidenceColor = result.confidence > 0.8 
    ? 'text-green-600' 
    : result.confidence > 0.6 
    ? 'text-yellow-600' 
    : 'text-orange-600';

  return (
    <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-5xl">
          {result.confidence > 0.7 ? '✅' : '⚠️'}
        </div>
        
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Prediction Results
          </h3>
          
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Detected {type === 'image' ? 'Disease' : 'Category'}</p>
              <p className="text-xl font-semibold text-gray-900">
                {result.prediction}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Confidence Level</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
                <span className={`text-lg font-bold ${confidenceColor}`}>
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Class Index</p>
              <p className="text-lg font-medium text-gray-900">
                {result.class_index}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;