import React, { useEffect, useState, useCallback } from 'react'
import api from '../services/api'

type Field = {
  'category': string | null
  'desc': string | null
  'lib-fonc': string
  'entity-id': string
  'category-id': string
  'link-entity-id': string | null
  'lib-group': string
  'var-type': string | null
  'id-field': number
  'entity': {
    'id': string
    'name': string
  }
}

type Entity = {
  'entity-id': string
  'entity-name': string
  'fields': Field[]
}

type Message = {
  id: string
  conversationId: string
  content: string
  createdAt: string
  authorId: string
  authorName: string
}

type Conversation = {
  id: string
  title: string
  createdAt: string
  lastActivity: string
  messageCount: number
  // Données pour lier la conversation à des groupes ou des champs
  linkedItems: Selection[]
  messages?: Message[]
}

type Selection = {
  type: 'field' | 'group'
  entityId: string
  groupName?: string
  fieldIds?: number[]
}

// Function to group fields by lib-group
const groupFieldsByLibGroup = (fields: Field[]) => {
  const groups: Record<string, Field[]> = {}
  
  fields.forEach(field => {
    const groupName = field['lib-group']
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(field)
  })
  
  return groups
}

// Function to check if a group has conversations
const groupHasConversations = (conversations: Conversation[], entityId: string, groupName: string): boolean => {
  return conversations.some(conversation => 
    conversation.linkedItems.some(item => 
      item.type === 'group' && 
      item.entityId === entityId && 
      item.groupName === groupName
    )
  );
}

// Function to check if any fields in a group have direct conversations
const groupHasFieldsWithConversations = (conversations: Conversation[], entityId: string, fields: Field[]): boolean => {
  return fields.some(field => 
    conversations.some(conversation => 
      conversation.linkedItems.some(item => 
        item.type === 'field' && 
        item.entityId === entityId && 
        item.fieldIds?.includes(field['id-field'])
      )
    )
  );
}

