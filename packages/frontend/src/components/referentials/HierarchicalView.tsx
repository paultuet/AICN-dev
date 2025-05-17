import React, { useState } from 'react';
import { Entity, Field } from '@/types/referential';
import { Conversation } from '@/types/conversation';
import ChevronDown from '@/components/icons/ChevronDown';
import ChevronRight from '@/components/icons/ChevronRight';
import { Badge } from '../ui';
import ChatBubbleIcon from '@/components/icons/ChatBubbleIcon';
import useFeatureFlag from '@/hooks/useFeatureFlag';

interface HierarchicalViewProps {
  data: Entity[];
  searchTerm?: string;
  conversations?: Conversation[];
  toggleFieldSelection?: (entityId: string, fieldId: number | string, fieldName?: string) => void;
  toggleGroupSelection?: (entityId: string, groupName: string) => void;
  isFieldSelected?: (entityId: string, fieldId: number | string) => boolean;
  isGroupSelected?: (entityId: string, groupName: string) => boolean;
  getConversationsForField?: (entityId: string, fieldId: number | string) => Conversation[];
  getConversationsForGroup?: (entityId: string, groupName: string) => Conversation[];
}

const getVarTypeBadgeColor = (varType: String) => {
  switch (varType) {
    case 'TEXT': return 'blue';
    case 'VARCHAR': return 'blue';
    case 'NUMBER': return 'amber';
    case 'INTEGER': return 'amber';
    case 'DATE': return 'purple';
    case 'BOOL': return 'red';
    case 'BOOLEEN': return 'red';
    case 'LINK': return 'emerald';
    default: return 'gray';
  }
};

