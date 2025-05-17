import { useState, useCallback, useMemo } from 'react';
import { 
  Entity, 
  Field, 
  Conversation, 
  EntityId, 
  FilterPredicate 
} from '@/types';
import { 
  groupHasConversations, 
  groupHasFieldsWithConversations 
} from '@/utils/referentialUtils';

interface ReferentialFiltersState {
  searchTerm: string;
  selectedEntityId: EntityId | null;
  selectedType: string | null;
  showOnlyWithConversations: boolean;
}

interface ReferentialFiltersActions {
  setSearchTerm: (term: string) => void;
  setSelectedEntityId: (id: EntityId | null) => void;
  setSelectedType: (type: string | null) => void;
  setShowOnlyWithConversations: (show: boolean) => void;
}

interface ReferentialFilterPredicates {
  shouldDisplayEntity: FilterPredicate<Entity>;
  shouldDisplayGroup: (entityId: EntityId, groupName: string, fields: Field[]) => boolean;
  shouldDisplayField: (entityId: EntityId, fieldId: number | string, fields: Field[]) => boolean;
}

interface UseReferentialFiltersProps {
  conversations: Conversation[];
}

interface UseReferentialFiltersResult extends ReferentialFiltersState, ReferentialFiltersActions, ReferentialFilterPredicates {
  filterReferentials: (referentials: Entity[]) => Entity[];
}

/**
 * Hook pour gérer les filtres de référentiels
 * Utilise une approche fonctionnelle avec des prédicats pour le filtrage
 */
export function useReferentialFilters({ conversations }: UseReferentialFiltersProps): UseReferentialFiltersResult {
  // État local pour les filtres
  const [filters, setFilters] = useState<ReferentialFiltersState>({
    searchTerm: '',
    selectedEntityId: null,
    selectedType: 'NMR', // Sélectionne 'NMR' par défaut
    showOnlyWithConversations: false
  });

  // Actions pour mettre à jour les filtres
  const setSearchTerm = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  const setSelectedEntityId = useCallback((selectedEntityId: EntityId | null) => {
    setFilters(prev => ({ ...prev, selectedEntityId }));
  }, []);

  const setSelectedType = useCallback((selectedType: string | null) => {
    setFilters(prev => ({
      ...prev,
      selectedType,
      selectedEntityId: null // Réinitialiser l'entité sélectionnée quand le type change
    }));
  }, []);

  const setShowOnlyWithConversations = useCallback((showOnlyWithConversations: boolean) => {
    setFilters(prev => ({ ...prev, showOnlyWithConversations }));
  }, []);

  // Prédicat pour vérifier si une entité correspond aux filtres
  const shouldDisplayEntity = useMemo<FilterPredicate<Entity>>(() => {
    const { searchTerm, selectedEntityId, selectedType, showOnlyWithConversations } = filters;
    
    return (entity: Entity): boolean => {
      // Filtre par ID d'entité sélectionnée
      if (selectedEntityId && entity['entity-id'] !== selectedEntityId) {
        return false;
      }

      // Filtre par type de référentiel
      if (selectedType && entity.type !== selectedType) {
        return false;
      }
      
      // Filtre par terme de recherche
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        
        // Recherche dans le nom de l'entité
        if (entity['entity-name'].toLowerCase().includes(searchTermLower)) {
          return true;
        }
        
        // Recherche dans les champs
        const hasMatchingField = entity.fields.some(field => 
          'lib-fonc' in field && field['lib-fonc']?.toLowerCase().includes(searchTermLower) ||
          ('desc' in field && field.desc && field.desc.toLowerCase().includes(searchTermLower)) ||
          ('lib-group' in field && field['lib-group']?.toLowerCase().includes(searchTermLower))
        );
        
        if (!hasMatchingField) {
          return false;
        }
      }
      
      // Filtre par présence de conversations
      if (showOnlyWithConversations) {
        // Vérifier si l'entité a des groupes ou des champs avec des conversations
        const hasConversations = entity.fields.some(field => {
          // Vérifier si le champ a une propriété lib-group
          if (!('lib-group' in field)) return false;
          
          // Vérifier si le champ a des conversations directes
          const fieldHasConversations = conversations.some(conv => 
            conv.linkedItems.some(item => 
              item.type === 'field' && 
              item.entityId === entity['entity-id'] && 
              item.fieldIds?.some(id => id === field['id-field'] || String(id) === String(field['id-field']))
            )
          );
          
          // Vérifier si le groupe du champ a des conversations
          const groupHasConvs = groupHasConversations(conversations, entity['entity-id'], field['lib-group']);
          
          return fieldHasConversations || groupHasConvs;
        });
        
        if (!hasConversations) {
          return false;
        }
      }
      
      return true;
    };
  }, [filters, conversations]);

  // Prédicat pour filtrer les référentiels
  const filterReferentials = useCallback((referentials: Entity[]): Entity[] => {
    return referentials.filter(shouldDisplayEntity);
  }, [shouldDisplayEntity]);

  // Prédicat pour vérifier si un groupe doit être affiché quand le filtre est actif
  const shouldDisplayGroup = useCallback((entityId: EntityId, groupName: string, fields: Field[]): boolean => {
    const { showOnlyWithConversations } = filters;
    
    if (!showOnlyWithConversations) return true;
    
    // Vérifier si le groupe a des conversations directes
    const hasGroupConversations = groupHasConversations(conversations, entityId, groupName);
    if (hasGroupConversations) return true;
    
    // Vérifier si un champ du groupe a des conversations directes
    const hasFieldConversations = groupHasFieldsWithConversations(conversations, entityId, fields);
    return hasFieldConversations;
  }, [filters.showOnlyWithConversations, conversations]);

  // Prédicat pour vérifier si un champ doit être affiché quand le filtre est actif
  const shouldDisplayField = useCallback((entityId: EntityId, fieldId: number | string, fields: Field[]): boolean => {
    const { showOnlyWithConversations } = filters;
    
    if (!showOnlyWithConversations) return true;

    // Trouver le champ dans les données
    const field = fields.find(f => {
      const idField = f['id-field'];
      return idField === fieldId || idField === Number(fieldId) || String(idField) === String(fieldId);
    });
    
    if (!field) return false;
    
    // Vérifier si le champ a des conversations directes
    const hasDirectConversations = conversations.some(conversation => 
      conversation.linkedItems.some(item => 
        item.type === 'field' && 
        item.entityId === entityId && 
        item.fieldIds?.some(id => 
          id === fieldId || id === Number(fieldId) || String(id) === String(fieldId)
        )
      )
    );
    
    if (hasDirectConversations) return true;
    
    // Vérifier si le champ appartient à un groupe avec des conversations
    const groupName = field['lib-group'];
    const belongsToGroupWithConversation = groupHasConversations(conversations, entityId, groupName);
    
    return belongsToGroupWithConversation;
  }, [filters.showOnlyWithConversations, conversations]);

  return {
    // État
    searchTerm: filters.searchTerm,
    selectedEntityId: filters.selectedEntityId,
    selectedType: filters.selectedType,
    showOnlyWithConversations: filters.showOnlyWithConversations,
    
    // Actions
    setSearchTerm,
    setSelectedEntityId,
    setSelectedType,
    setShowOnlyWithConversations,
    
    // Prédicats et filtres
    filterReferentials,
    shouldDisplayEntity,
    shouldDisplayGroup,
    shouldDisplayField
  };
}

export default useReferentialFilters;