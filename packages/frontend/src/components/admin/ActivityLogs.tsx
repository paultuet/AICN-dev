import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  timestamp: string;
  type: string;
  user_email: string | null;
  user_name: string | null;
  user_id: string | null;
  message: string;
  details: Record<string, any>;
}

interface ActivityStats {
  total: number;
  'last-24h': number;
  'last-7d': number;
  'last-30d': number;
  'by-type': Record<string, number>;
  'unique-users': number;
}

interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
  stats: ActivityStats;
}

const PAGE_SIZE = 100;

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterEmail, setFilterEmail] = useState<string>('');
  const [page, setPage] = useState<number>(0);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      };
      if (filterType) params.type = filterType;
      if (filterEmail) params['user-email'] = filterEmail;

      const response = await api.get('/admin/activity-logs', { params });

      const data: ActivityLogsResponse = response.data;
      setLogs(data.logs);
      setTotal(data.total);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterType, filterEmail, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filterType, filterEmail]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startIndex = page * PAGE_SIZE + 1;
  const endIndex = Math.min((page + 1) * PAGE_SIZE, total);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'login-success': 'Connexion réussie',
      'login-failed': 'Échec connexion',
      'conversation-created': 'Conversation créée',
      'message-sent': 'Message envoyé',
      'file-uploaded': 'Fichier uploadé',
      'file-deleted': 'Fichier supprimé'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'login-success': 'text-green-600 bg-green-50',
      'login-failed': 'text-red-600 bg-red-50',
      'conversation-created': 'text-blue-600 bg-blue-50',
      'message-sent': 'text-purple-600 bg-purple-50',
      'file-uploaded': 'text-teal-600 bg-teal-50',
      'file-deleted': 'text-orange-600 bg-orange-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  const [exporting, setExporting] = useState(false);

  const exportToCSV = async () => {
    setExporting(true);
    try {
      // Fetch last 1000 logs with current filters
      const params: any = {
        limit: 1000,
        offset: 0
      };
      if (filterType) params.type = filterType;
      if (filterEmail) params['user-email'] = filterEmail;

      const response = await api.get('/admin/activity-logs', { params });
      const exportLogs: ActivityLog[] = response.data.logs;

      const headers = ['Date/Heure', 'Type', 'Utilisateur', 'Email', 'Message', 'Détails'];
      const rows = exportLogs.map(log => [
        format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr }),
        getTypeLabel(log.type),
        log.user_name || '-',
        log.user_email || '-',
        log.message,
        JSON.stringify(log.details)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  if (loading && page === 0) return <div className="text-center py-4">Chargement des logs...</div>;
  if (error) return <div className="text-red-600 text-center py-4">Erreur: {error}</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Logs d'activité</h2>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">24h</div>
              <div className="text-xl font-bold">{stats['last-24h']}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">7 jours</div>
              <div className="text-xl font-bold">{stats['last-7d']}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Utilisateurs uniques</div>
              <div className="text-xl font-bold">{stats['unique-users']}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous les types</option>
            <option value="login-success">Connexions réussies</option>
            <option value="login-failed">Échecs de connexion</option>
            <option value="conversation-created">Conversations créées</option>
            <option value="message-sent">Messages envoyés</option>
            <option value="file-uploaded">Fichiers uploadés</option>
            <option value="file-deleted">Fichiers supprimés</option>
          </select>

          <input
            type="email"
            placeholder="Filtrer par email..."
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="ml-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Export en cours...' : 'Exporter CSV (1000 derniers)'}
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                Date/Heure
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                Utilisateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">
                Message
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">
                Détails
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                      {getTypeLabel(log.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>{log.user_name || '-'}</div>
                    <div className="text-xs text-gray-500">{log.user_email || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 truncate" title={log.message}>
                    {log.message}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {log.details && (
                      <details className="cursor-pointer">
                        <summary>Voir détails</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && logs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun log trouvé
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-700">
            Affichage de <span className="font-medium">{startIndex}</span> à{' '}
            <span className="font-medium">{endIndex}</span> sur{' '}
            <span className="font-medium">{total}</span> résultats
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Début
            </button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Fin
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
