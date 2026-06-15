import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
  isLoading?: boolean;
}

/**
 * Button component with multiple variants and sizes
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Single-accent design system: filled CTAs are brand orange; secondary
  // actions are subtle panel buttons; destructive is ghost-danger.
  const variantClasses = {
    primary: 'bg-brand text-white shadow-[0_6px_16px_-8px_var(--orange)] hover:brightness-105 active:translate-y-px focus:ring-brand',
    secondary: 'bg-brand text-white shadow-[0_6px_16px_-8px_var(--orange)] hover:brightness-105 active:translate-y-px focus:ring-brand',
    outline: 'bg-panel-2 text-ink border border-hair hover:border-accent-line hover:bg-accent-soft hover:text-accent-ink focus:ring-accent-line',
    ghost: 'bg-transparent text-ink-2 hover:bg-accent-soft hover:text-accent-ink focus:ring-accent-line',
    danger: 'bg-transparent text-danger border border-hair hover:border-danger hover:bg-danger-soft focus:ring-danger'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <span className="mr-2">
          <svg className="animate-spin -ml-1 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      
      {icon && iconPosition === 'left' && !isLoading && (
        <span className="mr-2 flex-shrink-0">{icon}</span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && (
        <span className="ml-2 flex-shrink-0">{icon}</span>
      )}
    </button>
  );
};

export default React.memo(Button);
