/**
 * Core type definitions for documentation compression plugin
 */

export interface CompressionStrategy {
  name: string;
  description: string;
  compress(input: DocumentInput, config: StrategyConfig): Promise<CompressionResult>;
  validate(result: CompressionResult, original: DocumentInput): Promise<ValidationReport>;
}

export interface DocumentInput {
  files: Array<{
    path: string;
    content: string;
    metadata?: Record<string, any>;
  }>;
  totalSize: number;
  fileCount: number;
}

export interface CompressionResult {
  compressed: string;
  compressionRatio: number;
  originalSize: number;
  compressedSize: number;
  metadata: {
    strategy: string;
    timestamp: string;
    config: StrategyConfig;
    coverage?: number;
    fidelity?: number;
    processingTimeMs?: number;
    outputPath?: string;
    [key: string]: any;
  };
}

export interface StrategyConfig {
  level?: 'light' | 'medium' | 'aggressive';
  preserveCodeBlocks?: boolean;
  preserveExamples?: boolean;
  maxDepth?: number;
  symbolsEnabled?: boolean;
  combineFiles?: boolean;
  analysis?: ContentAnalysis;
  [key: string]: any;
}

export interface ValidationReport {
  fidelity: number;
  coverage: number;
  details: {
    concepts: { preserved: number; total: number };
    relationships: { preserved: number; total: number };
    examples: { preserved: number; total: number };
  };
  passed: boolean;
}

export interface ContentAnalysis {
  hasFormulas: number;
  hasRelationships: number;
  hasStructuredData: number;
  complexity: number;
  recommendedStrategy: string;
}

export interface Section {
  title: string;
  level: number;
  content: string;
  subsections: Section[];
  metadata?: {
    type?: 'concept' | 'architecture' | 'example' | 'reference';
    keywords?: string[];
  };
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  relationships: Map<string, string[]>;
  formulas?: string[];
  examples?: string[];
}
