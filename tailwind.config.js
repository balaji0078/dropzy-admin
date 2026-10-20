/** @type {import('tailwindcss').Config} */
// Dropzy dark theme — mirrors the customer app (dropzy_mobile/lib/core/theme.dart):
// near-black violet canvas, dark surfaces, violet primary, gold highlight.
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Poppins"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        // ─── surfaces & text ───
        canvas: "#0E0C15", // app background (DropzyColors.bg)
        surface: {
          DEFAULT: "#1B1826", // cards (DropzyColors.surface)
          alt: "#221E30", // inset panels, table heads, neutral chips (DropzyColors.surfaceAlt)
          raised: "#2A2540", // hover on surface-alt / menus
        },
        ink: {
          DEFAULT: "#F4F3F7", // primary text (DropzyColors.ink) — 15.8:1 on surface
          soft: "#9E99AC", // secondary text (DropzyColors.inkSoft) — 6.3:1 on surface
          faint: "#8F89A3", // tertiary text / icons — ≥4.5:1 on surface & surface-alt
        },
        line: {
          DEFAULT: "#2C2838", // borders (DropzyColors.line)
          strong: "#3A3550",
        },
        // ─── brand ───
        primary: {
          DEFAULT: "#8B5CF6", // violet (DropzyColors.primary)
          deep: "#7C3AED", // button fill (white text 5.7:1)
          dark: "#6D28D9", // DropzyColors.primaryDark
          light: "#A78BFA", // violet text/links on dark (6.4:1)
          tint: "#241B38", // DropzyColors.primaryTint
        },
        gold: {
          DEFAULT: "#F5C451", // highlight — 10.7:1 on surface
          deep: "#D4A53A",
          light: "#F9D77E",
          tint: "rgba(245,196,81,0.12)",
        },
        // ─── semantic (DropzyColors.success/info/warning/danger) ───
        success: "#34D399",
        info: "#818CF8",
        warning: "#FBBF24",
        danger: "#F87171",
        // Legacy scales remapped to the violet brand so old classes follow the theme.
        brand: {
          50: "#241B38",
          100: "#2E2347",
          200: "#3B2C67",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065",
        },
        rb: {
          red: "#7C3AED",
          darkred: "#6D28D9",
          lightred: "#A78BFA",
          orange: "#FB923C",
          yellow: "#F5C451",
          green: "#34D399",
          blue: "#818CF8",
          gray: {
            50: "#0E0C15",
            100: "#1B1826",
            200: "#221E30",
            300: "#2C2838",
            400: "#3A3550",
            500: "#8F89A3",
            600: "#9E99AC",
            700: "#C9C5D4",
            800: "#E4E2EA",
            900: "#F4F3F7",
          },
        },
      },
      // Bare `border` / `divide-*` / `ring` utilities default to the dark theme line + gold focus ring.
      borderColor: { DEFAULT: "#2C2838" },
      ringColor: { DEFAULT: "#F5C451" },
      ringOffsetColor: { DEFAULT: "#0E0C15" },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      backgroundImage: {
        'dz-offer': 'linear-gradient(90deg, #7C3AED 0%, #4C1D95 100%)', // DropzyColors.offerGradient
        'dz-glow': 'linear-gradient(180deg, #2A1B4D 0%, #0E0C15 100%)', // DropzyColors.glow
        'dz-hero': 'linear-gradient(160deg, #3B2C67 0%, #241A3D 55%, #14101F 100%)', // DropzyHero
        'dz-gold': 'linear-gradient(135deg, #F9D77E 0%, #F5C451 45%, #D4A53A 100%)',
      },
      boxShadow: {
        'rb': '0 2px 8px rgba(0,0,0,0.35)',
        'rb-md': '0 4px 16px rgba(0,0,0,0.40)',
        'rb-lg': '0 8px 32px rgba(0,0,0,0.45)',
        'rb-xl': '0 16px 48px rgba(0,0,0,0.55)',
        'rb-red': '0 4px 16px rgba(124,58,237,0.35)',
        'rb-card': '0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 18px rgba(0,0,0,0.35)',
        'violet': '0 4px 16px rgba(124,58,237,0.35)',
        'gold': '0 0 0 1px rgba(245,196,81,0.45), 0 4px 16px rgba(245,196,81,0.18)',
      },
    },
  },
  plugins: [],
};
