/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        base: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
        ink: 'var(--text)',
        'ink-2': 'var(--text-2)',
        'ink-3': 'var(--text-3)',
        accent: 'var(--accent)',
        accent2: 'var(--accent-2)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        bad: 'var(--bad)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px var(--border)',
        lift: '0 8px 30px -6px rgba(0,0,0,0.25), 0 0 0 1px var(--border)',
        pop: '0 20px 60px -12px rgba(0,0,0,0.45), 0 0 0 1px var(--border)',
        ringAccent: '0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)',
      },
      borderRadius: {
        xl2: '20px',
        xl3: '26px',
      },
    },
  },
  plugins: [],
}
