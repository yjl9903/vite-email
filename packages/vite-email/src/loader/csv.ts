import fs from 'fs-extra';
import { TextDecoder } from 'node:util';

import type { Receiver, ResolvedOption } from '../types';

import { resolveDataSource } from './resolver';

export async function loadCSV(option: ResolvedOption): Promise<Receiver[]> {
  const buffer = await fs.readFile(option.source);
  const content = new TextDecoder('utf-8', { ignoreBOM: false }).decode(buffer);

  const { parse } = await import('csv-parse/sync');
  const result = parse(content, {
    encoding: 'utf-8',
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return resolveDataSource(result, option.email.frontmatter);
}

export async function writeCSV(filePath: string, arr: Array<Receiver>) {
  const { stringify } = await import('csv-stringify/sync');
  const content = stringify(arr, { header: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}
