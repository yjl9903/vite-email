import fs from 'fs';
import path from 'path';

import sirv from 'sirv';
import { getQuery, parseURL } from 'ufo';
import { bold, cyan, dim } from 'kolorist';
import { createServer, mergeConfig, UserConfig } from 'vite';

import { version } from '../package.json';

import { validEmail } from './utils';
import { createMarkownIt } from './md';
import { resolveOption } from './option';

export async function dev(root: string, port: number) {
  const option = await resolveOption(root, { send: false, md: 'email.md' });
  const server = await createServer(
    mergeConfig(option.vite, <UserConfig>{
      plugins: [
        {
          name: 'vmail:server',
          configureServer(server) {
            server.middlewares.use(
              '/__email',
              sirv(path.join(__dirname, '../dist/client'), { single: true, dev: true })
            );

            server.middlewares.use('/__email_list', (req, res) => {
              res.end(JSON.stringify(option.receivers, null, 2));
            });

            server.middlewares.use('/__email_api', (req, res) => {
              const { search } = parseURL(req.url);
              const query = getQuery(search);
              if (query.r) {
                for (const r of option.receivers) {
                  if (r.receiver === query.r) {
                    const md = createMarkownIt({ ...option.frontmatter, ...r.frontmatter });
                    const ctx = { subject: '' };
                    const content = md.render(option.template, ctx);
                    if (r.subject) ctx.subject = r.subject;
                    res.end(JSON.stringify({ content, subject: ctx.subject }));
                  }
                }
              } else {
                const md = createMarkownIt(option.frontmatter, { frontmatter: false });
                const content = md.render(option.template);
                res.end(JSON.stringify({ content, subject: 'template' }, null, 2));
              }
            });
          }
        }
      ]
    })
  );

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
