import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { LovNewEntry } from '@/types/referential';

const fetchLovNew = async (): Promise<LovNewEntry[]> => {
  const response = await api.get<LovNewEntry[]>('/lov-new');
  return response.data;
};

export const useLovNew = () => {
  return useQuery({
    queryKey: ['lov-new'],
    queryFn: fetchLovNew,
    staleTime: 10 * 60 * 1000,
  });
};