const HomePage = () => {
  const [referentials, setReferentials] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Selection[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'selection' | 'conversation'>('selection')
  const [showOnlyWithConversations, setShowOnlyWithConversations] = useState(false)

  useEffect(() => {
    const fetchReferentials = async () => {
      try {
        const response = await api.get('/referentiels')
        setReferentials(response.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching referentials:', err)
        setError('Une erreur est survenue lors du chargement des référentiels')
        setLoading(false)
      }
    }

    const fetchConversations = async () => {
      // Cette fonction sera implémentée plus tard pour récupérer les conversations depuis l'API
      // Conversations simulées pour le moment
      setConversations([
        {
          id: '1',
          title: 'Inventaire des équipements - Question sur les identifiants',
          createdAt: '2025-04-10T15:30:00Z',
          lastActivity: '2025-04-11T09:45:00Z',
          messageCount: 5,
          linkedItems: [
            {
              type: 'group',
              entityId: 'rec6UfjT6LZMWwKom',
              groupName: 'Identification de l\'équipement'
            }
          ],
          messages: [
            {
              id: 'm1',
              conversationId: '1',
              content: "Bonjour, pourriez-vous clarifier comment les identifiants d'équipement sont générés dans le système ? Est-ce automatique ou manuel ?",
              createdAt: '2025-04-10T15:30:00Z',
              authorId: 'user1',
              authorName: 'Julien Dupont'
            },
            {
              id: 'm2',
              conversationId: '1',
              content: "Les identifiants sont générés automatiquement par le système lors de la création de l'équipement. Ils suivent le format EQ-YYYY-XXXXX où YYYY est l'année et XXXXX est un numéro séquentiel.",
              createdAt: '2025-04-10T15:45:00Z',
              authorId: 'user2',
              authorName: 'Sophie Moreau'
            },
            {
              id: 'm3',
              conversationId: '1',
              content: "Est-ce que ces identifiants sont modifiables après création ?",
              createdAt: '2025-04-10T16:15:00Z',
              authorId: 'user1',
              authorName: 'Julien Dupont'
            },
            {
              id: 'm4',
              conversationId: '1',
              content: "Non, les identifiants sont immuables une fois créés pour garantir la traçabilité.",
              createdAt: '2025-04-10T16:30:00Z',
              authorId: 'user2',
              authorName: 'Sophie Moreau'
            },
            {
              id: 'm5',
              conversationId: '1',
              content: "Merci pour ces précisions, c'est plus clair maintenant.",
              createdAt: '2025-04-11T09:45:00Z',
              authorId: 'user1',
              authorName: 'Julien Dupont'
            }
          ]
        },
        {
          id: '2',
          title: 'Données du cycle de vie - Clarifications',
          createdAt: '2025-04-08T10:20:00Z',
          lastActivity: '2025-04-08T14:30:00Z',
          messageCount: 3,
          linkedItems: [
            {
              type: 'field',
              entityId: 'rec6UfjT6LZMWwKom',
              fieldIds: [15,]
            }
          ],
          messages: [
            {
              id: 'm6',
              conversationId: '2',
              content: "Je ne comprends pas bien la différence entre 'date de mise en service' et 'date d'activation'. Pouvez-vous expliquer ?",
              createdAt: '2025-04-08T10:20:00Z',
              authorId: 'user3',
              authorName: 'Thomas Martin'
            },
            {
              id: 'm7',
              conversationId: '2',
              content: "La date de mise en service correspond à l'installation physique de l'équipement, tandis que la date d'activation est le moment où il est enregistré dans le système et devient opérationnel.",
              createdAt: '2025-04-08T11:05:00Z',
              authorId: 'user4',
              authorName: 'Claire Dubois'
            },
            {
              id: 'm8',
              conversationId: '2',
              content: "Compris, merci pour cette précision.",
              createdAt: '2025-04-08T14:30:00Z',
              authorId: 'user3',
              authorName: 'Thomas Martin'
            }
          ]
        }
      ])
    }

    fetchReferentials()
    fetchConversations()
  }, [])
  

  // Fonction pour envoyer un nouveau message
  const sendMessage = useCallback((conversationId: string, content: string) => {
    const currentConversation = conversations.find(c => c.id === conversationId);
    
    if (!currentConversation) return;
    
    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId,
      content,
      createdAt: new Date().toISOString(),
      authorId: 'user1', // À remplacer par l'ID de l'utilisateur actuel
      authorName: 'Julien Dupont' // À remplacer par le nom de l'utilisateur actuel
    };
    
    // Ajout du message à la conversation
    const updatedConversation = {
      ...currentConversation,
      messages: [...(currentConversation.messages || []), newMessage],
      messageCount: (currentConversation.messageCount || 0) + 1,
      lastActivity: new Date().toISOString()
    };
    
    // Mise à jour de la liste des conversations
    setConversations(
      conversations.map(c => c.id === conversationId ? updatedConversation : c)
    );
    
    // Ici, vous pourriez ajouter l'appel API pour enregistrer le message
    // await api.post(`/conversations/${conversationId}/messages`, newMessage);
  }, [conversations, setConversations]);

  // Gestion des sélections de champs et groupes
  const toggleFieldSelection = useCallback((entityId: string, fieldId: number) => {
    const existingFieldIndex = selectedItems.findIndex(
      selection => selection.type === 'field' && selection.entityId === entityId && selection.fieldIds?.includes(fieldId)
    )
    
    // Vérifier si un groupe contenant ce champ est déjà sélectionné
    const fieldGroupName = referentials
      .find(e => e['entity-id'] === entityId)?.fields
      .find(f => f['id-field'] === fieldId)?.['lib-group'];
      
    const groupSelectedIndex = selectedItems.findIndex(
      selection => selection.type === 'group' && 
                  selection.entityId === entityId && 
                  selection.groupName === fieldGroupName
    );
    
    // Si le groupe est déjà sélectionné, ne rien faire car le champ est déjà inclus
    if (groupSelectedIndex >= 0) {
      return;
    }
    
    // Vérifier si ce champ a des conversations associées
    const fieldConversations = getConversationsForField(entityId, fieldId);
    const hasConversations = fieldConversations.length > 0;

    // Si le champ est déjà sélectionné, le désélectionner et fermer le panneau
    if (existingFieldIndex >= 0) {
      setSelectedItems([]);
      setSidebarOpen(false);
    } else {
      // Sinon, remplacer toute sélection actuelle par ce champ uniquement
      setSelectedItems([{
        type: 'field',
        entityId,
        fieldIds: [fieldId]
      }]);
      
      // Si le champ a des conversations associées, ouvrir directement la première conversation
      if (hasConversations) {
        setSelectedConversation(fieldConversations[0].id);
        setViewMode('conversation');
      } else {
        // Sinon, afficher le mode sélection pour créer une nouvelle conversation
        setViewMode('selection');
        setSelectedConversation(null);
      }
      
      // Ouvrir le panneau s'il est fermé
      if (!sidebarOpen) {
        setSidebarOpen(true);
      }
    }
  }, [selectedItems, sidebarOpen, setSidebarOpen, setViewMode, setSelectedConversation, referentials])
  
  const toggleGroupSelection = useCallback((entityId: string, groupName: string) => {
    const existingSelectionIndex = selectedItems.findIndex(
      selection => selection.type === 'group' && selection.entityId === entityId && selection.groupName === groupName
    )
    
    // Vérifier si ce groupe a des conversations associées
    const groupConversations = getConversationsForGroup(entityId, groupName);
    const hasConversations = groupConversations.length > 0;
    
    if (existingSelectionIndex >= 0) {
      // Si le groupe est déjà sélectionné, le retirer et fermer le panneau
      setSelectedItems([])
      setSidebarOpen(false)
    } else {
      // Si le groupe n'est pas sélectionné, remplacer toute sélection existante par ce groupe
      setSelectedItems([{
        type: 'group',
        entityId,
        groupName
      }])
      
      // Si le groupe a des conversations associées, ouvrir directement la première conversation
      if (hasConversations) {
        setSelectedConversation(groupConversations[0].id);
        setViewMode('conversation');
      } else {
        // Sinon, afficher le mode sélection pour créer une nouvelle conversation
        setViewMode('selection');
        setSelectedConversation(null);
      }
      
      // Ouvrir le panneau s'il est fermé
      if (!sidebarOpen) {
        setSidebarOpen(true)
      }
    }
  }, [selectedItems, sidebarOpen, setSidebarOpen, setViewMode, setSelectedConversation])
  
  const isFieldSelected = useCallback((entityId: string, fieldId: number) => {
    return selectedItems.some(
      selection => 
        (selection.type === 'field' && selection.entityId === entityId && selection.fieldIds?.includes(fieldId)) ||
        (selection.type === 'group' && selection.entityId === entityId && 
          referentials.find(e => e['entity-id'] === entityId)?.fields
            .filter(f => f['lib-group'] === selection.groupName)
            .some(f => f['id-field'] === fieldId)
        )
    )
  }, [selectedItems, referentials])
  
  const isGroupSelected = useCallback((entityId: string, groupName: string) => {
    return selectedItems.some(
      selection => selection.type === 'group' && selection.entityId === entityId && selection.groupName === groupName
    )
  }, [selectedItems])
  
  const createNewConversation = useCallback((title: string) => {
    if (selectedItems.length === 0) return
    
    // Cette fonction sera implémentée plus tard pour créer une nouvelle conversation via l'API
    const newConversation: Conversation = {
      id: `new-${Date.now()}`,
      title: title || 'Nouvelle conversation',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      linkedItems: [...selectedItems], // Copie des éléments sélectionnés
      messages: [] // Initialisation d'un tableau de messages vide
    }
    
    setConversations([newConversation, ...conversations])
    setSelectedConversation(newConversation.id)
    setViewMode('conversation')
    
    // Ici, vous pourriez ajouter l'appel API pour enregistrer la conversation
    // await api.post('/conversations', newConversation);
  }, [selectedItems, conversations, setConversations, setSelectedConversation, setViewMode])
  
  
  // Fonction pour ouvrir une conversation spécifique
  const openConversation = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    setViewMode('conversation');
    setSidebarOpen(true);
  }, [setSelectedConversation, setViewMode, setSidebarOpen]);
  
  const clearSelection = useCallback(() => {
    setSelectedItems([])
    setSidebarOpen(false)
    setSelectedConversation(null)
    setViewMode('selection')
  }, [setSelectedItems, setSidebarOpen, setSelectedConversation, setViewMode])
  
  // Fonction pour obtenir les conversations liées à un groupe
  const getConversationsForGroup = (entityId: string, groupName: string): Conversation[] => {
    return conversations.filter(conversation => 
      conversation.linkedItems.some(item => 
        item.type === 'group' && 
        item.entityId === entityId && 
        item.groupName === groupName
      )
    );
  };
  
  // Fonction pour obtenir uniquement les conversations liées directement à un champ (pas celles des groupes)
  const getConversationsForField = (entityId: string, fieldId: number): Conversation[] => {
    return conversations.filter(conversation => 
      conversation.linkedItems.some(item => 
        item.type === 'field' && 
        item.entityId === entityId && 
        item.fieldIds?.includes(fieldId)
      )
    );
  };
  
  // Fonction pour vérifier si un champ appartient à un groupe qui a des conversations
  const fieldBelongsToGroupWithConversation = (entityId: string, fieldId: number): boolean => {
    const field = referentials.find(e => e['entity-id'] === entityId)?.fields.find(f => f['id-field'] === fieldId);
    if (!field) return false;
    
    const groupName = field['lib-group'];
    
    return groupHasConversations(conversations, entityId, groupName);
  };

  // Helper function to determine if a group should be displayed when filter is active
  const shouldDisplayGroup = useCallback((entityId: string, groupName: string, fields: Field[]): boolean => {
    if (!showOnlyWithConversations) return true;
    
    // Check if the group itself has conversations
    const groupHasDirectConversations = groupHasConversations(conversations, entityId, groupName);
    if (groupHasDirectConversations) return true;
    
    // Check if any field in the group has conversations
    return groupHasFieldsWithConversations(conversations, entityId, fields);
  }, [showOnlyWithConversations, conversations]);
  
  // Helper function to determine if a field should be displayed when filter is active
  const shouldDisplayField = useCallback((entityId: string, fieldId: number): boolean => {
    if (!showOnlyWithConversations) return true;
    
    // Check if the field itself has conversations
    const fieldConversations = getConversationsForField(entityId, fieldId);
    if (fieldConversations.length > 0) return true;
    
    // Check if the field belongs to a group with conversations
    return fieldBelongsToGroupWithConversation(entityId, fieldId);
  }, [showOnlyWithConversations, getConversationsForField, fieldBelongsToGroupWithConversation]);
  
  // Filtered referentials based on search and selection
  const filteredReferentials = referentials.filter(entity => {
    // Filter by selected entity if any
    if (selectedEntity && entity['entity-id'] !== selectedEntity) {
      return false
    }
    
    // Filter by having conversations if filter is enabled
    if (showOnlyWithConversations) {
      // Check all groups and fields for conversations
      const hasAnyConversations = Object.entries(groupFieldsByLibGroup(entity.fields)).some(([groupName, fields]) => {
        return shouldDisplayGroup(entity['entity-id'], groupName, fields);
      });
      
      if (!hasAnyConversations) {
        return false;
      }
    }

    // Filter by search term
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      
      // Search in entity name
      if (entity['entity-name'].toLowerCase().includes(searchTermLower)) {
        return true
      }
      
      // Search in fields
      return entity.fields.some(field => 
        field['lib-fonc'].toLowerCase().includes(searchTermLower) ||
        (field.desc && field.desc.toLowerCase().includes(searchTermLower)) ||
        field['lib-group'].toLowerCase().includes(searchTermLower)
      )
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    )
  }


  // Composant pour le formulaire de création de conversation avec état local isolé
  const ConversationForm = React.memo(({ 
    initialTitle = '',
    onCreateConversation,
    onClearSelection 
  }: { 
    initialTitle?: string;
    onCreateConversation: (title: string) => void;
    onClearSelection: () => void; 
  }) => {
    // État local du formulaire pour isoler complètement les re-rendus
    const [localTitle, setLocalTitle] = useState(initialTitle);
    
    // Gestionnaires d'événements isolés
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalTitle(e.target.value);
    };
    
    const handleCreateClick = () => {
      onCreateConversation(localTitle);
      setLocalTitle('');
    };
    
    const handleClearClick = () => {
      setLocalTitle('');
      onClearSelection();
    };

    // Empêcher la propagation des clics
    const stopPropagation = (e: React.MouseEvent) => {
      e.stopPropagation();
    };
    
    return (
      <div 
        className="border-t border-gray-200 pt-4" 
        onClick={stopPropagation}
      >
        <div className="mb-4">
          <label htmlFor="conversation-title" className="block text-sm font-medium text-gray-700 mb-1">
            Titre de la conversation
          </label>
          <input
            type="text"
            id="conversation-title"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            placeholder="Entrez un titre pour cette conversation"
            value={localTitle}
            onChange={handleTitleChange}
            onClick={stopPropagation}
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleCreateClick}
          >
            Créer une conversation
          </button>
          <button
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={handleClearClick}
          >
            Effacer
          </button>
        </div>
      </div>
    );
  });
  
  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Composant de message
  const MessageItem = React.memo(({ message }: { message: Message }) => {
    const isCurrentUser = message.authorId === 'user1'; // Simulé, à remplacer par une vérification d'ID utilisateur
    
    return (
      <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        <div 
          className={`max-w-3/4 rounded-lg px-4 py-3 shadow-sm ${
            isCurrentUser 
              ? 'bg-indigo-100 text-indigo-900 rounded-tr-none' 
              : 'bg-gray-100 text-gray-900 rounded-tl-none'
          }`}
        >
          <div className="flex items-center mb-1">
            <span className={`text-xs font-medium ${isCurrentUser ? 'text-indigo-600' : 'text-gray-600'}`}>
              {message.authorName}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {formatDate(message.createdAt)}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  });
  
  // Composant pour le formulaire d'envoi de message
  const MessageForm = React.memo(({ 
    conversationId,
    onSendMessage 
  }: { 
    conversationId: string;
    onSendMessage: (conversationId: string, content: string) => void;
  }) => {
    const [messageContent, setMessageContent] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (messageContent.trim()) {
        onSendMessage(conversationId, messageContent);
        setMessageContent('');
      }
    };
    
    return (
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative">
          <textarea
            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none shadow-inner bg-white"
            rows={3}
            placeholder="Écrivez votre message..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            className="absolute bottom-2 right-2 bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={!messageContent.trim()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    );
  });

  // Composant sidebar pour les conversations
  const ConversationSidebar = () => {
    const currentConversation = selectedConversation 
      ? conversations.find(c => c.id === selectedConversation) 
      : null;
    
    // Référence pour le scrolling automatique
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    
    // Scroll to bottom lorsque des messages sont ajoutés
    useEffect(() => {
      if (messagesEndRef.current && viewMode === 'conversation') {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [currentConversation?.messages?.length, viewMode]);
    
    return (
      <div 
        className={`fixed right-0 top-0 h-full bg-white transform transition-all duration-300 ease-out z-20 overflow-hidden ${
          sidebarOpen ? 'translate-x-0 opacity-100 shadow-2xl' : 'translate-x-full opacity-0'
        }`}
        style={{ 
          width: 'min(420px, 90vw)', /* Largeur soit de 420px, soit 90% de la largeur de la fenêtre, selon le plus petit */
          backdropFilter: 'blur(4px)'
        }}
      >
        <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
          {/* Header - Gradient background */}
          <div 
            className="px-4 py-5 border-b border-gray-200 flex justify-between items-center text-white"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            }}
          >
            <h2 className="text-xl font-semibold flex items-center">
              {viewMode === 'selection' 
                ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Sélection
                  </>
                ) 
                : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Conversation
                  </>
                )
              }
            </h2>
            <div className="flex items-center space-x-2">
              {viewMode === 'conversation' && (
                <button 
                  className="p-2 hover:bg-indigo-700 transition-colors duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode('selection');
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <button 
                className="p-2 hover:bg-indigo-700 transition-colors duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(false);
                  setSelectedItems([]);
                  setSelectedConversation(null);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'selection' ? (
              <div className="p-4" onClick={(e) => e.stopPropagation()}>
                {selectedItems.length === 0 ? (
                  <div className="text-center py-10">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      Sélectionnez des champs ou des groupes pour créer une conversation
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Éléments sélectionnés</h3>
                      <ul className="space-y-1">
                        {selectedItems.map((item, index) => {
                          const entity = referentials.find(e => e['entity-id'] === item.entityId)
                          
                          if (item.type === 'group') {
                            return (
                              <li key={`${item.entityId}-${item.groupName}-${index}`} className="flex justify-between items-center p-2 bg-indigo-50 rounded-md">
                                <div>
                                  <span className="text-xs font-medium text-indigo-600">{entity?.['entity-name']}</span>
                                  <p className="text-sm font-medium">{item.groupName}</p>
                                  <p className="text-xs text-gray-500">Groupe entier</p>
                                </div>
                                <button 
                                  className="text-gray-400 hover:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Empêcher la propagation
                                    toggleGroupSelection(item.entityId, item.groupName!);
                                  }}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </li>
                            )
                          } else if (item.type === 'field' && item.fieldIds) {
                            return (
                              <li key={`${item.entityId}-fields-${index}`} className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                                <div>
                                  <span className="text-xs font-medium text-blue-600">{entity?.['entity-name']}</span>
                                  <p className="text-sm font-medium">
                                    {item.fieldIds.map(fieldId => {
                                      const field = entity?.fields.find(f => f['id-field'] === fieldId)
                                      return field?.['lib-fonc']
                                    }).join(', ')}
                                  </p>
                                  <p className="text-xs text-gray-500">{item.fieldIds.length} champ(s)</p>
                                </div>
                                <button 
                                  className="text-gray-400 hover:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Empêcher la propagation
                                    if (item.fieldIds && item.fieldIds.length > 0) {
                                      toggleFieldSelection(item.entityId, item.fieldIds[0])
                                    }
                                  }}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </li>
                            )
                          }
                          return null
                        })}
                      </ul>
                    </div>
                    
                    <ConversationForm
                      initialTitle=""
                      onCreateConversation={createNewConversation}
                      onClearSelection={clearSelection}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {currentConversation && (
                  <>
                    {/* Affichage des infos de la conversation */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {currentConversation.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Créée le {new Date(currentConversation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center ml-2">
                          <span className="inline-flex text-nowrap items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {currentConversation.messageCount} message{currentConversation.messageCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      {/* Affichage des éléments liés */}
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Éléments liés:</p>
                        <div className="flex flex-wrap gap-1">
                          {currentConversation.linkedItems.map((item, idx) => {
                            const entity = referentials.find(e => e['entity-id'] === item.entityId);
                            
                            if (item.type === 'group') {
                              return (
                                <span key={`link-${idx}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                  </svg>
                                  {entity?.['entity-name']} - {item.groupName}
                                </span>
                              );
                            } else if (item.type === 'field') {
                              return (
                                <span key={`link-${idx}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                  </svg>
                                  {entity?.['entity-name']} - {item.fieldIds?.length} champ(s)
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Affichage des messages */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {currentConversation.messages && currentConversation.messages.length > 0 ? (
                        <div className="space-y-4">
                          {currentConversation.messages.map(message => (
                            <MessageItem key={message.id} message={message} />
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">
                            Aucun message dans cette conversation. Commencez à discuter!
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Zone de saisie du message */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <MessageForm 
                        conversationId={currentConversation.id}
                        onSendMessage={sendMessage}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {viewMode === 'selection' && (
            <div className="border-t border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Conversations existantes</h3>
              <ul className="space-y-2">
                {conversations.map(conversation => (
                  <li key={conversation.id}>
                    <button
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex justify-between items-center"
                      onClick={() => {
                        setSelectedConversation(conversation.id)
                        setViewMode('conversation')
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">{conversation.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(conversation.lastActivity).toLocaleDateString()} · {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full sm:px-3 md:px-4 py-4 sm:py-6 bg-gray-50 min-h-screen">
      {/* Bouton d'ouverture du panneau latéral */}
      <button
        className={`fixed z-30 right-6 bottom-6 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-out transform ${
          sidebarOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 hover:scale-110'
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
      </button>
      
      {/* Panneau latéral de conversation */}
      <ConversationSidebar />
      
      {/* Overlay semi-transparent avec animation quand le panneau est ouvert */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-out z-10 ${
          sidebarOpen ? 'opacity-25' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          setSidebarOpen(false);
          setSelectedItems([]);
          setSelectedConversation(null);
          setViewMode('selection');
        }}
      />
      
      <h1 className="text-3xl md:text-4xl font-bold mb-3 sm:mb-4 md:mb-5 text-black">Référentiels AICN</h1>
      
      <div className="bg-white shadow-lg rounded-lg p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 border border-gray-200">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-semibold text-black mb-2">
                Rechercher
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 border"
                  placeholder="Rechercher par libellé, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-80">
              <label htmlFor="entity-filter" className="block text-sm font-semibold text-black mb-2">
                Filtrer par référentiel
              </label>
              <select
                id="entity-filter"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-lg p-3 border bg-white"
                value={selectedEntity || ''}
                onChange={(e) => setSelectedEntity(e.target.value || null)}
              >
                <option value="">Tous les référentiels</option>
                {referentials.map(entity => (
                  <option key={entity['entity-id']} value={entity['entity-id']}>
                    {entity['entity-name']}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => setShowOnlyWithConversations(!showOnlyWithConversations)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                showOnlyWithConversations 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg 
                className={`h-5 w-5 ${showOnlyWithConversations ? 'text-white' : 'text-indigo-500'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.083-.98L3 20l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.582 9 8z" 
                />
              </svg>
              <span>
                {showOnlyWithConversations 
                  ? 'Afficher tous les éléments' 
                  : 'Afficher uniquement avec conversations'}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5 text-sm">
          {filteredReferentials.length === 0 && searchTerm && (
            <p className="text-red-500 font-medium">Aucun résultat trouvé pour "{searchTerm}"</p>
          )}
          {filteredReferentials.length > 0 && (
            <p className="text-black font-medium">
              Affichage de {filteredReferentials.length} référentiel{filteredReferentials.length > 1 ? 's' : ''}
              {searchTerm && ` pour la recherche "${searchTerm}"`}
            </p>
          )}
        </div>
      </div>
      
      {/* Message pour indiquer comment sélectionner */}
      <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Mode sélection</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Cliquez sur un <span className="font-medium">nom de groupe</span> pour sélectionner tous les champs du groupe ou sur une <span className="font-medium">ligne</span> pour sélectionner un unique champ. Chaque conversation est liée soit à un groupe complet, soit à un champ individuel.
            </p>
            <div className="mt-2 flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  N
                </span>
                <span className="text-xs text-yellow-700">Indique une conversation de <strong>groupe</strong> avec N messages</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  N
                </span>
                <span className="text-xs text-yellow-700">Indique une conversation sur un <strong>champ spécifique</strong> avec N messages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {filteredReferentials.map((entity) => {
        const groupedFields = groupFieldsByLibGroup(entity.fields)
        
        return (
          <div key={entity['entity-id']} className="mb-6 sm:mb-8 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-indigo-600 text-white px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-b">
              <h2 className="text-2xl font-semibold">{entity['entity-name']}</h2>
              <div className="text-sm text-indigo-100 mt-1">ID: {entity['entity-id']}</div>
            </div>
            
            <div className="overflow-x-auto lg:overflow-visible">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-indigo-50">
                  <tr>
                    <th scope="col" className="px-2 md:px-4 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider w-16">ID</th>
                    <th scope="col" className="px-2 md:px-4 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider w-1/3">Libellé</th>
                    <th scope="col" className="hidden md:table-cell px-2 md:px-4 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider w-5/12">Description</th>
                    <th scope="col" className="px-2 md:px-4 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider w-20">Type</th>
                    <th scope="col" className="hidden md:table-cell px-2 md:px-4 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider w-28">Lien</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(groupedFields).map(([groupName, fields], groupIndex) => {
                    // Vérifier si le groupe devrait être affiché
                    const shouldShowGroup = shouldDisplayGroup(entity['entity-id'], groupName, fields);
                    if (showOnlyWithConversations && !shouldShowGroup) return null;
                    
                    // Filtrer les champs à afficher
                    const filteredFields = showOnlyWithConversations
                      ? fields.filter(field => shouldDisplayField(entity['entity-id'], field['id-field']))
                      : fields;

                    // Si aucun champ à afficher après filtrage, ne pas afficher le groupe
                    if (showOnlyWithConversations && filteredFields.length === 0 && 
                        !groupHasConversations(conversations, entity['entity-id'], groupName)) return null;
                        
                    return (
                      <React.Fragment key={`${entity['entity-id']}-${groupName}`}>
                        <tr 
                          className={`bg-indigo-100 cursor-pointer ${isGroupSelected(entity['entity-id'], groupName) ? 'bg-indigo-200' : 'hover:bg-indigo-200'}`}
                          onClick={() => toggleGroupSelection(entity['entity-id'], groupName)}
                        >
                          <td colSpan={5} className="px-2 md:px-4 py-2 md:py-3 text-indigo-800">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                              {/* Col gauche avec nom de groupe */}
                              <div className="md:col-span-8 flex flex-col">
                                <div className="flex items-center">
                                  <div className="mr-2 flex-shrink-0">
                                    {isGroupSelected(entity['entity-id'], groupName) ? (
                                      <svg className="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                    )}
                                  </div>
                                  <h3 className="text-base font-bold truncate pr-2">{groupName}</h3>
                                  
                                  {/* Badge du nombre de champs (version mobile) */}
                                  <div className="ml-auto md:hidden text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full whitespace-nowrap">
                                    {filteredFields.length} champ{filteredFields.length > 1 ? 's' : ''}
                                  </div>
                                </div>
                                
                                {/* Indicateur de conversations pour le groupe - déplacé sous le titre */}
                                {(() => {
                                  const groupConversations = getConversationsForGroup(entity['entity-id'], groupName);
                                  if (groupConversations.length > 0) {
                                    return (
                                      <div className="flex flex-wrap gap-1 mt-1 ml-7">
                                        {groupConversations.map(conv => (
                                          <button
                                            key={conv.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openConversation(conv.id);
                                            }}
                                            title={`Ouvrir la conversation de groupe: ${conv.title}`}
                                            className="flex items-center rounded-full bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs px-2 py-0.5"
                                          >
                                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                            </svg>
                                            {conv.messageCount}
                                          </button>
                                        ))}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              
                              {/* Col droite avec badges et count */}
                              <div className="md:col-span-4 flex items-center justify-between md:justify-end">
                                {/* Badge du nombre de champs (version desktop) */}
                                <div className="hidden md:flex text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full whitespace-nowrap">
                                  {filteredFields.length} champ{filteredFields.length > 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        
                        {filteredFields.map((field, index) => {
                          // Rechercher les conversations existantes pour ce champ spécifique uniquement
                          const fieldConversations = getConversationsForField(entity['entity-id'], field['id-field']);
                          // Vérifier si le champ appartient à un groupe avec des conversations
                          const belongsToGroupWithConversation = fieldBelongsToGroupWithConversation(entity['entity-id'], field['id-field']);
                          
                          // Si le filtre est actif et que le champ ne devrait pas être affiché, ne pas le rendre
                          if (showOnlyWithConversations && !shouldDisplayField(entity['entity-id'], field['id-field'])) {
                            return null;
                          }
                          
                          return (
                            <tr 
                              key={field['id-field']} 
                              className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                                ${field['link-entity-id'] ? 'border-l-4 border-indigo-300' : ''} 
                                ${isFieldSelected(entity['entity-id'], field['id-field']) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-indigo-50'} 
                                ${belongsToGroupWithConversation ? 'bg-indigo-50/30' : ''}
                                transition-colors duration-150 cursor-pointer`}
                              onClick={() => toggleFieldSelection(entity['entity-id'], field['id-field'])}
                            >
                              <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-gray-500 text-center font-mono">
                                <div className="flex items-center justify-center">
                                  {isFieldSelected(entity['entity-id'], field['id-field']) && (
                                    <div className="flex-shrink-0 inline-flex justify-center items-center w-5 h-5 mr-2 rounded-full bg-blue-500 text-white">
                                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  <span>{field['id-field']}</span>
                                </div>
                              </td>
                              <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900">
                                <div className="flex flex-col">
                                  <div className="break-words">
                                    {searchTerm && field['lib-fonc'].toLowerCase().includes(searchTerm.toLowerCase()) ? (
                                      <span className="bg-yellow-200 px-1 rounded">{field['lib-fonc']}</span>
                                    ) : (
                                      field['lib-fonc']
                                    )}
                                  </div>
                                  
                                  {/* Indicateur de conversations spécifiques au champ */}
                                  {fieldConversations.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {fieldConversations.map(conv => (
                                        <button
                                          key={conv.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openConversation(conv.id);
                                          }}
                                          title={`Ouvrir la conversation: ${conv.title}`}
                                          className="flex items-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs px-2 py-0.5"
                                        >
                                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                          </svg>
                                          {conv.messageCount}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="hidden md:table-cell px-2 md:px-4 py-2 md:py-3 text-sm text-gray-600">
                                {field.desc ? (
                                  searchTerm && field.desc.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                                    <span className="bg-yellow-200 px-1 rounded">{field.desc}</span>
                                  ) : (
                                    <div className="break-words">{field.desc}</div>
                                  )
                                ) : (
                                  <span className="text-gray-400 italic">Pas de description</span>
                                )}
                              </td>
                              <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-gray-500 align-middle">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                                  {field['var-type'] || 'N/A'}
                                </span>
                              </td>
                              <td className="hidden md:table-cell px-2 md:px-4 py-2 md:py-3 text-sm text-gray-500">
                                {field['link-entity-id'] ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-200 text-indigo-700 break-words">
                                    {referentials.find(e => e['entity-id'] === field['link-entity-id'])?.['entity-name'] || field['link-entity-id']}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default HomePage
