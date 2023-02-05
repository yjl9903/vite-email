import type { Plugin, ViteDevServer } from 'vite';

import fs from 'fs-extra';
import url from 'node:url';
import path from 'node:path';

import sirv from 'sirv';

import type { ResolvedOption } from '../types';

import { loadDataSource } from '../loader';
import { createMarkownIt } from '../render';
import { DEFAULT_INDEX_HTML } from '../init';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export async function VMailServer(option: ResolvedOption): Promise<Plugin> {
  let template = await fs.readFile(option.template, 'utf-8');
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

  function parseTemplate(t: string) {
    const ctx: Record<string, string> = {};
    const markdown = createMarkownIt({}, { frontmatter: false });
    const result = markdown.render(t, ctx);
    return result;
  }

  const receivers = await loadDataSource(option);

  let server: ViteDevServer | undefined = undefined;

  return {
    name: 'vmail:server',
    async handleHotUpdate(ctx) {
      if (ctx.file === option.template) {
        template = await ctx.read();
        server?.ws.clients.forEach((client) =>
          client.send('vite-email:template', { template: parseTemplate(template) })
        );
      } else if (ctx.file === option.source) {
        receivers.splice(0, receivers.length, ...(await loadDataSource(option)));
        server?.ws.clients.forEach((client) => client.send('vite-email:list', { receivers }));
      }
    },
    configureServer(_server) {
      server = _server;

      // Watch template and data source
      server.watcher.add(option.template);
      server.watcher.add(option.source);

      server.middlewares.use(
        '/__email',
        sirv(path.join(__dirname, '../../build/client'), { single: true, dev: true })
      );

      server.ws.on('vite-email:ready', (_data, client) => {
        client.send('vite-email:list', { receivers });
        client.send('vite-email:template', { template: parseTemplate(template) });
      });

      server.ws.on('vite-email:query', (data, client) => {
        const recv = data?.receiver;
        const receiver = receivers.find((r) => r.receiver === recv);
        if (!!receiver) {
          const ctx: Record<string, string> = {};
          const markdown = createMarkownIt(receiver.frontmatter, { frontmatter: true });
          const result = markdown.render(template, ctx);

          client.send('vite-email:rendered', {
            receiver,
            content: result,
            subject: receiver.subject ?? ctx.title
          });
        }
      });

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
