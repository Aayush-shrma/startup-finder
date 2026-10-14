// Layout for the plain text pages linked from the footer (About, Privacy, Terms, Contact).
import { PageHeader } from "./ui";

export function InfoPage({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="space-y-7 text-[15px] leading-relaxed text-gray-700">{children}</div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

export function Bullets({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}

export const textLink = "font-medium text-brand-700 underline-offset-2 hover:underline";
