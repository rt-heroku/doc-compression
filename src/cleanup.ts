/**
 * Lossless (and near-lossless boilerplate) markdown cleanup.
 *
 * These transforms never touch meaning-bearing prose and never touch code:
 * code blocks are extracted before cleanup and restored verbatim afterwards.
 * This is the only text transformation the deterministic side performs —
 * semantic compression is the LLM's job (see skills/compressing-docs).
 */

import { extractCodeBlocks, restoreCodeBlocks } from './markdown';
import { tokenStats, type TokenStats } from './tokens';

export interface CleanupOptions {
  /** Remove badge images (shields.io etc.) — visual noise for an LLM. Default true. */
  stripBadges?: boolean;
  /** Remove HTML comments. Default true. */
  stripHtmlComments?: boolean;
}

export interface CleanupResult {
  cleaned: string;
  before: TokenStats;
  after: TokenStats;
  /** Names of the transforms that actually changed something. */
  applied: string[];
}

const BADGE_LINE_RE = /^\s*(\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)\s*)+$/;
const BADGE_IMG_RE = /\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)|!\[[^\]]*\]\(https?:\/\/[^)]*(?:shields\.io|badge)[^)]*\)/g;

export function cleanupMarkdown(markdown: string, options: CleanupOptions = {}): CleanupResult {
  const { stripBadges = true, stripHtmlComments = true } = options;
  const before = tokenStats(markdown);
  const applied: string[] = [];

  const { text, blocks } = extractCodeBlocks(markdown);
  let result = text;

  if (stripHtmlComments) {
    const next = result.replace(/<!--[\s\S]*?-->/g, '');
    if (next !== result) applied.push('html-comments');
    result = next;
  }

  if (stripBadges) {
    let next = result
      .split('\n')
      .filter(line => !BADGE_LINE_RE.test(line))
      .join('\n');
    next = next.replace(BADGE_IMG_RE, '');
    if (next !== result) applied.push('badges');
    result = next;
  }

  // Trailing whitespace per line.
  {
    const next = result.split('\n').map(l => l.trimEnd()).join('\n');
    if (next !== result) applied.push('trailing-whitespace');
    result = next;
  }

  // Collapse 3+ consecutive blank lines to one blank line.
  {
    const next = result.replace(/\n{3,}/g, '\n\n');
    if (next !== result) applied.push('blank-lines');
    result = next;
  }

  // Collapse runs of horizontal rules (often used as visual dividers).
  {
    const next = result.replace(/(^---+\s*$\n?){2,}/gm, '---\n');
    if (next !== result) applied.push('horizontal-rules');
    result = next;
  }

  result = restoreCodeBlocks(result, blocks).trim() + '\n';

  return {
    cleaned: result,
    before,
    after: tokenStats(result),
    applied
  };
}
