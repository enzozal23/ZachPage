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
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        sunken: 'rgb(var(--sunken) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        field: 'rgb(var(--field) / <alpha-value>)',
        'chip-red': 'rgb(var(--chip-red) / <alpha-value>)',
        'chip-red-ink': 'rgb(var(--chip-red-ink) / <alpha-value>)',
        'chip-amber': 'rgb(var(--chip-amber) / <alpha-value>)',
        'chip-amber-ink': 'rgb(var(--chip-amber-ink) / <alpha-value>)',
        'chip-emerald': 'rgb(var(--chip-emerald) / <alpha-value>)',
        'chip-emerald-ink': 'rgb(var(--chip-emerald-ink) / <alpha-value>)',
        'chip-indigo': 'rgb(var(--chip-indigo) / <alpha-value>)',
        'chip-indigo-ink': 'rgb(var(--chip-indigo-ink) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}