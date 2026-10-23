/** @type {import('tailwindcss').Config} */
const v = n => `rgb(var(--${n}) / <alpha-value>)`;
const scale = (name, shades) => Object.fromEntries(shades.map(s => [s, v(`${name}-${s}`)]));
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: v('canvas'), surface: v('surface'), line: v('line'),
        ink: v('ink'), mute: v('mute'), faint: v('faint'),
        brand: scale('brand',[50,100,200,500,600,700]),
        sage: scale('sage',[50,100,300,600,700]),
        sand: scale('sand',[50,100,300,600,700]),
        blush: scale('blush',[50,100,600,700]),
        mist: scale('mist',[50,100,700])
      },
      boxShadow: { soft: '0 1px 2px rgb(var(--shadow) / .05), 0 10px 28px -14px rgb(var(--shadow) / .18)' }
    }
  },
  plugins: []
};
