/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      maxWidth: {
        content: '1100px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      typography: (theme) => ({
        gray: {
          css: {
            '--tw-prose-code': theme('colors.blue.600'),
            '--tw-prose-invert-code': theme('colors.blue.400'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
