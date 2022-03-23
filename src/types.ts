import type { UserConfig as ViteUserConfig } from 'vite';

export type UserConfig = ViteUserConfig & { email?: ViteEmailConfig };

export interface ViteEmailConfig {
  sender?: string;

  /**
   * Default frontmatter
   *
   * @default {}
   */
  frontmatter?: Record<string, string>;

  /**
   * Path to the csv data file
   *
   * @default 'data.csv'
   */
  csv?: string;

  /**
   * the hostname or IP address to connect to (defaults to ‘localhost’)
   */
  host?: string | undefined;

  /**
   * the port to connect to (defaults to 25 or 465)
   */
  port?: number | undefined;

  /**
   * defines authentication data
   */
  auth?:
    | {
        /** the username */
        user: string;
        /** then password */
        pass: string;
      }
    | undefined;

  /**
   * defines if the connection should use SSL (if true) or not (if false)
   */
  secure?: boolean | undefined;
}
