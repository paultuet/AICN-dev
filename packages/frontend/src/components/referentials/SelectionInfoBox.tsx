import React from 'react';

const SelectionInfoBox: React.FC = () => {
  return (
    <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Mode sélection</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Cliquez sur un <span className="font-medium">nom de groupe</span> pour sélectionner tous les champs du groupe ou sur une <span className="font-medium">ligne</span> pour sélectionner un unique champ. Chaque conversation est liée soit à un groupe complet, soit à un champ individuel.
          </p>
          <div className="mt-2 flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                N
              </span>
              <span className="text-xs text-yellow-700">Indique une conversation de <strong>groupe</strong> avec N messages</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                N
              </span>
              <span className="text-xs text-yellow-700">Indique une conversation sur un <strong>champ spécifique</strong> avec N messages</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SelectionInfoBox);