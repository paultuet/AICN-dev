import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import api from '@/services/api';
import { Entity, SourceField } from '@/types/referential';
import {
  Conversation,
  EntityId,
  FilterPredicate
} from '@/types';

interface ReferentialFiltersState {
  searchTerm: string;
  selectedEntityId: EntityId | null;
  showOnlyWithConversations: boolean;
  showOnlyUnreadConversations: boolean;
}

interface ReferentialFiltersActions {
  setSearchTerm: (term: string) => void;
  setSelectedEntityId: (id: EntityId | null) => void;
  setShowOnlyWithConversations: (show: boolean) => void;
  setShowOnlyUnreadConversations: (show: boolean) => void;
}

interface ReferentialFilterPredicates {
  shouldDisplayEntity: FilterPredicate<Entity>;
  shouldDisplayGroup: (entityId: EntityId, groupName: string, fields: (SourceField)[]) => boolean;
  shouldDisplayField: (entityId: EntityId, fieldId: number | string, fields: (SourceField)[]) => boolean;
}

interface UseReferentialFiltersProps {
  conversations: Conversation[];
  isConversationsLoading?: boolean;
}

interface UseReferentialFiltersResult extends ReferentialFiltersState, ReferentialFiltersActions, ReferentialFilterPredicates {
  filteredReferentials: Entity[];
  isLoadingFiltered: boolean;
  errorFiltered: Error | null;
}

const fetchReferentials = async (): Promise<Entity[]> => {
  const response = await api.get<Entity[]>('/referentiels');
  return response.data;
};

export const useReferentials = () => {
  return useQuery({
    queryKey: ['referentials'],
    queryFn: fetchReferentials,
  });
};

/**
 * Hook pour gérer les filtres de référentiels avec react-query
 */
