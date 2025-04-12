import React from 'react';

interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  type = 'error',
  className = ''
}) => {
  const typeClasses = {
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  return (
    <div className={`${className || 'max-w-4xl mx-auto mt-8'}`}>
      <div className={`${typeClasses[type]} border px-4 py-3 rounded`}>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default React.memo(ErrorMessage);