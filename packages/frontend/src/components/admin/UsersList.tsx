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

  useEffect(() => {
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

    fetchUsers();
  }, []);

  const columns = [
    {
      key: 'name',
      header: 'Nom',
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'organization',
      header: 'Organisation',
    },
    {
      key: 'role',
      header: 'Rôle',
    },
    {
      key: 'email-verified',
      header: 'Email vérifié',
      render: (user: User) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user['email-verified']
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user['email-verified'] ? 'Vérifié' : 'Non vérifié'}
        </span>
      ),
    },
    {
      key: 'created-at',
      header: 'Date de création',
      render: (user: User) => {
        try {
          return new Date(user['created-at']).toLocaleDateString('fr-FR');
        } catch {
          return 'Date invalide';
        }
      },
    },
  ];

  console.log(users);

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
