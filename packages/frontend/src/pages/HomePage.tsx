import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Entity } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import useFeatureFlag from '@/hooks/useFeatureFlag';
import useConversation from '@/hooks/useConversation';
import useReferentialFilters from '@/hooks/useReferentialFilters';
import { getConversationsForField, getConversationsForGroup } from '@/utils/referentialUtils';
import { mockConversations } from '@/mock/conversationsMock';
import { 
  ReferentialHeader, 
  ReferentialContent, 
  ConversationSidebarContainer,
  AdminActions
} from '@/components/HomePage';

// Flag pour activer le mode test avec les données d'exemple
const USE_SAMPLE_DATA = false; // Set to true to use the sample data for testing

/**
 * Page d'accueil affichant les référentiels et les conversations
 */
const HomePage: React.FC = () => {
  // État pour les données
  const [referentials, setReferentials] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feature flags
  const isConversationsFeatureEnabled = useFeatureFlag('conversations');

  // Gestion des conversations
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
    setConversations
  } = useConversation({ 
    initialConversations: isConversationsFeatureEnabled ? mockConversations : [] 
  });

  // Gestion des filtres
  const {
    searchTerm,
    selectedEntityId,
    showOnlyWithConversations,
    setSearchTerm,
    setSelectedEntityId,
    setShowOnlyWithConversations,
    filterReferentials,
    shouldDisplayGroup,
    shouldDisplayField
  } = useReferentialFilters({ conversations });

  // Function to handle mock data for testing
  const useSampleData = (data: Entity[]): Entity[] => {
    // Transform the sample data to ensure it matches our Entity structure
    return data.map((entity: any) => ({
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
    }));
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
        } else {
          // Récupérer les données depuis l'API
          const response = await api.get('/referentiels');
          
          // Vérifier si la réponse est dans le format attendu
          if (Array.isArray(response.data)) {
            setReferentials(response.data);
            setLoading(false);
          } else {
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

  // Debug pour traquer les changements d'état de la barre latérale
  useEffect(() => {
    console.log("sidebarOpen state changed:", sidebarOpen);
  }, [sidebarOpen]);

  // Debug pour traquer les changements de mode de la barre latérale
  useEffect(() => {
    console.log("sidebarViewMode state changed:", sidebarViewMode);
  }, [sidebarViewMode]);

  // Filtrer les référentiels en fonction des critères
  const filteredReferentials = filterReferentials(referentials);

  // Gérer la fermeture du panneau et la désélection complète
  const handleCloseSidebar = () => {
    console.log("Closing sidebar");
    clearSelection();
  };

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

  // Toggle la sélection d'un champ
  const toggleFieldSelection = (entityId: string, fieldId: number | string, fieldName?: string) => {
    // Forcer l'ouverture du panneau latéral
    console.log("toggleFieldSelection called with", entityId, fieldId, fieldName);
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

  // Toggle la sélection d'un groupe
  const toggleGroupSelection = (entityId: string, groupName: string) => {
    console.log("toggleGroupSelection called with", entityId, groupName);
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
  if (loading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  // Afficher le message d'erreur
  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="relative w-full sm:px-3 md:px-4 py-4 sm:py-6 bg-gray-50 min-h-screen">
      {/* Panneau latéral de conversation */}
      {isConversationsFeatureEnabled && (
        <ConversationSidebarContainer
          isOpen={sidebarOpen}
          selectedItems={selectedItems}
          viewMode={sidebarViewMode}
          selectedConversationId={selectedConversationId}
          conversations={conversations}
          referentials={referentials}
          onClose={handleCloseSidebar}
          onClearSelection={clearSelection}
          onViewModeChange={setViewMode}
          onSelectConversation={setSelectedConversationId}
          onCreateConversation={createConversation}
          onSendMessage={sendMessage}
          setSidebarOpen={setSidebarOpen}
        />
      )}

      <h1 className="text-3xl md:text-4xl font-bold mb-3 sm:mb-4 md:mb-5 text-black">
        Référentiels AICN
      </h1>

      <AdminActions />

      <ReferentialHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedEntityId={selectedEntityId}
        onEntityChange={setSelectedEntityId}
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
