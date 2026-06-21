import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Entity, SourceField, LovNewEntry, isSourceField } from "@/types/referential";
import { Conversation } from "@/types/conversation";
import { ChevronRight, ChevronDown, ChatBubbleIcon } from "@/components/icons";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useLovNew } from "@/hooks/useLovNew";
import {
  MIN_COLUMN_WIDTH,
  setColumnWidth,
  useColumnWidths,
} from "./useColumnWidths";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CommentPopover from "@/components/comments/CommentPopover";

// ---------------------------------------------------------------------------
// lov_new matching logic
// ---------------------------------------------------------------------------

function findLovNewEntries(fkValue: string, lovNewData: LovNewEntry[]): LovNewEntry[] {
  // Match on the `lov_table` column of lov_new, populated in Airtable.
  // FK example: "lov_types_mesures_surfaces.id_type_mesure_surface" → table = "lov_types_mesures_surfaces"
  // Compare trimmed + case-insensitive as a safety net against accidental whitespace/casing
  // drift in the Airtable data (distinct names like lov_omniclass_table23 vs _table_13 stay distinct).
  const fkTable = (fkValue.split('.')[0] ?? '').trim().toLowerCase();
  return lovNewData.filter(e => (e.lov_table ?? '').trim().toLowerCase() === fkTable);
}

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
 * Hierarchical node component for displaying entities in a 2-level tree structure.
 * Level 0 = Niveau 1 (categories), Level 1 = Niveau 2 (subcategories).
 * Leaf fields (SourceField) are rendered as a data table inside Niveau 2 nodes.
 */
