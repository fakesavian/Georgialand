/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#F5F7F6',
          100: '#E6EBE9',
          200: '#CED8D4',
          300: '#B2C1BC',
          400: '#94A8A1',
          500: '#758D84',
          600: '#5A6E67',
          700: '#44534D',
          800: '#2A3632',
          900: '#151F1C', // Dark olive-charcoal surface
          950: '#0A1713', // Deepest background
          975: '#081612', 
        },
        brand: {
          50: '#F2F8F5',
          100: '#DFEFE7',
          200: '#BDE0CE',
          300: '#93CBB2',
          400: '#66B294',
          500: '#439777', // Accent Sage
          600: '#32795E',
          700: '#28614C',
          800: '#214D3C',
          900: '#1C3F32',
          950: '#10271F',
        },
        surface: {
          light: '#F8F9FA',
          DEFAULT: '#151F1C', // Olive 900
          dark: '#0A1713', // Olive 950
          border: '#2A3632', // Olive 800
        },
        accent: {
          danger: '#D97757', // Muted rust/amber
          success: '#439777', // Sage green
          warning: '#D9A05B', // Muted gold
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(67, 151, 119, 0.15)',
        'glow-danger': '0 0 20px rgba(217, 119, 87, 0.15)',
      }
    },
  },
  plugins: [],
}
