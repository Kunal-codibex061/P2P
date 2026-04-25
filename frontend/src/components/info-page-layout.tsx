import Link from "next/link";

type InfoSection = {
  title: string;
  body: string;
};

interface InfoPageLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: InfoSection[];
  primaryAction?: {
    label: string;
    href: string;
  };
}

export function InfoPageLayout({
  eyebrow,
  title,
  subtitle,
  sections,
  primaryAction,
}: InfoPageLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <section className="rounded-3xl border accent-border-soft bg-gradient-to-br from-[color:var(--accent-soft)] via-white to-sky-50 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] accent-text">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">{subtitle}</p>
        {primaryAction ? (
          <Link
            href={primaryAction.href}
            className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium !text-white transition hover:bg-slate-700"
          >
            {primaryAction.label}
          </Link>
        ) : null}
      </section>

      <section className="space-y-4">
        {sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
