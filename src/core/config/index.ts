/**
 * Central application configuration.
 * All environment-sensitive values are defined here so they can be replaced
 * by a single source of truth (e.g. EAS environment variables) in future phases.
 */
const Config = {
  APP_NAME: 'GlobalVox',

  /** Phase-1 content source. Replace with a versioned API endpoint in Phase-2. */
  INSTAGRAM_URL: 'https://www.instagram.com/',

  /** Subscription plan displayed in Phase-1. */
  SUBSCRIPTION: {
    PLAN_NAME: 'GlobalVox Pro',
    PRICE_LABEL: '$20/month',
    BENEFIT: 'Unlimited Translations',
  },
} as const;

export default Config;
