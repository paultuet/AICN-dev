import api from './api';

export interface FeatureFlag {
  id: number;
  name: string;
  description: string | null;
  enabled: boolean;
  percentage: number | null;
  created_at: string;
  updated_at: string;
}

const featureFlagsService = {
  /**
   * Fetch all feature flags from the API
   */
  getAll: async (): Promise<FeatureFlag[]> => {
    const response = await api.get('/feature-flags');
    return response.data;
  }
};

export default featureFlagsService;