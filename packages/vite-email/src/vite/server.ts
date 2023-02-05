import type { Plugin } from 'vite';

import fs from 'fs';
import path from 'path';
import sirv from 'sirv';
import { getQuery, parseURL } from 'ufo';

import type { ResolvedOption } from '../types';

import { DEFAULT_INDEX_HTML } from '../init';
import { createMarkownIt, render, REPLACER } from '../render';

export async function VMailServer(option: ResolvedOption): Promise<Plugin> {
  let template = '';
  let style = '';
  let index = '';

  // const updateIndex = async () => {
  //   index = await getIndexHtml(option.root);
  //   const { content } = await render(option, { frontmatter: false });
  //   const res = /<style[\s\S]*>[\s\S]*<\/style>/.exec(content);
  //   if (res) style = res[0];
  // };
  // const transform = (code: string) => {
  //   return index.replace(REPLACER, style + code);
  // };
  // await updateIndex();

  return {
    name: 'vmail:server',
    apply: 'serve',
    async handleHotUpdate(ctx) {
      if (ctx.file === option.template) {
        template = await ctx.read();
        // await updateIndex();
      }
    },
    configureServer(server) {
      server.middlewares.use(
        '/__email',
        sirv(path.join(__dirname, '../build/client'), { single: true, dev: true })
      );

      // server.middlewares.use('/__email_list', (_req, res) => {
      //   res.end(JSON.stringify(option.receivers, null, 2));
      // });

      // server.middlewares.use('/__email_api', (req, res) => {
      //   const { search } = parseURL(req.url);
      //   const query = getQuery(search);
      //   if (query.r) {
      //     for (const r of option.receivers) {
      //       if (r.receiver === query.r) {
      //         const md = createMarkownIt({ ...option.frontmatter, ...r.frontmatter });
      //         const ctx = { subject: '' };
      //         const content = transform(md.render(option.template, ctx));
      //         if (r.subject) ctx.subject = r.subject;
      //         res.end(JSON.stringify({ content, subject: ctx.subject }));
      //       }
      //     }
      //   } else {
      //     const md = createMarkownIt(option.frontmatter, { frontmatter: false });
      //     const content = transform(md.render(option.template));
      //     res.end(JSON.stringify({ content, subject: 'template' }, null, 2));
      //   }
      // });
    }
  };
}

async function getIndexHtml(root: string) {
  const indexPath = path.resolve(root, 'index.html');
  const indexHTML = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, 'utf-8')
    : DEFAULT_INDEX_HTML;
  return indexHTML;
}
