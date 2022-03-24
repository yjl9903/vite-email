import fs from 'fs';
import path from 'path';

import sirv from 'sirv';
import { createServer, mergeConfig, UserConfig } from 'vite';
import { bold, cyan, dim } from 'kolorist';

import { version } from '../package.json';

import { validEmail } from './utils';
import { createMarkownIt } from './md';
import { resolveOption } from './option';

export async function dev(root: string, port: number) {
  const option = await resolveOption(root, { send: false, md: 'email.md' });
  const server = await createServer(mergeConfig(option.vite, <UserConfig> {
    plugins: [
      {
        name: 'vmail:server',
        configureServer(server) {
          server.middlewares.use(sirv(path.join(__dirname, '../dist/client'), { single: true, dev: true }))
        }
      }
    ]
  }));

  printDevInfo(port);

  await server.listen(port);
}

function printDevInfo(port: number) {
  console.log();
  console.log(`${bold('  vite-plugin-email')} ${cyan(`v${version}`)}`);

  if (port) {
    console.log();
    console.log(`${dim('  Local    ')} > ${cyan(`http://localhost:${bold(port)}/__email`)}`);
  }

  console.log();
}
