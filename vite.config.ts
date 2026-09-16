import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/biblioteka-cenet-re4i/",
  plugins: [react()],
  server: { host: "0.0.0.0", hmr: false },
});
