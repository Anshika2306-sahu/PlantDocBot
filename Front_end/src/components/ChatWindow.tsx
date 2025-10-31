import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import MessageBubble from './MessageBubble';
import Spinner from './Spinner';
import { LeafIcon } from './icons';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-inner min-h-[200px]">
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div className="flex items-end justify-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#386641] rounded-full flex items-center justify-center">
                  <LeafIcon className="w-6 h-6 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                  <Spinner />
                  <span className="text-gray-600 text-sm">PlantDocBot is thinking...</span>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
