import React, { useEffect, useMemo, useState } from "react";
import { AdoptionProgrammesData } from "@/types/adoption";
import { LoadingSpinner } from "@/components/ui";
import { adoptionErrorText } from "./errorText";
import ProgramButton from "./ProgramButton";
import ProgramDetail from "./ProgramDetail";

interface ProgrammesViewProps {
  data: AdoptionProgrammesData | undefined;
  isLoading: boolean;
  error: unknown;
}

const ProgrammesView: React.FC<ProgrammesViewProps> = ({ data, isLoading, error }) => {
  const programmes = useMemo(() => data?.programmes ?? [], [data]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Per-program session state so the registration form survives program switches.
  const [openByProgram, setOpenByProgram] = useState<Record<string, boolean>>({});
  const [rowsByProgram, setRowsByProgram] = useState<Record<string, string[]>>({});

  // Default to the first program once loaded.
  useEffect(() => {
    if (!activeId && programmes.length > 0) setActiveId(programmes[0].id);
  }, [activeId, programmes]);

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
        Impossible de charger les programmes. {adoptionErrorText(error)}
      </div>
    );
  }
  if (programmes.length === 0) {
    return <div className="empty">Aucun programme d'adoption à afficher.</div>;
  }

  const active = programmes.find((p) => p.id === activeId) ?? programmes[0];

  return (
    <div>
      <div className="mb-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {programmes.map((p) => (
          <ProgramButton
            key={p.id}
            label={p.name || "(sans nom)"}
            active={p.id === active.id}
            onClick={() => setActiveId(p.id)}
          />
        ))}
      </div>

      <ProgramDetail
        programme={active}
        registerOpen={!!openByProgram[active.id]}
        onToggleRegister={() =>
          setOpenByProgram((s) => ({ ...s, [active.id]: !s[active.id] }))
        }
        registerRows={rowsByProgram[active.id] ?? [""]}
        onRegisterRowsChange={(rows) =>
          setRowsByProgram((s) => ({ ...s, [active.id]: rows }))
        }
      />
    </div>
  );
};

export default ProgrammesView;
