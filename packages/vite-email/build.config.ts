import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index', 'src/cli'],
  declaration: true,
  clean: true,
  replace: {
    'import.meta.vitest': 'undefined'
  },
  rollup: {
    emitCJS: true
  }
});
