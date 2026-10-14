import type { Metadata } from "next";
import { InfoPage, Section, textLink } from "@/components/InfoPage";
import { CONTACT } from "@/components/Footer";
import { Icon, type IconName } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Contact · Daily Startup Finder",
  description: "How to reach the maker of Daily Startup Finder, report a bug or suggest a feature.",
};

function Row({ icon, label, href, text }: { icon: IconName; label: string; href: string; text: string }) {
  const external = href.startsWith("http");
  return (
    <li className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <Icon name={icon} className="h-5 w-5 text-gray-500" />
      <span className="w-24 shrink-0 text-sm text-gray-500">{label}</span>
      <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className={`${textLink} min-w-0 break-all`}>
        {text}
      </a>
    </li>
  );
}

export default function ContactPage() {
  return (
    <InfoPage title="Contact" subtitle="Questions, feedback or a data request? Get in touch.">
      <ul className="space-y-2">
        <Row icon="mail" label="Email" href={`mailto:${CONTACT.email}`} text={CONTACT.email} />
        <Row icon="github" label="GitHub" href={CONTACT.github} text="github.com/SakshiGaikwad05" />
        <Row icon="globe" label="Portfolio" href={CONTACT.portfolio} text="sakshii.tech" />
      </ul>

      <Section title="Bugs and feature ideas">
        <p>
          The quickest way is to{" "}
          <a href={`${CONTACT.repo}/issues/new/choose`} target="_blank" rel="noreferrer" className={textLink}>
            open an issue on GitHub
          </a>
          . Please don&apos;t paste your private link in an issue: it gives access to your profile.
        </p>
      </Section>

      <Section title="Deleting your data">
        <p>Email the address above with your private link, and your profile and tracking will be deleted.</p>
      </Section>
    </InfoPage>
  );
}
