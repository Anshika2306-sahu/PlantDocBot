
import React, { useState, useEffect, useRef } from 'react';
import type { Message, DiagnosisResult } from './types';
import { diagnosePlantFromImage, diagnosePlantFromText } from './services/diagnosisService';
import { askQuestion } from './services/askService';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import Toast from './components/Toast';
import { LeafIcon, TrashIcon } from './components/icons';
import SuggestionChip from './components/SuggestionChip';

const App: React.FC = () => {
  const initialMessage: Message = {
    id: Date.now(),
    sender: 'bot',
    text: 'Welcome to PlantDocBot! Describe your plant\'s symptoms or upload a photo of a leaf, and I\'ll help diagnose the issue.',
    timestamp: Date.now(),
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
        const savedMessages = localStorage.getItem('plantDocChatHistory');
        if (savedMessages) {
            return JSON.parse(savedMessages);
        }
    } catch (error) {
        console.error("Failed to parse messages from localStorage", error);
        localStorage.removeItem('plantDocChatHistory'); // Clear corrupted data
    }
    return [initialMessage];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [mode, setMode] = useState<'diagnose' | 'ask'>('diagnose');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // keep track of last diagnosis to avoid exact duplicate bot replies
  const lastDiagnosisRef = useRef<string | null>(null);

  useEffect(() => {
    // Save chat history to localStorage, but only if there is a conversation.
    if (messages.length > 1) {
      localStorage.setItem('plantDocChatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
        setMessages([initialMessage]);
        localStorage.removeItem('plantDocChatHistory');
        setSuggestions([]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
  };

  const handleSendMessage = async (text: string, imageFile?: File) => {
    if ((!text || !text.trim()) && !imageFile) return;

    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    let imageUrl: string | undefined = undefined;
    if (imageFile) {
        try {
            imageUrl = await fileToBase64(imageFile);
        } catch (err) {
            setError('Failed to read the image file. Please try again.');
            setIsLoading(false);
            return;
        }
    }
    
    const timestamp = Date.now();
    const userMessage: Message = {
      id: timestamp,
      sender: 'user',
      text,
      image: imageUrl,
      timestamp,
    };

    // append user message (functional update to avoid stale state)
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Heuristic: decide whether this is a general question or a symptom/diagnosis request.
      const isQuestion = (() => {
        // Respect the explicit UI mode: Ask mode treats inputs as questions.
        if (mode === 'ask') return true;
        const q = text.trim().toLowerCase();
        const questionWords = ['how', 'what', 'why', 'who', 'when', 'where', 'explain', 'tell me', '?'];
        return questionWords.some((w) => q.startsWith(w) || q.includes(w));
      })();

      // Branch: image upload -> image diagnosis. Plain text -> either /ask or /diagnose
      let diagnosisResult: DiagnosisResult | null = null;
      if (imageFile) {
        diagnosisResult = await diagnosePlantFromImage(imageFile, text);
      } else if (isQuestion) {
        // Ask the local QA endpoint for general questions
        try {
          const resp = await askQuestion(text);
          // create a structured answer message so UI can render an AnswerCard
          const timestamp = Date.now();
          const botMessage: Message = {
            id: timestamp + Math.floor(Math.random() * 1000),
            sender: 'bot',
            text: resp.answer || resp.detail || 'I have no local answer for that.',
            isAnswer: true,
            answerText: resp.answer,
            answerDetail: resp.detail,
            answerSources: resp.source ? [resp.source] : undefined,
            timestamp,
          };
          setMessages((prev) => [...prev, botMessage]);
          setIsLoading(false);
          return; // done handling the question
        } catch (e) {
          // fall back to diagnosis if QA fails
          console.warn('askQuestion failed, falling back to diagnose:', e);
          // Show a user-visible toast so they know the QA service failed (likely CORS/network)
          try {
            const msg = e instanceof Error ? e.message : 'QA service failed';
            showToast(`QA service unavailable: ${msg}`);
          } catch (_) {}
          diagnosisResult = await diagnosePlantFromText(text);
        }
      } else {
        diagnosisResult = await diagnosePlantFromText(text);
      }
      
      // default fallback message
      let botText = `I couldn't identify a specific disease from the provided information. Could you please provide more details or a clearer image?`;
      setSuggestions([]); // Clear suggestions by default

      if (diagnosisResult && diagnosisResult.disease.toLowerCase() !== 'unknown' && diagnosisResult.disease.toLowerCase() !== 'healthy plant') {
        botText = `Here is the diagnosis for your plant:`;
        const disease = diagnosisResult.disease;
        setSuggestions([
            `How do I prevent ${disease}?`,
            `What are common pests for this plant type?`,
        ]);
      }

      // prevent exact repeated diagnosis messages by checking last diagnosis
      const last = lastDiagnosisRef.current;
      if (diagnosisResult && diagnosisResult.disease) {
        if (last && last === diagnosisResult.disease) {
          // if same as last, add a small varied follow-up to avoid repetition
          botText += `\n\n(Additional note: If you need more details, try uploading a close-up of the affected area or ask for prevention tips.)`;
        }
        // store last
        lastDiagnosisRef.current = diagnosisResult.disease;
      }

      // simulate a short natural delay so UI shows spinner and prevents rapid overwrites
      await new Promise((res) => setTimeout(res, 400 + Math.random() * 400));

      const botMessage: Message = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender: 'bot',
        text: botText,
        isDiagnosis: !!diagnosisResult,
        diagnosis: diagnosisResult,
        timestamp: Date.now(),
      };

      // append bot message safely
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

  const handleSuggestionClick = (text: string) => {
    handleSendMessage(text);
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
  }

  return (
    <div className="flex justify-center items-center h-screen bg-[#FBF9F4] p-4">
      <div className="flex flex-col h-full w-full max-w-3xl bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-200/80">
        <header className="bg-white rounded-t-2xl p-4 flex items-center justify-between gap-4 border-b">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#386641] rounded-full flex items-center justify-center">
                  <LeafIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                  <h1 className="text-xl font-bold text-[#386641]">PlantDocBot</h1>
                  <p className="text-sm text-gray-500">Your AI Plant Health Assistant</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('diagnose')}
              className={`px-3 py-1 rounded-full ${mode === 'diagnose' ? 'bg-[#386641] text-white' : 'bg-gray-100 text-gray-700'}`}>
              Diagnose
            </button>
            <button
              onClick={() => setMode('ask')}
              className={`px-3 py-1 rounded-full ${mode === 'ask' ? 'bg-[#386641] text-white' : 'bg-gray-100 text-gray-700'}`}>
              Ask
            </button>
          </div>
          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
              aria-label="Clear chat history"
              title="Clear chat history"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6 no-scrollbar">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </main>

        <footer className="bg-white p-4 border-t rounded-b-2xl">
          {suggestions.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 mb-3 justify-center animate-fade-in-slide-up">
                {suggestions.map((suggestion, index) => (
                    <SuggestionChip key={index} text={suggestion} onClick={handleSuggestionClick} />
                ))}
            </div>
           )}
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} mode={mode} />
          {error && <p className="text-red-500 text-center text-xs mt-2">{error}</p>}
        </footer>
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    </div>
  );
};

export default App;
