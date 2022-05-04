import path from 'path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Inspect from 'vite-plugin-inspect';
import Icons from 'unplugin-icons/vite';

import Unocss from 'unocss/vite';
import { presetAttributify, presetUno } from 'unocss';
import transformerDirective from '@unocss/transformer-directives';

export default defineConfig({
  base: '/__email/',
  plugins: [
    vue(),
    Icons({ autoInstall: true }),
    Unocss({ presets: [presetUno(), presetAttributify()], transformers: [transformerDirective()] }),
    Inspect()
  ],
  build: {
    outDir: path.resolve(__dirname, '../dist/client'),
    minify: true,
    emptyOutDir: true
  }
});
