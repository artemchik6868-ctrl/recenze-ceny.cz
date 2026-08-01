const base = process.argv[2] ?? "https://recenze-ceny.cz";
const paths = ["/category", "/product/removio-s5907", "/sitemap.xml"];
for (const path of paths) {
  const res = await fetch(`${base}${path}`, { redirect: "manual" });
  console.log(`${res.status} ${path} location=${res.headers.get("location") ?? "-"}`);
  if (path === "/category" && res.ok) {
    const html = await res.text();
    const cats = [...html.matchAll(/href="(\/category\/[a-z0-9-]+)"/g)].map((m) => m[1]);
    console.log("  categories in HTML:", [...new Set(cats)].length, [...new Set(cats)].slice(0, 8));
  }
}
