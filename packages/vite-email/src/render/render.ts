import { build, mergeConfig } from 'vite';

import type { ResolvedOption, Receiver, RenderOutput } from '../types';

import { vmailBuildPlugin } from '../vite';

import type { MarkdownItOption } from './md';

export async function render(
  receiver: Receiver,
  option: ResolvedOption,
  config: MarkdownItOption = { frontmatter: true }
): Promise<RenderOutput> {
  const ctx: Record<string, string> = {};

  const output = await build(
    mergeConfig(option.vite, {
      plugins: [vmailBuildPlugin(ctx, receiver, option, config)]
    })
  );

  return {
    // @ts-ignore
    content: output.output.find((o) => o.fileName === 'index.html').source,
    subject: receiver.subject ?? ctx.title
  };
}
