import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AdoptionEvent } from "@/types/adoption";

interface AgendaListProps {
  events: AdoptionEvent[];
}

const formatEventDate = (value: string | null): string | null => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return format(d, "d MMMM yyyy 'à' HH:mm", { locale: fr });
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="mb-2.5 last:mb-0">
    <div className="eyebrow mb-1 text-brand">{label}</div>
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{value}</div>
  </div>
);

const AgendaList: React.FC<AgendaListProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <p className="py-1 text-[13.5px] italic text-ink-3">
        Aucun événement programmé pour ce programme.
      </p>
    );
  }

  return (
    <div className="space-y-3.5">
      {events.map((ev) => {
        const date = formatEventDate(ev.date);
        return (
          <div
            key={ev.id}
            className="rounded-lg border border-hair border-l-2 border-l-accent-line bg-panel-2 p-4"
          >
            {ev.numEvent != null && ev.numEvent !== "" && (
              <Field label="Numéro d'événement" value={ev.numEvent} />
            )}
            <Field
              label="Événement"
              value={ev.titre || <span className="italic text-ink-3">Non renseigné</span>}
            />
            <Field
              label="Date / heure"
              value={date || <span className="italic text-ink-3">Non renseignée</span>}
            />
          </div>
        );
      })}
    </div>
  );
};

export default AgendaList;
