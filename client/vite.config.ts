import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Inspect from 'vite-plugin-inspect';
import Unocss from 'unocss/vite';
import presetAttributify from '@unocss/preset-attributify';
import transformerDirective from '@unocss/transformer-directives';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    Unocss({ presets: [presetAttributify()], transformers: [transformerDirective()] }),
    Inspect()
  ],
  build: {
    outDir: path.resolve(__dirname, '../dist/client'),
    minify: true,
    emptyOutDir: true
  }
});
