import { useState, useCallback, useMemo } from 'react';
import { 
  Conversation, 
  Selection, 
  Message, 
  ID, 
  EntityId, 
  FieldId, 
  GroupName,
  ConversationFilter,
  SidebarViewMode
} from '@/types';

interface UseConversationProps {
  initialConversations?: Conversation[];
}

interface UseConversationState {
  conversations: Conversation[];
  selectedItems: Selection[];
  selectedConversationId: ID | null;
  viewMode: SidebarViewMode;
  sidebarOpen: boolean;
}

interface UseConversationActions {
  setConversations: (conversations: Conversation[]) => void;
  setSelectedItems: (items: Selection[]) => void;
  setSelectedConversationId: (id: ID | null) => void;
  setViewMode: (mode: SidebarViewMode) => void;
  setSidebarOpen: (open: boolean) => void;
  createConversation: (title: string) => void;
  sendMessage: (conversationId: ID, content: string) => void;
  clearSelection: () => void;
  openConversation: (conversationId: ID) => void;
}

interface UseConversationFilters {
  getConversationsForGroup: (entityId: EntityId, groupName: GroupName) => Conversation[];
  getConversationsForField: (entityId: EntityId, fieldId: FieldId) => Conversation[];
  fieldBelongsToGroupWithConversation: (entityId: EntityId, fieldId: FieldId, fields: { 'id-field': FieldId, 'lib-group': string }[]) => boolean;
}

type UseConversationResult = UseConversationState & UseConversationActions & UseConversationFilters;

/**
 * Hook pour gérer les conversations
 * Utilise une approche fonctionnelle avec une séparation claire des responsabilités
 */
export function useConversation({ initialConversations = [] }: UseConversationProps = {}): UseConversationResult {
  // État de base pour les conversations
  const [state, setState] = useState<UseConversationState>({
    conversations: initialConversations,
    selectedItems: [],
    selectedConversationId: null,
    viewMode: 'selection',
    sidebarOpen: false
  });

  // Getters pour accéder à l'état actuel
  const { conversations, selectedItems, selectedConversationId, viewMode, sidebarOpen } = state;

  // Actions pour mettre à jour l'état
  const setConversations = useCallback((newConversations: Conversation[]) => {
    setState(prev => ({ ...prev, conversations: newConversations }));
  }, []);

  const setSelectedItems = useCallback((items: Selection[]) => {
    setState(prev => ({ ...prev, selectedItems: items }));
  }, []);

  const setSelectedConversationId = useCallback((id: ID | null) => {
    setState(prev => ({ ...prev, selectedConversationId: id }));
  }, []);

  const setViewMode = useCallback((mode: SidebarViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, sidebarOpen: open }));
  }, []);

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
    
    setState(prev => ({
      ...prev,
      conversations: [newConversation, ...prev.conversations],
      selectedConversationId: newConversation.id,
      viewMode: 'conversation'
    }));
    
    // Ici, on pourrait ajouter un appel API pour enregistrer la conversation
    // await api.post('/conversations', newConversation);
  }, [selectedItems]);

  // Envoyer un nouveau message dans une conversation
  const sendMessage = useCallback((conversationId: ID, content: string) => {
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
    
    const updatedConversation = {
      ...currentConversation,
      messages: [...(currentConversation.messages || []), newMessage],
      messageCount: (currentConversation.messageCount || 0) + 1,
      lastActivity: new Date().toISOString()
    };
    
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c => 
        c.id === conversationId ? updatedConversation : c
      )
    }));
    
    // Ici, on pourrait ajouter l'appel API pour enregistrer le message
    // await api.post(`/conversations/${conversationId}/messages`, newMessage);
  }, [conversations]);

  // Filtres pour obtenir des conversations spécifiques

  // Créer un filtre memoizé pour les conversations de groupe
  const createGroupFilter = useCallback((entityId: EntityId, groupName: GroupName): ConversationFilter => {
    return (conversation: Conversation) => conversation.linkedItems.some(item => 
      item.type === 'group' && 
      item.entityId === entityId && 
      item.groupName === groupName
    );
  }, []);

  // Créer un filtre memoizé pour les conversations de champ
  const createFieldFilter = useCallback((entityId: EntityId, fieldId: FieldId): ConversationFilter => {
    return (conversation: Conversation) => conversation.linkedItems.some(item => 
      item.type === 'field' && 
      item.entityId === entityId && 
      item.fieldIds?.some(id => 
        id === fieldId || 
        id === Number(fieldId) || 
        String(id) === String(fieldId)
      )
    );
  }, []);

  // Obtenir les conversations pour un groupe
  const getConversationsForGroup = useCallback((entityId: EntityId, groupName: GroupName): Conversation[] => {
    const filter = createGroupFilter(entityId, groupName);
    return conversations.filter(filter);
  }, [conversations, createGroupFilter]);

  // Obtenir les conversations pour un champ
  const getConversationsForField = useCallback((entityId: EntityId, fieldId: FieldId): Conversation[] => {
    const filter = createFieldFilter(entityId, fieldId);
    return conversations.filter(filter);
  }, [conversations, createFieldFilter]);

  // Vérifier si un champ appartient à un groupe avec des conversations
  const fieldBelongsToGroupWithConversation = useCallback((
    entityId: EntityId, 
    fieldId: FieldId, 
    fields: { 'id-field': FieldId, 'lib-group': string }[]
  ): boolean => {
    // Trouver le champ correspondant
    const field = fields.find(f => {
      const idField = f['id-field'];
      return idField === fieldId || 
            idField === Number(fieldId) || 
            String(idField) === String(fieldId);
    });
    
    if (!field) return false;
    
    // Vérifier si le groupe du champ a des conversations
    const groupName = field['lib-group'];
    const filter = createGroupFilter(entityId, groupName);
    
    return conversations.some(filter);
  }, [conversations, createGroupFilter]);

  // Réinitialiser la sélection et fermer la barre latérale
  const clearSelection = useCallback(() => {
    console.log("Clearing selection and closing sidebar");
    setState(prev => ({
      ...prev,
      selectedItems: [],
      selectedConversationId: null,
      viewMode: 'selection',
      sidebarOpen: false
    }));
  }, []);

  // Ouvrir une conversation spécifique
  const openConversation = useCallback((conversationId: ID) => {
    setState(prev => ({
      ...prev,
      selectedConversationId: conversationId,
      viewMode: 'conversation',
      sidebarOpen: true
    }));
  }, []);

  return {
    // État
    conversations,
    selectedItems,
    selectedConversationId,
    viewMode,
    sidebarOpen,
    
    // Actions
    setConversations,
    setSelectedItems,
    setSelectedConversationId,
    setViewMode,
    setSidebarOpen,
    createConversation,
    sendMessage,
    clearSelection,
    openConversation,
    
    // Filtres
    getConversationsForGroup,
    getConversationsForField,
    fieldBelongsToGroupWithConversation
  };
}

export default useConversation;