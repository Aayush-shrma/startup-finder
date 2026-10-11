"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { StartupView } from "@/lib/types";

const DISMISS_KEY = "dsf.gettingStarted.dismissed";

/**
 * First-run checklist on the dashboard. Each step has its own call to action and ticks itself off
 * from real data (saved startups, tracked applications). Hidden once done or dismissed.
 */
export function GettingStarted({ startups, onShowBest }: { startups: StartupView[]; onShowBest: () => void }) {
  const [dismissed, setDismissed] = useState(true); // assume hidden until we've read storage (no flash)
  const [reviewed, setReviewed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
      setReviewed(localStorage.getItem(DISMISS_KEY + ".reviewed") === "1");
      setCopiedLink(localStorage.getItem(DISMISS_KEY + ".link") === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const apps = startups.flatMap((s) => s.applications);
  const saved = apps.length > 0;
  const tracked = apps.some((a) => ["Applied", "Interview", "Offer"].includes(a.status));
  const hasMatches = startups.some((s) => s.relevant_jobs > 0);

  const mark = (key: string, set: (v: boolean) => void) => {
    set(true);
    try {
      localStorage.setItem(DISMISS_KEY + key, "1");
    } catch {}
  };

  const steps = [
    { done: true, title: "Set up your profile", body: "Done. Edit it any time under My profile.", cta: null },
    {
      done: reviewed,
      title: "Look at your best match",
      body: "Open “Why this match?” to see what fits and what's missing.",
      cta: hasMatches ? (
        <button
          onClick={() => {
            mark(".reviewed", setReviewed);
            onShowBest();
          }}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          Show my best match
        </button>
      ) : (
        <span className="text-xs text-gray-400">Matches appear after the first search</span>
      ),
    },
    {
      done: saved,
      title: "Save a startup you like",
      body: "Tap ☆ Save on a card to keep it in your Applications list.",
      cta: (
        <button onClick={onShowBest} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">
          Browse startups
        </button>
      ),
    },
    {
      done: tracked,
      title: "Track an application",
      body: "After applying, set the job's status to Applied so you remember.",
      cta: (
        <Link href="/applications" className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">
          Open Applications
        </Link>
      ),
    },
    {
      done: copiedLink,
      title: "Keep your private link",
      body: "Open your profile on your phone or another laptop.",
      cta: (
        <Link href="/settings" onClick={() => mark(".link", setCopiedLink)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">
          Get my link
        </Link>
      ),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (dismissed || doneCount === steps.length) return null;

  return (
    <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4" aria-label="Get started">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Get started — {doneCount} of {steps.length} done</h2>
          <div className="mt-1.5 h-1.5 w-48 overflow-hidden rounded-full bg-indigo-100">
            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            try {
              localStorage.setItem(DISMISS_KEY, "1");
            } catch {}
          }}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          Hide
        </button>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.slice(1).map((s) => (
          <li key={s.title} className={`flex flex-col justify-between gap-2 rounded-lg bg-white p-3 ${s.done ? "opacity-60" : ""}`}>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${s.done ? "bg-emerald-500 text-white" : "border border-gray-300"}`}>
                  {s.done ? "✓" : ""}
                </span>
                {s.title}
              </div>
              <p className="mt-1 text-xs text-gray-500">{s.body}</p>
            </div>
            {!s.done && <div>{s.cta}</div>}
          </li>
        ))}
      </ol>
    </section>
  );
}
