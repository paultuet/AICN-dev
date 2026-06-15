import React, { useState } from "react";
import AirtableSync from "@/components/AirtableSync";
import { UsersList } from "../components/admin/UsersList";
import { ActivityLogs } from "../components/admin/ActivityLogs";
import { PageHead } from "@/components/ui";

type AdminTab = "users" | "logs" | "airtable";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "users", label: "Utilisateurs" },
  { id: "logs", label: "Logs d'activité" },
  { id: "airtable", label: "Airtable" },
];

/**
 * Page d'admin
 */
const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  return (
    <div className="view relative w-full max-w-[1480px] mx-auto px-5 md:px-7 py-8 pb-20 min-h-screen">
      <PageHead
        eyebrow="Administration"
        title="Console"
        accent="d'administration"
        sub="Pilotage de la plateforme : accès utilisateurs, journal d'activité et synchronisation des référentiels."
      />

      {/* Tabs */}
      <div className="border-b border-hair mb-6">
        <nav className="-mb-px flex gap-8">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === id
                  ? "border-brand text-ink"
                  : "border-transparent text-ink-3 hover:text-ink hover:border-hair-strong"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === "users" && <UsersList />}
        {activeTab === "logs" && <ActivityLogs />}
        {activeTab === "airtable" && <AirtableSync />}
      </div>
    </div>
  );
};

export default AdminPage;
