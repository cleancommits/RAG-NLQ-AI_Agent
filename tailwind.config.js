module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  safelist: [
    'hover:bg-gray-200',
    'bg-gray-100',
    'bg-gray-200',
    'bg-gray-300',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          100: '#ddd', // Explicitly define bg-gray-100 color
          200: '#eee', // Explicitly define bg-gray-200 color
        },
      },
    },
  },
  plugins: [],
};