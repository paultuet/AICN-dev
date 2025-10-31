/**
 * Utilities for hierarchical view components
 */

export const getVarTypeBadgeColor = (varType: string) => {
  switch (varType) {
    case "TEXT":
      return "blue";
    case "VARCHAR":
      return "blue";
    case "NUMBER":
      return "amber";
    case "INTEGER":
      return "amber";
    case "DATE":
      return "purple";
    case "BOOL":
      return "red";
    case "BOOLEEN":
      return "red";
    case "LINK":
      return "cyan";
    default:
      return "gray";
  }
};
