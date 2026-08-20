import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { apiPlugin } from "./vite-api-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
});
