import React, { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button, TextInput } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { useSubmitRegistration } from "@/hooks/useAdoption";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegistrationFormProps {
  programId: string;
  programName: string | null;
  /** Per-program session state, lifted so it survives program switches. */
  rows: string[];
  onRowsChange: (rows: string[]) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  programId,
  programName,
  rows,
  onRowsChange,
}) => {
  const { showToast } = useToast();
  const mutation = useSubmitRegistration();
  // Addresses confirmed on the last successful submit (spec §3.4 — echo them back).
  const [confirmed, setConfirmed] = useState<string[] | null>(null);

  const updateRow = (idx: number, value: string) => {
    setConfirmed(null);
    const next = [...rows];
    next[idx] = value;
    onRowsChange(next);
  };

  const addRow = () => {
    setConfirmed(null);
    onRowsChange([...rows, ""]);
  };

  const removeRow = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    onRowsChange(next.length ? next : [""]);
  };

  const handleSubmit = () => {
    const emails = rows.map((r) => r.trim()).filter(Boolean);
    if (emails.length === 0) {
      showToast("error", "Saisissez au moins une adresse email.");
      return;
    }
    if (emails.some((e) => !EMAIL_RE.test(e))) {
      showToast("error", "Certaines adresses email sont invalides.");
      return;
    }
    const unique = Array.from(new Set(emails));
    mutation.mutate(
      { programId, programName, emails: unique },
      {
        onSuccess: () => {
          showToast("success", `${unique.length} participant(s) inscrit(s).`);
          setConfirmed(unique);
          onRowsChange([""]);
        },
        onError: () => {
          showToast("error", "Échec de l'inscription. Merci de réessayer.");
        },
      },
    );
  };

  return (
    <div className="mb-6 rounded-xl border border-accent-line bg-accent-soft p-5">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.04em] text-accent-ink">
        Inscription de participants
      </h4>

      <div className="space-y-2">
        {rows.map((value, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <TextInput
              type="email"
              fullWidth
              placeholder="adresse@exemple.com"
              value={value}
              onChange={(e) => updateRow(idx, e.target.value)}
            />
            <Button
              variant="ghost"
              size="sm"
              aria-label="Retirer cette adresse"
              onClick={() => removeRow(idx)}
              className="!px-2"
            >
              <X size={16} />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <Button variant="outline" size="sm" icon={<Plus size={15} />} onClick={addRow}>
          Ajouter une adresse
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          isLoading={mutation.isPending}
        >
          Valider l'inscription
        </Button>
      </div>

      {confirmed && confirmed.length > 0 && (
        <div className="mt-3 rounded-lg border border-hair bg-panel p-3 text-[13px]">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-ok">
            <Check size={15} /> {confirmed.length} participant(s) inscrit(s)
          </div>
          <div className="text-ink-2">{confirmed.join(", ")}</div>
        </div>
      )}
    </div>
  );
};

export default RegistrationForm;
