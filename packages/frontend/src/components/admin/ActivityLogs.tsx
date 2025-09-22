import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  timestamp: string;
  type: string;
  'user-email': string | null;
  'user-name': string | null;
  'user-id': string | null;
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
  stats: ActivityStats;
}

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterEmail, setFilterEmail] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        limit: 100
      };
      if (filterType) params.type = filterType;
      if (filterEmail) params['user-email'] = filterEmail;

      const response = await api.get('/admin/activity-logs', { params });

      const data: ActivityLogsResponse = response.data;
      setLogs(data.logs);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterType, filterEmail]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'login-success': '✅ Connexion réussie',
      'login-failed': '❌ Échec connexion',
      'conversation-created': '💬 Conversation créée',
      'message-sent': '📝 Message envoyé'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'login-success': 'text-green-600 bg-green-50',
      'login-failed': 'text-red-600 bg-red-50',
      'conversation-created': 'text-blue-600 bg-blue-50',
      'message-sent': 'text-purple-600 bg-purple-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  const exportToCSV = () => {
    const headers = ['Date/Heure', 'Type', 'Utilisateur', 'Email', 'Message', 'Détails'];
    const rows = logs.map(log => [
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr }),
      getTypeLabel(log.type),
      log['user-name'] || '-',
      log['user-email'] || '-',
      log.message,
      JSON.stringify(log.details)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center py-4">Chargement des logs...</div>;
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
        <div className="flex gap-4 mb-4">
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
            className="ml-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date/Heure
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Détails
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
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
                  <div>{log['user-name'] || '-'}</div>
                  <div className="text-xs text-gray-500">{log['user-email'] || '-'}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
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
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun log trouvé
          </div>
        )}
      </div>
    </div>
  );
};
