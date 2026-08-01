import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

const { htmlToPlainText, normalizeLandingTextForLlm } = await import(
  pathToFileURL(resolve(root, "src/lib/landing-facts.ts")).href
);

const url = "https://czl2-wloss.wlossh.com";
const res = await fetch(url, {
  redirect: "follow",
  headers: {
    "user-agent": "Mozilla/5.0 (compatible; RecenzeCenyBot/1.0)",
    accept: "text/html",
    "accept-language": "cs-CZ,cs;q=0.9",
  },
});
const html = await res.text();
const plain = htmlToPlainText(html);
const fed = normalizeLandingTextForLlm(plain);

function snips(re: RegExp, n = 8): string[] {
  const out: string[] = [];
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = r.exec(plain)) && out.length < n) {
    const a = Math.max(0, m.index - 90);
    out.push(plain.slice(a, m.index + m[0].length + 90).replace(/\s+/g, " "));
  }
  return out;
}

console.log(JSON.stringify({ status: res.status, finalUrl: res.url, plainLen: plain.length, fedLen: fed.length }, null, 2));
console.log("\n=== kaps* matches ===");
console.log(snips(/kaps\w*/i).join("\n---\n") || "(none)");
console.log("\n=== kapky/kapek/kapka ===");
console.log(snips(/kapk[ayeů]|kapek|kapka/i).join("\n---\n") || "(none)");
console.log("\n=== drops/drop ===");
console.log(snips(/\bdrop[s]?\b/i).join("\n---\n") || "(none)");
console.log("\n=== 'jedna kapsle' / dosage-ish ===");
console.log(snips(/jedna kapsle|kapsle W-Loss|1 kaps/i).join("\n---\n") || "(none)");
console.log("\n=== first 1500 of FED text ===");
console.log(fed.slice(0, 1500));
