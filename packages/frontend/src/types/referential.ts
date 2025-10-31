// Types de base pour les champs et entités
export type BaseField = {
  'desc'?: string | null
  'var-type'?: string | null
  'exemple'?: string | null
}

export type FieldIdentifier = {
  'id-field': number | string
  'id-record'?: number | string | null
  'entity-name'?: string | null
}

export type FieldMetadata = {
  'lib-fonc': string
  'lib-group': string
  'entity-id': string
  'link-entity-id'?: string | null | string[]
  'category'?: string | null
  'category-id'?: string
  'niveau'?: number // 1, 2, 3, ou 4 (niveau 4 uniquement pour NMR)
  'type'?: string
}

export type FieldEntityRef = {
  'entity': {
    'id': string
    'name': string
  }
}

// Type complet pour un champ, combinant tous les aspects
export type Field = BaseField & FieldIdentifier & FieldMetadata & FieldEntityRef & {
  'fields'?: Field[] // Support pour les champs imbriqués
}

// Base pour les entités
export type BaseEntity = {
  'entity-id': string
  'entity-name': string
  'niveau'?: number // 1, 2, 3, ou 4 (niveau 4 uniquement pour NMR)
  'id-record'?: string
}

export type EntityMetadata = {
  'type': string // Type de référentiel (NMR, LoV, RIO)
  'desc-fr'?: string | null
  desc?: string | null
  'exemple'?: string | null
  'var-type'?: string | null
  'link-entity-id'?: string[] | null | string
  'link'?: string | null
  'lib-fonc'?: string // Ajouté pour supporter les entités dérivées de champs
}

// Type complet pour une entité, incluant ses champs
export type Entity = BaseEntity & EntityMetadata & {
  'fields': (Field | Entity)[] // Supporte à la fois des champs et des entités imbriquées
}

// Types utilitaires pour simplifier la manipulation des données
export type EntityId = string
export type FieldId = number | string
export type GroupName = string

// Type pour les fonctions de filtre
export type FilterPredicate<T> = (item: T) => boolean

// Type pour les mappers d'entités
export type EntityMapper<T> = (entity: Entity) => T

// Typeguards pour vérifier le type d'un objet
export function isField(item: Field | Entity): item is Field {
  return 'id-field' in item && 'lib-fonc' in item && 'lib-group' in item;
}

export function isEntity(item: Field | Entity): item is Entity {
  return 'entity-id' in item && 'entity-name' in item && 'fields' in item;
}

// Type pour les groupes de champs
export type FieldGroup = {
  groupName: string
  fields: Field[]
  entityId: string
}
