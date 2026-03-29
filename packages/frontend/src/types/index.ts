// Point d'entrée centralisé pour exporter tous les types

// Types de base définis ici
export interface User {
  id: string
  name: string
  email: string
  organization: string
  role: string
  'created-at': string
  'email-verified': boolean
}

// Types pour les référentiels
export type {
  BaseField,
  FieldIdentifier,
  FieldMetadata,
  FieldEntityRef,
  Field,
  SourceField,
  BaseEntity,
  EntityMetadata,
  Entity,
  FilterPredicate,
  EntityMapper,
  FieldGroup
} from './referential';

// Fonctions utilitaires pour les types
export { isField, isEntity, isSourceField } from './referential';

// Types pour les conversations
export type {
  ID,
  EntityId,
  FieldId,
  GroupName,
  Message,
  FieldSelection,
  GroupSelection,
  Selection,
  Conversation,
  ConversationFilter,
  SidebarViewMode,
  ConversationAction
} from './conversation';

// Type générique pour les requêtes API (repris de l'existant)
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
  errors?: Record<string, string[]>
}

// Type pour les fonctions pures qui transforment des données
export type Transformer<T, R> = (input: T) => R;

// Type pour les gestionnaires d'événements
export type EventHandler<E extends Event = Event> = (event: E) => void;
