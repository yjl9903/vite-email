import { cac } from 'cac';
import { debug } from 'debug';
import { lightRed } from 'kolorist';

import { version } from '../package.json';

import type { CliOption } from './types';
import { send } from './send';
import { init } from './init';

const cli = cac();

cli
  .command('[root]', 'Send Email')
  .option('--no-send', 'Disable email sending')
  .option('--send [receiver]', 'Send email to receiver')
  .option('--user <user>', 'Username of your email')
  .option('--pass <pass>', 'Password of your email')
  .action(async (root: string | undefined, option: CliOption) => {
    await send(root ?? './', option);
  });

cli.command('init [root]', 'Init workspace').action(async (root: string | undefined) => {
  await init(root);
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
