import { useState, useCallback } from 'react';
import { Entity, Field } from '../types/referential';
import { Conversation } from '../types/conversation';
import { 
  groupHasConversations, 
  groupHasFieldsWithConversations 
} from '../utils/referentialUtils';

interface UseReferentialFiltersProps {
  conversations: Conversation[];
}

export function useReferentialFilters({ conversations }: UseReferentialFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showOnlyWithConversations, setShowOnlyWithConversations] = useState(false);

  // Filtrer les référentiels en fonction des critères
  const filterReferentials = useCallback((referentials: Entity[]): Entity[] => {
    return referentials.filter(entity => {
      // Filtrer par entité sélectionnée s'il y en a une
      if (selectedEntityId && entity['entity-id'] !== selectedEntityId) {
        return false;
      }
      
      // Filtrer par terme de recherche
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        
        // Rechercher dans le nom de l'entité
        if (entity['entity-name'].toLowerCase().includes(searchTermLower)) {
          return true;
        }
        
        // Rechercher dans les champs
        const hasMatchingField = entity.fields.some(field => 
          field['lib-fonc'].toLowerCase().includes(searchTermLower) ||
          (field.desc && field.desc.toLowerCase().includes(searchTermLower)) ||
          field['lib-group'].toLowerCase().includes(searchTermLower)
        );
        
        if (!hasMatchingField) {
          return false;
        }
      }
      
      return true;
    });
  }, [selectedEntityId, searchTerm]);

  // Vérifier si un groupe doit être affiché quand le filtre est actif
  const shouldDisplayGroup = useCallback((entityId: string, groupName: string, fields: Field[]): boolean => {
    if (!showOnlyWithConversations) return true;
    
    // Vérifier si le groupe a des conversations directes
    const hasGroupConversations = groupHasConversations(conversations, entityId, groupName);
    if (hasGroupConversations) return true;
    
    // Vérifier si un champ du groupe a des conversations directes
    const hasFieldConversations = groupHasFieldsWithConversations(conversations, entityId, fields);
    return hasFieldConversations;
  }, [showOnlyWithConversations, conversations]);

  // Vérifier si un champ doit être affiché quand le filtre est actif
  const shouldDisplayField = useCallback((entityId: string, fieldId: number, fields: Field[]): boolean => {
    if (!showOnlyWithConversations) return true;

    // Trouver le champ dans les données
    const field = fields.find(f => f['id-field'] === fieldId);
    if (!field) return false;
    
    // Vérifier si le champ a des conversations directes
    const hasDirectConversations = conversations.some(conversation => 
      conversation.linkedItems.some(item => 
        item.type === 'field' && 
        item.entityId === entityId && 
        item.fieldIds?.includes(fieldId)
      )
    );
    if (hasDirectConversations) return true;
    
    // Vérifier si le champ appartient à un groupe avec des conversations
    const groupName = field['lib-group'];
    const belongsToGroupWithConversation = groupHasConversations(conversations, entityId, groupName);
    return belongsToGroupWithConversation;
  }, [showOnlyWithConversations, conversations]);

  return {
    searchTerm,
    setSearchTerm,
    selectedEntityId,
    setSelectedEntityId,
    showOnlyWithConversations,
    setShowOnlyWithConversations,
    filterReferentials,
    shouldDisplayGroup,
    shouldDisplayField
  };
}

export default useReferentialFilters;