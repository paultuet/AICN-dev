import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Table } from "../ui";
import LoadingSpinner from "../ui/LoadingSpinner";
import ErrorMessage from "../ui/ErrorMessage";
import { useAdoptionRegistrations } from "@/hooks/useAdoption";
import { ProgramRegistration } from "@/types/adoption";

const fmtDate = (value: string) => {
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: fr });
  } catch {
    return value;
  }
};

const columns = [
  {
    key: "createdAt",
    header: "Date",
    width: "[16%]",
    render: (r: ProgramRegistration) => fmtDate(r.createdAt),
  },
  {
    key: "programName",
    header: "Programme",
    width: "[26%]",
    render: (r: ProgramRegistration) => r.programName || "—",
  },
  {
    key: "organizations",
    header: "Organisations",
    width: "[36%]",
    render: (r: ProgramRegistration) => (
      <div>
        <span className="mr-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
          {r.organizations.length}
        </span>
        <span className="break-words">{r.organizations.join(", ")}</span>
      </div>
    ),
  },
  {
    key: "submittedByEmail",
    header: "Inscrit par (email)",
    width: "[22%]",
    render: (r: ProgramRegistration) => r.submittedByEmail || r.submittedByName || "—",
  },
];

export const RegistrationsList: React.FC = () => {
  const { data: registrations = [], isLoading, error } = useAdoptionRegistrations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }
  if (error) {
    return <ErrorMessage message="Erreur lors du chargement des inscriptions" />;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Inscriptions ({registrations.length})
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Organisations inscrites aux programmes d'adoption (avec l'email de la personne
          qui les a inscrites).
        </p>
      </div>

      <Table
        data={registrations}
        columns={columns}
        className="w-full"
        emptyState="Aucune inscription pour le moment."
      />
    </div>
  );
};

export default RegistrationsList;
