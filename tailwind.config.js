/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // MadHat brand tokens (sourced from style.css :root)
        navy: {
          DEFAULT: '#0C1A3A',
          mid: '#162448',
          light: '#1E3260',
        },
        orange: {
          DEFAULT: '#C4561A',
          bright: '#E06020',
          pale: '#F4A56A',
        },
        cream: '#F5F0E8',

        // shadcn semantic mappings (re-routed to MadHat tokens)
        border: 'rgba(245, 240, 232, 0.12)',
        input: 'rgba(245, 240, 232, 0.08)',
        ring: '#C4561A',
        background: '#0C1A3A',
        foreground: '#F5F0E8',
        primary: {
          DEFAULT: '#C4561A',
          foreground: '#0C1A3A',
        },
        secondary: {
          DEFAULT: '#162448',
          foreground: '#F5F0E8',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#F5F0E8',
        },
        muted: {
          DEFAULT: '#162448',
          foreground: 'rgba(245, 240, 232, 0.55)',
        },
        accent: {
          DEFAULT: '#1E3260',
          foreground: '#F5F0E8',
        },
        popover: {
          DEFAULT: '#162448',
          foreground: '#F5F0E8',
        },
        card: {
          DEFAULT: '#162448',
          foreground: '#F5F0E8',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0px',
        md: '0px',
        sm: '0px',
      },
      letterSpacing: {
        'wider-2': '0.12em',
        'widest-2': '0.18em',
        'widest-3': '0.22em',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.7s ease forwards'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
