import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** The Holder Hub, built as its own document and served by the Next app at
 *  /marketplace.
 *
 *  It keeps its own full Tailwind build — preflight included — which is the
 *  whole point of the split: preflight is a global reset, and inside the Next
 *  app it would survive a client-side navigation back to the Chakra landing
 *  page and trample it. A separate document scopes the reset to this app. */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/marketplace/",
  define: {
    // The API handlers are Next routes in the parent app, mounted one level
    // deeper than the standalone deployment's /api.
    "import.meta.env.VITE_API_URL": JSON.stringify("/api/marketplace"),
  },
  build: {
    outDir: "../public/marketplace",
    emptyOutDir: true,
  },
  server: {
    // `vite dev` here still talks to the Next dev server for /api.
    proxy: { "/api": "http://localhost:3000" },
  },
});
