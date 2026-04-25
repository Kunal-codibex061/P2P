import Link from "next/link";

const footerLinks = [
  { label: "Explore", href: "/explore" },
  { label: "Search", href: "/search" },
  { label: "Categories", href: "/explore" },
  { label: "Help", href: "/help" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/95">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-slate-600">
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} RENTeasy</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-slate-600 hover:text-[color:var(--accent)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
