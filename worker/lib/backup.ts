import { localDate } from '../../shared/api';
import type { Db } from '../db/client';
import { outages } from '../db/schema';

// Push subscriptions and sessions are visitor and admin data the privacy notice does not mention
// copying, so only outages are backed up.

/** Writes every outage row, every column, to `outages/<local date>.json`, replacing that day's file. */
export async function backupOutages(db: Db, bucket: R2Bucket, now: Date): Promise<void> {
  const rows = await db.select().from(outages);
  await bucket.put(
    `outages/${localDate(now.getTime())}.json`,
    JSON.stringify({ generatedAt: now.toISOString(), outages: rows }),
    { httpMetadata: { contentType: 'application/json' } },
  );
}
