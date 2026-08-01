/**
 * Windows workaround: Node fetch resets (ECONNRESET ~19s) on POST >~24 KB to
 * api.cloudflare.com while PowerShell Invoke-WebRequest succeeds.
 * Preload: node --import ./scripts/win-fetch-proxy.mjs …
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const THRESHOLD = 24_000;
const nativeFetch = globalThis.fetch;

function headerMap(headers) {
  const out = {};
  if (!headers) return out;
  if (typeof headers.forEach === "function") {
    headers.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  for (const [k, v] of Object.entries(headers)) out[k] = String(v);
  return out;
}

async function formDataToMultipart(body) {
  const boundary = `----formdata-undici-${Math.floor(Math.random() * 1e12)}`;
  const parts = [];
  for (const [key, value] of body.entries()) {
    if (value && typeof value === "object" && typeof value.arrayBuffer === "function") {
      const buf = Buffer.from(await value.arrayBuffer());
      const type = value.type || "application/octet-stream";
      const name = value.name || key;
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${key}"; filename="${name}"\r\nContent-Type: ${type}\r\n\r\n`,
        ),
        buf,
        Buffer.from("\r\n"),
      );
    } else {
      parts.push(
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${String(value)}\r\n`),
      );
    }
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    bytes: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function bodyBytes(body) {
  if (body == null) return { bytes: Buffer.alloc(0), contentType: null };
  if (typeof body === "string") {
    return { bytes: Buffer.from(body), contentType: null };
  }
  if (body instanceof URLSearchParams) {
    const s = body.toString();
    return { bytes: Buffer.from(s), contentType: "application/x-www-form-urlencoded" };
  }
  if (Buffer.isBuffer(body)) return { bytes: body, contentType: null };
  if (body instanceof ArrayBuffer) return { bytes: Buffer.from(body), contentType: null };
  if (ArrayBuffer.isView(body)) {
    return { bytes: Buffer.from(body.buffer, body.byteOffset, body.byteLength), contentType: null };
  }
  if (typeof body === "object" && typeof body.entries === "function") {
    return formDataToMultipart(body);
  }
  return { bytes: Buffer.from(String(body)), contentType: null };
}

function powershellPost(url, bytes, headers, contentType) {
  const dir = mkdtempSync(join(tmpdir(), "wrangler-ps-"));
  const bodyPath = join(dir, "body.bin");
  const hdrPath = join(dir, "headers.json");
  const outPath = join(dir, "response.json");
  writeFileSync(bodyPath, bytes);

  const hdr = { ...headers };
  const contentTypeValue =
    contentType || hdr["Content-Type"] || hdr["content-type"] || "application/octet-stream";
  delete hdr["Content-Type"];
  delete hdr["content-type"];
  writeFileSync(hdrPath, JSON.stringify(hdr));

  const psScript = `
$ErrorActionPreference = 'Stop'
$bodyPath = ${JSON.stringify(bodyPath)}
$hdrPath = ${JSON.stringify(hdrPath)}
$outPath = ${JSON.stringify(outPath)}
$url = ${JSON.stringify(url)}
$contentType = ${JSON.stringify(contentTypeValue)}
$headers = Get-Content -Raw -Path $hdrPath | ConvertFrom-Json
$bytes = [System.IO.File]::ReadAllBytes($bodyPath)
try {
  $request = [System.Net.HttpWebRequest]::Create($url)
  $request.Method = 'POST'
  $request.Timeout = 600000
  $request.ContentType = $contentType
  $request.ContentLength = $bytes.Length
  $headers.PSObject.Properties | ForEach-Object {
    $name = [string]$_.Name
    $value = [string]$_.Value
    if ($name -ieq 'Content-Type' -or $name -ieq 'Content-Length') { return }
    if ($name -ieq 'Authorization') {
      $null = $request.Headers.Add([System.Net.HttpRequestHeader]::Authorization, $value)
    } elseif ($name -ieq 'User-Agent') {
      $request.UserAgent = $value
    } else {
      $request.Headers.Add($name, $value)
    }
  }
  $stream = $request.GetRequestStream()
  $stream.Write($bytes, 0, $bytes.Length)
  $stream.Close()
  $response = $request.GetResponse()
  $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
  $body = $reader.ReadToEnd()
  $respHeaders = @{}
  foreach ($key in $response.Headers.AllKeys) { $respHeaders[$key] = $response.Headers[$key] }
  $result = @{ status = [int]$response.StatusCode; headers = $respHeaders; body = $body }
} catch [System.Net.WebException] {
  $resp = $_.Exception.Response
  if ($resp) {
    $statusCode = [int]$resp.StatusCode
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $body = $reader.ReadToEnd()
    $result = @{ status = $statusCode; headers = @{}; body = $body }
  } else {
    $result = @{ status = 0; headers = @{}; body = $_.Exception.Message }
  }
} catch {
  $result = @{ status = 0; headers = @{}; body = $_.Exception.Message }
}
$json = $result | ConvertTo-Json -Compress -Depth 5
[System.IO.File]::WriteAllText($outPath, $json, (New-Object System.Text.UTF8Encoding($false)))
`;

  execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psScript],
    { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 },
  );

  const rawText = readFileSync(outPath, "utf8").replace(/^\uFEFF/, "");
  const raw = JSON.parse(rawText);
  for (const p of [bodyPath, hdrPath, outPath]) {
    try {
      unlinkSync(p);
    } catch {
      /* ignore */
    }
  }
  return raw;
}

async function powershellFetch(url, init = {}, bytes, contentType) {
  if (bytes == null || contentType === undefined) {
    ({ bytes, contentType } = await bodyBytes(init.body));
  }
  const headers = headerMap(init.headers);
  const raw = powershellPost(String(url), bytes, headers, contentType);

  const status = Number(raw.status) || 0;
  const respHeaders = new Headers();
  for (const [k, v] of Object.entries(raw.headers ?? {})) {
    if (v != null) respHeaders.set(k, String(v));
  }

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: respHeaders,
    async text() {
      return String(raw.body ?? "");
    },
    async json() {
      return JSON.parse(String(raw.body ?? "{}"));
    },
    async arrayBuffer() {
      return new TextEncoder().encode(String(raw.body ?? "")).buffer;
    },
  };
}

globalThis.fetch = async (url, init = {}) => {
  const method = (init.method ?? "GET").toUpperCase();
  if (method !== "POST" && method !== "PUT" && method !== "PATCH") {
    return nativeFetch(url, init);
  }

  const body = init.body;
  const isFormData =
    body && typeof body === "object" && typeof body.entries === "function";

  // FormData must be serialized once (undici); replaying a consumed body breaks Content-Type.
  if (isFormData) {
    const { bytes, contentType } = await bodyBytes(body);
    return powershellFetch(url, init, bytes, contentType);
  }

  const { bytes, contentType } = await bodyBytes(body);
  if (bytes.length > THRESHOLD) {
    return powershellFetch(url, init, bytes, contentType);
  }

  return nativeFetch(url, init);
};
