export type Field = {
  'category'?: string | null
  'desc'?: string | null
  'lib-fonc': string
  'entity-id': string
  'category-id'?: string
  'link-entity-id'?: string | null
  'lib-group': string
  'var-type'?: string | null
  'id-field': number | string
  'entity': {
    'id': string
    'name': string
  }
  'niveau'?: number
  'type'?: string
  'exemple'?: string | null
  'fields'?: Field[] // Added to support nested fields in the hierarchical structure
}

export type Entity = {
  'entity-id': string
  'entity-name': string
  'fields': (Field | Entity)[] // Updated to support both Field and nested Entity
  'niveau'?: number
  'id-record'?: string
  'type'?: string
  'desc-fr'?: string | null
  'exemple'?: string | null
  'var-type'?: string | null
  'link'?: string | null
  'lib-fonc'?: string // Added to support child entities derived from fields
}