
import React from 'react';
import type { Message } from '../types';
import { UserIcon, LeafIcon } from './icons';
import DiagnosisCard from './DiagnosisCard';
import AnswerCard from './AnswerCard';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  const bubbleClasses = isUser
    ? 'bg-[#386641] text-white rounded-2xl rounded-br-none'
    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none';
  const containerClasses = isUser ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex items-end gap-3 ${containerClasses} animate-fade-in-slide-up`}>
        {!isUser && (
             <div className="flex-shrink-0 w-10 h-10 bg-[#386641] rounded-full flex items-center justify-center">
                <LeafIcon className="w-6 h-6 text-white" />
            </div>
        )}
      <div className={`max-w-md lg:max-w-lg p-4 shadow-sm ${bubbleClasses}`}>
            {message.image && (
                <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-h-60 w-full object-cover" />
            )}
             <div>
           {message.text}
           {message.timestamp && (
            <div className="text-xs text-gray-400 mt-2 text-right">{new Date(message.timestamp).toLocaleTimeString()}</div>
           )}
             </div>
         {message.isAnswer && (
           <AnswerCard answerText={message.answerText} answerDetail={message.answerDetail} sources={message.answerSources} />
         )}
         {message.isDiagnosis && message.diagnosis && (
           <DiagnosisCard diagnosis={message.diagnosis} />
         )}
        </div>
        {isUser && (
             <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-blue-500" />
            </div>
        )}
    </div>
  );
};

export default MessageBubble;
