import { createFileRoute } from "@tanstack/react-router";
import { LegalPageView, legalHead } from "@/components/LegalPageView";
import { getLegalByLang } from "@/lib/legal";
import { useLang } from "@/lib/lang";
import { pathLang } from "@/lib/route-lang";

export const Route = createFileRoute("/contact")({
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const page = getLegalByLang("contact", lang)!;
    return legalHead(page, "/contact", lang);
  },
  component: ContactPage,
});

function ContactPage() {
  const lang = useLang();
  const page = getLegalByLang("contact", lang);
  if (!page) return null;
  return <LegalPageView page={page} />;
}
