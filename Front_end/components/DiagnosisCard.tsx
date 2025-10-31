import React from 'react';
import type { DiagnosisResult } from '../types';

interface DiagnosisCardProps {
  diagnosis: DiagnosisResult;
}

const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ diagnosis }) => {
    // A simple formatter to replace newlines with <br> tags
    const formatText = (text: string) => {
        return text.split('\n').map((item, key) => {
            return <React.Fragment key={key}>{item}<br/></React.Fragment>
        });
    };

  return (
    <div className="bg-white rounded-lg mt-3 text-gray-800 text-sm">
      <div className="p-4">
        {/* Header */}
        <div className="pb-3 mb-3 border-b">
            <h3 className="text-lg font-bold text-[#386641]">{diagnosis.disease}</h3>
            <p className="text-xs text-gray-500 font-medium">Confidence: {diagnosis.confidence}</p>
        </div>

        {/* Description */}
        <div className="mb-4">
            <h4 className="font-bold text-gray-700 mb-1">Description</h4>
            <p className="text-gray-600">{formatText(diagnosis.description)}</p>
        </div>

        {/* Treatment */}
        <div>
            <h4 className="font-bold text-gray-700 mb-1">Recommended Treatment</h4>
            <div className="text-gray-600 space-y-1">{formatText(diagnosis.treatment)}</div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisCard;
