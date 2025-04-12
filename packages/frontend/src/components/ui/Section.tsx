import React from 'react';

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

/**
 * Section component for standardizing page section layouts
 */
const Section: React.FC<SectionProps> = ({
  title,
  description,
  children,
  className = '',
  actions
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {(title || actions) && (
        <div className="flex justify-between items-center mb-3">
          <div>
            {title && (
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
};

export default React.memo(Section);