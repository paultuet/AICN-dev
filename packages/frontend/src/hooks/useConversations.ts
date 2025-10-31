import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import api from '@/services/api';
import { useConversationContext } from '@/contexts/ConversationContext';
import {
  Conversation,
  ID,
  Message,
  Selection,
  SidebarViewMode,
  EntityId,
  FieldId,
  GroupName,
} from '@/types';

// Types pour les réponses API
interface ConversationsResponse {
  conversations: Conversation[];
}

interface CreateConversationRequest {
  title: string;
  linkedItems: Selection[];
}

interface SendMessageRequest {
  content: string;
  userId: string;
  userFullName: string;
}

// Interface pour les actions spécifiques aux conversations (mutations)
interface ConversationMutationActions {
  createConversation: (title: string) => Promise<void>;
  sendMessage: (conversationId: ID, content: string, userId: string, userFullName: string) => Promise<void>;
}

// Interface pour les filtres
interface ConversationFilters {
  getConversationsForGroup: (entityId: EntityId, groupName: GroupName) => Conversation[];
  getConversationsForField: (entityId: EntityId, fieldId: FieldId) => Conversation[];
  fieldBelongsToGroupWithConversation: (
    entityId: EntityId,
    fieldId: FieldId,
    fields: { 'id-field': FieldId; 'lib-group': string }[]
  ) => boolean;
}

interface UseConversationsResult extends ConversationMutationActions, ConversationFilters {
  // État partagé (du context)
  selectedItems: Selection[];
  selectedConversationId: ID | null;
  viewMode: SidebarViewMode;
  sidebarOpen: boolean;
  setSelectedItems: (items: Selection[]) => void;
  setSelectedConversationId: (id: ID | null) => void;
  setViewMode: (mode: SidebarViewMode) => void;
  setSidebarOpen: (open: boolean) => void;
  clearSelection: () => void;
  openConversation: (conversationId: ID) => void;
  
  // Données des conversations (react-query)
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  isCreating: boolean;
  isSending: boolean;

  // Actions pour la gestion du statut lu/non-lu
  markConversationAsRead: (conversationId: ID) => Promise<void>;
  markConversationAsUnread: (conversationId: ID) => Promise<void>;
  unreadCount: number;
  isMarkingAsRead: boolean;
  isMarkingAsUnread: boolean;

  // Fonctions pour les conversations non-lues
  hasUnreadConversationsForGroup: (entityId: EntityId, groupName: GroupName) => boolean;
  hasUnreadConversationsForField: (entityId: EntityId, fieldId: FieldId) => boolean;
}

// Fonctions API
const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await api.get<ConversationsResponse>('/conversations');
    return response.data.conversations || [];
  } catch (error) {
    // Fallback vers les mocks en cas d'erreur
    const { mockConversations } = await import('@/mock/conversationsMock');
    return mockConversations;
  }
};

const createConversationAPI = async (data: CreateConversationRequest): Promise<Conversation> => {
  const response = await api.post<Conversation>('/conversations', data);
  return response.data;
};

const sendMessageAPI = async (conversationId: ID, data: SendMessageRequest): Promise<Message> => {
  const response = await api.post<Message>(`/conversations/${conversationId}/messages`, data);
  return response.data;
};

// Hook principal
export const useConversations = (): UseConversationsResult => {
  const queryClient = useQueryClient();

  // Utiliser le context pour l'état local partagé
  const {
    selectedItems,
    selectedConversationId,
    viewMode,
    sidebarOpen,
    setSelectedItems,
    setSelectedConversationId,
    setViewMode,
    setSidebarOpen,
    clearSelection,
    openConversation,
  } = useConversationContext();

  // Query pour récupérer les conversations
  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Mutation pour créer une conversation
  const createConversationMutation = useMutation({
    mutationFn: createConversationAPI,
    onSuccess: (newConversation) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['conversations'], (old: Conversation[] = []) => 
        [newConversation, ...old]
      );
      
      // Ouvrir la conversation créée
      openConversation(newConversation.id);
    },
  });

  // Mutation pour envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: ID; data: SendMessageRequest }) =>
      sendMessageAPI(conversationId, data),
    onSuccess: (newMessage, { conversationId }) => {
      // Mettre à jour le cache des conversations
      queryClient.setQueryData(['conversations'], (old: Conversation[] = []) =>
        old.map(conversation => {
          if (conversation.id === conversationId) {
            return {
              ...conversation,
              messages: [...(conversation.messages || []), newMessage],
              messageCount: (conversation.messageCount || 0) + 1,
              lastActivity: newMessage.createdAt,
            };
          }
          return conversation;
        })
      );
    },
  });

  // Mutation pour marquer une conversation comme lue
  const markAsReadMutation = useMutation({
    mutationFn: (conversationId: ID) =>
      api.put(`/conversations/${conversationId}/read`),
    onSuccess: (_, conversationId) => {
      // Mettre à jour le cache des conversations
      queryClient.setQueryData(['conversations'], (old: Conversation[] = []) =>
        old.map(conversation => {
          if (conversation.id === conversationId) {
            return {
              ...conversation,
              readStatus: {
                isRead: true,
                lastReadAt: new Date().toISOString(),
              },
            };
          }
          return conversation;
        })
      );
      // Invalider le cache du compteur
      queryClient.invalidateQueries({ queryKey: ['conversations', 'unread-count'] });
    },
  });

  // Mutation pour marquer une conversation comme non-lue
  const markAsUnreadMutation = useMutation({
    mutationFn: (conversationId: ID) =>
      api.delete(`/conversations/${conversationId}/read`),
    onSuccess: (_, conversationId) => {
      // Mettre à jour le cache des conversations
      queryClient.setQueryData(['conversations'], (old: Conversation[] = []) =>
        old.map(conversation => {
          if (conversation.id === conversationId) {
            return {
              ...conversation,
              readStatus: {
                isRead: false,
                lastReadAt: undefined,
              },
            };
          }
          return conversation;
        })
      );
      // Invalider le cache du compteur
      queryClient.invalidateQueries({ queryKey: ['conversations', 'unread-count'] });
    },
  });

  // Query pour récupérer le compteur de conversations non-lues
  const unreadCountQuery = useQuery({
    queryKey: ['conversations', 'unread-count'],
    queryFn: () => api.get('/conversations/unread-count').then(res => res.data.unreadCount),
    refetchInterval: 30000, // Rafraîchit toutes les 30s
  });

  // Actions spécifiques aux mutations
  const createConversation = useCallback(async (title: string) => {
    if (selectedItems.length === 0) return;

    await createConversationMutation.mutateAsync({
      title: title || 'Nouvelle conversation',
      linkedItems: [...selectedItems],
    });
  }, [selectedItems, createConversationMutation]);

  const sendMessage = useCallback(async (
    conversationId: ID,
    content: string,
    userId: string,
    userFullName: string
  ) => {
    await sendMessageMutation.mutateAsync({
      conversationId,
      data: { content, userId, userFullName },
    });
  }, [sendMessageMutation]);

  // Actions pour la gestion du statut lu/non-lu
  const markConversationAsRead = useCallback(async (conversationId: ID) => {
    await markAsReadMutation.mutateAsync(conversationId);
  }, [markAsReadMutation]);

  const markConversationAsUnread = useCallback(async (conversationId: ID) => {
    await markAsUnreadMutation.mutateAsync(conversationId);
  }, [markAsUnreadMutation]);

  // Filtres - utilisation de useMemo pour éviter les recalculs
  const conversations = conversationsQuery.data || [];

  const getConversationsForGroup = useCallback((entityId: EntityId, groupName: GroupName) => {
    return conversations.filter((conversation) =>
      conversation.linkedItems.some(
        (item) =>
          item.type === 'group' && item.entityId === entityId && item.groupName === groupName
      )
    );
  }, [conversations]);

  const getConversationsForField = useCallback((entityId: EntityId, fieldId: FieldId) => {
    return conversations.filter((conversation) =>
      conversation.linkedItems.some(
        (item) =>
          item.type === 'field' &&
          item.entityId === entityId &&
          item.fieldIds?.some(
            (id) => id === fieldId || id === Number(fieldId) || String(id) === String(fieldId)
          )
      )
    );
  }, [conversations]);

  const fieldBelongsToGroupWithConversation = useCallback((
    entityId: EntityId,
    fieldId: FieldId,
    fields: { 'id-field': FieldId; 'lib-group': string }[]
  ) => {
    // Trouver le champ correspondant
    const field = fields.find((f) => {
      const idField = f['id-field'];
      return (
        idField === fieldId ||
        idField === Number(fieldId) ||
        String(idField) === String(fieldId)
      );
    });

    if (!field) return false;

    // Vérifier si le groupe du champ a des conversations
    const groupName = field['lib-group'];
    
    return conversations.some((conversation) =>
      conversation.linkedItems.some(
        (item) =>
          item.type === 'group' && item.entityId === entityId && item.groupName === groupName
      )
    );
  }, [conversations]);

  // Nouvelles fonctions pour vérifier les conversations non-lues
  const hasUnreadConversationsForGroup = useCallback((entityId: EntityId, groupName: GroupName) => {
    return conversations.some(conversation =>
      conversation.linkedItems.some(item =>
        item.type === 'group' && item.entityId === entityId && item.groupName === groupName
      ) && conversation.readStatus && !conversation.readStatus.isRead
    );
  }, [conversations]);

  const hasUnreadConversationsForField = useCallback((entityId: EntityId, fieldId: FieldId) => {
    return conversations.some(conversation =>
      conversation.linkedItems.some(item =>
        item.type === 'field' &&
        item.entityId === entityId &&
        item.fieldIds?.some(
          (id) => id === fieldId || id === Number(fieldId) || String(id) === String(fieldId)
        )
      ) && conversation.readStatus && !conversation.readStatus.isRead
    );
  }, [conversations]);

  return {
    // État partagé (du context)
    selectedItems,
    selectedConversationId,
    viewMode,
    sidebarOpen,
    setSelectedItems,
    setSelectedConversationId,
    setViewMode,
    setSidebarOpen,
    clearSelection,
    openConversation,

    // Données des conversations (react-query)
    conversations,
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    isCreating: createConversationMutation.isPending,
    isSending: sendMessageMutation.isPending,

    // Actions spécifiques aux mutations
    createConversation,
    sendMessage,

    // Actions pour la gestion du statut lu/non-lu
    markConversationAsRead,
    markConversationAsUnread,
    unreadCount: unreadCountQuery.data || 0,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAsUnread: markAsUnreadMutation.isPending,

    // Filtres
    getConversationsForGroup,
    getConversationsForField,
    fieldBelongsToGroupWithConversation,
    
    // Fonctions pour les conversations non-lues
    hasUnreadConversationsForGroup,
    hasUnreadConversationsForField,
  };
};

export default useConversations;
