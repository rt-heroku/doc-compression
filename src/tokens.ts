/**
 * Token counting.
 *
 * Context budgets are spent in tokens, not bytes, so all compression metrics
 * in this plugin are token-based. Uses gpt-tokenizer (pure-JS BPE, o200k_base)
 * as a close proxy for modern LLM tokenizers. Byte counts are reported only
 * as supplementary information.
 */

import { encode } from 'gpt-tokenizer';

export function countTokens(text: string): number {
  if (!text) return 0;
  return encode(text).length;
}

export interface TokenStats {
  tokens: number;
  bytes: number;
}

export function tokenStats(text: string): TokenStats {
  return {
    tokens: countTokens(text),
    bytes: Buffer.byteLength(text, 'utf-8')
  };
}

/**
 * Token compression ratio (original / compressed). Returns Infinity for an
 * empty compressed text, 0 for an empty original.
 */
export function tokenRatio(original: string, compressed: string): number {
  const orig = countTokens(original);
  const comp = countTokens(compressed);
  if (orig === 0) return 0;
  if (comp === 0) return Infinity;
  return orig / comp;
}
