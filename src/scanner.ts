/**
 * Documentation discovery.
 *
 * Finds markdown documentation in a project, excluding build artifacts and —
 * critically — this plugin's own generated outputs, so re-running compression
 * never ingests a previous run's knowledge base or reports.
 */

import { glob } from 'glob';
import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import { countTokens } from './tokens';

export interface ScannedDoc {
  /** Path relative to the scanned root. */
  path: string;
  absolutePath: string;
  bytes: number;
  tokens: number;
}

export interface ScanResult {
  root: string;
  docs: ScannedDoc[];
  totalBytes: number;
  totalTokens: number;
}

const DEFAULT_EXCLUDES = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/vendor/**',
  // Our own outputs — never re-ingest them.
  '**/*KNOWLEDGE-BASE*',
  '**/COMPRESSED-*',
  '**/COMPRESSION-REPORT*',
  '**/COMPRESSION-ANALYSIS*',
  '**/KB-VERIFICATION*'
];

/** Files larger than this are listed but flagged, not silently skipped. */
const LARGE_FILE_BYTES = 2 * 1024 * 1024;

export async function scanDocs(
  root: string,
  options: { include?: string; exclude?: string[] } = {}
): Promise<ScanResult> {
  const rootAbs = resolve(root);
  const rootStat = await stat(rootAbs);
  if (!rootStat.isDirectory()) {
    throw new Error(`Not a directory: ${rootAbs}`);
  }

  const pattern = options.include ?? '**/*.{md,markdown}';
  const ignore = [...DEFAULT_EXCLUDES, ...(options.exclude ?? [])];

  const files = await glob(pattern, {
    cwd: rootAbs,
    ignore,
    nodir: true,
    nocase: true
  });
  files.sort();

  const docs: ScannedDoc[] = [];
  for (const file of files) {
    const absolutePath = resolve(rootAbs, file);
    const fileStat = await stat(absolutePath);
    if (fileStat.size > LARGE_FILE_BYTES) {
      docs.push({ path: file, absolutePath, bytes: fileStat.size, tokens: -1 });
      continue;
    }
    const content = await readFile(absolutePath, 'utf-8');
    docs.push({
      path: file,
      absolutePath,
      bytes: Buffer.byteLength(content, 'utf-8'),
      tokens: countTokens(content)
    });
  }

  return {
    root: rootAbs,
    docs,
    totalBytes: docs.reduce((s, d) => s + d.bytes, 0),
    totalTokens: docs.reduce((s, d) => s + Math.max(0, d.tokens), 0)
  };
}
