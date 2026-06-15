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
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-2 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-lg">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-3">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            block rounded-lg border bg-panel-2 border-hair text-ink placeholder:text-ink-4 text-sm px-3 py-2
            focus:outline-none focus:border-brand focus:bg-panel focus:ring-[3px] focus:ring-accent-soft
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-danger text-danger focus:border-danger focus:ring-danger-soft' : ''}
            ${fullWidth ? 'w-full' : ''}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-description` : undefined}
          {...props}
        />
      </div>
      {helpText && !error && (
        <p className="mt-1 text-sm text-ink-3" id={`${inputId}-description`}>
          {helpText}
        </p>
      )}
      {error && (
        <p className="mt-1 text-sm text-danger" id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default React.memo(TextInput);