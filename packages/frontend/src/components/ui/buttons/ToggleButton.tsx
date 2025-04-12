import React from 'react';

interface ToggleButtonProps {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  onChange: (active: boolean) => void;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  className?: string;
}

/**
 * A button that toggles between two states
 */
const ToggleButton: React.FC<ToggleButtonProps> = ({
  isActive,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  onChange,
  icon,
  activeIcon,
  className = ''
}) => {
  const activeStyles = 'bg-indigo-600 text-white hover:bg-indigo-700';
  const inactiveStyles = 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';

  const currentStyles = isActive ? activeStyles : inactiveStyles;
  const currentLabel = isActive ? activeLabel : inactiveLabel;
  const currentIcon = isActive && activeIcon ? activeIcon : icon;

  return (
    <button
      onClick={() => onChange(!isActive)}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg 
        text-sm font-medium transition-colors duration-200
        ${currentStyles}
        ${className}
      `}
    >
      {currentIcon && (
        <span className={isActive ? 'text-white' : 'text-indigo-500'}>
          {currentIcon}
        </span>
      )}
      <span>{currentLabel}</span>
    </button>
  );
};

export default React.memo(ToggleButton);