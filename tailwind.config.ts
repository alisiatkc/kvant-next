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
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'system-ui', 'sans-serif'],
      },
      colors: {
        kv: {
          dark: '#1F1D1A',
          blue: '#B83F27',
          gold: '#B83F27',
          cyan: '#D65336',
          orange: '#B83F27',
          green: '#525A49',
          bg: '#F3F0E9',
          light: '#EAE5DB',
          text: '#403B35',
          border: '#D8D1C5',
          muted: '#746D63',
        },
        ai: {
          primary: '#B83F27',
          dark: '#87301F',
          light: '#F4E7E1',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, #F5F2EC, #ECE7DD)',
        'top-gradient': 'linear-gradient(180deg, #F5F2EC, #ECE7DD)',
      },
      boxShadow: {
        card: '0 12px 30px -10px rgba(31, 29, 26, 0.08)',
        'card-hover': '0 20px 32px -14px rgba(31, 29, 26, 0.18)',
        modal: '0 40px 70px -10px rgba(31, 29, 26, 0.3)',
        'ai-btn': '0 8px 20px rgba(184, 63, 39, 0.2)',
        'ai-window': '0 25px 50px rgba(31, 29, 26, 0.2)',
        likes: '0 4px 10px rgba(31, 29, 26, 0.08)',
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
