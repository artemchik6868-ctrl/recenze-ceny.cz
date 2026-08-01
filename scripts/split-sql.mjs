import fs from "node:fs";

const sql = fs.readFileSync("supabase/_browser_apply.sql", "utf8");
const parts = sql.split(/\n(?=-- ===)/);
const chunks = [];
let current = "";

for (const part of parts) {
  if ((current + part).length > 5500 && current) {
    chunks.push(current);
    current = part;
  } else {
    current += part;
  }
}
if (current) chunks.push(current);

chunks.forEach((chunk, i) => {
  fs.writeFileSync(`supabase/_browser_part${i + 1}.sql`, chunk);
});

console.log(`chunks=${chunks.length} sizes=${chunks.map((c) => c.length).join(",")}`);
