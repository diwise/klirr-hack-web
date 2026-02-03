/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        panel: "#0f172a",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(2, 6, 23, 0.35)",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        adminlite: {
          primary: "#2dd4bf",
          secondary: "#60a5fa",
          accent: "#f59e0b",
          neutral: "#0b1220",
          "base-100": "#0b1220",
          "base-200": "#0f172a",
          "base-300": "#111827",
          info: "#38bdf8",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
    darkTheme: "adminlite",
  },
};
