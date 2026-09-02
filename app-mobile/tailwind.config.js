const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
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
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Brand Action (Cosmic #23212C + Vanilla #F1FEC8)
        brand: {
          DEFAULT: '#23212C',
          primary: '#23212C',
          dark: '#191820',
          darker: '#121118',
          hover: '#191820',
          light: '#F1FEC8',
          surface: '#F7FEE7',
          soft: '#F1FEC8',
          border: '#E2F4A6',
          borderStrong: '#23212C',
          text: '#23212C',
          ink: '#23212C',
          cosmic: '#23212C',
          vanilla: '#F1FEC8',
          lavender: '#F1FEC8',
        },
        // Semaforo Allergie (Standard Clinico Globale)
        semaforo: {
          safe: {
            DEFAULT: '#10B981',
            solid: '#10B981',
            soft: '#ECFDF5',
            border: '#A7F3D0',
            text: '#065F46',
          },
          warning: {
            DEFAULT: '#F59E0B',
            solid: '#F59E0B',
            soft: '#FFFBEB',
            border: '#FDE68A',
            text: '#92400E',
          },
          danger: {
            DEFAULT: '#EF4444',
            solid: '#EF4444',
            soft: '#FEF2F2',
            border: '#FECACA',
            text: '#991B1B',
          },
          neutral: {
            DEFAULT: '#64748B',
            solid: '#64748B',
            soft: '#F1F5F9',
            border: '#CBD5E1',
            text: '#334155',
          },
        },
      },
      backgroundImage: {
        'brand-premium': 'linear-gradient(135deg, #121118 0%, #23212C 50%, #353344 100%)',
        'brand-premium-hover': 'linear-gradient(135deg, #0A090E 0%, #191820 50%, #23212C 100%)',
        'brand-vanilla': 'linear-gradient(135deg, #F1FEC8 0%, #E6F8AB 50%, #D8F18C 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate')],
};
