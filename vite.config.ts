// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("react-dom") || /[/\\]react[/\\]/.test(id)) return "react-vendor";
            if (id.includes("@tanstack/react-router") || id.includes("@tanstack/router-core")) {
              return "router-vendor";
            }
            if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core")) {
              return "query-vendor";
            }
            if (id.includes("@radix-ui")) return "radix-vendor";
            if (id.includes("lucide-react")) return "icons-vendor";
          },
        },
      },
    },
  },
  nitro: {
    preset: "cloudflare-module",
    cloudflare: { nodeCompat: true, deployConfig: true, workersDev: true },
    experimental: { tasks: true },
    scanDirs: ["."],
    scheduledTasks: {
      "*/30 * * * *": ["scheduled-tick"],
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
