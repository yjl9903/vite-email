import fs from 'fs';
import path from 'path';
import { build, loadConfigFromFile, mergeConfig, Plugin, UserConfig } from 'vite';
import MarkdownIt from 'markdown-it';

interface RenderOption {
  vite: UserConfig;

  template: string;

  frontmatter?: Record<string, any>;
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
      vite: mergeConfig(viteConfig ?? {}, {
        root,
        build: {
          write: false
        },
        logLevel: 'warn',
        plugins: []
      }),
      template: fs.readFileSync(path.join(root, 'email.md'), 'utf8')
    };

    console.log(await render(option));
  } finally {
    if (!existIndexHTML) {
      fs.unlinkSync(indexPath);
    }
  }
}

export async function render(option: RenderOption) {
  const output = await build(
    mergeConfig(option.vite, { plugins: [createMdPlugin(option.template, option.frontmatter)] })
  );
  // @ts-ignore
  return output.output[0].source;
}

function createMdPlugin(template: string, frontmatter: Record<string, any> = {}): Plugin {
  return {
    name: 'vmail:md',
    transformIndexHtml(html) {
      const markdown = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true
      });

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

      return html.replace('<!-- email -->', markdown.render(template));
    }
  };
}
