import React, { useRef, useEffect } from 'react';
import { Message } from '@/types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  emptyMessage?: string;
}

/**
 * Composant pur pour afficher une liste de messages
 * avec auto-scrolling vers le dernier message
 */
const MessageList: React.FC<MessageListProps> = ({
  messages = [],
  currentUserId = 'user1',
  emptyMessage = 'Aucun message dans cette conversation. Commencez à discuter!'
}) => {
  // Référence pour le scrolling automatique
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom lorsque des messages sont ajoutés
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);
  
  // Si pas de messages, afficher un message d'information
  if (messages.length === 0) {
    return (
      <div className="text-center py-10">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="mt-2 text-sm text-gray-500">
          {emptyMessage}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {messages.map(message => (
        <MessageItem 
          key={message.id} 
          message={message} 
          currentUserId={currentUserId}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default React.memo(MessageList);