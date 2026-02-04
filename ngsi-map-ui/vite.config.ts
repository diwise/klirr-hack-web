import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ngsi-ld": {
        target: "https://klirr.diwise.io",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
