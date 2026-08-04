import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { SITE } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const T = useI18n();
  const href = useHref();

  return (
    <header className="relative z-40 border-b border-border/70 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-5 md:px-6">
        <Link
          to={href("/")}
          className="group flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="font-display text-[1.65rem] font-semibold leading-none tracking-tight text-primary">
            {SITE.name}
          </span>
          <span className="hidden h-7 w-px bg-border sm:block" aria-hidden />
          <span className="hidden max-w-[11rem] truncate text-[11px] font-medium leading-snug text-muted-foreground sm:block">
            {T.taglineShort}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
          <Link
            to={href("/")}
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground font-semibold" }}
            className="transition-colors hover:text-foreground"
          >
            {T.nav.home}
          </Link>
          <Link
            to={href("/category")}
            activeProps={{ className: "text-foreground font-semibold" }}
            className="transition-colors hover:text-foreground"
          >
            {T.nav.categories}
          </Link>
          <Link
            to={href("/product")}
            activeProps={{ className: "text-foreground font-semibold" }}
            className="transition-colors hover:text-foreground"
          >
            {T.nav.products}
          </Link>
          <Link
            to={href("/about")}
            activeProps={{ className: "text-foreground font-semibold" }}
            className="transition-colors hover:text-foreground"
          >
            {T.nav.about}
          </Link>
          <Link
            to={href("/delivery")}
            activeProps={{ className: "text-foreground font-semibold" }}
            className="transition-colors hover:text-foreground"
          >
            {T.nav.delivery}
          </Link>
          <Link
            to={href("/faq")}
            activeProps={{ className: "text-foreground font-semibold" }}
            className="transition-colors hover:text-foreground"
          >
            {T.nav.faq}
          </Link>
          <Link
            to={href("/sluzby")}
            activeProps={{ className: "text-foreground font-semibold" }}
            className="transition-colors hover:text-foreground"
          >
            {T.nav.services}
          </Link>
          <Link
            to={href("/clanky")}
            activeProps={{ className: "text-foreground font-semibold" }}
            className="transition-colors hover:text-foreground"
          >
            {T.nav.blog}
          </Link>
          <Link
            to={href("/contact")}
            activeProps={{ className: "text-foreground font-semibold" }}
            className="cta-underline font-semibold text-cta"
          >
            {T.nav.contact}
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-card"
          >
            <span className="block h-[2px] w-5 bg-foreground transition-all before:absolute before:h-[2px] before:w-5 before:-translate-y-[6px] before:bg-foreground before:content-[''] after:absolute after:h-[2px] after:w-5 after:translate-y-[6px] after:bg-foreground after:content-['']" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/60 bg-stone md:hidden">
          <div className="mx-auto max-w-7xl px-5 py-4">
            <ul className="flex flex-col gap-1 text-base">
              {[
                { to: href("/"), label: T.nav.home },
                { to: href("/category"), label: T.nav.categories },
                { to: href("/product"), label: T.nav.products },
                { to: href("/about"), label: T.nav.about },
                { to: href("/delivery"), label: T.nav.delivery },
                { to: href("/payment"), label: T.nav.payment },
                { to: href("/faq"), label: T.nav.faq },
                { to: href("/sluzby"), label: T.nav.services },
                { to: href("/clanky"), label: T.nav.blog },
                { to: href("/contact"), label: T.nav.contact },
              ].map((i) => (
                <li key={i.to}>
                  <Link
                    to={i.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-[10px] px-3 py-3 text-foreground hover:bg-background"
                  >
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </header>
  );
}
