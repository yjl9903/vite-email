import fs from 'fs';
import path from 'path';
import { loadConfigFromFile, mergeConfig, normalizePath } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import type { RenderOption } from './md';
import type { CliOption, ViteEmailConfig, UserConfig, FrontmatterFn } from './types';

export type Receiver = {
  receiver: string;
  subject?: string;
  attachments: string[];
  frontmatter: Record<string, string>;
};

type ResolvedOption = RenderOption & {
  entry: string;
  email: Required<ViteEmailConfig>;
  receivers: Receiver[];
};

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
  } else if (cliOption.dryRun === true) {
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
    receivers.push({ receiver: cliOption.send, attachments: [], frontmatter: {} });
  } else {
    if (!emailConfig.csv) {
      emailConfig.csv = 'data.csv';
    }
    const csvPath = path.join(root, emailConfig.csv!);
    receivers.push(...(await loadCSV(csvPath, emailConfig.frontmatter)));
  }

  // 1. Cli Option (overwrite vite config)
  if (cliOption.user) {
    emailConfig.auth!.user = cliOption.user;
  }
  if (cliOption.pass) {
    emailConfig.auth!.pass = cliOption.pass;
  }

  // 2. Prompt user / pass
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
    template: fs.readFileSync(path.join(root, cliOption.template), 'utf8'),
    frontmatter: emailConfig.frontmatter ?? {},
    email: mergedViteConfig.email as Required<ViteEmailConfig>,
    entry: normalizePath(path.resolve(process.cwd(), root, cliOption.template)),
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

export async function loadCSV(
  filePath: string,
  frontmatter: Record<string, string | FrontmatterFn> = {}
): Promise<Receiver[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { parse } = await import('csv-parse/sync');
  const result = parse(content, {
    encoding: 'utf-8',
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return parseCSV(result, frontmatter);
}

function parseCSV(
  rawData: Array<Record<string, string>>,
  frontmatter: Record<string, string | FrontmatterFn> = {}
): Receiver[] {
  const names: string[] = [];
  const receivers: Receiver[] = [];

  const getField = (record: Record<string, string>, field: string) => {
    if (field in record) {
      return record[field];
    } else if (field in frontmatter) {
      const defaultValue = frontmatter[field];
      if (typeof defaultValue === 'string') {
        return defaultValue;
      } else if (typeof defaultValue === 'function') {
        return defaultValue(record);
      } else {
        return undefined;
      }
    }
  };

  const getReceiver = (record: Record<string, string>): string | undefined =>
    getField(record, 'receiver');

  const getAttachment = (record: Record<string, string>): string[] => {
    const rawAttachment =
      (getField(record, 'attachment') ?? '') + ':' + (getField(record, 'attachments') ?? '');

    return rawAttachment
      .split(':')
      .map((t) => t.trim())
      .filter(Boolean);
  };

  const getExtraField = (record: Record<string, string>): Record<string, string> => {
    const extra: Record<string, string> = {};
    for (const key in frontmatter) {
      if (
        key === 'receiver' ||
        key === 'subject' ||
        key === 'attachment' ||
        key === 'attachments'
      ) {
        continue;
      }
      const value = getField(record, key);
      if (value) {
        extra[key] = value;
      }
    }
    return extra;
  };

  for (const receiver of rawData) {
    const name = getReceiver(receiver);
    if (!name || name.length === 0) {
      throw new Error(`Get receiver fail in "${JSON.stringify(receiver)}"`);
    } else {
      names.push(name);
    }

    const attachments: string[] = getAttachment(receiver);

    receivers.push({
      receiver: name,
      subject: getField(receiver, 'subject'),
      attachments,
      frontmatter: {
        ...getExtraField(receiver),
        ...receiver
      }
    });
  }

  if (new Set(names).size !== names.length) {
    throw new Error('Duplicate receivers');
  }

  return receivers;
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
          "attachments": [],
          "frontmatter": {
            "name": "XLor",
            "receiver": "yjl9903@vip.qq.com",
          },
          "receiver": "yjl9903@vip.qq.com",
          "subject": undefined,
        },
        {
          "attachments": [],
          "frontmatter": {
            "name": "yjl",
            "receiver": "yan_jl@yeah.net",
          },
          "receiver": "yan_jl@yeah.net",
          "subject": undefined,
        },
      ]
    `);
  });

  it('success parse csv with custom field', () => {
    expect(parseCSV([{ name: '123' }], { receiver: 'name' })).toMatchInlineSnapshot(`
      [
        {
          "attachments": [],
          "frontmatter": {
            "name": "123",
          },
          "receiver": "name",
          "subject": undefined,
        },
      ]
    `);

    expect(parseCSV([{ receiver: '123' }], { name: 'abc' })).toMatchInlineSnapshot(`
      [
        {
          "attachments": [],
          "frontmatter": {
            "name": "abc",
            "receiver": "123",
          },
          "receiver": "123",
          "subject": undefined,
        },
      ]
    `);

    expect(parseCSV([{ 姓名: '456' }], { receiver: (r) => r['姓名'] })).toMatchInlineSnapshot(`
      [
        {
          "attachments": [],
          "frontmatter": {
            "姓名": "456",
          },
          "receiver": "456",
          "subject": undefined,
        },
      ]
    `);
  });

  it('must have valid receiver', () => {
    // @ts-ignore
    expect(() => parseCSV([{ name: '123' }])).toThrowErrorMatchingInlineSnapshot(
      '"Get receiver fail in \\"{\\"name\\":\\"123\\"}\\""'
    );
    // @ts-ignore
    expect(() => parseCSV([{ receiver: '' }])).toThrowErrorMatchingInlineSnapshot(
      '"Get receiver fail in \\"{\\"receiver\\":\\"\\"}\\""'
    );
    expect(() =>
      // @ts-ignore
      parseCSV([{ receiver: '1' }, { receiver: '1' }])
    ).toThrowErrorMatchingInlineSnapshot('"Duplicate receivers"');
  });

  it('parse attachment', () => {
    expect(parseCSV([{ receiver: '123', attachment: '123', attachments: '456:789' }]))
      .toMatchInlineSnapshot(`
      [
        {
          "attachments": [
            "123",
            "456",
            "789",
          ],
          "frontmatter": {
            "attachment": "123",
            "attachments": "456:789",
            "receiver": "123",
          },
          "receiver": "123",
          "subject": undefined,
        },
      ]
    `);

    expect(parseCSV([{ receiver: '123' }], { attachment: 'pdf' })).toMatchInlineSnapshot(`
      [
        {
          "attachments": [
            "pdf",
          ],
          "frontmatter": {
            "receiver": "123",
          },
          "receiver": "123",
          "subject": undefined,
        },
      ]
    `);

    expect(parseCSV([{ receiver: '123' }], { attachment: (r) => r['receiver'] + '.pdf' }))
      .toMatchInlineSnapshot(`
        [
          {
            "attachments": [
              "123.pdf",
            ],
            "frontmatter": {
              "receiver": "123",
            },
            "receiver": "123",
            "subject": undefined,
          },
        ]
      `);
  });
}
