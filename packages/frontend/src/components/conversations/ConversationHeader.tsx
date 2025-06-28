import React from 'react';
import { Conversation, SidebarViewMode } from '@/types';
import { formatDate } from '@/utils/dateUtils';

interface ConversationHeaderProps {
  conversation: Conversation;
  viewMode: SidebarViewMode;
  onBackToSelection: () => void;
  onMarkAsRead?: (conversationId: string) => void;
  isMarkingAsRead?: boolean;
}

/**
 * En-tête d'une conversation avec titre, date de création et info
 */
const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  viewMode,
  onBackToSelection,
  onMarkAsRead,
  isMarkingAsRead = false
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
        
        <div className="flex items-center gap-2">
          <span className="inline-flex text-nowrap items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
          </span>
          
          {/* Bouton Marquer comme lu */}
          {onMarkAsRead && conversation.readStatus && !conversation.readStatus.isRead && (
            <button
              onClick={() => onMarkAsRead(conversation.id)}
              disabled={isMarkingAsRead}
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Marquer comme lu"
            >
              {isMarkingAsRead ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Marquage...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Marquer comme lu
                </>
              )}
            </button>
          )}
          
          {/* Indicateur de statut lu */}
          {conversation.readStatus?.isRead && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Lu
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ConversationHeader);