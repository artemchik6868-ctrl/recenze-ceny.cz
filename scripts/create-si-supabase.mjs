/**
 * Create Supabase project recenze-ceny-si (EU) via Management API.
 * Requires SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens).
 *
 * Usage:
 *   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
 *   node scripts/create-si-supabase.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");

function loadEnv() {
  const env = {};
  if (!existsSync(envPath)) return env;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
  return env;
}

function setEnvKey(key, value) {
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  let found = false;
  const next = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) next.push(`${key}=${value}`);
  writeFileSync(envPath, next.join("\n") + "\n", "utf8");
}

const token = process.env.SUPABASE_ACCESS_TOKEN || loadEnv().SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN.");
  console.error("Create at https://supabase.com/dashboard/account/tokens then:");
  console.error('  $env:SUPABASE_ACCESS_TOKEN = "sbp_..."');
  console.error("  node scripts/create-si-supabase.mjs");
  process.exit(1);
}

const dbPassword = process.env.SUPABASE_DB_PASSWORD || randomBytes(18).toString("base64url");

async function api(path, opts = {}) {
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${opts.method ?? "GET"} ${path} → ${res.status}: ${text.slice(0, 400)}`);
  }
  return json;
}

async function waitHealthy(ref, maxMs = 600_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const st = await api(`/projects/${ref}`);
    if (st.status === "ACTIVE_HEALTHY") return st;
    console.log(`  status=${st.status}, waiting…`);
    await new Promise((r) => setTimeout(r, 15_000));
  }
  throw new Error(`Project ${ref} not healthy within ${maxMs}ms`);
}

const orgs = await api("/organizations");
if (!orgs?.length) throw new Error("No Supabase organizations found");
const orgId = orgs[0].id;
console.log(`Using org: ${orgs[0].name} (${orgId})`);

const existing = await api("/projects");
const found = existing?.find?.((p) => p.name === "recenze-ceny-si");
let project = found;
if (found) {
  console.log(`Project already exists: ${found.id} (${found.ref})`);
} else {
  console.log("Creating project recenze-ceny-si (eu-central-1)…");
  project = await api("/projects", {
    method: "POST",
    body: JSON.stringify({
      organization_id: orgId,
      name: "recenze-ceny-si",
      region: "eu-central-1",
      db_pass: dbPassword,
    }),
  });
  console.log(`Created ref=${project.ref ?? project.id}`);
}

const ref = project.ref ?? project.id;
await waitHealthy(ref);

const keys = await api(`/projects/${ref}/api-keys`);
const anon = keys.find((k) => k.name === "anon" || k.name === "anon key")?.api_key;
const service = keys.find((k) => k.name === "service_role")?.api_key;
const url = `https://${ref}.supabase.co`;

if (!anon || !service) throw new Error("Could not fetch API keys");

setEnvKey("SUPABASE_URL", url);
setEnvKey("VITE_SUPABASE_URL", url);
setEnvKey("SUPABASE_PUBLISHABLE_KEY", anon);
setEnvKey("VITE_SUPABASE_PUBLISHABLE_KEY", anon);
setEnvKey("SUPABASE_SERVICE_ROLE_KEY", service);
setEnvKey("VITE_SUPABASE_PROJECT_ID", ref);
setEnvKey("SUPABASE_PROJECT_ID", ref);
setEnvKey("SUPABASE_DB_PASSWORD", dbPassword);

console.log("\nUpdated .env with SI Supabase credentials.");
console.log(`  ref=${ref}`);
console.log(`  url=${url}`);
console.log("\nNext: npm run db:migrate");
