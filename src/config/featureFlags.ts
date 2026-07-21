/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ARCHITECTURAL DIRECTIVE: DO NOT ACCESS `import.meta.env` OR `process.env` DIRECTLY IN THE APPLICATION CODE.
 *
 * To maintain architecture cleanliness, prevent accidental leaks, avoid hard dependencies
 * on environment variables, and ensure structured fallback configurations, always import
 * and use this `FeatureFlags` singleton object instead of referencing environment variables directly.
 */

export interface FeatureFlagsType {
  /**
   * Enables developer mode, revealing debug tools and verbose log messages.
   * Fallback default value: `false`
   */
  devMode: boolean;

  /**
   * Activates sandbox configurations and mocks external integrations.
   * Fallback default value: `false`
   */
  sandbox: boolean;

  /**
   * Displays the visual performance HUD (Heads-Up Display) overlay for diagnostics.
   * Fallback default value: `false`
   */
  performanceHud: boolean;

  /**
   * Controls visibility and access to the special Regulator Portal interface.
   * Fallback default value: `false`
   */
  regulatorPortal: boolean;
}

/**
 * Helper utility to safely extract and parse boolean configuration flags from the environment,
 * supporting string representations like "true", "1", or "yes".
 */
const getBooleanFlag = (key: string, defaultValue: boolean = false): boolean => {
  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
  if (!metaEnv) {
    return defaultValue;
  }
  const value = metaEnv[key];
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

/**
 * Singleton configuration object containing all active feature flags for the application.
 */
export const FeatureFlags: FeatureFlagsType = {
  devMode: getBooleanFlag("VITE_DEV_MODE", false),
  sandbox: getBooleanFlag("VITE_SANDBOX", false),
  performanceHud: getBooleanFlag("VITE_PERFORMANCE_HUD", false),
  regulatorPortal: getBooleanFlag("VITE_REGULATOR_PORTAL", false),
};

export default FeatureFlags;
