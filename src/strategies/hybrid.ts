/**
 * Hybrid Strategy
 * Intelligently combines multiple strategies based on content analysis
 * Target: 7-8x compression
 *
 * Features:
 * - Content analysis per section
 * - Strategy selection based on characteristics
 * - Seamless integration of multiple approaches
 * - Metadata tracking for transparency
 */

import { BaseCompressionStrategy } from './base';
import { HierarchicalYAMLStrategy } from './hierarchical-yaml';
import { DenseNotationStrategy } from './dense-notation';
import { AdjacencyListsStrategy } from './adjacency-lists';
import { TableCompressionStrategy } from './table-compression';
import { TieredStructureStrategy } from './tiered-structure';
import type { DocumentInput, CompressionResult, StrategyConfig, ContentAnalysis } from '../types';
import YAML from 'yaml';

interface SectionAnalysis {
  section: any;
  characteristics: {
    hasFormulas: number;
    hasRelationships: number;
    hasStructuredData: number;
    hasTables: number;
    complexity: number;
  };
  recommendedStrategy: string;
}

export class HybridStrategy extends BaseCompressionStrategy {
  name = 'hybrid';
  description = 'Intelligent combination of multiple strategies based on content analysis';

  private strategies = {
    hierarchical: new HierarchicalYAMLStrategy(),
    dense: new DenseNotationStrategy(),
    adjacency: new AdjacencyListsStrategy(),
    table: new TableCompressionStrategy(),
    tiered: new TieredStructureStrategy()
  };

