import React, { useState } from 'react';

interface ConversationFormProps {
  initialTitle?: string;
  onCreateConversation: (title: string) => void;
  onClearSelection: () => void;
}

const ConversationForm: React.FC<ConversationFormProps> = ({ 
  initialTitle = '',
  onCreateConversation,
  onClearSelection 
}) => {
  // État local du formulaire pour isoler complètement les re-rendus
  const [localTitle, setLocalTitle] = useState(initialTitle);
  
  // Gestionnaires d'événements isolés
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
  };
  
  const handleCreateClick = () => {
    onCreateConversation(localTitle);
    setLocalTitle('');
  };
  
  const handleClearClick = () => {
    setLocalTitle('');
    onClearSelection();
  };

  // Empêcher la propagation des clics
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div
      className="border-t border-gray-400 pt-4"
      onClick={stopPropagation}
    >
      <div className="mb-4">
        <label htmlFor="conversation-title" className="block text-sm font-medium text-gray-700 mb-1">
          Titre de la nouvelle conversation
        </label>
        <input
          type="text"
          id="conversation-title"
          className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-400 rounded-md p-2 border"
          placeholder="Entrez un titre pour cette conversation"
          value={localTitle}
          onChange={handleTitleChange}
          onClick={stopPropagation}
        />
      </div>
      
      <div className="flex space-x-3">
        <button
          className="flex-1 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          onClick={handleCreateClick}
          disabled={!localTitle.trim()}
        >
          Créer une nouvelle conversation
        </button>
        <button
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          onClick={handleClearClick}
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default React.memo(ConversationForm);