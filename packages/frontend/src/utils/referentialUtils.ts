import { Field } from '@/types/referential';
import { Conversation } from '@/types/conversation';

/**
 * Groupe les champs par leur attribut lib-group
 * @param fields Liste des champs à grouper
 * @returns Un objet avec les noms de groupe comme clés et les tableaux de champs comme valeurs
 */
export const groupFieldsByLibGroup = (fields: Field[]): Record<string, Field[]> => {
  const groups: Record<string, Field[]> = {};
  
  fields.forEach(field => {
    const groupName = field['lib-group'];
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(field);
  });
  
  return groups;
};

/**
 * Vérifie si un groupe a des conversations directes
 * @param conversations Liste des conversations
 * @param entityId ID de l'entité
 * @param groupName Nom du groupe
 * @returns True si le groupe a des conversations, false sinon
 */
export const groupHasConversations = (
  conversations: Conversation[], 
  entityId: string, 
  groupName: string
): boolean => {
  return conversations.some(conversation => 
    conversation.linkedItems.some(item => 
      item.type === 'group' && 
      item.entityId === entityId && 
      item.groupName === groupName
    )
  );
};

/**
 * Vérifie si des champs dans un groupe ont des conversations directes
 * @param conversations Liste des conversations
 * @param entityId ID de l'entité
 * @param fields Liste des champs à vérifier
 * @returns True si un champ a des conversations, false sinon
 */
export const groupHasFieldsWithConversations = (
  conversations: Conversation[], 
  entityId: string, 
  fields: Field[]
): boolean => {
  return fields.some(field => {
    const fieldId = field['id-field'];
    return conversations.some(conversation => 
      conversation.linkedItems.some(item => 
        item.type === 'field' && 
        item.entityId === entityId && 
        item.fieldIds?.some(id => 
          id === fieldId || 
          id === Number(fieldId) || 
          String(id) === String(fieldId)
        )
      )
    );
  });
};

/**
 * Récupère les conversations associées à un groupe
 * @param conversations Liste des conversations
 * @param entityId ID de l'entité
 * @param groupName Nom du groupe
 * @returns Liste des conversations liées au groupe
 */
export const getConversationsForGroup = (
  conversations: Conversation[],
  entityId: string, 
  groupName: string
): Conversation[] => {
  return conversations.filter(conversation => 
    conversation.linkedItems.some(item => 
      item.type === 'group' && 
      item.entityId === entityId && 
      item.groupName === groupName
    )
  );
};

/**
 * Récupère les conversations associées à un champ spécifique
 * @param conversations Liste des conversations
 * @param entityId ID de l'entité
 * @param fieldId ID du champ
 * @returns Liste des conversations liées au champ
 */
export const getConversationsForField = (
  conversations: Conversation[],
  entityId: string, 
  fieldId: number | string
): Conversation[] => {
  return conversations.filter(conversation => 
    conversation.linkedItems.some(item => 
      item.type === 'field' && 
      item.entityId === entityId && 
      item.fieldIds?.some(id => 
        id === fieldId || 
        id === Number(fieldId) || 
        String(id) === String(fieldId)
      )
    )
  );
};
