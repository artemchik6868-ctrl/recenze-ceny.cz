import fs from "fs";
import path from "path";

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (!["node_modules", ".git", ".output"].includes(name)) walk(p);
    } else if (/\.(ts|tsx|mjs)$/.test(name)) {
      let text = fs.readFileSync(p, "utf8");
      if (!text.includes("110 00")) continue;
      const next = text.replace(/110 00/g, (match, offset) => {
        const lineStart = text.lastIndexOf("\n", offset) + 1;
        const lineEnd = text.indexOf("\n", offset);
        const line = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
        if (/postalCode/.test(line)) return match;
        return "1000";
      });
      if (next !== text) {
        fs.writeFileSync(p, next, "utf8");
        console.log(p);
      }
    }
  }
}

walk(path.join(process.cwd(), "src"));
