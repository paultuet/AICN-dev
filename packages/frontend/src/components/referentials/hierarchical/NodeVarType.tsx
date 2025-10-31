import React from "react";
import { Entity, Field } from "@/types/referential";
import { Badge } from "@/components/ui";
import { ExternalLink } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getVarTypeBadgeColor } from "./utils";
import { LinkedFieldsContent } from "./LinkedFieldsContent";

interface NodeVarTypeProps {
  node: Field | Entity;
}

/**
 * Component to display variable type badge with optional link to related entities
 */
export const NodeVarType: React.FC<NodeVarTypeProps> = ({ node }) => {
  if (!node["var-type"]) {
    return null;
  }

  const hasLink = node["link-entity-id"] != null;

  const badgeType = (
    <Badge
      color={getVarTypeBadgeColor(node["var-type"])}
      className={`${hasLink ? "cursor-pointer" : ""}`}
    >
      {node["var-type"]}
      {hasLink && <ExternalLink className="ml-1 w-4 h-4" />}
    </Badge>
  );

  if (hasLink && node["link-entity-id"]) {
    return (
      <Dialog>
        <DialogTrigger>{badgeType}</DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              Champs liés à : {node["entity-name"]}
            </DialogTitle>
            <DialogDescription>
              Entité liée:{" "}
              {Array.isArray(node["link-entity-id"])
                ? node["link-entity-id"].join(", ")
                : node["link-entity-id"]}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <LinkedFieldsContent linkEntityId={node["link-entity-id"]} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return badgeType;
};
