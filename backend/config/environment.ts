/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum EnvironmentProfile {
  Development = 'development',
  Sandbox = 'sandbox',
  Staging = 'staging',
  Production = 'production',
}

export interface FeatureFlags {
  quickLogin: boolean;
  devHud: boolean;
  fakeData: boolean;
  verboseLogs: boolean;
  debugApis: boolean;
  mockSms: boolean;
  mockPush: boolean;
  mockAml: boolean;
}

export interface AppConfig {
  profile: EnvironmentProfile;
  port: number;
  corsOrigin: string;
  features: FeatureFlags;
}

const defaultProfiles: Record<EnvironmentProfile, FeatureFlags> = {
  [EnvironmentProfile.Development]: {
    quickLogin: true,
    devHud: true,
    fakeData: true,
    verboseLogs: true,
    debugApis: true,
    mockSms: true,
    mockPush: true,
    mockAml: true,
  },
  [EnvironmentProfile.Sandbox]: {
    quickLogin: true,
    devHud: true,
    fakeData: true,
    verboseLogs: true,
    debugApis: true,
    mockSms: true,
    mockPush: true,
    mockAml: true,
  },
  [EnvironmentProfile.Staging]: {
    quickLogin: false,
    devHud: false,
    fakeData: false,
    verboseLogs: true,
    debugApis: false,
    mockSms: true,
    mockPush: true,
    mockAml: true,
  },
  [EnvironmentProfile.Production]: {
    quickLogin: false,
    devHud: false,
    fakeData: false,
    verboseLogs: false,
    debugApis: false,
    mockSms: false,
    mockPush: false,
    mockAml: false,
  },
};

class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: AppConfig;

  private constructor() {
    const rawProfile = process.env.APP_ENV || process.env.NODE_ENV || 'development';
    let profile = EnvironmentProfile.Development;

    if (rawProfile.toLowerCase() === 'production' || rawProfile.toLowerCase() === 'prod') {
      profile = EnvironmentProfile.Production;
    } else if (rawProfile.toLowerCase() === 'staging') {
      profile = EnvironmentProfile.Staging;
    } else if (rawProfile.toLowerCase() === 'sandbox') {
      profile = EnvironmentProfile.Sandbox;
    }

    const baseFeatures = defaultProfiles[profile];

    // Read possible overrides from env variables
    const features: FeatureFlags = {
      quickLogin: process.env.FEATURE_QUICK_LOGIN ? process.env.FEATURE_QUICK_LOGIN === 'true' : baseFeatures.quickLogin,
      devHud: process.env.FEATURE_DEV_HUD ? process.env.FEATURE_DEV_HUD === 'true' : baseFeatures.devHud,
      fakeData: process.env.FEATURE_FAKE_DATA ? process.env.FEATURE_FAKE_DATA === 'true' : baseFeatures.fakeData,
      verboseLogs: process.env.FEATURE_VERBOSE_LOGS ? process.env.FEATURE_VERBOSE_LOGS === 'true' : baseFeatures.verboseLogs,
      debugApis: process.env.FEATURE_DEBUG_APIS ? process.env.FEATURE_DEBUG_APIS === 'true' : baseFeatures.debugApis,
      mockSms: process.env.FEATURE_MOCK_SMS ? process.env.FEATURE_MOCK_SMS === 'true' : baseFeatures.mockSms,
      mockPush: process.env.FEATURE_MOCK_PUSH ? process.env.FEATURE_MOCK_PUSH === 'true' : baseFeatures.mockPush,
      mockAml: process.env.FEATURE_MOCK_AML ? process.env.FEATURE_MOCK_AML === 'true' : baseFeatures.mockAml,
    };

    this.config = {
      profile,
      port: 3000,
      corsOrigin: process.env.CORS_ORIGIN || '*',
      features,
    };
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public getFeatures(): FeatureFlags {
    return this.config.features;
  }

  public isProd(): boolean {
    return this.config.profile === EnvironmentProfile.Production;
  }
}

export const configManager = ConfigManager.getInstance();
