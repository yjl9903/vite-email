import MarkdownIt from 'markdown-it';
import { build, createServer, mergeConfig, Plugin } from 'vite';
// @ts-ignore
import MarkdownItTitle from 'markdown-it-title';

import type { UserConfig } from './types';
import { getIndexHtml } from './utils';

export const REPLACER = `<!-- email -->`;

export interface RenderOption {
  vite: UserConfig;

  template: string;

  frontmatter?: Record<string, any>;
}

export interface RenderOutput {
  content: string;

  subject?: string;
}

export async function startDevServer(option: RenderOption) {
  return await createServer({
    plugins: [createMdPlugin({}, option.template, option.frontmatter)]
  });
}

export async function render(option: RenderOption): Promise<RenderOutput> {
  const ctx: any = {};
  const output = await build(
    mergeConfig(option.vite, {
      plugins: [
        createMdPlugin(ctx, option.template, option.frontmatter),
        <Plugin>{
          name: 'vmail:index',
          apply: 'build',
          transformIndexHtml(html) {
            return html.replace(/<script[\s\S]*>[\s\S]*<\/script>/g, '');
          }
        }
      ]
    })
  );

  return {
    // @ts-ignore
    content: output.output.find((o) => o.fileName === 'index.html').source,
    subject: ctx.title
  };
}

function createMdPlugin(
  ctx: Record<string, string>,
  template: string,
  frontmatter: Record<string, any> = {}
): Plugin {
  let root: string;

  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  }).use(MarkdownItTitle);

  markdown.inline.ruler.push('frontmatter', (state) => {
    if (state.src.charCodeAt(state.pos) !== 0x7b /* { */) {
      return false;
    }
    if (state.src.charCodeAt(state.pos + 1) !== 0x7b /* { */) {
      return false;
    }
    let pos = state.pos + 2;
    for (; pos + 1 < state.src.length; pos++) {
      if (
        state.src.charCodeAt(pos) === 0x7d /* } */ &&
        state.src.charCodeAt(pos + 1) === 0x7d /* } */
      ) {
        const varName = state.src.slice(state.pos + 2, pos - 1).trim();
        if (varName in frontmatter) {
          state.pending += frontmatter[varName];
        } else {
          // fail to find varName
          throw new Error(`"${varName}" not found when render Markdown`);
        }
      } else {
        const tmp = state.src.slice(state.pos + 2, pos).trim();
        if (/\s/.test(tmp)) {
          return false;
        }
      }
    }
    state.pos = pos + 2;
    return true;
  });

  return {
    name: 'vmail:md',
    configResolved(config) {
      root = config.root!;
    },
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url!.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
            res.statusCode = 200;
            res.end(await getIndexHtml(root));
            return;
          }
          next();
        });
      };
    },
    transformIndexHtml(html) {
      return html.replace(REPLACER, markdown.render(template, ctx));
    }
  };
}
