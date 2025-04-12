import React, { useEffect, useState } from 'react'
import api from '../services/api'

type Field = {
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

type Entity = {
  'entity-id': string
  'entity-name': string
  'fields': Field[]
}

const HomePage = () => {
  const [referentials, setReferentials] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)

  useEffect(() => {
    const fetchReferentials = async () => {
      try {
        const response = await api.get('/referentiels')
        setReferentials(response.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching referentials:', err)
        setError('Une erreur est survenue lors du chargement des référentiels')
        setLoading(false)
      }
    }

    fetchReferentials()
  }, [])

  // Filtered referentials based on search and selection
  const filteredReferentials = referentials.filter(entity => {
    // Filter by selected entity if any
    if (selectedEntity && entity['entity-id'] !== selectedEntity) {
      return false
    }

    // Filter by search term
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      
      // Search in entity name
      if (entity['entity-name'].toLowerCase().includes(searchTermLower)) {
        return true
      }
      
      // Search in fields
      return entity.fields.some(field => 
        field['lib-fonc'].toLowerCase().includes(searchTermLower) ||
        (field.desc && field.desc.toLowerCase().includes(searchTermLower)) ||
        field['lib-group'].toLowerCase().includes(searchTermLower)
      )
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Function to group fields by lib-group
  const groupFieldsByLibGroup = (fields: Field[]) => {
    const groups: Record<string, Field[]> = {}
    
    fields.forEach(field => {
      const groupName = field['lib-group']
      if (!groups[groupName]) {
        groups[groupName] = []
      }
      groups[groupName].push(field)
    })
    
    return groups
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Référentiels AICN</h1>
      
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <input
              type="text"
              id="search"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              placeholder="Rechercher par libellé, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-64">
            <label htmlFor="entity-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par référentiel
            </label>
            <select
              id="entity-filter"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              value={selectedEntity || ''}
              onChange={(e) => setSelectedEntity(e.target.value || null)}
            >
              <option value="">Tous les référentiels</option>
              {referentials.map(entity => (
                <option key={entity['entity-id']} value={entity['entity-id']}>
                  {entity['entity-name']}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {filteredReferentials.length === 0 && searchTerm && (
            <p>Aucun résultat trouvé pour "{searchTerm}"</p>
          )}
          {filteredReferentials.length > 0 && (
            <p>
              Affichage de {filteredReferentials.length} référentiel{filteredReferentials.length > 1 ? 's' : ''}
              {searchTerm && ` pour la recherche "${searchTerm}"`}
            </p>
          )}
        </div>
      </div>
      
      {filteredReferentials.map((entity) => {
        const groupedFields = groupFieldsByLibGroup(entity.fields)
        
        return (
          <div key={entity['entity-id']} className="mb-10 bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-gray-700 text-white px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">{entity['entity-name']}</h2>
              <div className="text-sm text-gray-300 mt-1">ID: {entity['entity-id']}</div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Libellé fonctionnel</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Lien</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(groupedFields).map(([groupName, fields]) => (
                    <React.Fragment key={`${entity['entity-id']}-${groupName}`}>
                      <tr className="bg-gray-100">
                        <td colSpan={5} className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          {groupName}
                        </td>
                      </tr>
                      
                      {fields.map((field) => (
                        <tr 
                          key={field['id-field']} 
                          className={field['link-entity-id'] ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                        >
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {field['id-field']}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">
                            {searchTerm && field['lib-fonc'].toLowerCase().includes(searchTerm.toLowerCase()) ? (
                              <span className="bg-yellow-100">{field['lib-fonc']}</span>
                            ) : (
                              field['lib-fonc']
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {field.desc ? (
                              searchTerm && field.desc.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                                <span className="bg-yellow-100">{field.desc}</span>
                              ) : (
                                field.desc
                              )
                            ) : (
                              <span className="text-gray-400 italic">Pas de description</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              {field['var-type'] || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {field['link-entity-id'] ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                                {referentials.find(e => e['entity-id'] === field['link-entity-id'])?.['entity-name'] || field['link-entity-id']}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default HomePage