import React from 'react';

type BadgeColor = 'blue' | 'indigo' | 'purple' | 'gray' | 'green' | 'red' | 'yellow' | 'emerald' | 'amber' | 'orange' | 'cyan' | 'teal';

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
    yellow: 'bg-yellow-100 text-yellow-800',
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    orange: 'bg-orange-100 text-orange-800',
    teal: 'bg-teal-100 text-teal-800',
    cyan: 'bg-cyan-100 text-cyan-800',
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
