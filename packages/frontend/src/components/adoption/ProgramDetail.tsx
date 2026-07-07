import React from "react";
import { CalendarClock } from "lucide-react";
import { Button, Card, SectionRule } from "@/components/ui";
import { AdoptionProgramme } from "@/types/adoption";
import AgendaList from "./AgendaList";
import RegistrationForm from "./RegistrationForm";

interface ProgramDetailProps {
  programme: AdoptionProgramme;
  registerOpen: boolean;
  onToggleRegister: () => void;
  registerRows: string[];
  onRegisterRowsChange: (rows: string[]) => void;
}

const Section: React.FC<{ title: string; value: string | null }> = ({ title, value }) => {
  const text = (value || "").trim();
  return (
    <div className="mb-6 last:mb-0">
      <SectionRule>{title}</SectionRule>
      {text ? (
        <div className="whitespace-pre-wrap rounded-lg border border-hair bg-panel-2 p-4 text-[14.5px] leading-relaxed text-ink">
          {text}
        </div>
      ) : (
        <div className="rounded-lg border border-hair bg-panel-2 p-4 text-[14.5px] italic text-ink-3">
          Non renseigné
        </div>
      )}
    </div>
  );
};

const ProgramDetail: React.FC<ProgramDetailProps> = ({
  programme,
  registerOpen,
  onToggleRegister,
  registerRows,
  onRegisterRowsChange,
}) => (
  <Card ticks>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b-2 border-accent-line pb-3.5">
      <h2 className="text-[26px] font-semibold leading-tight text-ink">
        {programme.name || "(sans nom)"}
      </h2>
      <Button variant="primary" onClick={onToggleRegister}>
        {registerOpen ? "Masquer l'inscription" : "Inscrire des organisations"}
      </Button>
    </div>

    {registerOpen && (
      <RegistrationForm
        programId={programme.id}
        programName={programme.name}
        rows={registerRows}
        onRowsChange={onRegisterRowsChange}
      />
    )}

    <Section title="Description du programme d'adoption" value={programme.description} />
    <Section title="Cible" value={programme.cible} />
    <Section title="Livrables" value={programme.livrables} />
    <Section title="Communication" value={programme.communication} />

    <div className="mb-0">
      <SectionRule icon={<CalendarClock size={16} />}>Agenda</SectionRule>
      <AgendaList events={programme.events} />
    </div>
  </Card>
);

export default ProgramDetail;
