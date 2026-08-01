const urls = [
  "http://localhost:8080/home-climate/obohrevatel-handy-heater-8583",
  "http://localhost:8080/ru/home-gadgets/vynylovyy-proyhryvatel-17801",
];
for (const url of urls) {
  const html = await (await fetch(url)).text();
  const faq = [...html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g)]
    .slice(0, 5)
    .map((m) => `${m[1].replace(/<[^>]+>/g, "").trim()} → ${m[2].replace(/<[^>]+>/g, "").trim().slice(0, 150)}`);
  console.log("\n" + url);
  faq.forEach((f) => console.log(" -", f));
}
