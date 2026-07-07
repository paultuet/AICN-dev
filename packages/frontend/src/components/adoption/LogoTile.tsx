import React, { useState } from "react";
import { initials } from "./buildAdoptionMatrix";

interface LogoTileProps {
  companyName: string | null;
  logoUrl: string | null;
}

/**
 * 92×92 company logo tile. Falls back to initials on an accent-soft chip when
 * there is no logo OR the (short-lived) Airtable attachment URL fails to load.
 */
const LogoTile: React.FC<LogoTileProps> = ({ companyName, logoUrl }) => {
  const [broken, setBroken] = useState(false);
  const showImg = logoUrl && !broken;
  const label = companyName || "Logo";

  return (
    <div
      className={`group relative flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-xl border border-hair ${
        showImg ? "bg-panel" : "bg-accent-soft"
      }`}
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
        <span className="text-xl font-semibold text-accent-ink">{initials(companyName)}</span>
      )}
      {/* hover tooltip */}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
};

export default LogoTile;
