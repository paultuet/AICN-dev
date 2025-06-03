import React, { useEffect } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import useFeatureFlag from '@/hooks/useFeatureFlag';
import { useReferentialFilters } from '@/hooks/useReferentials';
import { getConversationsForField, getConversationsForGroup } from '@/utils/referentialUtils';
import { mockConversations } from '@/mock/conversationsMock';
import { useConversations } from '@/hooks/useConversations';
import { useReferentials } from '@/hooks/useReferentials';
import {
  ReferentialHeader,
  ReferentialContent,
  ConversationSidebarContainer,
} from '@/components/HomePage';

/**
 * Page d'accueil affichant les référentiels et les conversations
 */
const HomePage: React.FC = () => {
  // Feature flags
  const isConversationsFeatureEnabled = useFeatureFlag('conversations');

  // Utiliser React Query pour les référentiels
  const {
    data: referentials = [],
    isLoading: loading,
    error
  } = useReferentials();

  // Utiliser le hook useConversations avec react-query
  const {
    conversations,
    selectedItems,
    selectedConversationId,
    viewMode: sidebarViewMode,
    sidebarOpen,
    setSelectedItems,
    setSidebarOpen,
    createConversation,
    sendMessage,
    clearSelection,
    openConversation,
    setSelectedConversationId,
    setViewMode,
    isLoading: conversationsLoading
  } = useConversations();

  // Gestion des filtres avec react-query optimisé
  const {
    searchTerm,
    selectedEntityId,
    selectedType,
    showOnlyWithConversations,
    setSearchTerm,
    setSelectedEntityId,
    setSelectedType,
    setShowOnlyWithConversations,
    filteredReferentials,
    isLoadingFiltered,
    errorFiltered,
  } = useReferentialFilters({ conversations, isConversationsLoading: conversationsLoading });

  // Note: Les conversations sont maintenant chargées via react-query dans useConversations
  // Plus besoin de useEffect pour charger les conversations mocké


  // Vérifier si un champ est sélectionné
  const isFieldSelected = (entityId: string, fieldId: number | string): boolean => {
    return selectedItems.some(
      selection =>
        (selection.type === 'field' &&
          selection.entityId === entityId &&
          selection.fieldIds?.some(id =>
            id === fieldId ||
            id === Number(fieldId) ||
            String(id) === String(fieldId)
          )) ||
        (selection.type === 'group' &&
          selection.entityId === entityId &&
          referentials.find(e => e['entity-id'] === entityId)?.fields
            .filter(f => 'lib-group' in f && f['lib-group'] === selection.groupName)
            .some(f => {
              if (!('id-field' in f)) return false;
              const idField = f['id-field'];
              return idField === fieldId ||
                idField === Number(fieldId) ||
                String(idField) === String(fieldId);
            }))
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

  // Toggle la sélection d'un champ avec Zustand
  const toggleFieldSelection = (entityId: string, fieldId: number | string, fieldName?: string) => {
    // Forcer l'ouverture du panneau latéral
    setViewMode('selection');
    setSidebarOpen(true);

    // Vérifier si le champ est déjà sélectionné
    const existingFieldIndex = selectedItems.findIndex(
      selection => selection.type === 'field' &&
        selection.entityId === entityId &&
        selection.fieldIds?.some(id =>
          id === fieldId ||
          id === Number(fieldId) ||
          String(id) === String(fieldId)
        )
    );

    // Trouver l'entité
    const entity = referentials.find(e => e['entity-id'] === entityId);
    if (!entity) {
      setSelectedItems([{
        type: 'field',
        entityId,
        fieldIds: [typeof fieldId === 'number' ? fieldId : Number(fieldId) || fieldId],
        fieldName: fieldName || "Champ sélectionné"
      }]);
      return;
    }

    // Trouver le champ
    const field = entity.fields.find(f => {
      if (!('id-field' in f)) return false;
      const idField = f['id-field'];
      return idField === fieldId ||
        idField === Number(fieldId) ||
        String(idField) === String(fieldId);
    });

    if (!field || !('lib-group' in field)) {
      setSelectedItems([{
        type: 'field',
        entityId,
        fieldIds: [typeof fieldId === 'number' ? fieldId : Number(fieldId) || fieldId],
        fieldName: fieldName || "Champ sélectionné"
      }]);
      return;
    }

    const fieldGroupName = field['lib-group'];

    // Vérifier si un groupe contenant ce champ est déjà sélectionné
    const groupSelectedIndex = selectedItems.findIndex(
      selection => selection.type === 'group' &&
        selection.entityId === entityId &&
        selection.groupName === fieldGroupName
    );

    // Si le groupe est déjà sélectionné, ne rien faire car le champ est déjà inclus
    if (groupSelectedIndex >= 0) {
      return;
    }

    // Mettre à jour les sélections
    if (existingFieldIndex >= 0) {
      // Si déjà sélectionné, désélectionner
      setSelectedItems([]);
    } else {
      // Sinon, sélectionner ce champ
      setSelectedItems([{
        type: 'field',
        entityId,
        fieldIds: [typeof fieldId === 'number' ? fieldId : Number(fieldId) || fieldId],
        fieldName: fieldName || ('lib-fonc' in field ? field['lib-fonc'] : undefined)
      }]);
    }
  };

  // Toggle la sélection d'un groupe avec Zustand
  const toggleGroupSelection = (entityId: string, groupName: string) => {
    const existingIndex = selectedItems.findIndex(
      selection => selection.type === 'group' &&
        selection.entityId === entityId &&
        selection.groupName === groupName
    );

    // Mettre à jour les sélections
    if (existingIndex >= 0) {
      // Si déjà sélectionné, désélectionner
      setSelectedItems([]);
    } else {
      // Sinon, sélectionner ce groupe
      setSelectedItems([{
        type: 'group',
        entityId,
        groupName
      }]);

      // Toujours afficher l'écran de sélection, même s'il y a des conversations
      setViewMode('selection');
      setSidebarOpen(true);
    }
  };

  // Afficher le spinner de chargement
  if (loading || isLoadingFiltered || conversationsLoading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  // Afficher le message d'erreur
  if (error || errorFiltered) {
    const errorMessage = error instanceof Error ? error.message : 
                        errorFiltered instanceof Error ? errorFiltered.message : 
                        'Une erreur est survenue';
    return <ErrorMessage message={errorMessage} />;
  }

  return (
    <div className="relative w-full sm:px-3 md:px-4 py-4 sm:py-6 bg-gray-100 min-h-screen">
      {/* Panneau latéral de conversation avec Zustand */}
      {isConversationsFeatureEnabled && (
        <ConversationSidebarContainer
          referentials={referentials}
        />
      )}

      <h1 className="text-3xl md:text-4xl font-bold mb-3 sm:mb-4 md:mb-5 text-primary">
        Référentiels AICN
      </h1>

      <ReferentialHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedEntityId={selectedEntityId}
        onEntityChange={setSelectedEntityId}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        showOnlyWithConversations={showOnlyWithConversations}
        onToggleShowOnlyWithConversations={setShowOnlyWithConversations}
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
        isConversationsEnabled={isConversationsFeatureEnabled}
      />
    </div>
  );
};

export default HomePage;
