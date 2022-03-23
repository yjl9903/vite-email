import fs from "fs";
import path from "path";
import { loadConfigFromFile, mergeConfig } from "vite";

import type { RenderOption } from "./md";
import type { CliOption, ViteEmailConfig, UserConfig } from "./types";

type ResolvedOption = RenderOption & { email: Required<ViteEmailConfig> };

export async function resolveOption(root: string, cliOption: CliOption): Promise<ResolvedOption> {
  const viteConfig = await loadConfigFromFile(
    { command: 'build', mode: 'prod' },
    path.join(root, 'vite.config.ts')
  );
  
  const mergedViteConfig: UserConfig = mergeConfig(viteConfig ? viteConfig.config : {}, {
    root,
    build: {
      write: false,
      rollupOptions: {
        onwarn() {}
      }
    },
    logLevel: 'warn',
    plugins: []
  });

  if (!mergedViteConfig.email) {
    mergedViteConfig.email = {};
  }
  if (!mergedViteConfig.email.auth) {
    mergedViteConfig.email.auth = {};
  }

  const emailConfig = mergedViteConfig.email;

  if (cliOption.send === false) {
    emailConfig.enable = false;
  } else {
    emailConfig.enable = true;
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

  const option: ResolvedOption = {
    vite: mergedViteConfig,
    template: fs.readFileSync(path.join(root, 'email.md'), 'utf8'),
    email: mergedViteConfig.email as Required<ViteEmailConfig>
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