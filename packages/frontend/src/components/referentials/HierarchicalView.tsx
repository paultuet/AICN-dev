import React, { useState, useEffect } from 'react';
import { Entity, Field } from '@/types/referential';
import { Conversation } from '@/types/conversation';
import { ChevronRight, ChevronDown, ExternalLink, ChatBubbleIcon } from '@/components/icons';
import { Badge } from '../ui';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useReferentials } from '@/hooks/useReferentials';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';


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

const getVarTypeBadgeColor = (varType: string) => {
  switch (varType) {
    case 'TEXT': return 'blue';
    case 'VARCHAR': return 'blue';
    case 'NUMBER': return 'amber';
    case 'INTEGER': return 'amber';
    case 'DATE': return 'purple';
    case 'BOOL': return 'red';
    case 'BOOLEEN': return 'red';
    case 'LINK': return 'cyan';
    default: return 'gray';
  }
};

const NodeVarType: React.FC<{ node: Field | Entity }> = ({ node }) => {

  if (!node['var-type']) {
    return null;
  }

  const hasLink = node['link-entity-id'] != null;

  const badgeType = <Badge color={getVarTypeBadgeColor(node['var-type'])} className={`${hasLink ? 'cursor-pointer' : ''}`}>
    {node['var-type']}
    {hasLink && <ExternalLink className="ml-1 w-4 h-4" />}
  </Badge>


  if (hasLink && node['link-entity-id']) {
    // Show Dialog for linked entities
    return (
      <Dialog>
        <DialogTrigger>{badgeType}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Champs liés à : {node['lib-fonc'] || node['entity-name']}</DialogTitle>
            <DialogDescription>
              Entité liée: {Array.isArray(node['link-entity-id']) ? node['link-entity-id'].join(', ') : node['link-entity-id']}
            </DialogDescription>
          </DialogHeader>
          <h2>POPUP En cours de DEV</h2>

          <LinkedFieldsContent linkEntityId={node['link-entity-id']} />
        </DialogContent>
      </Dialog>

    )
  } else {
    return badgeType;
  }
}

