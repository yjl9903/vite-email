import type { UserConfig } from './types';

export type { Receiver } from './option';

export type { UserConfig };

export function defineConfig(config: UserConfig) {
  return config;
}
