import React from 'react';

interface AnswerCardProps {
  answerText?: string;
  answerDetail?: string;
  sources?: string[];
}

const AnswerCard: React.FC<AnswerCardProps> = ({ answerText, answerDetail, sources }) => {
  return (
    <div className="bg-white rounded-lg mt-3 text-gray-800 text-sm animate-fade-in-slide-up">
      <div className="p-4">
        <div className="pb-3 mb-3 border-b">
          <h3 className="text-md font-semibold text-[#386641]">Answer</h3>
        </div>

        {answerText && (
          <div className="mb-3 text-gray-700">
            <p>{answerText}</p>
          </div>
        )}

        {answerDetail && (
          <div className="mb-2 text-gray-600">
            <h4 className="font-bold text-gray-700 mb-1">Details</h4>
            <p>{answerDetail}</p>
          </div>
        )}

        {sources && sources.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            <div className="font-semibold mb-1">Source</div>
            <ul className="list-disc list-inside">
              {sources.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswerCard;
