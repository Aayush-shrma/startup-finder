"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StartupView } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { applyFilters, DEFAULT_FILTERS, Filters, filtersForProfile, type FilterState } from "./Filters";
import { StartupCard } from "./StartupCard";
import { Summary } from "./Summary";
import { GettingStarted } from "./GettingStarted";

interface RunState {
  running: boolean;
  log: string[];
  finishedAt: string | null;
  stats: { startups: number; created: number; updated: number; newJobs: number; errors: number };
}

const FILTER_KEY = "dsf.filters.v1";

export function Dashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const [startups, setStartups] = useState<StartupView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<FilterState>(DEFAULT_FILTERS);
  const [defaults, setDefaults] = useState<FilterState>(DEFAULT_FILTERS);
  const [run, setRun] = useState<RunState | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false); // phones: filters open on demand
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const filtersReady = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/startups", { cache: "no-store" });
    const data = await res.json();
    if (res.status === 401) {
      router.replace("/onboarding");
      return;
    }
    if (!res.ok) setError(data.error ?? "Failed to load");
    else {
      setError(null);
      setStartups(data.startups);
      setLastRunAt(data.lastRun?.started_at ?? null);
      setName((data.profile?.name as string) || null);
      // First load: filters default to this user's preferences unless they've changed them before.
      if (!filtersReady.current) {
        filtersReady.current = true;
        const d = filtersForProfile(data.profile);
        setDefaults(d);
        let saved: Partial<FilterState> | null = null;
        try {
          const raw = localStorage.getItem(FILTER_KEY);
          if (raw) saved = JSON.parse(raw);
        } catch {}
        setF(saved ? { ...d, ...saved } : d);
      }
    }
  }, [router]);

  const watchRun = useCallback(() => {
    if (poll.current) return;
    poll.current = setInterval(async () => {
      const s: RunState = await (await fetch("/api/discover", { cache: "no-store" })).json();
      setRun(s);
      if (!s.running) {
        clearInterval(poll.current!);
        poll.current = null;
        load();
      }
    }, 2000);
  }, [load]);

  useEffect(() => {
    load();
    // Just finished onboarding: fetch startups for them right away (or use today's fresh results).
    if (params.get("welcome") === "1") {
      router.replace("/dashboard");
      findToday(true);
    }
    fetch("/api/discover", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: RunState) => {
        if (s.running) {
          setRun(s);
          watchRun();
        }
      })
      .catch(() => {});
    return () => {
      if (poll.current) clearInterval(poll.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, watchRun]);

  function setFilters(next: FilterState) {
    setF(next);
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(next));
    } catch {}
  }

  async function findToday(welcome = false) {
    const res = await fetch("/api/discover", { method: "POST" });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    if (data.upToDate) {
      const ago = Math.max(1, Math.round((Date.now() - new Date(data.lastRunAt).getTime()) / 60000));
      setNotice(
        welcome
          ? `Welcome! Here are startups matched to your profile, from a search ${ago < 60 ? `${ago} min` : `${Math.round(ago / 60)} h`} ago.`
          : `Already up to date — startups were searched ${ago < 60 ? `${ago} min` : `${Math.round(ago / 60)} h`} ago. Try again later for new ones.`
      );
      return;
    }
    if (welcome) setNotice("Welcome! Searching Y Combinator, funding news and careers pages for you — this takes a few minutes.");
    setRun(data);
    watchRun();
  }

  const viewList = useMemo(() => (startups ?? []).filter((s) => f.view === "all" || s.is_fresh), [startups, f.view]);
  const shown = useMemo(() => applyFilters(startups ?? [], f), [startups, f]);
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  /** "Show my best match": all startups, best match first, then scroll to the top card. */
  function showBest() {
    setFilters({ ...f, view: "all", sort: "match", search: "" });
    setTimeout(() => {
      const card = document.querySelector("article");
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      // Smooth scrolling can be interrupted (re-render, background tab) — make sure we arrive.
      setTimeout(() => {
        const top = card.getBoundingClientRect().top;
        if (top > window.innerHeight * 0.5 || top < -50) card.scrollIntoView({ block: "start" });
      }, 700);
    }, 80);
  }

  const activeFilters =
    (f.roles ?? []).length + (f.types ?? []).length + f.funding.length + f.age.length + (f.emailOnly ? 1 : 0) + (f.matchingOnly ? 1 : 0) + (f.search ? 1 : 0);

  const lastRunLabel = lastRunAt ? new Date(lastRunAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null;
  const freshCount = (startups ?? []).filter((s) => s.is_fresh).length;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{name ? `Hi ${name.split(" ")[0]} — startups hiring for you` : "Startups hiring for you"}</h1>
            <p className="text-sm text-gray-500">
              {today} · Showing {f.locations.length ? f.locations.join(", ") : "all locations"}
            </p>
          </div>
          <button
            onClick={() => findToday()}
            disabled={run?.running}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-70 sm:w-auto"
          >
            {run?.running && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {run?.running ? "Finding startups… (~3 min)" : "🔎 Find Startups Today"}
          </button>
        </div>
        {/* The explainer is hidden on phones to get to the startups faster. */}
        <ol className="mt-4 hidden gap-2 text-xs text-gray-600 sm:grid sm:grid-cols-3">
          <li className="rounded-lg bg-gray-50 px-3 py-2">
            <b className="text-gray-800">1. Find</b> — pulls hiring startups from Y Combinator, funding news, job boards and company careers pages.
          </li>
          <li className="rounded-lg bg-gray-50 px-3 py-2">
            <b className="text-gray-800">2. Match</b> — scores every job against your resume: role, skills, location, experience.
          </li>
          <li className="rounded-lg bg-gray-50 px-3 py-2">
            <b className="text-gray-800">3. Apply</b> — open the job, email the team, and track it under Applications.
          </li>
        </ol>
      </section>

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss" className="text-indigo-400 hover:text-indigo-800">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <b>Error:</b> {error}
        </div>
      )}

      {startups && startups.length > 0 && !run?.running && lastRunAt && new Date(lastRunAt).toDateString() !== new Date().toDateString() && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Showing results from <b>{lastRunLabel}</b>.<span className="hidden sm:inline"> You haven’t searched today yet — click <b>Find Startups Today</b> for fresh results.</span>
          <span className="sm:hidden"> Tap Find Startups Today for fresh ones.</span>
        </div>
      )}

      {startups && startups.length > 0 && <GettingStarted startups={startups} onShowBest={showBest} />}

      {startups && <Summary list={viewList} label={f.view === "today" ? `Found in the latest search${lastRunLabel ? ` (${lastRunLabel})` : ""}` : "All startups found so far"} />}

      {/* minmax(0,1fr): without it the single phone column grows to its widest child and the page overflows. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className={showFilters ? "" : "hidden lg:block"}>
          <Filters f={f} set={setFilters} defaults={defaults} />
          <button
            onClick={() => setShowFilters(false)}
            className="mt-2 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white lg:hidden"
          >
            Show {shown.length} startups
          </button>
        </div>
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm sm:gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 lg:hidden"
              aria-expanded={showFilters}
            >
              ⚙ Filters{activeFilters ? ` · ${activeFilters}` : ""}
            </button>
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
              {(
                [
                  ["today", `New & updated (${freshCount})`],
                  ["all", `All startups (${startups?.length ?? 0})`],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setFilters({ ...f, view: v })}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${f.view === v ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"}`}
                  title={v === "today" ? "Startups that are new, or have new jobs / funding, in the latest search" : "Everything found so far"}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-gray-500">
              <b className="text-gray-800">{shown.length}</b> match your filters
            </span>
            <label className="flex items-center gap-2 text-gray-600">
              Sort
              <select value={f.sort} onChange={(e) => setFilters({ ...f, sort: e.target.value as FilterState["sort"] })} className="rounded-lg border border-gray-200 bg-white px-2 py-1">
                <option value="match">Best profile match</option>
                <option value="discovered">Newest discovery</option>
                <option value="funding">Newest funding</option>
                <option value="founded">Recently founded</option>
                <option value="relevant_jobs">Most relevant jobs</option>
              </select>
            </label>
          </div>
          {!startups && !error && <div className="text-sm text-gray-500">Loading…</div>}
          {startups && startups.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <h3 className="text-base font-semibold text-gray-900">{run?.running ? "Finding startups for you…" : "Find your first startups"}</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                {run?.running
                  ? "We're checking Y Combinator, funding news and careers pages. This takes about 3 minutes — results appear here automatically."
                  : "Search Y Combinator, funding news and careers pages for startups hiring people with your skills."}
              </p>
              {!run?.running && (
                <button onClick={() => findToday()} className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                  🔎 Find startups now
                </button>
              )}
            </div>
          )}
          {startups && startups.length > 0 && shown.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No startups match these filters.
              <div className="mt-3 flex justify-center gap-2">
                {f.view === "today" && (
                  <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" onClick={() => setFilters({ ...f, view: "all" })}>
                    Show all startups
                  </button>
                )}
                <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Reset filters
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-2">
            {shown.map((s) => (
              <StartupCard key={s.id} s={s} onChanged={load} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
