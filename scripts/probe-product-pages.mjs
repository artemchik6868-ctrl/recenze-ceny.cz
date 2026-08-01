/** Probe product URLs on apex/workers.dev for 404 and FR in H1. */
const bases = [
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ?? "https://recenze-ceny.cz",
  "https://recenze-ceny.workers.dev",
];

for (const base of [...new Set(bases)]) {
  console.log(`\n=== ${base} ===`);
  for (const path of ["/", "/category"]) {
    const html = await (await fetch(`${base}${path}`)).text();
    const productLinks = [
      ...new Set(
        [...html.matchAll(/href="(\/[^"]+)"/g)]
          .map((m) => m[1])
          .filter((p) => /\/[^/]+\/[^/]+-[kmgst]?\d+/.test(p) || /\/product\/[^"]+/.test(p)),
      ),
    ];
    console.log(`${path}: ${productLinks.length} product links`);
    for (const link of productLinks.slice(0, 8)) {
      const res = await fetch(`${base}${link}`);
      const body = await res.text();
      const h1 = [...body.matchAll(/<h1[^>]*>([^<]*)</gi)].map((m) => m[1].trim())[0] ?? "";
      const fr = /\bFR\b|\[FR\]| FR[,.]/.test(h1) || /\bFR\b/.test(body.slice(0, 8000));
      console.log(`  ${res.status} ${link}`);
      if (h1) console.log(`    h1: ${h1.slice(0, 120)}${fr ? " [FR!]" : ""}`);
    }
  }
}
