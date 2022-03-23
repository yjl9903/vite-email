import MarkdownIt from 'markdown-it';
import { build, mergeConfig, Plugin } from 'vite';
// @ts-ignore
import MarkdownItTitle from 'markdown-it-title';

import type { UserConfig } from './types';

export interface RenderOption {
  vite: UserConfig;

  template: string;

  frontmatter?: Record<string, any>;
}

export interface RenderOutput {
  content: string;

  subject?: string;
}

export async function render(option: RenderOption): Promise<RenderOutput> {
  const ctx = {};
  const output = await build(
    mergeConfig(option.vite, {
      plugins: [createMdPlugin(ctx, option.template, option.frontmatter)]
    })
  );

  // @ts-ignore
  return { content: output.output[0].source, subject: ctx.title };
}

function createMdPlugin(
  ctx: Record<string, string>,
  template: string,
  frontmatter: Record<string, any> = {}
): Plugin {
  return {
    name: 'vmail:md',
    transformIndexHtml(html) {
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

      return html.replace('<!-- email -->', markdown.render(template, ctx));
    }
  };
}
