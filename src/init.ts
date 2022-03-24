import fs from 'fs';
import path from 'path';

import { version } from '../package.json';
import { REPLACER } from './md';

export async function init(_root?: string) {
  const root = _root ? path.resolve(process.cwd(), _root) : process.cwd();
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root);
  }
  if (fs.readdirSync(root).length > 0) {
    throw new Error(`Directory ${_root} is not empty`);
  }

  console.log(`Init workspace in ${root}...`);

  writePackage(path.join(root, 'package.json'));
  writeVite(path.join(root, 'vite.config.ts'));
  writeEmail(root);

  console.log(`\nDone. Now run:\n`);

  console.log(`  $ cd ${_root}`);
  console.log(`  $ npm install`);
  console.log(`  $ npm run send`);
}

function writePackage(path: string) {
  const pkg = `{
  "private": true,
  "scripts": {
    "send": "vmail"
  },
  "dependencies": {
    "vite-plugin-email": "^${version}"
  }
}`;
  fs.writeFileSync(path, pkg, 'utf-8');
}

function writeVite(path: string) {
  const config = `import { defineConfig } from 'vite-plugin-email';

export default defineConfig({
  email: {
    host: '<host>',
    secure: true,
    auth: {
      user: process.env.user
    }
  }
});`;
  fs.writeFileSync(path, config, 'utf-8');
}

export const DEFAULT_INDEX_HTML = `<html>
<head>
  <meta charset="UTF-8">
  <title>Email</title>
</head>
<body>
  <div>${REPLACER}</div>
</body>
</html>`;

export const DEFAULT_INDEX_HTML_MAIN = `<html>
<head>
  <meta charset="UTF-8">
  <title>Email</title>
</head>
<body>
  <div>${REPLACER}</div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`;

function writeEmail(root: string) {
  fs.writeFileSync(path.join(root, 'email.md'), `# Hello {{ name }}\n`, 'utf-8');
  fs.writeFileSync(path.join(root, 'data.csv'), `receiver,name\n`, 'utf-8');

  fs.writeFileSync(path.join(root, 'index.html'), DEFAULT_INDEX_HTML_MAIN, 'utf-8');

  fs.mkdirSync(path.join(root, 'src'));

  fs.writeFileSync(path.join(root, 'src/main.js'), `import './style.css';`, 'utf-8');

  fs.writeFileSync(path.join(root, 'src/style.css'), `h1 { display: none; }`, 'utf-8');
}
