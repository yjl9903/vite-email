import type { UserConfig } from './types';

export type { Receiver, UserConfig } from './types';

export * from './vite';

export * from './loader';

export * from './render';

export * from './option';

export function defineConfig(config: UserConfig) {
  return config;
}
