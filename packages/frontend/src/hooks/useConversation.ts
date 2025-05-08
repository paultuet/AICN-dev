import { useState, useCallback, useEffect } from 'react';
import { Conversation, Selection, Message } from '../types/conversation';

interface UseConversationProps {
  initialConversations?: Conversation[];
}

export function useConversation({ initialConversations = [] }: UseConversationProps = {}) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedItems, setSelectedItems] = useState<Selection[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'selection' | 'conversation'>('selection');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // S'assurer que les conversations initiales sont chargées si elles sont fournies
  useEffect(() => {
    if (initialConversations && initialConversations.length > 0) {
      setConversations(initialConversations);
    }
  }, [initialConversations]);

  // Créer une nouvelle conversation
  const createConversation = useCallback((title: string) => {
    if (selectedItems.length === 0) return;
    
    const newConversation: Conversation = {
      id: `new-${Date.now()}`,
      title: title || 'Nouvelle conversation',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      linkedItems: [...selectedItems], // Copie des éléments sélectionnés
      messages: [] // Initialisation d'un tableau de messages vide
    };
    
    setConversations(prevConversations => [newConversation, ...prevConversations]);
    setSelectedConversationId(newConversation.id);
    setViewMode('conversation');
    
    // Ici, on pourrait ajouter un appel API pour enregistrer la conversation
    // await api.post('/conversations', newConversation);
  }, [selectedItems]);

  // Envoyer un nouveau message
  const sendMessage = useCallback((conversationId: string, content: string) => {
    const currentConversation = conversations.find(c => c.id === conversationId);
    
    if (!currentConversation) return;
    
    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId,
      content,
      createdAt: new Date().toISOString(),
      authorId: 'user1', // À remplacer par l'ID de l'utilisateur actuel
      authorName: 'Julien Dupont' // À remplacer par le nom de l'utilisateur actuel
    };
    
    // Ajout du message à la conversation
    const updatedConversation = {
      ...currentConversation,
      messages: [...(currentConversation.messages || []), newMessage],
      messageCount: (currentConversation.messageCount || 0) + 1,
      lastActivity: new Date().toISOString()
    };
    
    // Mise à jour de la liste des conversations
    setConversations(
      conversations.map(c => c.id === conversationId ? updatedConversation : c)
    );
    
    // Ici, on pourrait ajouter l'appel API pour enregistrer le message
    // await api.post(`/conversations/${conversationId}/messages`, newMessage);
  }, [conversations]);

  // Obtenir les conversations pour un groupe
  const getConversationsForGroup = useCallback((entityId: string, groupName: string): Conversation[] => {
    return conversations.filter(conversation => 
      conversation.linkedItems.some(item => 
        item.type === 'group' && 
        item.entityId === entityId && 
        item.groupName === groupName
      )
    );
  }, [conversations]);

  // Obtenir les conversations pour un champ
  const getConversationsForField = useCallback((entityId: string, fieldId: number | string): Conversation[] => {
    return conversations.filter(conversation => 
      conversation.linkedItems.some(item => 
        item.type === 'field' && 
        item.entityId === entityId && 
        item.fieldIds?.some(id => 
          id === fieldId || 
          id === Number(fieldId) || 
          String(id) === String(fieldId)
        )
      )
    );
  }, [conversations]);

  // Vérifier si un champ appartient à un groupe avec des conversations
  const fieldBelongsToGroupWithConversation = useCallback((entityId: string, fieldId: number | string, fields: { 'id-field': number | string, 'lib-group': string }[]): boolean => {
    const field = fields.find(f => {
      const idField = f['id-field'];
      return idField === fieldId || 
            idField === Number(fieldId) || 
            String(idField) === String(fieldId);
    });
    if (!field) return false;
    
    const groupName = field['lib-group'];
    
    const hasGroupConversation = conversations.some(conversation => 
      conversation.linkedItems.some(item => 
        item.type === 'group' && 
        item.entityId === entityId && 
        item.groupName === groupName
      )
    );
    
    return hasGroupConversation;
  }, [conversations]);

  // Réinitialiser la sélection
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setSidebarOpen(false);
    setSelectedConversationId(null);
    setViewMode('selection');
  }, [setSelectedItems, setSidebarOpen, setSelectedConversationId, setViewMode]);

  // Ouvrir une conversation spécifique
  const openConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setViewMode('conversation');
    setSidebarOpen(true);
  }, []);

  return {
    conversations,
    selectedItems,
    selectedConversationId,
    viewMode,
    sidebarOpen,
    setConversations,
    setSelectedItems,
    setSelectedConversationId,
    setViewMode,
    setSidebarOpen,
    createConversation,
    sendMessage,
    getConversationsForGroup,
    getConversationsForField,
    fieldBelongsToGroupWithConversation,
    clearSelection,
    openConversation
  };
}

export default useConversation;