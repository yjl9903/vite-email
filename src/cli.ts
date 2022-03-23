import { cac } from 'cac';
import { version } from '../package.json';

const cli = cac();

cli.command('[root]', 'Send Email').action((root?: string) => {
  console.log('Root: %s', root ?? process.cwd());
});

cli.version(version);

cli.help();

cli.parse();
