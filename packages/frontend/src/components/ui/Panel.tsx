import React from 'react';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  /** Technical corner ticks (accent L-marks). */
  ticks?: boolean;
  /** Built-in 22-24px padding. */
  padded?: boolean;
}

/**
 * Surface primitive of the redesign: white panel, hairline border, soft
 * shadow, 12px radius, optional corner ticks. Lighter-weight than Card
 * (no header/footer slots) — use for toolbars, sections, content blocks.
 */
const Panel: React.FC<PanelProps> = ({
  children,
  className = '',
  ticks = false,
  padded = false,
  ...rest
}) => (
  <div
    className={`bg-panel border border-hair rounded-xl shadow-panel ${ticks ? 'ticks' : ''} ${padded ? 'p-6' : ''} ${className}`}
    {...rest}
  >
    {children}
  </div>
);

export default Panel;
