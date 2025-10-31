
import React from 'react';
import type { DiagnosisResult } from '../types';

interface DiagnosisCardProps {
  diagnosis: DiagnosisResult;
}

const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ diagnosis }) => {
    
    const getConfidenceBadge = (confidence: string) => {
        switch (confidence?.toLowerCase()) {
            case 'high':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">High Confidence</span>;
            case 'medium':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">Medium Confidence</span>;
            case 'low':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">Low Confidence</span>;
            default:
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">{confidence}</span>;
        }
    };

    const formatTreatmentSteps = (text: string) => {
        // Split by newline or by a number followed by a period (e.g., "1.", "2.")
        const steps = text.split(/\n|\s*(?=\d+\.\s*)/).filter(step => step.trim() !== '');
        
        // If splitting didn't result in a list, return the original text
        if (steps.length <= 1 && !/^\d+\./.test(steps[0])) {
             return <p className="text-gray-600">{text}</p>;
        }

        return (
            <ol className="list-decimal list-inside text-gray-600 space-y-2">
                {steps.map((step, index) => (
                    <li key={index}>
                        {/* Remove the leading number and period if it exists */}
                        {step.replace(/^\d+\.\s*/, '')}
                    </li>
                ))}
            </ol>
        );
    };

  return (
    <div className="bg-white rounded-lg mt-3 text-gray-800 text-sm animate-fade-in-slide-up">
      <div className="p-4">
        {/* Header */}
        <div className="pb-3 mb-3 border-b flex justify-between items-center gap-4">
            <h3 className="text-lg font-bold text-[#386641]">{diagnosis.disease}</h3>
            {getConfidenceBadge(diagnosis.confidence)}
        </div>

        {/* Description */}
        <div className="mb-4">
            <h4 className="font-bold text-gray-700 mb-1">Description</h4>
            <p className="text-gray-600">{diagnosis.description}</p>
        </div>

        {/* Treatment */}
        <div>
            <h4 className="font-bold text-gray-700 mb-1">Recommended Treatment</h4>
            {formatTreatmentSteps(diagnosis.treatment)}
        </div>
      </div>
    </div>
  );
};

export default DiagnosisCard;
