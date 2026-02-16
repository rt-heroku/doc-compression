/**
 * Coverage Analyzer
 * Measures how completely original information is represented
 * Target: 95%+ coverage
 */

import type { DocumentInput, CompressionResult } from '../types';

export interface CoverageReport {
  overall: number;
  perSection: Record<string, number>;
  missing: string[];
  recommendation: string;
}

export class CoverageAnalyzer {
  /**
   * Analyze coverage
   */
  async analyze(
    original: DocumentInput,
    compressed: CompressionResult
  ): Promise<CoverageReport> {
    const originalText = original.files.map(f => f.content).join('\n');

    // 1. Identify sections
    const sections = this.identifySections(originalText);

    // 2. Measure coverage per section
    const perSection: Record<string, number> = {};

    for (const section of sections) {
      const coverage = this.measureSectionCoverage(section, compressed.compressed);
      perSection[section.title] = coverage;
    }

    // 3. Calculate overall coverage
    const overallCoverage = this.calculateOverall(perSection);

    // 4. Identify missing content
    const missing = this.identifyMissingContent(originalText, compressed.compressed);

    // 5. Generate recommendation
    const recommendation = this.generateRecommendation(overallCoverage, missing);

    return {
      overall: overallCoverage,
      perSection,
      missing,
      recommendation
    };
  }

  /**
   * Identify sections in original document
   */
  private identifySections(text: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];
    const lines = text.split('\n');

    let currentSection: { title: string; content: string } | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n');
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          title: headingMatch[2].trim(),
          content: ''
        };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n');
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Measure section coverage
   */
  private measureSectionCoverage(
    section: { title: string; content: string },
    compressed: string
  ): number {
    // Extract key information units from section
    const keyUnits = this.extractKeyUnits(section.content);

    if (keyUnits.length === 0) return 1.0;

    // Check how many are present in compressed
    let present = 0;
    for (const unit of keyUnits) {
      if (this.isPresent(unit, compressed)) {
        present++;
      }
    }

    return present / keyUnits.length;
  }

  /**
   * Extract key information units
   */
  private extractKeyUnits(text: string): string[] {
    const units: string[] = [];

    // Bullet points
    const bullets = text.matchAll(/^[-*]\s+(.+)$/gm);
    for (const match of bullets) {
      units.push(match[1].trim());
    }

    // Numbered items
    const numbered = text.matchAll(/^\d+\.\s+(.+)$/gm);
    for (const match of numbered) {
      units.push(match[1].trim());
    }

    // Bold terms (key concepts)
    const boldTerms = text.matchAll(/\*\*([^*]+)\*\*/g);
    for (const match of boldTerms) {
      units.push(match[1].trim());
    }

    // Sentences with keywords
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (this.isKeyInformation(sentence)) {
        units.push(sentence.trim());
      }
    }

    return units;
  }

  /**
   * Check if sentence contains key information
   */
  private isKeyInformation(sentence: string): boolean {
    const keywords = [
      'important', 'critical', 'essential', 'key',
      'must', 'should', 'required', 'necessary',
      'note', 'warning', 'caution', 'always', 'never'
    ];

    const normalized = sentence.toLowerCase();
    return keywords.some(keyword => normalized.includes(keyword));
  }

  /**
   * Check if information unit is present in compressed
   */
  private isPresent(unit: string, compressed: string): boolean {
    const normalized = this.normalize(unit);
    const compressedNorm = this.normalize(compressed);

    // Direct match
    if (compressedNorm.includes(normalized)) {
      return true;
    }

    // Word overlap
    const words = new Set(normalized.split(/\s+/).filter(w => w.length > 3));
    if (words.size === 0) return false;

    const compressedWords = new Set(compressedNorm.split(/\s+/));

    const overlap = [...words].filter(w => compressedWords.has(w)).length;
    const similarity = overlap / words.size;

    return similarity > 0.5;
  }

  /**
   * Calculate overall coverage
   */
  private calculateOverall(perSection: Record<string, number>): number {
    const values = Object.values(perSection);

    if (values.length === 0) return 1.0;

    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * Identify missing content
   */
  private identifyMissingContent(original: string, compressed: string): string[] {
    const missing: string[] = [];

    // Extract headings from original
    const originalHeadings = original.matchAll(/^#{1,6}\s+(.+)$/gm);

    for (const match of originalHeadings) {
      const heading = match[1].trim();
      const normalized = this.normalize(heading);

      // Check if heading topic is covered in compressed
      if (!this.normalize(compressed).includes(normalized)) {
        missing.push(heading);
      }
    }

    return missing.slice(0, 10); // Return top 10 missing items
  }

  /**
   * Generate recommendation
   */
  private generateRecommendation(coverage: number, missing: string[]): string {
    if (coverage >= 0.95) {
      return 'Coverage is excellent (≥95%). No action needed.';
    } else if (coverage >= 0.85) {
      return `Coverage is good (${(coverage * 100).toFixed(0)}%). Consider reviewing missing sections: ${missing.slice(0, 3).join(', ')}`;
    } else if (coverage >= 0.70) {
      return `Coverage is moderate (${(coverage * 100).toFixed(0)}%). Consider less aggressive compression or manual review.`;
    } else {
      return `Coverage is low (${(coverage * 100).toFixed(0)}%). Consider using a different strategy or reducing compression level.`;
    }
  }

  /**
   * Normalize text
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
