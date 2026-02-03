import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ngsi-ld": {
        target: "https://test.diwise.io",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
