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

  /**
   * ISO 639-1 codes for languages surfaced in the Control Center.
   * The translation engine (Phase-2) will consume this list to populate its pipeline.
   */
  SUPPORTED_LANGUAGES: ['EN', 'FR', 'AR', 'ES'] as const,

  DEFAULT_LANGUAGE: 'EN' as const,
} as const;

export default Config;
