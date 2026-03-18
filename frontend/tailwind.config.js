/** @type {import('tailwindcss').Config} */
// ─────────────────────────────────────────────────────────────────────────────
// SafetyMEG — Enterprise Design Token System
// Milestone 1: UI/UX Enterprise Overhaul
//
// SURFACE TOKENS use CSS custom properties so a single ".dark" class on <html>
// switches the entire palette without any extra Tailwind variants:
//
//   :root  → Light surfaces  (white / light-gray family)
//   .dark  → Dark  surfaces  (Deep Navy family)
//
// Defined in src/index.css  @layer base  { :root { … }  .dark { … } }
// Usage:   bg-surface-base  |  text-text-primary  |  border-surface-border
// ─────────────────────────────────────────────────────────────────────────────
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {

      // ═══════════════════════════════════════════════════════════════════════
      // TOKEN LAYER 1 — CORE COLOR PALETTE
      // ═══════════════════════════════════════════════════════════════════════
      colors: {
        /*
         * CORRECT TOKEN USAGE: backgrounds=bg-surface-raised/sunken/overlay,
         * text=text-text-primary/secondary/muted, brand=bg-accent/text-accent,
         * danger=bg-danger, warning=bg-warning, success=bg-success.
         * NEVER use raw numbers: bg-surface-50, bg-surface-900, text-surface-400
         * are NOT semantic. NEVER use bg-slate-800 or text-white inline.
         */

        // ── Primary: Deep Navy ──────────────────────────────────────────────
        primary: {
          DEFAULT: '#0D2137',
          50:  '#E8EEF4',
          100: '#C5D4E5',
          200: '#9FB8D3',
          300: '#789BBF',
          400: '#5A84AD',
          500: '#3C6D9B',
          600: '#2A5382',
          700: '#1A3A68',
          800: '#0D2137',
          900: '#071529',
          950: '#030C18',
        },

        // ── Accent / Brand: Teal ────────────────────────────────────────────
        accent: {
          DEFAULT: '#00A89D',
          50:  '#E0F5F4',
          100: '#B3E8E5',
          200: '#80D9D5',
          300: '#4DCAC4',
          400: '#26BEB7',
          500: '#00A89D',
          600: '#009188',
          700: '#007A72',
          800: '#00625C',
          900: '#004845',
          950: '#002F2C',
        },

        // ── Secondary: Slate Gray ───────────────────────────────────────────
        secondary: {
          DEFAULT: '#475569',
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },

        // ── Success: Green ──────────────────────────────────────────────────
        success: {
          DEFAULT: '#16A34A',
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },

        // ── Warning: Amber ──────────────────────────────────────────────────
        warning: {
          DEFAULT: '#F59E0B',
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },

        // ── Danger: Red ─────────────────────────────────────────────────────
        danger: {
          DEFAULT: '#DC2626',
          50:  '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },

        // ── Surface Tokens — semantic (CSS-var-backed) + numeric scale ────────
        // Semantic: auto dark/light via CSS vars defined in src/index.css
        // Numeric: legacy scale used in index.css @apply rules and components
        surface: {
          // Semantic tokens (CSS-var-backed)
          base:    'var(--surface-base)',
          raised:  'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
          sunken:  'var(--surface-sunken)',
          border:  'var(--surface-border)',
          // Numeric scale (legacy — used in @apply rules throughout index.css)
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },

        // ── Text Tokens (CSS-var-backed — auto dark/light) ──────────────────
        // Light values: :root  { --text-*: … }  in src/index.css
        // Dark  values: .dark  { --text-*: … }  in src/index.css
        text: {
          primary:   'var(--text-primary)',    // headings, body
          secondary: 'var(--text-secondary)',  // labels, sub-text
          muted:     'var(--text-muted)',      // placeholder, disabled
          inverted:  'var(--text-inverted)',   // text on dark bg
          onAccent:  'var(--text-on-accent)',  // text on accent/teal bg
        },

        // Futuristic slate for dark mode
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#020617',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      // ═══════════════════════════════════════════════════════════════════════
      // TOKEN LAYER 2 — TYPOGRAPHY
      // ═══════════════════════════════════════════════════════════════════════
      fontFamily: {
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Standard scale (xs → 4xl)
        'xs':   ['12px', { lineHeight: '16px' }],
        'sm':   ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg':   ['18px', { lineHeight: '28px' }],
        'xl':   ['20px', { lineHeight: '28px' }],
        '2xl':  ['24px', { lineHeight: '32px' }],
        '3xl':  ['30px', { lineHeight: '36px' }],
        '4xl':  ['36px', { lineHeight: '40px' }],
        // Semantic EHS display scale
        'display-sm': ['30px', { lineHeight: '36px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'display':    ['36px', { lineHeight: '40px', letterSpacing: '-0.02em',  fontWeight: '700' }],
        'display-lg': ['48px', { lineHeight: '52px', letterSpacing: '-0.02em',  fontWeight: '700' }],
        'display-xl': ['60px', { lineHeight: '64px', letterSpacing: '-0.025em', fontWeight: '700' }],
        // Semantic heading / label utilities
        'heading-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em',  fontWeight: '600' }],
        'heading':    ['20px', { lineHeight: '28px', letterSpacing: '-0.01em',  fontWeight: '600' }],
        'heading-sm': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'label':      ['12px', { lineHeight: '16px', letterSpacing: '0.08em',   fontWeight: '700' }],
      },

      // ═══════════════════════════════════════════════════════════════════════
      // TOKEN LAYER 3 — SPACING  (4 px base grid)
      // Tailwind's default 4px-base scale already satisfies:
      //   p-1=4px  p-2=8px  p-3=12px  p-4=16px  p-5=20px
      //   p-6=24px  p-8=32px  p-10=40px  p-12=48px  p-16=64px
      // Named semantic aliases are added for explicit token references.
      // ═══════════════════════════════════════════════════════════════════════
      spacing: {
        'space-1':  '4px',
        'space-2':  '8px',
        'space-3':  '12px',
        'space-4':  '16px',
        'space-5':  '20px',
        'space-6':  '24px',
        'space-8':  '32px',
        'space-10': '40px',
        'space-12': '48px',
        'space-16': '64px',
        // Safe-area insets (mobile)
        'safe-top':    'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left':   'env(safe-area-inset-left)',
        'safe-right':  'env(safe-area-inset-right)',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // TOKEN LAYER 4 — BORDER RADIUS
      // ═══════════════════════════════════════════════════════════════════════
      borderRadius: {
        'none':    '0px',
        'sm':      '2px',
        'DEFAULT': '4px',
        'md':      '6px',
        'lg':      '8px',
        'xl':      '12px',
        '2xl':     '16px',
        '3xl':     '24px',
        'full':    '9999px',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // TOKEN LAYER 5 — SHADOWS  (semantic names only)
      // ═══════════════════════════════════════════════════════════════════════
      boxShadow: {
        'none':     'none',
        'sm':       '0 1px 2px rgba(13,33,55,0.06)',
        'DEFAULT':  '0 1px 3px rgba(13,33,55,0.08), 0 2px 8px rgba(13,33,55,0.06)',
        'md':       '0 2px 8px rgba(13,33,55,0.08), 0 4px 16px rgba(13,33,55,0.06)',
        'lg':       '0 4px 16px rgba(13,33,55,0.10), 0 8px 32px rgba(13,33,55,0.08)',
        'xl':       '0 8px 32px rgba(13,33,55,0.12), 0 16px 48px rgba(13,33,55,0.10)',
        // Semantic component shadows
        'card':     '0 1px 3px rgba(13,33,55,0.08), 0 4px 12px rgba(13,33,55,0.08)',
        'modal':    '0 8px 24px rgba(13,33,55,0.14), 0 24px 48px rgba(13,33,55,0.12)',
        'dropdown': '0 4px 8px rgba(13,33,55,0.08), 0 8px 24px rgba(13,33,55,0.10)',
        'inner':    'inset 0 1px 2px rgba(13,33,55,0.08)',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // TOKEN LAYER 6 — TRANSITIONS & ANIMATIONS
      // Speed tokens:  fast=150ms  |  normal=300ms  |  slow=500ms
      // ═══════════════════════════════════════════════════════════════════════
      transitionDuration: {
        'fast':   '150ms',
        'normal': '300ms',
        'slow':   '500ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        // Fade — three speeds
        'fade-in-fast':  'fadeIn 150ms cubic-bezier(0.4,0,0.2,1) forwards',
        'fade-in':       'fadeIn 300ms cubic-bezier(0.4,0,0.2,1) forwards',
        'fade-in-slow':  'fadeIn 500ms cubic-bezier(0.4,0,0.2,1) forwards',
        // Slide up — three speeds
        'slide-up-fast': 'slideUp 150ms cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-up':      'slideUp 300ms cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-up-slow': 'slideUp 500ms cubic-bezier(0.16,1,0.3,1) forwards',
        // Directional slide
        'slide-down':      'slideDown 300ms cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-in-right':  'slideInRight 300ms cubic-bezier(0.16,1,0.3,1) forwards',
        // Scale
        'scale-in':        'scaleIn 300ms cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in-fast':   'scaleIn 150ms cubic-bezier(0.16,1,0.3,1) forwards',
        // Utility
        'shimmer':         'shimmer 2s linear infinite',
        'spin-slow':       'spin 3s linear infinite',
        'pulse-subtle':    'pulseSubtle 3s ease-in-out infinite',
        // Legacy aliases (kept for existing component compatibility)
        'fade-in-up':      'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'reveal-up':       'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        'reveal-scale':    'scaleIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'stagger-1':       'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards',
        'stagger-2':       'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards',
        'stagger-3':       'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s forwards',
        'stagger-4':       'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s forwards',
        'scan-line':       'scanLine 4s linear infinite',
        'pulse-neon':      'pulseSubtle 2s ease-in-out infinite',
        'data-stream':     'slideUp 3s linear infinite',
        'holo-shift':  'fadeIn 6s ease infinite',
        'border-glow': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.65' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // UTILITY DIMENSIONS
      // ═══════════════════════════════════════════════════════════════════════
      screens: {
        'sm':  '640px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1536px',
      },
      minHeight: {
        'touch': '44px',
        'dvh':   '100dvh',
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      minWidth: {
        'touch': '44px',
      },
      height: {
        'dvh':    '100dvh',
        'touch':  '44px',
        'screen': '100vh',
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'content-area': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 4rem)',
      },
      maxWidth: {
        'content':    '680px',
        '8xl':        '88rem',
        'screen-xl':  '1440px',
        'screen-2xl': '1920px',
        'dashboard':  '2400px',
      },
      maxHeight: {
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'content-area': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 4rem)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
