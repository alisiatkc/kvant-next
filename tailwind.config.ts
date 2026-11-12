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
          dark: '#14203B',
          blue: '#213A8F',
          gold: '#C6A15B',
          cyan: '#1BAAE3',
          orange: '#EC6600',
          green: '#00713C',
          bg: '#F6F7F9',
          light: '#EEF1F6',
          text: '#3F4A61',
          border: '#DDE2EA',
          muted: '#6A7385',
        },
        ai: {
          primary: '#213A8F',
          dark: '#142867',
          light: '#EEF1F8',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, #F8F9FB, #EEF1F6)',
        'top-gradient': 'linear-gradient(180deg, #F7F5EF, #EFE9DC)',
      },
      boxShadow: {
        card: '0 12px 30px -10px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 20px 32px -14px rgba(20, 32, 59, 0.16)',
        modal: '0 40px 70px -10px rgba(0, 0, 0, 0.3)',
        'ai-btn': '0 8px 20px rgba(33, 58, 143, 0.22)',
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
