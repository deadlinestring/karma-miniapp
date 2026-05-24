import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        graphite: "#090a12",
        night: "#050507",
        neon: {
          violet: "#9b5cff",
          blue: "#34a3ff",
          cyan: "#31f6ff",
          pink: "#ff4fd8"
        }
      },
      boxShadow: {
        glow: "0 0 36px rgba(49, 246, 255, 0.22)",
        violet: "0 0 32px rgba(155, 92, 255, 0.3)"
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Roboto", "Arial", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
