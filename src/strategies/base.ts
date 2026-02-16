/**
 * Base compression strategy interface and implementation
 */

import type {
  CompressionStrategy,
  DocumentInput,
  CompressionResult,
  StrategyConfig,
  ValidationReport,
  Section,
  Concept
} from '../types';

export abstract class BaseCompressionStrategy implements CompressionStrategy {
  abstract name: string;
  abstract description: string;

  abstract compress(input: DocumentInput, config: StrategyConfig): Promise<CompressionResult>;

  async validate(result: CompressionResult, original: DocumentInput): Promise<ValidationReport> {
    const fidelity = this.calculateFidelity(result, original);
    const coverage = this.calculateCoverage(result, original);

    const conceptStats = this.extractConceptStats(result, original);
    const relationshipStats = this.extractRelationshipStats(result, original);
    const exampleStats = this.extractExampleStats(result, original);

    return {
      fidelity,
      coverage,
      details: {
        concepts: conceptStats,
        relationships: relationshipStats,
        examples: exampleStats
      },
      passed: fidelity >= 0.95 && coverage >= 0.95
    };
  }

  protected abstract calculateFidelity(result: CompressionResult, original: DocumentInput): number;
  protected abstract calculateCoverage(result: CompressionResult, original: DocumentInput): number;

  /**
   * Extract concepts from original and compressed content
   */
  protected extractConceptStats(result: CompressionResult, original: DocumentInput): {
    preserved: number;
    total: number;
  } {
    const originalConcepts = this.extractConcepts(original.files.map(f => f.content).join('\n'));
    const compressedConcepts = this.extractConcepts(result.compressed);

    const preserved = originalConcepts.filter(concept =>
      compressedConcepts.some(c => this.conceptsMatch(c, concept))
    ).length;

    return {
      preserved,
      total: originalConcepts.length
    };
  }

  /**
   * Extract relationship statistics
   */
  protected extractRelationshipStats(result: CompressionResult, original: DocumentInput): {
    preserved: number;
    total: number;
  } {
    // Simplified relationship extraction - can be enhanced
    const originalRelationships = this.extractRelationships(original.files.map(f => f.content).join('\n'));
    const compressedRelationships = this.extractRelationships(result.compressed);

    return {
      preserved: compressedRelationships.length,
      total: originalRelationships.length
    };
  }

  /**
   * Extract example statistics
   */
  protected extractExampleStats(result: CompressionResult, original: DocumentInput): {
    preserved: number;
    total: number;
  } {
    const originalExamples = this.extractExamples(original.files.map(f => f.content).join('\n'));
    const compressedExamples = this.extractExamples(result.compressed);

    return {
      preserved: compressedExamples.length,
      total: originalExamples.length
    };
  }

  /**
   * Extract concepts from text (can be overridden)
   */
  protected extractConcepts(text: string): string[] {
    // Simple extraction: look for headings and defined terms
    const concepts: string[] = [];

    // Extract headings
    const headingMatches = text.matchAll(/^#{1,6}\s+(.+)$/gm);
    for (const match of headingMatches) {
      concepts.push(match[1].trim());
    }

    // Extract bold terms (often definitions)
    const boldMatches = text.matchAll(/\*\*([^*]+)\*\*/g);
    for (const match of boldMatches) {
      concepts.push(match[1].trim());
    }

    return [...new Set(concepts)]; // Remove duplicates
  }

  /**
   * Extract relationships from text
   */
  protected extractRelationships(text: string): Array<{ from: string; to: string; type: string }> {
    const relationships: Array<{ from: string; to: string; type: string }> = [];

    // Look for relationship patterns
    const patterns = [
      /(\w+)\s+enables\s+(\w+)/gi,
      /(\w+)\s+requires\s+(\w+)/gi,
      /(\w+)\s+→\s+(\w+)/g,
      /(\w+)\s+uses\s+(\w+)/gi
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        relationships.push({
          from: match[1],
          to: match[2],
          type: 'generic'
        });
      }
    }

    return relationships;
  }

  /**
   * Extract code examples and usage examples
   */
  protected extractExamples(text: string): string[] {
    const examples: string[] = [];

    // Extract code blocks
    const codeBlockMatches = text.matchAll(/```[\s\S]*?```/g);
    for (const match of codeBlockMatches) {
      examples.push(match[0]);
    }

    return examples;
  }

  /**
   * Check if two concepts match (fuzzy matching)
   */
  protected conceptsMatch(concept1: string, concept2: string): boolean {
    const normalized1 = concept1.toLowerCase().trim();
    const normalized2 = concept2.toLowerCase().trim();

    return normalized1 === normalized2 ||
           normalized1.includes(normalized2) ||
           normalized2.includes(normalized1);
  }

  /**
   * Parse markdown into hierarchical sections
   */
  protected parseMarkdownSections(content: string): Section[] {
    const lines = content.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          title: headingMatch[2].trim(),
          level: headingMatch[1].length,
          content: '',
          subsections: []
        };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    return this.nestSections(sections);
  }

  /**
   * Nest flat sections into hierarchical structure
   */
  private nestSections(flatSections: Section[]): Section[] {
    const root: Section[] = [];
    const stack: Section[] = [];

    for (const section of flatSections) {
      // Pop stack until we find parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(section);
      } else {
        stack[stack.length - 1].subsections.push(section);
      }

      stack.push(section);
    }

    return root;
  }
}
