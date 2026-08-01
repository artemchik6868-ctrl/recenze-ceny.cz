const API_BASE = "https://t-api.org";

async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type TerraleadsApiResponse<T> = {
  status: string;
  error: string | null;
  data: T;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

export function terraleadsUserId(): number {
  return Number(requireEnv("TERRALEADS_USER_ID"));
}

export function terraleadsApiKey(): string {
  return requireEnv("TERRALEADS_API_KEY");
}

function checksum(jsonBody: string, apiKey: string): Promise<string> {
  return sha1Hex(jsonBody + apiKey);
}

async function terraleadsFetch(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, init);
}

export function terraleadsPartnerIp(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  if (Array.isArray(data)) return (data[0] as { ip?: string })?.ip;
  return (data as { ip?: string }).ip;
}

/** POST to TerraLeads API with SHA1 check_sum auth. */
export async function terraleadsApiPost<TData, TResult = unknown>(
  model: string,
  method: string,
  data: TData,
): Promise<TerraleadsApiResponse<TResult>> {
  const userId = terraleadsUserId();
  const apiKey = terraleadsApiKey();
  const body = JSON.stringify({ user_id: userId, data });
  const url = `${API_BASE}/api/${model}/${method}?check_sum=${await checksum(body, apiKey)}`;
  const res = await terraleadsFetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "recenze-ceny-sync/1.0",
    },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    const hint =
      res.status === 403
        ? model === "offer" && method === "list"
          ? " (offer/list forbidden — not IP whitelist; ask TerraLeads manager to enable Offer API / catalog access for user_id; stream/list and lead/create may still work)"
          : " (403 Forbidden — if ip/get works, this is not IP whitelist; check account API permissions)"
        : "";
    throw new Error(`TerraLeads HTTP ${res.status}${hint}: ${text.slice(0, 400)}`);
  }
  let json: TerraleadsApiResponse<TResult>;
  try {
    json = JSON.parse(text) as TerraleadsApiResponse<TResult>;
  } catch {
    throw new Error(`TerraLeads invalid JSON: ${text.slice(0, 400)}`);
  }
  if (json.status !== "ok") {
    throw new Error(String(json.error ?? "TerraLeads API error"));
  }
  return json;
}

const CPS_FIELD_RE = /^(payment_type|pay_model|pay_type|goal|format|type|model|offer_type)$/i;

/** True when raw JSON contains an explicit CPS payment marker. */
export function isExplicitCpsOffer(obj: Record<string, unknown>): boolean {
  const stack: unknown[] = [obj];
  let depth = 0;
  while (stack.length && depth < 6) {
    const n = stack.length;
    depth++;
    for (let i = 0; i < n; i++) {
      const cur = stack.shift();
      if (!cur || typeof cur !== "object") continue;
      if (Array.isArray(cur)) {
        for (const item of cur) stack.push(item);
        continue;
      }
      for (const [key, val] of Object.entries(cur as Record<string, unknown>)) {
        if (typeof val === "string" && CPS_FIELD_RE.test(key) && /\bcps\b/i.test(val)) {
          return true;
        }
        if (val && typeof val === "object") stack.push(val);
      }
    }
  }
  return false;
}

/** Collect unique keys from sample objects (discovery helper). */
export function collectJsonKeys(samples: Record<string, unknown>[], maxDepth = 2): string[] {
  const keys = new Set<string>();
  function walk(obj: unknown, prefix: string, depth: number) {
    if (!obj || typeof obj !== "object" || depth > maxDepth) return;
    if (Array.isArray(obj)) {
      for (const item of obj.slice(0, 2)) walk(item, prefix, depth + 1);
      return;
    }
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${k}` : k;
      keys.add(path);
      if (v && typeof v === "object") walk(v, path, depth + 1);
    }
  }
  for (const s of samples) walk(s, "", 0);
  return [...keys].sort();
}
