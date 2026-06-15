import React from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import useFeatureFlag from '@/hooks/useFeatureFlag';
import { useReferentialFilters } from '@/hooks/useReferentials';
import { getConversationsForField, getConversationsForGroup } from '@/utils/referentialUtils';
import { useConversations } from '@/hooks/useConversations';
import { useReferentials } from '@/hooks/useReferentials';
import {
  ReferentialHeader,
  ReferentialContent,
  ConversationSidebarContainer,
} from '@/components/HomePage';
import { PageHead } from '@/components/ui';

/**
 * Page d'accueil affichant les référentiels et les conversations
 */
const HomePage: React.FC = () => {
  const isConversationsFeatureEnabled = useFeatureFlag('conversations');

  const {
    data: referentials = [],
    isLoading: loading,
    error
  } = useReferentials();

  const {
    conversations,
    selectedItems,
    sidebarOpen,
    setSelectedItems,
    setSidebarOpen,
    setViewMode,
    isLoading: conversationsLoading,
    hasUnreadConversationsForField,
    hasUnreadConversationsForGroup
  } = useConversations();

  const {
    searchTerm,
    selectedEntityId,
    showOnlyWithConversations,
    showOnlyUnreadConversations,
    setSearchTerm,
    setSelectedEntityId,
    setShowOnlyWithConversations,
    setShowOnlyUnreadConversations,
    filteredReferentials,
    isLoadingFiltered,
    errorFiltered,
  } = useReferentialFilters({ conversations, isConversationsLoading: conversationsLoading });

  const unreadConversationsCount = conversations.filter(conv =>
    conv.readStatus && !conv.readStatus.isRead
  ).length;

  // Vérifier si un champ est sélectionné
  const isFieldSelected = (entityId: string, fieldId: number | string): boolean => {
    return selectedItems.some(
      selection =>
        selection.type === 'field' &&
        selection.entityId === entityId &&
        selection.fieldIds?.some(id =>
          id === fieldId ||
          String(id) === String(fieldId)
        )
    );
  };

  // Vérifier si un groupe est sélectionné
  const isGroupSelected = (entityId: string, groupName: string): boolean => {
    return selectedItems.some(
      selection => selection.type === 'group' &&
        selection.entityId === entityId &&
        selection.groupName === groupName
    );
  };

  const toggleFieldSelection = (entityId: string, fieldId: number | string, fieldName?: string) => {
    setViewMode('selection');
    setSidebarOpen(true);

    const existingFieldIndex = selectedItems.findIndex(
      selection => selection.type === 'field' &&
        selection.entityId === entityId &&
        selection.fieldIds?.some(id =>
          id === fieldId ||
          String(id) === String(fieldId)
        )
    );

    if (existingFieldIndex >= 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems([{
        type: 'field',
        entityId,
        fieldIds: [fieldId],
        fieldName: fieldName || "Champ sélectionné"
      }]);
    }
  };

  const toggleGroupSelection = (entityId: string, groupName: string) => {
    const existingIndex = selectedItems.findIndex(
      selection => selection.type === 'group' &&
        selection.entityId === entityId &&
        selection.groupName === groupName
    );

    if (existingIndex >= 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems([{
        type: 'group',
        entityId,
        groupName
      }]);
      setViewMode('selection');
      setSidebarOpen(true);
    }
  };

  if (loading || isLoadingFiltered || conversationsLoading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  if (error || errorFiltered) {
    const errorMessage = error instanceof Error ? error.message :
                        errorFiltered instanceof Error ? errorFiltered.message :
                        'Une erreur est survenue';
    return <ErrorMessage message={errorMessage} />;
  }

  return (
    <div className="view relative w-full max-w-[1480px] mx-auto px-4 sm:px-6 md:px-7 py-6 md:py-8 pb-20 min-h-screen">
      {isConversationsFeatureEnabled && (
        <ConversationSidebarContainer
          referentials={referentials}
        />
      )}

      <PageHead
        eyebrow="Dictionnaire de données"
        title="Référentiels"
        accent="FIDJI · AICN"
        sub="Structure hiérarchique du modèle de données d'interopérabilité — équipements, maintenance, énergie et documentation."
        stats={[{ value: referentials.length, label: 'Entités N1' }]}
      />

      <ReferentialHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedEntityId={selectedEntityId}
        onEntityChange={setSelectedEntityId}
        showOnlyWithConversations={showOnlyWithConversations}
        onToggleShowOnlyWithConversations={setShowOnlyWithConversations}
        showOnlyUnreadConversations={showOnlyUnreadConversations}
        onToggleShowOnlyUnreadConversations={setShowOnlyUnreadConversations}
        unreadConversationsCount={unreadConversationsCount}
        entities={referentials}
        isConversationsEnabled={isConversationsFeatureEnabled}
      />

      <ReferentialContent
        referentials={filteredReferentials}
        searchTerm={searchTerm}
        conversations={conversations}
        toggleFieldSelection={toggleFieldSelection}
        toggleGroupSelection={toggleGroupSelection}
        isFieldSelected={isFieldSelected}
        isGroupSelected={isGroupSelected}
        getConversationsForField={(entityId, fieldId) => getConversationsForField(conversations, entityId, fieldId)}
        getConversationsForGroup={(entityId, groupName) => getConversationsForGroup(conversations, entityId, groupName)}
        hasUnreadConversationsForField={hasUnreadConversationsForField}
        hasUnreadConversationsForGroup={hasUnreadConversationsForGroup}
        isConversationsEnabled={isConversationsFeatureEnabled}
      />
    </div>
  );
};

export default HomePage;
