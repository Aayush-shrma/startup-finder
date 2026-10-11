"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", short: "Startups", icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/jobs", label: "Jobs", short: "Jobs", icon: "M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm5 0V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" },
  { href: "/applications", label: "Applications", short: "Applied", icon: "M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1zM6 6h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm3 7 2 2 4-4" },
  { href: "/settings", label: "My profile", short: "Profile", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" },
];

/** Top bar on all screens (links only from tablet up) + a bottom tab bar on phones. */
export function NavBar() {
  const path = usePathname() ?? "";
  const onboarding = path.startsWith("/onboarding");
  const active = (href: string) => path === href || path.startsWith(href + "/") || (href === "/dashboard" && path.startsWith("/startups"));

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link href="/dashboard" className="whitespace-nowrap font-semibold text-gray-900">
            Daily Startup Finder
          </Link>
          {!onboarding &&
            NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`hidden text-sm sm:inline ${active(n.href) ? "font-medium text-indigo-700" : "text-gray-600 hover:text-gray-900"}`}
              >
                {n.label}
              </Link>
            ))}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {!onboarding && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
        >
          {NAV.map((n) => {
            const on = active(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${on ? "font-medium text-indigo-700" : "text-gray-500"}`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={on ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={n.icon} />
                </svg>
                {n.short}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