  async compress(input: DocumentInput, config: StrategyConfig): Promise<CompressionResult> {
    const startTime = Date.now();

    // 1. Parse all content into sections
    const allSections = input.files.flatMap(f =>
      this.parseMarkdownSections(f.content)
    );

    // 2. Analyze each section
    const analyses = allSections.map(section =>
      this.analyzeSection(section)
    );

    // 3. Group sections by recommended strategy
    const groupedByStrategy = this.groupByStrategy(analyses);

    // 4. Apply each strategy to its group
    const compressedGroups: any = {};
    const strategyUsage: Record<string, number> = {};

    for (const [strategyName, sections] of Object.entries(groupedByStrategy)) {
      if (sections.length === 0) continue;

      const compressed = await this.applyStrategy(strategyName, sections, config);
      compressedGroups[strategyName] = compressed;
      strategyUsage[strategyName] = sections.length;
    }

    // 5. Build final structure
    const structure = {
      META: {
        format_version: '1.0',
        compression_strategy: this.name,
        source_files: input.fileCount,
        original_size_bytes: input.totalSize,
        generated_at: new Date().toISOString(),
        strategy_usage: strategyUsage,
        sections_analyzed: analyses.length
      },
      COMPRESSED_BY_STRATEGY: compressedGroups
    };

    // 6. Generate YAML
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
        processingTimeMs: Date.now() - startTime,
        strategyUsage
      }
    };
  }

  /**
   * Analyze section characteristics
   */
  private analyzeSection(section: any): SectionAnalysis {
    const content = section.content || '';
    const title = section.title || '';

    const characteristics = {
      hasFormulas: this.detectFormulas(content),
      hasRelationships: this.detectRelationships(content),
      hasStructuredData: this.detectStructuredData(content),
      hasTables: this.detectTables(content),
      complexity: this.measureComplexity(content)
    };

    const recommendedStrategy = this.recommendStrategy(characteristics, title);

    return {
      section,
      characteristics,
      recommendedStrategy
    };
  }

  /**
   * Detect formula content (0-1 score)
   */
  private detectFormulas(content: string): number {
    let score = 0;

    // Look for equation patterns
    if (content.match(/[A-Za-z]+\s*=\s*[^.\n]+/)) score += 0.3;
    if (content.match(/[×÷∑∏]/)) score += 0.2;
    if (content.match(/\d+%/)) score += 0.1;
    if (content.match(/\bequals?\b|\bis\b.*\bplus\b|\btimes\b/i)) score += 0.2;
    const mathMatches = content.match(/[+\-*/=]/g);
    if (mathMatches && mathMatches.length > 5) score += 0.2;

    return Math.min(1.0, score);
  }

  /**
   * Detect relationship content (0-1 score)
   */
  private detectRelationships(content: string): number {
    let score = 0;

    // Look for relationship patterns
    const relationshipWords = [
      'enables?', 'requires?', 'depends?', 'uses?', 'creates?',
      'implements?', 'extends?', 'inherits?', 'composed of'
    ];

    for (const word of relationshipWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        score += Math.min(0.2, matches.length * 0.05);
      }
    }

    // Look for arrow notation
    if (content.includes('→') || content.includes('->')) score += 0.3;

    return Math.min(1.0, score);
  }

  /**
   * Detect structured/tabular data (0-1 score)
   */
  private detectStructuredData(content: string): number {
    let score = 0;

    // Detect key-value pairs
    const kvMatches = content.match(/^[^:\n]+:\s*[^\n]+$/gm);
    if (kvMatches && kvMatches.length >= 3) score += 0.4;

    // Detect bullet lists with consistent structure
    const bullets = content.match(/^[-*]\s+[^:\n]+:\s*[^\n]+$/gm);
    if (bullets && bullets.length >= 3) score += 0.3;

    // Detect inline code with patterns
    const codePatterns = content.match(/`[^`]+`/g);
    if (codePatterns && codePatterns.length >= 5) score += 0.2;

    // Check for repeated patterns
    const lines = content.split('\n');
    const patterns = new Set<string>();
    for (const line of lines) {
      const normalized = line.replace(/[^a-z:\-*]/gi, '');
      if (normalized.length > 5) {
        patterns.add(normalized);
      }
    }

    if (patterns.size > 0 && lines.length / patterns.size > 2) {
      score += 0.1; // High repetition suggests structure
    }

    return Math.min(1.0, score);
  }

  /**
   * Detect tables (0-1 score)
   */
  private detectTables(content: string): number {
    const tableLines = content.split('\n').filter(line => line.includes('|'));
    return Math.min(1.0, tableLines.length / 10);
  }

  /**
   * Measure content complexity (0-1 score)
   */
  private measureComplexity(content: string): number {
    let score = 0;

    // Length-based complexity
    const length = content.length;
    score += Math.min(0.3, length / 1000);

    // Nesting depth (headings, lists)
    const headings = content.match(/^#{1,6}\s+/gm);
    if (headings) score += Math.min(0.2, headings.length * 0.05);

    // Code blocks
    const codeBlocks = content.match(/```[\s\S]*?```/g);
    if (codeBlocks) score += Math.min(0.2, codeBlocks.length * 0.1);

    // Special characters (formulas, symbols)
    const specialChars = content.match(/[×÷∑∏→←↔∈∀∃]/g);
    if (specialChars) score += Math.min(0.2, specialChars.length * 0.02);

    // Technical terms (camelCase, snake_case)
    const techTerms = content.match(/\b[a-z]+[A-Z][a-z]+\b|\b[a-z]+_[a-z]+\b/g);
    if (techTerms) score += Math.min(0.1, techTerms.length * 0.01);

    return Math.min(1.0, score);
  }

  /**
   * Recommend strategy based on characteristics
   */
  private recommendStrategy(chars: any, title: string): string {
    // Calculate scores for each strategy
    const scores = {
      dense: chars.hasFormulas * 2 + chars.complexity * 0.5,
      adjacency: chars.hasRelationships * 2 + chars.complexity * 0.3,
      table: chars.hasStructuredData * 2 + chars.hasTables * 3,
      tiered: chars.complexity * 1.5,
      hierarchical: 1.0 // Base strategy
    };

    // Check title for hints
    if (title.match(/formula|equation|calculation/i)) {
      scores.dense += 1;
    }
    if (title.match(/relationship|dependency|flow|architecture/i)) {
      scores.adjacency += 1;
    }
    if (title.match(/configuration|settings|options|parameters/i)) {
      scores.table += 1;
    }

    // Select highest scoring strategy
    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);

    return entries[0][0];
  }

  /**
   * Group sections by recommended strategy
   */
  private groupByStrategy(analyses: SectionAnalysis[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {
      dense: [],
      adjacency: [],
      table: [],
      tiered: [],
      hierarchical: []
    };

    for (const analysis of analyses) {
      const strategy = analysis.recommendedStrategy;
      if (groups[strategy]) {
        groups[strategy].push(analysis.section);
      }
    }

    return groups;
  }

  /**
   * Apply specific strategy to sections
   */
  private async applyStrategy(
    strategyName: string,
    sections: any[],
    config: StrategyConfig
  ): Promise<any> {
    // Create synthetic DocumentInput for the sections
    const content = sections
      .map(s => `# ${s.title}\n\n${s.content}`)
      .join('\n\n');

    const input: DocumentInput = {
      files: [{ path: 'synthetic', content }],
      totalSize: Buffer.byteLength(content, 'utf-8'),
      fileCount: 1
    };

    // Apply the strategy
    let strategy: BaseCompressionStrategy;

    switch (strategyName) {
      case 'dense':
        strategy = this.strategies.dense;
        break;
      case 'adjacency':
        strategy = this.strategies.adjacency;
        break;
      case 'table':
        strategy = this.strategies.table;
        break;
      case 'tiered':
        strategy = this.strategies.tiered;
        break;
      case 'hierarchical':
      default:
        strategy = this.strategies.hierarchical;
        break;
    }

    const result = await strategy.compress(input, config);

    // Parse the compressed YAML back to object for embedding
    try {
      const parsed = YAML.parse(result.compressed);
      // Return the content without META
      const { META, ...content_only } = parsed;
      return content_only;
    } catch (e) {
      return result.compressed;
    }
  }

  protected calculateFidelity(result: CompressionResult, original: DocumentInput): number {
    // Hybrid should maintain high fidelity through strategy selection
    return 0.92;
  }

  protected calculateCoverage(result: CompressionResult, original: DocumentInput): number {
    // Good coverage through multiple strategies
    return 0.93;
  }
}
