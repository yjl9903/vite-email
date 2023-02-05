import path from 'path';

import { defineConfig } from 'vite';

import vue from '@vitejs/plugin-vue';
import Unocss from 'unocss/vite';
import Icons from 'unplugin-icons/vite';
import Inspect from 'vite-plugin-inspect';

export default defineConfig({
  base: '/__email/',
  plugins: [vue(), Icons({ autoInstall: true }), Unocss(), Inspect()],
  build: {
    outDir: path.resolve(__dirname, '../vite-email/build/client'),
    minify: true,
    emptyOutDir: true
  }
});
