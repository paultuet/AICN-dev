import React, { useState } from "react";
import { initials } from "./buildAdoptionMatrix";

interface LogoTileProps {
  companyName: string | null;
  logoUrl: string | null;
  /** Square size in px (default 92). Smaller values let the matrix fit without scroll. */
  size?: number;
}

/**
 * Square company logo tile. Falls back to initials on an accent-soft chip when
 * there is no logo OR the (short-lived) Airtable attachment URL fails to load.
 */
const LogoTile: React.FC<LogoTileProps> = ({ companyName, logoUrl, size = 92 }) => {
  const [broken, setBroken] = useState(false);
  const showImg = logoUrl && !broken;
  const label = companyName || "Logo";

  return (
    <div
      className={`group relative flex items-center justify-center overflow-hidden rounded-lg border border-hair ${
        showImg ? "bg-panel" : "bg-accent-soft"
      }`}
      style={{ width: size, height: size }}
      title={label}
    >
      {showImg ? (
        <img
          src={logoUrl}
          alt={label}
          loading="lazy"
          onError={() => setBroken(true)}
          className="max-h-full max-w-full object-contain p-1"
        />
      ) : (
        <span
          className="font-semibold text-accent-ink"
          style={{ fontSize: Math.max(11, Math.round(size * 0.28)) }}
        >
          {initials(companyName)}
        </span>
      )}
      {/* hover tooltip */}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
};

export default LogoTile;
