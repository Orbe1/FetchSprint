/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fetch: {
          primary: "#FF7A00",
          accent: "#FFE8CC",
          bg: "#FFFDFB",
        },
      },
    },
  },
  plugins: [],
};

