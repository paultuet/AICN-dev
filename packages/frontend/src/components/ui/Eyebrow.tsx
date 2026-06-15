import React from 'react';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Micro-label (IBM Plex Mono, uppercase, tracked) used above titles and
 * section labels. Styling lives in the `.eyebrow` class in index.css.
 */
const Eyebrow: React.FC<EyebrowProps> = ({ children, className = '' }) => (
  <div className={`eyebrow ${className}`}>{children}</div>
);

export default Eyebrow;
