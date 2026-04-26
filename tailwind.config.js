/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Poppins"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#D82C2C",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        rb: {
          red: "#D82C2C",
          darkred: "#B71C1C",
          lightred: "#FF5252",
          orange: "#FF6F00",
          yellow: "#FFB300",
          green: "#43A047",
          blue: "#1565C0",
          gray: {
            50: "#FAFAFA",
            100: "#F5F5F5",
            200: "#EEEEEE",
            300: "#E0E0E0",
            400: "#BDBDBD",
            500: "#9E9E9E",
            600: "#757575",
            700: "#616161",
            800: "#424242",
            900: "#212121",
          },
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'rb': '0 2px 8px rgba(0,0,0,0.08)',
        'rb-md': '0 4px 16px rgba(0,0,0,0.10)',
        'rb-lg': '0 8px 32px rgba(0,0,0,0.12)',
        'rb-xl': '0 16px 48px rgba(0,0,0,0.15)',
        'rb-red': '0 4px 16px rgba(216,44,44,0.25)',
        'rb-card': '0 1px 4px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
