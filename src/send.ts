import fs from 'fs';
import path from 'path';
import { loadConfigFromFile, mergeConfig } from 'vite';

import { RenderOption, render } from './md';

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
      const { createTransport } = await import('nodemailer');
      const transport = createTransport(emailConfig);
      const sender = emailConfig.sender ?? emailConfig?.auth?.user!;

      if (!sender) {
        // handle empty sender
        throw new Error('No sender');
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
          throw new Error('You should set subject in your csv or in the title of Markdown');
        }
        await transport.sendMail({
          from: sender,
          to: item.receiver,
          subject,
          html: output.content
        });
      }
    } else {
      // handle empty email config
      throw new Error('No email config found in vite.config.ts');
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
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
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
