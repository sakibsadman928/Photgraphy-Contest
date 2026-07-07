/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Neutral system: background, surface, text. No color tint anywhere in these.
        paper: "#FAFAFA",
        surface: "#FFFFFF",
        ink: "#111827",
        "ink-muted": "#6B7280",
        hairline: "#E5E7EB",

        // ONE brand color, in two lightnesses (same hue, chosen for contrast — not two colors):
        // - DEFAULT (#07CFB5): vivid, for solid fills only (buttons, badges, glow, focus rings).
        //   Always pair with dark `ink` text/icons on top — white-on-this fails contrast.
        // - text (#0F766E): darker shade of the same teal, for text/links/icons placed directly
        //   on white/light backgrounds, where the vivid shade itself is too light to read.
        accent: {
          DEFAULT: "#07CFB5",
          hover: "#05B39C",
          text: "#0F766E",
          light: "#E1FBF7",
        },

        // Old token names aliased to the same one accent color, so every existing class in the
        // app resolves consistently without needing to touch every file individually.
        teal: { DEFAULT: "#0F766E", light: "#E1FBF7" },
        amber: { DEFAULT: "#6B7280", light: "#F3F4F6" }, // "in progress" -> neutral grey, not a warning color
        pink: { DEFAULT: "#111827", light: "#F3F4F6" }, // destructive -> solid ink, not a separate hue

        darkroom: {
          DEFAULT: "#0E0E10",
          surface: "#1A1A1D",
          hairline: "#2C2C30",
          ink: "#F5F5F5",
          "ink-muted": "#8E8E93",
        },
        // Same brand teal, glowing on dark — one color everywhere, including the judging screen.
        safelight: "#07CFB5",
      },
      fontFamily: {
        display: ["var(--font-poppins)", "ui-sans-serif", "sans-serif"],
        sans: [
          "var(--font-roboto)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          '"SF Mono"',
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      backgroundImage: {
        "sprocket-line":
          "repeating-linear-gradient(to right, currentColor 0, currentColor 3px, transparent 3px, transparent 14px)",
      },
      boxShadow: {
        glow: "0 8px 24px -8px #07CFB5",
      },
    },
  },
  plugins: [],
};
