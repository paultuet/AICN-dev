import React from 'react';
import { ToggleButton } from '@/components/ui';

interface UnreadConversationFilterButtonProps {
  active: boolean;
  onChange: (active: boolean) => void;
  unreadCount?: number;
  className?: string;
}

const UnreadConversationFilterButton: React.FC<UnreadConversationFilterButtonProps> = ({
  active,
  onChange,
  unreadCount = 0,
  className = ''
}) => {
  const unreadIcon = (
    <div className="relative">
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.083-.98L3 20l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.582 9 8z"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 h-4 w-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );

  const activeLabel = 'Afficher toutes les conversations';
  const inactiveLabel = `Conversations non lues${unreadCount > 0 ? ` (${unreadCount})` : ''}`;

  return (
    <ToggleButton
      isActive={active}
      onChange={onChange}
      activeLabel={activeLabel}
      inactiveLabel={inactiveLabel}
      icon={unreadIcon}
      className={className}
      disabled={unreadCount === 0}
    />
  );
};

export default React.memo(UnreadConversationFilterButton);