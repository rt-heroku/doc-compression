/**
 * Structural verification of a compressed knowledge base against its sources.
 *
 * The checks are deterministic and honest: they measure what can actually be
 * measured (heading coverage, verbatim code preservation, numeric fact
 * retention, token ratio) and fail loudly instead of self-grading with the
 * same heuristics that produced the output. Anything intentionally dropped
 * must be declared in META.omissions — declared omissions are reported, not
 * counted as silent loss.
 */

import { readFile } from 'fs/promises';
import YAML from 'yaml';
import { listHeadings, listCodeBlocks, normalizeForMatch, normalizeCode } from './markdown';
import { countTokens } from './tokens';

export interface Omission {
  source?: string;
  type: 'heading' | 'code' | 'section';
  item: string;
  reason?: string;
}

export interface SourceVerification {
  source: string;
  headings: { covered: number; omitted: number; total: number; missing: string[] };
  code: { preserved: number; omitted: number; total: number; missing: string[] };
  facts: { retained: number; total: number; missing: string[] };
}

export interface VerificationReport {
  passed: boolean;
  failures: string[];
  warnings: string[];
  sources: SourceVerification[];
  tokens: { original: number; compressed: number; ratio: number };
  thresholds: { headingCoverage: number };
}

export interface VerifyOptions {
  /** Minimum fraction of (non-omitted) headings that must be covered. Default 0.9. */
  headingCoverage?: number;
  /** Permit undeclared code-block loss (downgrades failures to warnings). Default false. */
  allowCodeLoss?: boolean;
}

/** Collect every key and string value from a parsed YAML structure. */
function collectStrings(node: unknown, keys: string[], values: string[]): void {
  if (typeof node === 'string') {
    values.push(node);
  } else if (Array.isArray(node)) {
    for (const item of node) collectStrings(item, keys, values);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      keys.push(key);
      collectStrings(value, keys, values);
    }
  }
}

function extractOmissions(kb: Record<string, unknown>): Omission[] {
  const meta = kb['META'] as Record<string, unknown> | undefined;
  const raw = meta?.['omissions'];
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (o): o is Omission =>
      !!o && typeof o === 'object' && typeof (o as Omission).item === 'string'
  );
}

/**
 * Numeric facts: numbers with units/percent or multi-digit values appearing
 * in prose (code blocks excluded). These are the details semantic compression
 * is most likely to silently drop.
 */
function extractNumericFacts(markdown: string): string[] {
  const withoutCode = markdown.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`]*`/g, '');
  const matches = withoutCode.match(/\b\d[\d,.]*\s?(?:%|x|ms|s|kb|mb|gb|kib|mib)\b|\b\d{2,}[\d,.]*\b/gi) ?? [];
  return [...new Set(matches.map(m => m.replace(/[,\s]/g, '').toLowerCase()))];
}

