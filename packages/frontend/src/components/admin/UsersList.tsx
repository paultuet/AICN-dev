import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Table } from '../ui';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import api from '../../services/api';

interface UsersListProps {
  className?: string;
}

export const UsersList: React.FC<UsersListProps> = ({ className = '' }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/users');
      const sortedUsers = response.data.sort((a: User, b: User) =>
        new Date(b['created-at']).getTime() - new Date(a['created-at']).getTime()
      );
      setUsers(sortedUsers);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      setApprovingId(userId);
      await api.post(`/admin/users/${userId}/approve`);
      await fetchUsers();
    } catch (err) {
      console.error('Error approving user:', err);
      setError("Erreur lors de l'approbation de l'utilisateur");
    } finally {
      setApprovingId(null);
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user['email-verified']) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Email non vérifié
        </span>
      );
    }
    if (!user.approved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          En attente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Approuvé
      </span>
    );
  };

  const columns = [
    {
      key: 'name',
      header: 'Nom',
      width: '[18%]',
    },
    {
      key: 'email',
      header: 'Email',
      width: '[22%]',
    },
    {
      key: 'organization',
      header: 'Organisation',
      width: '[18%]',
    },
    {
      key: 'role',
      header: 'Rôle',
      width: '[10%]',
    },
    {
      key: 'status',
      header: 'Statut',
      width: '[10%]',
      render: (user: User) => getStatusBadge(user),
    },
    {
      key: 'created-at',
      header: 'Date de création',
      width: '[12%]',
      render: (user: User) => {
        try {
          return new Date(user['created-at']).toLocaleDateString('fr-FR');
        } catch {
          return 'Date invalide';
        }
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '[10%]',
      render: (user: User) => {
        if (user['email-verified'] && !user.approved) {
          return (
            <button
              onClick={() => handleApprove(user.id)}
              disabled={approvingId === user.id}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {approvingId === user.id ? 'Approbation...' : 'Approuver'}
            </button>
          );
        }
        return null;
      },
    },
  ];

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Utilisateurs ({users.length})
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Liste de tous les utilisateurs enregistrés
        </p>
      </div>

      <Table
        data={users}
        columns={columns}
        className="w-full"
      />
    </div>
  );
};
