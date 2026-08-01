import { createFileRoute } from "@tanstack/react-router";
import { LegalPageView, legalHead } from "@/components/LegalPageView";
import { getLegalByLang } from "@/lib/legal";
import { useLang } from "@/lib/lang";
import { pathLang } from "@/lib/route-lang";

export const Route = createFileRoute("/faq")({
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const page = getLegalByLang("faq", lang)!;
    return legalHead(page, "/faq", lang);
  },
  component: FaqPage,
});

function FaqPage() {
  const lang = useLang();
  const page = getLegalByLang("faq", lang);
  if (!page) return null;
  return <LegalPageView page={page} />;
}
