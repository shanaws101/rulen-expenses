import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cohere: {
          black: '#000000',
          'near-black': '#17171c',
          'deep-green': '#003c33',
          'dark-navy': '#071829',
          'action-blue': '#1863dc',
          coral: '#ff7759',
          'soft-coral': '#ffad9b',
          'canvas-white': '#ffffff',
          'soft-stone': '#eeece7',
          'pale-green': '#edfce9',
          'pale-blue': '#f1f5ff',
          'card-border': '#f2f2f2',
          ink: '#212121',
          'muted-slate': '#93939f',
          slate: '#75758a',
          hairline: '#d9d9dd',
          'border-light': '#e5e7eb',
          'focus-blue': '#4c6ee6',
          'form-focus-violet': '#9b60aa',
          'error-red': '#b30000',
        },
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '22px',
        xl: '30px',
        pill: '32px',
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'Inter', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter: '-0.025em',
        tight: '-0.015em',
        mono: '0.02em',
      },
    },
  },
  plugins: [],
};

export default config;
