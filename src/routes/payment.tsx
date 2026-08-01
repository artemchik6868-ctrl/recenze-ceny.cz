import { createFileRoute } from "@tanstack/react-router";
import { LegalPageView, legalHead } from "@/components/LegalPageView";
import { getLegalByLang } from "@/lib/legal";
import { useLang } from "@/lib/lang";
import { pathLang } from "@/lib/route-lang";

export const Route = createFileRoute("/payment")({
  head: ({ match }) => {
    const { lang } = pathLang(match.pathname);
    const page = getLegalByLang("payment", lang)!;
    return legalHead(page, "/payment", lang);
  },
  component: PaymentPage,
});

function PaymentPage() {
  const lang = useLang();
  const page = getLegalByLang("payment", lang);
  if (!page) return null;
  return <LegalPageView page={page} />;
}
