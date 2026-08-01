import { createFileRoute } from "@tanstack/react-router";
import { LegalPageView, legalHead } from "@/components/LegalPageView";
import { getLegalByLang } from "@/lib/legal";
import { useLang } from "@/lib/lang";
import { pathLang } from "@/lib/route-lang";

export const Route = createFileRoute("/about")({
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const page = getLegalByLang("about", lang)!;
    return legalHead(page, "/about", lang);
  },
  component: AboutPage,
});

function AboutPage() {
  const lang = useLang();
  const page = getLegalByLang("about", lang);
  if (!page) return null;
  return <LegalPageView page={page} />;
}
