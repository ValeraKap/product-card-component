/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './layout/**/*.liquid',
    './templates/**/*.liquid',
    './sections/**/*.liquid',
    './snippets/**/*.liquid',
    './blocks/**/*.liquid',
    './assets/**/*.js',
  ],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false,
  },
};
