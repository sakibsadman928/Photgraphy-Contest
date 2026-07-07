/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8F7FF",
        surface: "#FFFFFF",
        ink: "#161329",
        "ink-muted": "#6B6787",
        hairline: "#E7E4F7",
        accent: {
          DEFAULT: "#7C3AED",
          hover: "#6D28D9",
        },
        pink: {
          DEFAULT: "#EC4899",
          light: "#FCE7F3",
        },
        teal: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
        },
        amber: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        darkroom: {
          DEFAULT: "#0E0B1F",
          surface: "#1C1836",
          hairline: "#332D57",
          ink: "#F5F3FF",
          "ink-muted": "#A79FD1",
        },
        safelight: "#F472B6",
      },
      fontFamily: {
        display: ["var(--font-poppins)", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-roboto)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", '"SF Mono"', "Menlo", "Consolas", "monospace"],
      },
      backgroundImage: {
        "sprocket-line":
          "repeating-linear-gradient(to right, currentColor 0, currentColor 3px, transparent 3px, transparent 14px)",
        "brand-gradient": "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
      },
      boxShadow: {
        glow: "0 8px 30px -8px rgba(124, 58, 237, 0.35)",
      },
    },
  },
  plugins: [],
};

