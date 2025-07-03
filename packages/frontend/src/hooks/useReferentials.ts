import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import api from '@/services/api';
import { Entity } from '@/types/referential';
import { 
  Field, 
  Conversation, 
  EntityId, 
  FilterPredicate 
} from '@/types';
import { 
  groupHasConversations, 
  groupHasFieldsWithConversations 
} from '@/utils/referentialUtils';

interface ReferentialsResponse {
  NMR?: Entity[];
  LoV?: Entity[];
  RIO?: Entity[];
}

interface ReferentialFiltersState {
  searchTerm: string;
  selectedEntityId: EntityId | null;
  selectedType: string | null;
  showOnlyWithConversations: boolean;
  showOnlyUnreadConversations: boolean;
}

interface ReferentialFiltersActions {
  setSearchTerm: (term: string) => void;
  setSelectedEntityId: (id: EntityId | null) => void;
  setSelectedType: (type: string | null) => void;
  setShowOnlyWithConversations: (show: boolean) => void;
  setShowOnlyUnreadConversations: (show: boolean) => void;
}

interface ReferentialFilterPredicates {
  shouldDisplayEntity: FilterPredicate<Entity>;
  shouldDisplayGroup: (entityId: EntityId, groupName: string, fields: Field[]) => boolean;
  shouldDisplayField: (entityId: EntityId, fieldId: number | string, fields: Field[]) => boolean;
}

interface UseReferentialFiltersProps {
  conversations: Conversation[];
  isConversationsLoading?: boolean;
}

interface UseReferentialFiltersResult extends ReferentialFiltersState, ReferentialFiltersActions, ReferentialFilterPredicates {
  // filterReferentials: (referentials: Entity[]) => Entity[];
  filteredReferentials: Entity[];
  isLoadingFiltered: boolean;
  errorFiltered: Error | null;
}

const fetchReferentials = async (): Promise<Entity[]> => {
  const response = await api.get<ReferentialsResponse>('/referentiels');
  const data = response.data;
  
  if (data && typeof data === 'object') {
    const allReferentials: Entity[] = [];
    const types = ['NMR', 'LoV', 'RIO'] as const;
    
    for (const type of types) {
      if (Array.isArray(data[type])) {
        const referentialsWithType = data[type]!.map(ref => ({
          ...ref,
          type
        }));
        allReferentials.push(...referentialsWithType);
      }
    }
    
    return allReferentials;
  }
  
  throw new Error('Format de données inattendu du serveur');
};

