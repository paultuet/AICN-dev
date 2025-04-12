import React from 'react';
import { Field } from '../../types/referential';
import { Conversation } from '../../types/conversation';
import IconBadge from '../ui/badges/IconBadge';
import IconButton from '../ui/buttons/IconButton';

interface FieldRowProps {
  field: Field;
  index: number;
  isSelected: boolean;
  belongsToGroupWithConversation: boolean;
  fieldConversations: Conversation[];
  searchTerm: string;
  onSelect: (entityId: string, fieldId: number) => void;
  onOpenConversation: (conversationId: string) => void;
  onClearSelection?: () => void; // Optionnel - fonction pour désélectionner tous les éléments
  entityMap: Record<string, string>; // Map of entity IDs to entity names
}

const FieldRow: React.FC<FieldRowProps> = ({
  field,
  index,
  isSelected,
  belongsToGroupWithConversation,
  fieldConversations,
  searchTerm,
  onSelect,
  onOpenConversation,
  onClearSelection,
  entityMap
}) => {
  return (
    <tr 
      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
        ${field['link-entity-id'] ? 'border-l-4 border-indigo-300' : ''} 
        ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-indigo-50'} 
        ${belongsToGroupWithConversation ? 'bg-indigo-50/30' : ''}
        transition-colors duration-150 cursor-pointer`}
      onClick={() => onSelect(field['entity-id'], field['id-field'])}
    >
      <td className="px-2 md:px-4 py-2 md:py-3 text-sm text-gray-500 text-center font-mono">
        <div className="flex items-center justify-center">
          {isSelected && (
            <IconButton
              size="sm"
              variant="primary"
              round
              className="mr-2 bg-blue-500 hover:bg-red-500"
              onClick={(e) => {
                e.stopPropagation();
                if (onClearSelection) onClearSelection();
              }}
              label="Désélectionner"
              icon={
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              }
            />
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
              {fieldConversations.map(conv => {
                const conversationIcon = (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                );
                
                return (
                  <IconBadge
                    key={conv.id}
                    icon={conversationIcon}
                    color="blue"
                    clickable
                    onClick={() => onOpenConversation(conv.id)}
                  >
                    {conv.messageCount}
                  </IconBadge>
                );
              })}
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
            {entityMap[field['link-entity-id']] || field['link-entity-id']}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
    </tr>
  );
};

export default React.memo(FieldRow);