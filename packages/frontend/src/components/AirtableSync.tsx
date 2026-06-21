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
  const [syncMessage, setSyncMessage] = useState<string>('');

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  // Build a human summary of what actually came in, e.g.
  // "lov_new : 218 lignes, 17 listes · Tables Sources : 396 lignes"
  const summariseStats = (stats: unknown): string => {
    if (!stats || typeof stats !== 'object') return '';
    return Object.entries(stats as Record<string, { records?: number; 'lov-tables'?: number }>)
      .map(([table, s]) => {
        const rows = `${s?.records ?? 0} ligne${(s?.records ?? 0) > 1 ? 's' : ''}`;
        const lists = s?.['lov-tables'] != null ? `, ${s['lov-tables']} listes` : '';
        return `${table} : ${rows}${lists}`;
      })
      .join(' · ');
  };

  const handleSync = async () => {
    if (!window.confirm("Voulez-vous synchroniser les données depuis Airtable ?")) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');
    try {
      const res = await api.post("/sync");
      // Invalider les caches pour forcer le rechargement des données Airtable :
      // les référentiels ET les listes de valeurs (LOV), sinon les popups LOV
      // continuent d'afficher l'ancien cache navigateur après la synchro.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['referentials'] }),
        queryClient.invalidateQueries({ queryKey: ['lov-new'] }),
      ]);
      setSyncMessage(summariseStats(res?.data?.stats));
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 8000);
    } catch (error) {
      // Surface the real backend error (POST /sync returns {error: {message ...}} on 500)
      // instead of a silent generic message, so a failing sync is diagnosable.
      const axiosErr = error as { response?: { data?: { error?: { message?: string } } } };
      const detail = axiosErr?.response?.data?.error?.message;
      console.error('Sync error:', error);
      setSyncMessage(detail ? `Échec : ${detail}` : '');
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 10000);
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
      {syncMessage && (
        <p className={`text-xs ${syncStatus === 'error' ? 'text-red-900' : 'text-green-900'}`}>
          {syncMessage}
        </p>
      )}
    </div>
  );
}

export default AirtableSync;
