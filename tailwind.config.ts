import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // VISROSLOT Emerald Sovereign Master Palette
        "deep-emerald": "#043D2E",
        "royal-emerald": "#046A38",
        "forest-black": "#10251D",
        "warm-ivory": "#F7F6F0",
        "pure-white": "#FFFFFF",
        "champagne-silver": "#D8DED8",
        "soft-sage": "#A7B9AA",

        // Emerald Sovereign UI tokens
        surface: {
          DEFAULT: "#FAF9F3",
          bright: "#FAF9F3",
          dim: "#DBDCD4",
          container: "#EFEEE8",
          "container-low": "#F5F4EE",
          "container-lowest": "#FFFFFF",
          "container-high": "#E9E8E2",
          "container-highest": "#E3E3DD",
        },
        "on-surface": "#1B1C19",
        "on-surface-variant": "#404944",
        "outline": "#707974",
        "outline-variant": "#C0C9C3",
        "surface-tint": "#366756",
        "primary": "#00251B",
        "on-primary": "#FFFFFF",
        "primary-container": "#043D2E",
        "on-primary-container": "#76A894",
        "secondary": "#0A6D3A",
        "on-secondary": "#FFFFFF",
        "secondary-container": "#9EF6B6",
        "on-secondary-container": "#167340",
        "tertiary": "#0E241C",
        "tertiary-container": "#243930",
        "on-tertiary-container": "#8BA397",

        // Semantic tokens
        brand: {
          deep: "#043D2E",
          royal: "#046A38",
          forest: "#10251D",
          ivory: "#F7F6F0",
          champagne: "#D8DED8",
          sage: "#A7B9AA",
        },

        // Backward compatibility mappings mapped to Emerald Sovereign
        navy: {
          DEFAULT: "#043D2E",
          950: "#10251D",
          900: "#043D2E",
          800: "#064E3B",
          700: "#046A38",
          600: "#0B513D",
        },
        gold: {
          DEFAULT: "#046A38",
          royal: "#046A38",
          warm: "#76A894",
          50: "#F7F6F0",
          100: "#E3E3DD",
          200: "#D8DED8",
          300: "#A7B9AA",
          400: "#76A894",
          500: "#046A38",
          600: "#043D2E",
          700: "#10251D",
        },
        silver: {
          DEFAULT: "#D8DED8",
          light: "#F7F6F0",
          dark: "#A7B9AA",
        },
        ivory: {
          DEFAULT: "#F7F6F0",
          50: "#FFFFFF",
          100: "#FAF9F3",
          200: "#F7F6F0",
          300: "#EFECE4",
          border: "#D8DED8",
        },
        charcoal: "#10251D",
        "muted-grey": "#707974",
        ink: {
          DEFAULT: "#10251D",
          900: "#10251D",
          800: "#043D2E",
          700: "#1B1C19",
          light: "#404944",
        },
      },
      fontFamily: {
        display: ["var(--font-manrope)", "'Manrope'", "'Inter'", "-apple-system", "sans-serif"],
        heading: ["var(--font-manrope)", "'Manrope'", "'Inter'", "-apple-system", "sans-serif"],
        sans: ["var(--font-inter)", "'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "'JetBrains Mono'", "monospace"],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.025em",
        wide: "0.05em",
        widest: "0.15em",
      },
      boxShadow: {
        emerald: "0 10px 30px -5px rgba(4, 61, 46, 0.25)",
        "emerald-glow": "0 0 25px rgba(4, 106, 56, 0.35)",
        forest: "0 15px 35px -5px rgba(16, 37, 29, 0.35)",
        "ambient-emerald": "0 4px 20px -4px rgba(4, 61, 46, 0.06), 0 2px 6px -1px rgba(16, 37, 29, 0.04)",
        "modal-emerald": "0 20px 48px -8px rgba(4, 61, 46, 0.12), 0 8px 16px -2px rgba(16, 37, 29, 0.06)",
        editorial: "0 1px 3px rgba(4, 61, 46, 0.05), 0 6px 18px rgba(16, 37, 29, 0.04)",
        "editorial-lg": "0 12px 35px rgba(4, 61, 46, 0.08)",
        gold: "0 10px 30px -5px rgba(4, 106, 56, 0.25)",
        "gold-glow": "0 0 25px rgba(4, 106, 56, 0.35)",
        navy: "0 15px 35px -5px rgba(16, 37, 29, 0.35)",
        orange: "0 10px 25px -5px rgba(4, 106, 56, 0.2)",
      },
      animation: {
        "spin-slow": "spin 25s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
