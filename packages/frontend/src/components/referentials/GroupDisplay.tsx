import React, { useState } from 'react';
import { Entity, Field, GroupName, EntityId } from '@/types';
import ChevronDown from '@/components/icons/ChevronDown';
import ChevronRight from '@/components/icons/ChevronRight';
import ChatBubbleIcon from '@/components/icons/ChatBubbleIcon';
import FieldDisplay from './FieldDisplay';

interface GroupDisplayProps {
  entityId: EntityId;
  groupName: GroupName;
  fields: Field[];
  level: number;
  isSelected: boolean;
  hasConversations: boolean;
  conversationCount: number;
  onSelectGroup: (entityId: EntityId, groupName: GroupName) => void;
  onSelectField: (entityId: EntityId, fieldId: number | string, fieldName?: string) => void;
  isFieldSelected: (entityId: EntityId, fieldId: number | string) => boolean;
  getConversationsCount: (entityId: EntityId, fieldId: number | string) => number;
}

/**
 * Composant pur pour afficher un groupe de champs
 * Utilise la composition et le state local uniquement pour l'UI
 */
const GroupDisplay: React.FC<GroupDisplayProps> = ({
  entityId,
  groupName,
  fields,
  level,
  isSelected,
  hasConversations,
  conversationCount,
  onSelectGroup,
  onSelectField,
  isFieldSelected,
  getConversationsCount
}) => {
  // État local pour l'expansion du groupe (UI seulement)
  const [isExpanded, setIsExpanded] = useState(false);

  // Obtenir la couleur de fond en fonction du niveau
  const getBackgroundColor = () => {
    switch (level) {
      case 0: return 'bg-violet-100';
      case 1: return 'bg-amber-50';
      case 2: return 'bg-emerald-50';
      default: return 'bg-white';
    }
  };

  // Obtenir la couleur de bordure en fonction du niveau
  const getBorderColor = () => {
    switch (level) {
      case 0: return 'border-violet-300';
      case 1: return 'border-amber-300';
      case 2: return 'border-emerald-300';
      default: return 'border-gray-200';
    }
  };

  // Toggle l'état d'expansion
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Gérer la sélection du groupe
  const handleGroupSelect = () => {
    onSelectGroup(entityId, groupName);
  };

  return (
    <div className={`border-b ${getBorderColor()} ${getBackgroundColor()} ${isSelected ? 'bg-indigo-50' : ''}`}>
      <div 
        className="py-3 px-4 flex items-center cursor-pointer transition-all duration-200"
        onClick={handleGroupSelect}
      >
        <div className="flex-1 flex items-center">
          <div 
            className="mr-2 cursor-pointer" 
            onClick={toggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-indigo-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-indigo-600" />
            )}
          </div>
          
          <div>
            <div className={`font-medium ${isSelected ? 'text-indigo-600' : 'text-gray-900'}`}>
              {groupName}
            </div>
            <div className="text-xs text-gray-500">{fields.length} champs</div>
          </div>
        </div>
        
        {/* Indicateur de conversation */}
        <div className="ml-auto flex items-center">
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
      
      {/* Afficher les champs si le groupe est développé */}
      {isExpanded && (
        <div className="pl-8 border-l-2 ml-4 border-l-gray-200">
          {fields.map((field) => (
            <FieldDisplay
              key={`field-${entityId}-${field['id-field']}`}
              field={field}
              entityId={entityId}
              isSelected={isFieldSelected(entityId, field['id-field'])}
              hasConversations={getConversationsCount(entityId, field['id-field']) > 0}
              conversationCount={getConversationsCount(entityId, field['id-field'])}
              onSelect={() => onSelectField(entityId, field['id-field'], field['lib-fonc'])}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(GroupDisplay);