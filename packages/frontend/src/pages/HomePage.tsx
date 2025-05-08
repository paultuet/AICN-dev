import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { Entity, HierarchicalEntity } from '@/types/referential';
// Composants
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SearchBar from '@/components/ui/SearchBar';
import EntityFilter from '@/components/referentials/EntityFilter';
import ConversationFilterButton from '@/components/referentials/ConversationFilterButton';
import SelectionInfoBox from '@/components/referentials/SelectionInfoBox';
import EntityCard from '@/components/referentials/EntityCard';
import HierarchicalView from '@/components/referentials/HierarchicalView';
import ConversationSidebar from '@/components/conversations/ConversationSidebar';

// Hooks personnalisés
import useConversation from '@/hooks/useConversation';
import useReferentialFilters from '@/hooks/useReferentialFilters';
import useFeatureFlag from '@/hooks/useFeatureFlag';

// import useSelection from '../hooks/useSelection';

import { getConversationsForField, getConversationsForGroup } from '../utils/referentialUtils';

// Données de test pour les conversations
import { mockConversations } from '@/mock/conversationsMock';
import AdminActions from '@/components/AdminActions';

const HomePage = () => {
  // État des données de référentiel
  const [referentials, setReferentials] = useState<Entity[]>([]);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalEntity[]>([]);
  const [viewMode, setViewMode] = useState<'flat' | 'hierarchical'>('hierarchical');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isConversationsFeatureEnabled = useFeatureFlag('conversations');


  // Gestion des conversations
  const {
    conversations,
    selectedItems,
    selectedConversationId,
    // viewMode,
    sidebarOpen,
    setSelectedItems,
    setSidebarOpen,
    createConversation,
    sendMessage,
    fieldBelongsToGroupWithConversation,
    clearSelection,  // Renamed from clearConversationSelection
    openConversation,
    // setViewMode,
    setSelectedConversationId,
    setConversations
  } = useConversation({ initialConversations: isConversationsFeatureEnabled ? mockConversations : [] });

  // Gestion des filtres
  const {
    searchTerm,
    setSearchTerm,
    selectedEntityId,
    setSelectedEntityId,
    showOnlyWithConversations,
    setShowOnlyWithConversations,
    shouldDisplayGroup,
    shouldDisplayField
  } = useReferentialFilters({ conversations });


  // Vérifier si un champ est sélectionné
  const isFieldSelected = useCallback((entityId: string, fieldId: number): boolean => {
    return selectedItems.some(
      selection =>
        (selection.type === 'field' &&
          selection.entityId === entityId &&
          selection.fieldIds?.includes(fieldId)) ||
        (selection.type === 'group' &&
          selection.entityId === entityId &&
          referentials.find(e => e['entity-id'] === entityId)?.fields
            .filter(f => f['lib-group'] === selection.groupName)
            .some(f => f['id-field'] === fieldId))
    );
  }, [selectedItems, referentials]);

  // Vérifier si un groupe est sélectionné
  const isGroupSelected = useCallback((entityId: string, groupName: string): boolean => {
    return selectedItems.some(
      selection => selection.type === 'group' &&
        selection.entityId === entityId &&
        selection.groupName === groupName
    );
  }, [selectedItems]);

  // Toggle la sélection d'un champ
  const toggleFieldSelection = useCallback((entityId: string, fieldId: number) => {
    const fieldConversations = getConversationsForField(conversations, entityId, fieldId);
    const existingFieldIndex = selectedItems.findIndex(
      selection => selection.type === 'field' &&
        selection.entityId === entityId &&
        selection.fieldIds?.includes(fieldId)
    );

    // Trouver le champ
    const entity = referentials.find(e => e['entity-id'] === entityId);
    if (!entity) return;

    const field = entity.fields.find(f => f['id-field'] === fieldId);
    if (!field) return;

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
        fieldIds: [fieldId]
      }]);

      // Si le champ a des conversations, ouvrir la première
      if (fieldConversations.length > 0) {
        setSelectedConversationId(fieldConversations[0].id);
        setViewMode('conversation');
      } else {
        setViewMode('selection');
      }

      setSidebarOpen(true);
    }
  }, [setSelectedItems, referentials, selectedItems, conversations, getConversationsForField, setSelectedConversationId, setViewMode, setSidebarOpen]);

  // Toggle la sélection d'un groupe
  const toggleGroupSelection = useCallback((entityId: string, groupName: string) => {
    const groupConversations = getConversationsForGroup(conversations, entityId, groupName);
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

      // Si le groupe a des conversations, ouvrir la première
      if (groupConversations.length > 0) {
        setSelectedConversationId(groupConversations[0].id);
        setViewMode('conversation');
      } else {
        setViewMode('selection');
      }

      setSidebarOpen(true);
    }
  }, [setSelectedItems, selectedItems, conversations, getConversationsForGroup, setSelectedConversationId, setViewMode, setSidebarOpen]);

  // Récupérer les données initiales
  useEffect(() => {
    const fetchReferentials = async () => {
      try {
        const response = await api.get('/referentiels');
        
        // La réponse est maintenant une liste de HierarchicalEntity
        if (Array.isArray(response.data)) {
          setHierarchicalData(response.data);
          
          // Pour maintenir la compatibilité avec l'ancienne structure
          // Convertir les données hiérarchiques en structure plate
          const flatEntities = convertHierarchicalToFlat(response.data);
          setReferentials(flatEntities);
        } else {
          console.error('Unexpected data format from API:', response.data);
          setError('Format de données inattendu du serveur');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching referentials:', err);
        setError('Une erreur est survenue lors du chargement des référentiels');
        setLoading(false);
      }
    };

    fetchReferentials();
    if (isConversationsFeatureEnabled) {
      setConversations(mockConversations);
    }
  }, [setConversations, isConversationsFeatureEnabled]);
  
  // Fonction pour convertir les données hiérarchiques en structure plate
  const convertHierarchicalToFlat = (hierarchical: HierarchicalEntity[]): Entity[] => {
    const flatEntities: Entity[] = [];
    
    // Fonction récursive pour extraire les entités et leurs champs
    const extractEntities = (entity: HierarchicalEntity | HierarchicalField, parentEntity?: Entity) => {
      // Si c'est une entité avec des champs, l'ajouter à la liste
      if ('fields' in entity && entity.fields.length > 0) {
        const newEntity: Entity = {
          'entity-id': entity['entity-id'],
          'entity-name': entity['entity-name'],
          'fields': entity.fields
        };
        flatEntities.push(newEntity);
      }
      
      // Si l'entité a des enfants, parcourir récursivement
      if ('children' in entity) {
        entity.children.forEach(child => {
          extractEntities(child);
        });
      }
    };
    
    // Parcourir toutes les entités de niveau 1
    hierarchical.forEach(entity => {
      extractEntities(entity);
    });
    
    return flatEntities;
  };

  // Filtrer les référentiels en fonction des critères
  const filteredReferentials = referentials.filter(entity => {
    if (selectedEntityId && entity['entity-id'] !== selectedEntityId) {
      return false;
    }

    // Filtrer par la présence de conversations
    if (showOnlyWithConversations) {
      // Vérifier si l'entité a des groupes ou des champs avec des conversations
      const hasConversations = entity.fields.some(field => {
        // Vérifier si le champ a des conversations directes
        const fieldHasConversations = getConversationsForField(conversations, entity['entity-id'], field['id-field']).length > 0;

        // Vérifier si le groupe du champ a des conversations
        const groupHasConversations = getConversationsForGroup(conversations, entity['entity-id'], field['lib-group']).length > 0;

        return fieldHasConversations || groupHasConversations;
      });

      if (!hasConversations) {
        return false;
      }
    }

    // Filtrer par terme de recherche
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();

      // Rechercher dans le nom de l'entité
      if (entity['entity-name'].toLowerCase().includes(searchTermLower)) {
        return true;
      }

      // Rechercher dans les champs
      return entity.fields.some(field =>
        field['lib-fonc'].toLowerCase().includes(searchTermLower) ||
        (field.desc && field.desc.toLowerCase().includes(searchTermLower)) ||
        field['lib-group'].toLowerCase().includes(searchTermLower)
      );
    }

    return true;
  });

  // Créer une map des noms d'entités pour l'affichage dans FieldRow
  const referentialEntityMap = referentials.reduce((map, entity) => {
    map[entity['entity-id']] = entity['entity-name'];
    return map;
  }, {} as Record<string, string>);

  // Fonction pour désélectionner tous les éléments
  const clearAllSelections = useCallback(() => {
    setSelectedItems([]);
    setSidebarOpen(false);
    setSelectedConversationId(null);
    setViewMode('selection');
  }, [setSelectedItems, setSidebarOpen, setSelectedConversationId, setViewMode]);

  // Gérer la fermeture du panneau et la désélection complète
  const handleCloseSidebar = useCallback(() => {
    // Utiliser notre fonction de désélection complète
    clearAllSelections();
  }, [clearAllSelections]);


  // Afficher le spinner de chargement
  if (loading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  // Afficher le message d'erreur
  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="relative w-full sm:px-3 md:px-4 py-4 sm:py-6 bg-gray-50 min-h-screen">
      {/* Bouton d'ouverture du panneau latéral */}
      {isConversationsFeatureEnabled && <button
        className={`fixed z-30 right-6 bottom-6 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-out transform ${sidebarOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 hover:scale-110'
          }`}
        onClick={() => setSidebarOpen(true)}
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.5)'
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>}

      {/* Panneau latéral de conversation */}
      {isConversationsFeatureEnabled && <ConversationSidebar
        isOpen={sidebarOpen}
        selectedItems={selectedItems}
        viewMode={viewMode}
        selectedConversationId={selectedConversationId}
        conversations={conversations}
        referentials={referentials}
        onClose={handleCloseSidebar}
        onClearSelection={clearAllSelections}
        onViewModeChange={setViewMode}
        onSelectConversation={setSelectedConversationId}
        onCreateConversation={createConversation}
        onSendMessage={sendMessage}
      />}

      {/* Overlay semi-transparent avec animation quand le panneau est ouvert */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-out z-10 ${sidebarOpen ? 'opacity-25' : 'opacity-0 pointer-events-none'
          }`}
        onClick={handleCloseSidebar}
      />

      <h1 className="text-3xl md:text-4xl font-bold mb-3 sm:mb-4 md:mb-5 text-black">Référentiels AICN</h1>

      <AdminActions />

      <div className="bg-white shadow-lg rounded-lg p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 border border-gray-200">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher par libellé, description..."
              className="flex-1"
            />

            <EntityFilter
              entities={referentials}
              selectedEntity={selectedEntityId}
              onChange={setSelectedEntityId}
              className="w-full md:w-80"
            />
          </div>

          <div className="flex items-center justify-between">
            {isConversationsFeatureEnabled && (
              <ConversationFilterButton
                active={showOnlyWithConversations}
                onChange={setShowOnlyWithConversations}
              />
            )}
            
            {/* Toggle pour basculer entre les vues */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Vue:</span>
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    viewMode === 'hierarchical'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300`}
                  onClick={() => setViewMode('hierarchical')}
                >
                  Hiérarchique
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    viewMode === 'flat'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-l-0 border-gray-300`}
                  onClick={() => setViewMode('flat')}
                >
                  Détaillée
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 text-sm">
          {viewMode === 'flat' ? (
            <>
              {filteredReferentials.length === 0 && searchTerm && (
                <p className="text-red-500 font-medium">Aucun résultat trouvé pour "{searchTerm}"</p>
              )}
              {filteredReferentials.length > 0 && (
                <p className="text-black font-medium">
                  Affichage de {filteredReferentials.length} référentiel{filteredReferentials.length > 1 ? 's' : ''}
                  {searchTerm && ` pour la recherche "${searchTerm}"`}
                </p>
              )}
            </>
          ) : (
            <p className="text-black font-medium">
              Affichage de la structure hiérarchique des référentiels
            </p>
          )}
        </div>
      </div>

      {/* Message pour indiquer comment sélectionner */}
      {isConversationsFeatureEnabled && viewMode === 'flat' && <SelectionInfoBox />}

      {/* Affichage des référentiels selon le mode de vue */}
      {viewMode === 'hierarchical' ? (
        <HierarchicalView data={hierarchicalData} searchTerm={searchTerm} />
      ) : (
        // Vue détaillée (ancienne vue)
        filteredReferentials.map((entity) => (
          <EntityCard
            key={entity['entity-id']}
            entity={entity}
            conversations={conversations}
            searchTerm={searchTerm}
            showOnlyWithConversations={isConversationsFeatureEnabled && showOnlyWithConversations}
            isGroupSelected={isGroupSelected}
            isFieldSelected={isFieldSelected}
            toggleGroupSelection={toggleGroupSelection}
            toggleFieldSelection={toggleFieldSelection}
            openConversation={openConversation}
            getConversationsForGroup={(entityId, groupName) =>
              getConversationsForGroup(conversations, entityId, groupName)
            }
            getConversationsForField={(entityId, fieldId) =>
              getConversationsForField(conversations, entityId, fieldId)
            }
            fieldBelongsToGroupWithConversation={(entityId, fieldId) =>
              fieldBelongsToGroupWithConversation(entityId, fieldId, entity.fields)
            }
            shouldDisplayGroup={(entityId, groupName, fields) =>
              shouldDisplayGroup(entityId, groupName, fields)
            }
            shouldDisplayField={(entityId, fieldId) =>
              shouldDisplayField(entityId, fieldId, entity.fields)
            }
            clearSelection={clearAllSelections}
            referentialEntityMap={referentialEntityMap}
          />
        ))
      )}
    </div>
  );
};

export default HomePage;
