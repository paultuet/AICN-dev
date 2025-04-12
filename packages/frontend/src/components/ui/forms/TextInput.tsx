import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Text input component with label, help text, and error handling
 */
const TextInput: React.FC<TextInputProps> = ({
  label,
  helpText,
  error,
  icon,
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            block rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''}
            ${fullWidth ? 'w-full' : ''}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-description` : undefined}
          {...props}
        />
      </div>
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500" id={`${inputId}-description`}>
          {helpText}
        </p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default React.memo(TextInput);