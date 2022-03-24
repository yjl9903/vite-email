import fs from 'fs';
import path from 'path';

import type { RenderOption } from './md';
import { DEFAULT_INDEX_HTML } from './init';

export function sleep(ms: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

export async function getIndexHtml(root: string) {
  const indexPath = path.resolve(root, 'index.html');
  const indexHTML = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, 'utf-8')
    : DEFAULT_INDEX_HTML;
  return indexHTML;
}
