import React, { useState, useRef } from 'react';
import { SendIcon, PaperclipIcon, XIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (text: string, imageFile?: File) => void;
  isLoading: boolean;
  mode?: 'diagnose' | 'ask';
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, mode = 'diagnose' }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((text.trim() || image) && !isLoading) {
      onSendMessage(text, image?.file);
      setImage(null);
      setText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage({ file, preview: URL.createObjectURL(file) });
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-1">
      {image && (
        <div className="relative inline-block mb-2 p-1 border border-gray-200 rounded-lg bg-gray-50">
          <img src={image.preview} alt="Preview" className="w-20 h-20 object-cover rounded-md" />
          <button
            onClick={() => {
              setImage(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
            aria-label="Remove image"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 border border-gray-300 rounded-full py-2 px-3 bg-white focus-within:ring-2 focus-within:ring-[#A8D08D]">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          disabled={isLoading}
          aria-label="Attach image"
        >
          <PaperclipIcon className="w-6 h-6" />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={mode === 'ask' ? 'Ask a question (e.g., how to treat leaf spots?)' : 'Describe symptoms or upload an image to diagnose'}
          className="flex-1 bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-400"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || (!text.trim() && !image)}
          className="bg-[#618B4A] text-white rounded-full p-2.5 disabled:bg-[#a8d08d] disabled:cursor-not-allowed hover:bg-[#386641] transition-colors"
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
