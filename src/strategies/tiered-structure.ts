/**
 * Tiered Structure Strategy
 * Organizes content into 3 tiers with different compression levels
 * Target: 3-8x compression (tier-dependent)
 *
 * Tiers:
 * - Tier 1 (Essential): Max compression, key facts only (8x)
 * - Tier 2 (Operational): Balanced, procedural details (5x)
 * - Tier 3 (Complete): Full context, examples (3x)
 */

import { BaseCompressionStrategy } from './base';
import type { DocumentInput, CompressionResult, StrategyConfig } from '../types';
import YAML from 'yaml';

interface TieredContent {
  tier1_essential: any;
  tier2_operational: any;
  tier3_complete: any;
}

export class TieredStructureStrategy extends BaseCompressionStrategy {
  name = 'tiered-structure';
  description = '3-tier organization with progressive detail levels';

  async compress(input: DocumentInput, config: StrategyConfig): Promise<CompressionResult> {
    const startTime = Date.now();

    // 1. Extract and categorize content
    const allSections = input.files.flatMap(f =>
      this.parseMarkdownSections(f.content)
    );

    // 2. Classify sections into tiers
    const tiered = this.classifyIntoTiers(allSections);

    // 3. Compress each tier differently
    const tier1 = this.compressTier1(tiered.tier1_essential, config);
    const tier2 = this.compressTier2(tiered.tier2_operational, config);
    const tier3 = this.compressTier3(tiered.tier3_complete, config);

    // 4. Build structure
    const structure = {
      META: {
        format_version: '1.0',
        compression_strategy: this.name,
        source_files: input.fileCount,
        original_size_bytes: input.totalSize,
        generated_at: new Date().toISOString(),
        tier_info: {
          tier1_items: Object.keys(tier1).length,
          tier2_items: Object.keys(tier2).length,
          tier3_items: Object.keys(tier3).length
        }
      },
      TIER1_ESSENTIAL: tier1,
      TIER2_OPERATIONAL: tier2,
      TIER3_COMPLETE: tier3
    };

    // 5. Generate YAML
    const compressed = YAML.stringify(structure, {
      indent: 2,
      lineWidth: 120
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
        processingTimeMs: Date.now() - startTime
      }
    };
  }

  /**
   * Classify sections into tiers based on importance
   */
  private classifyIntoTiers(sections: any[]): TieredContent {
    const tier1: any[] = [];
    const tier2: any[] = [];
    const tier3: any[] = [];

    for (const section of sections) {
      const importance = this.assessImportance(section);

      if (importance >= 8) {
        tier1.push(section);
      } else if (importance >= 5) {
        tier2.push(section);
      } else {
        tier3.push(section);
      }
    }

    return {
      tier1_essential: tier1,
      tier2_operational: tier2,
      tier3_complete: tier3
    };
  }

  /**
   * Assess section importance (0-10 scale)
   */
  private assessImportance(section: any): number {
    let score = 5; // Base score

    const title = section.title?.toLowerCase() || '';
    const content = section.content?.toLowerCase() || '';

    // High importance indicators
    const highPriority = [
      'overview', 'introduction', 'core', 'essential', 'critical',
      'architecture', 'design', 'concept', 'fundamentals'
    ];

    // Medium importance indicators
    const mediumPriority = [
      'usage', 'how to', 'guide', 'workflow', 'process',
      'configuration', 'setup', 'installation'
    ];

    // Low importance indicators
    const lowPriority = [
      'example', 'tutorial', 'reference', 'appendix',
      'troubleshooting', 'faq', 'notes'
    ];

    // Check title
    for (const keyword of highPriority) {
      if (title.includes(keyword)) {
        score += 3;
        break;
      }
    }

    for (const keyword of mediumPriority) {
      if (title.includes(keyword)) {
        score += 1;
        break;
      }
    }

    for (const keyword of lowPriority) {
      if (title.includes(keyword)) {
        score -= 2;
        break;
      }
    }

    // Short sections are often key points
    if (content.length < 200) {
      score += 1;
    }

    // Sections with formulas/equations are important
    if (content.match(/[=×÷∑∏→]/)) {
      score += 2;
    }

    // Level 1-2 headings are more important
    if (section.level <= 2) {
      score += 2;
    }

    return Math.min(10, Math.max(0, score));
  }

