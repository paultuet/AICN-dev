import React from 'react';
import { ToggleButton } from '@/components/ui';

interface ConversationFilterButtonProps {
  active: boolean;
  onChange: (active: boolean) => void;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}

const ConversationFilterButton: React.FC<ConversationFilterButtonProps> = ({
  active,
  onChange,
  activeLabel = 'Afficher tous les éléments',
  inactiveLabel = 'Afficher uniquement avec conversations',
  className = ''
}) => {
  const conversationIcon = (
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
  );

  return (
    <ToggleButton
      isActive={active}
      onChange={onChange}
      activeLabel={activeLabel}
      inactiveLabel={inactiveLabel}
      icon={conversationIcon}
      className={className}
    />
  );
};

export default React.memo(ConversationFilterButton);
