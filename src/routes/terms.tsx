import { createFileRoute } from "@tanstack/react-router";
import { LegalPageView, legalHead } from "@/components/LegalPageView";
import { getLegalByLang } from "@/lib/legal";
import { useLang } from "@/lib/lang";
import { pathLang } from "@/lib/route-lang";

export const Route = createFileRoute("/terms")({
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const page = getLegalByLang("terms", lang)!;
    return legalHead(page, "/terms", lang);
  },
  component: TermsPage,
});

function TermsPage() {
  const lang = useLang();
  const page = getLegalByLang("terms", lang);
  if (!page) return null;
  return <LegalPageView page={page} />;
}
