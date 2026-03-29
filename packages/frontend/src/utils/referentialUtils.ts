import {
  Entity,
  SourceField,
  Conversation,
  EntityId,
  FieldId,
  GroupName,
  FilterPredicate
} from '@/types';

/**
 * Crée un prédicat pour filtrer les conversations par groupe
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
        String(id) === String(fieldId)
      )
    );
};

/**
 * Vérifie si un groupe a des conversations directes
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
 * Vérifie si des champs dans une liste ont des conversations directes
 */
export const groupHasFieldsWithConversations = (
  conversations: Conversation[],
  entityId: EntityId,
  fields: SourceField[]
): boolean => {
  return fields.some(field => {
    const fieldId = field['code-champ'] || field.id;
    const predicate = createFieldConversationPredicate(entityId, fieldId);
    return conversations.some(predicate);
  });
};

/**
 * Récupère les conversations associées à un groupe
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
 * Filtre les entités par un terme de recherche (récursif)
 */
export const filterEntitiesBySearchTerm = (
  entities: Entity[],
  searchTerm: string
): Entity[] => {
  if (!searchTerm) return entities;

  const term = searchTerm.toLowerCase();

  return entities.filter(entity => {
    if (entity['entity-name'].toLowerCase().includes(term)) {
      return true;
    }

    return entity.fields.some(field => {
      // SourceField (leaf)
      if ('code-champ' in field) {
        const sf = field as SourceField;
        return (
          sf.libelle?.toLowerCase().includes(term) ||
          sf['code-champ']?.toLowerCase().includes(term) ||
          sf.commentaire?.toLowerCase().includes(term) ||
          sf['nom-champ-code']?.toLowerCase().includes(term)
        );
      }
      // Entity (NIV2)
      if ('entity-name' in field) {
        return (field as Entity)['entity-name']?.toLowerCase().includes(term);
      }
      return false;
    });
  });
};
