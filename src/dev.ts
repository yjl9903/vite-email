import fs from 'fs';
import path from 'path';

import polka from 'polka';
import { bold, cyan, dim } from 'kolorist';

import { version } from '../package.json';

import { validEmail } from './utils';
import { startDevServer } from './md';
import { resolveOption } from './option';
import { DEFAULT_INDEX_HTML } from './init';

export async function dev(root: string, port: number) {
  const option = await resolveOption(root, { send: false, md: 'email.md' });
  const vite = await startDevServer(option);

  printDevInfo(port);

  const app = polka()
    .use(vite.middlewares)
    .get('/', async (req, res, next) => {
      try {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');

        const url = req.originalUrl;
        const template = await vite.transformIndexHtml(url, await getIndexHtml(root));
        const html = template;

        res.end(html);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    })
    .get('/:email', async (req, res, next) => {
      try {
        const email = req.params.email;
        if (!validEmail(email)) {
          throw new Error(`${email} is not a valid email`);
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');

        res.end(email);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });

  await app.listen(port);
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

async function getIndexHtml(root: string) {
  const indexPath = path.resolve(root, 'index.html');
  const indexHTML = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, 'utf-8')
    : DEFAULT_INDEX_HTML;
  return indexHTML;
}
