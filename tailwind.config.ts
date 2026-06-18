import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        kv: {
          dark: '#1b1f2b',
          blue: '#2b3b6b',
          bg: '#f5f7fb',
          light: '#eef2f9',
          text: '#4a5578',
          border: '#edf2f9',
          muted: '#6e7c9e',
        },
        ai: {
          primary: '#7c3aed',
          dark: '#5b21b6',
          light: '#ede9fe',
        },
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse at 70% 30%, #e2e9ff, #f5f7fb 80%)',
        'top-gradient': 'linear-gradient(145deg, #fff9e6, #fff2d9)',
      },
      boxShadow: {
        card: '0 12px 30px -10px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 25px 35px -12px rgba(43, 59, 107, 0.15)',
        modal: '0 40px 70px -10px rgba(0, 0, 0, 0.3)',
        'ai-btn': '0 8px 20px rgba(124, 58, 237, 0.3)',
        'ai-window': '0 25px 50px rgba(0, 0, 0, 0.2)',
        likes: '0 4px 10px rgba(255, 100, 100, 0.1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
        '7xl': '3.5rem',
      },
    },
  },
  plugins: [],
}

export default config
