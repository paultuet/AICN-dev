import React from 'react';
import { Message } from '@/types/conversation';
import { formatDate } from '@/utils/dateUtils';

interface MessageItemProps {
  message: Message;
  currentUserId?: string; // ID de l'utilisateur courant pour déterminer le style
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  currentUserId = 'user1' // Valeur par défaut pour la démo, à remplacer par l'ID réel de l'utilisateur
}) => {
  const isCurrentUser = message.authorId === currentUserId;
  
  return (
    <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-3/4 rounded-lg px-4 py-3 shadow-sm ${
          isCurrentUser
            ? 'bg-secondary/10 text-primary rounded-tr-none'
            : 'bg-primary/10 text-primary rounded-tl-none'
        }`}
      >
        <div className="flex items-center mb-1">
          <span className={`text-xs font-medium ${isCurrentUser ? 'text-secondary' : 'text-primary'}`}>
            {message.authorName}
          </span>
          <span className="text-xs text-gray-500 ml-2">
            {formatDate(message.createdAt)}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

export default React.memo(MessageItem);
