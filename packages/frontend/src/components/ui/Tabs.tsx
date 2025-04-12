import React, { useState } from 'react';

interface Tab {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

/**
 * Tabs component for navigating between different content sections
 */
const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || (tabs[0]?.id || ''));

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };

  return (
    <div className={className}>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`
                  whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
                  ${isActive 
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => !tab.disabled && handleTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                disabled={tab.disabled}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="mt-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default React.memo(Tabs);