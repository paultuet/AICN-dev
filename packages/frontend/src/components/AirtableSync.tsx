import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui";
import api from "@/services/api";

const AirtableSync = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const handleSync = async () => {
    if (!window.confirm("Voulez-vous synchroniser les données depuis Airtable ?")) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      await api.post("/sync");
      // Invalider le cache pour forcer le rechargement des référentiels
      await queryClient.invalidateQueries({ queryKey: ['referentials'] });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 bg-red-300 rounded-md mb-6 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Button variant="danger" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Synchronisation en cours...
            </span>
          ) : (
            'Synchroniser avec Airtable'
          )}
        </Button>
        {syncStatus === 'success' && (
          <span className="text-green-800 font-medium">Synchronisation terminée</span>
        )}
        {syncStatus === 'error' && (
          <span className="text-red-800 font-medium">Erreur lors de la synchronisation</span>
        )}
      </div>
    </div>
  );
}

export default AirtableSync;
