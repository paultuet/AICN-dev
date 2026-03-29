import React, { useEffect, useRef } from 'react';
import { Entity } from '@/types/referential';
import ConversationForm from './ConversationForm';
import MessageForm from './MessageForm';
import MessageItem from './MessageItem';
import { formatDate } from '@/utils/dateUtils';
import { useConversations } from '@/hooks/useConversations';

interface ConversationSidebarProps {
  referentials: Entity[];
  currentUserId?: string;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  referentials,
  currentUserId = 'user1' // Valeur par défaut pour la démo
}) => {
  // Utiliser le hook useConversations avec react-query
  const { 
    conversations,
    selectedItems,
    selectedConversationId,
    viewMode,
    sidebarOpen,
    clearSelection,
    setViewMode,
    setSelectedConversationId,
    setSidebarOpen,
    openConversation,
    createConversation,
    sendMessage,
    markConversationAsRead,
    isMarkingAsRead
  } = useConversations();

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

  // Fonction de fermeture de la barre latérale
  const handleClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div
      className={`fixed right-0 bg-white transform transition-all duration-300 ease-out z-40 overflow-hidden ${sidebarOpen ? 'translate-x-0 opacity-100 shadow-2xl' : 'translate-x-full opacity-0'
        }`}
      style={{
        width: 'min(420px, 90vw)', /* Largeur soit de 420px, soit 90% de la largeur de la fenêtre, selon le plus petit */
        top: '64px', /* Commence en dessous de la navbar */
        height: 'calc(100vh - 64px)', /* Hauteur = hauteur de l'écran - hauteur de la navbar */
        backdropFilter: 'blur(4px)'
      }}
    >
      <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
        {/* Header compact */}
        <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-sm font-medium text-gray-700 flex items-center">
            {viewMode === 'selection'
              ? (
                <>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Sélection
                </>
              )
              : (
                <>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Conversation
                </>
              )
            }
          </h2>
          <div className="flex items-center space-x-1">
            {viewMode === 'conversation' && (
              <button
                className="p-1.5 hover:bg-gray-200 transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConversationId(null);
                  setViewMode('selection');
                }}
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              className="p-1.5 hover:bg-gray-200 transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                            <li key={`${item.entityId}-${item.groupName}-${index}`} className="flex justify-between items-center p-2 bg-primary/10 rounded-md">
                              <div>
                                <span className="text-xs font-medium text-primary">{entity?.['entity-name']}</span>
                                <p className="text-sm font-medium">{item.groupName}</p>
                                <p className="text-xs text-gray-500">Groupe entier</p>
                              </div>
                              <button
                                className="text-gray-400 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation(); // Empêcher la propagation
                                  clearSelection();
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
                            <li key={`${item.entityId}-fields-${index}`} className="flex justify-between items-center p-2 bg-secondary/10 rounded-md">
                              <div>
                                <span className="text-xs font-medium text-secondary">{entity?.['entity-name']}</span>
                                <p className="text-sm font-medium">
                                  {item.fieldName ? (
                                    // Si le nom du champ a été défini lors de la sélection, l'utiliser directement
                                    item.fieldName
                                  ) : (
                                    // Sinon, essayer de le trouver par ID comme avant
                                    item.fieldIds.map(fieldId => {
                                      // Chercher le champ avec plusieurs tentatives pour le format de l'ID
                                      // Try to find field by various ID formats
                                      const field = entity?.fields.find(f => {
                                        // SourceField: match by code-champ or entity-id
                                        if ('code-champ' in f) {
                                          const sf = f as { 'code-champ': string; 'entity-id': string };
                                          return sf['code-champ'] === String(fieldId) ||
                                            sf['entity-id'] === String(fieldId);
                                        }
                                        // Legacy Field: match by id-field
                                        if ('id-field' in f) {
                                          const fId = (f as { 'id-field': number | string })['id-field'];
                                          return fId === fieldId ||
                                            String(fId) === String(fieldId);
                                        }
                                        return false;
                                      });

                                      if (field && 'libelle' in field) {
                                        return (field as { libelle: string }).libelle;
                                      } else if (field && 'lib-fonc' in field) {
                                        return (field as { 'lib-fonc': string })['lib-fonc'];
                                      } else if (field && 'entity-name' in field) {
                                        return (field as { 'entity-name': string })['entity-name'];
                                      } else {
                                        return "Champ sélectionné";
                                      }
                                    }).join(', ')
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">{item.fieldIds.length} champ(s)</p>
                              </div>
                              <button
                                className="text-gray-400 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation(); // Empêcher la propagation
                                  clearSelection();
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
                    onCreateConversation={createConversation}
                    onClearSelection={clearSelection}
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
                        
                        {/* Bouton Marquer comme lu - après le dernier message */}
                        {currentConversation.readStatus && !currentConversation.readStatus.isRead && (
                          <div className="flex justify-center pt-4">
                            <button
                              onClick={() => markConversationAsRead(currentConversation.id)}
                              disabled={isMarkingAsRead}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isMarkingAsRead ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Marquage en cours...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Marquer comme lu
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        
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
                      onSendMessage={sendMessage}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer - Conversations associées à l'élément sélectionné */}
        {viewMode === 'selection' && (
          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex justify-between">
              <span>Conversations associées</span>
              <div className="flex items-center gap-2">
                {(() => {
                  if (selectedItems.length === 0 || 
                      (!((selectedItems[0].type === 'field' && selectedItems[0].fieldIds?.length) ||
                        (selectedItems[0].type === 'group' && selectedItems[0].groupName)))) {
                    return <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">0 conversation(s)</span>;
                  }

                  const filteredConversations = conversations.filter(conversation =>
                    conversation.linkedItems.some(item => {
                      const currentItem = selectedItems[0];
                      // Match par groupe
                      if (currentItem.type === 'group' && item.type === 'group' &&
                        item.entityId === currentItem.entityId &&
                        item.groupName === currentItem.groupName) {
                        return true;
                      }

                      // Match par champ
                      if (currentItem.type === 'field' && item.type === 'field' &&
                        item.entityId === currentItem.entityId &&
                        item.fieldIds?.some(fid =>
                          currentItem.fieldIds?.some(sid =>
                            fid === sid ||
                            String(fid) === String(sid) ||
                            Number(fid) === Number(sid)
                          )
                        )) {
                        return true;
                      }

                      return false;
                    })
                  );

                  const totalCount = filteredConversations.length;
                  const unreadCount = filteredConversations.filter(conv => 
                    conv.readStatus && !conv.readStatus.isRead
                  ).length;

                  return (
                    <>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        {totalCount} conversation(s)
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                          {unreadCount} non lue(s)
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </h3>

            {selectedItems.length > 0 ? (
              <div>
                {/* Liste des conversations associées à l'élément sélectionné */}
                <ul className="space-y-2 mb-4">
                  {conversations
                    .filter(conversation =>
                      conversation.linkedItems.some(item => {
                        const currentItem = selectedItems[0];

                        // Match par groupe
                        if (currentItem.type === 'group' && item.type === 'group' &&
                          item.entityId === currentItem.entityId &&
                          item.groupName === currentItem.groupName) {
                          return true;
                        }

                        // Match par champ
                        if (currentItem.type === 'field' && item.type === 'field' &&
                          item.entityId === currentItem.entityId &&
                          item.fieldIds?.some(fid =>
                            currentItem.fieldIds?.some(sid =>
                              fid === sid ||
                              String(fid) === String(sid) ||
                              Number(fid) === Number(sid)
                            )
                          )
                        ) {
                          return true;
                        }

                        return false;
                      })
                    )
                    .map(conversation => {
                      const isUnread = conversation.readStatus && !conversation.readStatus.isRead;
                      return (
                        <li key={conversation.id} 
                            className={`border rounded-md overflow-hidden shadow-sm ${
                              isUnread 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200'
                            }`}>
                          <button
                            className="w-full text-left p-3 hover:bg-gray-50 transition-colors flex justify-between items-center"
                            onClick={() => {
                              openConversation(conversation.id);
                            }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm truncate ${
                                  isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'
                                }`}>
                                  {conversation.title}
                                </p>
                                {isUnread && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                                    Non lu
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(conversation.lastActivity)} · {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-indigo-500 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                Sélectionnez un élément pour voir les conversations associées.
              </p>
            )}

            {/* Liste de toutes les conversations */}
            {selectedItems.length === 0 && (
              <ul className="space-y-2">
                {conversations.map(conversation => (
                  <li key={conversation.id}>
                    <button
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex justify-between items-center"
                      onClick={() => {
                        openConversation(conversation.id);
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ConversationSidebar);
