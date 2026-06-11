#!/usr/bin/env node
/**
 * doc-compress CLI — the deterministic toolkit the compression skill drives.
 *
 *   doc-compress scan <dir>                       List docs with token counts (JSON)
 *   doc-compress clean <file> [--write]           Lossless cleanup (prints cleaned markdown)
 *   doc-compress tokens <file...>                 Token counts per file
 *   doc-compress verify <kb.yaml> <source...>     Verify KB against sources (exit 1 on failure)
 *       [--heading-coverage 0.9] [--allow-code-loss] [--json]
 */

import { readFile, writeFile } from 'fs/promises';
import { scanDocs } from './scanner';
import { cleanupMarkdown } from './cleanup';
import { tokenStats } from './tokens';
import { verifyKnowledgeBase, formatReport } from './verify';

function fail(message: string): never {
  process.stderr.write(`error: ${message}\n`);
  process.exit(2);
}

function takeFlag(args: string[], name: string): boolean {
  const i = args.indexOf(name);
  if (i === -1) return false;
  args.splice(i, 1);
  return true;
}

function takeOption(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const value = args[i + 1];
  if (value === undefined) fail(`${name} requires a value`);
  args.splice(i, 2);
  return value;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args.shift();

  switch (command) {
    case 'scan': {
      const dir = args.shift() ?? fail('scan requires a directory');
      const include = takeOption(args, '--include');
      const result = await scanDocs(dir, { include });
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      break;
    }

    case 'clean': {
      const write = takeFlag(args, '--write');
      const file = args.shift() ?? fail('clean requires a file');
      const content = await readFile(file, 'utf-8');
      const result = cleanupMarkdown(content);
      if (write) {
        await writeFile(file, result.cleaned, 'utf-8');
      } else {
        process.stdout.write(result.cleaned);
      }
      process.stderr.write(
        `tokens: ${result.before.tokens} → ${result.after.tokens}, ` +
        `applied: ${result.applied.join(', ') || 'nothing (already clean)'}\n`
      );
      break;
    }

    case 'tokens': {
      if (args.length === 0) fail('tokens requires at least one file');
      const rows: Array<{ file: string; tokens: number; bytes: number }> = [];
      for (const file of args) {
        const content = await readFile(file, 'utf-8');
        const stats = tokenStats(content);
        rows.push({ file, ...stats });
      }
      process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
      break;
    }

    case 'verify': {
      const json = takeFlag(args, '--json');
      const allowCodeLoss = takeFlag(args, '--allow-code-loss');
      const headingCoverageRaw = takeOption(args, '--heading-coverage');
      const headingCoverage = headingCoverageRaw ? Number(headingCoverageRaw) : undefined;
      if (headingCoverage !== undefined && !(headingCoverage >= 0 && headingCoverage <= 1)) {
        fail('--heading-coverage must be between 0 and 1');
      }
      const kbPath = args.shift() ?? fail('verify requires a knowledge base file');
      if (args.length === 0) fail('verify requires at least one source file');

      const report = await verifyKnowledgeBase(kbPath, args, { headingCoverage, allowCodeLoss });
      process.stdout.write(
        (json ? JSON.stringify(report, null, 2) : formatReport(report)) + '\n'
      );
      process.exit(report.passed ? 0 : 1);
      break;
    }

    default:
      process.stderr.write(
        'usage: doc-compress <scan|clean|tokens|verify> ...\n' +
        '  scan <dir> [--include <glob>]\n' +
        '  clean <file> [--write]\n' +
        '  tokens <file...>\n' +
        '  verify <kb.yaml> <source...> [--heading-coverage 0.9] [--allow-code-loss] [--json]\n'
      );
      process.exit(command ? 2 : 0);
  }
}

main().catch(err => {
  process.stderr.write(`error: ${err.message}\n`);
  process.exit(2);
});
