const base = process.argv[2] ?? "https://recenze-ceny.cz";
for (const path of ["/category/weight-management", "/category/joint-care", "/"]) {
  const res = await fetch(`${base}${path}`);
  const html = await res.text();
  const links = [
    ...new Set(
      [...html.matchAll(/href="(\/[a-z0-9-]+\/[a-z0-9-]+-[kmgst]?\d+)"/g)].map((m) => m[1]),
    ),
  ];
  console.log(`${res.status} ${path} -> ${links.length} product links`);
  for (const l of links.slice(0, 5)) {
    const pr = await fetch(`${base}${l}`);
    console.log(`  ${pr.status} ${l}`);
  }
}
