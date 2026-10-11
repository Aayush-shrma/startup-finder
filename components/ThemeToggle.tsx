"use client";
import { useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";
export const THEME_KEY = "dsf.theme";

/** Runs in <head> before first paint so the page never flashes the wrong theme. */
export const themeBootScript = `(function(){try{var m=localStorage.getItem('${THEME_KEY}')||'system';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

function apply(mode: ThemeMode) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

const NEXT: Record<ThemeMode, ThemeMode> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<ThemeMode, string> = { system: "System theme", light: "Light theme", dark: "Dark theme" };

/** Cycles System → Light → Dark. "System" follows the device setting, live. */
export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false); // don't touch the theme until the saved choice is read

  useEffect(() => {
    let saved: ThemeMode = "system";
    try {
      saved = (localStorage.getItem(THEME_KEY) as ThemeMode) || "system";
    } catch {}
    setMode(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    apply(mode);
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode, ready]);

  function cycle() {
    const next = NEXT[mode];
    setMode(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${LABEL[mode]} — switch to ${LABEL[NEXT[mode]].toLowerCase()}`}
      title={`${LABEL[mode]} (click to change)`}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {mode === "light" && <path d="M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6 19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4 19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />}
        {mode === "dark" && <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}
        {mode === "system" && <path d="M4 5h16v11H4zM8 20h8M12 16v4" />}
      </svg>
    </button>
  );
}
