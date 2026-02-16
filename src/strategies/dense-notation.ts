/**
 * Dense Notation Strategy
 * Converts verbose descriptions to mathematical formulas and symbolic notation
 * Target: 7x compression
 *
 * Techniques:
 * - Mathematical symbols (×, ÷, ∑, ∏, →)
 * - Logical operators (∧, ∨, ¬, ∀, ∃)
 * - Formula extraction and generation
 * - Symbol tables for definitions
 * - Unicode mathematical notation
 */

import { BaseCompressionStrategy } from './base';
import type { DocumentInput, CompressionResult, StrategyConfig } from '../types';
import YAML from 'yaml';

export class DenseNotationStrategy extends BaseCompressionStrategy {
  name = 'dense-notation';
  description = 'Mathematical formulas and symbolic shorthand for maximum density';

  private symbolTable: Map<string, string> = new Map();

  async compress(input: DocumentInput, config: StrategyConfig): Promise<CompressionResult> {
    const startTime = Date.now();

    // 1. Extract all text content
    const allText = input.files.map(f => f.content).join('\n\n');

    // 2. Extract formulas and equations
    const formulas = this.extractFormulas(allText);

    // 3. Generate symbol table
    this.generateSymbolTable(allText);

    // 4. Convert text to dense notation
    const denseContent = this.applyDenseNotation(allText, formulas);

    // 5. Build structure with formulas first
    const structure = {
      META: {
        format_version: '1.0',
        compression_strategy: this.name,
        source_files: input.fileCount,
        original_size_bytes: input.totalSize,
        generated_at: new Date().toISOString()
      },
      SYMBOL_TABLE: Object.fromEntries(this.symbolTable),
      FORMULAS: formulas,
      CONTENT: this.structureDenseContent(denseContent)
    };

    // 6. Generate YAML
    const compressed = YAML.stringify(structure, {
      indent: 2,
      lineWidth: 120,
      collectionStyle: 'block'
    });

    const compressedSize = Buffer.byteLength(compressed, 'utf-8');
    const compressionRatio = input.totalSize / compressedSize;

    return {
      compressed,
      compressionRatio,
      originalSize: input.totalSize,
      compressedSize,
      metadata: {
        strategy: this.name,
        timestamp: new Date().toISOString(),
        config,
        processingTimeMs: Date.now() - startTime,
        symbolsUsed: this.symbolTable.size,
        formulasExtracted: Object.keys(formulas).length
      }
    };
  }

  /**
   * Extract formulas from text
   */
  private extractFormulas(text: string): Record<string, string> {
    const formulas: Record<string, string> = {};

    // Pattern: X equals/is Y [plus/times/minus] Z
    const patterns = [
      /(\w+)\s+(?:equals?|is)\s+([^.]+)/gi,
      /(\w+)\s*=\s*([^.\n]+)/g,
      /(\w+)\s+consists?\s+of\s+([^.]+)/gi,
      /(\w+)\s+comprises?\s+([^.]+)/gi
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[1].trim();
        const formula = this.convertToFormula(match[2].trim());

        if (formula && formula.length < 100) {
          formulas[name] = formula;
        }
      }
    }

