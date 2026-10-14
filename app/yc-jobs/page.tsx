"use client";
// YC Jobs: jobs at Y Combinator companies funded in the last 3 months (or in the current batch),
// posted in the last 7 days. Everything shown comes from stored data: YC company pages, careers
// pages and funding news. Links and contacts appear only when a source listed them.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JobView, StartupView } from "@/lib/types";
import { api } from "@/components/api";
import { JobCard } from "@/components/JobCard";
import { Pill } from "@/components/Filters";
import { Emails } from "@/components/Emails";
import { Avatar, Icon } from "@/components/Icon";
import { fundingAmountText, fundingDateText, FundingKindBadge } from "@/components/format";
import { Banner, btnPrimary, btnSecondary, CardSkeleton, EmptyState, PageHeader, Select } from "@/components/ui";
import { ROLE_CATEGORIES } from "@/lib/jobs/roles";
import { ycFundedWithin } from "@/lib/filters";
import { settings } from "@/config/settings";

type Funding = "90" | "30" | "any";
type Country = "any" | "india" | "usa";
interface Filters {
  funding: Funding;
  country: Country;
  role: string;
  remote: boolean;
  internship: boolean;
  fresher: boolean;
  openSource: boolean;
  q: string;
}
const DEFAULTS: Filters = { funding: "90", country: "any", role: "all", remote: false, internship: false, fresher: false, openSource: false, q: "" };

/** "Y Combinator Summer 2026" → "YC Summer 2026". */
const batchLabel = (round: string | null) => round?.replace(/^Y\s?Combinator\s*/i, "YC ").trim() || null;

const isLinkedIn = (url: string | null) => !!url && /^https?:\/\/([a-z]+\.)?linkedin\.com\//i.test(url);

/** GitHub account name from https://github.com/<name>. */
const githubName = (url: string) => url.replace(/^https:\/\/github\.com\//, "");

function jobMatches(j: JobView, f: Filters): boolean {
  if (f.role !== "all" && !j.role_categories.includes(f.role)) return false;
  if (f.remote && j.work_arrangement !== "remote" && j.remote !== "yes") return false;
  if (f.internship && j.role_type !== "internship") return false;
  if (f.fresher && j.role_type !== "internship" && j.experience_level !== "fresher") return false;
  return true;
}

function startupMatches(s: StartupView, f: Filters): boolean {
  if (f.funding !== "any" && !ycFundedWithin(s, Number(f.funding))) return false;
  if (f.country === "india" && s.hq_country !== "India") return false;
  if (f.country === "usa" && s.hq_country !== "United States") return false;
  if (f.openSource && !s.open_source) return false;
  return true;
}

function ExtLink({ href, icon, children }: { href: string; icon: "external" | "linkedin" | "github" | "globe"; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 hover:underline">
      <Icon name={icon} className="h-3.5 w-3.5" />
      {children}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function CompanyCard({ s, jobs, onChanged }: { s: StartupView; jobs: JobView[]; onChanged: () => void }) {
  const batch = batchLabel(s.funding_round);
  const amount = fundingAmountText(s);
  const founders = s.founders.filter((p) => isLinkedIn(p.profile_url));
  return (
    <article className="rounded-2xl border border-gray-200 bg-white">
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar name={s.name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/startups/${s.id}`} className="font-display text-lg font-semibold text-gray-900 hover:text-brand-700">
                {s.name}
              </Link>
              {batch && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">{batch}</span>}
              {s.open_source && <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">Open source</span>}
              <FundingKindBadge kind={s.funding_kind} />
            </div>
            <p className="mt-0.5 text-[13px] text-gray-500">
              {[s.hq_country && `HQ: ${s.hq_country}`, s.location].filter(Boolean).join(" · ") || "Location not listed"}
            </p>
          </div>
        </div>

        {s.description && <p className="line-clamp-2 text-sm text-gray-600">{s.description}</p>}

        {/* Funding: only what a source stated; YC dates are marked as estimates. */}
        <p className="flex items-start gap-1.5 text-[13px] text-gray-700">
          <Icon name="money" className="mt-0.5 h-3.5 w-3.5 text-gray-400" />
          <span>
            {amount && <b className="font-semibold">{amount} · </b>}
            {fundingDateText(s)}
            {s.funding_source_url && (
              <>
                {" · "}
                <a href={s.funding_source_url} target="_blank" rel="noreferrer" className="underline hover:text-gray-900">
                  source
                </a>
              </>
            )}
          </span>
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {s.website && (
            <ExtLink href={s.website} icon="globe">
              Website
            </ExtLink>
          )}
          {isLinkedIn(s.linkedin_url) && (
            <ExtLink href={s.linkedin_url!} icon="linkedin">
              Company LinkedIn
            </ExtLink>
          )}
          {s.github_url && (
            <>
              <ExtLink href={s.github_url} icon="github">
                GitHub
              </ExtLink>
              <ExtLink
                href={`https://github.com/search?q=${encodeURIComponent(`org:${githubName(s.github_url)} is:issue is:open label:"good first issue"`)}&type=issues`}
                icon="external"
              >
                Good first issues
              </ExtLink>
            </>
          )}
        </div>

        {founders.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-600">
            <span className="text-gray-500">Founders (from YC):</span>
            {founders.map((p) => (
              <ExtLink key={p.profile_url} href={p.profile_url!} icon="linkedin">
                {p.name}
              </ExtLink>
            ))}
          </p>
        )}

        {s.emails.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Public emails (from their website)</p>
            <Emails emails={s.emails} limit={2} />
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-100 border-t border-gray-100 px-4 sm:px-5">
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} application={s.applications.find((a) => a.job_id === j.id)} onChanged={onChanged} />
        ))}
      </div>
    </article>
  );
}

