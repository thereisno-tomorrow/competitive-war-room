export const ALERT_THRESHOLDS = {
  /** Any of these conditions being true triggers a Signal Alert */
  tier1CompetitorInvolved: true,
  positioningClaimAffected: true,
  pricingChange: true,
  outage: true,
  negativePressEvent: true,
  treasuryOSLanguageDetected: true,
} as const;

export const OUTPUT_LIMITS = {
  WEEKLY_PULSE_MAX_WORDS: 500,
  MONTHLY_PULSE_MAX_WORDS: 1000,
  SIGNAL_ALERT_MAX_WORDS: 500,
  MAX_REGENERATION_ATTEMPTS: 3,
  MAX_ALERTS_PER_WEEK: 3,
} as const;

export const SCHEDULE = {
  /** SGT timezone offset from UTC */
  SGT_OFFSET_HOURS: 8,
  /** Weekly pulse publishes on Monday */
  WEEKLY_PULSE_DAY: 1, // Monday = 1
  /** Monthly pulse publishes within first 5 business days */
  MONTHLY_PULSE_MAX_BUSINESS_DAY: 5,
} as const;
