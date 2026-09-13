import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT ?? 5173),
  },
  build: {
    outDir: "dist",
  },
  define: {
    "process.env": JSON.stringify({}), // не трогаем, Supabase читает import.meta.env
  },
  envPrefix: ["VITE_"],
});
