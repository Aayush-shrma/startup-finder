// How old a job posting is, from whatever date text the source gives
// ("2026-09-30", "3 days ago", "about 1 month ago", "over 2 years ago").
import { settings } from "@/config/settings";

const UNIT_DAYS: Record<string, number> = { minute: 1 / 1440, hour: 1 / 24, day: 1, week: 7, month: 30, year: 365 };

/** Age in days, or null when the source didn't say. */
export function jobAgeDays(posted: string | null | undefined, now = new Date()): number | null {
  if (!posted) return null;
  const rel = posted.match(/\b(\d+|an?)\s+(minute|hour|day|week|month|year)s?\b/i);
  if (rel && /ago/i.test(posted)) {
    const n = /^an?$/i.test(rel[1]) ? 1 : parseInt(rel[1], 10);
    return n * UNIT_DAYS[rel[2].toLowerCase()];
  }
  if (/less than a minute|just now|today/i.test(posted)) return 0;
  const d = new Date(posted);
  return isNaN(d.getTime()) ? null : Math.max(0, (now.getTime() - d.getTime()) / 86_400_000);
}

/** Postings older than settings.maxJobAgeDays are skipped; undated ones are kept. */
export function isJobTooOld(posted: string | null | undefined, now = new Date()): boolean {
  const age = jobAgeDays(posted, now);
  return age !== null && age > settings.maxJobAgeDays;
}