// Composant pour afficher le détail d'un champ
const FieldDetail: React.FC<{ field: Field }> = ({ field }) => {
  // Déterminer la couleur du badge en fonction du type de champ
  const getTypeBadgeColor = () => {
    switch (field['var-type']) {
      case 'TEXT': return 'bg-blue-100 text-blue-800';
      case 'NUMBER': return 'bg-amber-100 text-amber-800';
      case 'DATE': return 'bg-purple-100 text-purple-800';
      case 'BOOL': return 'bg-red-100 text-red-800';
      case 'LINK': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border-b border-gray-100 py-3 px-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
      <div className="flex items-center">
        <div className="flex-1">
          <div className="font-medium text-gray-900">{field['lib-fonc']}</div>
          {field.desc && <div className="text-xs text-gray-500 mt-1">{field.desc}</div>}
        </div>
        <div className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadgeColor()}`}>
          {field['var-type'] || 'N/A'}
        </div>
      </div>
      <div className="flex justify-between items-center mt-1">
        <div className="text-xs text-gray-500">
          ID: {field['id-field']}
        </div>
        {field['link-entity-id'] && (
          <div className="text-xs text-blue-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Lié
          </div>
        )}
      </div>
    </div>
  );
};

const HierarchicalNode: React.FC<{
  node: Entity;
  level: number;
  searchTerm?: string;
  forceExpanded?: boolean;
  expandedLevels?: {[key: number]: boolean}; // Ajout de la prop pour l'expansion par niveau
  conversations?: Conversation[];
  toggleFieldSelection?: (entityId: string, fieldId: number | string, fieldName?: string) => void;
  toggleGroupSelection?: (entityId: string, groupName: string) => void;
  isFieldSelected?: (entityId: string, fieldId: number | string) => boolean;
  isGroupSelected?: (entityId: string, groupName: string) => boolean;
  getConversationsForField?: (entityId: string, fieldId: number | string) => Conversation[];
  getConversationsForGroup?: (entityId: string, groupName: string) => Conversation[];
}> = ({
  node,
  level,
  searchTerm,
  forceExpanded = false,
  expandedLevels = {1: true, 2: true, 3: true}, // Valeur par défaut
  conversations = [],
  toggleFieldSelection,
  toggleGroupSelection,
  isFieldSelected,
  isGroupSelected,
  getConversationsForField,
  getConversationsForGroup
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(level < 2); // Auto-expand first 2 levels by default
    const [showFields, setShowFields] = useState<boolean>(false);

    const isConversationFeatureEnabled = useFeatureFlag("conversations");

    const hasFields = node.fields && node.fields.length > 0;

    // Déterminer si ce sont des champs ou des entités
    const isEntityArray = (items: any[]): items is Entity[] => {
      return items.length > 0 && 'entity-name' in items[0];
    };

    // Vérifier si parmi les champs, il y a des entités (qui sont les "enfants" dans la hiérarchie)
    const childFields = hasFields ? node.fields.filter(field =>
      // Champs de niveau 2 pour entités niveau 1, ou niveau 3 pour entités niveau 2
      'niveau' in field &&
      field.niveau !== undefined &&
      node.niveau !== undefined &&
      ((node.niveau === 1 && field.niveau === 2) || (node.niveau === 2 && field.niveau === 3))
    ) as (Field | Entity)[] : [];

    const hasChildren = childFields.length > 0;

    // Vérifier si ce nœud ou ses enfants correspondent au terme de recherche
    const matchesSearch = searchTerm ?
      node['entity-name'].toLowerCase().includes(searchTerm.toLowerCase()) : false;

    // Vérifier si des champs correspondent à la recherche
    const hasMatchingFields = searchTerm && hasFields ?
      node.fields.some(field =>
        'lib-fonc' in field && field['lib-fonc']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ('desc' in field && field.desc && field.desc.toLowerCase().includes(searchTerm.toLowerCase()))
      ) : false;

    // Vérifier si des enfants correspondent à la recherche (pour les entités)
    const hasMatchingChildren = searchTerm && hasChildren ? true : false; // On présume que oui par défaut, la vérification réelle se fait par récursion

    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
    };

    const toggleFields = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowFields(!showFields);
    };

    // Calculer le padding en fonction du niveau
    const getIndentClass = () => {
      const paddingSize = level * 4;
      return `pl-${paddingSize > 16 ? 16 : paddingSize}`;
    };

    // Obtenir la couleur de fond en fonction du niveau
    const getBackgroundColor = () => {
      if (matchesSearch && searchTerm) return 'bg-yellow-100';

      switch (level) {
        case 0: return 'bg-blue-100'; // Adapté du bleu primaire
        case 1: return 'bg-orange-100'; // Adapté de l'orange secondaire
        case 2: return 'bg-emerald-100'; // Contraste distinct pour niveau 3
        default: return 'bg-white';
      }
    };

    // Obtenir la couleur de bordure en fonction du niveau
    const getBorderColor = () => {
      switch (level) {
        case 0: return 'border-blue-300'; // Plus foncé pour meilleur contraste
        case 1: return 'border-orange-300'; // Plus foncé pour meilleur contraste
        case 2: return 'border-emerald-300'; // Plus foncé pour meilleur contraste
        default: return 'border-gray-400';
      }
    };

    // Obtenir la couleur du texte de niveau en fonction du niveau
    const getLevelBadgeColor = () => {
      switch (level) {
        case 0: return 'bg-blue-200 text-blue-800'; // Meilleur contraste
        case 1: return 'bg-orange-200 text-orange-800'; // Meilleur contraste
        case 2: return 'bg-emerald-200 text-emerald-800'; // Meilleur contraste
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    // Obtenir le style spécifique au niveau (style supplémentaire)
    const getLevelSpecificStyle = () => {
      switch (level) {
        case 0: return 'font-bold text-lg border-l-4 border-l-blue-500';
        case 1: return 'font-semibold text-base border-l-4 border-l-orange-500';
        case 2: return 'font-medium text-base border-l-4 border-l-emerald-500';
        default: return '';
      }
    };

    // Déterminer si le nœud doit être affiché ou non en fonction de la recherche
    const shouldDisplay = !searchTerm || matchesSearch || hasMatchingFields || hasMatchingChildren;

    // Déterminer si on doit développer le nœud
    // Vérifier si le niveau est déployé globalement (via expandedLevels)
    const levelIsExpanded = node.niveau ? expandedLevels[node.niveau] !== false : true;
    const shouldExpandNode = forceExpanded || (isExpanded && levelIsExpanded) || (searchTerm && (hasMatchingFields || hasMatchingChildren));

    // Si le nœud ne correspond pas à la recherche, ne pas l'afficher
    if (!shouldDisplay) {
      return null;
    }

    // if (node.niveau == 3) {
    //   console.log(node['var-type']);
    // }

    return (
      <div className={`border-b ${getBorderColor()} last:border-b-0 ${getBackgroundColor()} transition-all duration-200 ${getLevelSpecificStyle()}`}>
        <div
          className={`py-3 px-4 flex items-center hover:bg-opacity-80 cursor-pointer ${getIndentClass()} transition-all duration-200 gap-4`}
          onClick={toggleExpand}
        >
          {hasChildren ? (
            shouldExpandNode ? (
              <ChevronDown className="h-5 w-5 text-secondary mr-2" />
            ) : (
              <ChevronRight className="h-5 w-5 text-secondary mr-2" />
            )
          ) : (
            <div className="h-5 w-5 mr-2" /> // Empty space for alignment
          )}

          <div className="flex-1">
            <div className={`${matchesSearch && searchTerm ? 'text-orange-600 font-bold' : level === 0 ? 'text-blue-800' : level === 1 ? 'text-orange-800' : 'text-emerald-800'}`}>
              {node['entity-name']}
            </div>
            <div className="text-xs text-gray-500">ID: {node['id-record']}</div>
          </div>

          {node['var-type'] != null &&
            <Badge color={getVarTypeBadgeColor(node['var-type'])}>
              {node['var-type']}
            </Badge>
          }

          {/* Icône de conversation pour les niveaux 2 et 3 */}
          {isConversationFeatureEnabled && node.niveau && node.niveau <= 3 && (
            <div
              className="conversation-button"
              onClick={(e) => {
                e.stopPropagation();
                // Debug - Montrer les infos du nœud lors d'un clic
                console.log("Clicked node:", node);
                console.log("Node niveau:", node.niveau);
                console.log("Node entity-id:", node['entity-id']);
                console.log("Node id-record:", node['id-record']);

                try {
                  if (node.niveau && node.niveau < 3 && toggleGroupSelection) {
                    // Pour niveau 2, utiliser l'ID d'entité et le nom comme nom de groupe
                    toggleGroupSelection(node['entity-id'], node['entity-name']);
                  } else if (node.niveau === 3 && toggleFieldSelection) {
                    // Pour les entités niveau 3, tenter plusieurs formats d'ID
                    const fieldId = node['id-record'];

                    // Si l'ID contient [3]-, le supprimer pour obtenir seulement la partie numérique
                    let cleanId = fieldId;
                    if (typeof fieldId === 'string' && fieldId.includes("[3]-")) {
                      cleanId = fieldId.split("[3]-")[1];
                    }

                    // Vérifier le nom réel à utiliser - plutôt lib-fonc que entity-name pour niveau 3
                    const fieldName = node['lib-fonc'] || node['entity-name'];

                    if (cleanId) {
                      toggleFieldSelection(node['entity-id'], cleanId, fieldName);
                    }
                  }
                } catch (error) {
                  console.error("Error handling conversation click:", error);
                }
              }}
            >
              {/* Si le groupe ou le champ a des conversations, utiliser une icône remplie, sinon une icône vide */}
              {(() => {
                // Obtenir une version "nettoyée" de l'id pour niveau 3
                let cleanId = node['id-record'];
                if (node.niveau === 3 && typeof cleanId === 'string' && cleanId.includes("[3]-")) {
                  cleanId = cleanId.split("[3]-")[1];
                }

                if (node.niveau < 3 && getConversationsForGroup && getConversationsForGroup(node['entity-id'], node['entity-name']).length > 0) {
                  return (
                    <div className="flex items-center text-secondary">
                      <ChatBubbleIcon filled className="h-5 w-5 mr-1" />
                      <span className="text-xs font-medium">{getConversationsForGroup(node['entity-id'], node['entity-name']).length}</span>
                    </div>
                  );
                } else if (node.niveau === 3 && getConversationsForField && cleanId) {
                  // Pour niveau 3, essayer avec l'ID nettoyé
                  const conversationCount = getConversationsForField(node['entity-id'], cleanId).length;
                  if (conversationCount > 0) {
                    return (
                      <div className="flex items-center text-secondary">
                        <ChatBubbleIcon filled className="h-5 w-5 mr-1" />
                        <span className="text-xs font-medium">{conversationCount}</span>
                      </div>
                    );
                  }
                }

                // Par défaut: une icône non remplie
                return <ChatBubbleIcon className="h-5 w-5 text-gray-400 hover:text-secondary transition-colors duration-200" />;
              })()}
            </div>
          )}


          {node.exemple != null &&
            <code>
              {node.exemple}
            </code>
          }

          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 text-xs rounded-full font-medium ${getLevelBadgeColor()}`}>
              {'type' in node && node.niveau !== undefined ? `${node.type} - Niv ${node.niveau}` : node.niveau !== undefined ? `Niveau ${node.niveau}` : 'Niveau N/A'}
            </div>
          </div>
        </div>

        {/* Afficher les entités enfants s'ils existent et sont demandés */}
        {hasChildren && shouldExpandNode && (
          <div className={`border-l-4 ${getBorderColor()} ml-6`}>
            {childFields.map((childField, index) => {
              // Si c'est déjà une entité, l'utiliser directement
              if ('entity-name' in childField) {
                return (
                  <HierarchicalNode
                    key={`${childField['entity-id']}-${index}`}
                    node={childField as Entity}
                    level={level + 1}
                    searchTerm={searchTerm}
                    expandedLevels={expandedLevels}
                    forceExpanded={Boolean(forceExpanded || (searchTerm && (hasMatchingChildren || hasMatchingFields)))}
                    conversations={conversations}
                    toggleFieldSelection={toggleFieldSelection}
                    toggleGroupSelection={toggleGroupSelection}
                    isFieldSelected={isFieldSelected}
                    isGroupSelected={isGroupSelected}
                    getConversationsForField={getConversationsForField}
                    getConversationsForGroup={getConversationsForGroup}
                  />
                );
              }

              // Sinon, créer une entité pour chaque champ de niveau 2 ou 3
              const childEntity: Entity = {
                'entity-id': childField['entity-id'],
                'entity-name': childField['lib-fonc'],
                'niveau': childField.niveau,
                'id-record': String(childField['id-field']),
                'type': childField.type || 'UNKNOWN',
                'var-type': childField['var-type'],
                'exemple': childField.exemple,
                // Vérifier si le champ a déjà des "fields" définis
                'fields': 'fields' in childField && childField.fields
                  ? childField.fields
                  : node.fields.filter(field =>
                    'niveau' in field &&
                    field.niveau === (childField.niveau as number + 1) &&
                    'lib-group' in field &&
                    field['lib-group'] &&
                    field['lib-group'].includes(childField['lib-fonc'])
                  )
              };

              return (
                <HierarchicalNode
                  key={`${childEntity['entity-id']}-${index}`}
                  node={childEntity}
                  level={level + 1}
                  searchTerm={searchTerm}
                  expandedLevels={expandedLevels}
                  forceExpanded={Boolean(forceExpanded || (searchTerm && (hasMatchingChildren || hasMatchingFields)))}
                  conversations={conversations}
                  toggleFieldSelection={toggleFieldSelection}
                  toggleGroupSelection={toggleGroupSelection}
                  isFieldSelected={isFieldSelected}
                  isGroupSelected={isGroupSelected}
                  getConversationsForField={getConversationsForField}
                  getConversationsForGroup={getConversationsForGroup}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

const HierarchicalView: React.FC<HierarchicalViewProps> = ({
  data,
  searchTerm,
  conversations = [],
  toggleFieldSelection,
  toggleGroupSelection,
  isFieldSelected,
  isGroupSelected,
  getConversationsForField,
  getConversationsForGroup
}) => {
  // État pour contrôler l'expansion des niveaux
  const [expandedLevels, setExpandedLevels] = useState<{[key: number]: boolean}>({1: true, 2: true, 3: true}); // Tous les niveaux sont ouverts par défaut

  // Méthode pour basculer l'expansion d'un niveau spécifique
  const toggleLevelExpansion = (level: number) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  // Filtrer seulement les entités de niveau 1 pour l'affichage racine
  const niveau1Entities = data.filter(entity => entity.niveau === 1);

  // Calculer le nombre d'entités affichées après filtrage
  const displayedEntitiesCount = searchTerm
    ? niveau1Entities.filter(entity =>
      entity['entity-name'].toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Vérifier si des champs correspondent
      entity.fields.some(field =>
        'lib-fonc' in field && field['lib-fonc']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ('desc' in field && field.desc && field.desc.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    ).length
    : niveau1Entities.length;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-400">
      <div className="bg-primary text-white px-5 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-100">Structure hiérarchique</h2>
            <div className="text-sm text-gray-300 mt-1 opacity-90">
              {data.length} entités de premier niveau
              {searchTerm && ` - Recherche : "${searchTerm}"`}
            </div>
          </div>

          {/* <div className="bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-xs font-medium"> */}
          {/*   Codification par couleur */}
          {/* </div> */}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 px-4 pt-3 text-xs">
        <button
          onClick={() => toggleLevelExpansion(1)}
          className={`px-3 py-1.5 rounded-md bg-blue-100 text-blue-800 border ${expandedLevels[1] ? 'border-blue-500' : 'border-blue-300'} font-bold cursor-pointer hover:bg-blue-200 transition-colors`}
        >
          {expandedLevels[1] ? 'Niveau 1 ▼' : 'Niveau 1 ▶'}
        </button>
        <button
          onClick={() => toggleLevelExpansion(2)}
          className={`px-3 py-1.5 rounded-md bg-orange-100 text-orange-800 border ${expandedLevels[2] ? 'border-orange-500' : 'border-orange-300'} font-semibold cursor-pointer hover:bg-orange-200 transition-colors`}
        >
          {expandedLevels[2] ? 'Niveau 2 ▼' : 'Niveau 2 ▶'}
        </button>
        <button
          onClick={() => toggleLevelExpansion(3)}
          disabled
          className={`px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-800 border ${expandedLevels[3] ? 'border-emerald-500' : 'border-emerald-300'} font-medium cursor-pointer hover:bg-emerald-200 transition-colors`}
        >
          {expandedLevels[3] ? 'Niveau 3 ▼' : 'Niveau 3 ▶'}
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {niveau1Entities.map((entity) => (
          <HierarchicalNode
            key={entity['entity-id']}
            node={entity}
            level={0}
            searchTerm={searchTerm}
            expandedLevels={expandedLevels}
            conversations={conversations}
            toggleFieldSelection={toggleFieldSelection}
            toggleGroupSelection={toggleGroupSelection}
            isFieldSelected={isFieldSelected}
            isGroupSelected={isGroupSelected}
            getConversationsForField={getConversationsForField}
            getConversationsForGroup={getConversationsForGroup}
          />
        ))}
      </div>

      {/* Message si aucun résultat trouvé */}
      {searchTerm && displayedEntitiesCount === 0 && (
        <div className="p-8 text-center text-red-500">
          <div className="text-3xl mb-2">😕</div>
          <div className="font-medium">Aucun résultat trouvé pour "{searchTerm}"</div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalView;
