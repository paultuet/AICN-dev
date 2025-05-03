import React, { createContext, useContext, useEffect, useState } from 'react';
import featureFlagsService, { FeatureFlag } from '@/services/featureFlags';

interface FeatureFlagsContextType {
  /**
   * Record of feature flags indexed by name
   */
  flags: Record<string, FeatureFlag>;
  
  /**
   * Check if a feature flag is enabled
   * @param name - The name of the feature flag
   * @param defaultValue - Default value if the flag doesn't exist (defaults to false)
   */
  isFeatureEnabled: (name: string, defaultValue?: boolean) => boolean;
  
  /**
   * Refresh feature flags from the API
   */
  refreshFlags: () => Promise<void>;
  
  /**
   * Loading state
   */
  loading: boolean;
  
  /**
   * Error state
   */
  error: string | null;
}

// Create the context with default values
const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

/**
 * Custom hook to use the FeatureFlagsContext
 */
export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  
  return context;
};

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for feature flags
 */
export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  // State
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Check if a feature flag is enabled
   */
  const isFeatureEnabled = (name: string, defaultValue = false): boolean => {
    // Get the flag
    const flag = flags[name];
    
    // If the flag doesn't exist, return the default value
    if (!flag) {
      return defaultValue;
    }
    
    // Return the enabled state
    return flag.enabled;
  };
  
  /**
   * Refresh flags from the API
   */
  const refreshFlags = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch flags from API
      const fetchedFlags = await featureFlagsService.getAll();
      
      // Transform array to record indexed by name
      const flagsRecord = fetchedFlags.reduce((acc, flag) => {
        acc[flag.name] = flag;
        return acc;
      }, {} as Record<string, FeatureFlag>);
      
      // Update state
      setFlags(flagsRecord);
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError('Failed to fetch feature flags');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    refreshFlags();
  }, []);
  
  // Value to provide
  const value: FeatureFlagsContextType = {
    flags,
    isFeatureEnabled,
    refreshFlags,
    loading,
    error
  };
  
  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export default FeatureFlagsContext;
