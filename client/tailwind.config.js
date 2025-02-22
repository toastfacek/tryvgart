/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF00FF',     // Hot magenta
        secondary: '#00FFFF',   // Cyan blue
        accent: '#B24BFF',      // Electric purple
        dark: '#330867',        // Deep indigo
        darker: '#1A0536',      // Midnight purple
        success: '#00FF9F',     // Neon mint
        error: '#FF2E6C',       // Hot coral
        neonYellow: '#FFFF00',  // Electric yellow
        retroTeal: '#00FFC8',   // Miami teal
        sunsetOrange: '#FF6B6B' // Retro orange
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
      },
      backgroundImage: {
        'gradient-retro': 'linear-gradient(45deg, #FF00FF 0%, #00FFFF 100%)',
      },
      boxShadow: {
        'neon': '0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.5)',
      },
    },
  },
  plugins: [],
} 