import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Entity } from '@/types/referential';

interface ReferentialsResponse {
  NMR?: Entity[];
  LoV?: Entity[];
  RIO?: Entity[];
}

const fetchReferentials = async (): Promise<Entity[]> => {
  const response = await api.get<ReferentialsResponse>('/referentiels');
  const data = response.data;
  
  if (data && typeof data === 'object') {
    const allReferentials: Entity[] = [];
    const types = ['NMR', 'LoV', 'RIO'] as const;
    
    for (const type of types) {
      if (Array.isArray(data[type])) {
        const referentialsWithType = data[type]!.map(ref => ({
          ...ref,
          type
        }));
        allReferentials.push(...referentialsWithType);
      }
    }
    
    return allReferentials;
  }
  
  throw new Error('Format de données inattendu du serveur');
};

export const useReferentials = () => {
  return useQuery({
    queryKey: ['referentials'],
    queryFn: fetchReferentials,
    // staleTime: 10 * 60 * 1000, // 10 minutes - les référentiels changent peu
    // gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useReferentialsByType = (type: 'NMR' | 'LoV' | 'RIO') => {
  return useQuery({
    queryKey: ['referentials', type],
    queryFn: async () => {
      const allReferentials = await fetchReferentials();
      return allReferentials.filter(ref => ref.type === type);
    },
    // staleTime: 10 * 60 * 1000,
    // gcTime: 30 * 60 * 1000,
  });
};
