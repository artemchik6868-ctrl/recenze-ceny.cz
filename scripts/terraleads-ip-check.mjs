import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import https from "node:https";
import os from "node:os";
import tls from "node:tls";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const userId = Number(process.env.TERRALEADS_USER_ID);
const apiKey = process.env.TERRALEADS_API_KEY;

function post(model, method, data, label) {
  const body = JSON.stringify({ user_id: userId, data });
  const check_sum = createHash("sha1").update(body + apiKey).digest("hex");
  const path = `/api/${model}/${method}?check_sum=${check_sum}`;
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: "104.21.57.171",
        servername: "t-api.org",
        path,
        method: "POST",
        family: 4,
        headers: {
          Host: "t-api.org",
          Accept: "application/json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let text = "";
        res.on("data", (c) => (text += c));
        res.on("end", () => {
          console.log(`${label}: HTTP ${res.statusCode}`);
          console.log(text.slice(0, 200));
          resolve();
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

console.log("Local IPv4 interfaces:");
for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
  for (const a of addrs) {
    if (a.family === "IPv4" && !a.internal) console.log(`  ${name}: ${a.address}`);
  }
}

console.log("\nTLS localAddress after connect to t-api.org:");
await new Promise((resolve, reject) => {
  const s = tls.connect(
    { host: "104.21.57.171", servername: "t-api.org", family: 4 },
    () => {
      console.log(`  local=${s.localAddress}:${s.localPort} remote=${s.remoteAddress}`);
      s.end();
      resolve();
    },
  );
  s.on("error", reject);
});

console.log("");
await post("ip", "get", [], "ip/get");
await post("offer", "list", [], "offer/list");
