import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { resolveClientIp } from "./client-ip.server";
import { loadOffers } from "./offers.server";
import { submitKmaLead } from "./kma.server";
import { submitM1TopLead } from "./m1-top-sync.server";
import { submitCpagettiLead } from "./cpagetti-sync.server";
import { submitAdcomboLead } from "./adcombo-sync.server";
import { submitShakesLead } from "./shakes-sync.server";
import { parsePhoneCS, CZ_PHONE_ERROR_CS, CZ_PHONE_E164_RE } from "./phone.cs";
import { LEAD_ERRORS_CS } from "./lead-errors.cs";

const CPA_LEAD_ENDPOINT = "https://api.cpa.tl/api/lead/send";

const LeadSchema = z.object({
  offerId: z.number().int().positive().nullable().optional(),
  source: z.enum(["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes", "terraleads"]).default("cpa_tl"),
  name: z
    .string()
    .min(2, "Zadejte prosím jméno (alespoň 2 znaky).")
    .max(120)
    .regex(/^[\p{L}\s.'-]+$/u, "Pouze písmena"),
  phone: z
    .string()
    .transform((v) => parsePhoneCS(v)?.e164 ?? v)
    .pipe(z.string().regex(CZ_PHONE_E164_RE, CZ_PHONE_ERROR_CS)),
});

export type LeadInput = z.input<typeof LeadSchema>;

async function submitCpaLead(args: {
  offerId: number | null;
  name: string;
  phone: string;
  ip: string;
  userAgent: string;
  lang: "cs";
}): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const t = LEAD_ERRORS_CS;
  const apiKey = process.env.CPA_TL_API_KEY;
  if (!apiKey) return { ok: false, error: t.notConfigured };
  let offerId = args.offerId;
  if (!offerId) {
    try {
      const offers = await loadOffers();
      offerId =
        offers.find((o) => o.source === "cpa_tl")?.id ?? offers[0]?.id ?? null;
    } catch {
      offerId = null;
    }
  }
  if (!offerId) return { ok: false, error: t.noOffer };

  const body = new URLSearchParams({
    key: apiKey,
    id: `${offerId}-${Date.now()}`,
    offer_id: String(offerId),
    stream_hid: "",
    name: args.name,
    phone: args.phone,
    comments: "",
    country: "CZ",
    address: "",
    tz: "5",
    web_id: "",
    ip_address: args.ip,
    user_agent: args.userAgent,
  });

  try {
    const res = await fetch(CPA_LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let obj: { id?: string | number; errmsg?: string } = {};
    try {
      obj = JSON.parse(text);
    } catch {
      return { ok: false, error: t.badResponse };
    }
    if (obj.errmsg) return { ok: false, error: String(obj.errmsg) };
    return { ok: true, leadId: String(obj.id ?? "") };
  } catch (err) {
    console.error("CPA lead submit failed:", err);
    return { ok: false, error: t.networkError };
  }
}

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: LeadInput) => LeadSchema.parse(data))
  .handler(async ({ data }) => {
    const ip = resolveClientIp();
    const userAgent = getRequestHeader("user-agent") || "";
    const referer = getRequestHeader("referer") || "https://recenze-ceny.cz/";
    const lang = "cs" as const;
    const noOffer = LEAD_ERRORS_CS.noOffer;
    const apiLang = "cs" as const;

    if (data.source === "kma") {
      if (!data.offerId) return { ok: false as const, error: noOffer };
      const result = await submitKmaLead({
        offerId: data.offerId,
        name: data.name,
        phone: data.phone,
        ip,
        userAgent,
        referer,
        lang: apiLang,
      });
      return result.ok
        ? { ok: true as const, leadId: result.leadId }
        : { ok: false as const, error: result.error };
    }

    if (data.source === "m1_top") {
      if (!data.offerId) return { ok: false as const, error: noOffer };
      const result = await submitM1TopLead({
        offerId: data.offerId,
        name: data.name,
        phone: data.phone,
        ip,
        userAgent,
        referer,
        lang: apiLang,
      });
      return result.ok
        ? { ok: true as const, leadId: result.leadId }
        : { ok: false as const, error: result.error };
    }

    if (data.source === "cpagetti") {
      if (!data.offerId) return { ok: false as const, error: noOffer };
      const result = await submitCpagettiLead({
        offerId: data.offerId,
        name: data.name,
        phone: data.phone,
        ip,
        userAgent,
        lang: apiLang,
      });
      return result.ok
        ? { ok: true as const, leadId: result.leadId }
        : { ok: false as const, error: result.error };
    }

    if (data.source === "adcombo") {
      if (!data.offerId) return { ok: false as const, error: noOffer };
      const result = await submitAdcomboLead({
        offerId: data.offerId,
        name: data.name,
        phone: data.phone,
        ip,
        userAgent,
        referer,
      });
      return result.ok
        ? { ok: true as const, leadId: result.leadId }
        : { ok: false as const, error: result.error };
    }

    if (data.source === "shakes") {
      if (!data.offerId) return { ok: false as const, error: noOffer };
      const result = await submitShakesLead({
        offerId: data.offerId,
        name: data.name,
        phone: data.phone,
        ip,
        userAgent,
        referer,
      });
      return result.ok
        ? { ok: true as const, leadId: result.leadId }
        : { ok: false as const, error: result.error };
    }

    if (data.source === "terraleads") {
      if (!data.offerId) return { ok: false as const, error: noOffer };
      const { submitTerraleadsLead } = await import("./terraleads-sync.server");
      const result = await submitTerraleadsLead({
        offerId: data.offerId,
        name: data.name,
        phone: data.phone,
        ip,
        userAgent,
        referer,
      });
      return result.ok
        ? { ok: true as const, leadId: result.leadId }
        : { ok: false as const, error: result.error };
    }

    const result = await submitCpaLead({
      offerId: data.offerId ?? null,
      name: data.name,
      phone: data.phone,
      ip,
      userAgent,
      lang,
    });
    return result.ok
      ? { ok: true as const, leadId: result.leadId }
      : { ok: false as const, error: result.error };
  });
