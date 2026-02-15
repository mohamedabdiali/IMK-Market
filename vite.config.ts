import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const getPackageName = (id: string) => {
  const normalized = id.replace(/\\/g, "/");
  const modulePath = normalized.split("/node_modules/")[1];
  if (!modulePath) return null;

  const parts = modulePath.split("/");
  if (parts[0].startsWith("@")) {
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0];
};

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": "http://localhost:5050",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("/src/pages/admin/") || normalizedId.includes("/src/components/admin/")) {
            return "app-admin";
          }

          if (normalizedId.includes("/src/pages/")) {
            return "app-pages";
          }

          if (normalizedId.includes("/src/components/")) {
            return "app-components";
          }

          if (!normalizedId.includes("node_modules")) return;

          const packageName = getPackageName(id);
          if (!packageName) return "vendor";

          if (packageName === "react" || packageName === "react-dom" || packageName === "scheduler") {
            return "vendor-react";
          }

          if (packageName === "react-router" || packageName === "react-router-dom") {
            return "vendor-router";
          }

          if (packageName.startsWith("@radix-ui")) {
            return "vendor-radix";
          }

          if (
            packageName === "recharts" ||
            packageName.startsWith("d3-") ||
            packageName === "victory-vendor" ||
            packageName === "react-smooth" ||
            packageName === "lodash" ||
            packageName === "decimal.js-light"
          ) {
            return "vendor-charts";
          }

          if (packageName.startsWith("@tanstack")) {
            return "vendor-query";
          }
        },
      },
    },
  },
});
