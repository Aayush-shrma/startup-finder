import type { StartupView } from "@/lib/types";

/** Which subset a summary tile stands for; clicking a tile filters the list to it. */
export type SummaryPick = "all" | "great" | "good" | "jobs" | "ai" | "funded" | "new" | "email";

function Tile({ label, value, hint, tone = "text-gray-900", onClick }: { label: string; value: number; hint: string; tone?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick || value === 0}
      className="min-w-[104px] shrink-0 snap-start rounded-lg border border-gray-100 bg-gray-50/60 p-3 text-left transition enabled:hover:border-indigo-300 enabled:hover:bg-indigo-50/60 disabled:cursor-default sm:min-w-0"
      title={value === 0 ? hint : `${hint} — click to show them`}
    >
      <div className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </button>
  );
}

export const isAiStartup = (s: StartupView) => s.is_ai === true || s.industry === "AI Startup";
export const isRecentlyFunded = (s: StartupView) => ["funded_30", "funded_90", "funded_180"].includes(s.funding_status);

export function Summary({ list, label, onPick }: { list: StartupView[]; label: string; onPick?: (p: SummaryPick) => void }) {
  const strong = list.filter((s) => s.relevance === "strong").length;
  const potential = list.filter((s) => s.relevance === "potential").length;
  const pick = (p: SummaryPick) => (onPick ? () => onPick(p) : undefined);
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">{label}</h2>
      {/* Phones: one swipeable row. Larger screens: grid. */}
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-8">
        <Tile label="Startups found" value={list.length} hint="Startups in this view" onClick={pick("all")} />
        <Tile label="Great matches" value={strong} tone="text-emerald-700" hint="Have a job for your target role, in your locations, at your experience level" onClick={pick("great")} />
        <Tile label="Good matches" value={potential} tone="text-amber-600" hint="Have a job that fits, with something to check (location or role)" onClick={pick("good")} />
        <Tile label="Open jobs" value={list.reduce((n, s) => n + s.jobs.length, 0)} hint="All open jobs at these startups" onClick={pick("jobs")} />
        <Tile label="AI startups" value={list.filter(isAiStartup).length} hint="AI is central to their product" onClick={pick("ai")} />
        <Tile label="Funded recently" value={list.filter(isRecentlyFunded).length} hint="Raised money in the last 6 months" onClick={pick("funded")} />
        <Tile label="New (2024+)" value={list.filter((s) => s.is_new_startup === true).length} hint="Founded in 2024 or later" onClick={pick("new")} />
        <Tile label="With email" value={list.filter((s) => s.emails.length > 0).length} hint="A contact email is published on their website" onClick={pick("email")} />
      </div>
    </section>
  );
}
