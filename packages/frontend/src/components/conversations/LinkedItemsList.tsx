import React from 'react';
import { Selection, Entity } from '@/types';

interface LinkedItemsListProps {
  linkedItems: Selection[];
  referentials: Entity[];
}

/**
 * Composant pur pour afficher les éléments liés (champs et groupes) d'une conversation
 */
const LinkedItemsList: React.FC<LinkedItemsListProps> = ({
  linkedItems,
  referentials
}) => {
  if (linkedItems.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-gray-500 mb-1">Éléments liés:</p>
      <div className="flex flex-wrap gap-1">
        {linkedItems.map((item, idx) => {
          const entity = referentials.find(e => e['entity-id'] === item.entityId);
          
          if (item.type === 'group') {
            return (
              <span key={`link-${idx}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                {entity?.['entity-name'] || 'Entité'} - {item.groupName}
              </span>
            );
          } else if (item.type === 'field') {
            return (
              <span key={`link-${idx}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {entity?.['entity-name'] || 'Entité'} - {item.fieldName || `${item.fieldIds?.length || 0} champ(s)`}
              </span>
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
};

export default React.memo(LinkedItemsList);