import React from 'react';
import HierarchicalView from '@/components/referentials/HierarchicalView';
import { Entity, Conversation } from '@/types';

interface ReferentialContentProps {
  referentials: Entity[];
  searchTerm: string;
  conversations: Conversation[];
  toggleFieldSelection: (entityId: string, fieldId: number | string, fieldName?: string) => void;
  toggleGroupSelection: (entityId: string, groupName: string) => void;
  isFieldSelected: (entityId: string, fieldId: number | string) => boolean;
  isGroupSelected: (entityId: string, groupName: string) => boolean;
  getConversationsForField: (entityId: string, fieldId: number | string) => Conversation[];
  getConversationsForGroup: (entityId: string, groupName: string) => Conversation[];
  hasUnreadConversationsForField: (entityId: string, fieldId: number | string) => boolean;
  hasUnreadConversationsForGroup: (entityId: string, groupName: string) => boolean;
  isConversationsEnabled: boolean;
}

/**
 * Contenu principal affichant les référentiels selon la vue sélectionnée
 */
const ReferentialContent: React.FC<ReferentialContentProps> = ({
  referentials,
  searchTerm,
  conversations,
  toggleFieldSelection,
  toggleGroupSelection,
  isFieldSelected,
  isGroupSelected,
  getConversationsForField,
  getConversationsForGroup,
  hasUnreadConversationsForField,
  hasUnreadConversationsForGroup,
}) => {
  return (
    <>
      {/* Affichage des référentiels (vue hiérarchique uniquement) */}
      <HierarchicalView
        data={referentials}
        searchTerm={searchTerm}
        conversations={conversations}
        toggleFieldSelection={toggleFieldSelection}
        toggleGroupSelection={toggleGroupSelection}
        isFieldSelected={isFieldSelected}
        isGroupSelected={isGroupSelected}
        getConversationsForField={getConversationsForField}
        getConversationsForGroup={getConversationsForGroup}
        hasUnreadConversationsForField={hasUnreadConversationsForField}
        hasUnreadConversationsForGroup={hasUnreadConversationsForGroup}
      />
    </>
  );
};

export default React.memo(ReferentialContent);
