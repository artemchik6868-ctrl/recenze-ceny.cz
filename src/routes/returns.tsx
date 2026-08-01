import { createFileRoute } from "@tanstack/react-router";
import { LegalPageView, legalHead } from "@/components/LegalPageView";
import { getLegalByLang } from "@/lib/legal";
import { useLang } from "@/lib/lang";
import { pathLang } from "@/lib/route-lang";

export const Route = createFileRoute("/returns")({
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const page = getLegalByLang("returns", lang)!;
    return legalHead(page, "/returns", lang);
  },
  component: ReturnsPage,
});

function ReturnsPage() {
  const lang = useLang();
  const page = getLegalByLang("returns", lang);
  if (!page) return null;
  return <LegalPageView page={page} />;
}
