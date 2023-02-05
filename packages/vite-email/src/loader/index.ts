import type { Receiver, ResolvedOption } from '../types';

import { loadCSV } from './csv';

export * from './csv';

export async function loadDataSource(option: ResolvedOption): Promise<Receiver[]> {
  const file = option.email.source;
  if (file.endsWith('.csv')) {
    return loadCSV(option);
  } else {
    throw new Error(`Data source "${file}" does not support`);
  }
}
