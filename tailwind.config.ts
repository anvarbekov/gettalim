import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12233f",
          soft: "#3d4d68",
          mute: "#7b8798",
        },
        paper: {
          DEFAULT: "#eef2f8",
          card: "#ffffff",
          line: "#dde4ee",
        },
        teamA: {
          DEFAULT: "#1f6fd0",
          deep: "#14538f",
          soft: "#e6f0fd",
        },
        teamB: {
          DEFAULT: "#d2402f",
          deep: "#9e2b1e",
          soft: "#fdecea",
        },
        rope: {
          DEFAULT: "#c4996c",
          light: "#e7c094",
          dark: "#9d7143",
        },
        gold: "#e0a92e",
      },
      fontFamily: {
        display: ["'Baloo 2'", "Nunito", "system-ui", "sans-serif"],
        sans: ["Nunito", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,35,63,.06), 0 12px 28px -18px rgba(18,35,63,.45)",
        lift: "0 18px 40px -22px rgba(18,35,63,.55)",
        key: "inset 0 -3px 0 rgba(18,35,63,.10)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "shake-x": {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-9px)" },
          "40%": { transform: "translateX(8px)" },
          "60%": { transform: "translateX(-5px)" },
          "80%": { transform: "translateX(3px)" },
        },
        "rise-fade": {
          "0%": { transform: "translateY(0) scale(.9)", opacity: "0" },
          "25%": { opacity: "1" },
          "100%": { transform: "translateY(-58px) scale(1.15)", opacity: "0" },
        },
        "dust-puff": {
          "0%": { transform: "scale(.4)", opacity: ".55" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        /* --- Savol yomg'iri --- */
        "rain-fall": {
          "0%": { transform: "translateY(-10%)", opacity: "0" },
          "8%": { opacity: ".6" },
          "100%": { transform: "translateY(110%)", opacity: "0" },
        },
        "cloud-drift": {
          "0%": { transform: "translateX(-8%)" },
          "100%": { transform: "translateX(108%)" },
        },
        splash: {
          "0%": { transform: "scale(.3)", opacity: ".9" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        ripple: {
          "0%": { transform: "scaleX(.4)", opacity: ".5" },
          "100%": { transform: "scaleX(1.6)", opacity: "0" },
        },
        /* --- O'quvchi ekrani --- */
        "tile-in": {
          "0%": { transform: "translateY(14px) scale(.96)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "verdict-in": {
          "0%": { transform: "scale(.6) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(1.08) rotate(2deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0)", opacity: "1" },
        },
        "score-pop": {
          "0%": { transform: "translateY(6px) scale(.8)", opacity: "0" },
          "30%": { transform: "translateY(-2px) scale(1.1)", opacity: "1" },
          "100%": { transform: "translateY(-26px) scale(1)", opacity: "0" },
        },
        glow: {
          "0%,100%": { opacity: ".35" },
          "50%": { opacity: ".7" },
        },
        /* --- Test ekrani: harakat --- */
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-7px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(3px)" },
        },
        "flash-in": {
          "0%": { opacity: "0" },
          "18%": { opacity: ".55" },
          "100%": { opacity: "0" },
        },
        "float-up": {
          "0%": { transform: "translateY(8px) scale(.85)", opacity: "0" },
          "25%": { transform: "translateY(-6px) scale(1.15)", opacity: "1" },
          "100%": { transform: "translateY(-52px) scale(1)", opacity: "0" },
        },
        aurora: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(6%,-4%,0) scale(1.12)" },
          "66%": { transform: "translate3d(-5%,5%,0) scale(.95)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-12vh) rotate(0)", opacity: "1" },
          "100%": { transform: "translateY(105vh) rotate(720deg)", opacity: "0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: ".55" },
          "100%": { transform: "scale(1.35)", opacity: "0" },
        },
        "slide-question": {
          "0%": { transform: "translateY(-18px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "pop-in": "pop-in .22s cubic-bezier(.34,1.56,.64,1)",
        "shake-x": "shake-x .42s ease",
        "rise-fade": "rise-fade 1s ease-out forwards",
        "dust-puff": "dust-puff .7s ease-out forwards",
        "rain-fall": "rain-fall linear infinite",
        "cloud-drift": "cloud-drift linear infinite",
        splash: "splash .5s ease-out forwards",
        ripple: "ripple .8s ease-out forwards",
        "tile-in": "tile-in .3s cubic-bezier(.34,1.4,.64,1) backwards",
        "verdict-in": "verdict-in .45s cubic-bezier(.34,1.56,.64,1)",
        "score-pop": "score-pop 1s ease-out forwards",
        glow: "glow 2.4s ease-in-out infinite",
        shake: "shake .42s ease-in-out",
        "flash-in": "flash-in .7s ease-out forwards",
        "float-up": "float-up 1.1s ease-out forwards",
        aurora: "aurora 18s ease-in-out infinite",
        "confetti-fall": "confetti-fall linear forwards",
        "pulse-ring": "pulse-ring 1.1s ease-out infinite",
        "slide-question": "slide-question .35s cubic-bezier(.34,1.4,.64,1)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        arqon: {
          primary: "#1f6fd0",
          "primary-content": "#ffffff",
          secondary: "#d2402f",
          "secondary-content": "#ffffff",
          accent: "#c4996c",
          "accent-content": "#12233f",
          neutral: "#12233f",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#eef2f8",
          "base-300": "#dde4ee",
          "base-content": "#12233f",
          info: "#2b8fd8",
          success: "#1f9d63",
          warning: "#e0a92e",
          error: "#d2402f",
          "--rounded-box": "1.1rem",
          "--rounded-btn": "0.8rem",
        },
      },
    ],
    logs: false,
  },
};

export default config;
