import React from 'react';
import { Field } from '../../types/referential';
import { Conversation } from '../../types/conversation';

interface GroupRowProps {
  entityId: string;
  groupName: string;
  fields: Field[];
  isSelected: boolean;
  groupConversations: Conversation[];
  onSelect: (entityId: string, groupName: string) => void;
  onOpenConversation: (conversationId: string) => void;
  onClearSelection?: () => void; // Optionnel - fonction pour désélectionner tous les éléments
}

const GroupRow: React.FC<GroupRowProps> = ({
  entityId,
  groupName,
  fields,
  isSelected,
  groupConversations,
  onSelect,
  onOpenConversation,
  onClearSelection
}) => {
  return (
    <tr 
      className={`bg-indigo-100 cursor-pointer ${isSelected ? 'bg-indigo-200' : 'hover:bg-indigo-200'}`}
      onClick={() => onSelect(entityId, groupName)}
    >
      <td colSpan={5} className="px-2 md:px-4 py-2 md:py-3 text-indigo-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          {/* Col gauche avec nom de groupe */}
          <div className="md:col-span-8 flex flex-col">
            <div className="flex items-center">
              <div className="mr-2 flex-shrink-0">
                {isSelected ? (
                  <button 
                    className="focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onClearSelection) onClearSelection();
                    }}
                    title="Désélectionner"
                  >
                    <svg className="h-5 w-5 text-indigo-600 hover:text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </div>
              <h3 className="text-base font-bold truncate pr-2">{groupName}</h3>
              
              {/* Badge du nombre de champs (version mobile) */}
              <div className="ml-auto md:hidden text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full whitespace-nowrap">
                {fields.length} champ{fields.length > 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Indicateur de conversations pour le groupe - déplacé sous le titre */}
            {groupConversations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 ml-7">
                {groupConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenConversation(conv.id);
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
            )}
          </div>
          
          {/* Col droite avec badge count */}
          <div className="md:col-span-4 flex items-center justify-between md:justify-end">
            {/* Badge du nombre de champs (version desktop) */}
            <div className="hidden md:flex text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full whitespace-nowrap">
              {fields.length} champ{fields.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default React.memo(GroupRow);