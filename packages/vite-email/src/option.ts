import path from 'path';

import { loadConfigFromFile, mergeConfig, normalizePath } from 'vite';

import type { CliOption, ViteEmailConfig, UserConfig, ResolvedOption } from './types';

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
        // output: {
        //   manualChunks: () => 'all-in-one.js'
        // },
        onwarn() {}
      }
    },
    logLevel: 'silent',
    plugins: []
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
  // const receivers: Receiver[] = [];

  // // If specify send target, do not read csv
  // if (typeof cliOption.send === 'string' && cliOption.send.length > 0) {
  //   receivers.push({ receiver: cliOption.send, attachments: [], frontmatter: {} });
  // } else {
  //   if (!emailConfig.csv) {
  //     emailConfig.csv = 'data.csv';
  //   }
  //   const csvPath = path.join(root, emailConfig.csv!);
  //   receivers.push(...(await loadCSV(csvPath, emailConfig.frontmatter)));
  // }

  // 1. Use cli option to overwrite vite config
  if (cliOption.user !== '') {
    emailConfig.auth!.user = cliOption.user;
  }
  if (cliOption.pass !== '') {
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

  // 3. Set default value
  if (!emailConfig.sender) {
    emailConfig.sender = emailConfig.auth!.user!;
  }
  if (!emailConfig.source) {
    emailConfig.source = 'data.csv';
  }

  const option: ResolvedOption = {
    root: normalizePath(path.resolve(process.cwd(), root, cliOption.template)),
    vite: mergedViteConfig,
    template: normalizePath(path.resolve(process.cwd(), root, cliOption.template)),
    source: normalizePath(path.resolve(process.cwd(), root, emailConfig.source)),
    email: emailConfig as Required<ViteEmailConfig>
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
