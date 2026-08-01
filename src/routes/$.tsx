import { createFileRoute, Link } from "@tanstack/react-router";
import { getI18n } from "@/lib/i18n";
import { notFoundHead } from "@/lib/page-head";

export const Route = createFileRoute("/$")({
  head: ({ match }) => notFoundHead(match.pathname),
  component: NotFoundPage,
});

function NotFoundPage() {
  const T = getI18n("cs");
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="font-display text-7xl text-primary">404</div>
        <h1 className="mt-3 font-display text-2xl text-foreground">{T.notFound.h}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{T.notFound.sub}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {T.notFound.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
