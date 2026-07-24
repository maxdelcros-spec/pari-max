import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#07090C",
          900: "#0B0E13",
          850: "#0F131A",
          800: "#131822",
          700: "#1B212C",
          600: "#242C39",
          border: "#1E252F",
        },
        ink: {
          50: "#F3F5F7",
          200: "#C7CED8",
          400: "#8A93A3",
          600: "#5B6472",
        },
        court: {
          DEFAULT: "#12B886",
          bright: "#3DDC97",
          dim: "#0E7A5C",
          glow: "rgba(18,184,134,0.35)",
        },
        edge: {
          DEFAULT: "#8B6CF6",
          bright: "#A78BFA",
          dim: "#6247C6",
          glow: "rgba(139,108,246,0.35)",
        },
        risk: {
          DEFAULT: "#F04863",
          dim: "#B23349",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        "glow-court": "0 0 24px rgba(18,184,134,0.25)",
        "glow-edge": "0 0 24px rgba(139,108,246,0.25)",
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(18,184,134,0.06), transparent 60%)",
        "value-gradient": "linear-gradient(135deg, #12B886 0%, #8B6CF6 100%)",
      },
      keyframes: {
        pulseGlow: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
        rise: "rise 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
