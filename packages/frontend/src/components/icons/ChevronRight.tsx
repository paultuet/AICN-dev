import React from 'react';

interface IconProps {
  className?: string;
}

const ChevronRight: React.FC<IconProps> = ({ className = "h-5 w-5" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
};

export default ChevronRight;