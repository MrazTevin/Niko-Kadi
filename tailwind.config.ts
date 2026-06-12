import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Navy colors
        navy: {
          950: '#0a0e1a',
          900: '#0d1224',
          800: '#111827',
          700: '#1e2a3a',
        },
        // Card colors
        card: {
          light: '#f8f4ef',
          mid: '#e8e0d5',
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Gold colors
        gold: {
          200: '#fef3c7',
          300: '#fde68a',
          400: '#f59e0b',
          500: '#d97706',
        },
        // Suit colors
        suit: {
          red: '#e53e3e',
          'red-dim': 'rgba(229, 62, 62, 0.6)',
          dark: '#c53030',
          'dark-dim': 'rgba(197, 48, 48, 0.6)',
        },
        // Special accents
        jump: '#06b6d4',
        kickback: '#f97316',
        penalty: '#ef4444',
        question: '#a855f7',
        ace: '#10b981',
        // Joker gradient colors will be handled in CSS
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
        'dm-sans': ['var(--font-dm-sans)', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glow-gold": {
          "0%, 100%": { 
            boxShadow: "0 0 5px rgba(245, 158, 11, 0.5), 0 0 10px rgba(245, 158, 11, 0.3)" 
          },
          "50%": { 
            boxShadow: "0 0 15px rgba(245, 158, 11, 0.8), 0 0 20px rgba(245, 158, 11, 0.5)" 
          },
        },
        "glow-cyan": {
          "0%, 100%": { 
            boxShadow: "0 0 5px rgba(6, 182, 212, 0.5), 0 0 10px rgba(6, 182, 212, 0.3)" 
          },
          "50%": { 
            boxShadow: "0 0 15px rgba(6, 182, 212, 0.8), 0 0 20px rgba(6, 182, 212, 0.5)" 
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-gold": "glow-gold 2s ease-in-out infinite",
        "glow-cyan": "glow-cyan 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
