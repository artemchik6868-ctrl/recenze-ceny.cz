import { createFileRoute } from "@tanstack/react-router";
import { LegalPageView, legalHead } from "@/components/LegalPageView";
import { getLegalByLang } from "@/lib/legal";
import { useLang } from "@/lib/lang";
import { pathLang } from "@/lib/route-lang";

export const Route = createFileRoute("/privacy")({
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const page = getLegalByLang("privacy", lang)!;
    return legalHead(page, "/privacy", lang);
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  const lang = useLang();
  const page = getLegalByLang("privacy", lang);
  if (!page) return null;
  return <LegalPageView page={page} />;
}
