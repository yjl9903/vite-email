import path from 'path';

import { defineConfig } from 'vite';

import vue from '@vitejs/plugin-vue';
import Unocss from 'unocss/vite';
import Inspect from 'vite-plugin-inspect';

import { resolveOption, VMailServer } from '../vite-email/src';

const vmailOption = await resolveOption('../../example', {
  dryRun: true,
  send: '',
  user: '',
  pass: '',
  template: 'email.md'
});

export default defineConfig({
  base: '/__email/',
  plugins: [vue(), Unocss(), Inspect(), await VMailServer(vmailOption)],
  build: {
    outDir: path.resolve(__dirname, '../vite-email/build/client'),
    minify: true,
    emptyOutDir: true
  }
});
