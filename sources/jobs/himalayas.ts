// Himalayas public jobs API (https://himalayas.app/jobs/api). Every job is remote. The search
// endpoint's `country=India` returns jobs open to people in India: India-restricted or worldwide.
// Free, no key, no robots.txt restrictions. Himalayas asks API users to link back to the job on
// Himalayas: the job link points there, and apply goes to the job's own application link.
// Like any job board, it only adds jobs to startups we already track (see fundedRecentlyEnough).
import type { DiscoveryContext, JobResult, StartupResult, StartupSource } from "@/lib/types";
import { cachedJson } from "@/lib/http";
import { stripHtml } from "@/lib/text";
import { isJobTooOld } from "@/lib/jobs/age";
import { settings } from "@/config/settings";

const SEARCH = "https://himalayas.app/jobs/api/search";

export interface HimalayasJob {
  title: string;
  excerpt?: string;
  companyName: string;
  companySlug?: string;
  employmentType?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string | null;
  seniority?: string[];
  locationRestrictions?: string[];
  categories?: string[];
  description?: string;
  pubDate: number; // unix seconds
  applicationLink?: string;
  guid: string; // job page on Himalayas
}

/** A Himalayas job → our job, or null if it's too old or not open to India. */
export function himalayasJob(j: HimalayasJob, now = new Date()): JobResult | null {
  const posted = j.pubDate ? new Date(j.pubDate * 1000).toISOString().slice(0, 10) : null;
  if (!j.guid || !j.title || isJobTooOld(posted, now)) return null;
  const places = j.locationRestrictions ?? [];
  const india = places.some((p) => /india/i.test(p));
  if (places.length && !india) return null; // restricted to other countries
  const salary =
    j.minSalary || j.maxSalary
      ? `${j.currency ?? ""} ${[j.minSalary, j.maxSalary].filter(Boolean).map((n) => n!.toLocaleString("en-US")).join("–")}`.trim()
      : null;
  return {
    title: j.title,
    url: j.guid,
    applyUrl: j.applicationLink || j.guid,
    location: india ? `Remote (${places.join(", ")})` : "Remote (Worldwide)",
    remote: "yes",
    remoteScope: india ? "India" : "Worldwide",
    employmentType: j.employmentType || null,
    postedDate: posted,
    // "Entry-level" etc. as stated by the employer; matching treats Entry-level as fresher-friendly.
    minExperience: j.seniority?.length ? j.seniority.join(", ") : null,
    salary,
    skills: (j.categories ?? []).map((c) => c.replace(/-/g, " ")),
    description: stripHtml([j.excerpt, j.description].filter(Boolean).join(" ")).slice(0, 2500),
    source: "himalayas",
    sourceUrl: j.guid,
  };
}

export const himalayasSource: StartupSource = {
  id: "himalayas",
  name: "Himalayas remote jobs",
  disabledReason: () => null,

  async discover(ctx: DiscoveryContext): Promise<StartupResult[]> {
    const byCompany = new Map<string, StartupResult>();
    let seen = 0;
    let kept = 0;
    for (let page = 1; page <= settings.himalayasPages; page++) {
      const url = `${SEARCH}?country=India&sort=recent&page=${page}`;
      let jobs: HimalayasJob[];
      try {
        jobs = (await cachedJson<{ jobs: HimalayasJob[] }>(url, settings.cacheHours.jobBoards)).jobs ?? [];
      } catch (e) {
        ctx.log(`Himalayas: page ${page} failed (${(e as Error).message})`);
        break;
      }
      if (!jobs.length) break;
      seen += jobs.length;
      let fresh = 0;
      for (const j of jobs) {
        const job = himalayasJob(j);
        if (!job || !j.companyName?.trim()) continue;
        fresh++;
        kept++;
        const key = j.companyName.trim().toLowerCase();
        if (!byCompany.has(key)) byCompany.set(key, { name: j.companyName.trim(), source: "himalayas", sourceUrl: job.sourceUrl, jobs: [] });
        byCompany.get(key)!.jobs!.push(job);
      }
      if (!fresh) break; // sorted newest first: nothing recent left
    }
    ctx.log(`Himalayas: ${seen} jobs read, ${kept} recent and open to India, from ${byCompany.size} companies.`);
    return [...byCompany.values()];
  },
};
