import type { Metadata } from "next";
import { Bullets, InfoPage, Section, textLink } from "@/components/InfoPage";
import { CONTACT } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy · Daily Startup Finder",
  description: "What Daily Startup Finder stores, what it doesn't, and how to have your data deleted.",
};

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy" subtitle="Last updated October 2026">
      <Section title="In short">
        <p>
          There are no accounts and no passwords. The app stores the profile you give it so it can match jobs to you. It doesn't
          use ads, analytics or tracking, and it doesn't sell or share your data.
        </p>
      </Section>

      <Section title="What is stored">
        <Bullets>
          <li>
            <b>Your profile:</b> skills, target roles, years of experience, preferred locations and startup types, and your first
            name if you add it.
          </li>
          <li>
            <b>Your tracking:</b> startups and jobs you save, application statuses and notes, and startups you pin.
          </li>
          <li>
            <b>A login cookie</b> (<code>sf_uid</code>): a random token that links this browser to your profile. It contains
            nothing about you, can&apos;t be read by page scripts, and lasts one year. The database keeps only a one-way hash of
            it, and signing out deletes it.
          </li>
          <li>
            <b>Browser storage</b> on your device only: your theme, dashboard filters and whether you hid the getting-started
            checklist.
          </li>
        </Bullets>
      </Section>

      <Section title="Your resume">
        <p>
          If you upload a resume, the PDF is read in memory to suggest skills and roles, then discarded. The file itself is never
          saved. Only the skills and roles you confirm become part of your profile.
        </p>
      </Section>

      <Section title="Your private link">
        <p>
          Your private link carries its own random token, separate from your login cookie, and the database keeps only a hash
          of it. Anyone with the link can open your profile, so keep it to yourself. Getting a new link on My profile turns the
          old one off.
        </p>
      </Section>

      <Section title="Rate limiting">
        <p>Your IP address is kept briefly in memory to limit how often requests can be made. It isn&apos;t written to the database.</p>
      </Section>

      <Section title="Where data is hosted">
        <p>The app runs on Render and the database on Neon, both in the United States.</p>
      </Section>

      <Section title="Company information">
        <p>
          Startup details, founder names and LinkedIn profiles come from public sources such as Y Combinator company pages.
          Company emails are shown only when the company publishes them on its own website.
        </p>
      </Section>

      <Section title="Deleting your data">
        <p>
          Signing out removes the cookie from that browser. To have your profile and tracking deleted from the database, email{" "}
          <a href={`mailto:${CONTACT.email}`} className={textLink}>
            {CONTACT.email}
          </a>{" "}
          with your private link, and it will be deleted.
        </p>
      </Section>
    </InfoPage>
  );
}
