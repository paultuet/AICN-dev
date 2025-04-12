import React from 'react';

type BadgeColor = 'blue' | 'indigo' | 'purple' | 'gray' | 'green' | 'red' | 'yellow';

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  pill?: boolean;
}

/**
 * Badge component for displaying short status or category labels.
 */
const Badge: React.FC<BadgeProps> = ({ 
  color = 'indigo',
  children, 
  className = '',
  size = 'sm',
  pill = false
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-200 text-gray-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };

  return (
    <span className={`
      inline-flex items-center font-medium
      ${colorClasses[color]} 
      ${sizeClasses[size]}
      ${pill ? 'rounded-full' : 'rounded'}
      ${className}
    `}>
      {children}
    </span>
  );
};

export default React.memo(Badge);