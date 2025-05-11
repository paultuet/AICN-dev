// Types pour la gestion des feature flags

// Liste des feature flags disponibles
export type FeatureFlag = 'conversations' | 'hierarchicalView' | 'admin';

// Type pour la réponse de l'API des feature flags
export type FeatureFlagsResponse = {
  [flag in FeatureFlag]: boolean;
};

// Type pour le contexte des feature flags
export type FeatureFlagsContextType = {
  flags: FeatureFlagsResponse;
  isEnabled: (flag: FeatureFlag) => boolean;
  setFlag: (flag: FeatureFlag, value: boolean) => void;
};