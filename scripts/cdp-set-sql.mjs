import fs from "node:fs";

const sql = fs.readFileSync("supabase/_bootstrap_part3.sql", "utf8");
const expr = `(() => { const sql = ${JSON.stringify(sql)}; const m = window.monaco?.editor?.getModels?.()?.[0]; if (!m) return 'no monaco'; m.setValue(sql); return 'ok len=' + sql.length; })()`;
process.stdout.write(expr);
