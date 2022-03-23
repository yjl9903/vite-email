import { cac } from 'cac';
import { debug } from 'debug';
import { lightRed } from 'kolorist';

import { version } from '../package.json';

import { send } from './send';

const cli = cac();

cli.command('[root]', 'Send Email').action(async (root?: string) => {
  await send(root ?? './');
});

cli.version(version);

cli.help();

async function bootstrap() {
  try {
    cli.parse(process.argv, { run: false });
    await cli.runMatchedCommand();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(lightRed('Error ') + error.message);
    } else {
      console.error(error);
    }
    debug('vmail')(error);
    process.exit(1);
  }
}

bootstrap();
