import React, { useState } from 'react';
import {
  AdminActions
} from '@/components/HomePage';
import { UsersList } from '../components/admin/UsersList';
import { ActivityLogs } from '../components/admin/ActivityLogs';

/**
 * Page d'admin
 */
const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');

  return (
    <div className="relative w-full sm:px-3 md:px-4 py-4 sm:py-6 bg-gray-100 min-h-screen">

      <h1 className="text-3xl md:text-4xl font-bold mb-3 sm:mb-4 md:mb-5 text-primary">
        Admin
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Logs d'activité
          </button>
        </nav>
      </div>

      {/* <AdminActions /> */}

      <div className="mt-8">
        {activeTab === 'users' && <UsersList />}
        {activeTab === 'logs' && <ActivityLogs />}
      </div>

    </div>
  );
};

export default AdminPage;
