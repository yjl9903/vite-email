import path from 'path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index', 'src/cli'],
  declaration: true,
  clean: true,
  externals: [path.join(__dirname, './package.json')],
  replace: {
    'import.meta.vitest': 'undefined'
  },
  rollup: {
    emitCJS: true
  }
});
