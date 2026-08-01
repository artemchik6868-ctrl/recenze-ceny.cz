const urls = [
  "http://localhost:8080/home-climate/obohrevatel-handy-heater-8583",
  "http://localhost:8080/ru/home-climate/obohrevatel-handy-heater-8583",
  "http://localhost:8080/home-climate/turetskaya-prostyn-s-podohrevom-10803",
  "http://localhost:8080/ru/home-gadgets/vynylovyy-proyhryvatel-17801",
];

function strip(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

for (const url of urls) {
  console.log("\n" + "=".repeat(80));
  console.log(url);
  const res = await fetch(url);
  const html = await res.text();
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => strip(m[1]));
  const meta = html.match(/name="description"[^>]*content="([^"]*)"/)?.[1] ?? "";
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => strip(m[1])).slice(0, 15);
  const prose = strip(html.match(/class="[^"]*prose[^"]*"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? "").slice(0, 2500);
  console.log("TITLE:", title);
  console.log("H1:", h1.join(" | "));
  console.log("META:", meta);
  console.log("H2:", h2s.join("\n  "));
  if (prose) console.log("PROSE:", prose);
}
