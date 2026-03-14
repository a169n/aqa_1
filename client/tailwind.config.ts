import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        xl: '1.25rem',
      },
      boxShadow: {
        paper: '0 18px 45px rgba(26, 41, 37, 0.08)',
      },
      fontFamily: {
        display: ['Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'serif'],
        sans: ['Avenir Next', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
      backgroundImage: {
        hero:
          'radial-gradient(circle at top left, rgba(176, 73, 38, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(41, 86, 78, 0.14), transparent 30%)',
      },
    },
  },
  plugins: [],
} satisfies Config;