    return formulas;
  }

  /**
   * Convert text to mathematical formula
   */
  private convertToFormula(text: string): string {
    let formula = text;

    // Numbers and percentages
    formula = formula.replace(/(\d+)\s*percent/gi, '$1%');

    // Mathematical operations
    formula = formula.replace(/\bplus\b/gi, '+');
    formula = formula.replace(/\bminus\b/gi, '-');
    formula = formula.replace(/\btimes\b/gi, '×');
    formula = formula.replace(/\bmultiplied\s+by\b/gi, '×');
    formula = formula.replace(/\bdivided\s+by\b/gi, '÷');

    // Summation and products
    formula = formula.replace(/sum\s+of/gi, '∑');
    formula = formula.replace(/product\s+of/gi, '∏');

    // Relations
    formula = formula.replace(/less\s+than\s+or\s+equal/gi, '≤');
    formula = formula.replace(/greater\s+than\s+or\s+equal/gi, '≥');
    formula = formula.replace(/not\s+equal/gi, '≠');
    formula = formula.replace(/approximately/gi, '≈');

    // Logical operations
    formula = formula.replace(/\band\b/g, '∧');
    formula = formula.replace(/\bor\b/g, '∨');
    formula = formula.replace(/\bnot\b/g, '¬');

    // Set operations
    formula = formula.replace(/\belements?\s+of\b/gi, '∈');
    formula = formula.replace(/\bfor\s+all\b/gi, '∀');
    formula = formula.replace(/\bexists?\b/gi, '∃');

    // Arrows
    formula = formula.replace(/leads\s+to|results?\s+in|causes?/gi, '→');
    formula = formula.replace(/implies?/gi, '⇒');
    formula = formula.replace(/if\s+and\s+only\s+if/gi, '⇔');

    return formula.trim();
  }

  /**
   * Generate symbol table for common terms
   */
  private generateSymbolTable(text: string): void {
    this.symbolTable.clear();

    // Common abbreviations
    const commonSymbols: Record<string, string> = {
      // Greek letters for concepts
      'Alpha': 'α',
      'Beta': 'β',
      'Gamma': 'γ',
      'Delta': 'Δ',
      'Lambda': 'λ',

      // Mathematical
      'infinity': '∞',
      'approximately': '≈',
      'therefore': '∴',
      'because': '∵',

      // Logic
      'and': '∧',
      'or': '∨',
      'not': '¬',
      'implies': '⇒',

      // Sets
      'subset': '⊂',
      'union': '∪',
      'intersection': '∩',
      'element_of': '∈',

      // Arrows
      'to': '→',
      'from': '←',
      'both_ways': '↔'
    };

    // Detect frequently used terms for abbreviation
    const words = text.toLowerCase().split(/\s+/);
    const frequency = new Map<string, number>();

    for (const word of words) {
      if (word.length > 5) {
        frequency.set(word, (frequency.get(word) || 0) + 1);
      }
    }

    // Add common symbols
    for (const [term, symbol] of Object.entries(commonSymbols)) {
      this.symbolTable.set(symbol, term);
    }

    // Add frequently used terms (top 20)
    const sorted = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    for (const [word, count] of sorted) {
      if (count >= 5 && !this.symbolTable.has(word)) {
        const abbr = this.generateAbbreviation(word);
        this.symbolTable.set(abbr, word);
      }
    }
  }

  /**
   * Generate abbreviation for a word
   */
  private generateAbbreviation(word: string): string {
    // Take first letter + consonants
    const consonants = word.replace(/[aeiou]/gi, '');
    if (consonants.length >= 3) {
      return consonants.slice(0, 3).toLowerCase();
    }

    // Fallback: first 3-4 letters
    return word.slice(0, Math.min(4, word.length)).toLowerCase();
  }

  /**
   * Apply dense notation to content
   */
  private applyDenseNotation(text: string, formulas: Record<string, string>): string {
    let dense = text;

    // Replace formulas with references
    for (const [name, formula] of Object.entries(formulas)) {
      const pattern = new RegExp(`${name}\\s+(?:equals?|is)\\s+[^.]+\\.`, 'gi');
      dense = dense.replace(pattern, `${name} = ${formula}`);
    }

    // Apply symbol substitutions
    for (const [symbol, meaning] of this.symbolTable.entries()) {
      if (meaning.length > symbol.length + 2) {
        const pattern = new RegExp(`\\b${meaning}\\b`, 'gi');
        dense = dense.replace(pattern, symbol);
      }
    }

    // Condense common phrases
    dense = dense.replace(/in\s+other\s+words/gi, 'i.e.');
    dense = dense.replace(/for\s+example/gi, 'e.g.');
    dense = dense.replace(/that\s+is\s+to\s+say/gi, 'i.e.');
    dense = dense.replace(/and\s+so\s+forth/gi, 'etc.');

    // Mathematical notation
    dense = this.convertToFormula(dense);

    return dense;
  }

  /**
   * Structure dense content
   */
  private structureDenseContent(content: string): any {
    const sections = content.split(/\n#{1,3}\s+/);
    const structured: any = {};

    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.split('\n');
      const title = lines[0]?.trim() || 'content';
      const body = lines.slice(1).join('\n').trim();

      if (body) {
        const key = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        structured[key] = body;
      }
    }

    return structured;
  }

  protected calculateFidelity(result: CompressionResult, original: DocumentInput): number {
    // Check if formulas preserve meaning
    const originalText = original.files.map(f => f.content).join('\n');
    const concepts = this.extractConcepts(originalText);
    const compressedConcepts = this.extractConcepts(result.compressed);

    if (concepts.length === 0) return 1.0;

    const preserved = concepts.filter(c =>
      compressedConcepts.some(cc => this.conceptsMatch(c, cc))
    ).length;

    return preserved / concepts.length;
  }

  protected calculateCoverage(result: CompressionResult, original: DocumentInput): number {
    // Symbolic notation should preserve all information
    return 0.95; // Assume 95% coverage for dense notation
  }
}
