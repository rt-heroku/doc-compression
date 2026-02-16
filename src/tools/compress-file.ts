/**
 * Single file compression tool
 */

import { HierarchicalYAMLStrategy } from '../strategies/hierarchical-yaml';
import type { CompressionResult, StrategyConfig } from '../types';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

export interface CompressFileParams {
  filePath: string;
  strategy?: string;
  level?: 'light' | 'medium' | 'aggressive';
  outputPath?: string;
}

export async function compressFileTool(params: CompressFileParams): Promise<CompressionResult> {
  try {
    // 1. Validate file path
    if (!params.filePath) {
      throw new Error('filePath is required');
    }

    // 2. Read file
    const content = readFileSync(params.filePath, 'utf-8');
    const originalSize = Buffer.byteLength(content, 'utf-8');

    const input = {
      files: [{
        path: params.filePath,
        content,
        metadata: {
          originalPath: params.filePath
        }
      }],
      totalSize: originalSize,
      fileCount: 1
    };

    // 3. Select strategy (currently only hierarchical-yaml implemented in Phase 1)
    const strategy = getStrategy(params.strategy || 'hierarchical-yaml');

    // 4. Configure compression
    const config: StrategyConfig = {
      level: params.level || 'medium',
      preserveCodeBlocks: true,
      preserveExamples: true,
      symbolsEnabled: true
    };

    // 5. Compress
    const result = await strategy.compress(input, config);

    // 6. Determine output path
    const outputPath = params.outputPath || generateOutputPath(params.filePath);

    // 7. Write output
    writeFileSync(outputPath, result.compressed, 'utf-8');

    // 8. Add output path to metadata
    result.metadata.outputPath = outputPath;

    // 9. Log results
    console.log(`\n✅ Compression complete!`);
    console.log(`   Original:   ${formatSize(result.originalSize)}`);
    console.log(`   Compressed: ${formatSize(result.compressedSize)}`);
    console.log(`   Ratio:      ${result.compressionRatio.toFixed(1)}x`);
    console.log(`   Output:     ${outputPath}`);

    return result;
  } catch (error) {
    console.error('❌ Compression failed:', error);
    throw error;
  }
}

import { DenseNotationStrategy } from '../strategies/dense-notation';
import { AdjacencyListsStrategy } from '../strategies/adjacency-lists';
import { TableCompressionStrategy } from '../strategies/table-compression';
import { TieredStructureStrategy } from '../strategies/tiered-structure';
import { HybridStrategy } from '../strategies/hybrid';

/**
 * Get compression strategy by name
 */
function getStrategy(name: string) {
  switch (name) {
    case 'hierarchical-yaml':
      return new HierarchicalYAMLStrategy();
    case 'dense-notation':
      return new DenseNotationStrategy();
    case 'adjacency-lists':
      return new AdjacencyListsStrategy();
    case 'table-compression':
      return new TableCompressionStrategy();
    case 'tiered-structure':
      return new TieredStructureStrategy();
    case 'hybrid':
      return new HybridStrategy();
    default:
      throw new Error(`Unknown strategy: ${name}. Available: hierarchical-yaml, dense-notation, adjacency-lists, table-compression, tiered-structure, hybrid`);
  }
}

/**
 * Generate output file path
 */
function generateOutputPath(inputPath: string): string {
  const dir = dirname(inputPath);
  const base = basename(inputPath, extname(inputPath));
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  return join(dir, `COMPRESSED-${base}-${timestamp}.yaml`);
}

/**
 * Format byte size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