const HierarchicalNode: React.FC<{
  node: Entity;
  level: number;
  searchTerm?: string;
  forceExpanded?: boolean;
  expandedLevels?: { [key: number]: boolean }; // Ajout de la prop pour l'expansion par niveau
  lastGlobalAction?: number; // Timestamp de la dernière action globale sur les badges
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
  expandedLevels = { 1: true, 2: true, 3: true }, // Valeur par défaut
  lastGlobalAction = 0, // Valeur par défaut
  conversations = [],
  toggleFieldSelection,
  toggleGroupSelection,
  isFieldSelected,
  isGroupSelected,
  getConversationsForField,
  getConversationsForGroup
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [showFields, setShowFields] = useState<boolean>(false);
    const [lastNodeAction, setLastNodeAction] = useState<number>(0); // Timestamp de la dernière action sur ce noeud

    // Effet pour suivre les changements d'expandedLevels (actions globales)
    useEffect(() => {
      // Si une action globale est plus récente que la dernière action individuelle
      // ou si aucune action individuelle n'a été effectuée, appliquer l'état global
      if (lastGlobalAction > lastNodeAction) {
        // Appliquer l'état global du niveau si applicable
        if (node.niveau && expandedLevels[node.niveau] !== undefined) {
          setIsExpanded(expandedLevels[node.niveau]);
        }
      }
    }, [expandedLevels, lastGlobalAction, node.niveau]);

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

    const toggleExpand = (e: React.MouseEvent) => {
      // Éviter la propagation de l'événement pour empêcher les clics multiples
      e.stopPropagation();

      // Toggle the individual node's expanded state
      setIsExpanded(prev => !prev);

      // Enregistrer le timestamp de cette action individuelle
      // Il sera toujours plus récent que la dernière action globale
      setLastNodeAction(Date.now());
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
        // case 0: return 'bg-blue-100'; // Adapté du bleu primaire
        // case 1: return 'bg-orange-100'; // Adapté de l'orange secondaire
        // case 2: return 'bg-emerald-100'; // Contraste distinct pour niveau 3
        default: return 'bg-white';
      }
    };

    // Obtenir la couleur de bordure en fonction du niveau
    const getBorderColor = () => {
      switch (level) {
        // case 0: return 'border-blue-300'; // Plus foncé pour meilleur contraste
        // case 1: return 'border-orange-300'; // Plus foncé pour meilleur contraste
        // case 2: return 'border-emerald-300'; // Plus foncé pour meilleur contraste
        default: return 'border-gray-200';
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

    const getLevelSpecificTextColor = () => {
      switch (level) {
        case 0:
          return 'text-blue-800';
        case 1:
          return 'text-orange-800'
        case 2:
          return 'text-emerald-800'
        default:
          return '';
      }
    };



    // Déterminer si le nœud doit être affiché ou non en fonction de la recherche
    const shouldDisplay = !searchTerm || matchesSearch || hasMatchingFields || hasMatchingChildren;

    // Déterminer si le niveau est déployé globalement (via expandedLevels)
    // Cette information n'est plus directement utilisée avec la nouvelle logique
    // car l'état est maintenant géré via l'effet useEffect

    // Logique d'expansion simplifiée
    // 1. Si la recherche correspond ou si l'expansion est forcée par un parent, toujours afficher
    // 2. Sinon, utiliser l'état local du noeud qui a été mis à jour soit par une action individuelle,
    //    soit par l'effet qui réagit aux actions globales

    const shouldExpandNode = forceExpanded ||
      (searchTerm && (hasMatchingFields || hasMatchingChildren)) ||
      isExpanded; // Utiliser l'état local qui est déjà synchronisé avec les actions globales

    // Si le nœud ne correspond pas à la recherche, ne pas l'afficher
    if (!shouldDisplay) {
      return null;
    }

    return (
      <div className={`border ${getBorderColor()} ${getBackgroundColor()} transition-all duration-200 ${getLevelSpecificStyle()}`}>
        <div
          className={`py-3 px-4 flex items-center hover:bg-opacity-80 ${getIndentClass()} transition-all duration-200 gap-4`}
          data-level={level}
          data-node-id={node['id-record']}
        >
          {hasChildren ? (
            <button onClick={toggleExpand} className="cursor-pointer">
              {shouldExpandNode ? (
                <ChevronDown className={`h-5 w-5 ${getLevelSpecificTextColor()} mr-2`} />
              ) : (
                <ChevronRight className={`h-5 w-5 ${getLevelSpecificTextColor()} mr-2`} />
              )}
            </button>
          ) : (
            <div className="h-5 w-5 mr-2" /> // Empty space for alignment
          )}

          <div className="flex-1">
            <div onClick={toggleExpand} className={`cursor-pointer ${matchesSearch && searchTerm ? 'text-orange-600 font-bold' : getLevelSpecificTextColor()}`}>
              {node['entity-name']}
            </div>
            <div className="text-xs text-gray-500">ID: {node['id-record']}</div>
          </div>

          <NodeVarType node={node} />


          {/* Icône de conversation pour les niveaux 2 et 3 */}
          {isConversationFeatureEnabled && node.niveau && node.niveau <= 3 && (
            <div
              className="conversation-button"
              onClick={(e) => {
                e.stopPropagation();

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
          <div className={`ml-6`}>
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
                    lastGlobalAction={lastGlobalAction}
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
                'link-entity-id': childField['link-entity-id'],
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
                  lastGlobalAction={lastGlobalAction}
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
  const [expandedLevels, setExpandedLevels] = useState<{ [key: number]: boolean }>({ 1: true, 2: true, 3: true }); // Tous les niveaux sont ouverts par défaut
  // Timestamp de la dernière action globale (clic sur badge)
  const [lastGlobalAction, setLastGlobalAction] = useState<number>(0);

  // Méthode pour basculer l'expansion d'un niveau spécifique
  const toggleLevelExpansion = (level: number) => {
    // Toggle the expansion state for the specific level
    const newExpansionState = !expandedLevels[level];

    // Mise à jour de l'état d'expansion du niveau
    setExpandedLevels(prev => ({
      ...prev,
      [level]: newExpansionState
    }));

    // Enregistrer le timestamp de cette action globale
    // Cela permettra aux composants enfants de savoir qu'une action globale a eu lieu
    setLastGlobalAction(Date.now());

    // Action timestamp recorded for global level toggling
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
      <div className="text-black px-5 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Structure hiérarchique</h2>
            <div className="text-sm text-gray-800 mt-1 opacity-90">
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
            lastGlobalAction={lastGlobalAction}
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

// Composant pour afficher les champs liés
interface LinkedFieldsContentProps {
  linkEntityId: string | string[];
}

const LinkedFieldsContent: React.FC<LinkedFieldsContentProps> = ({ linkEntityId }) => {
  const { data: referentials = [], isLoading: loading, error } = useReferentials();
  const [linkedFields, setLinkedFields] = useState<Array<Field | Entity>>([]);

  useEffect(() => {
    if (linkEntityId && referentials.length > 0) {
      // Convertir en tableau si c'est une seule valeur
      const entityIds = Array.isArray(linkEntityId) ? linkEntityId : [linkEntityId];
      const linkedFieldsFound: Array<Field | Entity> = [];

      // Parcourir toutes les entités pour trouver les champs liés
      for (const entity of referentials) {
        // Vérifier si l'entité elle-même correspond
        if (entityIds.includes(entity['entity-id']) || entityIds.includes(entity['id-record'] || '')) {
          linkedFieldsFound.push(entity);
          continue;
        }

        // Rechercher dans les champs de l'entité
        if (entity.fields?.length > 0) {
          // Parcourir tous les champs et sous-champs
          const findLinkedFields = (fields: Array<Field | Entity>, parentEntity: Entity) => {
            for (const field of fields) {
              // Vérifier si le champ correspond à un ID recherché
              const fieldId = 'id-field' in field ? field['id-field'] :
                'id-record' in field ? field['id-record'] : '';

              if (entityIds.includes(String(fieldId))) {
                // Ajouter des informations sur l'entité parente
                const enrichedField = {
                  ...field,
                  _parentEntityName: parentEntity['entity-name'],
                  _parentEntityId: parentEntity['entity-id']
                };
                linkedFieldsFound.push(enrichedField);
              }

              // Chercher récursivement dans les sous-champs si présents
              if ('fields' in field && field.fields && field.fields.length > 0) {
                findLinkedFields(field.fields, parentEntity);
              }
            }
          };

          findLinkedFields(entity.fields, entity);
        }
      }

      setLinkedFields(linkedFieldsFound);
    }
  }, [linkEntityId, referentials]);

  if (loading) {
    return <LoadingSpinner size="md" />;
  }

  if (error) {
    return <ErrorMessage message={error instanceof Error ? error.message : "Erreur lors du chargement des champs liés"} />;
  }

  if (linkedFields.length === 0) {
    return <div className="py-4 text-center text-gray-500">Aucun champ lié trouvé</div>;
  }

  return (
    <div className="py-2">
      {linkedFields.length > 0 ? (
        linkedFields.map((item, index) => {
          // Déterminer si c'est un champ ou une entité
          const isEntityType = 'entity-name' in item && 'fields' in item;

          // Informations de base pour l'affichage
          const itemName = isEntityType
            ? item['entity-name']
            : 'lib-fonc' in item
              ? item['lib-fonc']
              : 'Champ sans nom';

          const itemId = isEntityType
            ? item['entity-id'] || item['id-record']
            : 'id-field' in item
              ? item['id-field']
              : 'id-record' in item
                ? item['id-record']
                : 'ID inconnu';

          const itemType = item['var-type'] || 'Type inconnu';

          // Parent info (seulement pour les champs)
          const hasParentInfo = '_parentEntityName' in item;

          return (
            <div key={index} className="mb-4 border border-gray-200 rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">{itemName}</h3>
                <Badge color={getVarTypeBadgeColor(itemType)}>
                  {itemType}
                </Badge>
              </div>

              {/* Informations de base */}
              <div className="text-sm text-gray-700 mb-2">
                <div>ID: <span className="font-mono">{itemId}</span></div>
                {hasParentInfo && (
                  <div className="text-xs text-gray-500 mt-1">
                    Appartient à: {(item as any)._parentEntityName} (ID: {(item as any)._parentEntityId})
                  </div>
                )}
              </div>

              {/* Afficher les champs pour les entités */}
              {isEntityType && 'fields' in item && item.fields && item.fields.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  <h4 className="font-medium mb-2">Champs</h4>
                  <div className="space-y-2 pl-2">
                    {item.fields.map((field, fieldIndex) => {
                      // Vérifier si c'est un champ ou une entité
                      const fieldName = 'lib-fonc' in field ? field['lib-fonc'] :
                        'entity-name' in field ? field['entity-name'] : 'Champ sans nom';
                      const fieldId = 'id-field' in field ? field['id-field'] :
                        'id-record' in field ? field['id-record'] : 'ID inconnu';
                      const fieldType = field['var-type'] || 'Type inconnu';

                      return (
                        <div key={fieldIndex} className="flex justify-between items-center border-b border-gray-100 pb-1">
                          <div>
                            <span className="font-medium">{fieldName}</span>
                            <span className="text-xs text-gray-500 ml-2">ID: {fieldId}</span>
                          </div>
                          <Badge color={getVarTypeBadgeColor(fieldType)}>
                            {fieldType}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-center text-gray-500 py-4">Aucun champ ou entité lié trouvé</div>
      )}

      <DialogFooter className="mt-4">
        <div className="text-xs text-gray-500">
          {linkedFields.length} élément(s) lié(s) trouvé(s)
        </div>
      </DialogFooter>
    </div>
  );
};

export default HierarchicalView;
