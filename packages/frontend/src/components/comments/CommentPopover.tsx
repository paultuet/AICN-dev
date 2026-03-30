import React, { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useCommentCounts, useCommentsForTarget, useAddComment } from "@/hooks/useComments";

interface CommentPopoverProps {
  targetType: "entity" | "field";
  targetId: string;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const CommentPopover: React.FC<CommentPopoverProps> = ({ targetType, targetId }) => {
  const [open, setOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { getCommentCount } = useCommentCounts();
  const { data: comments = [], isLoading } = useCommentsForTarget(targetType, targetId, open);
  const { mutate: addComment, isPending: isAdding } = useAddComment();

  const count = getCommentCount(targetType, targetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    addComment(
      { targetType, targetId, content: trimmed },
      { onSuccess: () => setNewComment("") }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 cursor-pointer group"
          title="Commentaires"
        >
          <MessageSquareText
            className={`h-4 w-4 transition-colors duration-200 ${
              count > 0
                ? "text-blue-600"
                : "text-gray-400 group-hover:text-blue-500"
            }`}
          />
          {count > 0 && (
            <span className="text-xs font-medium text-blue-700 bg-blue-100 rounded-full px-1.5 min-w-[1.25rem] text-center">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900">
            Commentaires {count > 0 && <span className="text-gray-400 font-normal">({count})</span>}
          </h4>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-400">Chargement...</div>
          ) : comments.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">Aucun commentaire</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {comments.map((comment) => (
                <div key={comment.id} className="px-3 py-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-gray-700">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex justify-end mt-1">
            <button
              type="submit"
              disabled={isAdding || !newComment.trim()}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? "..." : "Envoyer"}
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};

export default CommentPopover;
