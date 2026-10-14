// How old a job posting is, from whatever date text the source gives
// ("2026-09-30", "3 days ago", "about 1 month ago", "over 2 years ago").
import { settings } from "@/config/settings";

const UNIT_DAYS: Record<string, number> = { minute: 1 / 1440, hour: 1 / 24, day: 1, week: 7, month: 30, year: 365 };

const daysBetween = (from: Date | string, to: Date) => Math.max(0, (to.getTime() - new Date(from).getTime()) / 86_400_000);

/**
 * Age in days, or null when the source didn't say.
 * `textAsOf`: when a relative text ("3 days ago") was read. Stored jobs keep the text from the day
 * they were first found, so that time has to be added back.
 */
export function jobAgeDays(posted: string | null | undefined, now = new Date(), textAsOf?: Date | string | null): number | null {
  if (!posted) return null;
  const since = textAsOf ? daysBetween(textAsOf, now) : 0;
  const rel = posted.match(/\b(\d+|an?)\s+(minute|hour|day|week|month|year)s?\b/i);
  if (rel && /ago/i.test(posted)) {
    const n = /^an?$/i.test(rel[1]) ? 1 : parseInt(rel[1], 10);
    return n * UNIT_DAYS[rel[2].toLowerCase()] + since;
  }
  if (/less than a minute|just now|today/i.test(posted)) return since;
  const d = new Date(posted);
  return isNaN(d.getTime()) ? null : daysBetween(d, now);
}

/**
 * Postings older than settings.maxJobAgeDays are skipped and hidden.
 * `firstSeen`: when we first found the job. It dates relative texts, and stands in for the posting
 * date when the source gives none (a job we've been seeing for weeks isn't new).
 */
export function isJobTooOld(posted: string | null | undefined, now = new Date(), firstSeen?: Date | string | null): boolean {
  const age = jobAgeDays(posted, now, firstSeen) ?? (firstSeen ? daysBetween(firstSeen, now) : null);
  return age !== null && age > settings.maxJobAgeDays;
}
