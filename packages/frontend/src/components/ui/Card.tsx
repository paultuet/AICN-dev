import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Adds the technical corner ticks (accent L-marks) of the redesign. */
  ticks?: boolean;
}

/**
 * Card component with optional header and footer sections
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  footer,
  ticks = false
}) => {
  return (
    <div className={`bg-panel shadow-panel rounded-xl border border-hair ${ticks ? 'ticks' : ''} ${className}`}>
      {header && (
        <div className="border-b border-hair px-4 py-3 sm:px-5">
          {header}
        </div>
      )}
      <div className="p-3 sm:p-4 md:p-5">
        {children}
      </div>
      {footer && (
        <div className="border-t border-hair px-4 py-3 sm:px-5">
          {footer}
        </div>
      )}
    </div>
  );
};

export default React.memo(Card);