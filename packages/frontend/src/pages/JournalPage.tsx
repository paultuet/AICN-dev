import React, { Suspense, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useIsAdmin } from "@/contexts/AuthContext";
import api from "@/services/api";
import {
  Badge,
  Button,
  Card,
  ErrorMessage,
  LoadingSpinner,
  SearchBar,
} from "@/components/ui";
import {
  useDeleteJournalAttachment,
  useDeleteJournalPost,
  useJournalPosts,
} from "@/hooks/useJournalPosts";
import { useJournalTags } from "@/hooks/useJournalTags";
import { JournalAttachment, JournalPost } from "@/types/journal";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

const JournalPostFormModal = React.lazy(
  () => import("@/components/journal/JournalPostFormModal"),
);

const formatFileSize = (bytes: number): string => {
  if (!bytes) return "0 o";
  const k = 1024;
  const sizes = ["o", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const formatDate = (d: string): string => {
  try {
    return format(new Date(d), "dd MMMM yyyy", { locale: fr });
  } catch {
    return d;
  }
};

const JournalPage: React.FC = () => {
  const isAdmin = useIsAdmin();
  const { data: posts = [], isLoading, error } = useJournalPosts();
  const { data: tags = [] } = useJournalTags();
  const deletePostMut = useDeleteJournalPost();
  const deleteAttMut = useDeleteJournalAttachment();

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JournalPost | null>(null);

  // Union of the synced vocabulary with tags actually present on posts, so a tag
  // renamed/removed in Airtable still remains a usable filter for old posts.
  const tagOptions = useMemo(() => {
    const set = new Set<string>(tags);
    posts.forEach((p) => p.tag && set.add(p.tag));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [tags, posts]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (selectedTag && p.tag !== selectedTag) return false;
      if (q) {
        const text = `${p.title} ${p.content.replace(/<[^>]*>/g, " ")}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [posts, selectedTag, search]);

  const handleDownload = async (att: JournalAttachment) => {
    try {
      const res = await api.get(`/journal/attachments/${att.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", att.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.alert("Erreur lors du téléchargement de la pièce jointe.");
    }
  };

  const handleDeletePost = (post: JournalPost) => {
    if (window.confirm(`Supprimer le post « ${post.title} » ?`)) {
      deletePostMut.mutate(post.id);
    }
  };

  const handleDeleteAttachment = (att: JournalAttachment) => {
    if (window.confirm(`Supprimer la pièce jointe « ${att.fileName} » ?`)) {
      deleteAttMut.mutate(att.id);
    }
  };

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (post: JournalPost) => {
    setEditing(post);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Journal</h1>
          {isAdmin && (
            <Button variant="secondary" onClick={openNew}>
              Nouveau post
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6 space-y-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Rechercher dans les posts..."
          />
          {tagOptions.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <button type="button" onClick={() => setSelectedTag(null)}>
                <Badge color={selectedTag === null ? "orange" : "gray"} pill>
                  Tous
                </Badge>
              </button>
              {tagOptions.map((t) => (
                <button key={t} type="button" onClick={() => setSelectedTag(t)}>
                  <Badge color={selectedTag === t ? "orange" : "gray"} pill>
                    {t}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <LoadingSpinner className="py-12" />
        ) : error ? (
          <ErrorMessage message="Erreur lors du chargement des posts." />
        ) : filteredPosts.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            {posts.length === 0
              ? "Aucune publication pour le moment."
              : "Aucun post ne correspond à votre recherche."}
          </p>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <Card key={post.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="text-sm text-gray-500">
                        {formatDate(post.postDate)}
                      </span>
                      {post.tag && <Badge color="indigo" pill>{post.tag}</Badge>}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 break-words">
                      {post.title}
                    </h2>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(post)}>
                        Modifier
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeletePost(post)}>
                        Supprimer
                      </Button>
                    </div>
                  )}
                </div>

                <div
                  className="journal-content mt-4 text-gray-800"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                />

                {post.attachments.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-3 space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Pièces jointes
                    </h3>
                    {post.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <button
                          type="button"
                          onClick={() => handleDownload(att)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline truncate text-left"
                        >
                          {att.fileName}{" "}
                          <span className="text-gray-400">
                            ({formatFileSize(att.fileSize)})
                          </span>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att)}
                            className="text-red-600 hover:text-red-800 shrink-0"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {isAdmin && modalOpen && (
        <Suspense fallback={null}>
          <JournalPostFormModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            post={editing}
            tags={tags}
          />
        </Suspense>
      )}
    </div>
  );
};

export default JournalPage;
