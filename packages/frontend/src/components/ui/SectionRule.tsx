import React from 'react';

interface SectionRuleProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Labelled horizontal rule: optional accent icon + bold label + a hairline
 * filling the remaining width. Used for section headers in panels.
 */
const SectionRule: React.FC<SectionRuleProps> = ({ icon, children, className = '' }) => (
  <div className={`flex items-center gap-3.5 mb-4 ${className}`}>
    {icon && <span className="text-brand shrink-0 flex items-center">{icon}</span>}
    <span className="text-sm font-semibold text-ink shrink-0">{children}</span>
    <span className="flex-1 h-px bg-hair" />
  </div>
);

export default SectionRule;
