import React from 'react';

interface ReferentialTypeFilterProps {
  selectedType: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  label?: string;
  allTypesLabel?: string;
}

const REFERENCE_TYPES = [
  { id: 'RIO', name: 'Référentiels d\'interopérabilité' },
  { id: 'NMR', name: 'Nomenclatures des missions et responsabilités' },
  { id: 'LoV', name: 'Listes de valeurs' }
];

const ReferentialTypeFilter: React.FC<ReferentialTypeFilterProps> = ({
  selectedType,
  onChange,
  className = '',
  label = 'Filtrer par type',
  allTypesLabel = 'Tous les types'
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange(value === '' ? null : value);
  };

  return (
    <div className={className}>
      <label htmlFor="type-filter" className="block text-sm font-semibold text-black mb-2">
        {label}
      </label>
      <select
        id="type-filter"
        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-lg p-3 border bg-white"
        value={selectedType || ''}
        onChange={handleChange}
      >
        <option value="">{allTypesLabel}</option>
        {REFERENCE_TYPES.map(type => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default React.memo(ReferentialTypeFilter);
