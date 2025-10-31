import React from 'react';
import type { Message } from '../types';
import { UserIcon, LeafIcon } from './icons';
import DiagnosisCard from './DiagnosisCard';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  const bubbleClasses = isUser
    ? 'bg-[#386641] text-white'
    : 'bg-gray-100 text-gray-800';
  const containerClasses = isUser ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex items-end gap-3 ${containerClasses}`}>
        {!isUser && (
             <div className="flex-shrink-0 w-10 h-10 bg-[#386641] rounded-full flex items-center justify-center">
                <LeafIcon className="w-6 h-6 text-white" />
            </div>
        )}
        <div className={`max-w-md lg:max-w-lg rounded-xl p-4 shadow-sm ${bubbleClasses}`}>
            {message.image && (
                <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-h-60 w-full object-cover" />
            )}
             <div>
                {message.text}
             </div>
             {message.isDiagnosis && message.diagnosis && (
                <DiagnosisCard diagnosis={message.diagnosis} />
             )}
        </div>
        {isUser && (
             <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-gray-500" />
            </div>
        )}
    </div>
  );
};

export default MessageBubble;