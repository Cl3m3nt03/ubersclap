/**
 * Les valeurs ci-dessous refletent packages/shared/src/design-tokens.ts,
 * qui reste la source de verite (il alimente aussi le generateur de PDF).
 *
 * La duplication est necessaire : Tailwind resout ses couleurs a la
 * compilation et ne peut pas lire un module TypeScript. En cas de changement,
 * modifier design-tokens.ts EN PREMIER, puis reporter ici.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        indigo: { DEFAULT: '#4F46E5', soft: '#818CF8' },
        ink: {
          DEFAULT: '#1A1C1E',
          muted: '#6B7280',
          faint: '#9CA3AF',
        },
        canvas: '#FDFDFD',
        surface: '#FFFFFF',
        hairline: '#F3F4F6',
        success: '#059669',
        warning: '#D97706',
        danger: '#DC2626',
        teal: { from: '#0D9488', to: '#2DD4BF' },
        coral: { from: '#F43F5E', to: '#FB7185' },
        purple: { from: '#7C3AED', to: '#A78BFA' },
      },
      fontFamily: {
        sans: ['PlusJakartaSans_500Medium'],
        medium: ['PlusJakartaSans_500Medium'],
        semibold: ['PlusJakartaSans_600SemiBold'],
        bold: ['PlusJakartaSans_700Bold'],
        extra: ['PlusJakartaSans_800ExtraBold'],
      },
      borderRadius: {
        sm: '12px',
        md: '16px',
        lg: '24px',
      },
    },
  },
  plugins: [],
};
