import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { HOUR_MS, localDate } from '../shared/api';
import { DAILY_CRON, HOURLY_CRON, MINUTE_CRON } from '../worker/crons';
import { insertOutage, runCron } from './helpers';

interface Backup {
  generatedAt: string;
  outages: Record<string, unknown>[];
}

const backupKeys = async () => (await env.BACKUPS.list()).objects.map((o) => o.key);

async function readBackup(key: string): Promise<Backup> {
  const object = await env.BACKUPS.get(key);
  if (!object) throw new Error(`no backup at ${key}`);
  return object.json<Backup>();
}

describe('daily outage backup', () => {
  it('writes every outage, false positives and how each was recorded included', async () => {
    const now = Date.parse('2026-10-24T22:30:00Z');
    await insertOutage({
      startTime: '2026-10-20T08:00:00.000Z',
      endTime: '2026-10-20T09:00:00.000Z',
      source: 'manual',
    });
    await insertOutage({
      startTime: '2026-10-21T08:00:00.000Z',
      endTime: '2026-10-21T08:05:00.000Z',
      isFalsePositive: 1,
    });

    await runCron(DAILY_CRON, now);

    const backup = await readBackup(`outages/${localDate(now)}.json`);
    expect(backup.generatedAt).toBe(new Date(now).toISOString());
    expect(backup.outages).toHaveLength(2);
    expect(backup.outages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startTime: '2026-10-20T08:00:00.000Z', source: 'manual', isFalsePositive: false }),
        expect.objectContaining({ startTime: '2026-10-21T08:00:00.000Z', source: 'sensor', isFalsePositive: true }),
      ]),
    );
  });

  it('names the file by the local date, which can differ from the UTC date', async () => {
    // 23:30 UTC on 24 October is already 25 October in the configured zone.
    const now = Date.parse('2026-10-24T23:30:00Z');
    expect(localDate(now)).not.toBe(new Date(now).toISOString().slice(0, 10));

    await runCron(DAILY_CRON, now);

    expect(await backupKeys()).toEqual([`outages/${localDate(now)}.json`]);
  });

  it('replaces the same day’s file when it runs again', async () => {
    const first = Date.parse('2026-10-24T22:30:00Z');
    await runCron(DAILY_CRON, first);
    await insertOutage({ startTime: '2026-10-24T22:40:00.000Z' });

    await runCron(DAILY_CRON, first + HOUR_MS / 2);

    expect(await backupKeys()).toHaveLength(1);
    expect((await readBackup(`outages/${localDate(first)}.json`)).outages).toHaveLength(1);
  });

  it('is written only by the daily cron', async () => {
    await insertOutage({});
    await runCron(MINUTE_CRON);
    await runCron(HOURLY_CRON);
    expect(await backupKeys()).toEqual([]);
  });
});
