import React from 'react';
import { Conversation, SidebarViewMode } from '@/types';
import { formatDate } from '@/utils/dateUtils';

interface ConversationHeaderProps {
  conversation: Conversation;
  viewMode: SidebarViewMode;
  onBackToSelection: () => void;
}

/**
 * En-tête d'une conversation avec titre, date de création et info
 */
const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  viewMode,
  onBackToSelection
}) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {viewMode === 'conversation' && (
            <button 
              className="p-2 hover:bg-gray-100 rounded-full mr-2 focus:outline-none"
              onClick={onBackToSelection}
              title="Retour à la sélection"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {conversation.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Créée le {formatDate(conversation.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="inline-flex text-nowrap items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ConversationHeader);