import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  ID,
  Selection,
  SidebarViewMode,
} from '@/types';

// Interface pour l'état local (non persisté)
interface ConversationLocalState {
  selectedItems: Selection[];
  selectedConversationId: ID | null;
  viewMode: SidebarViewMode;
  sidebarOpen: boolean;
}

// Interface pour les actions
interface ConversationLocalActions {
  setSelectedItems: (items: Selection[]) => void;
  setSelectedConversationId: (id: ID | null) => void;
  setViewMode: (mode: SidebarViewMode) => void;
  setSidebarOpen: (open: boolean) => void;
  clearSelection: () => void;
  openConversation: (conversationId: ID) => void;
}

interface ConversationContextValue extends ConversationLocalState, ConversationLocalActions {}

// Créer le context
const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

// Provider component
interface ConversationProviderProps {
  children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
  // État local (non persisté)
  const [localState, setLocalState] = useState<ConversationLocalState>({
    selectedItems: [],
    selectedConversationId: null,
    viewMode: 'selection' as SidebarViewMode,
    sidebarOpen: false,
  });

  // Actions
  const setSelectedItems = useCallback((items: Selection[]) => {
    setLocalState(prev => ({ ...prev, selectedItems: items }));
  }, []);

  const setSelectedConversationId = useCallback((id: ID | null) => {
    setLocalState(prev => ({ ...prev, selectedConversationId: id }));
  }, []);

  const setViewMode = useCallback((mode: SidebarViewMode) => {
    setLocalState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setLocalState(prev => ({ ...prev, sidebarOpen: open }));
  }, []);

  const clearSelection = useCallback(() => {
    setLocalState({
      selectedItems: [],
      selectedConversationId: null,
      viewMode: 'selection',
      sidebarOpen: false,
    });
  }, []);

  const openConversation = useCallback((conversationId: ID) => {
    setLocalState(prev => ({
      ...prev,
      selectedConversationId: conversationId,
      viewMode: 'conversation',
      sidebarOpen: true,
    }));
  }, []);

  const contextValue: ConversationContextValue = {
    // État
    ...localState,

    // Actions
    setSelectedItems,
    setSelectedConversationId,
    setViewMode,
    setSidebarOpen,
    clearSelection,
    openConversation,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
};

// Hook pour utiliser le context
export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversationContext must be used within a ConversationProvider');
  }
  return context;
};