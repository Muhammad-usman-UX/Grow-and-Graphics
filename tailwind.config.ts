import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0F2A4A", 900: "#0A1D35", 700: "#17375F", 100: "#E6ECF4", 50: "#F3F6FA" },
        brand: { DEFAULT: "#2BB673", dark: "#1F9A5F", mint: "#E7F7EF" },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      maxWidth: { page: "72rem" },
    },
  },
  plugins: [],
};
export default config;
