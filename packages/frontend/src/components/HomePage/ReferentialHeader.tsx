import React from 'react';
import SearchBar from '@/components/ui/SearchBar';
import EntityFilter from '@/components/referentials/EntityFilter';
import ConversationFilterButton from '@/components/referentials/ConversationFilterButton';
import UnreadConversationFilterButton from '@/components/referentials/UnreadConversationFilterButton';
import { Entity } from '@/types';

interface ReferentialHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedEntityId: string | null;
  onEntityChange: (id: string | null) => void;
  showOnlyWithConversations: boolean;
  onToggleShowOnlyWithConversations: (show: boolean) => void;
  showOnlyUnreadConversations: boolean;
  onToggleShowOnlyUnreadConversations: (show: boolean) => void;
  unreadConversationsCount: number;
  entities: Entity[];
  isConversationsEnabled: boolean;
}

/**
 * En-tête des référentiels avec filtres et contrôles
 */
const ReferentialHeader: React.FC<ReferentialHeaderProps> = ({
  searchTerm,
  onSearchChange,
  selectedEntityId,
  onEntityChange,
  showOnlyWithConversations,
  onToggleShowOnlyWithConversations,
  showOnlyUnreadConversations,
  onToggleShowOnlyUnreadConversations,
  unreadConversationsCount,
  entities,
  isConversationsEnabled
}) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 border border-gray-400">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-6">
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Rechercher par libellé, description..."
            className="flex-1"
          />

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <EntityFilter
              entities={entities}
              selectedEntity={selectedEntityId}
              onChange={onEntityChange}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {isConversationsEnabled && (
            <div className="flex items-center gap-4">
              <ConversationFilterButton
                active={showOnlyWithConversations}
                onChange={onToggleShowOnlyWithConversations}
              />
              <UnreadConversationFilterButton
                active={showOnlyUnreadConversations}
                onChange={onToggleShowOnlyUnreadConversations}
                unreadCount={unreadConversationsCount}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferentialHeader;
