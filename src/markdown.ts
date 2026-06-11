/**
 * Markdown parsing utilities.
 *
 * Code blocks are extracted before any text transformation and restored
 * verbatim afterwards, so no cleanup pass can ever touch code. Content
 * before the first heading (the preamble) is preserved as its own section.
 */

export interface CodeExtraction {
  /** Markdown with each fenced code block replaced by a placeholder token. */
  text: string;
  /** Placeholder token -> original code block (fence lines included). */
  blocks: Map<string, string>;
}

export interface MarkdownSection {
  /** Heading text, or "" for the preamble before the first heading. */
  title: string;
  /** Heading level 1-6, or 0 for the preamble. */
  level: number;
  /** Body text (without the heading line). */
  content: string;
}

const FENCE_RE = /^(```|~~~)/;

/**
 * Replace fenced code blocks with stable placeholders.
 */
export function extractCodeBlocks(markdown: string): CodeExtraction {
  const lines = markdown.split('\n');
  const out: string[] = [];
  const blocks = new Map<string, string>();
  let fence: string | null = null;
  let current: string[] = [];

  for (const line of lines) {
    if (fence === null) {
      const open = line.match(FENCE_RE);
      if (open) {
        fence = open[1];
        current = [line];
      } else {
        out.push(line);
      }
    } else {
      current.push(line);
      if (line.trimEnd() === fence) {
        const token = `⟪CODE_BLOCK_${blocks.size}⟫`;
        blocks.set(token, current.join('\n'));
        out.push(token);
        fence = null;
        current = [];
      }
    }
  }

  // Unterminated fence: keep it as a block anyway rather than dropping it.
  if (fence !== null && current.length > 0) {
    const token = `⟪CODE_BLOCK_${blocks.size}⟫`;
    blocks.set(token, current.join('\n'));
    out.push(token);
  }

  return { text: out.join('\n'), blocks };
}

/**
 * Restore code blocks extracted by extractCodeBlocks.
 */
export function restoreCodeBlocks(text: string, blocks: Map<string, string>): string {
  let result = text;
  for (const [token, code] of blocks) {
    result = result.replace(token, code);
  }
  return result;
}

/**
 * List the fenced code blocks in a markdown document, normalized to \n line
 * endings with trailing whitespace per line stripped (so byte-identical
 * comparison is robust to YAML round-tripping).
 */
export function listCodeBlocks(markdown: string): string[] {
  const { blocks } = extractCodeBlocks(markdown);
  return [...blocks.values()].map(normalizeCode);
}

export function normalizeCode(code: string): string {
  return code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Parse markdown into a flat list of sections. Headings inside code blocks
 * are ignored. Content before the first heading becomes a level-0 preamble
 * section (never dropped).
 */
export function parseSections(markdown: string): MarkdownSection[] {
  const { text, blocks } = extractCodeBlocks(markdown);
  const lines = text.split('\n');
  const sections: MarkdownSection[] = [];
  let title = '';
  let level = 0;
  let body: string[] = [];

  const flush = () => {
    const content = restoreCodeBlocks(body.join('\n'), blocks).trim();
    if (title !== '' || content !== '') {
      sections.push({ title, level, content });
    }
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flush();
      title = heading[2];
      level = heading[1].length;
      body = [];
    } else {
      body.push(line);
    }
  }
  flush();

  return sections;
}

/**
 * List headings (levels 1-3 by default) for coverage verification.
 */
export function listHeadings(markdown: string, maxLevel = 3): Array<{ title: string; level: number }> {
  return parseSections(markdown)
    .filter(s => s.level >= 1 && s.level <= maxLevel)
    .map(s => ({ title: s.title, level: s.level }));
}

/**
 * Normalize a heading/key for fuzzy matching: lowercase, alphanumerics and
 * spaces only, with underscores/hyphens treated as spaces. This makes
 * "Core Concepts", "core_concepts" and "core-concepts" all equal.
 */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
