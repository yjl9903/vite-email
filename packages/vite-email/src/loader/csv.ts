import fs from 'fs-extra';

import type { Receiver, ResolvedOption } from '../types';

import { resolveDataSource } from './resolver';

export async function loadCSV(option: ResolvedOption): Promise<Receiver[]> {
  const content = fs.readFileSync(option.source, 'utf-8');

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
