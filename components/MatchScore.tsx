import type { JobMatch } from "@/lib/types";

export const MATCH_LABEL: Record<JobMatch["relevance"], string> = {
  strong: "Great match",
  potential: "Good match",
  low: "Weak match",
  not_relevant: "Not your role",
};

const STYLE: Record<JobMatch["relevance"], string> = {
  strong: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  potential: "bg-amber-100 text-amber-800 ring-amber-200",
  low: "bg-gray-100 text-gray-600 ring-gray-200",
  not_relevant: "bg-gray-50 text-gray-400 ring-gray-200",
};

/** `showScore={false}` inside a startup card, whose corner badge already shows the percentage. */
export function MatchBadge({ match, showScore = true }: { match: JobMatch; showScore?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STYLE[match.relevance]}`}>
      {MATCH_LABEL[match.relevance]}
      {showScore && match.relevance !== "not_relevant" && <span className="font-normal opacity-80">· {match.match_score}%</span>}
    </span>
  );
}

/** The whole match in one sentence: role · skills · location · experience (and why it was marked down). */
export function matchSummary(match: JobMatch): string {
  const r = match.role_match;
  const role =
    r.level === "strong" ? `${r.matched_role ?? "Your target"} role` : r.level === "partial" ? "Tech role, not one of your targets" : "Not one of your target roles";
  const listed = match.matched_skills.length + match.missing_skills.length;
  const missing = match.missing_skills.slice(0, 2);
  const skills = listed
    ? `you have ${match.matched_skills.length} of ${listed} skills${missing.length ? ` (missing ${missing.join(", ")}${match.missing_skills.length > 2 ? "…" : ""})` : ""}`
    : null;
  const parts = [role, skills, match.location_match.label, match.experience_match.label].filter(Boolean);
  return (match.cap_reason ? `${match.cap_reason} — ` : "") + parts.join(" · ");
}

/** One-line "why" shown under a job. */
export function MatchLine({ match }: { match: JobMatch }) {
  return <p className={`mt-1 text-xs ${match.cap_reason ? "text-rose-700" : "text-gray-600"}`}>{matchSummary(match)}</p>;
}
