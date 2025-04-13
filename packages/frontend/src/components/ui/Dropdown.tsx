import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[] | DropdownItem[][];
  align?: 'left' | 'right';
  className?: string;
  width?: 'auto' | 'full';
}

/**
 * Dropdown menu component
 */
const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className = '',
  width = 'auto'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const isMultiSection = Array.isArray(items[0]);

  // Function to determine if an item is a divider (used for type checking)
  const _typeCheck = (group: DropdownItem[] | DropdownItem): group is DropdownItem[] => {
    return Array.isArray(group);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={toggleDropdown}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute z-10 mt-2 ${width === 'full' ? 'w-full' : 'w-56'} origin-top-${align} rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
          style={{ [align]: 0 }}
        >
          <div className="py-1">
            {isMultiSection ? (
              // Multi-section dropdown
              (items as DropdownItem[][]).map((section, sectionIndex) => (
                <React.Fragment key={`section-${sectionIndex}`}>
                  {sectionIndex > 0 && <div className="my-1 h-px bg-gray-200" />}
                  {section.map((item) => (
                    <button
                      key={item.id}
                      className={`
                        ${item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                        ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}
                        group flex w-full items-center px-4 py-2 text-sm
                      `}
                      onClick={() => {
                        if (!item.disabled && item.onClick) {
                          item.onClick();
                          closeDropdown();
                        }
                      }}
                      disabled={item.disabled}
                    >
                      {item.icon && <span className="mr-3 h-5 w-5">{item.icon}</span>}
                      {item.label}
                    </button>
                  ))}
                </React.Fragment>
              ))
            ) : (
              // Single-section dropdown
              (items as DropdownItem[]).map((item) => (
                <button
                  key={item.id}
                  className={`
                    ${item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}
                    group flex w-full items-center px-4 py-2 text-sm
                  `}
                  onClick={() => {
                    if (!item.disabled && item.onClick) {
                      item.onClick();
                      closeDropdown();
                    }
                  }}
                  disabled={item.disabled}
                >
                  {item.icon && <span className="mr-3 h-5 w-5">{item.icon}</span>}
                  {item.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Dropdown);