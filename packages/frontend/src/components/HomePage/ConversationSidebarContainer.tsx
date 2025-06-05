import React from 'react';
import ConversationSidebar from '@/components/conversations/ConversationSidebar';
import { useConversations } from '@/hooks/useConversations';
import { Entity } from '@/types';

interface ConversationSidebarContainerProps {
  referentials: Entity[];
}

/**
 * Conteneur pour la barre latérale des conversations
 */
const ConversationSidebarContainer: React.FC<ConversationSidebarContainerProps> = ({
  referentials
}) => {
  const {
    sidebarOpen,
    setSidebarOpen,
    clearSelection
  } = useConversations();

  const handleClose = () => {
    clearSelection();
  };

  return (
    <>
      <ConversationSidebar
        referentials={referentials}
        currentUserId="user1"
      />

      {/* Overlay semi-transparent avec animation quand le panneau est ouvert */}
      <div
        className={`fixed left-0 right-0 bg-black transition-opacity duration-300 ease-out z-30 ${
          sidebarOpen ? 'opacity-25' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          top: '64px', /* Commence en dessous de la navbar */
          height: 'calc(100vh - 64px)' /* Hauteur = hauteur de l'écran - hauteur de la navbar */
        }}
        onClick={handleClose}
      />

      {/* Bouton d'ouverture du panneau latéral */}
      <button
        className={`fixed z-60 right-6 bottom-6 bg-secondary text-white rounded-full p-4 shadow-lg hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all duration-300 ease-out transform ${
          sidebarOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 hover:scale-110'
        }`}
        onClick={() => setSidebarOpen(true)}
        style={{
          boxShadow: '0 10px 25px -5px rgba(237, 125, 50, 0.5)'
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
