import {
  defineConfig,
  presetUno,
  presetIcons,
  presetWebFonts,
  presetAttributify,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.1,
      extraProperties: {
        height: '1em',
        'flex-shrink': '0',
        display: 'inline-block'
      }
    }),
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: ['Inter', 'Noto Sans Simplified Chinese'],
        mono: 'Input Mono'
      }
    })
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  shortcuts: {
    'bg-base': 'bg-op-50 bg-white dark:bg-[#1a1a1a]',
    'border-base': 'border-gray/40 dark:border-gray/40',
    'text-base-50': 'text-neutral-50 dark:text-light-50',
    'text-base-100': 'text-neutral-100 dark:text-light-100',
    'text-base-200': 'text-neutral-200 dark:text-light-200',
    'text-base-300': 'text-neutral-300 dark:text-light-300',
    'text-base-400': 'text-neutral-400 dark:text-light-400',
    'text-base-500': 'text-neutral-500 dark:text-light-500',
    'text-base-600': 'text-neutral-600 dark:text-light-600',
    'text-base-700': 'text-neutral-700 dark:text-light-700',
    'text-base-800': 'text-neutral-800 dark:text-light-800',
    'text-base-900': 'text-neutral-900 dark:text-light-900',
    'text-base': 'text-$text-light-1 dark:text-$text-dark-1',
    'icon-btn': 'op30 hover:op100'
  },
  theme: {
    boxShadow: {
      DEFAULT: '0 0 0 0.125rem rgba(0, 0, 0, 0.1)',
      navbar: '0 2px 0 0 #f5f5f5',
      box: '0 2px 3px rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 10%)',
      success: '0 0 0 0.125em rgb(72 199 142 / 25%)',
      info: '0 0 0 0.125em rgb(32 156 238 / 25%)',
      warning: '0 0 0 0.125em rgb(255 224 138 / 25%)',
      danger: '0 0 0 0.125em rgb(241 70 104 / 25%)'
    },
    breakpoints: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      xxl: '1536px'
    }
  }
});
