import * as path from 'node:path';

import { bold, cyan, dim } from '@breadc/color';
import { createServer, mergeConfig, UserConfig } from 'vite';

import { version } from '../package.json';

import type { ResolvedOption } from './types';

import { VMailServer } from './vite';
import { resolveOption } from './option';

export async function dev(root: string, template: string, port: number) {
  const option = await resolveOption(root, {
    dryRun: true,
    send: '',
    user: '',
    pass: '',
    template
  });

  const server = await createServer(
    mergeConfig(option.vite, <UserConfig>{
      plugins: [await VMailServer(option)]
    })
  );

  printDevInfo(port, option);

  await server.listen(port);
}

function printDevInfo(port: number, option: ResolvedOption) {
  const getP = (p: string) => {
    const f = path.relative(option.root, p);
    return `${path.dirname(f)}/${bold(path.basename(f))}`;
  };

  console.log();
  console.log(`${bold('  vite-email')} ${cyan(`v${version}`)}`);
  console.log();
  console.log(`${dim('  Template')} > ${getP(option.template)}`);
  console.log(`${dim('  Source  ')} > ${getP(option.source)}`);
  console.log(`${dim('  Server  ')} > ${cyan(`http://localhost:${bold(port)}/__email`)}`);
  console.log();
}
