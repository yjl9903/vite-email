import { debug } from 'debug';
import { breadc } from 'breadc';
import { lightRed } from '@breadc/color';
import { complete } from '@breadc/complete';

import { version, description } from '../package.json';

import type { CliOption } from './types';

import { dev } from './dev';
import { init } from './init';
import { send } from './send';

const cli = breadc('vmail', { version, description, plugins: [complete()] });

cli
  .command('send [root]', 'Send Email')
  .alias('')
  .option('-t, --template <template>', 'Markdown template path', { default: 'email.md' })
  .option('--dry-run', 'Disable email sending')
  .option('--send <receiver>', 'Send email to receiver')
  .option('--user <user>', 'Username of your email')
  .option('--pass <pass>', 'Password of your email')
  .action(async (root, option: CliOption) => {
    await send(root ?? './', option);
  });

cli
  .command('dev [root]', 'Start Email dev server')
  .option('-t, --template <template>', 'Markdown template path', { default: 'email.md' })
  .option('--port <port>', 'port to listen to', { default: '3000', cast: (t) => +t })
  .action(async (root: string | undefined, option: { port: number; template: string }) => {
    await dev(root ?? './', option.template, option.port);
  });

cli.command('init [root]', 'Init workspace').action(async (root: string | undefined) => {
  await init(root);
});

async function bootstrap() {
  try {
    await cli.run(process.argv.slice(2));
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
