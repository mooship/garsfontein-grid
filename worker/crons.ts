// The Worker's crons, apart from worker/index.ts so tests can import them: a Worker entry module
// should export only its handlers. They must match `[triggers] crons` in wrangler.toml.

/** Outage detection. */
export const MINUTE_CRON = '* * * * *';
/** Housekeeping: purges expired admin sessions. */
export const HOURLY_CRON = '0 * * * *';
/** The outage backup, at 00:30 SAST (UTC+2), just after the local day ends. */
export const DAILY_CRON = '30 22 * * *';
