import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectInputProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  helpText?: string;
  error?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  fullWidth?: boolean;
  placeholder?: string;
}

/**
 * Select input component with label, help text, and error handling
 */
const SelectInput: React.FC<SelectInputProps> = ({
  label,
  helpText,
  error,
  options,
  onChange,
  fullWidth = false,
  className = '',
  placeholder,
  id,
  value,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        <select
          id={selectId}
          className={`
            block rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
            ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''}
            ${fullWidth ? 'w-full' : ''}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helpText ? `${selectId}-description` : undefined}
          onChange={handleChange}
          value={value}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500" id={`${selectId}-description`}>
          {helpText}
        </p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${selectId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default React.memo(SelectInput);