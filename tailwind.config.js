/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Plus Jakarta Sans"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          'ui-monospace',
          'monospace',
        ],
      },
      colors: {
        apple: {
          blue: '#0071e3',
          'blue-hover': '#0077ed',
          green: '#34c759',
          orange: '#ff9500',
          red: '#ff3b30',
          purple: '#af52de',
          indigo: '#5856d6',
          teal: '#5ac8fa',
          yellow: '#ffcc00',
          gray: {
            50: '#fbfbfd',
            100: '#f5f5f7',
            200: '#e8e8ed',
            300: '#d2d2d7',
            400: '#86868b',
            500: '#6e6e73',
            600: '#424245',
            700: '#333336',
            800: '#1d1d1f',
            900: '#161617',
          }
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
        'glass-hover': '0 14px 40px 0 rgba(0, 0, 0, 0.1)',
        'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'apple-md': '0 4px 14px rgba(0, 0, 0, 0.07)',
        'apple-lg': '0 12px 30px rgba(0, 0, 0, 0.09)',
        'apple-glow': '0 0 20px rgba(0, 113, 227, 0.35)',
      },
      borderRadius: {
        'apple': '16px',
        'apple-lg': '22px',
        'apple-xl': '28px',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }
    },
  },
  plugins: [],
}
