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
    <div className="max-w-7xl mx-auto px-4 py-10 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-indigo-800">Référentiels AICN</h1>
      
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-semibold text-indigo-600 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 border"
                placeholder="Rechercher par libellé, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full md:w-80">
            <label htmlFor="entity-filter" className="block text-sm font-semibold text-indigo-600 mb-2">
              Filtrer par référentiel
            </label>
            <select
              id="entity-filter"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-lg p-3 border bg-white"
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

        <div className="mt-5 text-sm">
          {filteredReferentials.length === 0 && searchTerm && (
            <p className="text-red-500 font-medium">Aucun résultat trouvé pour "{searchTerm}"</p>
          )}
          {filteredReferentials.length > 0 && (
            <p className="text-indigo-600 font-medium">
              Affichage de {filteredReferentials.length} référentiel{filteredReferentials.length > 1 ? 's' : ''}
              {searchTerm && ` pour la recherche "${searchTerm}"`}
            </p>
          )}
        </div>
      </div>
      
      {filteredReferentials.map((entity) => {
        const groupedFields = groupFieldsByLibGroup(entity.fields)
        
        return (
          <div key={entity['entity-id']} className="mb-12 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-indigo-600 text-white px-6 py-5 border-b">
              <h2 className="text-2xl font-semibold">{entity['entity-name']}</h2>
              <div className="text-sm text-indigo-100 mt-1">ID: {entity['entity-id']}</div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider w-1/12">ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider w-1/4">Libellé fonctionnel</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider w-1/8">Type</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider w-1/6">Lien</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(groupedFields).map(([groupName, fields], groupIndex) => (
                    <React.Fragment key={`${entity['entity-id']}-${groupName}`}>
                      <tr className="bg-indigo-100">
                        <td colSpan={5} className="px-6 py-4 text-left text-sm font-bold text-indigo-800">
                          {groupName}
                        </td>
                      </tr>
                      
                      {fields.map((field, index) => (
                        <tr 
                          key={field['id-field']} 
                          className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${field['link-entity-id'] ? 'border-l-4 border-indigo-300' : ''} hover:bg-indigo-50 transition-colors duration-150`}
                        >
                          <td className="px-6 py-4 text-sm text-gray-500 text-center font-mono">
                            {field['id-field']}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {searchTerm && field['lib-fonc'].toLowerCase().includes(searchTerm.toLowerCase()) ? (
                              <span className="bg-yellow-200 px-1 rounded">{field['lib-fonc']}</span>
                            ) : (
                              field['lib-fonc']
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {field.desc ? (
                              searchTerm && field.desc.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                                <span className="bg-yellow-200 px-1 rounded">{field.desc}</span>
                              ) : (
                                field.desc
                              )
                            ) : (
                              <span className="text-gray-400 italic">Pas de description</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                              {field['var-type'] || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {field['link-entity-id'] ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-200 text-indigo-700">
                                {referentials.find(e => e['entity-id'] === field['link-entity-id'])?.['entity-name'] || field['link-entity-id']}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
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