export async function verifyKnowledgeBase(
  kbPath: string,
  sourcePaths: string[],
  options: VerifyOptions = {}
): Promise<VerificationReport> {
  const headingThreshold = options.headingCoverage ?? 0.9;
  const kbText = await readFile(kbPath, 'utf-8');

  let kb: Record<string, unknown>;
  try {
    kb = YAML.parse(kbText) as Record<string, unknown>;
  } catch (err) {
    return {
      passed: false,
      failures: [`Knowledge base is not valid YAML: ${(err as Error).message}`],
      warnings: [],
      sources: [],
      tokens: { original: 0, compressed: countTokens(kbText), ratio: 0 },
      thresholds: { headingCoverage: headingThreshold }
    };
  }

  const keys: string[] = [];
  const values: string[] = [];
  collectStrings(kb, keys, values);
  const normalizedKeys = keys.map(normalizeForMatch);
  const allText = values.join('\n');
  const normalizedAllText = normalizeForMatch(allText);
  const normalizedKbCode = allText; // code is matched per-block below
  const omissions = extractOmissions(kb);

  const failures: string[] = [];
  const warnings: string[] = [];
  const sources: SourceVerification[] = [];
  let totalOriginalTokens = 0;

  for (const sourcePath of sourcePaths) {
    const content = await readFile(sourcePath, 'utf-8');
    totalOriginalTokens += countTokens(content);

    const omittedFor = (type: Omission['type']) =>
      omissions
        .filter(o => o.type === type && (!o.source || sourcePath.endsWith(o.source)))
        .map(o => normalizeForMatch(o.item));

    // 1. Provenance: the KB must reference the source file.
    const fileName = sourcePath.split('/').pop()!;
    if (!allText.includes(fileName) && !keys.some(k => k.includes(fileName))) {
      warnings.push(`No provenance reference to ${fileName} found in knowledge base`);
    }

    // 2. Heading coverage.
    const headings = listHeadings(content);
    const omittedHeadings = omittedFor('heading').concat(omittedFor('section'));
    const missingHeadings: string[] = [];
    let covered = 0;
    let omittedCount = 0;
    for (const h of headings) {
      const norm = normalizeForMatch(h.title);
      if (norm === '') continue;
      if (omittedHeadings.includes(norm)) {
        omittedCount++;
      } else if (normalizedKeys.some(k => k === norm || k.includes(norm) || norm.includes(k)) ||
                 normalizedAllText.includes(norm)) {
        covered++;
      } else {
        missingHeadings.push(h.title);
      }
    }
    const headingDenominator = headings.length - omittedCount;
    const headingCoverage = headingDenominator === 0 ? 1 : covered / headingDenominator;
    if (headingCoverage < headingThreshold) {
      failures.push(
        `${fileName}: heading coverage ${(headingCoverage * 100).toFixed(0)}% below ` +
        `${(headingThreshold * 100).toFixed(0)}% — missing: ${missingHeadings.join(', ')}`
      );
    }

    // 3. Code preservation: every block byte-identical (after normalization)
    //    unless explicitly declared omitted.
    const codeBlocks = listCodeBlocks(content);
    const omittedCode = omittedFor('code');
    const normalizedKb = normalizeCode(normalizedKbCode);
    const missingCode: string[] = [];
    let preservedCode = 0;
    let omittedCodeCount = 0;
    for (const block of codeBlocks) {
      const firstLine = block.split('\n')[0] ?? '';
      const inner = block.split('\n').slice(1, -1).join('\n').trim();
      const identifier = normalizeForMatch(firstLine + ' ' + inner.slice(0, 60));
      if (omittedCode.some(o => identifier.includes(o) || o.includes(identifier.slice(0, 40)))) {
        omittedCodeCount++;
      } else if (inner === '' || normalizedKb.includes(inner)) {
        preservedCode++;
      } else {
        missingCode.push(firstLine + (inner ? ` … ${inner.split('\n')[0].slice(0, 60)}` : ''));
      }
    }
    if (missingCode.length > 0) {
      const msg =
        `${fileName}: ${missingCode.length}/${codeBlocks.length} code block(s) not preserved ` +
        `verbatim and not declared in META.omissions: ${missingCode.slice(0, 3).join(' | ')}`;
      if (options.allowCodeLoss) warnings.push(msg);
      else failures.push(msg);
    }

    // 4. Numeric fact retention (warning only — prose rewording is expected,
    //    numbers vanishing is a red flag).
    const facts = extractNumericFacts(content);
    const kbForFacts = normalizeForMatch(allText).replace(/\s/g, '');
    const missingFacts = facts.filter(f => !kbForFacts.includes(f.replace(/\s/g, '')));
    if (facts.length > 0 && missingFacts.length / facts.length > 0.2) {
      warnings.push(
        `${fileName}: ${missingFacts.length}/${facts.length} numeric facts missing ` +
        `(e.g. ${missingFacts.slice(0, 5).join(', ')})`
      );
    }

    sources.push({
      source: sourcePath,
      headings: {
        covered,
        omitted: omittedCount,
        total: headings.length,
        missing: missingHeadings
      },
      code: {
        preserved: preservedCode,
        omitted: omittedCodeCount,
        total: codeBlocks.length,
        missing: missingCode
      },
      facts: {
        retained: facts.length - missingFacts.length,
        total: facts.length,
        missing: missingFacts
      }
    });
  }

  const compressedTokens = countTokens(kbText);
  const ratio = compressedTokens === 0 ? 0 : totalOriginalTokens / compressedTokens;
  if (ratio < 1 && totalOriginalTokens > 0) {
    warnings.push(
      `Compressed output (${compressedTokens} tokens) is LARGER than sources ` +
      `(${totalOriginalTokens} tokens) — compression made things worse`
    );
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
    sources,
    tokens: { original: totalOriginalTokens, compressed: compressedTokens, ratio },
    thresholds: { headingCoverage: headingThreshold }
  };
}

export function formatReport(report: VerificationReport): string {
  const lines: string[] = [];
  lines.push(report.passed ? '✅ VERIFICATION PASSED' : '❌ VERIFICATION FAILED');
  lines.push('');
  lines.push(
    `Tokens: ${report.tokens.original} → ${report.tokens.compressed} ` +
    `(${report.tokens.ratio.toFixed(1)}x compression)`
  );
  lines.push('');

  for (const src of report.sources) {
    const file = src.source.split('/').pop();
    lines.push(`${file}:`);
    lines.push(
      `  headings: ${src.headings.covered}/${src.headings.total} covered` +
      (src.headings.omitted ? ` (${src.headings.omitted} declared omitted)` : '')
    );
    lines.push(
      `  code:     ${src.code.preserved}/${src.code.total} preserved verbatim` +
      (src.code.omitted ? ` (${src.code.omitted} declared omitted)` : '')
    );
    lines.push(`  facts:    ${src.facts.retained}/${src.facts.total} numeric facts retained`);
  }

  if (report.failures.length > 0) {
    lines.push('');
    lines.push('Failures:');
    for (const f of report.failures) lines.push(`  ❌ ${f}`);
  }
  if (report.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const w of report.warnings) lines.push(`  ⚠️  ${w}`);
  }

  return lines.join('\n');
}
