import { createPreset } from 'fumadocs-ui/tailwind-plugin'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{ts,tsx,mdx}',
    './content/**/*.{md,mdx}',
    './node_modules/fumadocs-ui/dist/**/*.js',
  ],
  presets: [
    createPreset({
      preset: 'default',
    }),
  ],
  theme: {
    extend: {
      colors: {
        // Match data-peek's terminal-inspired palette
        background: '#0a0a0b',
        foreground: '#fafafa',
        card: {
          DEFAULT: '#111113',
          foreground: '#fafafa',
        },
        popover: {
          DEFAULT: '#111113',
          foreground: '#fafafa',
        },
        primary: {
          DEFAULT: '#22d3ee',
          foreground: '#0a0a0b',
        },
        secondary: {
          DEFAULT: '#18181b',
          foreground: '#fafafa',
        },
        muted: {
          DEFAULT: '#27272a',
          foreground: '#71717a',
        },
        accent: {
          DEFAULT: '#22d3ee',
          foreground: '#0a0a0b',
        },
        border: '#27272a',
        input: '#27272a',
        ring: '#22d3ee',
      },
      fontFamily: {
        mono: ['Geist Mono', 'monospace'],
        sans: ['Geist Mono', 'monospace'],
      },
    },
  },
  darkMode: 'class',
}
