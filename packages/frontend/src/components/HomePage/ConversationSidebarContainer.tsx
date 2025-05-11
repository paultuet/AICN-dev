import React from 'react';
import ConversationSidebar from '@/components/conversations/ConversationSidebar';
import { Entity, Conversation, Selection, SidebarViewMode } from '@/types';

interface ConversationSidebarContainerProps {
  isOpen: boolean;
  selectedItems: Selection[];
  viewMode: SidebarViewMode;
  selectedConversationId: string | null;
  conversations: Conversation[];
  referentials: Entity[];
  onClose: () => void;
  onClearSelection: () => void;
  onViewModeChange: (mode: SidebarViewMode) => void;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: (title: string) => void;
  onSendMessage: (conversationId: string, content: string) => void;
  setSidebarOpen: (open: boolean) => void;
}

/**
 * Conteneur pour la barre latérale des conversations
 */
const ConversationSidebarContainer: React.FC<ConversationSidebarContainerProps> = ({
  isOpen,
  selectedItems,
  viewMode,
  selectedConversationId,
  conversations,
  referentials,
  onClose,
  onClearSelection,
  onViewModeChange,
  onSelectConversation,
  onCreateConversation,
  onSendMessage,
  setSidebarOpen
}) => {
  return (
    <>
      {/* Panneau latéral de conversation */}
      <ConversationSidebar
        isOpen={isOpen}
        selectedItems={selectedItems}
        viewMode={viewMode}
        selectedConversationId={selectedConversationId}
        conversations={conversations}
        referentials={referentials}
        onClose={onClose}
        onClearSelection={onClearSelection}
        onViewModeChange={onViewModeChange}
        onSelectConversation={onSelectConversation}
        onCreateConversation={onCreateConversation}
        onSendMessage={onSendMessage}
      />

      {/* Overlay semi-transparent avec animation quand le panneau est ouvert */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-out z-10 ${
          isOpen ? 'opacity-25' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Bouton d'ouverture du panneau latéral */}
      <button
        className={`fixed z-30 right-6 bottom-6 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-out transform ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 hover:scale-110'
        }`}
        onClick={() => {
          console.log("Opening sidebar from button");
          setSidebarOpen(true);
        }}
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.5)'
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </>
  );
};

export default React.memo(ConversationSidebarContainer);