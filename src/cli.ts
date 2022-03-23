import { cac } from 'cac';

import { version } from '../package.json';

import { send } from './send';

const cli = cac();

cli.command('[root]', 'Send Email').action(async (root?: string) => {
  await send(root ?? './');
});

cli.version(version);

cli.help();

cli.parse();
