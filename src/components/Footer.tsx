import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { SITE } from "@/lib/site";

export function Footer() {
  const T = useI18n();
  const href = useHref();

  const links = [
    { to: "/about", label: T.nav.about },
    { to: "/medical-expert", label: T.footer.medicalExpert },
    { to: "/clanky", label: T.footer.blog },
    { to: "/sluzby", label: T.footer.services },
    { to: "/delivery", label: T.nav.delivery },
    { to: "/payment", label: T.footer.payment },
    { to: "/returns", label: T.footer.returns },
    { to: "/faq", label: T.nav.faq },
    { to: "/contact", label: T.nav.contact },
    { to: "/privacy", label: T.footer.privacy },
    { to: "/terms", label: T.footer.terms },
  ];

  return (
    <footer className="mt-28 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:px-6">
        <div>
          <div className="font-display text-3xl font-semibold tracking-tight">{T.siteName}</div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/75">
            {T.tagline}
          </p>
          <div className="mt-8 space-y-2 text-sm text-primary-foreground/80">
            <a href={SITE.phoneHref} className="block transition-opacity hover:opacity-100">
              {SITE.phoneDisplay}
            </a>
            <a href={`mailto:${SITE.email}`} className="block transition-opacity hover:opacity-100">
              {SITE.email}
            </a>
            <p className="pt-2 text-xs text-primary-foreground/55">
              {SITE.address.line2}, {SITE.address.postalCode} {SITE.address.city}
            </p>
            <p className="text-xs text-primary-foreground/55">{SITE.hours}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/50">
            {T.footer.sitemap}
          </p>
          <ul className="mt-5 columns-2 gap-x-8 text-sm text-primary-foreground/80">
            {links.map((l) => (
              <li key={l.to} className="mb-2.5 break-inside-avoid">
                <Link to={href(l.to)} className="cta-underline hover:text-primary-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto max-w-7xl px-5 py-6 text-xs text-primary-foreground/55 md:px-6">
          <p className="mb-4 max-w-3xl leading-relaxed">{T.footer.disclaimer}</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              © {new Date().getFullYear()} {T.siteName}. {T.footer.rights}
            </span>
            <span>{T.footer.madeIn}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
