// The Worker's crons, apart from worker/index.ts so tests can import them: a Worker entry module
// should export only its handlers. They must match `[triggers] crons` in wrangler.toml and
// wrangler.example.toml (test/node/crons.test.ts checks).

/** Outage detection. */
export const MINUTE_CRON = '* * * * *';
/** Housekeeping: purges expired admin sessions. */
export const HOURLY_CRON = '0 * * * *';
/** The outage backup, half an hour after local midnight; its hour follows site.utcOffsetMinutes (site.config.ts). */
export const DAILY_CRON = '30 22 * * *';
