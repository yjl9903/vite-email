import type { UserConfig as ViteUserConfig } from 'vite';

export type UserConfig = ViteUserConfig & { email?: ViteEmailConfig };

export interface ViteEmailConfig {}
