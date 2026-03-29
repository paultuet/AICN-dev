// Types de base pour les champs et entités

// ---------------------------------------------------------------------------
// SourceField: leaf field from "Tables Sources" Airtable table
// ---------------------------------------------------------------------------

export type SourceField = {
  'id': string                       // Airtable record ID
  'entity-id': string                // = id, for conversation compatibility
  'entity-name': string              // = libelle, for display compatibility
  'code-champ': string               // e.g. "C001"
  'libelle': string                  // display name
  'commentaire'?: string | null      // description
  'nom-champ-code': string           // technical field name
  'type-donnee': string              // VARCHAR, DATE, BOOLEAN...
  'cle-primaire'?: string | null     // "OUI" or null
  'cle-etrangere'?: string | null    // FK reference or null
  'exemple'?: string | null          // shown as popup
  'rank'?: number | null             // sort order within Niveau 2
  'niveau': number                   // always 3 for leaf fields
  'niveau-1'?: string | null         // parent Niveau 1 name
  'niveau-2'?: string | null         // parent Niveau 2 name
}

// ---------------------------------------------------------------------------
// Legacy Field type (kept for LoV compatibility)
// ---------------------------------------------------------------------------

export type BaseField = {
  'desc'?: string | null
  'var-type'?: string | null
  'exemple'?: string | null
}

export type FieldIdentifier = {
  'id-field'?: number | string
  'id-record'?: number | string | null
  'entity-name'?: string | null
}

export type FieldMetadata = {
  'lib-fonc'?: string
  'lib-group'?: string
  'entity-id': string
  'link-entity-id'?: string | null | string[]
  'category'?: string | null
  'category-id'?: string
  'niveau'?: number
  'type'?: string
}

export type FieldEntityRef = {
  'entity'?: {
    'id': string
    'name': string
  }
}

// Type complet pour un champ legacy (LoV entries)
export type Field = BaseField & FieldIdentifier & FieldMetadata & FieldEntityRef & {
  'fields'?: Field[]
}

// ---------------------------------------------------------------------------
// Entity: node in the hierarchy (Niveau 1, Niveau 2, or LoV)
// ---------------------------------------------------------------------------

export type BaseEntity = {
  'entity-id': string
  'entity-name': string
  'niveau'?: number
  'id-record'?: string
  'rank'?: number | null
}

export type EntityMetadata = {
  'type'?: string
  'desc-fr'?: string | null
  'desc'?: string | null
  'exemple'?: string | null
  'var-type'?: string | null
  'link-entity-id'?: string[] | null | string
  'link'?: string | null
}

// Type complet pour une entité, incluant ses champs
export type Entity = BaseEntity & EntityMetadata & {
  'fields': (Field | Entity | SourceField)[]
}

// Types utilitaires
export type EntityId = string
export type FieldId = number | string
export type GroupName = string

export type FilterPredicate<T> = (item: T) => boolean
export type EntityMapper<T> = (entity: Entity) => T

// ---------------------------------------------------------------------------
// Typeguards
// ---------------------------------------------------------------------------

export function isSourceField(item: Field | Entity | SourceField): item is SourceField {
  return 'code-champ' in item && 'libelle' in item && 'niveau' in item && (item as SourceField).niveau === 3;
}

export function isField(item: Field | Entity | SourceField): item is Field {
  return !isSourceField(item) && 'entity-id' in item && !('fields' in item && Array.isArray((item as Entity).fields));
}

export function isEntity(item: Field | Entity | SourceField): item is Entity {
  return 'entity-id' in item && 'entity-name' in item && 'fields' in item && Array.isArray((item as Entity).fields);
}

// Type pour les groupes de champs
export type FieldGroup = {
  groupName: string
  fields: (Field | SourceField)[]
  entityId: string
}
