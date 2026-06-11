/**
 * doc-compression — deterministic toolkit for LLM documentation compression.
 *
 * The semantic compression itself is performed by Claude via the
 * `compressing-docs` skill; this library provides the deterministic halves:
 * parsing, lossless cleanup, token counting, doc discovery, and structural
 * verification of the compressed output.
 */

export * from './markdown';
export * from './tokens';
export * from './cleanup';
export * from './scanner';
export * from './verify';
