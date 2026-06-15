import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
  CreateJournalPostInput,
  JournalPost,
  UpdateJournalPostInput,
} from "@/types/journal";

interface PostsResponse {
  posts: JournalPost[];
}

const POSTS_KEY = ["journal", "posts"] as const;

const fetchJournalPosts = async (): Promise<JournalPost[]> => {
  const { data } = await api.get<PostsResponse>("/journal/posts", {
    params: { limit: 100 },
  });
  return data.posts ?? [];
};

export const useJournalPosts = () =>
  useQuery({ queryKey: POSTS_KEY, queryFn: fetchJournalPosts });

export const useCreateJournalPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateJournalPostInput): Promise<JournalPost> => {
      const { data } = await api.post<JournalPost>("/journal/posts", input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POSTS_KEY }),
  });
};

export const useUpdateJournalPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateJournalPostInput;
    }): Promise<JournalPost> => {
      const { data } = await api.put<JournalPost>(`/journal/posts/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POSTS_KEY }),
  });
};

export const useDeleteJournalPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/journal/posts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POSTS_KEY }),
  });
};

export const useUploadJournalAttachments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, files }: { postId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const { data } = await api.post(
        `/journal/posts/${postId}/attachments`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POSTS_KEY }),
  });
};

export const useDeleteJournalAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(`/journal/attachments/${attachmentId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POSTS_KEY }),
  });
};
