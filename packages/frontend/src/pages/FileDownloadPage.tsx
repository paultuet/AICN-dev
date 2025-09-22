import React, { useState, useEffect } from 'react';
import { useIsAdmin } from '@/contexts/AuthContext';
import api from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FileInfo {
  id: string;
  fileName: string;
  version: string;
  uploadDate: string;
  fileSize: number;
}

const FileDownloadPage: React.FC = () => {
  const isAdmin = useIsAdmin();
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentFile();
  }, []);

  const fetchCurrentFile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/file/current');
      if (response.data) {
        setCurrentFile(response.data);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError('Erreur lors de la récupération du fichier');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !version || !uploadDate) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setUploadLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);
    formData.append('uploadDate', uploadDate);

    try {
      const response = await api.post('/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Fichier uploadé avec succès');
      setCurrentFile(response.data);

      // Reset form
      setFile(null);
      setVersion('');
      setUploadDate('');

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload du fichier');
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentFile) return;

    try {
      const response = await api.get(`/file/download/${currentFile.id}`, {
        responseType: 'blob',
      });

      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', currentFile.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Erreur lors du téléchargement du fichier');
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
                  Fichier
                </label>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  disabled={uploadLoading}
                />
                {file && (
                  <p className="mt-1 text-sm text-gray-500">
                    Fichier sélectionné: {file.name}
                  </p>
                )}
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
                disabled={uploadLoading || !file}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadLoading ? 'Upload en cours...' : 'Uploader le fichier'}
              </button>
            </form>

            {currentFile && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ Attention: L'upload d'un nouveau fichier remplacera le fichier actuel
                </p>
              </div>
            )}
          </div>
        )}

        {/* Current File Display */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Fichier disponible au téléchargement
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : currentFile ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{currentFile.fileName}</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Version: {currentFile.version}</p>
                      <p>
                        Date d'upload:{' '}
                        {format(new Date(currentFile.uploadDate), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                      <p>Taille: {formatFileSize(currentFile.fileSize)}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Télécharger
                  </button>
                </div>
              </div>
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
