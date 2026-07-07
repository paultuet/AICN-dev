import React, { useMemo } from "react";
import { AdoptionStatusData } from "@/types/adoption";
import { buildAdoptionMatrix, MatrixCell } from "./buildAdoptionMatrix";
import LogoTile from "./LogoTile";
import { adoptionErrorText } from "./errorText";
import { LoadingSpinner } from "@/components/ui";

interface AdoptionMatrixProps {
  data: AdoptionStatusData | undefined;
  isLoading: boolean;
  error: unknown;
}

const TileRow: React.FC<{ label: string; entries: MatrixCell[keyof MatrixCell] }> = ({
  label,
  entries,
}) => (
  <div className="mb-2.5 last:mb-0">
    <div className="eyebrow mb-1.5">{label}</div>
    {entries.length === 0 ? (
      <span className="text-xs text-ink-3">—</span>
    ) : (
      <div className="flex flex-wrap gap-2">
        {entries.map((e, i) => (
          <LogoTile key={i} companyName={e.companyName} logoUrl={e.logoUrl} />
        ))}
      </div>
    )}
  </div>
);

const AdoptionMatrix: React.FC<AdoptionMatrixProps> = ({ data, isLoading, error }) => {
  const matrix = useMemo(() => buildAdoptionMatrix(data), [data]);

  if (isLoading && !data) {
    return (
      <div className="py-20">
        <LoadingSpinner color="brand" />
      </div>
    );
  }
  if (error && !data) {
    return (
      <div className="rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">
        Impossible de charger la matrice d'adoption. {adoptionErrorText(error)}
      </div>
    );
  }
  if (matrix.rows.length === 0) {
    return <div className="empty">Aucune donnée d'adoption à afficher.</div>;
  }

  const gridTemplateColumns = `240px repeat(${matrix.columns.length}, minmax(200px, 1fr))`;

  return (
    <div className="grid-scroll rounded-xl border border-hair shadow-panel">
      <div
        className="grid min-w-max gap-px bg-hair"
        style={{ gridTemplateColumns }}
      >
        {/* corner */}
        <div className="sticky left-0 z-20 bg-panel-3" />
        {/* column headers */}
        {matrix.columns.map((col) => (
          <div
            key={col.key}
            className="border-b-2 border-accent-line bg-panel-2 px-3 py-3 text-center"
          >
            <div className="text-[13px] font-semibold uppercase tracking-[0.04em] text-ink">
              {col.label}
            </div>
            <span className="mt-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-accent-ink">
              {col.count}
            </span>
          </div>
        ))}

        {/* rows */}
        {matrix.rows.map((row) => (
          <React.Fragment key={row.id}>
            <div className="sticky left-0 z-10 flex min-w-[220px] items-center bg-panel-3 px-3 py-3 text-[13px] font-medium leading-snug text-ink">
              {row.name}
            </div>
            {matrix.columns.map((col) => {
              const cell = matrix.getCell(row.id, col.key);
              return (
                <div key={col.key} className="bg-panel p-3">
                  <TileRow label="Métier" entries={cell.metier} />
                  <TileRow label="Tech" entries={cell.tech} />
                  {cell.autre.length > 0 && (
                    <TileRow label="Autre" entries={cell.autre} />
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default AdoptionMatrix;
