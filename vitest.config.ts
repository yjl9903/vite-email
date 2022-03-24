import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/option.ts', 'src/md.ts']
  }
});
