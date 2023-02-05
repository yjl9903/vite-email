import type { Receiver, ResolvedOption } from '../types';

import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'fs-extra';

import { createMarkownIt, REPLACER } from '../render';

export function vmailBuildPlugin(
  ctx: Record<string, string>,
  receiver: Receiver,
  option: ResolvedOption,
  config = { frontmatter: true }
) {
  const template = readFileSync(option.template, 'utf-8');

  return [
    viteSingleFile(),
    createMdPlugin(ctx, template, receiver.frontmatter, config),
    {
      name: 'vmail:index',
      apply: 'build',
      transformIndexHtml(html: string) {
        return html.replace(/<script[\s\S]*>[\s\S]*<\/script>/g, '');
      }
    }
  ];
}

function createMdPlugin(
  ctx: Record<string, string>,
  template: string,
  frontmatter: Record<string, string>,
  config = { frontmatter: true }
) {
  const markdown = createMarkownIt(frontmatter, config);

  return {
    name: 'vmail:md',
    apply: 'build',
    transformIndexHtml(html: string) {
      return html.replace(REPLACER, markdown.render(template, ctx));
    }
  };
}
