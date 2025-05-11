import React from 'react';
import SearchBar from '@/components/ui/SearchBar';
import EntityFilter from '@/components/referentials/EntityFilter';
import ConversationFilterButton from '@/components/referentials/ConversationFilterButton';
import { Entity } from '@/types';

interface ReferentialHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedEntityId: string | null;
  onEntityChange: (id: string | null) => void;
  showOnlyWithConversations: boolean;
  onToggleShowOnlyWithConversations: (show: boolean) => void;
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
  entities,
  isConversationsEnabled
}) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 border border-gray-200">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-6">
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Rechercher par libellé, description..."
            className="flex-1"
          />

          <EntityFilter
            entities={entities}
            selectedEntity={selectedEntityId}
            onChange={onEntityChange}
            className="w-full md:w-80"
          />
        </div>

        <div className="flex items-center justify-between">
          {isConversationsEnabled && (
            <ConversationFilterButton
              active={showOnlyWithConversations}
              onChange={onToggleShowOnlyWithConversations}
            />
          )}
        </div>
      </div>

      <div className="mt-5 text-sm">
        <p className="text-black font-medium">
          Affichage de la structure hiérarchique des référentiels
          {searchTerm && ` pour la recherche "${searchTerm}"`}
        </p>
      </div>
    </div>
  );
};

export default React.memo(ReferentialHeader);