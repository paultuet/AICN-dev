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
  const variantClasses = {
    primary: 'bg-aicn-blue text-white hover:bg-aicn-blue-dark focus:ring-aicn-blue-light',
    secondary: 'bg-aicn-orange text-white hover:bg-aicn-orange-dark focus:ring-aicn-orange-light',
    outline: 'bg-white text-gray-700 border border-gray-400 hover:bg-gray-100 focus:ring-gray-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
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