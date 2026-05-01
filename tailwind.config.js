export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        club: {
          primary: 'var(--club-primary)',
          secondary: 'var(--club-secondary)',
        }
      }
    },
  },
  plugins: [],
}
