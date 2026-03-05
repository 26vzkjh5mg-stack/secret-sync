/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ss: {
          anthracite: "#1C1C1E",
          anthracite2: "#121214",
          gold: "#D4AF37",
          gold2: "#E6C766",
        },
      },
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,0.35)",
        gold: "0 0 0 1px rgba(212,175,55,0.25), 0 12px 40px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};