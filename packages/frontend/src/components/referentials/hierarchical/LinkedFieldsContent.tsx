import React, { useState, useEffect } from "react";
import { Entity, Field } from "@/types/referential";
import { useReferentials } from "@/hooks/useReferentials";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { DialogFooter } from "@/components/ui/dialog";
import { LinkedHierarchicalNode, EnrichedField } from "./LinkedHierarchicalNode";

interface LinkedFieldsContentProps {
  linkEntityId: string | string[];
}

/**
 * Component to display linked fields content in a hierarchical view
 */
export const LinkedFieldsContent: React.FC<LinkedFieldsContentProps> = ({
  linkEntityId,
}) => {
  const {
    data: referentials = [],
    isLoading: loading,
    error,
  } = useReferentials();
  const [linkedEntities, setLinkedEntities] = useState<
    Array<Entity | EnrichedField>
  >([]);

  useEffect(() => {
    if (linkEntityId && referentials.length > 0) {
      const entityIds = Array.isArray(linkEntityId)
        ? linkEntityId
        : [linkEntityId];
      const linkedEntitiesFound: Array<Entity | EnrichedField> = [];

      for (const entity of referentials) {
        if (
          entityIds.includes(entity["entity-id"]) ||
          entityIds.includes(entity["id-record"] || "")
        ) {
          linkedEntitiesFound.push(entity);
          continue;
        }

        if (entity.fields?.length > 0) {
          const findLinkedFields = (
            fields: Array<Field | Entity>,
            parentEntity: Entity,
          ) => {
            for (const field of fields) {
              const fieldId =
                "id-field" in field
                  ? field["id-field"]
                  : "id-record" in field
                    ? field["id-record"]
                    : "";

              if (entityIds.includes(String(fieldId))) {
                const enrichedField = {
                  ...field,
                  _parentEntityName: parentEntity["entity-name"],
                  _parentEntityId: parentEntity["entity-id"],
                };
                linkedEntitiesFound.push(enrichedField);
              }

              if (
                "fields" in field &&
                field.fields &&
                field.fields.length > 0
              ) {
                findLinkedFields(field.fields, parentEntity);
              }
            }
          };

          findLinkedFields(entity.fields, entity);
        }
      }

      setLinkedEntities(linkedEntitiesFound);
    }
  }, [linkEntityId, referentials]);

  if (loading) {
    return <LoadingSpinner size="md" />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des champs liés"
        }
      />
    );
  }

  if (linkedEntities.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        Aucune entité liée trouvée
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Structure hiérarchique des entités liées
          </h3>
          <div className="text-sm text-gray-600 mt-1">
            {linkedEntities.length} entité(s) liée(s) trouvée(s)
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {linkedEntities.map((entity, index) => (
            <LinkedHierarchicalNode key={index} node={entity} level={0} />
          ))}
        </div>
      </div>

      <DialogFooter className="mt-4">
        <div className="text-xs text-gray-500">
          {linkedEntities.length} élément(s) lié(s) trouvé(s)
        </div>
      </DialogFooter>
    </div>
  );
};
