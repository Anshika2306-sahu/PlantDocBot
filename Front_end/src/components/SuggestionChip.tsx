
import React from 'react';

interface SuggestionChipProps {
  text: string;
  onClick: (text: string) => void;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ text, onClick }) => {
  return (
    <button
      onClick={() => onClick(text)}
      className="bg-emerald-50 text-[#386641] border border-emerald-200 rounded-full px-4 py-2 text-sm font-medium hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
      aria-label={`Suggestion: ${text}`}
    >
      {text}
    </button>
  );
};

export default SuggestionChip;
