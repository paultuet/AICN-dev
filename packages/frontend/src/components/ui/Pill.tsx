import React from 'react';

interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accent-filled "on" state. */
  active?: boolean;
  children: React.ReactNode;
}

/**
 * Mono pill toggle/chip used for expand-all, tag filters and referential
 * chips. Active = accent-soft fill; idle = subtle panel with accent hover.
 */
const Pill: React.FC<PillProps> = ({ active = false, children, className = '', ...rest }) => (
  <button
    type="button"
    className={`inline-flex items-center gap-1.5 rounded-full font-mono text-xs px-3 py-1.5 border transition-colors
      ${active
        ? 'bg-accent-soft border-accent-line text-accent-ink'
        : 'bg-panel-2 border-hair text-ink-2 hover:border-accent-line hover:text-accent-ink'}
      ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export default Pill;
