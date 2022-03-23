import fs from 'fs';
import path from 'path';
import MarkdownIt from 'markdown-it';
// @ts-ignore
import MarkdownItTitle from 'markdown-it-title';
import { createTransport } from 'nodemailer';
import { build, loadConfigFromFile, mergeConfig, Plugin } from 'vite';

import { UserConfig } from './types';

interface RenderOption {
  vite: UserConfig;

  template: string;

  frontmatter?: Record<string, any>;
}

interface RenderOutput {
  content: string;

  subject?: string;
}

export async function send(root: string) {
  const indexPath = path.join(root, 'index.html');
  const existIndexHTML = fs.existsSync(indexPath);
  if (!existIndexHTML) {
    fs.writeFileSync(indexPath, `<div id="email"><!-- email --></div>`, 'utf-8');
  }

  try {
    const viteConfig = await loadConfigFromFile(
      { command: 'build', mode: 'prod' },
      path.join(root, 'vite.config.ts')
    );

    const option: RenderOption = {
      vite: mergeConfig(viteConfig ? viteConfig.config : {}, {
        root,
        build: {
          write: false
        },
        logLevel: 'warn',
        plugins: []
      }),
      template: fs.readFileSync(path.join(root, 'email.md'), 'utf8')
    };

    const emailConfig = option.vite.email;

    if (emailConfig) {
      const transport = createTransport(emailConfig);
      const sender = emailConfig.sender ?? emailConfig?.auth?.user!;
      if (!sender) {
        // handle empty sender
      }
      for (const item of await loadCSV(path.join(root, emailConfig.csv ?? 'data.csv'))) {
        option.frontmatter = {
          ...emailConfig.frontmatter,
          ...item
        };
        const output = await render(option);
        const subject = item.subject ?? output.subject;
        if (!subject) {
          // handle empty subject
        }
        await transport.sendMail({
          from: sender,
          to: item.receiver,
          subject,
          html: output.content
        });
      }
    } else {
      // handle empty mail config
    }
  } finally {
    if (!existIndexHTML) {
      fs.unlinkSync(indexPath);
    }
  }
}

async function loadCSV(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { parse } = await import('csv-parse/sync');
  return parse(content, { columns: true, skip_empty_lines: true });
}

async function render(option: RenderOption): Promise<RenderOutput> {
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
              // fail to find
              state.pending += `"${varName} NOT FOUND"`;
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

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  it('parse csv', async () => {
    expect(await loadCSV(path.join(__dirname, '../example/data.csv'))).toMatchInlineSnapshot(`
      [
        {
          "name": "XLor",
          "receiver": "yjl9903@vip.qq.com",
        },
      ]
    `);
  });
}
