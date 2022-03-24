import fs from 'fs';
import path from 'path';

import polka from 'polka';
import { bold, cyan, dim } from 'kolorist';

import { version } from '../package.json';

import { validEmail } from './utils';
import { createMarkownIt, startDevServer } from './md';
import { resolveOption } from './option';
import { DEFAULT_INDEX_HTML } from './init';

export async function dev(root: string, port: number) {
  const option = await resolveOption(root, { send: false, md: 'email.md' });
  const vite = await startDevServer(option);

  printDevInfo(port);

  const app = polka()
    .use(vite.middlewares)
    .get('/', async (req, res, next) => {
      try {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');

        const url = req.originalUrl;
        const template = await vite.transformIndexHtml(url, DevHtml);

        const receivers = option.receivers.map(
          ({ receiver }) => `<a href="/${receiver}">${receiver}</a>`
        );
        const html = template
          .replace('<!-- list -->', '<a href="/">Template</a>' + receivers.join(''))
          .replace('<!-- email -->', option.template);

        res.end(html);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    })
    .get('/:email', async (req, res, next) => {
      try {
        const email = req.params.email;
        if (!validEmail(email)) {
          throw new Error(`${email} is not a valid email`);
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');

        const url = req.originalUrl;
        const template = await vite.transformIndexHtml(url, DevHtml);

        const receivers = option.receivers.map(
          ({ receiver }) => `<a href="/${receiver}">${receiver}</a>`
        );
        const markdown = createMarkownIt(option.receivers.find((r) => r.receiver === email));
        const html = template
          .replace('<!-- receiver -->', email)
          .replace('<!-- list -->', '<a href="/">Template</a>' + receivers.join(''))
          .replace('<!-- email -->', markdown.render(option.template, {}));

        res.end(html);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });

  app.listen(port);
}

function printDevInfo(port: number) {
  console.log();
  console.log(`${bold('  vite-plugin-email')} ${cyan(`v${version}`)}`);

  if (port) {
    console.log();
    console.log(`${dim('  Local    ')} > ${cyan(`http://localhost:${bold(port)}/`)}`);
  }

  console.log();
}

async function getIndexHtml(root: string) {
  const indexPath = path.resolve(root, 'index.html');
  const indexHTML = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, 'utf-8')
    : DEFAULT_INDEX_HTML;
  return indexHTML;
}

const DevHtml = `<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite Plugin Email</title>
    <style>
    html,body,#app{height:100%;margin:0;padding:0}.font-none{font-size:0}nav{height:54px;display:flex;grid-gap:1rem;gap:1rem;border-width:0px;border-bottom-width:1px;border-style:solid;--un-border-opacity:1;border-color:rgba(156,163,175,var(--un-border-opacity));padding-left:1.5rem;padding-right:1.5rem}nav>*{margin-top:auto;margin-bottom:auto}#main{height:calc(100vh - 55px);display:flex}#receiver{font-weight:lighter}#sidebar>a{display:block;border-width:0px;border-bottom-width:1px;border-style:solid;padding:.5rem .75rem;text-align:left;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:.875rem;line-height:1.25rem;cursor:pointer;-webkit-text-decoration-color:transparent;text-decoration-color:transparent;text-decoration:none}#sidebar>a:hover{--un-bg-opacity:1;background-color:rgba(246,246,246,var(--un-bg-opacity))}#sidebar>a:active{text-decoration:none;color:inherit}.children\:my-auto>*{margin-top:auto;margin-bottom:auto;}.mr-2{margin-right:0.5rem;}.block{display:block;}.h-\[calc\(100\%-2rem\)\]{height:calc(100% - 2rem);}.h-\[calc\(100vh-55px\)\]{height:calc(100vh - 55px);}.h-54px{height:54px;}.h-full{height:100%;}.min-w-48{min-width:12rem;}.flex{display:flex;}.flex-grow{flex-grow:1;}.cursor-pointer{cursor:pointer;}.select-none{user-select:none;}.gap-4{grid-gap:1rem;gap:1rem;}.overflow-auto{overflow:auto;}.border-0{border-width:0px;border-style:solid;}.border-b{border-bottom-width:1px;border-style:solid;}.border-r{border-right-width:1px;border-style:solid;}.border-gray-400{--un-border-opacity:1;border-color:rgba(156,163,175,var(--un-border-opacity));}.hover\:bg-light-400:hover{--un-bg-opacity:1;background-color:rgba(246,246,246,var(--un-bg-opacity));}.p-4{padding:1rem;}.px-3{padding-left:0.75rem;padding-right:0.75rem;}.px-6{padding-left:1.5rem;padding-right:1.5rem;}.py-2{padding-top:0.5rem;padding-bottom:0.5rem;}.text-left{text-align:left;}.font-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;}.text-base{font-size:1rem;line-height:1.5rem;}.text-sm{font-size:0.875rem;line-height:1.25rem;}.font-bold{font-weight:700;}.text-gray-700{--un-text-opacity:1;color:rgba(55,65,81,var(--un-text-opacity));}.underline-transparent{-webkit-text-decoration-color:transparent;text-decoration-color:transparent;}
    </style>
  </head>
  <body>
    <nav>
      <div class="text-gray-700">
        <span class="font-bold mr-2 select-none">Receiver</span><span id="receiver"><!-- receiver --></span>
      </div>
    </nav>
    <div id="main" class="font-none">
      <div id="sidebar" class="h-full border-0 border-r border-gray-400 min-w-48 overflow-auto">
        <!-- list -->
      </div>
      <div id="email" class="h-[calc(100%-2rem)] flex-grow text-base p-4 overflow-auto">
        <!-- email -->
      </div>
    </div>  
  </body>
</html>`;
