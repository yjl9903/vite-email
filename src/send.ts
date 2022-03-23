import fs from 'fs';
import path from 'path';
import { lightGreen, cyan, lightRed, green } from 'kolorist';

import type { CliOption } from './types';
import { sleep } from './utils';
import { render } from './md';
import { resolveOption } from './option';

export async function send(root: string, cliOption: CliOption) {
  const indexPath = path.join(root, 'index.html');
  const existIndexHTML = fs.existsSync(indexPath);
  if (!existIndexHTML) {
    fs.writeFileSync(indexPath, `<div id="email"><!-- email --></div>`, 'utf-8');
  }

  try {
    const option = await resolveOption(root, cliOption);

    const emailConfig = option.email;

    if (emailConfig) {
      const { createTransport } = await import('nodemailer');

      const transport = createTransport(emailConfig);
      const sender = emailConfig.sender ?? emailConfig.auth!.user!;

      const items = await loadCSV(path.join(root, emailConfig.csv ?? 'data.csv'));
      const bar = await createProgressBar(items.length);

      const failList: any[] = [];

      for (const item of items) {
        if (item !== items[0]) {
          await sleep(emailConfig.sleep ?? 1000);
        }

        try {
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

          if (emailConfig.enable) {
            await transport.sendMail({
              from: sender,
              to: item.receiver,
              subject,
              html: output.content
            });
          }

          bar.update('ok', item.receiver, subject);
        } catch (error) {
          console.log(
            `${lightRed('Error')} ${(error as any).message ?? 'Unknown'} (${lightGreen(
              item.receiver
            )})`
          );
          failList.push(item);
        }
      }

      bar.stop();

      if (emailConfig.enable) {
        console.log(
          `${green('√')}  There are ${
            items.length - failList.length
          } emails has been sent successfully`
        );
  
        if (failList.length > 0) {
          await writeCSV(path.join(root, 'data.error.csv'), failList);
        }
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
          return ` ${spinner} ${bar} ${params.value}/${params.total}`;
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

async function writeCSV(filePath: string, arr: any[]) {
  const { stringify } = await import('csv-stringify/sync');
  const content = stringify(arr, { header: true });
  fs.writeFileSync(filePath, content, 'utf-8');
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
        {
          "name": "yjl",
          "receiver": "yan_jl@yeah.net",
        },
      ]
    `);
  });
}
