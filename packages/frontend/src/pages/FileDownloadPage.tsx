import React, { useState, useEffect } from "react";
import { useIsAdmin } from "@/contexts/AuthContext";
import api from "@/services/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Button,
  Panel,
  PageHead,
  SectionRule,
  Eyebrow,
  LoadingSpinner,
} from "@/components/ui";
import { Upload, Download, Trash2, X, Tag, Calendar, HardDrive } from "lucide-react";

const FILE_CATEGORIES = [
  "Documentation Générale",
  "Nomenclature des missions et responsabilités AM<>PM",
  "RIO - Inventaires d’équipements",
  "RIO - Inventaires d’espaces",
  "RIO - Inventaires de contrats",
  "RIO - Inventaires de tiers",
  "RIO - Inventaires de systèmes",
  "RIO - Plans de comptage électriques",
  "RIO - PPAT",
  "RIO - Rapports d’observations de bureaux de contrôle",
  "RIO - Historiques de consommation énergétique",
] as const;
type FileCategory = (typeof FILE_CATEGORIES)[number];

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
  const [version, setVersion] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [category, setCategory] = useState<FileCategory | "">("");
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
      const response = await api.get("/files");
      if (response.data && response.data.files) {
        setAllFiles(response.data.files);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError("Erreur lors de la récupération des fichiers");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        title: "",
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
      setError(
        "Veuillez remplir tous les champs et ajouter au moins un fichier",
      );
      return;
    }

    // Vérifier que tous les fichiers ont un titre
    const missingTitles = fileUploads.some((fu) => !fu.title.trim());
    if (missingTitles) {
      setError("Veuillez ajouter un titre pour chaque fichier");
      return;
    }

    setUploadLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();

    // Ajouter tous les fichiers et titres
    fileUploads.forEach((fu) => {
      formData.append("files", fu.file);
      formData.append("titles", fu.title);
    });

    formData.append("version", version);
    formData.append("uploadDate", uploadDate);
    formData.append("category", category);

    try {
      const response = await api.post("/file/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(`${fileUploads.length} fichier(s) uploadé(s) avec succès`);

      // Rafraîchir la liste des fichiers
      await fetchAllFiles();

      // Reset form
      setFileUploads([]);
      setVersion("");
      setUploadDate("");
      setCategory("");

      // Reset file input
      const fileInput = document.getElementById(
        "file-input",
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors de l'upload des fichiers",
      );
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownload = async (file: FileInfo) => {
    try {
      const response = await api.get(`/file/download/${file.id}`, {
        responseType: "blob",
      });

      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Erreur lors du téléchargement du fichier");
      console.error(err);
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer le fichier "${file.title || file.fileName}" ?`,
      )
    ) {
      return;
    }

    try {
      await api.delete(`/file/delete/${file.id}`);
      setSuccess("Fichier supprimé avec succès");

      // Rafraîchir la liste des fichiers
      await fetchAllFiles();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la suppression du fichier",
      );
      console.error(err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const totalFiles = allFiles.length;

  return (
    <div className="view relative w-full max-w-[1480px] mx-auto px-5 md:px-7 py-8 pb-20 min-h-screen">
      <PageHead
        eyebrow="Gestion documentaire"
        title="Fichiers"
        sub="Déposez et partagez les livrables du projet : modèles de données, dictionnaires, notes et inventaires."
        stats={[{ value: totalFiles, label: "Fichiers" }]}
      />

      <div className={`grid gap-6 items-start ${isAdmin ? "lg:grid-cols-[380px_1fr]" : ""}`}>
        {/* Admin Upload Form */}
        {isAdmin && (
          <Panel ticks padded className="lg:sticky lg:top-[84px]">
            <SectionRule icon={<Upload size={16} />}>Nouveau dépôt</SectionRule>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Eyebrow className="mb-1.5">Fichiers</Eyebrow>
                <label
                  htmlFor="file-input"
                  className="block border border-dashed border-hair-strong rounded-lg p-5 text-center cursor-pointer hover:border-brand hover:bg-accent-soft transition-colors"
                >
                  <Upload className="mx-auto text-ink-3 mb-2" size={22} />
                  <div className="text-sm text-ink-2">Glisser des fichiers ici ou cliquer pour parcourir</div>
                  <div className="text-xs text-ink-4 mt-1">plusieurs fichiers acceptés</div>
                </label>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  onChange={handleFilesChange}
                  className="hidden"
                  disabled={uploadLoading}
                />
              </div>

              {/* Liste des fichiers sélectionnés avec leurs titres */}
              {fileUploads.length > 0 && (
                <div className="space-y-3">
                  <Eyebrow>Fichiers à uploader ({fileUploads.length})</Eyebrow>
                  {fileUploads.map((fileUpload, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-start p-3 bg-panel-2 border border-hair rounded-lg"
                    >
                      <div className="flex-1 space-y-2 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {fileUpload.file.name}
                        </p>
                        <input
                          type="text"
                          placeholder="Titre du fichier"
                          value={fileUpload.title}
                          onChange={(e) => handleTitleChange(index, e.target.value)}
                          className="w-full px-3 py-2 bg-panel border border-hair rounded-md text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-accent-soft"
                          disabled={uploadLoading}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="mt-1 text-ink-3 hover:text-danger transition-colors"
                        disabled={uploadLoading}
                        aria-label="Retirer le fichier"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Eyebrow className="mb-1.5">Catégorie</Eyebrow>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FileCategory)}
                  className="block w-full px-3 py-2 bg-panel-2 border border-hair rounded-lg text-sm text-ink focus:outline-none focus:border-brand focus:bg-panel focus:ring-[3px] focus:ring-accent-soft"
                  disabled={uploadLoading}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {FILE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Eyebrow className="mb-1.5">Version</Eyebrow>
                <input
                  id="version"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="block w-full px-3 py-2 bg-panel-2 border border-hair rounded-lg text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand focus:bg-panel focus:ring-[3px] focus:ring-accent-soft"
                  placeholder="ex : 1.0.0"
                  disabled={uploadLoading}
                />
              </div>

              <div>
                <Eyebrow className="mb-1.5">Date d'upload</Eyebrow>
                <input
                  id="upload-date"
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="block w-full px-3 py-2 bg-panel-2 border border-hair rounded-lg text-sm text-ink focus:outline-none focus:border-brand focus:bg-panel focus:ring-[3px] focus:ring-accent-soft"
                  disabled={uploadLoading}
                />
              </div>

              {error && (
                <div className="bg-danger-soft border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-panel-2 border border-ok/30 text-ok px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={uploadLoading}
                disabled={uploadLoading || fileUploads.length === 0}
                icon={<Upload size={16} />}
              >
                {uploadLoading
                  ? "Upload en cours…"
                  : `Uploader ${fileUploads.length > 0 ? `(${fileUploads.length})` : ""}`}
              </Button>
            </form>
          </Panel>
        )}

        {/* Files List Display */}
        <div className="min-w-0">
          <SectionRule>
            <Eyebrow>Fichiers disponibles au téléchargement</Eyebrow>
          </SectionRule>

          {loading ? (
            <LoadingSpinner size="lg" className="py-10" />
          ) : allFiles.length > 0 ? (
            <div className="space-y-7">
              {/* Grouper les fichiers par catégorie */}
              {[...FILE_CATEGORIES, "Sans catégorie"].map((cat) => {
                const categoryFiles = allFiles.filter((file) =>
                  cat === "Sans catégorie" ? !file.category : file.category === cat,
                );

                if (categoryFiles.length === 0) return null;

                return (
                  <div key={cat} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink">{cat}</span>
                      <span className="font-mono text-xs text-ink-3">{categoryFiles.length}</span>
                      <span className="flex-1 h-px bg-hair" />
                    </div>
                    {categoryFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-start justify-between gap-4 border border-hair rounded-xl bg-panel p-4 hover:shadow-panel transition-shadow"
                      >
                        <div className="min-w-0 space-y-1">
                          {file.title && (
                            <h4 className="text-[15px] font-semibold text-ink break-words">
                              {file.title}
                            </h4>
                          )}
                          <p className="font-mono text-[13px] text-ink-2 break-all">
                            {file.fileName}
                          </p>
                          <div className="flex flex-wrap gap-4 pt-1 text-xs text-ink-3 font-mono">
                            <span className="inline-flex items-center gap-1">
                              <Tag size={13} /> {file.version}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={13} />{" "}
                              {format(new Date(file.uploadDate), "dd MMM yyyy", { locale: fr })}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <HardDrive size={13} /> {formatFileSize(file.fileSize)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Download size={15} />}
                            onClick={() => handleDownload(file)}
                          >
                            Télécharger
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(file)}
                              aria-label="Supprimer"
                            >
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty">Aucun fichier disponible pour le moment</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileDownloadPage;
