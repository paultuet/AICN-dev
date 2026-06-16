// Single source of truth for the document/referential categories.
// Used by the Documents page ("Catégorie" dropdown) AND the Journal post tag.
export const FILE_CATEGORIES = [
  "Documentation Générale",
  "Nomenclature des missions et responsabilités AM<>PM",
  "RIO - Inventaires d’équipements",
  "RIO - Inventaires d’espaces",
  "RIO - Inventaires de contrats",
  "RIO - Inventaires de tiers",
  "RIO - Inventaires de systèmes",
  "RIO - Plans de comptage électriques",
  "RIO - PPAT",
  "RIO - Rapports d’observations de bureaux de contrôle",
  "RIO - Historiques de consommation énergétique",
] as const;

export type FileCategory = (typeof FILE_CATEGORIES)[number];
