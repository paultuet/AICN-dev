import React, { useEffect, useRef } from 'react';
import { Conversation, Selection } from '../../types/conversation';
import { Entity } from '../../types/referential';
import ConversationForm from './ConversationForm';
import MessageForm from './MessageForm';
import MessageItem from './MessageItem';
import { formatDate } from '../../utils/dateUtils';

interface ConversationSidebarProps {
  isOpen: boolean;
  selectedItems: Selection[];
  viewMode: 'selection' | 'conversation';
  selectedConversationId: string | null;
  conversations: Conversation[];
  referentials: Entity[];
  onClose: () => void;
  onClearSelection: () => void;
  onViewModeChange: (mode: 'selection' | 'conversation') => void;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: (title: string) => void;
  onSendMessage: (conversationId: string, content: string) => void;
  currentUserId?: string;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
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
  currentUserId = 'user1' // Valeur par défaut pour la démo
}) => {
  // Trouver la conversation sélectionnée
  const currentConversation = selectedConversationId 
    ? conversations.find(c => c.id === selectedConversationId) 
    : null;
  
  // Référence pour le scrolling automatique
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom lorsque des messages sont ajoutés
  useEffect(() => {
    if (messagesEndRef.current && viewMode === 'conversation') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages?.length, viewMode]);
  
  return (
    <div 
      className={`fixed right-0 top-0 h-full bg-white transform transition-all duration-300 ease-out z-20 overflow-hidden ${
        isOpen ? 'translate-x-0 opacity-100 shadow-2xl' : 'translate-x-full opacity-0'
      }`}
      style={{ 
        width: 'min(420px, 90vw)', /* Largeur soit de 420px, soit 90% de la largeur de la fenêtre, selon le plus petit */
        backdropFilter: 'blur(4px)'
      }}
    >
      <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
        {/* Header - Gradient background */}
        <div 
          className="px-4 py-5 border-b border-gray-200 flex justify-between items-center text-white"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          }}
        >
          <h2 className="text-xl font-semibold flex items-center">
            {viewMode === 'selection' 
              ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Sélection
                </>
              ) 
              : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Conversation
                </>
              )
            }
          </h2>
          <div className="flex items-center space-x-2">
            {viewMode === 'conversation' && (
              <button 
                className="p-2 hover:bg-indigo-700 transition-colors duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewModeChange('selection');
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button 
              className="p-2 hover:bg-indigo-700 transition-colors duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
              onClick={(e) => {
                e.stopPropagation();
                // Utiliser la fonction de fermeture fournie, qui devrait réinitialiser tous les états
                onClose();
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'selection' ? (
            <div className="p-4" onClick={(e) => e.stopPropagation()}>
              {selectedItems.length === 0 ? (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    Sélectionnez des champs ou des groupes pour créer une conversation
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Éléments sélectionnés</h3>
                    <ul className="space-y-1">
                      {selectedItems.map((item, index) => {
                        const entity = referentials.find(e => e['entity-id'] === item.entityId);
                        
                        if (item.type === 'group') {
                          return (
                            <li key={`${item.entityId}-${item.groupName}-${index}`} className="flex justify-between items-center p-2 bg-indigo-50 rounded-md">
                              <div>
                                <span className="text-xs font-medium text-indigo-600">{entity?.['entity-name']}</span>
                                <p className="text-sm font-medium">{item.groupName}</p>
                                <p className="text-xs text-gray-500">Groupe entier</p>
                              </div>
                              <button 
                                className="text-gray-400 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation(); // Empêcher la propagation
                                  onClearSelection();
                                }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          );
                        } else if (item.type === 'field' && item.fieldIds) {
                          return (
                            <li key={`${item.entityId}-fields-${index}`} className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                              <div>
                                <span className="text-xs font-medium text-blue-600">{entity?.['entity-name']}</span>
                                <p className="text-sm font-medium">
                                  {item.fieldIds.map(fieldId => {
                                    const field = entity?.fields.find(f => f['id-field'] === fieldId);
                                    return field?.['lib-fonc'];
                                  }).join(', ')}
                                </p>
                                <p className="text-xs text-gray-500">{item.fieldIds.length} champ(s)</p>
                              </div>
                              <button 
                                className="text-gray-400 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation(); // Empêcher la propagation
                                  onClearSelection();
                                }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  </div>
                  
                  <ConversationForm
                    initialTitle=""
                    onCreateConversation={onCreateConversation}
                    onClearSelection={onClearSelection}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {currentConversation && (
                <>
                  {/* Affichage des infos de la conversation */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {currentConversation.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Créée le {formatDate(currentConversation.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center ml-2">
                        <span className="inline-flex text-nowrap items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {currentConversation.messageCount} message{currentConversation.messageCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    {/* Affichage des éléments liés */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Éléments liés:</p>
                      <div className="flex flex-wrap gap-1">
                        {currentConversation.linkedItems.map((item, idx) => {
                          const entity = referentials.find(e => e['entity-id'] === item.entityId);
                          
                          if (item.type === 'group') {
                            return (
                              <span key={`link-${idx}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                                {entity?.['entity-name']} - {item.groupName}
                              </span>
                            );
                          } else if (item.type === 'field') {
                            return (
                              <span key={`link-${idx}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                {entity?.['entity-name']} - {item.fieldIds?.length} champ(s)
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Affichage des messages */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {currentConversation.messages && currentConversation.messages.length > 0 ? (
                      <div className="space-y-4">
                        {currentConversation.messages.map(message => (
                          <MessageItem 
                            key={message.id} 
                            message={message} 
                            currentUserId={currentUserId}
                          />
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">
                          Aucun message dans cette conversation. Commencez à discuter!
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Zone de saisie du message */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <MessageForm 
                      conversationId={currentConversation.id}
                      onSendMessage={onSendMessage}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {viewMode === 'selection' && (
          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Conversations existantes</h3>
            <ul className="space-y-2">
              {conversations.map(conversation => (
                <li key={conversation.id}>
                  <button
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex justify-between items-center"
                    onClick={() => {
                      onSelectConversation(conversation.id);
                      onViewModeChange('conversation');
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">{conversation.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(conversation.lastActivity)} · {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ConversationSidebar);