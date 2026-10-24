import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { site } from '../../site.config';
import { DAILY_CRON, HOURLY_CRON, MINUTE_CRON } from '../../worker/crons';

/** The top-level `[triggers] crons` of a Wrangler config; `[env.e2e]` sets its own inline. */
function triggerCrons(file: string): string[] {
  const toml = readFileSync(resolve(import.meta.dirname, '../..', file), 'utf8');
  const list = toml.match(/^crons = \[(.*)\]$/m)?.[1];
  if (list === undefined) throw new Error(`no crons in ${file}`);
  // A TOML array of basic strings is valid JSON.
  return JSON.parse(`[${list}]`) as string[];
}

describe('crons', () => {
  // The scheduled handler treats any cron it does not recognise as the minute cron, so a mismatch
  // would silently skip the hourly or daily work.
  it.each(['wrangler.toml', 'wrangler.example.toml'])('%s triggers exactly the crons in worker/crons.ts', (file) => {
    expect(triggerCrons(file).sort()).toEqual([MINUTE_CRON, HOURLY_CRON, DAILY_CRON].sort());
  });

  it('runs the backup half an hour after local midnight', () => {
    const [minute = Number.NaN, hour = Number.NaN] = DAILY_CRON.split(' ').map(Number);
    expect((hour * 60 + minute + site.utcOffsetMinutes) % (24 * 60)).toBe(30);
  });
});
