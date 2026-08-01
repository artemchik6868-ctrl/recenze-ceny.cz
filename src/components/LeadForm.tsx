import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { submitLead, type LeadInput } from "@/lib/leads.functions";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { PhoneInputCS } from "@/components/PhoneInputCS";
import { formatPhoneE164CS, isValidPhoneCSDigits } from "@/lib/phone.cs";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; leadId: string }
  | { kind: "error"; message: string };

export function LeadForm({
  offerId,
  source = "cpa_tl",
  compact = false,
  priceEUR = null,
}: {
  offerId?: number;
  source?: "cpa_tl" | "kma" | "m1_top" | "cpagetti" | "adcombo" | "shakes" | "terraleads";
  compact?: boolean;
  priceEUR?: number | null;
}) {
  const T = useI18n();
  const send = useServerFn(submitLead);
  const href = useHref();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [digits, setDigits] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();

    if (name.length < 2) {
      setState({ kind: "error", message: T.form.errors.name });
      return;
    }
    if (!isValidPhoneCSDigits(digits)) {
      setState({ kind: "error", message: T.form.errors.phone });
      return;
    }

    const payload: LeadInput = {
      offerId: offerId ?? null,
      source,
      name,
      phone: formatPhoneE164CS(digits),
    };
    setState({ kind: "submitting" });
    try {
      const result = await send({ data: payload });
      if (result.ok) {
        setState({ kind: "success", leadId: result.leadId });
        form.reset();
        setDigits("");
      } else {
        setState({ kind: "error", message: result.error });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : T.form.errors.generic;
      setState({ kind: "error", message: msg });
    }
  }

  if (state.kind === "success") {
    return (
      <div className="animate-fade-up rounded-xl border border-[color:var(--success)]/30 bg-[oklch(0.97_0.04_150)] p-6 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--success)] text-white">
          ✓
        </div>
        <div className="mt-3 font-display text-2xl text-primary">{T.form.thankYou}</div>
        <p className="mt-2 text-sm text-muted-foreground">{T.form.thankYouBody(state.leadId)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <div className="font-display text-xl text-foreground">{T.product.quickOrder}</div>
      )}

      <div>
        <label htmlFor="lead-name" className="mb-1.5 block text-sm font-medium text-foreground">
          {T.form.name}
        </label>
        <input
          id="lead-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder={T.form.namePh}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{T.form.phone}</label>
        <PhoneInputCS
          value={digits}
          onChange={setDigits}
          placeholder={T.form.phonePh}
          required
        />
      </div>

      {state.kind === "error" && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={state.kind === "submitting"}
        className="w-full rounded-[10px] bg-cta px-6 py-3.5 text-base font-semibold text-cta-foreground shadow-cta transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {state.kind === "submitting"
          ? T.form.submitting
          : priceEUR == null
            ? T.form.submit
            : T.form.submitWithPrice(priceEUR)}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        {T.form.privacy.before}
        <Link to={href("/privacy")} className="underline underline-offset-2 hover:text-foreground">
          {T.form.privacy.anchor}
        </Link>
        {T.form.privacy.after}
      </p>
    </form>
  );
}
