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
const Dot = () => (
  <span aria-hidden="true" className="text-gray-300">
    ·
  </span>
);

/** One-line site footer. Extra bottom padding on phones so it clears the tab bar. */
export function Footer() {
  return (
    <footer className="border-t border-gray-200 pb-24 pt-6 sm:pb-8">
      <nav aria-label="Footer" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 text-[13px]">
        <span className="text-gray-500">© {new Date().getFullYear()} Daily Startup Finder</span>
        {LINKS.map((l) => (
          <span key={l.href} className="contents">
            <Dot />
            <Link href={l.href} className={item}>
              {l.label}
            </Link>
          </span>
        ))}
        <Dot />
        <a href={`mailto:${CONTACT.email}`} className={item}>
          {CONTACT.email}
        </a>
        <Dot />
        <a href={CONTACT.github} target="_blank" rel="noreferrer" className={item}>
          GitHub
        </a>
        <Dot />
        <a href={CONTACT.portfolio} target="_blank" rel="noreferrer" className={item}>
          Portfolio
        </a>
      </nav>
    </footer>
  );
}
