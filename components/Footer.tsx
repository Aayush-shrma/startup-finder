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
 * One-line site footer. Every item after the first gets its "·" from CSS with the same margin on
 * both sides, so the spacing is identical between all items (and on wrapped lines).
 * Extra bottom padding on phones so it clears the tab bar.
 */
export function Footer() {
  return (
    <footer className="border-t border-gray-200 pb-24 pt-6 sm:pb-8">
      <nav aria-label="Footer" className="mx-auto max-w-6xl px-4">
        <ul className="flex flex-wrap items-center gap-y-2 text-[13px] leading-5 [&>li+li]:before:mx-2.5 [&>li+li]:before:text-gray-300 [&>li+li]:before:content-['·']">
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
