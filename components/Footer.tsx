import Link from "next/link";

export const CONTACT = {
  email: "sakshig1606@gmail.com",
  github: "https://github.com/SakshiGaikwad05",
  repo: "https://github.com/SakshiGaikwad05/startup-finder",
  portfolio: "https://www.sakshii.tech",
};

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

const item = "text-gray-600 transition-colors hover:text-gray-900";

/**
 * Site footer, items spread evenly across the full width (tablet and up). On phones, where they
 * wrap onto several lines, they're centred with an even gap instead.
 * Extra bottom padding on phones so it clears the tab bar.
 */
export function Footer() {
  return (
    <footer className="border-t border-gray-200 pb-24 pt-6 sm:pb-8">
      <nav aria-label="Footer" className="mx-auto max-w-6xl px-4">
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] leading-5 sm:justify-between sm:gap-x-4">
          <li className="text-gray-500">© {new Date().getFullYear()} Daily Startup Finder</li>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={item}>
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <a href={`mailto:${CONTACT.email}`} className={item}>
              {CONTACT.email}
            </a>
          </li>
          <li>
            <a href={CONTACT.github} target="_blank" rel="noreferrer" className={item}>
              GitHub
            </a>
          </li>
          <li>
            <a href={CONTACT.portfolio} target="_blank" rel="noreferrer" className={item}>
              Portfolio
            </a>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