export default function YcJobsPage() {
  const router = useRouter();
  const [startups, setStartups] = useState<StartupView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState<Filters>(DEFAULTS);

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, status, data, error } = await api("/api/yc-jobs");
    setLoading(false);
    if (status === 401) return router.replace("/onboarding");
    if (!ok) return setError(error);
    setError(null);
    setStartups(data.startups ?? []);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (patch: Partial<Filters>) => setF((prev) => ({ ...prev, ...patch }));

  // Companies with at least one matching job, best match first; jobs best match first.
  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return (startups ?? [])
      .filter((s) => startupMatches(s, f))
      .map((s) => ({
        s,
        jobs: s.jobs
          .filter((j) => jobMatches(j, f) && (!q || `${j.job_title} ${s.name}`.toLowerCase().includes(q)))
          .sort((a, b) => b.match.match_score - a.match.match_score),
      }))
      .filter((r) => r.jobs.length > 0)
      .sort((a, b) => b.jobs[0].match.match_score - a.jobs[0].match.match_score);
  }, [startups, f]);

  const jobCount = rows.reduce((n, r) => n + r.jobs.length, 0);
  const totalJobs = (startups ?? []).reduce((n, s) => n + s.jobs.length, 0);
  const narrowed = JSON.stringify(f) !== JSON.stringify(DEFAULTS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="YC Jobs"
        subtitle={`Jobs at Y Combinator companies posted in the last ${settings.maxJobAgeDays} days, best match first.`}
        actions={
          <button onClick={load} disabled={loading} className={btnSecondary}>
            <Icon name={loading ? "spinner" : "refresh"} className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">Search YC jobs</span>
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={f.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search a job title or YC company"
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100"
          />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select label="Funded" value={f.funding} onChange={(v) => set({ funding: v as Funding })}>
            <option value="90">Funded: 3 months</option>
            <option value="30">Funded: 30 days</option>
            <option value="any">Funded: any time</option>
          </Select>
          <Select label="Headquarters" value={f.country} onChange={(v) => set({ country: v as Country })}>
            <option value="any">Any country</option>
            <option value="india">HQ in India</option>
            <option value="usa">HQ in USA</option>
          </Select>
          <Select label="Job role" value={f.role} onChange={(v) => set({ role: v })}>
            <option value="all">All roles</option>
            {ROLE_CATEGORIES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill label="Remote" on={f.remote} onClick={() => set({ remote: !f.remote })} title="Remote jobs only" />
          <Pill label="Internships" on={f.internship} onClick={() => set({ internship: !f.internship })} title="Internship and trainee roles" />
          <Pill label="Fresher-friendly" on={f.fresher} onClick={() => set({ fresher: !f.fresher })} title="Internships, entry-level, or 0–1 years asked" />
          <Pill
            label="Open source"
            on={f.openSource}
            onClick={() => set({ openSource: !f.openSource })}
            title="Companies whose YC page lists a GitHub account or that YC tags Open Source"
          />
        </div>
        {f.funding !== "any" && (
          <p className="text-xs text-gray-500">Companies in the current YC batch count as funded: YC invests when the batch starts.</p>
        )}
      </div>

      {error && (
        <Banner
          tone="error"
          action={
            <button onClick={load} className="rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-gray-900 shadow-sm hover:bg-gray-50">
              Try again
            </button>
          }
        >
          {error}
        </Banner>
      )}

      {!startups && !error && <CardSkeleton count={3} />}

      {startups && (
        <>
          <p className="text-sm text-gray-600" aria-live="polite">
            <b className="font-semibold text-gray-900">{jobCount}</b> job{jobCount === 1 ? "" : "s"} at{" "}
            <b className="font-semibold text-gray-900">{rows.length}</b> YC compan{rows.length === 1 ? "y" : "ies"}
          </p>

          {rows.length === 0 &&
            (startups.length === 0 ? (
              <EmptyState
                icon="rocket"
                title="No recent YC companies yet"
                actions={
                  <Link href="/dashboard" className={btnPrimary}>
                    Go to Startups
                  </Link>
                }
              >
                Click <b>Find Startups Today</b> on the Startups page. It reads the latest YC batches, and their jobs show up here.
              </EmptyState>
            ) : totalJobs === 0 ? (
              <EmptyState
                icon="clock"
                title={`No YC jobs posted in the last ${settings.maxJobAgeDays} days`}
                actions={
                  <Link href="/dashboard" className={btnSecondary}>
                    Go to Startups
                  </Link>
                }
              >
                We know {startups.length} recent YC compan{startups.length === 1 ? "y" : "ies"}, but none posted a job this week. New searches run from the Startups page.
              </EmptyState>
            ) : (
              <EmptyState
                icon="search"
                title="No YC jobs match these filters"
                actions={
                  narrowed && (
                    <button onClick={() => setF(DEFAULTS)} className={btnSecondary}>
                      Clear filters
                    </button>
                  )
                }
              >
                There {totalJobs === 1 ? "is" : "are"} {totalJobs} recent YC job{totalJobs === 1 ? "" : "s"} in total. Try another role or turn off a toggle.
              </EmptyState>
            ))}

          <div className="space-y-4">
            {rows.map(({ s, jobs }) => (
              <CompanyCard key={s.id} s={s} jobs={jobs} onChanged={load} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
