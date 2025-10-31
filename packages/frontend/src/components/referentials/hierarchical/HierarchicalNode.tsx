import React, { useState, useEffect } from "react";
import { Entity, Field } from "@/types/referential";
import { Conversation } from "@/types/conversation";
import { ChevronRight, ChevronDown, ChatBubbleIcon } from "@/components/icons";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { NodeVarType } from "./NodeVarType";

interface HierarchicalNodeProps {
  node: Entity;
  level: number;
  searchTerm?: string;
  forceExpanded?: boolean;
  expandedLevels?: { [key: number]: boolean };
  lastGlobalAction?: number;
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
 * Hierarchical node component for displaying entities in a tree structure
 */
export const HierarchicalNode: React.FC<HierarchicalNodeProps> = ({
  node,
  level,
  searchTerm,
  forceExpanded = false,
  expandedLevels = { 1: true, 2: true, 3: true, 4: true },
  lastGlobalAction = 0,
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
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [lastNodeAction, setLastNodeAction] = useState<number>(0);

  useEffect(() => {
    if (lastGlobalAction > lastNodeAction) {
      if (node.niveau && expandedLevels[node.niveau] !== undefined) {
        setIsExpanded(expandedLevels[node.niveau]);
      }
    }
  }, [expandedLevels, lastGlobalAction, node.niveau, lastNodeAction]);

  const isConversationFeatureEnabled = useFeatureFlag("conversations");

  const hasFields = node.fields && node.fields.length > 0;

  const childFields = hasFields
    ? (node.fields.filter(
        (field) =>
          "niveau" in field &&
          field.niveau !== undefined &&
          node.niveau !== undefined &&
          ((node.niveau === 1 && field.niveau === 2) ||
            (node.niveau === 2 && field.niveau === 3) ||
            (node.niveau === 3 && field.niveau === 4)),
      ) as (Field | Entity)[])
    : [];

  const hasChildren = childFields.length > 0;

  const matchesSearch = searchTerm
    ? node["entity-name"].toLowerCase().includes(searchTerm.toLowerCase())
    : false;

  const hasMatchingFields =
    searchTerm && hasFields
      ? node.fields.some(
          (field) =>
            ("lib-fonc" in field &&
              field["lib-fonc"]
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            ("desc" in field &&
              field.desc &&
              field.desc.toLowerCase().includes(searchTerm.toLowerCase())),
        )
      : false;

  const hasMatchingChildren = searchTerm && hasChildren ? true : false;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
    setLastNodeAction(Date.now());
  };

  const getIndentClass = () => {
    const paddingSize = level * 4;
    return `pl-${paddingSize > 16 ? 16 : paddingSize}`;
  };

  const getBackgroundColor = () => {
    if (matchesSearch && searchTerm) return "bg-yellow-100";
    return "bg-white";
  };

  const getBorderColor = () => {
    return "border-gray-200";
  };

  const getLevelBadgeColor = () => {
    switch (level) {
      case 0:
        return "bg-blue-200 text-blue-800";
      case 1:
        return "bg-orange-200 text-orange-800";
      case 2:
        return "bg-emerald-200 text-emerald-800";
      case 3:
        return "bg-purple-200 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      case 3:
        return "font-normal text-sm border-l-4 border-l-purple-500";
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
      case 3:
        return "text-purple-800";
      default:
        return "";
    }
  };

  const shouldDisplay =
    !searchTerm || matchesSearch || hasMatchingFields || hasMatchingChildren;

  const shouldExpandNode =
    forceExpanded ||
    (searchTerm && (hasMatchingFields || hasMatchingChildren)) ||
    isExpanded;

  if (!shouldDisplay) {
    return null;
  }

  const handleConversationClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (node.niveau && node.niveau < 3 && toggleGroupSelection) {
        toggleGroupSelection(node["entity-id"], node["entity-name"]);
      } else if ((node.niveau === 3 || node.niveau === 4) && toggleFieldSelection) {
        const fieldId = node["id-record"];

        let cleanId = fieldId;
        if (typeof fieldId === "string") {
          if (fieldId.includes("[3]-")) {
            cleanId = fieldId.split("[3]-")[1];
          } else if (fieldId.includes("[4]-")) {
            cleanId = fieldId.split("[4]-")[1];
          }
        }

        const fieldName = node["lib-fonc"] || node["entity-name"];

        if (cleanId) {
          toggleFieldSelection(node["entity-id"], cleanId, fieldName);
        }
      }
    } catch (error) {
      console.error("Error handling conversation click:", error);
    }
  };

