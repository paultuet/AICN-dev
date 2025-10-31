import React, { useState } from "react";
import { Entity } from "@/types/referential";
import { Conversation } from "@/types/conversation";
import { HierarchicalNode } from "./hierarchical";

interface HierarchicalViewProps {
  data: Entity[];
  searchTerm?: string;
  selectedType?: string | null;
  conversations?: Conversation[];
  toggleFieldSelection?: (
    entityId: string,
    fieldId: number | string,
    fieldName?: string,
  ) => void;
  toggleGroupSelection?: (entityId: string, groupName: string) => void;
  isFieldSelected?: (entityId: string, fieldId: number | string) => boolean;
  isGroupSelected?: (entityId: string, groupName: string) => boolean;
  getConversationsForField?: (
    entityId: string,
    fieldId: number | string,
  ) => Conversation[];
  getConversationsForGroup?: (
    entityId: string,
    groupName: string,
  ) => Conversation[];
  hasUnreadConversationsForField?: (
    entityId: string,
    fieldId: number | string,
  ) => boolean;
  hasUnreadConversationsForGroup?: (
    entityId: string,
    groupName: string,
  ) => boolean;
}

/**
 * Main hierarchical view container component
 * Displays entities in a tree structure with level-based expansion controls
 */
const HierarchicalView: React.FC<HierarchicalViewProps> = ({
  data,
  searchTerm,
  selectedType,
  conversations = [],
  toggleFieldSelection,
  toggleGroupSelection,
  isFieldSelected,
  isGroupSelected,
  getConversationsForField,
  getConversationsForGroup,
  hasUnreadConversationsForField,
  hasUnreadConversationsForGroup,
}) => {
  const [expandedLevels, setExpandedLevels] = useState<{
    [key: number]: boolean;
  }>({ 1: true, 2: true, 3: true, 4: true });
  const [lastGlobalAction, setLastGlobalAction] = useState<number>(0);

  const toggleLevelExpansion = (level: number) => {
    const newExpansionState = !expandedLevels[level];

    setExpandedLevels((prev) => ({
      ...prev,
      [level]: newExpansionState,
    }));

    setLastGlobalAction(Date.now());
  };

  const niveau1Entities = data.filter((entity) => entity.niveau === 1);

  const displayedEntitiesCount = searchTerm
    ? niveau1Entities.filter(
        (entity) =>
          entity["entity-name"]
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          entity.fields.some(
            (field) =>
              ("entity-name" in field &&
                field["entity-name"]
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase())) ||
              ("desc" in field &&
                field.desc &&
                field.desc.toLowerCase().includes(searchTerm.toLowerCase())),
          ),
      ).length
    : niveau1Entities.length;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-400">
      <div className="text-black px-5 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Structure hiérarchique</h2>
            <div className="text-sm text-gray-800 mt-1 opacity-90">
              {data.length} entités de premier niveau
              {searchTerm && ` - Recherche : "${searchTerm}"`}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 px-4 pt-3 text-xs">
        <button
          onClick={() => toggleLevelExpansion(1)}
          className={`px-3 py-1.5 rounded-md bg-blue-100 text-blue-800 border ${expandedLevels[1] ? "border-blue-500" : "border-blue-300"} font-bold cursor-pointer hover:bg-blue-200 transition-colors`}
        >
          {expandedLevels[1] ? "Niveau 1 ▼" : "Niveau 1 ▶"}
        </button>
        <button
          onClick={() => toggleLevelExpansion(2)}
          className={`px-3 py-1.5 rounded-md bg-orange-100 text-orange-800 border ${expandedLevels[2] ? "border-orange-500" : "border-orange-300"} font-semibold cursor-pointer hover:bg-orange-200 transition-colors`}
        >
          {expandedLevels[2] ? "Niveau 2 ▼" : "Niveau 2 ▶"}
        </button>
        <button
          onClick={() => toggleLevelExpansion(3)}
          className={`px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-800 border ${expandedLevels[3] ? "border-emerald-500" : "border-emerald-300"} font-medium cursor-pointer hover:bg-emerald-200 transition-colors`}
        >
          {expandedLevels[3] ? "Niveau 3 ▼" : "Niveau 3 ▶"}
        </button>
        {selectedType === "NMR" && (
          <button
            onClick={() => toggleLevelExpansion(4)}
            className={`px-3 py-1.5 rounded-md bg-purple-100 text-purple-800 border ${expandedLevels[4] ? "border-purple-500" : "border-purple-300"} font-normal cursor-pointer hover:bg-purple-200 transition-colors`}
          >
            {expandedLevels[4] ? "Niveau 4 ▼" : "Niveau 4 ▶"}
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {niveau1Entities.map((entity) => (
          <HierarchicalNode
            key={entity["entity-id"]}
            node={entity}
            level={0}
            searchTerm={searchTerm}
            expandedLevels={expandedLevels}
            lastGlobalAction={lastGlobalAction}
            conversations={conversations}
            toggleFieldSelection={toggleFieldSelection}
            toggleGroupSelection={toggleGroupSelection}
            isFieldSelected={isFieldSelected}
            isGroupSelected={isGroupSelected}
            getConversationsForField={getConversationsForField}
            getConversationsForGroup={getConversationsForGroup}
            hasUnreadConversationsForField={hasUnreadConversationsForField}
            hasUnreadConversationsForGroup={hasUnreadConversationsForGroup}
          />
        ))}
      </div>

      {searchTerm && displayedEntitiesCount === 0 && (
        <div className="p-8 text-center text-red-500">
          <div className="text-3xl mb-2">😕</div>
          <div className="font-medium">
            Aucun résultat trouvé pour "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(HierarchicalView);
