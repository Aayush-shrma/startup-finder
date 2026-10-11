"use client";
import { useEffect, useMemo, useState } from "react";
import type { StartupView } from "@/lib/types";
import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { ROLE_CATEGORIES } from "@/lib/jobs/roles";

export default function JobsPage() {
  const [startups, setStartups] = useState<StartupView[]>([]);
  const [onlyRelevant, setOnlyRelevant] = useState(true);
  const [loc, setLoc] = useState<"pune_remote" | "any">("pune_remote");
  const [role, setRole] = useState<string>("all");
  const load = () =>
    fetch("/api/startups", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setStartups(d.startups ?? []));
  useEffect(() => {
    load();
  }, []);

  const jobs = useMemo(() => {
    const rows = startups.flatMap((s) => s.jobs.map((j) => ({ j, s })));
    return rows
      .filter(({ j }) => !onlyRelevant || j.match.relevance === "strong" || j.match.relevance === "potential")
      .filter(({ j }) => loc === "any" || j.location_tags.some((t) => t === "Pune" || t === "Remote - India" || t === "Remote"))
      .filter(({ j }) => role === "all" || j.role_categories.includes(role))
      .sort((a, b) => b.j.match.match_score - a.j.match.match_score);
  }, [startups, onlyRelevant, loc, role]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-semibold">Jobs ranked by profile match</h1>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={onlyRelevant} onChange={(e) => setOnlyRelevant(e.target.checked)} /> Only relevant
        </label>
        <select value={loc} onChange={(e) => setLoc(e.target.value as "pune_remote" | "any")} className="rounded border border-gray-300 bg-white px-2 py-1 text-sm">
          <option value="pune_remote">Pune + Remote</option>
          <option value="any">Any location</option>
        </select>
        <select aria-label="Job role" value={role} onChange={(e) => setRole(e.target.value)} className="rounded border border-gray-300 bg-white px-2 py-1 text-sm">
          <option value="all">All roles</option>
          {ROLE_CATEGORIES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{jobs.length} jobs · click a title to see why it matches</span>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
        {jobs.length === 0 && (
          <div className="py-8 text-center">
            {startups.length === 0 ? (
              <>
                <div className="text-base font-semibold text-gray-900">No jobs yet</div>
                <p className="mt-1 text-sm text-gray-500">Run a search from the dashboard and matching jobs show up here.</p>
                <Link href="/dashboard" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                  Go to dashboard
                </Link>
              </>
            ) : (
              <>
                <div className="text-base font-semibold text-gray-900">No jobs match these filters</div>
                <div className="mt-3 flex justify-center gap-2">
                  {loc !== "any" && (
                    <button onClick={() => setLoc("any")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                      Any location
                    </button>
                  )}
                  {role !== "all" && (
                    <button onClick={() => setRole("all")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                      All roles
                    </button>
                  )}
                  {onlyRelevant && (
                    <button onClick={() => setOnlyRelevant(false)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                      Include weaker matches
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {jobs.map(({ j, s }) => (
          <JobCard key={j.id} job={j} showCompany={s.name} application={s.applications.find((a) => a.job_id === j.id)} onChanged={load} />
        ))}
      </div>
    </div>
  );
}
