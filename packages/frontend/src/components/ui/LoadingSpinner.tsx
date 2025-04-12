import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'; // sm: small, md: medium, lg: large
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue-500',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-2 border-b-2 border-${color}`}></div>
    </div>
  );
};

export default React.memo(LoadingSpinner);