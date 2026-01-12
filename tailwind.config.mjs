import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  plugins: [tailwindcssAnimate, typography],
  prefix: '',
  safelist: [
    'lg:col-span-4',
    'lg:col-span-6',
    'lg:col-span-8',
    'lg:col-span-12',
    'border-border',
    'bg-card',
    'border-error',
    'bg-error/30',
    'border-success',
    'bg-success/30',
    'border-warning',
    'bg-warning/30',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        '2xl': '2rem',
        DEFAULT: '1rem',
        lg: '2rem',
        md: '2rem',
        sm: '1rem',
        xl: '0.5rem',
      },
      screens: {
        '2xl': '86rem',
        lg: '64rem',
        md: '48rem',
        sm: '40rem',
        xl: '80rem',
      },
    },
    extend: {
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        background: 'hsl(var(--background))',
        border: 'hsla(var(--border))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        foreground: 'hsl(var(--foreground))',
        input: 'hsl(var(--input))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        ring: 'hsl(var(--ring))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        success: 'hsl(var(--success))',
        error: 'hsl(var(--error))',
        warning: 'hsl(var(--warning))',

        // Brand colors
        'light-gray': 'var(--light-gray)',
        'light-beige': 'var(--light-beige)',
        'mild-gray': 'var(--mild-gray)',
        beige: 'var(--beige)',
        gray: 'var(--gray)',
        yellow: 'var(--yellow)',
        mustard: 'var(--mustard)',
        rust: 'var(--rust)',
        cream: 'var(--cream)',
        purple: 'var(--purple)',
      },
      fontFamily: {
        mono: ['var(--font-geist-mono)'],
        sans: ['var(--font-geist-sans)'],
        semplicita: ['var(--font-semplicita)'],
        roboto: ['var(--font-roboto)'],
      },
      fontSize: {
        // Mobile sizes
        'h1-mobile': ['46px', '60px'],
        'h2-mobile': ['36px', '42px'],
        'h3-mobile': ['32px', '42px'],
        'h4-mobile': ['28px', '32px'],
        'h5-mobile': ['20px', '28px'],
        'h6-mobile': ['16px', '24px'],
        'body-mobile': ['16px', '24px'],
        'quote-mobile': ['32px', '42px'],

        // Desktop sizes
        'h1-desktop': ['60px', '70px'],
        'h2-desktop': ['40px', '48px'],
        'h3-desktop': ['36px', '48px'],
        'h4-desktop': ['30px', '36px'],
        'h5-desktop': ['24px', '32px'],
        'h6-desktop': ['20px', '28px'],
        'body-desktop': ['16px', '24px'],
        'quote-desktop': ['36px', '48px'],
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
      typography: () => ({
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--text)',
              '--tw-prose-headings': 'var(--text)',
              h1: {
                fontWeight: 'normal',
                marginBottom: '0.25em',
                fontSize: '46px', // Mobile default
                lineHeight: '60px',
                '@screen md': {
                  fontSize: '60px', // Desktop size at md breakpoint
                  lineHeight: '70px',
                },
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h2: {
                fontSize: '36px',
                lineHeight: '42px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
                '@screen md': {
                  fontSize: '40px',
                  lineHeight: '48px',
                },
              },
              h3: {
                fontSize: '32px',
                lineHeight: '42px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
                '@screen md': {
                  fontSize: '36px',
                  lineHeight: '48px',
                },
              },
              h4: {
                fontSize: '28px',
                lineHeight: '32px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
                '@screen md': {
                  fontSize: '30px',
                  lineHeight: '36px',
                },
              },
              h5: {
                fontSize: '20px',
                lineHeight: '28px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
                '@screen md': {
                  fontSize: '24px',
                  lineHeight: '32px',
                },
              },
              h6: {
                fontSize: '16px',
                lineHeight: '24px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
                '@screen md': {
                  fontSize: '20px',
                  lineHeight: '28px',
                },
              },
              blockquote: {
                fontSize: '32px',
                lineHeight: '42px',
                fontFamily: 'var(--font-roboto)',
                fontStyle: 'italic',
                '@screen md': {
                  fontSize: '36px',
                  lineHeight: '48px',
                },
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: {
                fontSize: '46px',
                lineHeight: '60px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h2: {
                fontSize: '36px',
                lineHeight: '42px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h3: {
                fontSize: '32px',
                lineHeight: '42px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h4: {
                fontSize: '28px',
                lineHeight: '32px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h5: {
                fontSize: '20px',
                lineHeight: '28px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h6: {
                fontSize: '16px',
                lineHeight: '24px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
            },
          ],
        },
        md: {
          css: [
            {
              h1: {
                fontSize: '60px',
                lineHeight: '70px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h2: {
                fontSize: '40px',
                lineHeight: '48px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h3: {
                fontSize: '36px',
                lineHeight: '48px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h4: {
                fontSize: '30px',
                lineHeight: '36px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h5: {
                fontSize: '24px',
                lineHeight: '32px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
              h6: {
                fontSize: '20px',
                lineHeight: '28px',
                fontFamily: 'var(--font-semplicita)',
                fontWeight: '700',
              },
            },
          ],
        },
      }),
    },
  },
}

export default config
