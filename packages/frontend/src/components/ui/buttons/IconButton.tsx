import React from 'react';

type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  round?: boolean;
  label?: string;
}

/**
 * Button that only contains an icon
 */
const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'primary',
  round = false,
  label,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${round ? 'rounded-full' : 'rounded-md'}
        ${className}
      `}
      aria-label={label}
      title={label}
      {...props}
    >
      <span className={iconSizeClasses[size]}>
        {icon}
      </span>
    </button>
  );
};

export default React.memo(IconButton);
