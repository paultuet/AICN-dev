import { useAuth } from '@/contexts/AuthContext';
import React, { useState } from 'react';

interface MessageFormProps {
  conversationId: string;
  onSendMessage: (conversationId: string, content: string, userId: string, userFullName: string) => void;
  placeholder?: string;
}

const MessageForm: React.FC<MessageFormProps> = ({
  conversationId,
  onSendMessage,
  placeholder = 'Écrivez votre message...'
}) => {
  const { user } = useAuth();
  const [messageContent, setMessageContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageContent.trim() && user?.id && user?.name) {
      onSendMessage(conversationId, messageContent, user.id, user.name);
      setMessageContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="relative">
        <textarea
          className="w-full border border-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none shadow-inner bg-white"
          rows={3}
          placeholder={placeholder}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type="submit"
          className="absolute bottom-2 right-2 bg-secondary text-white rounded-full p-2 hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          disabled={!messageContent.trim()}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default React.memo(MessageForm);
