import React, { useState } from 'react';
import type { Message, DiagnosisResult } from './types';
import { diagnosePlantFromImage, diagnosePlantFromText } from './services/diagnosisService';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { LeafIcon } from './components/icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      sender: 'bot',
      text: 'Welcome to PlantDocBot! Describe your plant\'s symptoms or upload a photo of a leaf, and I\'ll help diagnose the issue.',
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (text: string, imageFile?: File) => {
    if (!text && !imageFile) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text,
      image: imageFile ? URL.createObjectURL(imageFile) : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      let diagnosisResult: DiagnosisResult | null = null;
      if (imageFile) {
        diagnosisResult = await diagnosePlantFromImage(imageFile, text);
      } else {
        diagnosisResult = await diagnosePlantFromText(text);
      }
      
      let botText = `I couldn't identify a specific disease from the provided information. Could you please provide more details or a clearer image?`;

      if (diagnosisResult && diagnosisResult.disease.toLowerCase() !== 'unknown') {
        // We let the MessageBubble handle the rendering of the diagnosis
        botText = `Here is the diagnosis for your plant:`;
      }
      
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botText,
        isDiagnosis: !!diagnosisResult,
        diagnosis: diagnosisResult,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage); // This shows the technical error below the input

      // Create a more user-friendly message for the chat bubble
      let botText = `Sorry, I encountered an unexpected error. Please try again.`;
      if (errorMessage.includes('API key')) {
          botText = `It looks like there's a configuration issue with the AI service. Please ensure the API key is set up correctly.`;
      } else if (errorMessage.includes('network error')) {
          botText = `I'm having trouble connecting. Please check your internet connection and try again.`;
      } else if (errorMessage.includes('Invalid image format')) {
          botText = `The image format you uploaded isn't supported. Please try a JPEG, PNG, or WEBP file.`;
      } else if (errorMessage.includes('Image is too large')) {
          botText = `The image you uploaded is too large. Please try a smaller file (under 10MB).`;
      } else if (errorMessage.includes('AI model could not process')) {
          botText = `The AI model had trouble with that request. Could you try rephrasing or using a different image?`;
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botText,
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#FBF9F4] p-4">
      <div className="flex flex-col h-full w-full max-w-3xl bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-200/80">
        <header className="bg-white rounded-t-2xl p-4 flex items-center gap-4 border-b">
          <div className="w-12 h-12 bg-[#386641] rounded-full flex items-center justify-center">
              <LeafIcon className="w-7 h-7 text-white" />
          </div>
          <div>
              <h1 className="text-xl font-bold text-[#386641]">PlantDocBot</h1>
              <p className="text-sm text-gray-500">Your AI Plant Health Assistant</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 no-scrollbar">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </main>

        <footer className="bg-white p-4 border-t rounded-b-2xl">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          {error && <p className="text-red-500 text-center text-xs mt-2">{error}</p>}
        </footer>
      </div>
    </div>
  );
};

export default App;