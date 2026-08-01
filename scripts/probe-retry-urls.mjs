const base = process.argv[2] ?? "https://recenze-ceny.cz";
const urls = [
  "/category/weight-management",
  "/papillomas/removio-s5907",
  "/joint-care/hondrofrost-s8861",
];
for (let attempt = 1; attempt <= 3; attempt++) {
  console.log(`\n--- attempt ${attempt} ---`);
  for (const path of urls) {
    const t0 = Date.now();
    const res = await fetch(`${base}${path}`);
    const ms = Date.now() - t0;
    const snippet = (await res.text()).includes("Seite nicht gefunden") ? "404-page" : "other";
    console.log(`${res.status} ${ms}ms ${path} (${snippet})`);
  }
}
