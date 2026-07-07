import React from "react";

interface ProgramButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

/** Prominent program selector tile (larger than a Pill). Active = brand fill. */
const ProgramButton: React.FC<ProgramButtonProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`rounded-xl border px-4 py-4 text-center text-[15px] font-semibold leading-snug transition-colors ${
      active
        ? "border-transparent bg-brand text-white shadow-[0_6px_16px_-8px_var(--orange)]"
        : "border-hair bg-panel text-ink hover:border-accent-line hover:bg-accent-soft hover:text-accent-ink"
    }`}
  >
    {label}
  </button>
);

export default ProgramButton;
