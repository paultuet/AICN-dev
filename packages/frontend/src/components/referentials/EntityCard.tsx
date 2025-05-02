import React from 'react';
import { Entity, Field } from '../../types/referential';
import { Conversation } from '../../types/conversation';
import GroupRow from './GroupRow';
import FieldRow from './FieldRow';
import { groupFieldsByLibGroup } from '../../utils/referentialUtils';
import useFeatureFlag from '../../hooks/useFeatureFlag';


interface EntityCardProps {
  entity: Entity;
  conversations: Conversation[];
  searchTerm: string;
  showOnlyWithConversations: boolean;
  isGroupSelected: (entityId: string, groupName: string) => boolean;
  isFieldSelected: (entityId: string, fieldId: number) => boolean;
  toggleGroupSelection: (entityId: string, groupName: string) => void;
  toggleFieldSelection: (entityId: string, fieldId: number) => void;
  openConversation: (conversationId: string) => void;
  getConversationsForGroup: (entityId: string, groupName: string) => Conversation[];
  getConversationsForField: (entityId: string, fieldId: number) => Conversation[];
  fieldBelongsToGroupWithConversation: (entityId: string, fieldId: number) => boolean;
  shouldDisplayGroup: (entityId: string, groupName: string, fields: Field[]) => boolean;
  shouldDisplayField: (entityId: string, fieldId: number) => boolean;
  clearSelection: () => void; // Fonction pour désélectionner tous les éléments
  referentialEntityMap: Record<string, string>; // Map of entity IDs to entity names
}

const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  searchTerm,
  showOnlyWithConversations,
  isGroupSelected,
  isFieldSelected,
  toggleGroupSelection,
  toggleFieldSelection,
  openConversation,
  getConversationsForGroup,
  getConversationsForField,
  fieldBelongsToGroupWithConversation,
  shouldDisplayGroup,
  shouldDisplayField,
  clearSelection,
  referentialEntityMap
}) => {
  const groupedFields = groupFieldsByLibGroup(entity.fields);
  const isFeatureConversationsEnabled = useFeatureFlag('conversations');

  return (
    <div className="mb-6 sm:mb-8 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
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
            {Object.entries(groupedFields).map(([groupName, fields]) => {
              // Vérifier si le groupe devrait être affiché
              if (showOnlyWithConversations && !shouldDisplayGroup(entity['entity-id'], groupName, fields)) {
                return null;
              }
              
              // Filtrer les champs à afficher
              const filteredFields = showOnlyWithConversations
                ? fields.filter(field => shouldDisplayField(entity['entity-id'], field['id-field']))
                : fields;

              // Si aucun champ à afficher après filtrage et pas de conversations sur le groupe, ne pas afficher le groupe
              const groupConversations = getConversationsForGroup(entity['entity-id'], groupName);
              if (showOnlyWithConversations && filteredFields.length === 0 && groupConversations.length === 0) {
                return null;
              }
                  
              return (
                <React.Fragment key={`${entity['entity-id']}-${groupName}`}>
                  <GroupRow 
                    entityId={entity['entity-id']}
                    groupName={groupName}
                    fields={filteredFields}
                    isSelected={isGroupSelected(entity['entity-id'], groupName)}
                    groupConversations={groupConversations}
                    onSelect={toggleGroupSelection}
                    onOpenConversation={openConversation}
                    onClearSelection={clearSelection}
                  />
                  
                  {filteredFields.map((field, index) => {
                    // Rechercher les conversations existantes pour ce champ spécifique
                    const fieldConversations = getConversationsForField(entity['entity-id'], field['id-field']);
                    
                    // Vérifier si le champ appartient à un groupe avec des conversations
                    const belongsToGroupWithConversation = fieldBelongsToGroupWithConversation(entity['entity-id'], field['id-field']);
                    
                    // Si le filtre est actif et que le champ ne devrait pas être affiché, ne pas le rendre
                    if (showOnlyWithConversations && !shouldDisplayField(entity['entity-id'], field['id-field'])) {
                      return null;
                    }
                    
                    return (
                      <FieldRow 
                        key={field['id-field']}
                        field={field}
                        index={index}
                        isSelected={isFieldSelected(entity['entity-id'], field['id-field'])}
                        belongsToGroupWithConversation={belongsToGroupWithConversation}
                        fieldConversations={fieldConversations}
                        searchTerm={searchTerm}
                        onSelect={toggleFieldSelection}
                        onOpenConversation={openConversation}
                        onClearSelection={clearSelection}
                        entityMap={referentialEntityMap}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(EntityCard);