export const useReferentials = () => {
  return useQuery({
    queryKey: ['referentials'],
    queryFn: fetchReferentials,
    // staleTime: 10 * 60 * 1000, // 10 minutes - les référentiels changent peu
    // gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useReferentialsByType = (type: 'NMR' | 'LoV' | 'RIO') => {
  return useQuery({
    queryKey: ['referentials', type],
    queryFn: async () => {
      const allReferentials = await fetchReferentials();
      return allReferentials.filter(ref => ref.type === type);
    },
    // staleTime: 10 * 60 * 1000,
    // gcTime: 30 * 60 * 1000,
  });
};

/**
 * Hook pour gérer les filtres de référentiels avec react-query
 * Utilise une approche fonctionnelle avec des prédicats pour le filtrage
 */
export function useReferentialFilters({ conversations, isConversationsLoading = false }: UseReferentialFiltersProps): UseReferentialFiltersResult {
  // État local pour les filtres
  const [filters, setFilters] = useState<ReferentialFiltersState>({
    searchTerm: '',
    selectedEntityId: null,
    selectedType: 'RIO',
    showOnlyWithConversations: false,
    showOnlyUnreadConversations: false
  });

  // Actions pour mettre à jour les filtres - stables avec useCallback
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

  const setShowOnlyUnreadConversations = useCallback((showOnlyUnreadConversations: boolean) => {
    setFilters(prev => ({ ...prev, showOnlyUnreadConversations }));
  }, []);

  // Prédicat pour vérifier si une entité correspond aux filtres
  const shouldDisplayEntity = useMemo<FilterPredicate<Entity>>(() => {
    const { searchTerm, selectedEntityId, selectedType, showOnlyWithConversations, showOnlyUnreadConversations } = filters;
    
    return (entity: Entity): boolean => {
      // Filtre par ID d'entité sélectionnée
      if (selectedEntityId && entity['entity-id'] !== selectedEntityId) {
        return false;
      }

      // Si le filtre de conversations est actif, vérifier d'abord si l'entité a des conversations
      // Dans ce cas, on peut ignorer le filtre de type pour inclure les entités avec conversations
      if (showOnlyWithConversations && !isConversationsLoading) {
        const hasAnyConversations = conversations.some(conv => 
          conv.linkedItems.some(item => item.entityId === entity['entity-id'])
        );
        
        if (hasAnyConversations) {
          // L'entité a des conversations, on l'affiche même si elle ne correspond pas au filtre de type
        } else {
          // L'entité n'a pas de conversations, on applique le filtre de type normal
          if (selectedType && entity.type !== selectedType) {
            return false;
          }
        }
      } else {
        // Filtre par type de référentiel normal quand le filtre de conversations n'est pas actif
        if (selectedType && entity.type !== selectedType) {
          return false;
        }
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
        // Si les conversations sont en cours de chargement, ne pas filtrer pour éviter les résultats vides
        if (isConversationsLoading) {
          return true;
        }
        
        // Vérifier directement si l'entité a des conversations (tous types confondus)
        const hasDirectConversations = conversations.some(conv => 
          conv.linkedItems.some(item => item.entityId === entity['entity-id'])
        );
        
        // Si l'entité a des conversations directes, l'afficher
        let hasConversations = hasDirectConversations;
        
        // Sinon, vérifier via les champs (logique existante)
        if (!hasConversations && entity.fields && entity.fields.length > 0) {
          hasConversations = entity.fields.some(field => {
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
        }
        
        if (!hasConversations) {
          return false;
        }
      }
      
      // Filtre par conversations non lues
      if (showOnlyUnreadConversations) {
        // Si les conversations sont en cours de chargement, ne pas filtrer pour éviter les résultats vides
        if (isConversationsLoading) {
          return true;
        }
        
        // Vérifier si l'entité a des conversations non lues
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

  // Hook react-query pour les référentiels de base
  const referentialsQuery = useReferentials();
  
  // Filtrage optimisé avec useMemo au lieu de react-query pour éviter les re-renders
  const filteredReferentials = useMemo(() => {
    if (!referentialsQuery.data) return [];
    
    // Fonction récursive pour collecter toutes les entités de tous niveaux
    const getAllEntities = (data: any[]): any[] => {
      let allEntities: any[] = [];
      
      const collectEntities = (items: any[]) => {
        items.forEach(item => {
          if (item['entity-id']) {
            allEntities.push(item);
          }
          if (item.fields && Array.isArray(item.fields)) {
            collectEntities(item.fields);
          }
        });
      };
      
      collectEntities(data);
      return allEntities;
    };

    // Si le filtre de conversations ou conversations non lues est actif, on doit inclure les entités de tous niveaux
    if ((filters.showOnlyWithConversations || filters.showOnlyUnreadConversations) && conversations.length > 0) {
      
      // Créer une liste filtrée qui inclut les entités de niveau 1 avec conversations
      // ET leurs parents/enfants dans la hiérarchie
      const entitiesWithConversations = new Set();
      conversations.forEach(conv => {
        // Si le filtre "non lues" est actif, ne considérer que les conversations non lues
        if (filters.showOnlyUnreadConversations) {
          if (conv.readStatus && !conv.readStatus.isRead) {
            conv.linkedItems.forEach(item => {
              entitiesWithConversations.add(item.entityId);
            });
          }
        } else {
          // Sinon, considérer toutes les conversations
          conv.linkedItems.forEach(item => {
            entitiesWithConversations.add(item.entityId);
          });
        }
      });
      
      // Filtrer pour inclure les entités de niveau 1 qui ont des descendants avec conversations
      const hasDescendantWithConversation = (entity: any): boolean => {
        if (entitiesWithConversations.has(entity['entity-id'])) {
          return true;
        }
        
        if (entity.fields && Array.isArray(entity.fields)) {
          return entity.fields.some((field: any) => hasDescendantWithConversation(field));
        }
        
        return false;
      };
      
      // Filtrer les entités de niveau 1 qui ont des descendants avec conversations
      return referentialsQuery.data
        .filter(entity => !(filters.showOnlyWithConversations || filters.showOnlyUnreadConversations) || hasDescendantWithConversation(entity))
        .map(entity => {
          // Si aucun filtre de conversations n'est actif, retourner l'entité telle quelle
          if (!filters.showOnlyWithConversations && !filters.showOnlyUnreadConversations) {
            return entity;
          }
          
          // Filtrer récursivement les champs pour ne garder que ceux avec conversations
          const filterFieldsRecursively = (fields: any[]): any[] => {
            return fields.filter(field => {
              // Vérifier si ce champ a des conversations directes
              const hasDirectConversations = entitiesWithConversations.has(field['entity-id']);
              
              // Si le champ a des conversations, le garder
              if (hasDirectConversations) {
                return true;
              }
              
              // Sinon, vérifier si ses enfants ont des conversations
              if (field.fields && Array.isArray(field.fields)) {
                const filteredChildren = filterFieldsRecursively(field.fields);
                if (filteredChildren.length > 0) {
                  // Mettre à jour le champ avec les enfants filtrés
                  field.fields = filteredChildren;
                  return true;
                }
              }
              
              return false;
            });
          };
          
          // Appliquer le filtrage récursif aux champs de l'entité
          return {
            ...entity,
            fields: filterFieldsRecursively(entity.fields || [])
          };
        });
    }
    
    return referentialsQuery.data.filter(shouldDisplayEntity);
  }, [referentialsQuery.data, shouldDisplayEntity, filters.showOnlyWithConversations, filters.showOnlyUnreadConversations, conversations]);

  // Prédicat pour vérifier si un groupe doit être affiché quand le filtre est actif
  const shouldDisplayGroup = useCallback((entityId: EntityId, groupName: string, fields: Field[]): boolean => {
    const { showOnlyWithConversations, showOnlyUnreadConversations } = filters;
    
    if (!showOnlyWithConversations && !showOnlyUnreadConversations) return true;
    
    // Si les conversations sont en cours de chargement, afficher tous les groupes
    if (isConversationsLoading) return true;
    
    // Si filtre conversations non lues actif, vérifier qu'il y a des conversations non lues
    if (showOnlyUnreadConversations) {
      // Vérifier si le groupe a des conversations non lues directes
      const groupConversations = conversations.filter(conv => 
        conv.linkedItems.some(item => 
          item.type === 'group' && 
          item.entityId === entityId && 
          item.groupName === groupName
        )
      );
      
      const hasUnreadGroupConversations = groupConversations.some(conv => 
        conv.readStatus && !conv.readStatus.isRead
      );
      
      if (hasUnreadGroupConversations) return true;
      
      // Vérifier si un champ du groupe a des conversations non lues
      const hasUnreadFieldConversations = fields.some(field => {
        if (field['lib-group'] !== groupName) return false;
        
        const fieldConversations = conversations.filter(conv => 
          conv.linkedItems.some(item => 
            item.type === 'field' && 
            item.entityId === entityId && 
            item.fieldIds?.some(id => id === field['id-field'] || String(id) === String(field['id-field']))
          )
        );
        
        return fieldConversations.some(conv => conv.readStatus && !conv.readStatus.isRead);
      });
      
      return hasUnreadFieldConversations;
    }
    
    // Vérifier si le groupe a des conversations directes
    const hasGroupConversations = groupHasConversations(conversations, entityId, groupName);
    if (hasGroupConversations) return true;
    
    // Vérifier si un champ du groupe a des conversations directes
    const hasFieldConversations = groupHasFieldsWithConversations(conversations, entityId, fields);
    return hasFieldConversations;
  }, [conversations, filters, isConversationsLoading]);

  // Prédicat pour vérifier si un champ doit être affiché quand le filtre est actif
  const shouldDisplayField = useCallback((entityId: EntityId, fieldId: number | string, fields: Field[]): boolean => {
    const { showOnlyWithConversations, showOnlyUnreadConversations } = filters;
    
    if (!showOnlyWithConversations && !showOnlyUnreadConversations) return true;

    // Si les conversations sont en cours de chargement, afficher tous les champs
    if (isConversationsLoading) return true;

    // Trouver le champ dans les données
    const field = fields.find(f => {
      const idField = f['id-field'];
      return idField === fieldId || idField === Number(fieldId) || String(idField) === String(fieldId);
    });
    
    if (!field) return false;
    
    // Vérifier si le champ a des conversations directes
    const relevantConversations = conversations.filter(conversation => 
      conversation.linkedItems.some(item => 
        item.type === 'field' && 
        item.entityId === entityId && 
        item.fieldIds?.some(id => 
          id === fieldId || id === Number(fieldId) || String(id) === String(fieldId)
        )
      )
    );
    
    // Si filtre conversations non lues actif, vérifier qu'il y a des conversations non lues
    if (showOnlyUnreadConversations) {
      const hasUnreadConversations = relevantConversations.some(conv => 
        conv.readStatus && !conv.readStatus.isRead
      );
      if (hasUnreadConversations) return true;
    } else if (showOnlyWithConversations) {
      // Sinon, vérifier s'il y a des conversations (peu importe le statut)
      if (relevantConversations.length > 0) return true;
    }
    
    // Vérifier si le champ appartient à un groupe avec des conversations
    const groupName = field['lib-group'];
    const belongsToGroupWithConversation = groupHasConversations(conversations, entityId, groupName);
    
    return belongsToGroupWithConversation;
  }, [conversations, filters, isConversationsLoading]);

  return {
    // État
    searchTerm: filters.searchTerm,
    selectedEntityId: filters.selectedEntityId,
    selectedType: filters.selectedType,
    showOnlyWithConversations: filters.showOnlyWithConversations,
    showOnlyUnreadConversations: filters.showOnlyUnreadConversations,
    
    // Actions
    setSearchTerm,
    setSelectedEntityId,
    setSelectedType,
    setShowOnlyWithConversations,
    setShowOnlyUnreadConversations,
    
    // Prédicats et filtres
    // filterReferentials,
    shouldDisplayEntity,
    shouldDisplayGroup,
    shouldDisplayField,
    
    // Données filtrées via useMemo (optimisé pour la recherche en temps réel)
    filteredReferentials,
    isLoadingFiltered: referentialsQuery.isLoading,
    errorFiltered: referentialsQuery.error
  };
}
