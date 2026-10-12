"use client";
import { useState } from "react";
import type { ApplicationView, JobView } from "@/lib/types";
import { APPLICATION_STATUSES } from "@/lib/types";
import { MatchBadge } from "./MatchScore";

export function StatusSelect({
  startupId,
  jobId,
  application,
  onChanged,
}: {
  startupId: number;
  jobId: number | null;
  application?: ApplicationView;
  onChanged?: () => void;
}) {
  const [status, setStatus] = useState(application?.status ?? "Not Applied");
  const [busy, setBusy] = useState(false);
  async function change(next: string) {
    setBusy(true);
    setStatus(next);
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startup_id: startupId, job_id: jobId, status: next }),
    });
    setBusy(false);
    onChanged?.();
  }
  const tracked = status !== "Not Applied";
  return (
    <select
      aria-label="Application status"
      title="Track your application"
      value={status}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
      className={`rounded-md border px-1.5 py-1 text-xs ${tracked ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-600"}`}
    >
      {APPLICATION_STATUSES.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  );
}

export function JobCard({
  job,
  application,
  onChanged,
  showCompany,
  showScore = true,
  funding,
}: {
  job: JobView;
  application?: ApplicationView;
  onChanged?: () => void;
  showCompany?: string;
  showScore?: boolean;
  /** The startup's latest funding, shown in the job's footer line. */
  funding?: FundingInfo;
}) {
  const funded = fundedLabel(funding);
  const where =
    job.remote === "yes"
      ? `Remote${job.remote_scope ? ` (${job.remote_scope === "India" ? "India" : job.remote_scope})` : ""}`
      : job.location ?? "Location not listed";
  const facts = [where, job.employment_type, job.salary, job.min_experience ? `Exp: ${job.min_experience}` : null].filter(Boolean);
  return (
    <div className="py-2.5">
      {/* Phones: actions sit under the title so the title gets the full width. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {showCompany && <span className="text-sm text-gray-500">{showCompany} ·</span>}
            <span className="text-sm font-medium text-gray-900">{job.job_title}</span>
            <MatchBadge match={job.match} showScore={showScore} />
          </div>
          <div className="mt-0.5 truncate text-xs text-gray-500">{facts.join(" · ")}</div>
        </div>
        <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
          <a
            href={job.apply_url ?? job.job_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-indigo-200 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Apply ↗
          </a>
          <StatusSelect startupId={job.startup_id} jobId={job.id} application={application} onChanged={onChanged} />
        </div>
      </div>
      <div className="mt-1 text-[11px] text-gray-400">
        Posted {postedLabel(job.posted_date)} · Found on{" "}
        <a className="underline hover:text-gray-600" href={job.source_url ?? job.job_url} target="_blank" rel="noreferrer">
          {SOURCE_NAMES[job.source] ?? job.source}
        </a>
        {funded && <> · Funded {funded}</>}
      </div>
    </div>
  );
}

export type FundingInfo = { last_funding_date: string | null; last_funding_amount: string | null; funding_round: string | null };

const fmtDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** "3 days ago" stays as is; "2026-07-10" becomes "10 Jul 2026". */
function postedLabel(posted: string | null) {
  if (!posted) return "date unknown";
  return /^\d{4}-\d{2}-\d{2}$/.test(posted) ? fmtDate(posted) : posted;
}

/** "9 Oct 2026 ($30M, Series A)" / "Jun 2026 (Y Combinator Spring 2026)" / null when unknown. */
function fundedLabel(f?: FundingInfo) {
  if (!f || (!f.last_funding_date && !f.funding_round)) return null;
  const yc = /Y Combinator/i.test(f.funding_round ?? "");
  // YC dates are approximate (Demo Day month), so show only the month.
  const when = f.last_funding_date
    ? yc && !f.last_funding_amount
      ? new Date(f.last_funding_date + "T00:00:00").toLocaleDateString("en-IN", { month: "short", year: "numeric" })
      : fmtDate(f.last_funding_date)
    : null;
  const what = [f.last_funding_amount, f.funding_round].filter(Boolean).join(", ");
  return when ? `${when}${what ? ` (${what})` : ""}` : what;
}

export const SOURCE_NAMES: Record<string, string> = {
  yc: "Y Combinator",
  remotive: "Remotive",
  funding_rss: "funding news",
  company_careers: "company careers page",
  search: "web search",
};
