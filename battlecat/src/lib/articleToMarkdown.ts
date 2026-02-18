/**
 * Convert an article's rendered HTML to clean Markdown.
 *
 * Accepts a CSS selector or HTMLElement pointing to the article body container.
 * Traverses the DOM and converts each element to its Markdown equivalent.
 *
 * @param source - A CSS selector string or HTMLElement for the article body
 * @param meta - Optional metadata to prepend as HTML comments
 * @returns The converted Markdown string
 */
export async function articleToMarkdown(
  source: string | HTMLElement,
  meta?: {
    title?: string;
    date?: string;
    author?: string;
    tags?: string[];
    level?: number;
    difficulty?: string;
  },
): Promise<string> {
  const element =
    typeof source === "string" ? document.querySelector(source) : source;

  if (!element) {
    return "";
  }

  const parts: string[] = [];

  // Prepend metadata as HTML comments
  if (meta) {
    const metaLines: string[] = [];
    if (meta.date) metaLines.push(`date: ${meta.date}`);
    if (meta.author) metaLines.push(`author: ${meta.author}`);
    if (meta.level !== undefined) metaLines.push(`level: L${meta.level}`);
    if (meta.difficulty) metaLines.push(`difficulty: ${meta.difficulty}`);
    if (meta.tags && meta.tags.length > 0)
      metaLines.push(`tags: ${meta.tags.join(", ")}`);
    if (metaLines.length > 0) {
      parts.push(`<!--\n${metaLines.join("\n")}\n-->`);
      parts.push("");
    }
  }

  // Prepend title as h1
  if (meta?.title) {
    parts.push(`# ${meta.title}`);
    parts.push("");
  }

  // Convert the body
  const bodyMd = convertNode(element);
  parts.push(bodyMd);

  // Collapse 3+ consecutive blank lines to 2
  return parts
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Selectors to exclude from conversion ──────────────────────────────────

const EXCLUDE_SELECTORS = [
  "nav",
  "aside",
  "footer",
  ".comments",
  ".share-buttons",
  ".related-posts",
  "[data-noexport]",
  "script",
  "style",
  "[aria-hidden='true']",
].join(", ");

// ─── Node conversion ───────────────────────────────────────────────────────

function convertNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const el = node as HTMLElement;

  // Skip excluded elements
  if (el.matches(EXCLUDE_SELECTORS)) {
    return "";
  }

  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "h1":
      return `\n# ${getInlineText(el)}\n`;
    case "h2":
      return `\n## ${getInlineText(el)}\n`;
    case "h3":
      return `\n### ${getInlineText(el)}\n`;
    case "h4":
      return `\n#### ${getInlineText(el)}\n`;
    case "h5":
      return `\n##### ${getInlineText(el)}\n`;
    case "h6":
      return `\n###### ${getInlineText(el)}\n`;

    case "p":
      return `\n${getInlineText(el)}\n`;

    case "strong":
    case "b":
      return `**${getInlineText(el)}**`;

    case "em":
    case "i":
      return `*${getInlineText(el)}*`;

    case "code":
      // Inline code (not inside a <pre>)
      if (el.parentElement?.tagName.toLowerCase() !== "pre") {
        return `\`${el.textContent ?? ""}\``;
      }
      // Code inside <pre> — handled by the "pre" case
      return el.textContent ?? "";

    case "pre": {
      const codeEl = el.querySelector("code");
      const code = codeEl?.textContent ?? el.textContent ?? "";
      const lang = extractLanguage(codeEl);
      return `\n\`\`\`${lang}\n${code.trimEnd()}\n\`\`\`\n`;
    }

    case "a": {
      const href = el.getAttribute("href") ?? "";
      const text = getInlineText(el);
      const absoluteHref = toAbsoluteUrl(href);
      return `[${text}](${absoluteHref})`;
    }

    case "img": {
      const src = el.getAttribute("src") ?? "";
      const alt = el.getAttribute("alt") ?? "";
      const absoluteSrc = toAbsoluteUrl(src);
      return `![${alt}](${absoluteSrc})`;
    }

    case "ul":
      return `\n${convertList(el, "ul", 0)}\n`;

    case "ol":
      return `\n${convertList(el, "ol", 0)}\n`;

    case "li":
      // Handled by convertList — fallback for direct access
      return getInlineText(el);

    case "blockquote":
      return `\n${convertBlockquote(el)}\n`;

    case "hr":
      return "\n---\n";

    case "table":
      return `\n${convertTable(el)}\n`;

    case "br":
      return "\n";

    case "div":
    case "section":
    case "article":
    case "main":
    case "figure":
    case "figcaption":
    case "details":
    case "summary":
      return convertChildren(el);

    case "span":
      return getInlineText(el);

    default:
      return convertChildren(el);
  }
}

