import React, { useState } from 'react';
import { HierarchicalEntity, HierarchicalField, Field } from '@/types/referential';
import ChevronDown from '@/components/icons/ChevronDown';
import ChevronRight from '@/components/icons/ChevronRight';

interface HierarchicalViewProps {
  data: HierarchicalEntity[];
  searchTerm?: string;
}

// Composant pour afficher le détail d'un champ
const FieldDetail: React.FC<{ field: Field }> = ({ field }) => {
  // Déterminer la couleur du badge en fonction du type de champ
  const getTypeBadgeColor = () => {
    switch (field['var-type']) {
      case 'TEXT': return 'bg-blue-100 text-blue-800';
      case 'NUMBER': return 'bg-amber-100 text-amber-800';
      case 'DATE': return 'bg-purple-100 text-purple-800';
      case 'BOOL': return 'bg-red-100 text-red-800';
      case 'LINK': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="border-b border-gray-100 py-3 px-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
      <div className="flex items-center">
        <div className="flex-1">
          <div className="font-medium text-gray-900">{field['lib-fonc']}</div>
          {field.desc && <div className="text-xs text-gray-500 mt-1">{field.desc}</div>}
        </div>
        <div className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadgeColor()}`}>
          {field['var-type'] || 'N/A'}
        </div>
      </div>
      <div className="flex justify-between items-center mt-1">
        <div className="text-xs text-gray-500">
          ID: {field['id-field']}
        </div>
        {field['link-entity-id'] && (
          <div className="text-xs text-blue-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Lié
          </div>
        )}
      </div>
    </div>
  );
};

const HierarchicalNode: React.FC<{
  node: HierarchicalEntity | HierarchicalField;
  level: number;
  searchTerm?: string;
  forceExpanded?: boolean;
}> = ({ node, level, searchTerm, forceExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(level < 2); // Auto-expand first 2 levels by default
  const [showFields, setShowFields] = useState<boolean>(false);
  
  const hasChildren = 'children' in node && node.children.length > 0;
  const hasFields = 'fields' in node && node.fields && node.fields.length > 0;
  
  // Vérifier si ce nœud ou ses enfants correspondent au terme de recherche
  const matchesSearch = searchTerm ? 
    node['entity-name'].toLowerCase().includes(searchTerm.toLowerCase()) : false;
  
  // Vérifier si des champs correspondent à la recherche
  const hasMatchingFields = searchTerm && hasFields ? 
    node.fields.some(field => 
      field['lib-fonc'].toLowerCase().includes(searchTerm.toLowerCase()) ||
      (field.desc && field.desc.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : false;
    
  // Vérifier si des enfants correspondent à la recherche (pour les entités)
  const hasMatchingChildren = searchTerm && hasChildren ? true : false; // On présume que oui par défaut, la vérification réelle se fait par récursion
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleFields = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFields(!showFields);
  };

  // Calculer le padding en fonction du niveau
  const getIndentClass = () => {
    const paddingSize = level * 4;
    return `pl-${paddingSize > 16 ? 16 : paddingSize}`;
  };
  
  // Obtenir la couleur de fond en fonction du niveau
  const getBackgroundColor = () => {
    if (matchesSearch && searchTerm) return 'bg-yellow-50';
    
    switch (level) {
      case 0: return 'bg-violet-100';
      case 1: return 'bg-amber-50';
      case 2: return 'bg-emerald-50';
      default: return 'bg-white';
    }
  };
  
  // Obtenir la couleur de bordure en fonction du niveau
  const getBorderColor = () => {
    switch (level) {
      case 0: return 'border-violet-300';
      case 1: return 'border-amber-300';
      case 2: return 'border-emerald-300';
      default: return 'border-gray-200';
    }
  };
  
  // Obtenir la couleur du texte de niveau en fonction du niveau
  const getLevelBadgeColor = () => {
    switch (level) {
      case 0: return 'bg-violet-200 text-violet-900';
      case 1: return 'bg-amber-200 text-amber-900';
      case 2: return 'bg-emerald-200 text-emerald-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Obtenir le style spécifique au niveau (style supplémentaire)
  const getLevelSpecificStyle = () => {
    switch (level) {
      case 0: return 'font-bold text-lg border-l-4 border-l-violet-500';
      case 1: return 'font-semibold text-base border-l-4 border-l-amber-500';
      case 2: return 'font-medium border-l-4 border-l-emerald-500';
      default: return '';
    }
  };
  
  // Déterminer si le nœud doit être affiché ou non en fonction de la recherche
  const shouldDisplay = !searchTerm || matchesSearch || hasMatchingFields || hasMatchingChildren;
  
  // Déterminer si on doit afficher les détails des champs
  const shouldShowFieldDetails = showFields || (searchTerm && hasMatchingFields);
  
  // Déterminer si on doit développer le nœud
  const shouldExpandNode = forceExpanded || isExpanded || (searchTerm && (hasMatchingFields || hasMatchingChildren));

  // Si le nœud ne correspond pas à la recherche, ne pas l'afficher
  if (!shouldDisplay) {
    return null;
  }

  return (
    <div className={`border-b ${getBorderColor()} last:border-b-0 ${getBackgroundColor()} transition-all duration-200 ${getLevelSpecificStyle()}`}>
      <div 
        className={`py-3 px-4 flex items-center hover:bg-opacity-80 cursor-pointer ${getIndentClass()} transition-all duration-200`}
        onClick={toggleExpand}
      >
        {hasChildren ? (
          shouldExpandNode ? (
            <ChevronDown className="h-5 w-5 text-indigo-600 mr-2" />
          ) : (
            <ChevronRight className="h-5 w-5 text-indigo-600 mr-2" />
          )
        ) : (
          <div className="h-5 w-5 mr-2" /> // Empty space for alignment
        )}
        
        <div className="flex-1">
          <div className={`${matchesSearch && searchTerm ? 'text-indigo-600' : 'text-gray-900'}`}>
            {node['entity-name']}
          </div>
          <div className="text-xs text-gray-500">ID: {node['id-record']}</div>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasFields && (
            <button 
              onClick={toggleFields}
              className={`px-2 py-1 text-xs rounded-full ${shouldShowFieldDetails ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {shouldShowFieldDetails ? 'Masquer champs' : `Voir ${node.fields.length} champ${node.fields.length > 1 ? 's' : ''}`}
            </button>
          )}
          
          <div className={`px-2 py-1 text-xs rounded-full font-medium ${getLevelBadgeColor()}`}>
            {'type' in node ? `${node.type} - Niv ${node.niveau}` : `Niveau ${node.niveau}`}
          </div>
        </div>
      </div>
      
      {/* Afficher les champs s'ils existent et sont demandés */}
      {hasFields && shouldShowFieldDetails && (
        <div className={`border-l-4 border-green-300 ml-8 mb-2 shadow-sm bg-white rounded-r-md overflow-hidden transition-all duration-300`}>
          <div className="p-2 bg-green-50 text-green-800 text-xs font-medium">
            Champs ({node.fields.length})
          </div>
          <div className="divide-y divide-gray-100">
            {node.fields
              .filter(field => !searchTerm || 
                field['lib-fonc'].toLowerCase().includes(searchTerm.toLowerCase()) ||
                (field.desc && field.desc.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((field) => (
                <FieldDetail key={field['id-field']} field={field} />
              ))}
          </div>
        </div>
      )}
      
      {/* Afficher les enfants s'ils existent et sont demandés */}
      {hasChildren && shouldExpandNode && (
        <div className={`border-l-4 ${getBorderColor()} ml-6`}>
          {(node as HierarchicalEntity).children.map((child, index) => (
            <HierarchicalNode 
              key={`${child['entity-id']}-${index}`} 
              node={child} 
              level={level + 1}
              searchTerm={searchTerm}
              forceExpanded={forceExpanded || (searchTerm && (hasMatchingChildren || hasMatchingFields))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const HierarchicalView: React.FC<HierarchicalViewProps> = ({ data, searchTerm }) => {
  // Calculer le nombre d'entités affichées après filtrage
  const displayedEntitiesCount = searchTerm 
    ? data.filter(entity => 
        entity['entity-name'].toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Vérifier si des enfants ou des champs correspondent
        (entity.children && entity.children.length > 0)
      ).length
    : data.length;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Structure hiérarchique</h2>
            <div className="text-sm text-indigo-100 mt-1 opacity-90">
              {data.length} entités de premier niveau
              {searchTerm && ` - Recherche : "${searchTerm}"`}
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-xs font-medium">
            Codification par couleur
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3 px-4 pt-3 text-xs">
        <div className="px-3 py-1.5 rounded-md bg-violet-100 text-violet-900 border border-violet-300 font-bold">
          Niveau 1
        </div>
        <div className="px-3 py-1.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 font-semibold">
          Niveau 2
        </div>
        <div className="px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300">
          Niveau 3
        </div>
        <div className="px-3 py-1.5 rounded-md bg-green-50 text-green-800 border border-green-300">
          Champs
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {data.map((entity) => (
          <HierarchicalNode 
            key={entity['entity-id']} 
            node={entity} 
            level={0} 
            searchTerm={searchTerm}
          />
        ))}
      </div>
      
      {/* Message si aucun résultat trouvé */}
      {searchTerm && displayedEntitiesCount === 0 && (
        <div className="p-8 text-center text-red-500">
          <div className="text-3xl mb-2">😕</div>
          <div className="font-medium">Aucun résultat trouvé pour "{searchTerm}"</div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalView;