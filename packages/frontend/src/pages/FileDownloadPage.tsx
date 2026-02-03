import React, { useState, useEffect } from 'react';
import { useIsAdmin } from '@/contexts/AuthContext';
import api from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const FILE_CATEGORIES = ['RIO', 'NMR', 'LoV', 'Documentation'] as const;
type FileCategory = typeof FILE_CATEGORIES[number];

interface FileInfo {
  id: string;
  fileName: string;
  title?: string;
  category?: string;
  version: string;
  uploadDate: string;
  fileSize: number;
}

interface FileUpload {
  file: File;
  title: string;
}

const FileDownloadPage: React.FC = () => {
  const isAdmin = useIsAdmin();
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [version, setVersion] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [category, setCategory] = useState<FileCategory | ''>('');
  const [allFiles, setAllFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAllFiles();
  }, []);

  const fetchAllFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/files');
      if (response.data && response.data.files) {
        setAllFiles(response.data.files);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError('Erreur lors de la récupération des fichiers');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        title: ''
      }));
      setFileUploads([...fileUploads, ...newFiles]);
    }
  };

  const handleTitleChange = (index: number, title: string) => {
    const updatedUploads = [...fileUploads];
    updatedUploads[index].title = title;
    setFileUploads(updatedUploads);
  };

  const handleRemoveFile = (index: number) => {
    const updatedUploads = fileUploads.filter((_, i) => i !== index);
    setFileUploads(updatedUploads);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fileUploads.length === 0 || !version || !uploadDate || !category) {
      setError('Veuillez remplir tous les champs et ajouter au moins un fichier');
      return;
    }

    // Vérifier que tous les fichiers ont un titre
    const missingTitles = fileUploads.some(fu => !fu.title.trim());
    if (missingTitles) {
      setError('Veuillez ajouter un titre pour chaque fichier');
      return;
    }

    setUploadLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();

    // Ajouter tous les fichiers et titres
    fileUploads.forEach((fu) => {
      formData.append('files', fu.file);
      formData.append('titles', fu.title);
    });

    formData.append('version', version);
    formData.append('uploadDate', uploadDate);
    formData.append('category', category);

    try {
      const response = await api.post('/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`${fileUploads.length} fichier(s) uploadé(s) avec succès`);

      // Rafraîchir la liste des fichiers
      await fetchAllFiles();

      // Reset form
      setFileUploads([]);
      setVersion('');
      setUploadDate('');
      setCategory('');

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload des fichiers');
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownload = async (file: FileInfo) => {
    try {
      const response = await api.get(`/file/download/${file.id}`, {
        responseType: 'blob',
      });

      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Erreur lors du téléchargement du fichier');
      console.error(err);
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le fichier "${file.title || file.fileName}" ?`)) {
      return;
    }

    try {
      await api.delete(`/file/delete/${file.id}`);
      setSuccess('Fichier supprimé avec succès');

      // Rafraîchir la liste des fichiers
      await fetchAllFiles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression du fichier');
      console.error(err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestion des fichiers</h1>

        {/* Admin Upload Form */}
        {isAdmin && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Uploader un nouveau fichier
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Fichiers
                </label>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  onChange={handleFilesChange}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  disabled={uploadLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Vous pouvez sélectionner plusieurs fichiers
                </p>
              </div>

              {/* Liste des fichiers sélectionnés avec leurs titres */}
              {fileUploads.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Fichiers à uploader ({fileUploads.length})
                  </h3>
                  {fileUploads.map((fileUpload, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-gray-900">{fileUpload.file.name}</p>
                        <input
                          type="text"
                          placeholder="Titre du fichier"
                          value={fileUpload.title}
                          onChange={(e) => handleTitleChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={uploadLoading}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="mt-1 text-red-600 hover:text-red-800"
                        disabled={uploadLoading}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FileCategory)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={uploadLoading}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {FILE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  id="version"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="ex: 1.0.0"
                  disabled={uploadLoading}
                />
              </div>

              <div>
                <label htmlFor="upload-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'upload
                </label>
                <input
                  id="upload-date"
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={uploadLoading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={uploadLoading || fileUploads.length === 0}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadLoading ? 'Upload en cours...' : `Uploader ${fileUploads.length > 0 ? `(${fileUploads.length})` : ''}`}
              </button>
            </form>
          </div>
        )}

        {/* Files List Display */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Fichiers disponibles au téléchargement
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : allFiles.length > 0 ? (
            <div className="space-y-6">
              {/* Grouper les fichiers par catégorie */}
              {[...FILE_CATEGORIES, 'Sans catégorie'].map((cat) => {
                const categoryFiles = allFiles.filter((file) =>
                  cat === 'Sans catégorie'
                    ? !file.category
                    : file.category === cat
                );

                if (categoryFiles.length === 0) return null;

                return (
                  <div key={cat} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      {cat} ({categoryFiles.length})
                    </h3>
                    {categoryFiles.map((file) => (
                      <div key={file.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            {file.title && (
                              <h4 className="text-base font-semibold text-gray-900">{file.title}</h4>
                            )}
                            <p className="font-medium text-gray-700">{file.fileName}</p>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Version: {file.version}</p>
                              <p>
                                Date d'upload:{' '}
                                {format(new Date(file.uploadDate), 'dd MMMM yyyy', { locale: fr })}
                              </p>
                              <p>Taille: {formatFileSize(file.fileSize)}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(file)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Télécharger
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(file)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Aucun fichier disponible pour le moment
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileDownloadPage;
