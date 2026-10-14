import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, InfoPage, Section, textLink } from "@/components/InfoPage";
import { CONTACT } from "@/components/Footer";
import { settings } from "@/config/settings";

export const metadata: Metadata = {
  title: "About · Daily Startup Finder",
  description: "What Daily Startup Finder does, where its data comes from, and who built it.",
};

export default function AboutPage() {
  return (
    <InfoPage title="About" subtitle="Find startups that are hiring people like you, with the reason for every match.">
      <Section title="What it does">
        <p>
          Daily Startup Finder looks for recently funded startups and their open jobs, then scores every job against your profile:
          role, skills, location and experience. You see which jobs fit, why, and where to apply.
        </p>
      </Section>

      <Section title="What you see">
        <Bullets>
          <li>Startups funded in the last 3 months, plus every Y Combinator batch of this year.</li>
          <li>Jobs posted in the last {settings.maxJobAgeDays} days, so listings are fresh.</li>
          <li>Funding amounts and dates only as a source reported them. YC dates are marked as estimates.</li>
          <li>Contact emails only when a company publishes them on its own website.</li>
        </Bullets>
      </Section>

      <Section title="Where the data comes from">
        <Bullets>
          <li>The Y Combinator company directory and YC company pages.</li>
          <li>Funding news: Inc42, Economic Times, Entrackr, YourStory, TechCrunch and Crunchbase News.</li>
          <li>Company websites and careers pages, and the Himalayas remote-jobs board.</li>
        </Bullets>
        <p>
          The app reads public pages only, respects robots.txt and waits between requests to the same site. It never invents
          jobs, funding or contact details.
        </p>
      </Section>

      <Section title="Open source">
        <p>
          The code is open source under the MIT license.{" "}
          <a href={CONTACT.repo} target="_blank" rel="noreferrer" className={textLink}>
            See it on GitHub
          </a>
          . Issues and pull requests are welcome.
        </p>
      </Section>

      <Section title="Who built it">
        <p>
          Built by Sakshi Gaikwad.{" "}
          <a href={CONTACT.portfolio} target="_blank" rel="noreferrer" className={textLink}>
            Portfolio
          </a>{" "}
          ·{" "}
          <a href={CONTACT.github} target="_blank" rel="noreferrer" className={textLink}>
            GitHub
          </a>{" "}
          ·{" "}
          <Link href="/contact" className={textLink}>
            Contact
          </Link>
        </p>
      </Section>
    </InfoPage>
  );
}
