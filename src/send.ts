import fs from 'fs';
import path from 'path';
import { lightGreen, cyan, lightRed, green } from 'kolorist';

import type { CliOption } from './types';
import { sleep } from './utils';
import { render, REPLACER } from './md';
import { resolveOption, writeCSV } from './option';

export async function send(root: string, cliOption: CliOption) {
  const indexPath = path.join(root, 'index.html');
  const existIndexHTML = fs.existsSync(indexPath);
  if (!existIndexHTML) {
    fs.writeFileSync(indexPath, `<div id="email">${REPLACER}</div>`, 'utf-8');
  }

  try {
    const option = await resolveOption(root, cliOption);

    const emailConfig = option.email;

    const { createTransport } = await import('nodemailer');

    const transport = createTransport(emailConfig);

    const bar = await createProgressBar(option.receivers.length);

    const failList: Array<typeof option.receivers[0]> = [];

    for (const receiver of option.receivers) {
      if (receiver !== option.receivers[0]) {
        await sleep(emailConfig.sleep ?? 1000);
      }

      try {
        bar.update('render', receiver.receiver);

        option.frontmatter = {
          ...emailConfig.frontmatter,
          ...receiver
        };

        const output = await render(option);
        const subject = receiver.subject ?? output.subject;
        if (!subject) {
          // handle empty subject
          throw new Error('You should set subject in your csv or in the title of Markdown');
        }

        bar.update('send', receiver.receiver, subject);

        if (emailConfig.enable) {
          await transport.sendMail({
            from: emailConfig.sender,
            to: receiver.receiver,
            subject,
            html: output.content
          });
        }

        bar.update('ok', receiver.receiver, subject);
      } catch (error) {
        console.log(
          `${lightRed('Error')} ${(error as any).message ?? 'Unknown'} (${lightGreen(
            receiver.receiver
          )})`
        );
        failList.push(receiver);
      }
    }

    bar.stop();

    if (emailConfig.enable) {
      console.log(
        `${green('√')}  There are ${
          option.receivers.length - failList.length
        } emails has been sent successfully`
      );

      if (failList.length > 0) {
        await writeCSV(path.join(root, 'data.error.csv'), failList);
      }
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
