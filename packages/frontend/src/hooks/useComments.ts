import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { fetchCommentCounts, fetchCommentsForTarget, addComment as addCommentApi } from '@/services/commentApi';
import type { Comment, CommentCount } from '@/types/comment';

export const useCommentCounts = () => {
  const { data: counts = [], isLoading } = useQuery<CommentCount[]>({
    queryKey: ['comment-counts'],
    queryFn: fetchCommentCounts,
    staleTime: 30_000,
  });

  const countsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of counts) {
      map.set(`${c.targetType}:${c.targetId}`, c.count);
    }
    return map;
  }, [counts]);

  const getCommentCount = useCallback(
    (targetType: string, targetId: string): number => {
      return countsMap.get(`${targetType}:${targetId}`) ?? 0;
    },
    [countsMap]
  );

  return { counts, countsMap, getCommentCount, isLoading };
};

export const useCommentsForTarget = (targetType: string, targetId: string, enabled: boolean) => {
  return useQuery<Comment[]>({
    queryKey: ['comments', targetType, targetId],
    queryFn: () => fetchCommentsForTarget(targetType, targetId),
    enabled,
    staleTime: 10_000,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetType, targetId, content }: { targetType: string; targetId: string; content: string }) =>
      addCommentApi(targetType, targetId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.targetType, variables.targetId] });
      queryClient.invalidateQueries({ queryKey: ['comment-counts'] });
    },
  });
};