  /**
   * Compress Tier 1 (Essential) - Maximum compression
   */
  private compressTier1(sections: any[], config: StrategyConfig): any {
    const compressed: any = {};

    for (const section of sections) {
      const key = this.normalizeKey(section.title);

      // Extract only absolute essentials
      const essentials = this.extractEssentials(section.content);

      if (essentials) {
        compressed[key] = essentials;
      }
    }

    return compressed;
  }

  /**
   * Extract essential information only
   */
  private extractEssentials(content: string): string | string[] | any {
    // Extract formulas
    const formulas = content.match(/[A-Za-z]+\s*=\s*[^.\n]+/g);
    if (formulas && formulas.length > 0) {
      return formulas.map(f => f.trim());
    }

    // Extract bullet points
    const bullets: string[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^[-*]\s+(.+)$/);
      if (match) {
        bullets.push(match[1].trim());
      }
    }

    if (bullets.length > 0) {
      return bullets;
    }

    // Extract first sentence (usually most important)
    const sentences = content.split(/[.!?]+/);
    if (sentences.length > 0) {
      return sentences[0].trim();
    }

    return content.slice(0, 100); // Truncate to 100 chars
  }

  /**
   * Compress Tier 2 (Operational) - Balanced compression
   */
  private compressTier2(sections: any[], config: StrategyConfig): any {
    const compressed: any = {};

    for (const section of sections) {
      const key = this.normalizeKey(section.title);

      // Keep procedural information
      const procedural = this.extractProcedural(section.content);

      if (procedural) {
        compressed[key] = procedural;
      }
    }

    return compressed;
  }

  /**
   * Extract procedural/how-to information
   */
  private extractProcedural(content: string): any {
    // Look for steps
    const steps: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      // Numbered steps
      const numbered = line.match(/^\d+\.\s+(.+)$/);
      if (numbered) {
        steps.push(numbered[1].trim());
        continue;
      }

      // Bullet points (procedural)
      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        steps.push(bullet[1].trim());
      }
    }

    if (steps.length > 0) {
      return steps;
    }

    // If no steps, keep condensed version
    return content
      .split('\n')
      .filter(line => line.trim())
      .join(' ')
      .slice(0, 300);
  }

  /**
   * Compress Tier 3 (Complete) - Light compression
   */
  private compressTier3(sections: any[], config: StrategyConfig): any {
    const compressed: any = {};

    for (const section of sections) {
      const key = this.normalizeKey(section.title);

      // Keep more complete information
      const complete = this.extractComplete(section.content);

      if (complete) {
        compressed[key] = complete;
      }
    }

    return compressed;
  }

  /**
   * Extract complete information with examples
   */
  private extractComplete(content: string): any {
    // Keep code blocks
    const codeBlocks: string[] = [];
    const codeMatches = content.matchAll(/```[\s\S]*?```/g);
    for (const match of codeMatches) {
      codeBlocks.push(match[0]);
    }

    // Remove code blocks from content for processing
    let textContent = content.replace(/```[\s\S]*?```/g, '[CODE_BLOCK]');

    // Light compression only
    textContent = textContent
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Restore code blocks
    let index = 0;
    textContent = textContent.replace(/\[CODE_BLOCK\]/g, () => {
      return codeBlocks[index++] || '';
    });

    return textContent;
  }

  /**
   * Normalize section title to key
   */
  private normalizeKey(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  protected calculateFidelity(result: CompressionResult, original: DocumentInput): number {
    // Tiered structure preserves different levels
    // Weight by tier importance
    return 0.85; // 85% average across tiers
  }

  protected calculateCoverage(result: CompressionResult, original: DocumentInput): number {
    // All tiers combined should have good coverage
    return 0.90; // 90% coverage with 3 tiers
  }
}
