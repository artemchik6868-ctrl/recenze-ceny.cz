import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { SERVICES_PATH } from "@/lib/site";

type Crumb = { label: string; to?: string };

export function ServiceLayout({
  title,
  lead,
  crumbs,
  children,
}: {
  title: string;
  lead: string;
  crumbs: Crumb[];
  children: ReactNode;
}) {
  const T = useI18n();
  const href = useHref();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:max-w-4xl md:px-6 md:py-16">
      <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to={href("/")} className="hover:text-foreground">
          {T.product.crumbHome}
        </Link>
        <span className="mx-2">/</span>
        <Link to={href(SERVICES_PATH)} className="hover:text-foreground">
          {T.services.breadcrumb}
        </Link>
        {crumbs.map((c) => (
          <span key={c.label}>
            <span className="mx-2">/</span>
            {c.to ? (
              <Link to={href(c.to)} className="hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className="text-foreground">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <header className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cta">
          {T.services.hubEyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{lead}</p>
      </header>

      {children}

      <p className="mt-10 rounded-[10px] border border-border bg-stone px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {T.services.disclaimer}
      </p>
    </div>
  );
}
