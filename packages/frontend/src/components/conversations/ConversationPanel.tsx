import React from 'react';
import { Conversation, Entity, SidebarViewMode } from '@/types';
import ConversationHeader from './ConversationHeader';
import LinkedItemsList from './LinkedItemsList';
import MessageList from './MessageList';
import MessageForm from './MessageForm';

interface ConversationPanelProps {
  conversation: Conversation;
  referentials: Entity[];
  viewMode: SidebarViewMode;
  onBackToSelection: () => void;
  onSendMessage: (conversationId: string, content: string) => void;
  currentUserId?: string;
  onMarkAsRead?: (conversationId: string) => void;
  isMarkingAsRead?: boolean;
}

/**
 * Panneau complet d'une conversation incluant en-tête, liste de messages et formulaire
 */
const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversation,
  referentials,
  viewMode,
  onBackToSelection,
  onSendMessage,
  currentUserId = 'user1',
  onMarkAsRead,
  isMarkingAsRead
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* En-tête de la conversation */}
      <ConversationHeader
        conversation={conversation}
        viewMode={viewMode}
        onBackToSelection={onBackToSelection}
        onMarkAsRead={onMarkAsRead}
        isMarkingAsRead={isMarkingAsRead}
      />
      
      {/* Liste des éléments liés */}
      <div className="px-4 py-2 border-b border-gray-100">
        <LinkedItemsList
          linkedItems={conversation.linkedItems}
          referentials={referentials}
        />
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList
          messages={conversation.messages || []}
          currentUserId={currentUserId}
        />
      </div>
      
      {/* Formulaire de message */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <MessageForm 
          conversationId={conversation.id}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
};

export default React.memo(ConversationPanel);