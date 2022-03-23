import fs from 'fs';
import path from 'path';
import { lightGreen, cyan } from 'kolorist';
import { loadConfigFromFile, mergeConfig } from 'vite';

import { RenderOption, render } from './md';
import { sleep } from './utils';

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
          write: false,
          rollupOptions: {
            onwarn() {}
          }
        },
        logLevel: 'warn',
        plugins: []
      }),
      template: fs.readFileSync(path.join(root, 'email.md'), 'utf8')
    };

    const emailConfig = option.vite.email;

    if (emailConfig) {
      const { createTransport } = await import('nodemailer');

      if (!emailConfig?.auth?.user) {
        emailConfig.auth = {};
        emailConfig.auth.user = await promptForUser();
        emailConfig.auth.pass = await promptForPass();
      } else if (!emailConfig?.auth?.pass) {
        emailConfig.auth.pass = await promptForPass();
      }

      const transport = createTransport(emailConfig);
      const sender = emailConfig.sender ?? emailConfig?.auth?.user!;

      if (!sender) {
        // handle empty sender
        throw new Error('No sender');
      }

      const items = await loadCSV(path.join(root, emailConfig.csv ?? 'data.csv'));
      const bar = await createProgressBar(items.length);

      for (const item of items) {
        if (item !== items[0]) {
          await sleep(emailConfig.sleep ?? 1000);
        }

        bar.update('render', item.receiver);

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

        bar.update('send', item.receiver, subject);

        await transport.sendMail({
          from: sender,
          to: item.receiver,
          subject,
          html: output.content
        });

        bar.update('ok', item.receiver, subject);
      }

      bar.stop();
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

async function promptForUser() {
  const prompts = (await import('prompts')).default;
  const { user } = await prompts({
    type: 'text',
    name: 'user',
    message: ' User'
  });
  return user;
}

async function promptForPass() {
  const prompts = (await import('prompts')).default;
  const { pass } = await prompts({
    type: 'password',
    name: 'pass',
    message: ' Pass'
  });
  return pass;
}

async function createProgressBar(length: number) {
  const { MultiBar, Presets } = await import('cli-progress');
  const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const barsize = 50;
  const bar = new MultiBar(
    {
      clearOnComplete: true,
      hideCursor: true,
      format(options, params, payload) {
        const completeSize = Math.round(params.progress * barsize);
        const incompleteSize = barsize - completeSize;
        const bar =
          options.barCompleteString!.slice(0, completeSize) +
          options.barIncompleteString!.slice(0, incompleteSize);
        const spinner = cyan(spinners[payload.stamp % spinners.length]);

        if (payload.type === 1) {
          if (payload.status === 'render') {
            return `   Render email for ${lightGreen(payload.receiver)}`;
          } else {
            return `   Sending email to ${lightGreen(payload.receiver)}`;
          }
        } else {
          return ` ${spinner} ${bar} ${params.progress}/${params.total}`;
        }
      },
      barsize,
      linewrap: false
    },
    Presets.shades_grey
  );
  const b1 = bar.create(length, 0);
  const b2 = bar.create(length, 0);

  console.log();

  const payload = { status: '', receiver: '', subject: '', stamp: 0 };
  const timer = setInterval(() => {
    b1.increment(0, { ...payload, type: 1 });
    b2.increment(0, { ...payload, type: 2 });
    payload.stamp++;
  }, 100);

  return {
    update(status: 'send' | 'render' | 'ok', receiver: string = '', subject: string = '') {
      payload.status = status;
      payload.receiver = receiver;
      payload.subject = subject;
      const step = status === 'ok' ? 1 : 0;
      b1.increment(step, { ...payload, type: 1 });
      b2.increment(step, { ...payload, type: 2 });
    },
    stop() {
      clearInterval(timer);
      bar.stop();
    }
  };
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
