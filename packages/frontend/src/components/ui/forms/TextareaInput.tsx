import React from 'react';

interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helpText?: string;
  error?: string;
  fullWidth?: boolean;
}

/**
 * Textarea input component with label, help text, and error handling
 */
const TextareaInput: React.FC<TextareaInputProps> = ({
  label,
  helpText,
  error,
  fullWidth = false,
  className = '',
  rows = 3,
  id,
  ...props
}) => {
  const inputId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        <textarea
          id={inputId}
          rows={rows}
          className={`
            block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
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

export default React.memo(TextareaInput);