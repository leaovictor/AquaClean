import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "https://api-w4ar34g54a-uc.a.run.app",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
  },
});
