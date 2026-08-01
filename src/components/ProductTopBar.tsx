import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { SITE } from "@/lib/site";

/** Minimal PDP header — brand wordmark only. */
export function ProductTopBar() {
  const href = useHref();
  const T = useI18n();

  return (
    <header className="border-b border-border/70 bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-5 md:px-6">
        <Link to={href("/")} className="flex items-center gap-3">
          <span className="font-display text-xl font-semibold tracking-tight text-primary">
            {SITE.name}
          </span>
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            {T.taglineShort}
          </span>
        </Link>
      </div>
    </header>
  );
}
