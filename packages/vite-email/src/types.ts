import type { UserConfig as ViteUserConfig } from 'vite';

export type UserConfig = ViteUserConfig & { email?: ViteEmailConfig };

export type FrontmatterFn = (frontmatter: Record<string, string>) => string;

export interface ViteEmailConfig {
  /**
   * Enable send email
   *
   * @default true
   */
  enable?: boolean;

  /**
   * Sender name
   */
  sender?: string;

  /**
   * Default frontmatter
   *
   * @default {}
   */
  frontmatter?: Record<string, string | FrontmatterFn>;

  /**
   * Path to the csv data file
   *
   * @default 'data.csv'
   */
  csv?: string;

  /**
   * Sleep time between continuous sending
   *
   * @default 1000
   */
  sleep?: number;

  /**
   * the hostname or IP address to connect to (defaults to ‘localhost’)
   */
  host?: string;

  /**
   * the port to connect to (defaults to 25 or 465)
   */
  port?: number;

  /**
   * defines authentication data
   */
  auth?: {
    /**
     * username
     */
    user?: string;

    /**
     * password
     */
    pass?: string;
  };

  /**
   * defines if the connection should use SSL (if true) or not (if false)
   */
  secure?: boolean;
}

export interface CliOption {
  dryRun: boolean;

  send: string;

  user?: string | undefined;

  pass?: string | undefined;

  /**
   * @default "email.md"
   */
  template: string;
}
