import { marked } from "marked";

/**
 * Convert markdown body text to rendered HTML.
 * Used by the tutorial detail page to render Claude-generated markdown.
 */
export function renderMarkdown(markdown: string): string {
  // Configure marked for clean output
  marked.setOptions({
    gfm: true,
    breaks: false,
  });

  const html = marked.parse(markdown);
  // marked.parse can return string | Promise<string>; our config is synchronous
  if (typeof html !== "string") {
    return "";
  }
  return html;
}
