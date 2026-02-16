/**
 * Document Analyzer
 * Analyzes documentation content to recommend optimal compression strategy
 */

import type { DocumentInput, ContentAnalysis } from './types';

export class DocumentAnalyzer {
  /**
   * Analyze documentation and recommend strategy
   */
  async analyze(input: DocumentInput): Promise<ContentAnalysis> {
    const allText = input.files.map(f => f.content).join('\n\n');

    const hasFormulas = this.analyzeFormulas(allText);
    const hasRelationships = this.analyzeRelationships(allText);
    const hasStructuredData = this.analyzeStructuredData(allText);
    const complexity = this.analyzeComplexity(allText);

    const recommendedStrategy = this.recommendStrategy({
      hasFormulas,
      hasRelationships,
      hasStructuredData,
      complexity,
      recommendedStrategy: ''
    });

    return {
      hasFormulas,
      hasRelationships,
      hasStructuredData,
      complexity,
      recommendedStrategy
    };
  }

  /**
   * Analyze formula content (0-1 score)
   */
  private analyzeFormulas(text: string): number {
    let score = 0;

    // Mathematical equations
    const equations = text.match(/[A-Za-z]+\s*=\s*[^.\n]+/g);
    if (equations) score += Math.min(0.3, equations.length * 0.05);

    // Mathematical symbols
    const symbols = text.match(/[×÷∑∏√∫]/g);
    if (symbols) score += Math.min(0.2, symbols.length * 0.02);

    // Percentages and numbers
    const percentages = text.match(/\d+%/g);
    if (percentages) score += Math.min(0.2, percentages.length * 0.02);

    // Mathematical operators
    const operators = text.match(/[+\-*/=<>≤≥≠≈]/g);
    if (operators) score += Math.min(0.2, operators.length * 0.005);

    // Formula keywords
    if (text.match(/\b(equals?|formula|equation|calculation)\b/gi)) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Analyze relationship content (0-1 score)
   */
  private analyzeRelationships(text: string): number {
    let score = 0;

    // Relationship keywords
    const relationshipWords = [
      'enables?', 'requires?', 'depends?', 'uses?', 'creates?',
      'implements?', 'extends?', 'composed of', 'consists? of',
      'prevents?', 'causes?', 'leads to', 'results? in'
    ];

    for (const word of relationshipWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += Math.min(0.1, matches.length * 0.02);
      }
    }

    // Arrow notation
    const arrows = text.match(/→|←|↔|->|<-|<->/g);
    if (arrows) score += Math.min(0.3, arrows.length * 0.05);

    // Architecture/flow keywords
    if (text.match(/\b(architecture|flow|dependency|relationship|graph)\b/gi)) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Analyze structured/tabular data (0-1 score)
   */
  private analyzeStructuredData(text: string): number {
    let score = 0;

    // Existing tables
    const tables = text.split('\n').filter(line => line.includes('|'));
    if (tables.length >= 3) score += Math.min(0.4, tables.length * 0.05);

    // Key-value pairs
    const kvPairs = text.match(/^[^:\n]+:\s*[^\n]+$/gm);
    if (kvPairs && kvPairs.length >= 5) {
      score += Math.min(0.3, kvPairs.length * 0.03);
    }

    // Bullet lists with structure
    const structuredBullets = text.match(/^[-*]\s+[^:\n]+:\s*[^\n]+$/gm);
    if (structuredBullets && structuredBullets.length >= 3) {
      score += 0.2;
    }

    // Definition lists
    const definitions = text.match(/\*\*([^*]+)\*\*:\s*[^\n]+/g);
    if (definitions && definitions.length >= 3) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Analyze content complexity (0-1 score)
   */
  private analyzeComplexity(text: string): number {
    let score = 0;

    // Length-based complexity
    const length = text.length;
    score += Math.min(0.3, length / 10000);

    // Number of sections
    const headings = text.match(/^#{1,6}\s+/gm);
    if (headings) score += Math.min(0.2, headings.length * 0.02);

    // Code blocks
    const codeBlocks = text.match(/```[\s\S]*?```/g);
    if (codeBlocks) score += Math.min(0.2, codeBlocks.length * 0.05);

    // Technical terminology
    const techTerms = text.match(/\b[a-z]+[A-Z][a-z]+\b|\b[a-z]+_[a-z]+\b/g);
    if (techTerms) score += Math.min(0.2, techTerms.length * 0.001);

    // Nesting depth (subsections)
    const h1 = text.match(/^#\s+/gm)?.length || 0;
    const h2 = text.match(/^##\s+/gm)?.length || 0;
    const h3 = text.match(/^###\s+/gm)?.length || 0;
    const depth = (h1 + h2 * 2 + h3 * 3) / (h1 + h2 + h3 + 1);
    score += Math.min(0.1, depth * 0.05);

    return Math.min(1.0, score);
  }

  /**
   * Recommend optimal strategy based on analysis
   */
  recommendStrategy(analysis: ContentAnalysis): string {
    // Calculate scores for each strategy
    const scores = {
      'dense-notation': analysis.hasFormulas * 3,
      'adjacency-lists': analysis.hasRelationships * 2.5,
      'table-compression': analysis.hasStructuredData * 2.5,
      'tiered-structure': analysis.complexity * 2,
      'hybrid': (analysis.hasFormulas + analysis.hasRelationships +
                 analysis.hasStructuredData) * 1.5,
      'hierarchical-yaml': 1.0 // Base strategy
    };

    // Select highest scoring
    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);

    // Use hybrid if multiple characteristics are present
    const characteristicsPresent = [
      analysis.hasFormulas > 0.3,
      analysis.hasRelationships > 0.3,
      analysis.hasStructuredData > 0.3
    ].filter(Boolean).length;

    if (characteristicsPresent >= 2) {
      return 'hybrid';
    }

    return entries[0][0];
  }

  /**
   * Generate analysis report
   */
  generateReport(analysis: ContentAnalysis): string {
    const formatScore = (score: number): string => {
      if (score >= 0.7) return 'High ✓';
      if (score >= 0.4) return 'Medium ⚡';
      return 'Low ○';
    };

    return `
# Document Analysis Report

## Content Characteristics

- **Formulas**: ${formatScore(analysis.hasFormulas)} (${(analysis.hasFormulas * 100).toFixed(0)}%)
- **Relationships**: ${formatScore(analysis.hasRelationships)} (${(analysis.hasRelationships * 100).toFixed(0)}%)
- **Structured Data**: ${formatScore(analysis.hasStructuredData)} (${(analysis.hasStructuredData * 100).toFixed(0)}%)
- **Complexity**: ${formatScore(analysis.complexity)} (${(analysis.complexity * 100).toFixed(0)}%)

## Recommended Strategy

**${analysis.recommendedStrategy}**

### Rationale

${this.explainRecommendation(analysis)}

## Alternative Strategies

${this.suggestAlternatives(analysis)}
`.trim();
  }

  /**
   * Explain why a strategy was recommended
   */
  private explainRecommendation(analysis: ContentAnalysis): string {
    const strategy = analysis.recommendedStrategy;

    const explanations: Record<string, string> = {
      'dense-notation': 'High formula content detected. Dense notation will convert verbose descriptions to mathematical symbols for maximum compression.',
      'adjacency-lists': 'High relationship content detected. Adjacency lists will represent concepts and connections as a graph for efficient storage.',
      'table-compression': 'High structured data detected. Table compression will extract repeating patterns into compact markdown tables.',
      'tiered-structure': 'High complexity detected. Tiered structure will organize content by importance level for progressive detail.',
      'hybrid': 'Multiple content types detected. Hybrid strategy will apply the optimal compression technique to each section.',
      'hierarchical-yaml': 'General documentation structure. Hierarchical YAML provides balanced compression with semantic clustering.'
    };

    return explanations[strategy] || 'Default strategy for general documentation.';
  }

  /**
   * Suggest alternative strategies
   */
  private suggestAlternatives(analysis: ContentAnalysis): string {
    const alternatives: string[] = [];

    if (analysis.hasFormulas > 0.2 && analysis.recommendedStrategy !== 'dense-notation') {
      alternatives.push('- **dense-notation**: Consider for formula-heavy sections');
    }

    if (analysis.hasRelationships > 0.2 && analysis.recommendedStrategy !== 'adjacency-lists') {
      alternatives.push('- **adjacency-lists**: Consider for relationship-heavy sections');
    }

    if (analysis.hasStructuredData > 0.2 && analysis.recommendedStrategy !== 'table-compression') {
      alternatives.push('- **table-compression**: Consider for structured data sections');
    }

    if (analysis.complexity > 0.5 && analysis.recommendedStrategy !== 'tiered-structure') {
      alternatives.push('- **tiered-structure**: Consider for complex, multi-level documentation');
    }

    if (alternatives.length === 0) {
      alternatives.push('- Current recommendation is optimal for this content');
    }

    return alternatives.join('\n');
  }
}
