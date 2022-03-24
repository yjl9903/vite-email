import fs from 'fs';
import path from 'path';
import { loadConfigFromFile, mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import type { RenderOption } from './md';
import type { CliOption, ViteEmailConfig, UserConfig } from './types';

type Receiver = {
  receiver: string;
} & Record<string, string>;

type ResolvedOption = RenderOption & { email: Required<ViteEmailConfig>; receivers: Receiver[] };

export async function resolveOption(root: string, cliOption: CliOption): Promise<ResolvedOption> {
  const viteConfig = await loadConfigFromFile(
    { command: 'build', mode: 'prod' },
    path.join(root, 'vite.config.ts')
  );

  const mergedViteConfig: UserConfig = mergeConfig(viteConfig ? viteConfig.config : {}, {
    root,
    build: {
      write: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      chunkSizeWarningLimit: Number.MAX_SAFE_INTEGER,
      cssCodeSplit: false,
      brotliSize: false,
      rollupOptions: {
        inlineDynamicImports: true,
        output: {
          manualChunks: () => 'all-in-one.js'
        },
        onwarn() {}
      }
    },
    logLevel: 'silent',
    plugins: [viteSingleFile()]
  });

  if (!mergedViteConfig.email) {
    mergedViteConfig.email = { enable: false };
  } else if (cliOption.send === false) {
    mergedViteConfig.email.enable = false;
  } else {
    mergedViteConfig.email.enable = true;
  }

  if (!mergedViteConfig.email.auth) {
    mergedViteConfig.email.auth = {};
  }

  const emailConfig = mergedViteConfig.email;
  const receivers: Receiver[] = [];

  // If specify send target, do not read csv
  if (typeof cliOption.send === 'string' && cliOption.send.length > 0) {
    receivers.push({ receiver: cliOption.send });
  } else {
    const csvPath = path.join(root, emailConfig?.csv ?? 'data.csv');
    receivers.push(...(await loadCSV(csvPath)));
  }

  // 1. Cli Option (overwrite vite config)
  if (cliOption.user) {
    emailConfig.auth!.user = cliOption.user;
  }
  if (cliOption.pass) {
    emailConfig.auth!.pass = cliOption.pass;
  }

  // 2. Prompt user
  if (emailConfig.enable) {
    if (!emailConfig.auth!.user) {
      emailConfig.auth!.user = await promptForUser();
      emailConfig.auth!.pass = await promptForPass();
    } else if (!emailConfig?.auth?.pass) {
      emailConfig.auth!.pass = await promptForPass();
    }
  }

  if (!emailConfig.sender) {
    emailConfig.sender = emailConfig.auth!.user!;
  }

  const option: ResolvedOption = {
    vite: mergedViteConfig,
    template: fs.readFileSync(path.join(root, cliOption.md), 'utf8'),
    frontmatter: emailConfig.frontmatter ?? {},
    email: mergedViteConfig.email as Required<ViteEmailConfig>,
    receivers
  };

  return option;
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

export async function loadCSV(filePath: string): Promise<Receiver[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { parse } = await import('csv-parse/sync');
  const result: Receiver[] = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  checkCSV(result);
  return result;
}

function checkCSV(receivers: Receiver[]): boolean {
  const res: string[] = [];
  for (const receiver of receivers) {
    if (!receiver.receiver) {
      throw new Error(`Receiver field is empty in "${JSON.stringify(receiver)}"`);
    } else {
      res.push(receiver.receiver);
    }
  }
  if (new Set(res).size !== res.length) {
    throw new Error('Duplicate receivers');
  }
  return true;
}

export async function writeCSV(filePath: string, arr: Array<Receiver>) {
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

  it('must have valid receiver', () => {
    // @ts-ignore
    expect(() => checkCSV([{ name: '123' }])).toThrowErrorMatchingInlineSnapshot(
      '"Receiver field is empty in \\"{\\"name\\":\\"123\\"}\\""'
    );
    expect(() => checkCSV([{ receiver: '' }])).toThrowErrorMatchingInlineSnapshot(
      '"Receiver field is empty in \\"{\\"receiver\\":\\"\\"}\\""'
    );
    expect(() =>
      checkCSV([{ receiver: '1' }, { receiver: '1' }])
    ).toThrowErrorMatchingInlineSnapshot('"Duplicate receivers"');
  });
}
