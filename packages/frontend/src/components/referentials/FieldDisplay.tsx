import React from 'react';
import { Field, Conversation, EntityId } from '@/types';
import ChatBubbleIcon from '@/components/icons/ChatBubbleIcon';
import { Badge } from '@/components/ui';

interface FieldDisplayProps {
  field: Field;
  entityId: EntityId;
  isSelected: boolean;
  hasConversations: boolean;
  conversationCount: number;
  onSelect: () => void;
}

/**
 * Composant pur pour afficher un champ de référentiel
 * Utilise la composition pour maximiser la réutilisabilité
 */
const FieldDisplay: React.FC<FieldDisplayProps> = ({
  field,
  entityId,
  isSelected,
  hasConversations,
  conversationCount,
  onSelect
}) => {
  // Déterminer le type de badge à afficher en fonction du type de champ
  const getTypeBadgeColor = (varType?: string | null) => {
    switch (varType) {
      case 'TEXT':
      case 'VARCHAR': return 'blue';
      case 'NUMBER':
      case 'INTEGER': return 'amber';
      case 'DATE': return 'purple';
      case 'BOOL':
      case 'BOOLEEN': return 'red';
      case 'LINK': return 'emerald';
      default: return 'gray';
    }
  };

  return (
    <div 
      className={`border-b border-gray-100 py-3 px-4 text-sm hover:bg-gray-50 transition-colors duration-150 ${
        isSelected ? 'bg-indigo-50' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-900">{field['lib-fonc']}</div>
          {field.desc && <div className="text-xs text-gray-500 mt-1">{field.desc}</div>}
        </div>
        
        <div className="flex items-center space-x-2">
          {field['var-type'] && (
            <Badge color={getTypeBadgeColor(field['var-type'])}>
              {field['var-type']}
            </Badge>
          )}
          
          {/* Indicateur de conversation */}
          {hasConversations ? (
            <div className="flex items-center text-indigo-600">
              <ChatBubbleIcon filled className="h-5 w-5 mr-1" />
              <span className="text-xs font-medium">{conversationCount}</span>
            </div>
          ) : (
            <ChatBubbleIcon className="h-5 w-5 text-gray-400 hover:text-indigo-600 transition-colors duration-200" />
          )}
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

export default React.memo(FieldDisplay);
