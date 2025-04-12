import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Card component with optional header and footer sections
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  footer
}) => {
  return (
    <div className={`bg-white shadow-lg rounded-lg border border-gray-200 ${className}`}>
      {header && (
        <div className="border-b border-gray-200 px-4 py-3 sm:px-5">
          {header}
        </div>
      )}
      <div className="p-3 sm:p-4 md:p-5">
        {children}
      </div>
      {footer && (
        <div className="border-t border-gray-200 px-4 py-3 sm:px-5">
          {footer}
        </div>
      )}
    </div>
  );
};

export default React.memo(Card);