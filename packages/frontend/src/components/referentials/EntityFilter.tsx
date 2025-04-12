import React from 'react';
import { Entity } from '../../types/referential';

interface EntityFilterProps {
  entities: Entity[];
  selectedEntity: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  label?: string;
  allEntitiesLabel?: string;
}

const EntityFilter: React.FC<EntityFilterProps> = ({
  entities,
  selectedEntity,
  onChange,
  className = '',
  label = 'Filtrer par référentiel',
  allEntitiesLabel = 'Tous les référentiels'
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange(value === '' ? null : value);
  };

  return (
    <div className={className}>
      <label htmlFor="entity-filter" className="block text-sm font-semibold text-black mb-2">
        {label}
      </label>
      <select
        id="entity-filter"
        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-lg p-3 border bg-white"
        value={selectedEntity || ''}
        onChange={handleChange}
      >
        <option value="">{allEntitiesLabel}</option>
        {entities.map(entity => (
          <option key={entity['entity-id']} value={entity['entity-id']}>
            {entity['entity-name']}
          </option>
        ))}
      </select>
    </div>
  );
};

export default React.memo(EntityFilter);