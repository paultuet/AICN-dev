import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

// Interface pour l'état global des conversations
interface ConversationState {
  // État
  conversations: Conversation[];
  selectedItems: Selection[];
  selectedConversationId: ID | null;
  viewMode: SidebarViewMode;
  sidebarOpen: boolean;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setSelectedItems: (items: Selection[]) => void;
  setSelectedConversationId: (id: ID | null) => void;
  setViewMode: (mode: SidebarViewMode) => void;
  setSidebarOpen: (open: boolean) => void;
  createConversation: (title: string) => void;
  sendMessage: (conversationId: ID, content: string) => void;
  clearSelection: () => void;
  openConversation: (conversationId: ID) => void;

  // Filtres
  getConversationsForGroup: (entityId: EntityId, groupName: GroupName) => Conversation[];
  getConversationsForField: (entityId: EntityId, fieldId: FieldId) => Conversation[];
  fieldBelongsToGroupWithConversation: (
    entityId: EntityId,
    fieldId: FieldId,
    fields: { 'id-field': FieldId; 'lib-group': string }[]
  ) => boolean;
}

// Créer le store avec Zustand
export const useConversationStore = create<ConversationState>()(
  // Utiliser le middleware persist pour sauvegarder l'état dans le localStorage
  persist(
    (set, get) => ({
      // État initial
      conversations: [],
      selectedItems: [],
      selectedConversationId: null,
      viewMode: 'selection' as SidebarViewMode,
      sidebarOpen: false,

      // Actions
      setConversations: (conversations) => set({ conversations }),
      
      setSelectedItems: (items) => set({ selectedItems: items }),
      
      setSelectedConversationId: (id) => set({ selectedConversationId: id }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      createConversation: (title) => {
        const { selectedItems } = get();
        if (selectedItems.length === 0) return;

        const newConversation: Conversation = {
          id: `new-${Date.now()}`,
          title: title || 'Nouvelle conversation',
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          messageCount: 0,
          linkedItems: [...selectedItems],
          messages: [],
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          selectedConversationId: newConversation.id,
          viewMode: 'conversation',
        }));

        // Ici, on pourrait ajouter un appel API pour enregistrer la conversation
        // await api.post('/conversations', newConversation);
      },
      
      sendMessage: (conversationId, content) => {
        const { conversations } = get();
        const currentConversation = conversations.find((c) => c.id === conversationId);

        if (!currentConversation) return;

        const newMessage: Message = {
          id: `m${Date.now()}`,
          conversationId,
          content,
          createdAt: new Date().toISOString(),
          authorId: 'user1', // À remplacer par l'ID de l'utilisateur actuel
          authorName: 'Julien Dupont', // À remplacer par le nom de l'utilisateur actuel
        };

        const updatedConversation = {
          ...currentConversation,
          messages: [...(currentConversation.messages || []), newMessage],
          messageCount: (currentConversation.messageCount || 0) + 1,
          lastActivity: new Date().toISOString(),
        };

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? updatedConversation : c
          ),
        }));

        // Ici, on pourrait ajouter l'appel API pour enregistrer le message
        // await api.post(`/conversations/${conversationId}/messages`, newMessage);
      },
      
      clearSelection: () => {
        set({
          selectedItems: [],
          selectedConversationId: null,
          viewMode: 'selection',
          sidebarOpen: false,
        });
      },
      
      openConversation: (conversationId) => {
        set({
          selectedConversationId: conversationId,
          viewMode: 'conversation',
          sidebarOpen: true,
        });
      },

      // Filtres
      getConversationsForGroup: (entityId, groupName) => {
        const { conversations } = get();
        return conversations.filter((conversation) =>
          conversation.linkedItems.some(
            (item) =>
              item.type === 'group' && item.entityId === entityId && item.groupName === groupName
          )
        );
      },
      
      getConversationsForField: (entityId, fieldId) => {
        const { conversations } = get();
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
      },
      
      fieldBelongsToGroupWithConversation: (entityId, fieldId, fields) => {
        const { conversations } = get();
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
      },
    }),
    {
      name: 'conversation-storage', // Nom du stockage dans le localStorage
      partialize: (state) => ({
        conversations: state.conversations,
        // Ne pas persister les éléments transitoires
        // selectedItems: [],
        // selectedConversationId: null,
        // viewMode: 'selection',
        // sidebarOpen: false
      }),
    }
  )
);

export default useConversationStore;