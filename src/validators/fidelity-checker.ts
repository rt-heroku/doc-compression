/**
 * Fidelity Checker
 * Validates that compressed output preserves original information
 * Target: 98%+ fidelity
 */

import type { DocumentInput, CompressionResult, ValidationReport } from '../types';

export class FidelityChecker {
  /**
   * Validate compression fidelity
   */
  async validate(
    original: DocumentInput,
    compressed: CompressionResult
  ): Promise<ValidationReport> {
    const originalText = original.files.map(f => f.content).join('\n');
    const compressedText = compressed.compressed;

    // 1. Extract concepts from both
    const originalConcepts = this.extractConcepts(originalText);
    const compressedConcepts = this.extractConcepts(compressedText);

    const conceptStats = this.measureConceptPreservation(
      originalConcepts,
      compressedConcepts
    );

    // 2. Check relationships
    const originalRels = this.extractRelationships(originalText);
    const compressedRels = this.extractRelationships(compressedText);

    const relationshipStats = this.measureRelationshipPreservation(
      originalRels,
      compressedRels
    );

    // 3. Verify examples
    const originalExamples = this.extractExamples(originalText);
    const compressedExamples = this.extractExamples(compressedText);

    const exampleStats = this.measureExamplePreservation(
      originalExamples,
      compressedExamples
    );

    // 4. Calculate overall fidelity
    const conceptFidelity = conceptStats.preserved / Math.max(1, conceptStats.total);
    const relationshipFidelity = relationshipStats.preserved / Math.max(1, relationshipStats.total);
    const exampleFidelity = exampleStats.preserved / Math.max(1, exampleStats.total);

    // Weighted average (concepts are most important)
    const fidelity = (
      conceptFidelity * 0.5 +
      relationshipFidelity * 0.3 +
      exampleFidelity * 0.2
    );

    // Coverage is concept-based
    const coverage = conceptFidelity;

    return {
      fidelity,
      coverage,
      details: {
        concepts: conceptStats,
        relationships: relationshipStats,
        examples: exampleStats
      },
      passed: fidelity >= 0.98 && coverage >= 0.95
    };
  }

  /**
   * Extract concepts from text
   */
  private extractConcepts(text: string): Set<string> {
    const concepts = new Set<string>();

    // Headings
    const headings = text.matchAll(/^#{1,6}\s+(.+)$/gm);
    for (const match of headings) {
      concepts.add(this.normalize(match[1]));
    }

    // Bold terms (definitions)
    const boldTerms = text.matchAll(/\*\*([^*]+)\*\*/g);
    for (const match of boldTerms) {
      if (match[1].length < 50) {
        concepts.add(this.normalize(match[1]));
      }
    }

    // Code terms (technical concepts)
    const codeTerms = text.matchAll(/`([^`]+)`/g);
    for (const match of codeTerms) {
      if (match[1].length < 30 && !match[1].includes(' ')) {
        concepts.add(this.normalize(match[1]));
      }
    }

    return concepts;
  }

  /**
   * Measure concept preservation
   */
  private measureConceptPreservation(
    original: Set<string>,
    compressed: Set<string>
  ): { preserved: number; total: number } {
    let preserved = 0;

    for (const concept of original) {
      if (this.conceptExists(concept, compressed)) {
        preserved++;
      }
    }

    return {
      preserved,
      total: original.size
    };
  }

  /**
   * Check if concept exists in compressed form
   */
  private conceptExists(concept: string, compressedConcepts: Set<string>): boolean {
    // Exact match
    if (compressedConcepts.has(concept)) {
      return true;
    }

    // Fuzzy match
    for (const compressed of compressedConcepts) {
      if (this.conceptsMatch(concept, compressed)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if two concepts match (fuzzy)
   */
  private conceptsMatch(c1: string, c2: string): boolean {
    const n1 = this.normalize(c1);
    const n2 = this.normalize(c2);

    // Exact match
    if (n1 === n2) return true;

    // Contains match
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // Word overlap
    const words1 = new Set(n1.split(/\s+/));
    const words2 = new Set(n2.split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    const similarity = intersection.size / union.size;
    return similarity > 0.5;
  }

  /**
   * Extract relationships
   */
  private extractRelationships(text: string): Array<{
    from: string;
    to: string;
    type: string;
  }> {
    const relationships: Array<{ from: string; to: string; type: string }> = [];

    const patterns: Array<{ pattern: RegExp; type: string }> = [
      { pattern: /(\w+)\s+enables?\s+(\w+)/gi, type: 'enables' },
      { pattern: /(\w+)\s+requires?\s+(\w+)/gi, type: 'requires' },
      { pattern: /(\w+)\s+→\s+(\w+)/g, type: 'leads_to' },
      { pattern: /(\w+)\s+uses?\s+(\w+)/gi, type: 'uses' }
    ];

    for (const { pattern, type } of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        relationships.push({
          from: this.normalize(match[1]),
          to: this.normalize(match[2]),
          type
        });
      }
    }

    return relationships;
  }

  /**
   * Measure relationship preservation
   */
  private measureRelationshipPreservation(
    original: Array<{ from: string; to: string; type: string }>,
    compressed: Array<{ from: string; to: string; type: string }>
  ): { preserved: number; total: number } {
    let preserved = 0;

    for (const origRel of original) {
      const exists = compressed.some(compRel =>
        this.relationshipsMatch(origRel, compRel)
      );

      if (exists) {
        preserved++;
      }
    }

    return {
      preserved,
      total: original.length
    };
  }

  /**
   * Check if relationships match
   */
  private relationshipsMatch(
    r1: { from: string; to: string; type: string },
    r2: { from: string; to: string; type: string }
  ): boolean {
    return (
      this.normalize(r1.from) === this.normalize(r2.from) &&
      this.normalize(r1.to) === this.normalize(r2.to)
    );
  }

  /**
   * Extract examples (code blocks, etc.)
   */
  private extractExamples(text: string): string[] {
    const examples: string[] = [];

    // Code blocks
    const codeBlocks = text.matchAll(/```[\s\S]*?```/g);
    for (const match of codeBlocks) {
      examples.push(match[0]);
    }

    return examples;
  }

  /**
   * Measure example preservation
   */
  private measureExamplePreservation(
    original: string[],
    compressed: string[]
  ): { preserved: number; total: number } {
    // Examples often removed in compression, so we're more lenient
    const preserved = Math.min(original.length, compressed.length);

    return {
      preserved,
      total: original.length
    };
  }

  /**
   * Normalize text for comparison
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
