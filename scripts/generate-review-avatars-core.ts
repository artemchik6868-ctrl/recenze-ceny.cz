/**
 * Generate review avatar WebP files via OpenRouter image API.
 * Run: node scripts/generate-review-avatars.mjs [--id=f1] [--force] [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { AVATAR_SPECS, NEW_AVATAR_IDS, buildPrompt, specById, type AvatarSpec } from "./review-avatar-specs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "reviews");
const BACKUP_DIR = path.join(OUT_DIR, "_backup");

const DEFAULT_MODEL = "google/gemini-2.5-flash-image";
const PAUSE_MS = 2500;
const OUTPUT_SIZE = 256;

type CliOpts = {
  ids: string[] | null;
  force: boolean;
  dryRun: boolean;
  onlyNew: boolean;
};

function loadEnv(): void {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    const key = m[1].trim();
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = v;
    }
  }
}

function parseArgs(argv: string[]): CliOpts {
  const out: CliOpts = { ids: null, force: false, dryRun: false, onlyNew: false };
  for (const raw of argv) {
    if (raw === "--force") out.force = true;
    else if (raw === "--dry-run") out.dryRun = true;
    else if (raw === "--only-new") out.onlyNew = true;
    else if (raw.startsWith("--id=")) {
      const id = raw.slice(5).trim();
      if (id) {
        out.ids ??= [];
        out.ids.push(id);
      }
    }
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseDataUrl(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("Invalid data URL");
  const meta = dataUrl.slice(0, comma);
  const b64 = dataUrl.slice(comma + 1);
  if (meta.includes(";base64")) return Buffer.from(b64, "base64");
  return Buffer.from(decodeURIComponent(b64), "utf8");
}

async function generateImageBytes(
  apiKey: string,
  model: string,
  prompt: string,
  attempt = 1,
): Promise<Buffer> {
  const chatUrl = "https://openrouter.ai/api/v1/chat/completions";
  const res = await fetch(chatUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://recenze-ceny.cz",
      "X-Title": "recenze-ceny-review-avatars",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
      image_config: {
        aspect_ratio: "1:1",
        image_size: "1K",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter chat/completions ${res.status}: ${body.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{
      message?: {
        images?: Array<{ image_url?: { url?: string } }>;
        content?: string | Array<{ type?: string; image_url?: { url?: string } }>;
      };
    }>;
  };

  const message = json.choices?.[0]?.message;
  const fromImages = message?.images?.[0]?.image_url?.url;
  if (fromImages) return parseDataUrl(fromImages);

  const content = message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      const url = part.image_url?.url;
      if (url) return parseDataUrl(url);
    }
  }

  if (typeof content === "string") {
    const dataMatch = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (dataMatch) return parseDataUrl(dataMatch[0]);
  }

  if (attempt < 3) {
    console.warn(`  retry ${attempt}/3 (no image in response)`);
    await sleep(PAUSE_MS * attempt);
    return generateImageBytes(apiKey, model, prompt, attempt + 1);
  }

  const preview =
    typeof content === "string"
      ? content.slice(0, 200)
      : JSON.stringify(message).slice(0, 300);
  throw new Error(`No image in OpenRouter response: ${preview}`);
}

async function postProcess(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
      fit: "cover",
      position: "attention",
    })
    .webp({ quality: 82 })
    .toBuffer();
}

function backupExisting(outPath: string): void {
  if (!fs.existsSync(outPath)) return;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = path.join(BACKUP_DIR, path.basename(outPath));
  fs.copyFileSync(outPath, backupPath);
}

async function processSpec(
  spec: AvatarSpec,
  opts: CliOpts,
  apiKey: string,
  model: string,
): Promise<void> {
  const prompt = buildPrompt(spec);
  const outPath = path.join(OUT_DIR, `${spec.id}.webp`);

  if (opts.dryRun) {
    console.log(`\n[${spec.id}] ${spec.gender} age ${spec.age}`);
    console.log(prompt);
    return;
  }

  if (fs.existsSync(outPath) && !opts.force) {
    console.log(`skip ${spec.id} (exists, use --force)`);
    return;
  }

  console.log(`generating ${spec.id} (${spec.gender}, ${spec.age})…`);
  backupExisting(outPath);

  const raw = await generateImageBytes(apiKey, model, prompt);
  const webp = await postProcess(raw);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, webp);
  console.log(`  wrote ${outPath} (${webp.length} bytes)`);
}

async function main(): Promise<void> {
  loadEnv();
  const opts = parseArgs(process.argv.slice(2));
  const apiKey = process.env.AI_API_KEY ?? process.env.LOVABLE_API_KEY;
  const model = process.env.AI_IMAGE_MODEL ?? DEFAULT_MODEL;

  if (!opts.dryRun && !apiKey) {
    console.error("Missing AI_API_KEY in .env");
    process.exit(1);
  }

  let specs = AVATAR_SPECS;
  if (opts.onlyNew) {
    specs = AVATAR_SPECS.filter((s) => NEW_AVATAR_IDS.has(s.id));
  }
  if (opts.ids?.length) {
    specs = [];
    for (const id of opts.ids) {
      const spec = specById(id);
      if (!spec) {
        console.error(`Unknown avatar id: ${id}`);
        process.exit(1);
      }
      specs.push(spec);
    }
  }

  console.log(`Review avatars: ${specs.length} file(s), model=${model}, dryRun=${opts.dryRun}`);

  for (let i = 0; i < specs.length; i++) {
    await processSpec(specs[i], opts, apiKey ?? "", model);
    if (!opts.dryRun && i < specs.length - 1) {
      await sleep(PAUSE_MS);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
