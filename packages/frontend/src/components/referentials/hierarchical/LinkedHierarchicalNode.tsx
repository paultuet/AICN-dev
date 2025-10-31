import React, { useState } from "react";
import { Entity, Field } from "@/types/referential";
import { ChevronRight, ChevronDown } from "@/components/icons";
import { NodeVarType } from "./NodeVarType";

export type EnrichedField = Field & {
  _parentEntityId: string;
  _parentEntityName: string;
};

interface LinkedHierarchicalNodeProps {
  node: Entity | Field | EnrichedField;
  level: number;
  children?: (Entity | Field | EnrichedField)[];
}

/**
 * Component for hierarchical nodes in linked entity views
 */
export const LinkedHierarchicalNode: React.FC<LinkedHierarchicalNodeProps> = ({
  node,
  level,
  children = [],
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const isEntityType = "entity-name" in node && "fields" in node;
  const hasChildren =
    children.length > 0 ||
    (isEntityType &&
      "fields" in node &&
      node.fields?.length &&
      node.fields.length > 0);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const getIndentClass = () => {
    const paddingSize = level * 4;
    return `pl-${paddingSize > 16 ? 16 : paddingSize}`;
  };

  const getBackgroundColor = () => {
    switch (level) {
      case 0:
        return "bg-blue-50";
      case 1:
        return "bg-orange-50";
      case 2:
        return "bg-emerald-50";
      default:
        return "bg-gray-50";
    }
  };

  const getBorderColor = () => {
    switch (level) {
      case 0:
        return "border-blue-200";
      case 1:
        return "border-orange-200";
      case 2:
        return "border-emerald-200";
      default:
        return "border-gray-200";
    }
  };

  const getLevelSpecificStyle = () => {
    switch (level) {
      case 0:
        return "font-bold text-lg border-l-4 border-l-blue-500";
      case 1:
        return "font-semibold text-base border-l-4 border-l-orange-500";
      case 2:
        return "font-medium text-base border-l-4 border-l-emerald-500";
      default:
        return "";
    }
  };

  const getLevelSpecificTextColor = () => {
    switch (level) {
      case 0:
        return "text-blue-800";
      case 1:
        return "text-orange-800";
      case 2:
        return "text-emerald-800";
      default:
        return "text-gray-800";
    }
  };

  const getLevelBadgeColor = () => {
    switch (level) {
      case 0:
        return "bg-blue-200 text-blue-800";
      case 1:
        return "bg-orange-200 text-orange-800";
      case 2:
        return "bg-emerald-200 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const itemName = isEntityType
    ? node["entity-name"]
    : "lib-fonc" in node
      ? node["lib-fonc"]
      : "Champ sans nom";

  const itemId = isEntityType
    ? node["entity-id"] || node["id-record"]
    : "id-field" in node
      ? node["id-field"]
      : "id-record" in node
        ? node["id-record"]
        : "ID inconnu";

  const hasParentInfo =
    "_parentEntityName" in node && "_parentEntityId" in node;

  const childrenToDisplay =
    children.length > 0
      ? children
      : isEntityType && "fields" in node && node.fields
        ? node.fields
        : [];

  return (
    <div
      className={`border ${getBorderColor()} ${getBackgroundColor()} transition-all duration-200 ${getLevelSpecificStyle()}`}
    >
      <div
        className={`py-3 px-4 flex items-center hover:bg-opacity-80 ${getIndentClass()} transition-all duration-200 gap-4`}
      >
        {hasChildren ? (
          <button onClick={toggleExpand} className="cursor-pointer">
            {isExpanded ? (
              <ChevronDown
                className={`h-5 w-5 ${getLevelSpecificTextColor()} mr-2`}
              />
            ) : (
              <ChevronRight
                className={`h-5 w-5 ${getLevelSpecificTextColor()} mr-2`}
              />
            )}
          </button>
        ) : (
          <div className="h-5 w-5 mr-2" />
        )}

        <div className="flex-1">
          <div
            onClick={toggleExpand}
            className={`cursor-pointer ${getLevelSpecificTextColor()}`}
          >
            {itemName}
          </div>
          <div className="flex gap-2">
            <div className="text-xs text-gray-500">ID: {itemId}</div>
            <div className="text-xs text-gray-800">{node.desc}</div>
          </div>

          {hasParentInfo && (
            <div className="text-xs text-gray-400 mt-1">
              Appartient à: {node._parentEntityName} (ID: {node._parentEntityId}
              )
            </div>
          )}
        </div>

        <NodeVarType node={node} />

        {node.exemple && (
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            {node.exemple}
          </code>
        )}

        <div className="flex items-center space-x-2">
          <div
            className={`px-2 py-1 text-xs rounded-full font-medium ${getLevelBadgeColor()}`}
          >
            {"type" in node && node.niveau !== undefined
              ? `${node.type} - Niv ${node.niveau}`
              : node.niveau !== undefined
                ? `Niveau ${node.niveau}`
                : "Niveau N/A"}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6">
          {childrenToDisplay.map((child, index) => (
            <LinkedHierarchicalNode
              key={index}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
