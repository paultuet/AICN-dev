import React from 'react';
import { IconProps } from '.';

type ChatBubbleIconProps = IconProps & {
  filled?: boolean;
  hasUnread?: boolean;
}

const ChatBubbleIcon: React.FC<ChatBubbleIconProps> = ({ className = "h-5 w-5", filled = false, hasUnread = false }) => {
  // Déterminer la couleur basée sur le statut de lecture
  const getColorClass = () => {
    if (hasUnread) {
      return "text-blue-600"; // Bleu pour les conversations non-lues
    }
    return "text-gray-500"; // Gris pour les conversations lues
  };

  const finalClassName = className.includes('text-') ? className : `${className} ${getColorClass()}`;
  if (filled) {
    return (
      <svg className={finalClassName} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
      </svg>
    );
  }

  return (
    <svg className={finalClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
};

export default ChatBubbleIcon;
