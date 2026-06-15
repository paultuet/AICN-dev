import React from 'react';
import Eyebrow from './Eyebrow';

export interface PageStat {
  value: React.ReactNode;
  label: string;
}

interface PageHeadProps {
  /** Mono micro-label above the title. */
  eyebrow?: string;
  title: React.ReactNode;
  /** Optional trailing word(s) of the title rendered in the brand accent. */
  accent?: string;
  sub?: string;
  /** Right-aligned mono stat block (value + label), separated by hairlines. */
  stats?: PageStat[];
  /** Right-aligned actions (e.g. a primary button), shown after stats. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Page header of the redesign: eyebrow + title (optional accent word) + sub,
 * with an optional right-aligned mono stat block and/or actions.
 */
const PageHead: React.FC<PageHeadProps> = ({
  eyebrow,
  title,
  accent,
  sub,
  stats,
  actions,
  className = '',
}) => (
  <div className={`flex items-end justify-between gap-6 mb-6 flex-wrap ${className}`}>
    <div className="min-w-0">
      {eyebrow && <Eyebrow className="mb-2.5">{eyebrow}</Eyebrow>}
      <h1 className="text-[27px] font-semibold tracking-[-0.015em] leading-tight text-ink">
        {title}
        {accent && <span className="text-brand"> {accent}</span>}
      </h1>
      {sub && <p className="mt-2 text-ink-2 text-[13.5px] max-w-[60ch]">{sub}</p>}
    </div>
    {(stats?.length || actions) && (
      <div className="flex items-center gap-4">
        {stats && stats.length > 0 && (
          <div className="flex items-stretch">
            {stats.map((s, i) => (
              <div key={i} className={`px-5 ${i > 0 ? 'border-l border-hair' : ''}`}>
                <div className="font-mono text-2xl font-semibold text-ink leading-none">{s.value}</div>
                <Eyebrow className="mt-1.5">{s.label}</Eyebrow>
              </div>
            ))}
          </div>
        )}
        {actions}
      </div>
    )}
  </div>
);

export default PageHead;
