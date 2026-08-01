import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductTopBar } from "@/components/ProductTopBar";
import { Ga4Script } from "@/components/Ga4";

import { useI18n, getI18n } from "@/lib/i18n";
import { useLang, getLangFromPath, LANG_HTML, LANG_LOCALE, DEFAULT_LANG } from "@/lib/lang";
import { headPathname } from "@/lib/head-pathname";
import { isProductPath } from "@/lib/route-lang";
import { useHref } from "@/lib/lang-link";
import { SITE } from "@/lib/site";
import { notFoundHead } from "@/lib/page-head";


function NotFoundComponent() {
  const T = useI18n();
  const href = useHref();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="font-display text-7xl text-primary">404</div>
        <h1 className="mt-3 font-display text-2xl text-foreground">
          {T.notFound.h}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{T.notFound.sub}</p>
        <div className="mt-6">
          <Link
            to={href("/")}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {T.notFound.back}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const T = useI18n();
  const lang = useLang();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl text-foreground">{T.error.h}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{T.error.sub}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {T.error.retry}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {T.error.goHome}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: (ctx) => {
      const pathname = headPathname(ctx);
      if (ctx.matches.some((m) => m.status === "notFound")) {
        return notFoundHead(pathname, DEFAULT_LANG);
      }
      const lang = getLangFromPath(pathname);
      const T = getI18n(lang);
      const onProduct = isProductPath(pathname);
      const essentialMeta = [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#0B3D4A" },
        { httpEquiv: "content-language", content: LANG_HTML[lang] },
      ];
      return {
        meta: essentialMeta,

        links: [
          { rel: "preload" as const, as: "font" as const, href: "/fonts/Newsreader-latin.woff2", type: "font/woff2", crossOrigin: "anonymous" },
          { rel: "preload" as const, as: "font" as const, href: "/fonts/Newsreader-latin-ext.woff2", type: "font/woff2", crossOrigin: "anonymous" },
          { rel: "preload" as const, as: "font" as const, href: "/fonts/Manrope-latin.woff2", type: "font/woff2", crossOrigin: "anonymous" },
          { rel: "preload" as const, as: "font" as const, href: "/fonts/Manrope-latin-ext.woff2", type: "font/woff2", crossOrigin: "anonymous" },
          { rel: "preload", href: appCss, as: "style" },
          { rel: "stylesheet", href: appCss },
          { rel: "icon", href: "/favicon.ico", sizes: "any" },
          { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon.png" },
          { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        ],
        scripts: onProduct
          ? []
          : [
              {
                type: "application/ld+json",
                children: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  name: T.siteName,
                  url: SITE.url,
                  description: T.siteDescription,
                  email: SITE.email,
                  telephone: SITE.phoneDisplay,
                  areaServed: {
                    "@type": "Country",
                    name: "Czech Republic",
                  },
                  inLanguage: "cs-CZ",
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: SITE.address.line2,
                    addressLocality: SITE.address.city,
                    postalCode: SITE.address.postalCode,
                    addressCountry: SITE.address.country,
                  },
                  contactPoint: [
                    {
                      "@type": "ContactPoint",
                      telephone: SITE.phoneDisplay,
                      contactType: "customer support",
                      areaServed: "CZ",
                      availableLanguage: ["cs"],
                      hoursAvailable: {
                        "@type": "OpeningHoursSpecification",
                        dayOfWeek: [
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                        ],
                        opens: "09:00",
                        closes: "20:00",
                      },
                    },
                  ],
                }),
              },
              {
                type: "application/ld+json",
                children: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  name: T.siteName,
                  url: SITE.url,
                  inLanguage: LANG_LOCALE[lang],
                }),
              },
            ],
      };
    },
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = getLangFromPath(pathname);
  return (
    <html lang={LANG_HTML[lang]}>
      <head>
        <HeadContent />
        <Ga4Script />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onProduct = isProductPath(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        {onProduct ? (
          <>
            <ProductTopBar />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </>
        ) : (
          <>
            <Header />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </>
        )}
      </div>
    </QueryClientProvider>
  );
}
