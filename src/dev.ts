import { bold, cyan, dim } from 'kolorist';

import { version } from '../package.json';

import { startDevServer } from './md';
import { resolveOption } from './option';

export async function dev(root: string, port: number) {
  const option = await resolveOption(root, { send: false, md: 'email.md' });
  const server = await startDevServer(option);
  printDevInfo(port);
  await server.listen(port);
}

function printDevInfo(port: number) {
  console.log();
  console.log(`${bold('  vite-plugin-email')} ${cyan(`v${version}`)}`);

  if (port) {
    console.log();
    console.log(`${dim('  Local    ')} > ${cyan(`http://localhost:${bold(port)}/`)}`);
  }

  console.log();
}
