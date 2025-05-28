import React from 'react';
import {
  AdminActions
} from '@/components/HomePage';

/**
 * Page d'admin
 */
const AdminPage: React.FC = () => {
  return (
    <div className="relative w-full sm:px-3 md:px-4 py-4 sm:py-6 bg-gray-100 min-h-screen">

      <h1 className="text-3xl md:text-4xl font-bold mb-3 sm:mb-4 md:mb-5 text-primary">
        Admin
      </h1>

      <AdminActions />

    </div>
  );
};

export default AdminPage;
