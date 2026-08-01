import fs from "node:fs";

const env = {};
for (const line of fs.readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const url = env.SUPABASE_URL;
const pub = env.SUPABASE_PUBLISHABLE_KEY;
const secret = env.SUPABASE_SERVICE_ROLE_KEY;

async function check(label, key) {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const rest = await fetch(`${url}/rest/v1/`, { headers });
  const storage = await fetch(`${url}/storage/v1/bucket`, { headers });
  const offers = await fetch(`${url}/rest/v1/offers?select=id&limit=1`, { headers });
  const body = await offers.text();
  console.log(label, {
    rest: rest.status,
    storage: storage.status,
    offers: offers.status,
    offersBody: body.slice(0, 120),
  });
}

console.log("project", env.SUPABASE_PROJECT_ID);
await check("publishable", pub);
await check("secret", secret);
