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
        base: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        surface2: 'rgb(var(--surface-2-rgb) / <alpha-value>)',
        line: 'rgb(var(--line-rgb) / calc(<alpha-value> * 0.08))',
        'line-strong': 'rgb(var(--line-rgb) / calc(<alpha-value> * 0.15))',
        'line-specular': 'var(--border-specular)',
        ink: 'rgb(var(--text-rgb) / <alpha-value>)',
        'ink-2': 'rgb(var(--text-2-rgb) / <alpha-value>)',
        'ink-3': 'rgb(var(--text-3-rgb) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        accent2: 'rgb(var(--accent-2-rgb) / <alpha-value>)',
        ok: 'rgb(var(--ok-rgb) / <alpha-value>)',
        warn: 'rgb(var(--warn-rgb) / <alpha-value>)',
        bad: 'rgb(var(--bad-rgb) / <alpha-value>)',
        // Baked-alpha tint; must not use <alpha-value> (plain bg-accentSoft stays subtle)
        accentSoft: 'var(--accent-soft)',
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
