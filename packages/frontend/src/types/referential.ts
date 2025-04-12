export type Field = {
  'category': string | null
  'desc': string | null
  'lib-fonc': string
  'entity-id': string
  'category-id': string
  'link-entity-id': string | null
  'lib-group': string
  'var-type': string | null
  'id-field': number
  'entity': {
    'id': string
    'name': string
  }
}

export type Entity = {
  'entity-id': string
  'entity-name': string
  'fields': Field[]
}