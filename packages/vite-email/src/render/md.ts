import MarkdownIt from 'markdown-it';
// import { debug as createDebug } from 'debug';

// @ts-ignore
import MarkdownItTitle from 'markdown-it-title';

export const REPLACER = `<!-- email -->`;

// const debug = createDebug('vmail:md');

export interface MarkdownItOption {
  frontmatter: boolean;
}

export function createMarkownIt(
  frontmatter: Record<string, string> = {},
  option: MarkdownItOption = { frontmatter: true }
) {
  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  }).use(MarkdownItTitle);

  if (option.frontmatter) {
    markdown.inline.ruler.push('frontmatter', (state) => {
      if (state.src.charCodeAt(state.pos) !== 0x7b /* { */) {
        return false;
      }
      if (state.src.charCodeAt(state.pos + 1) !== 0x7b /* { */) {
        return false;
      }
      let pos = state.pos + 2;
      for (; pos + 1 < state.src.length; pos++) {
        if (
          state.src.charCodeAt(pos) === 0x7d /* } */ &&
          state.src.charCodeAt(pos + 1) === 0x7d /* } */
        ) {
          const varName = state.src.slice(state.pos + 2, pos - 1).trim();
          if (varName in frontmatter) {
            state.pending += frontmatter[varName];
            break;
          } else {
            // fail to find varName
            // debug(varName);
            throw new Error(`"${varName}" not found when render Markdown`);
          }
        } else {
          const tmp = state.src.slice(state.pos + 2, pos).trim();
          if (/\s/.test(tmp)) {
            return false;
          }
        }
      }
      state.pos = pos + 2;
      return true;
    });
  }

  return markdown;
}