// ─── Inline text extraction ────────────────────────────────────────────────

function getInlineText(el: HTMLElement): string {
  let result = "";
  for (const child of el.childNodes) {
    result += convertNode(child);
  }
  return result;
}

// ─── Children conversion ───────────────────────────────────────────────────

function convertChildren(el: HTMLElement): string {
  let result = "";
  for (const child of el.childNodes) {
    result += convertNode(child);
  }
  return result;
}

// ─── List conversion ───────────────────────────────────────────────────────

function convertList(
  el: HTMLElement,
  type: "ul" | "ol",
  depth: number,
): string {
  const items: string[] = [];
  const indent = "  ".repeat(depth);
  let counter = 1;

  for (const child of el.children) {
    if (child.tagName.toLowerCase() !== "li") continue;

    const li = child as HTMLElement;
    const nestedList = li.querySelector("ul, ol");

    let text: string;
    if (nestedList) {
      // Get text content excluding the nested list
      const clone = li.cloneNode(true) as HTMLElement;
      const nestedInClone = clone.querySelector("ul, ol");
      nestedInClone?.remove();
      text = getInlineText(clone).trim();

      const nestedType = nestedList.tagName.toLowerCase() as "ul" | "ol";
      const nestedMd = convertList(nestedList as HTMLElement, nestedType, depth + 1);

      const prefix = type === "ul" ? `${indent}- ` : `${indent}${counter}. `;
      items.push(`${prefix}${text}`);
      items.push(nestedMd);
    } else {
      text = getInlineText(li).trim();
      const prefix = type === "ul" ? `${indent}- ` : `${indent}${counter}. `;
      items.push(`${prefix}${text}`);
    }

    counter++;
  }

  return items.join("\n");
}

// ─── Blockquote conversion ─────────────────────────────────────────────────

function convertBlockquote(el: HTMLElement): string {
  const inner = convertChildren(el).trim();
  return inner
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

// ─── Table conversion ──────────────────────────────────────────────────────

function convertTable(el: HTMLElement): string {
  const rows: string[][] = [];
  let headerRowCount = 0;

  // Process thead
  const thead = el.querySelector("thead");
  if (thead) {
    for (const tr of thead.querySelectorAll("tr")) {
      const cells: string[] = [];
      for (const cell of tr.querySelectorAll("th, td")) {
        cells.push(getInlineText(cell as HTMLElement).trim());
      }
      rows.push(cells);
      headerRowCount++;
    }
  }

  // Process tbody
  const tbody = el.querySelector("tbody");
  const bodyRows = tbody
    ? tbody.querySelectorAll("tr")
    : el.querySelectorAll("tr");

  for (const tr of bodyRows) {
    // Skip if already captured in thead
    if (thead && tr.closest("thead")) continue;
    const cells: string[] = [];
    for (const cell of tr.querySelectorAll("th, td")) {
      cells.push(getInlineText(cell as HTMLElement).trim());
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  if (rows.length === 0) return "";

  // Determine max columns
  const maxCols = Math.max(...rows.map((r) => r.length));

  // Normalize all rows to same column count
  const normalized = rows.map((r) => {
    while (r.length < maxCols) r.push("");
    return r;
  });

  // Build GFM table
  const lines: string[] = [];

  // Header row (first row or synthesized)
  const headerRow = normalized[0];
  lines.push(`| ${headerRow.join(" | ")} |`);
  lines.push(`| ${headerRow.map(() => "---").join(" | ")} |`);

  // Data rows
  const startIdx = headerRowCount > 0 ? headerRowCount : 1;
  for (let i = startIdx; i < normalized.length; i++) {
    lines.push(`| ${normalized[i].join(" | ")} |`);
  }

  return lines.join("\n");
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function extractLanguage(codeEl: Element | null): string {
  if (!codeEl) return "";
  const className = codeEl.getAttribute("class") ?? "";
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : "";
}

function toAbsoluteUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url}`;
    }
    return url;
  }
  if (typeof window !== "undefined") {
    return new URL(url, window.location.href).href;
  }
  return url;
}
