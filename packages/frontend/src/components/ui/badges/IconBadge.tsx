import React from 'react';
import Badge from './Badge';

interface IconBadgeProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  color?: 'blue' | 'indigo' | 'purple' | 'gray' | 'green' | 'red' | 'yellow';
  className?: string;
  pill?: boolean;
  clickable?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Badge component with an optional icon
 */
const IconBadge: React.FC<IconBadgeProps> = ({ 
  icon,
  children, 
  color = 'indigo',
  className = '',
  pill = true,
  clickable = false,
  onClick
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(e);
  };

  const content = (
    <>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </>
  );

  if (clickable) {
    return (
      <button 
        onClick={handleClick}
        className={`
          inline-flex items-center font-medium transition-colors
          hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-${color}-500
          bg-${color}-100 text-${color}-800 
          px-2 py-0.5 text-xs
          ${pill ? 'rounded-full' : 'rounded'}
          ${className}
        `}
      >
        {content}
      </button>
    );
  }

  return (
    <Badge color={color} className={className} pill={pill}>
      {content}
    </Badge>
  );
};

export default React.memo(IconBadge);