export function useReferentialFilters({ conversations, isConversationsLoading = false }: UseReferentialFiltersProps): UseReferentialFiltersResult {
  const [filters, setFilters] = useState<ReferentialFiltersState>({
    searchTerm: '',
    selectedEntityId: null,
    showOnlyWithConversations: false,
    showOnlyUnreadConversations: false
  });

  const setSearchTerm = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  const setSelectedEntityId = useCallback((selectedEntityId: EntityId | null) => {
    setFilters(prev => ({ ...prev, selectedEntityId }));
  }, []);

  const setShowOnlyWithConversations = useCallback((showOnlyWithConversations: boolean) => {
    setFilters(prev => ({ ...prev, showOnlyWithConversations }));
  }, []);

  const setShowOnlyUnreadConversations = useCallback((showOnlyUnreadConversations: boolean) => {
    setFilters(prev => ({ ...prev, showOnlyUnreadConversations }));
  }, []);

  // Prédicat pour vérifier si une entité correspond aux filtres
  const shouldDisplayEntity = useMemo<FilterPredicate<Entity>>(() => {
    const { searchTerm, selectedEntityId, showOnlyWithConversations, showOnlyUnreadConversations } = filters;

    return (entity: Entity): boolean => {
      // Filtre par ID d'entité sélectionnée
      if (selectedEntityId && entity['entity-id'] !== selectedEntityId) {
        return false;
      }

      // Filtre par terme de recherche
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();

        // Recherche dans le nom de l'entité
        if (entity['entity-name'].toLowerCase().includes(searchTermLower)) {
          return true;
        }

        // Recherche récursive dans les champs
        const hasMatchingField = entity.fields.some(field => {
          // SourceField (leaf)
          if ('code-champ' in field) {
            const sf = field as SourceField;
            return (
              (sf.libelle?.toLowerCase().includes(searchTermLower)) ||
              (sf['code-champ']?.toLowerCase().includes(searchTermLower)) ||
              (sf.commentaire?.toLowerCase().includes(searchTermLower)) ||
              (sf['nom-champ-code']?.toLowerCase().includes(searchTermLower))
            );
          }
          // Entity (NIV2)
          if ('entity-name' in field && 'fields' in field) {
            const subEntity = field as Entity;
            if (subEntity['entity-name']?.toLowerCase().includes(searchTermLower)) {
              return true;
            }
            return subEntity.fields?.some(subField => {
              if ('code-champ' in subField) {
                const sf = subField as SourceField;
                return (
                  (sf.libelle?.toLowerCase().includes(searchTermLower)) ||
                  (sf['code-champ']?.toLowerCase().includes(searchTermLower)) ||
                  (sf.commentaire?.toLowerCase().includes(searchTermLower)) ||
                  (sf['nom-champ-code']?.toLowerCase().includes(searchTermLower))
                );
              }
              if ('entity-name' in subField) {
                return subField['entity-name']?.toLowerCase().includes(searchTermLower);
              }
              return false;
            }) ?? false;
          }
          // Legacy Field (LoV)
          if ('entity-name' in field) {
            return field['entity-name']?.toLowerCase().includes(searchTermLower);
          }
          return false;
        });

        if (!hasMatchingField) {
          return false;
        }
      }

      // Filtre par présence de conversations
      if (showOnlyWithConversations && !isConversationsLoading) {
        const hasConversations = conversations.some(conv =>
          conv.linkedItems.some(item => item.entityId === entity['entity-id'])
        );

        if (!hasConversations) {
          // Check descendants
          const hasDescendantConversations = entity.fields?.some(field => {
            const fieldEntityId = 'entity-id' in field ? (field as Entity | SourceField)['entity-id'] : undefined;
            if (!fieldEntityId) return false;

            const hasConv = conversations.some(conv =>
              conv.linkedItems.some(item => item.entityId === fieldEntityId)
            );
            if (hasConv) return true;

            // Check NIV2 children
            if ('fields' in field && Array.isArray((field as Entity).fields)) {
              return (field as Entity).fields.some(subField => {
                const subId = 'entity-id' in subField ? (subField as Entity | SourceField)['entity-id'] : undefined;
                return subId && conversations.some(conv =>
                  conv.linkedItems.some(item => item.entityId === subId)
                );
              });
            }
            return false;
          }) ?? false;

          if (!hasDescendantConversations) return false;
        }
      }

      // Filtre par conversations non lues
      if (showOnlyUnreadConversations && !isConversationsLoading) {
        const hasUnreadConversations = conversations.some(conv =>
          conv.linkedItems.some(item => item.entityId === entity['entity-id']) &&
          conv.readStatus && !conv.readStatus.isRead
        );

        if (!hasUnreadConversations) {
          return false;
        }
      }

      return true;
    };
  }, [filters, conversations, isConversationsLoading]);

  const referentialsQuery = useReferentials();

  const filteredReferentials = useMemo(() => {
    if (!referentialsQuery.data) return [];

    if ((filters.showOnlyWithConversations || filters.showOnlyUnreadConversations) && conversations.length > 0) {
      const entitiesWithConversations = new Set<string>();
      conversations.forEach(conv => {
        if (filters.showOnlyUnreadConversations) {
          if (conv.readStatus && !conv.readStatus.isRead) {
            conv.linkedItems.forEach(item => {
              entitiesWithConversations.add(item.entityId);
            });
          }
        } else {
          conv.linkedItems.forEach(item => {
            entitiesWithConversations.add(item.entityId);
          });
        }
      });

      const hasDescendantWithConversation = (entity: Entity | SourceField): boolean => {
        if (entitiesWithConversations.has(entity['entity-id'])) {
          return true;
        }
        if ('fields' in entity && Array.isArray((entity as Entity).fields)) {
          return (entity as Entity).fields.some((field) => hasDescendantWithConversation(field as Entity | SourceField));
        }
        return false;
      };

      return referentialsQuery.data
        .filter(entity => hasDescendantWithConversation(entity))
        .map(entity => {
          const filterFieldsRecursively = (fields: (Entity | SourceField)[]): (Entity | SourceField)[] => {
            return fields.filter(field => {
              if (entitiesWithConversations.has(field['entity-id'])) return true;
              if ('fields' in field && Array.isArray((field as Entity).fields)) {
                const filteredChildren = filterFieldsRecursively((field as Entity).fields as (Entity | SourceField)[]);
                if (filteredChildren.length > 0) {
                  (field as Entity).fields = filteredChildren;
                  return true;
                }
              }
              return false;
            });
          };

          return {
            ...entity,
            fields: filterFieldsRecursively(entity.fields as (Entity | SourceField)[])
          };
        });
    }

    return referentialsQuery.data.filter(shouldDisplayEntity);
  }, [referentialsQuery.data, shouldDisplayEntity, filters.showOnlyWithConversations, filters.showOnlyUnreadConversations, conversations]);

  const shouldDisplayGroup = useCallback((entityId: EntityId, groupName: string, _fields: (SourceField)[]): boolean => {
    const { showOnlyWithConversations, showOnlyUnreadConversations } = filters;

    if (!showOnlyWithConversations && !showOnlyUnreadConversations) return true;
    if (isConversationsLoading) return true;

    if (showOnlyUnreadConversations) {
      const groupConversations = conversations.filter(conv =>
        conv.linkedItems.some(item =>
          item.type === 'group' &&
          item.entityId === entityId &&
          item.groupName === groupName
        )
      );
      return groupConversations.some(conv => conv.readStatus && !conv.readStatus.isRead);
    }

    return conversations.some(conv =>
      conv.linkedItems.some(item =>
        item.type === 'group' &&
        item.entityId === entityId &&
        item.groupName === groupName
      )
    );
  }, [conversations, filters, isConversationsLoading]);

  const shouldDisplayField = useCallback((entityId: EntityId, fieldId: number | string, _fields: (SourceField)[]): boolean => {
    const { showOnlyWithConversations, showOnlyUnreadConversations } = filters;

    if (!showOnlyWithConversations && !showOnlyUnreadConversations) return true;
    if (isConversationsLoading) return true;

    const relevantConversations = conversations.filter(conversation =>
      conversation.linkedItems.some(item =>
        item.type === 'field' &&
        item.entityId === entityId &&
        item.fieldIds?.some(id =>
          id === fieldId || String(id) === String(fieldId)
        )
      )
    );

    if (showOnlyUnreadConversations) {
      return relevantConversations.some(conv => conv.readStatus && !conv.readStatus.isRead);
    }

    return relevantConversations.length > 0;
  }, [conversations, filters, isConversationsLoading]);

  return {
    searchTerm: filters.searchTerm,
    selectedEntityId: filters.selectedEntityId,
    showOnlyWithConversations: filters.showOnlyWithConversations,
    showOnlyUnreadConversations: filters.showOnlyUnreadConversations,

    setSearchTerm,
    setSelectedEntityId,
    setShowOnlyWithConversations,
    setShowOnlyUnreadConversations,

    shouldDisplayEntity,
    shouldDisplayGroup,
    shouldDisplayField,

    filteredReferentials,
    isLoadingFiltered: referentialsQuery.isLoading,
    errorFiltered: referentialsQuery.error
  };
}
