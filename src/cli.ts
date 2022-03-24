import { cac } from 'cac';
import { debug } from 'debug';
import { lightRed } from 'kolorist';

import { version } from '../package.json';

import type { CliOption } from './types';
import { init } from './init';
import { send } from './send';
import { dev } from './dev';

const cli = cac();

cli.command('init [root]', 'Init workspace').action(async (root: string | undefined) => {
  await init(root);
});

cli
  .command('[root]', 'Send Email')
  .option('--md <template>', 'Markdown template path', { default: 'email.md' })
  .option('--no-send', 'Disable email sending')
  .option('--send [receiver]', 'Send email to receiver')
  .option('--user <user>', 'Username of your email')
  .option('--pass <pass>', 'Password of your email')
  .action(async (root: string | undefined, option: CliOption) => {
    await send(root ?? './', option);
  });

cli
  .command('dev [root]', 'Start dev server')
  .option('--md <template>', 'Markdown template path', { default: 'email.md' })
  .option('--port <port>', 'port to listen to', { default: 3000 })
  .action(async (root: string | undefined, option: { port: number, md: string }) => {
    await dev(root ?? './', option.port);
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
