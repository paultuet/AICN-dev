import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

const fetchJournalTags = async (): Promise<string[]> => {
  const { data } = await api.get<string[]>("/journal/tags");
  return Array.isArray(data) ? data : [];
};

export const useJournalTags = () =>
  useQuery({
    queryKey: ["journal", "tags"],
    queryFn: fetchJournalTags,
    staleTime: 5 * 60 * 1000,
  });
