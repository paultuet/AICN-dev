import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button, PageHead, Pill } from "@/components/ui";
import type { PageStat } from "@/components/ui";
import { useAdoptionProgrammes, useAdoptionStatus } from "@/hooks/useAdoption";
import AdoptionMatrix from "@/components/adoption/AdoptionMatrix";
import ProgrammesView from "@/components/adoption/ProgrammesView";
import { adoptionErrorText } from "@/components/adoption/errorText";

type SubView = "suivi" | "programmes";

const AdoptionPage: React.FC = () => {
  const [subView, setSubView] = useState<SubView>("suivi");
  const status = useAdoptionStatus();
  const programmes = useAdoptionProgrammes();

  const active = subView === "suivi" ? status : programmes;

  // Refresh the WHOLE dashboard from Airtable, not just the visible sub-view —
  // otherwise a rename shows up in one view while the other keeps its cached
  // (staleTime) copy, e.g. a program title updating in "Suivi" but not "Programmes".
  const refreshAll = () => {
    status.refetch();
    programmes.refetch();
  };

  const stats: PageStat[] =
    subView === "suivi"
      ? [
          { value: status.data?.rows.length ?? "—", label: "Entrées" },
          { value: status.data?.programs.length ?? "—", label: "Programmes" },
        ]
      : [
          { value: programmes.data?.programmes.length ?? "—", label: "Programmes" },
          {
            value:
              programmes.data?.programmes.reduce((n, p) => n + p.events.length, 0) ?? "—",
            label: "Événements",
          },
        ];

  return (
    <div className="view relative mx-auto w-full max-w-[1480px] px-5 py-8 pb-20 md:px-7">
      <PageHead
        eyebrow="Adoption"
        title="Suivi de l'adoption des"
        accent="référentiels"
        sub="Avancement de l'adoption par statut et détail des programmes proposés, en direct depuis Airtable."
        stats={stats}
        actions={
          <Button
            variant="outline"
            icon={<RefreshCw size={15} />}
            isLoading={status.isFetching || programmes.isFetching}
            onClick={refreshAll}
          >
            Rafraîchir
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Pill active={subView === "suivi"} onClick={() => setSubView("suivi")}>
          Suivi par statut
        </Pill>
        <Pill active={subView === "programmes"} onClick={() => setSubView("programmes")}>
          Programmes
        </Pill>
        {active.dataUpdatedAt > 0 && (
          <span className="ml-auto font-mono text-[11px] text-ink-3">
            Mis à jour à {new Date(active.dataUpdatedAt).toLocaleTimeString("fr-FR")}
          </span>
        )}
      </div>

      {/* Refresh failed but stale data is still shown (spec §2.4) */}
      {active.isError && active.data && (
        <div className="mb-4 rounded-lg border border-danger-soft bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
          Actualisation échouée — {adoptionErrorText(active.error)}. Données affichées
          potentiellement obsolètes.
        </div>
      )}

      {subView === "suivi" ? (
        <AdoptionMatrix
          data={status.data}
          isLoading={status.isLoading}
          error={status.error}
        />
      ) : (
        <ProgrammesView
          data={programmes.data}
          isLoading={programmes.isLoading}
          error={programmes.error}
        />
      )}
    </div>
  );
};

export default AdoptionPage;
