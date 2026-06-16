import React, { useEffect, useState } from "react";
import { Button, Modal, SelectInput, TextInput } from "@/components/ui";
import RichTextEditor from "@/components/journal/RichTextEditor";
import {
  useCreateJournalPost,
  useUpdateJournalPost,
  useUploadJournalAttachments,
} from "@/hooks/useJournalPosts";
import { JournalPost } from "@/types/journal";
import { FILE_CATEGORIES } from "@/constants/fileCategories";
import { isHtmlEmpty, sanitizeHtml } from "@/utils/sanitizeHtml";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  post?: JournalPost | null;
}

const TAG_OPTIONS = FILE_CATEGORIES.map((c) => ({ value: c, label: c }));

const todayStr = () => new Date().toISOString().slice(0, 10);

const extractError = (e: unknown): string => {
  const err = e as { response?: { data?: { error?: string } }; message?: string };
  return err?.response?.data?.error || err?.message || "Une erreur est survenue.";
};

const JournalPostFormModal: React.FC<Props> = ({ isOpen, onClose, post }) => {
  const createMut = useCreateJournalPost();
  const updateMut = useUpdateJournalPost();
  const uploadMut = useUploadJournalAttachments();

  // Tracks the persisted post so a retry after a partial failure updates the
  // same record instead of creating a duplicate.
  const [savedPost, setSavedPost] = useState<JournalPost | null>(post ?? null);
  const [postDate, setPostDate] = useState("");
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSavedPost(post ?? null);
    setPostDate(post?.postDate ? String(post.postDate).slice(0, 10) : todayStr());
    setTitle(post?.title ?? "");
    setTag(post?.tag ?? "");
    setContent(post?.content ?? "");
    setFiles([]);
    setError(null);
    setWarning(null);
  }, [isOpen, post]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    setError(null);
    setWarning(null);

    if (!postDate || !title.trim() || !tag.trim() || isHtmlEmpty(content)) {
      setError("La date, le titre, le tag et le contenu sont obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        postDate,
        title: title.trim(),
        content: sanitizeHtml(content),
        tag: tag.trim(),
      };
      const persisted = savedPost
        ? await updateMut.mutateAsync({ id: savedPost.id, input: payload })
        : await createMut.mutateAsync(payload);
      setSavedPost(persisted);

      if (files.length > 0) {
        try {
          await uploadMut.mutateAsync({ postId: persisted.id, files });
        } catch {
          // Post is saved; only the attachments failed. Keep the modal open so
          // the admin can retry (savedPost is set → no duplicate post).
          setWarning(
            "Le post a été enregistré, mais l'envoi des pièces jointes a échoué. Vous pouvez réessayer.",
          );
          return;
        }
      }
      onClose();
    } catch (e) {
      setError(extractError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={post ? "Modifier le post" : "Nouveau post"}
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextInput
          label="Date"
          type="date"
          fullWidth
          value={postDate}
          onChange={(e) => setPostDate(e.target.value)}
        />

        <TextInput
          label="Titre"
          fullWidth
          value={title}
          placeholder="Titre du post"
          onChange={(e) => setTitle(e.target.value)}
        />

        <SelectInput
          label="Tag"
          fullWidth
          placeholder="Sélectionner un tag"
          value={tag}
          onChange={setTag}
          options={TAG_OPTIONS}
        />

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Contenu
          </label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Pièces jointes (optionnel)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFilesChange}
            className="block w-full text-sm text-ink-2 border border-hair rounded-lg cursor-pointer bg-panel-2 focus:outline-none"
            disabled={submitting}
          />
          {files.length > 0 && (
            <ul className="mt-2 text-sm text-ink-2 list-disc pl-5">
              {files.map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
            </ul>
          )}
          {post && (
            <p className="mt-1 text-xs text-ink-3">
              Les pièces jointes existantes se gèrent depuis la carte du post.
            </p>
          )}
        </div>

        {warning && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            {warning}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default JournalPostFormModal;
