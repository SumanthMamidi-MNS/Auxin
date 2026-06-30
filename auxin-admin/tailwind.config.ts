import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          900: "#1B5E20", 800: "#2E7D32", 700: "#388E3C",
          600: "#43A047", 100: "#E8F5E9", 50: "#F1F8F2",
        },
        gold: {
          500: "#C9A227", 400: "#D4AF37", 300: "#E2C458",
          200: "#F2E3A7", 100: "#FBF5DC",
        },
        ivory:    "#FAF9F6",
        charcoal: "#1C1C1C",
        muted:    "#6B7280",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem", "3xl": "1.5rem", "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(0,0,0,0.06)",
        card: "0 4px 24px rgba(0,0,0,0.09)",
        gold: "0 4px 18px rgba(201,162,39,0.28)",
      },
      animation: {
        "fade-in":  "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(14px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
