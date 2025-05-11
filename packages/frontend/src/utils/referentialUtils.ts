import { 
  Field, 
  Entity, 
  Conversation, 
  EntityId, 
  FieldId, 
  GroupName,
  FilterPredicate 
} from '@/types';

/**
 * Groupe les champs par leur attribut lib-group
 * @param fields - Liste des champs à grouper
 * @returns Un objet avec les noms de groupe comme clés et les tableaux de champs comme valeurs
 */
export const groupFieldsByLibGroup = (fields: Field[]): Record<string, Field[]> => {
  return fields.reduce<Record<string, Field[]>>((groups, field) => {
    if (!('lib-group' in field)) return groups;
    
    const groupName = field['lib-group'];
    return {
      ...groups,
      [groupName]: [...(groups[groupName] || []), field]
    };
  }, {});
};

/**
 * Crée un prédicat pour filtrer les conversations par groupe
 * @param entityId - ID de l'entité
 * @param groupName - Nom du groupe
 * @returns Une fonction de prédicat qui filtre les conversations
 */
export const createGroupConversationPredicate = (
  entityId: EntityId, 
  groupName: GroupName
): FilterPredicate<Conversation> => {
  return (conversation: Conversation): boolean => 
    conversation.linkedItems.some(item => 
      item.type === 'group' && 
      item.entityId === entityId && 
      item.groupName === groupName
    );
};

/**
 * Crée un prédicat pour filtrer les conversations par champ
 * @param entityId - ID de l'entité
 * @param fieldId - ID du champ
 * @returns Une fonction de prédicat qui filtre les conversations
 */
export const createFieldConversationPredicate = (
  entityId: EntityId, 
  fieldId: FieldId
): FilterPredicate<Conversation> => {
  return (conversation: Conversation): boolean => 
    conversation.linkedItems.some(item => 
      item.type === 'field' && 
      item.entityId === entityId && 
      item.fieldIds?.some(id => 
        id === fieldId || 
        id === Number(fieldId) || 
        String(id) === String(fieldId) ||
        (typeof id === 'string' && 
         typeof fieldId === 'string' && 
         (id.includes(`[3]-${fieldId}`) || 
          (id.includes('[3]-') && id.split('[3]-')[1] === fieldId) ||
          (fieldId.includes('[3]-') && fieldId.split('[3]-')[1] === id)))
    ));
};

/**
 * Trouve un champ par son ID avec support pour différents formats
 * @param fields - Liste des champs à parcourir
 * @param fieldId - ID du champ à trouver
 * @returns Le champ trouvé ou undefined
 */
export const findFieldById = (fields: Field[], fieldId: FieldId): Field | undefined => {
  return fields.find(field => {
    if (!('id-field' in field)) return false;
    
    const idField = field['id-field'];
    return idField === fieldId || 
           idField === Number(fieldId) || 
           String(idField) === String(fieldId) ||
           (typeof idField === 'string' && 
            typeof fieldId === 'string' && 
            (idField.includes(`[3]-${fieldId}`) || 
             (idField.includes('[3]-') && idField.split('[3]-')[1] === fieldId) ||
             (fieldId.includes('[3]-') && fieldId.split('[3]-')[1] === idField)));
  });
};

/**
 * Vérifie si un groupe a des conversations directes
 * @param conversations - Liste des conversations
 * @param entityId - ID de l'entité
 * @param groupName - Nom du groupe
 * @returns True si le groupe a des conversations, false sinon
 */
export const groupHasConversations = (
  conversations: Conversation[], 
  entityId: EntityId, 
  groupName: GroupName
): boolean => {
  const predicate = createGroupConversationPredicate(entityId, groupName);
  return conversations.some(predicate);
};

/**
 * Vérifie si des champs dans un groupe ont des conversations directes
 * @param conversations - Liste des conversations
 * @param entityId - ID de l'entité
 * @param fields - Liste des champs à vérifier
 * @returns True si un champ a des conversations, false sinon
 */
export const groupHasFieldsWithConversations = (
  conversations: Conversation[], 
  entityId: EntityId, 
  fields: Field[]
): boolean => {
  return fields.some(field => {
    if (!('id-field' in field)) return false;
    
    const fieldId = field['id-field'];
    const predicate = createFieldConversationPredicate(entityId, fieldId);
    return conversations.some(predicate);
  });
};

/**
 * Récupère les conversations associées à un groupe
 * @param conversations - Liste des conversations
 * @param entityId - ID de l'entité
 * @param groupName - Nom du groupe
 * @returns Liste des conversations liées au groupe
 */
export const getConversationsForGroup = (
  conversations: Conversation[],
  entityId: EntityId, 
  groupName: GroupName
): Conversation[] => {
  const predicate = createGroupConversationPredicate(entityId, groupName);
  return conversations.filter(predicate);
};

/**
 * Récupère les conversations associées à un champ spécifique
 * @param conversations - Liste des conversations
 * @param entityId - ID de l'entité
 * @param fieldId - ID du champ
 * @returns Liste des conversations liées au champ
 */
export const getConversationsForField = (
  conversations: Conversation[],
  entityId: EntityId,
  fieldId: FieldId
): Conversation[] => {
  const predicate = createFieldConversationPredicate(entityId, fieldId);
  return conversations.filter(predicate);
};

/**
 * Extrait tous les groupes uniques d'une liste d'entités
 * @param entities - Liste des entités à parcourir
 * @returns Un array de tuples contenant [entityId, groupName]
 */
export const extractUniqueGroups = (entities: Entity[]): [EntityId, GroupName][] => {
  const uniqueGroups = new Map<string, [EntityId, GroupName]>();
  
  entities.forEach(entity => {
    entity.fields.forEach(field => {
      if (!('lib-group' in field)) return;
      
      const key = `${entity['entity-id']}_${field['lib-group']}`;
      if (!uniqueGroups.has(key)) {
        uniqueGroups.set(key, [entity['entity-id'], field['lib-group']]);
      }
    });
  });
  
  return Array.from(uniqueGroups.values());
};

/**
 * Normalise un ID de champ pour la comparaison
 * @param fieldId - ID du champ à normaliser
 * @returns Version normalisée de l'ID pour la comparaison
 */
export const normalizeFieldId = (fieldId: FieldId): string => {
  if (typeof fieldId === 'string' && fieldId.includes('[3]-')) {
    return fieldId.split('[3]-')[1];
  }
  return String(fieldId);
};

/**
 * Filtre les entités par un terme de recherche
 * @param entities - Liste des entités à filtrer
 * @param searchTerm - Terme de recherche
 * @returns Liste des entités filtrées
 */
export const filterEntitiesBySearchTerm = (
  entities: Entity[], 
  searchTerm: string
): Entity[] => {
  if (!searchTerm) return entities;
  
  const term = searchTerm.toLowerCase();
  
  return entities.filter(entity => {
    // Recherche dans le nom de l'entité
    if (entity['entity-name'].toLowerCase().includes(term)) {
      return true;
    }
    
    // Recherche dans les champs
    return entity.fields.some(field => 
      ('lib-fonc' in field && field['lib-fonc']?.toLowerCase().includes(term)) ||
      ('desc' in field && field.desc && field.desc.toLowerCase().includes(term)) ||
      ('lib-group' in field && field['lib-group']?.toLowerCase().includes(term))
    );
  });
};
