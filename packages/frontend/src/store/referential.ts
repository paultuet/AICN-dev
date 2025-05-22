import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Entity } from '@/types/referential';
import api from '@/services/api';

// Interface pour l'état global des référentiels
interface ReferentialState {
  // État
  referentials: Entity[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchReferentials: () => Promise<void>;
  setReferentials: (referentials: Entity[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Créer le store avec Zustand
export const useReferentialStore = create<ReferentialState>()(
  // Utiliser le middleware persist pour sauvegarder l'état dans le localStorage
  persist(
    (set, get) => ({
      // État initial
      referentials: [],
      loading: false,
      error: null,

      // Actions
      fetchReferentials: async () => {
        try {
          set({ loading: true, error: null });
          
          // Récupérer les données depuis l'API
          const response = await api.get('/referentiels');

          // Vérifier si la réponse est dans le format attendu (nouveau format avec types)
          const data = response.data;
          if (data && typeof data === 'object') {
            // Extraire et fusionner les référentiels par type (NMR, LoV, RIO)
            const allReferentials: Entity[] = [];
            const types = ['NMR', 'LoV', 'RIO'];
            
            for (const type of types) {
              if (Array.isArray(data[type])) {
                // Ajouter le type à chaque référentiel extrait
                const referentialsWithType = data[type].map(ref => ({
                  ...ref,
                  type // S'assurer que chaque référentiel a son type
                }));
                allReferentials.push(...referentialsWithType);
              }
            }
            
            set({ referentials: allReferentials, loading: false });
          } else {
            set({ error: 'Format de données inattendu du serveur', loading: false });
          }
        } catch (err) {
          console.error('Error fetching referentials:', err);
          set({ error: 'Une erreur est survenue lors du chargement des référentiels', loading: false });
        }
      },
      
      setReferentials: (referentials) => set({ referentials }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'referential-storage', // Nom du stockage dans le localStorage
      partialize: (state) => ({
        referentials: state.referentials,
        // Ne pas persister les éléments transitoires
        // loading: false,
        // error: null
      }),
    }
  )
);

export default useReferentialStore;