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

// Nouveaux types pour la structure d'arborescence
export type HierarchicalField = {
  'entity-id': string
  'entity-name': string
  'niveau': number
  'id-record': string
  'fields': Field[]
}

export type HierarchicalEntity = {
  'entity-id': string
  'entity-name': string
  'niveau': number
  'id-record': string
  'type': string
  'children': (HierarchicalEntity | HierarchicalField)[]
}