export const HierarchicalNode: React.FC<HierarchicalNodeProps> = ({
  node,
  level,
  searchTerm,
  forceExpanded = false,
  expandedLevels = { 1: true, 2: true },
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

  // Child entities (NIV1 → NIV2 only)
  const childEntities = hasFields
    ? (node.fields.filter(
        (field) =>
          "niveau" in field &&
          field.niveau !== undefined &&
          node.niveau !== undefined &&
          node.niveau === 1 &&
          field.niveau === 2,
      ) as Entity[])
    : [];

  // Leaf fields (NIV2 → SourceField with niveau=3)
  const leafFields = hasFields
    ? (node.fields.filter(
        (field) =>
          isSourceField(field) ||
          ("niveau" in field &&
            field.niveau === 3 &&
            node.niveau === 2),
      ) as SourceField[])
    : [];

  const hasChildren = childEntities.length > 0 || leafFields.length > 0;

  const matchesSearch = searchTerm
    ? node["entity-name"]?.toLowerCase().includes(searchTerm.toLowerCase())
    : false;

  const hasMatchingFields =
    searchTerm && hasFields
      ? node.fields.some(
          (field) =>
            ("entity-name" in field &&
              (field as Entity)["entity-name"]
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            ("libelle" in field &&
              (field as SourceField).libelle
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            ("commentaire" in field &&
              (field as SourceField).commentaire
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())),
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

  const getLevelBadgeColor = () => {
    switch (level) {
      case 0:
        return "bg-blue-200 text-blue-800";
      case 1:
        return "bg-orange-200 text-orange-800";
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
    if (toggleGroupSelection) {
      toggleGroupSelection(node["entity-id"], node["entity-name"]);
    }
  };

  const renderConversationIcon = () => {
    if (
      getConversationsForGroup &&
      getConversationsForGroup(node["entity-id"], node["entity-name"]).length > 0
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
      className={`border border-gray-200 ${getBackgroundColor()} transition-all duration-200 ${getLevelSpecificStyle()}`}
    >
      <div
        className={`py-3 px-4 flex items-center hover:bg-opacity-80 ${getIndentClass()} transition-all duration-200 gap-4`}
        data-level={level}
        data-node-id={node["entity-id"]}
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
            {node.niveau === 1 ? `AICN - ${node["entity-name"]}` : node["entity-name"]}
          </div>
          {node.desc && (
            <div className="text-xs text-gray-800">
              {node.desc}
            </div>
          )}
        </div>

        {node.niveau && node.niveau <= 2 && (
          <CommentPopover targetType="entity" targetId={node["entity-id"]} />
        )}

        {isConversationFeatureEnabled && node.niveau && node.niveau <= 2 && (
          <div
            className="conversation-button"
            onClick={handleConversationClick}
          >
            {renderConversationIcon()}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <div
            className={`px-2 py-1 text-xs rounded-full font-medium ${getLevelBadgeColor()}`}
          >
            {`Niveau ${node.niveau ?? "N/A"}`}
          </div>
        </div>
      </div>

      {hasChildren && shouldExpandNode && (
        <>
          <div className="ml-6">
            {/* Render child entities (NIV2 under NIV1) */}
            {childEntities.map((childEntity, index) => (
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
            ))}
          </div>

          {/* Render leaf fields as a data table — full width, no indentation */}
          {leafFields.length > 0 && (
            <FieldsTable
              fields={leafFields}
              searchTerm={searchTerm}
              conversations={conversations}
              toggleFieldSelection={toggleFieldSelection}
              isFieldSelected={isFieldSelected}
              getConversationsForField={getConversationsForField}
              hasUnreadConversationsForField={hasUnreadConversationsForField}
              isConversationFeatureEnabled={isConversationFeatureEnabled}
            />
          )}
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FieldsTable: renders SourceField[] as a compact data table
// ---------------------------------------------------------------------------

interface FieldsTableProps {
  fields: SourceField[];
  searchTerm?: string;
  conversations?: Conversation[];
  toggleFieldSelection?: (
    entityId: string,
    fieldId: number | string,
    fieldName?: string,
  ) => void;
  isFieldSelected?: (entityId: string, fieldId: number | string) => boolean;
  getConversationsForField?: (
    entityId: string,
    fieldId: number | string,
  ) => Conversation[];
  hasUnreadConversationsForField?: (
    entityId: string,
    fieldId: number | string,
  ) => boolean;
  isConversationFeatureEnabled: boolean;
}

const TruncatedCell: React.FC<{ text?: string | null }> = ({ text }) => {
  if (!text) return null;
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left });
    }
  };

  return (
    <div
      ref={ref}
      className="truncate"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setPos(null)}
    >
      {text}
      {pos &&
        ReactDOM.createPortal(
          <div
            className="fixed z-[9999] max-w-sm px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-normal break-words pointer-events-none"
            style={{ top: pos.top, left: pos.left, transform: 'translateY(-100%)' }}
          >
            {text}
          </div>,
          document.body,
        )}
    </div>
  );
};

// Column definitions for the fields table. `key` identifies the column in the
// shared session width store; `defaultWidth` (px) is used until the user drags a
// column edge. Cell order in <FieldRow> must stay in sync with this list.
interface FieldColumn {
  key: string;
  label: string;
  defaultWidth: number;
  center?: boolean;
}

const FIELD_COLUMNS: FieldColumn[] = [
  { key: "code-champ", label: "Code champ", defaultWidth: 110 },
  { key: "libelle", label: "Libellé du champ", defaultWidth: 200 },
  { key: "commentaire", label: "Commentaire", defaultWidth: 260 },
  { key: "nom-champ-code", label: "Nom du champ codé", defaultWidth: 170 },
  { key: "type-donnee", label: "Type de donnée", defaultWidth: 120 },
  { key: "cle-primaire", label: "PK", defaultWidth: 60, center: true },
  { key: "cle-etrangere", label: "FK", defaultWidth: 140 },
  { key: "champ-multivalue", label: "Multivalué", defaultWidth: 100, center: true },
  { key: "exemple", label: "Exemple", defaultWidth: 90, center: true },
  { key: "notes", label: "Notes", defaultWidth: 80, center: true },
];

const CONV_COLUMN: FieldColumn = { key: "conv", label: "Conv.", defaultWidth: 80, center: true };

/**
 * Drag handle on the right edge of a column header. Dragging updates the shared
 * session width store (in-memory, not persisted). Uses pointer events so it
 * works with mouse and touch.
 */
const ColumnResizeHandle: React.FC<{ columnKey: string; width: number }> = ({
  columnKey,
  width,
}) => {
  const handlePointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = width;

    const handleMove = (ev: PointerEvent) => {
      setColumnWidth(columnKey, startWidth + (ev.clientX - startX));
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionner la colonne"
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-blue-400/70 active:bg-blue-500"
    />
  );
};

const FieldsTable: React.FC<FieldsTableProps> = ({
  fields,
  searchTerm,
  conversations = [],
  toggleFieldSelection,
  isFieldSelected,
  getConversationsForField,
  hasUnreadConversationsForField,
  isConversationFeatureEnabled,
}) => {
  const { data: lovNewData } = useLovNew();
  const columnWidths = useColumnWidths();

  const columns = isConversationFeatureEnabled
    ? [...FIELD_COLUMNS, CONV_COLUMN]
    : FIELD_COLUMNS;
  const widthOf = (column: FieldColumn) =>
    columnWidths[column.key] ?? column.defaultWidth;
  const totalWidth = columns.reduce((sum, column) => sum + widthOf(column), 0);

  return (
    <div className="overflow-x-auto border-t border-gray-200">
      <table
        className="text-sm table-fixed"
        style={{ width: totalWidth, minWidth: "100%" }}
      >
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: widthOf(column), minWidth: MIN_COLUMN_WIDTH }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`relative px-3 py-2 ${column.center ? "text-center" : ""}`}
              >
                <span className="block truncate">{column.label}</span>
                <ColumnResizeHandle columnKey={column.key} width={widthOf(column)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {fields.map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              searchTerm={searchTerm}
              lovNewData={lovNewData}
              toggleFieldSelection={toggleFieldSelection}
              isFieldSelected={isFieldSelected}
              getConversationsForField={getConversationsForField}
              hasUnreadConversationsForField={hasUnreadConversationsForField}
              isConversationFeatureEnabled={isConversationFeatureEnabled}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// FieldRow: single row in the fields table
// ---------------------------------------------------------------------------

interface FieldRowProps {
  field: SourceField;
  searchTerm?: string;
  lovNewData?: LovNewEntry[];
  toggleFieldSelection?: (
    entityId: string,
    fieldId: number | string,
    fieldName?: string,
  ) => void;
  isFieldSelected?: (entityId: string, fieldId: number | string) => boolean;
  getConversationsForField?: (
    entityId: string,
    fieldId: number | string,
  ) => Conversation[];
  hasUnreadConversationsForField?: (
    entityId: string,
    fieldId: number | string,
  ) => boolean;
  isConversationFeatureEnabled: boolean;
}

const FieldRow: React.FC<FieldRowProps> = ({
  field,
  searchTerm,
  lovNewData,
  toggleFieldSelection,
  isFieldSelected,
  getConversationsForField,
  hasUnreadConversationsForField,
  isConversationFeatureEnabled,
}) => {
  const selected = isFieldSelected
    ? isFieldSelected(field["entity-id"], field["code-champ"])
    : false;

  const matchesSearch =
    searchTerm &&
    (field.libelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field["code-champ"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.commentaire?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field["nom-champ-code"]?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleConversationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggleFieldSelection) {
      toggleFieldSelection(field["entity-id"], field["code-champ"], field.libelle);
    }
  };

  const conversationCount =
    getConversationsForField
      ? getConversationsForField(field["entity-id"], field["code-champ"]).length
      : 0;

  const hasUnread = hasUnreadConversationsForField
    ? hasUnreadConversationsForField(field["entity-id"], field["code-champ"])
    : false;

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors ${
        selected ? "bg-orange-50 border-l-2 border-l-orange-500" : ""
      } ${matchesSearch ? "bg-yellow-50" : ""}`}
    >
      {/* 1. Code champ */}
      <td className="px-3 py-2 font-mono text-xs text-gray-600 overflow-hidden truncate">
        {field["code-champ"]}
      </td>
      {/* 2. Libellé du champ */}
      <td className="px-3 py-2 font-medium text-gray-900 overflow-hidden truncate">
        {field.libelle}
      </td>
      {/* 5. Commentaire */}
      <td className="px-3 py-2 text-gray-600 text-xs overflow-hidden">
        <TruncatedCell text={field.commentaire} />
      </td>
      {/* 6. Nom du champ codé */}
      <td className="px-3 py-2 font-mono text-xs text-gray-500 overflow-hidden truncate">
        {field["nom-champ-code"]}
      </td>
      {/* 7. Type de donnée */}
      <td className="px-3 py-2 text-xs overflow-hidden truncate">
        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700">
          {field["type-donnee"]}
        </span>
      </td>
      {/* 8. Clé primaire (PK) */}
      <td className="px-3 py-2 text-xs text-center">
        {field["cle-primaire"] && (
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
            PK
          </span>
        )}
      </td>
      {/* 9. Clé étrangère (FK) + popup lov_new */}
      <td className="px-3 py-2 text-xs text-gray-500 overflow-hidden">
        {field["cle-etrangere"] && field["cle-etrangere"].startsWith("lov") ? (() => {
          const fk = field["cle-etrangere"];
          const entries = lovNewData ? findLovNewEntries(fk, lovNewData) : [];
          return (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="block w-full text-left text-xs font-mono text-blue-700 hover:text-blue-900 hover:underline cursor-pointer truncate"
                  title={`Voir les valeurs LOV — ${fk}`}
                >
                  {fk}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[70vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>
                    Valeurs LOV — {fk.split(".")[0]}
                  </DialogTitle>
                  <DialogDescription>
                    {entries.length > 0
                      ? `${entries.length} valeur${entries.length > 1 ? "s" : ""} disponible${entries.length > 1 ? "s" : ""}`
                      : "Aucune valeur disponible dans lov_new"}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                  {entries.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500 text-center">
                      Aucune entrée correspondante n'a été trouvée pour <span className="font-mono">{fk}</span>.
                      <br />
                      <span className="text-xs text-gray-400">
                        Si la valeur existe dans Airtable, la synchronisation est peut-être à relancer
                        (Admin → Airtable → « Synchroniser avec Airtable »).
                      </span>
                    </div>
                  ) : (
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                          <th className="px-3 py-2">Code</th>
                          <th className="px-3 py-2">Valeur</th>
                          <th className="px-3 py-2">Complément</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {entries.map((entry, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-mono text-xs">{entry.id_code}</td>
                            <td className="px-3 py-2">{entry.Value}</td>
                            <td className="px-3 py-2 text-xs text-gray-500">{entry.complement_value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          );
        })() : (
          <TruncatedCell text={field["cle-etrangere"]} />
        )}
      </td>
      {/* 10. Champ multivalué */}
      <td className="px-3 py-2 text-xs text-center">
        {field["champ-multivalue"] && (
          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
            {field["champ-multivalue"]}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        {field.exemple && (
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors cursor-pointer"
                title="Voir l'exemple"
              >
                📋
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Exemple — {field.libelle}
                </DialogTitle>
                <DialogDescription>
                  {field["code-champ"]} · {field["nom-champ-code"]}
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                {field.exemple}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <CommentPopover targetType="field" targetId={field["code-champ"]} />
      </td>
      {isConversationFeatureEnabled && (
        <td className="px-3 py-2 text-center">
          <div
            className="cursor-pointer inline-flex items-center"
            onClick={handleConversationClick}
          >
            {conversationCount > 0 ? (
              <div className="flex items-center text-secondary">
                <ChatBubbleIcon
                  filled
                  className="h-4 w-4 mr-0.5"
                  hasUnread={hasUnread}
                />
                <span className="text-xs font-medium">{conversationCount}</span>
              </div>
            ) : (
              <ChatBubbleIcon
                className="h-4 w-4 text-gray-400 hover:text-secondary transition-colors duration-200"
                hasUnread={false}
              />
            )}
          </div>
        </td>
      )}
    </tr>
  );
};
