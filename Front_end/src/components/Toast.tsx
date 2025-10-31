import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number; // ms
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose(), duration);
    return () => clearTimeout(t);
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-[#1F2937] text-white px-4 py-2 rounded-lg shadow-md max-w-xs">
        <div className="text-sm">{message}</div>
      </div>
    </div>
  );
};

export default Toast;
