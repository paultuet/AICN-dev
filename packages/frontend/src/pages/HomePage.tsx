import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { Entity, Field } from '@/types/referential';
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

// Flag pour activer le mode test avec les données d'exemple
const USE_SAMPLE_DATA = false; // Set to true to use the sample data for testing

import { getConversationsForField, getConversationsForGroup } from '../utils/referentialUtils';

// Données de test pour les conversations
import { mockConversations } from '@/mock/conversationsMock';
import AdminActions from '@/components/AdminActions';

const HomePage = () => {
  // État des données de référentiel
  const [referentials, setReferentials] = useState<Entity[]>([]);
  // Toujours utiliser la vue hiérarchique
  const [viewMode] = useState<'flat' | 'hierarchical'>('hierarchical');
  // View mode for the sidebar conversation panel
  const [sidebarViewMode, setSidebarViewMode] = useState<'selection' | 'conversation'>('selection');
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
  const isFieldSelected = useCallback((entityId: string, fieldId: number | string): boolean => {
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
  const toggleFieldSelection = useCallback((entityId: string, fieldId: number | string, fieldName?: string) => {
    // Forcer l'ouverture du panneau latéral même si le champ n'est pas trouvé
    setSidebarViewMode('selection');
    setSidebarOpen(true);
    console.log("toggleFieldSelection called with entityId:", entityId, "fieldId:", fieldId, "fieldName:", fieldName);

    // Convertir fieldId en différents formats pour la recherche
    const fieldIdAsNumber = typeof fieldId === 'string' ? Number(fieldId) : fieldId;
    const fieldIdAsString = String(fieldId);
    const fieldIdWithPrefix = `[3]-${fieldIdAsString}`;

    console.log("Field ID conversions:", {
      original: fieldId,
      asNumber: fieldIdAsNumber,
      asString: fieldIdAsString,
      withPrefix: fieldIdWithPrefix
    });

    // Chercher les conversations pour toutes les versions de l'ID
    let fieldConversations = getConversationsForField(conversations, entityId, fieldId);
    if (fieldConversations.length === 0 && typeof fieldId === 'string') {
      // Essayer avec le nombre
      fieldConversations = getConversationsForField(conversations, entityId, fieldIdAsNumber);
    }

    console.log("Found conversations:", fieldConversations);

    // Vérifier si le champ est déjà sélectionné
    const existingFieldIndex = selectedItems.findIndex(
      selection => selection.type === 'field' &&
        selection.entityId === entityId &&
        (selection.fieldIds?.includes(fieldId) ||
         selection.fieldIds?.includes(fieldIdAsNumber) ||
         selection.fieldIds?.includes(fieldIdAsString) ||
         selection.fieldIds?.includes(fieldIdWithPrefix))
    );

    console.log("Existing field index:", existingFieldIndex);

    // Trouver le champ dans les référentiels
    console.log("Looking for entity with ID:", entityId);
    console.log("Available entities:", referentials.map(e => ({ id: e['entity-id'], name: e['entity-name'] })));

    const entity = referentials.find(e => {
      // Vérifier plusieurs formats d'ID possibles
      return e['entity-id'] === entityId ||
             String(e['entity-id']) === String(entityId) ||
             // Chercher l'entité par nom (pour les nœuds niveau 3 qui pourraient avoir une référence à l'entité)
             e.fields.some(f =>
               'entity-id' in f && f['entity-id'] === entityId
             );
    });

    if (!entity) {
      console.error("Entity not found:", entityId);

      // Trouver l'entité par recherche de champ
      const parentEntity = referentials.find(e =>
        e.fields.some(f => 'entity-id' in f && f['entity-id'] === entityId)
      );

      if (parentEntity) {
        console.log("Found parent entity containing the field's entity-id:", parentEntity['entity-id'], parentEntity['entity-name']);
        return;
      }

      // Solution alternative: simplement ouvrir le panneau latéral de sélection
      console.log("Opening selection sidebar instead, using fieldName:", fieldName);
      setSelectedItems([{
        type: 'field',
        entityId,
        fieldIds: [typeof fieldId === 'number' ? fieldId : Number(fieldId) || fieldId],
        fieldName: fieldName || "Champ sélectionné" // Utiliser le nom fourni
      }]);
      setSidebarViewMode('selection');
      setSidebarOpen(true);
      return;
    }

    // Chercher le champ avec toutes les variantes d'ID possibles
    const field = entity.fields.find(f => {
      if (!('id-field' in f)) return false;
      const idField = f['id-field'];
      return idField === fieldId ||
             idField === fieldIdAsNumber ||
             String(idField) === fieldIdAsString ||
             String(idField) === fieldIdWithPrefix;
    });

    if (!field) {
      console.error("Field not found. Available fields:", entity.fields);

      // Mode debug: chercher un champ correspondant manuellement
      entity.fields.forEach(f => {
        if ('id-field' in f) {
          console.log("Field in entity:", f['id-field'], "type:", typeof f['id-field']);
        }
      });

      return;
    }

    if (!('lib-group' in field)) {
      console.error("Field has no lib-group:", field);
      return;
    }

    const fieldGroupName = field['lib-group'];
    console.log("Found field:", field, "with group:", fieldGroupName);

    // Vérifier si un groupe contenant ce champ est déjà sélectionné
    const groupSelectedIndex = selectedItems.findIndex(
      selection => selection.type === 'group' &&
        selection.entityId === entityId &&
        selection.groupName === fieldGroupName
    );

    // Si le groupe est déjà sélectionné, ne rien faire car le champ est déjà inclus
    if (groupSelectedIndex >= 0) {
      console.log("Group already selected");
      return;
    }

    // Mettre à jour les sélections
    if (existingFieldIndex >= 0) {
      // Si déjà sélectionné, désélectionner
      console.log("Clearing selection");
      setSelectedItems([]);
    } else {
      // Sinon, sélectionner ce champ
      console.log("Setting new selection");
      setSelectedItems([{
        type: 'field',
        entityId,
        fieldIds: [fieldIdAsNumber || fieldId],
        // Ajouter le nom du champ si disponible (pour l'affichage uniquement)
        fieldName: fieldName || field?.['lib-fonc']
      }]);

      // Toujours afficher l'écran de sélection, même s'il y a des conversations
      console.log("Opening selection panel");
      setSidebarViewMode('selection');
      console.log("Opening sidebar");
      setSidebarOpen(true);
    }
  }, [setSelectedItems, referentials, selectedItems, conversations, getConversationsForField, setSelectedConversationId, setSidebarViewMode, setSidebarOpen]);

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

      // Toujours afficher l'écran de sélection, même s'il y a des conversations
      setSidebarViewMode('selection');
      setSidebarOpen(true);
    }
  }, [setSelectedItems, selectedItems, conversations, getConversationsForGroup, setSelectedConversationId, setSidebarViewMode, setSidebarOpen]);

  // Function to handle mock data for testing
  const useSampleData = (data: Entity[]) => {
    // Transform the sample data to ensure it matches our Entity structure
    const transformedData = data.map((entity: any) => {
      // Ensure proper structure for top-level entity
      const transformedEntity: Entity = {
        'entity-id': entity['entity-id'],
        'entity-name': entity['entity-name'],
        'fields': entity.fields || [],
        'niveau': entity.niveau || 1,
        'id-record': entity['id-record'],
        'type': entity.type,
        'desc-fr': entity['desc-fr'],
        'exemple': entity.exemple,
        'var-type': entity['var-type'],
        'link': entity.link
      };
      
      return transformedEntity;
    });
    
    return transformedData;
  };

  // Récupérer les données initiales
  useEffect(() => {
    const fetchReferentials = async () => {
      try {
        if (USE_SAMPLE_DATA) {
          // Utiliser les données d'exemple pour le test
          const sampleData = '[{"niveau":1,"fields":[{"niveau":2,"fields":[{"niveau":3,"desc":null,"lib-fonc":"Reportings par natures/domaines (trésorerie compta impayés ESG extra financier etc)","type":"NMR","entity-id":"recLPoRmlFMtP21xR","link-entity-id":null,"lib-group":"Niveau 3 - Reportings par natures/domaines (trésorerie compta impayés ESG extra financier etc)","exemple":null,"var-type":null,"id-field":"[3]-807","entity":{"id":"recLPoRmlFMtP21xR","name":"Reportings par natures/domaines (trésorerie compta impayés ESG extra financier etc)"}},{"niveau":3,"desc":null,"lib-fonc":"Reportings par périodicité","type":"NMR","entity-id":"rec8qZSz5s88mRskR","link-entity-id":null,"lib-group":"Niveau 3 - Reportings par périodicité","exemple":null,"var-type":null,"id-field":"[3]-615","entity":{"id":"rec8qZSz5s88mRskR","name":"Reportings par périodicité"}}],"type":"NMR","id-record":"[2]-240","entity-id":"recAAG6Gs7hncJThx","link":null,"entity-name":"Besoins et modalités de reporting portefeuille","exemple":null,"var-type":null,"desc-fr":null},{"niveau":2,"fields":[{"niveau":3,"desc":null,"lib-fonc":"Grilles et plans d\'actions ESG","type":"NMR","entity-id":"recveBGOoj5tQ4C85","link-entity-id":null,"lib-group":"Niveau 3 - Grilles et plans d\'actions ESG","exemple":null,"var-type":null,"id-field":"[3]-611","entity":{"id":"recveBGOoj5tQ4C85","name":"Grilles et plans d\'actions ESG"}},{"niveau":3,"desc":null,"lib-fonc":"Règlementations nationales applicables","type":"NMR","entity-id":"recnm4KGjQ4XEIg6X","link-entity-id":null,"lib-group":"Niveau 3 - Règlementations nationales applicables","exemple":null,"var-type":null,"id-field":"[3]-612","entity":{"id":"recnm4KGjQ4XEIg6X","name":"Règlementations nationales applicables"}}],"type":"NMR","id-record":"[2]-236","entity-id":"recCkmmB5csKGgeXY","link":null,"entity-name":"Contexte règlementaire Donneur d\'ordres","exemple":null,"var-type":null,"desc-fr":null},{"niveau":2,"fields":[{"niveau":3,"desc":null,"lib-fonc":"Périmètres de missions exclues","type":"NMR","entity-id":"recN70RbWwsaUMnjh","link-entity-id":null,"lib-group":"Niveau 3 - Périmètres de missions exclues","exemple":null,"var-type":null,"id-field":"[3]-614","entity":{"id":"recN70RbWwsaUMnjh","name":"Périmètres de missions exclues"}},{"niveau":3,"desc":null,"lib-fonc":"Périmètres de missions inclus","type":"NMR","entity-id":"recvx95lFZiyaD6a2","link-entity-id":null,"lib-group":"Niveau 3 - Périmètres de missions inclus","exemple":null,"var-type":null,"id-field":"[3]-613","entity":{"id":"recvx95lFZiyaD6a2","name":"Périmètres de missions inclus"}}],"type":"NMR","id-record":"[2]-238","entity-id":"recpwlmqmAHqPMGfw","link":null,"entity-name":"Prestataires et missions confiées à l\'échelle du portefeuille","exemple":null,"var-type":null,"desc-fr":null},{"niveau":2,"fields":[{"niveau":3,"desc":null,"lib-fonc":"Acteur Français","type":"NMR","entity-id":"recHu63IivnKClbwn","link-entity-id":null,"lib-group":"Niveau 3 - Acteur Français","exemple":null,"var-type":null,"id-field":"[3]-606","entity":{"id":"recHu63IivnKClbwn","name":"Acteur Français"}},{"niveau":3,"desc":null,"lib-fonc":"Acteur pan-Euro","type":"NMR","entity-id":"recnAJ64g2QtCDEnH","link-entity-id":null,"lib-group":"Niveau 3 - Acteur pan-Euro","exemple":null,"var-type":null,"id-field":"[3]-607","entity":{"id":"recnAJ64g2QtCDEnH","name":"Acteur pan-Euro"}},{"niveau":3,"desc":null,"lib-fonc":"Client direct (Foncière)","type":"NMR","entity-id":"recmogC8YIKG88rzc","link-entity-id":null,"lib-group":"Niveau 3 - Client direct (Foncière)","exemple":null,"var-type":null,"id-field":"[3]-608","entity":{"id":"recmogC8YIKG88rzc","name":"Client direct (Foncière)"}},{"niveau":3,"desc":null,"lib-fonc":"Client Indirect (AM)","type":"NMR","entity-id":"rech2TjyGsQzniw9d","link-entity-id":null,"lib-group":"Niveau 3 - Client Indirect (AM)","exemple":null,"var-type":null,"id-field":"[3]-609","entity":{"id":"rech2TjyGsQzniw9d","name":"Client Indirect (AM)"}}],"type":"NMR","id-record":"[2]-231","entity-id":"recgdIWaxGAytJkcm","link":null,"entity-name":"Qualification du Donneur d\'ordres","exemple":null,"var-type":null,"desc-fr":null},{"niveau":2,"fields":[{"niveau":3,"desc":null,"lib-fonc":"Description de la stratégie portefeuille","type":"NMR","entity-id":"recb1Rqs01pEOpEvi","link-entity-id":null,"lib-group":"Niveau 3 - Description de la stratégie portefeuille","exemple":null,"var-type":null,"id-field":"[3]-610","entity":{"id":"recb1Rqs01pEOpEvi","name":"Description de la stratégie portefeuille"}}],"type":"NMR","id-record":"[2]-235","entity-id":"rec5rjyJgtt3Mc5Cj","link":null,"entity-name":"Stratégie portefeuille du Donneur d\'ordres","exemple":null,"var-type":null,"desc-fr":null}],"type":"NMR","id-record":"[1]-31","entity-id":"rec6swjVPgzMej4u8","link":null,"entity-name":"A-ETABLIR LE CONTEXTE ET LES OBJECTIFS PORTEFEUILLE","exemple":null,"var-type":null,"desc-fr":null}]';
          
          setReferentials(useSampleData(JSON.parse(sampleData)));
          setLoading(false);
          console.log('Using sample data for testing');
        } else {
          // Récupérer les données depuis l'API
          const response = await api.get('/referentiels');


          
          // Vérifier si la réponse est dans le format attendu
          if (Array.isArray(response.data)) {
            // Stocker directement car c'est déjà structuré avec des fields
            setReferentials(response.data);
            setLoading(false);
          } else {
            console.error('Unexpected data format from API:', response.data);
            setError('Format de données inattendu du serveur');
            setLoading(false);
          }
        }
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

  // Filtrer les référentiels en fonction des critères
  const filteredReferentials = referentials.filter(entity => {
    if (selectedEntityId && entity['entity-id'] !== selectedEntityId) {
      return false;
    }

    // Filtrer par la présence de conversations
    if (showOnlyWithConversations) {
      // Vérifier si l'entité a des groupes ou des champs avec des conversations
      const hasConversations = entity.fields.some(field => {
        // Vérifier si le champ a une propriété lib-group (pour assurer le typage)
        if (!('lib-group' in field)) return false;
        
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
        'lib-fonc' in field && field['lib-fonc']?.toLowerCase().includes(searchTermLower) ||
        ('desc' in field && field.desc && field.desc.toLowerCase().includes(searchTermLower)) ||
        ('lib-group' in field && field['lib-group']?.toLowerCase().includes(searchTermLower))
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
    setSidebarViewMode('selection');
  }, [setSelectedItems, setSidebarOpen, setSelectedConversationId, setSidebarViewMode]);

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
        viewMode={sidebarViewMode}
        selectedConversationId={selectedConversationId}
        conversations={conversations}
        referentials={referentials}
        onClose={handleCloseSidebar}
        onClearSelection={clearAllSelections}
        onViewModeChange={setSidebarViewMode}
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
            
          </div>
        </div>

        <div className="mt-5 text-sm">
          <p className="text-black font-medium">
            Affichage de la structure hiérarchique des référentiels
            {searchTerm && ` pour la recherche "${searchTerm}"`}
          </p>
        </div>
      </div>

      {/* Message pour indiquer comment sélectionner */}
      {isConversationsFeatureEnabled && <SelectionInfoBox />}

      {/* Affichage des référentiels (vue hiérarchique uniquement) */}
      <HierarchicalView
        data={referentials}
        searchTerm={searchTerm}
        conversations={conversations}
        toggleFieldSelection={toggleFieldSelection}
        toggleGroupSelection={toggleGroupSelection}
        isFieldSelected={isFieldSelected}
        isGroupSelected={isGroupSelected}
        getConversationsForField={(entityId, fieldId) =>
          getConversationsForField(conversations, entityId, fieldId)
        }
        getConversationsForGroup={(entityId, groupName) =>
          getConversationsForGroup(conversations, entityId, groupName)
        }
      />
    </div>
  );
};

export default HomePage;
