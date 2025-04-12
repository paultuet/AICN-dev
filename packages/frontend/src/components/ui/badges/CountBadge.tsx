import React from 'react';
import Badge from './Badge';

interface CountBadgeProps {
  count: number;
  label?: string;
  color?: 'blue' | 'indigo' | 'purple' | 'gray' | 'green' | 'red' | 'yellow';
  className?: string;
  pill?: boolean;
}

/**
 * Badge component that shows a count with optional label
 */
const CountBadge: React.FC<CountBadgeProps> = ({ 
  count,
  label = 'item',
  color = 'indigo',
  className = '',
  pill = true
}) => {
  const pluralize = (count: number, word: string) => {
    return count === 1 ? word : `${word}s`;
  };

  return (
    <Badge color={color} className={className} pill={pill}>
      {count} {label && `${pluralize(count, label)}`}
    </Badge>
  );
};

export default React.memo(CountBadge);