  const renderConversationIcon = () => {
    let cleanId = node["id-record"];
    if (typeof cleanId === "string") {
      if (node.niveau === 3 && cleanId.includes("[3]-")) {
        cleanId = cleanId.split("[3]-")[1];
      } else if (node.niveau === 4 && cleanId.includes("[4]-")) {
        cleanId = cleanId.split("[4]-")[1];
      }
    }

    if (
      node.niveau < 3 &&
      getConversationsForGroup &&
      getConversationsForGroup(node["entity-id"], node["entity-name"])
        .length > 0
    ) {
      const hasUnread = hasUnreadConversationsForGroup
        ? hasUnreadConversationsForGroup(node["entity-id"], node["entity-name"])
        : false;
      return (
        <div className="flex items-center text-secondary">
          <ChatBubbleIcon
            filled
            className="h-5 w-5 mr-1"
            hasUnread={hasUnread}
          />
          <span className="text-xs font-medium">
            {
              getConversationsForGroup(
                node["entity-id"],
                node["entity-name"],
              ).length
            }
          </span>
        </div>
      );
    } else if (
      (node.niveau === 3 || node.niveau === 4) &&
      getConversationsForField &&
      cleanId
    ) {
      const conversationCount = getConversationsForField(
        node["entity-id"],
        cleanId,
      ).length;
      if (conversationCount > 0) {
        const hasUnread = hasUnreadConversationsForField
          ? hasUnreadConversationsForField(node["entity-id"], cleanId)
          : false;
        return (
          <div className="flex items-center text-secondary">
            <ChatBubbleIcon
              filled
              className="h-5 w-5 mr-1"
              hasUnread={hasUnread}
            />
            <span className="text-xs font-medium">
              {conversationCount}
            </span>
          </div>
        );
      }
    }

    return (
      <ChatBubbleIcon
        className="h-5 w-5 text-gray-400 hover:text-secondary transition-colors duration-200"
        hasUnread={false}
      />
    );
  };

  return (
    <div
      className={`border ${getBorderColor()} ${getBackgroundColor()} transition-all duration-200 ${getLevelSpecificStyle()}`}
    >
      <div
        className={`py-3 px-4 flex items-center hover:bg-opacity-80 ${getIndentClass()} transition-all duration-200 gap-4`}
        data-level={level}
        data-node-id={node["id-record"]}
      >
        {hasChildren ? (
          <button onClick={toggleExpand} className="cursor-pointer">
            {shouldExpandNode ? (
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
            className={`cursor-pointer ${matchesSearch && searchTerm ? "text-orange-600 font-bold" : getLevelSpecificTextColor()}`}
          >
            {node["entity-name"]}
          </div>
          <div className="flex gap-2">
            {!(node.type == "LoV" && node.niveau && node.niveau > 1) && (
              <div className="text-xs text-gray-500">
                ID: {node["id-record"]}
              </div>
            )}
            <div className="text-xs text-gray-800">
              {node.desc || node["desc-fr"]}
            </div>
          </div>
        </div>

        <NodeVarType node={node} />

        {isConversationFeatureEnabled && node.niveau && node.niveau <= 4 && (
          <div
            className="conversation-button"
            onClick={handleConversationClick}
          >
            {renderConversationIcon()}
          </div>
        )}

        {node.exemple != null && <code>{node.exemple}</code>}

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

      {hasChildren && shouldExpandNode && (
        <div className={`ml-6`}>
          {childFields.map((childField, index) => {
            if ("entity-name" in childField) {
              return (
                <HierarchicalNode
                  key={`${childField["entity-id"]}-${index}`}
                  node={childField as Entity}
                  level={level + 1}
                  searchTerm={searchTerm}
                  expandedLevels={expandedLevels}
                  lastGlobalAction={lastGlobalAction}
                  forceExpanded={Boolean(
                    forceExpanded ||
                      (searchTerm &&
                        (hasMatchingChildren || hasMatchingFields)),
                  )}
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
              );
            }

            const childEntity: Entity = {
              "entity-id": childField["entity-id"],
              "entity-name": childField["lib-fonc"],
              niveau: childField.niveau,
              "id-record": String(childField["id-field"]),
              type: childField.type || "UNKNOWN",
              "var-type": childField["var-type"],
              desc: childField["desc"],
              exemple: childField.exemple,
              "link-entity-id": childField["link-entity-id"],
              fields:
                "fields" in childField && childField.fields
                  ? childField.fields
                  : node.fields.filter(
                      (field) =>
                        "niveau" in field &&
                        field.niveau === (childField.niveau as number) + 1 &&
                        "lib-group" in field &&
                        field["lib-group"] &&
                        field["lib-group"].includes(childField["lib-fonc"]),
                    ),
            };

            return (
              <HierarchicalNode
                key={`${childEntity["entity-id"]}-${index}`}
                node={childEntity}
                level={level + 1}
                searchTerm={searchTerm}
                expandedLevels={expandedLevels}
                lastGlobalAction={lastGlobalAction}
                forceExpanded={Boolean(
                  forceExpanded ||
                    (searchTerm && (hasMatchingChildren || hasMatchingFields)),
                )}
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
            );
          })}
        </div>
      )}
    </div>
  );
};
