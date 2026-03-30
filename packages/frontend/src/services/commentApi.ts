import api from '@/services/api';
import type { Comment, CommentCount } from '@/types/comment';

export const fetchCommentCounts = async (): Promise<CommentCount[]> => {
  const res = await api.get<{ counts: CommentCount[] }>('/comments/counts');
  return res.data.counts;
};

export const fetchCommentsForTarget = async (
  targetType: string,
  targetId: string
): Promise<Comment[]> => {
  const res = await api.get<{ comments: Comment[] }>(
    `/comments/${targetType}/${encodeURIComponent(targetId)}`
  );
  return res.data.comments;
};

export const addComment = async (
  targetType: string,
  targetId: string,
  content: string
): Promise<Comment> => {
  const res = await api.post<Comment>('/comments', {
    targetType,
    targetId,
    content,
  });
  return res.data;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
};
