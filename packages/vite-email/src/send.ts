import path from 'path';
import fs from 'fs-extra';

import { lightGreen, cyan, lightRed, green, red, hidden } from '@breadc/color';

import type { CliOption } from './types';

import { sleep } from './utils';
import { resolveOption } from './option';
import { render, REPLACER } from './render';
import { loadDataSource, writeCSV } from './loader';

export async function send(root: string, cliOption: CliOption) {
  const indexPath = path.join(root, 'index.html');
  const existIndexHTML = fs.existsSync(indexPath);
  if (!existIndexHTML) {
    fs.writeFileSync(indexPath, `<div id="email">${REPLACER}</div>`, 'utf-8');
  }

  const option = await resolveOption(root, cliOption);
  const emailConfig = option.email;

  const receivers = await loadDataSource(option);
  const bar = await createProgressBar(receivers.length);

  try {
    const { createTransport } = await import('nodemailer');
    const transport = createTransport(emailConfig);

    // For dry run output
    const outputRoot = path.join(root, '.output');
    if (!cliOption.dryRun) {
      try {
        await transport.verify();
      } catch (error) {
        bar.log(`${lightRed('Verify Error')} ${(error as any).message ?? 'Unknown'}`);
        return;
      }
    } else {
      await fs.rm(outputRoot, { recursive: true, force: true });
      await fs.ensureDir(outputRoot);
    }

    const failList: Array<any> = [];

    for (const receiver of receivers) {
      if (receiver !== receivers[0]) {
        await sleep(emailConfig.sleep ?? 1000);
      }

      try {
        bar.update('render', receiver.receiver);

        const output = await render(receiver, option);
        const subject = output.subject;
        if (!subject) {
          // handle empty subject
          throw new Error('You should set subject in your csv or in the title of Markdown');
        }

        bar.update('send', receiver.receiver, subject);

        if (!cliOption.dryRun) {
          // Check attachment
          for (const attch of receiver.attachments) {
            if (!fs.existsSync(attch)) {
              throw new Error(`The attachment "${attch}" (${receiver.receiver}) does not exist`);
            }
          }

          await transport.sendMail({
            from: emailConfig.sender,
            to: receiver.receiver,
            subject,
            html: output.content,
            attachments: receiver.attachments.map((p) => ({
              filename: path.basename(p),
              path: path.join(root, p)
            }))
          });
        } else {
          await fs.mkdir(path.join(outputRoot, receiver.receiver));
          await fs.writeFile(
            path.join(outputRoot, receiver.receiver, `${subject}.html`),
            output.content,
            'utf-8'
          );
          for (const attachment of receiver.attachments) {
            await fs.copyFile(
              path.join(root, attachment),
              path.join(outputRoot, receiver.receiver, path.basename(attachment))
            );
          }
        }
      } catch (error) {
        bar.log(
          `${red('✗')} ${(error as any).message ?? 'Unknown'} (${lightGreen(receiver.receiver)})`
        );
        failList.push(receiver.frontmatter);
      } finally {
        bar.update('ok', receiver.receiver);
      }
    }

    if (emailConfig.enable) {
      bar.log('');
      bar.log(
        `${failList.length === 0 ? green('√') : red('✗')} There are ${
          receivers.length - failList.length
        } emails has been sent successfully`
      );

      if (failList.length > 0) {
        await writeCSV(path.join(root, 'data.error.csv'), failList);
      }
    }
  } finally {
    bar.stop();
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
        const spinner = cyan(spinners[(payload.stamp ?? 0) % spinners.length]);

        if (payload.type === 1) {
          if (payload.status === 'render') {
            return `   Render email for ${lightGreen(payload.receiver)}`;
          } else if (payload.status === 'send') {
            return `   Sending email to ${lightGreen(payload.receiver)}`;
          } else if (payload.status === 'ok') {
            return `   Send email OK to ${lightGreen(payload.receiver)}`;
          } else {
            return `   Verifying connection...`;
          }
        } else if (payload.type === 2) {
          return ` ${spinner} ${bar} ${params.value}/${params.total}`;
        } else {
          return `${hidden(bar)}`;
        }
      },
      barsize,
      linewrap: false
    },
    Presets.shades_grey
  );

  const b0 = bar.create(length, 0);
  const b1 = bar.create(length, 0);
  const b2 = bar.create(length, 0);

  const payload = { status: 'verify', receiver: '', subject: '', stamp: 0 };
  const timer = setInterval(() => {
    b0.increment(0, { ...payload, type: 0 });
    b1.increment(0, { ...payload, type: 1 });
    b2.increment(0, { ...payload, type: 2 });
    payload.stamp++;
  }, 100);

  let firstLog = true;
  const logs: string[] = [];
  const outputLog = () => {
    for (const log of logs) {
      console.log(log);
    }
    logs.splice(0);
  };
  b0.on('redraw-pre', outputLog);

  return {
    log(log: string) {
      if (firstLog) {
        logs.push('');
        firstLog = false;
      }
      logs.push(log);
    },
    update(status: 'send' | 'render' | 'ok', receiver: string = '', subject: string = '') {
      payload.status = status;
      payload.receiver = receiver;
      payload.subject = subject;
      const step = status === 'ok' ? 1 : 0;
      b0.increment(step, { ...payload, type: 0 });
      b1.increment(step, { ...payload, type: 1 });
      b2.increment(step, { ...payload, type: 2 });
    },
    stop() {
      clearInterval(timer);
      bar.stop();
      setTimeout(outputLog, 0);
    }
  };
}
