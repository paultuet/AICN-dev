import { useFeatureFlags } from '../contexts/FeatureFlagsContext';

/**
 * Custom hook to check if a feature flag is enabled
 * 
 * @param flagName - The name of the feature flag to check
 * @param defaultValue - Default value to return if flag doesn't exist (defaults to false)
 * @returns boolean indicating if the feature is enabled
 * 
 * @example
 * ```tsx
 * const isNewDashboardEnabled = useFeatureFlag('new_dashboard');
 * 
 * if (isNewDashboardEnabled) {
 *   return <NewDashboard />;
 * } else {
 *   return <OldDashboard />;
 * }
 * ```
 */
export function useFeatureFlag(flagName: string, defaultValue = false): boolean {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(flagName, defaultValue);
}

export default useFeatureFlag;