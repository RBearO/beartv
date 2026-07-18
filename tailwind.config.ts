import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bear: {
          brown: "#8B5E3C",
          gold: "#F4C542",
          dark: "#0A0A0A",
          gray: "#1A1A1A",
          light: "#2A2A2A",
        },
      },
      fontFamily: {
        sans: ["var(--app-font)", "ui-sans-serif", "system-ui", "sans-serif"],
        app: ["var(--app-font)", "ui-sans-serif", "system-ui", "sans-serif"],
        default: ["var(--font-default)", "ui-sans-serif", "system-ui", "sans-serif"],
        modern: ["var(--font-modern)", "ui-sans-serif", "system-ui", "sans-serif"],
        friendly: ["var(--font-friendly)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
