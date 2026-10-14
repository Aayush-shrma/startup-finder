import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, InfoPage, Section, textLink } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Terms · Daily Startup Finder",
  description: "Terms for using Daily Startup Finder.",
};

export default function TermsPage() {
  return (
    <InfoPage title="Terms" subtitle="Last updated October 2026">
      <Section title="The service">
        <p>
          Daily Startup Finder is a free tool that collects public information about startups, their funding and their open jobs,
          and matches it to your profile. It isn&apos;t an employer, recruiter or job agency. Applications go directly to the
          companies through their own sites.
        </p>
      </Section>

      <Section title="Accuracy">
        <p>
          Jobs, funding and company details come from third-party public sources and can change or be wrong. Always check a job on
          the company&apos;s own page before applying. Match scores are a guide, not a promise of an interview or offer.
        </p>
      </Section>

      <Section title="Fair use">
        <Bullets>
          <li>Use the app for your own job search or research.</li>
          <li>Don&apos;t try to overload, scrape or break into the app or its API.</li>
          <li>Be respectful when you contact companies using emails shown here.</li>
        </Bullets>
      </Section>

      <Section title="No warranty">
        <p>
          The service is provided as is, without warranties of any kind. To the extent the law allows, its creator isn&apos;t liable
          for losses arising from using it.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          These terms may change as the app does. Your data is handled as described in the{" "}
          <Link href="/privacy" className={textLink}>
            Privacy page
          </Link>
          .
        </p>
      </Section>
    </InfoPage>
  );
}
