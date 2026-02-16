/**
 * Folder compression tool
 */

import { HierarchicalYAMLStrategy } from '../strategies/hierarchical-yaml';
import type { CompressionResult, StrategyConfig, DocumentInput } from '../types';
import { readFileSync, writeFileSync } from 'fs';
import { join, basename, relative } from 'path';
import { glob } from 'glob';

export interface CompressFolderParams {
  folderPath: string;
  strategy?: string;
  recursive?: boolean;
  combineFiles?: boolean;
  includePattern?: string;
  excludePattern?: string;
  outputPath?: string;
}

export async function compressFolderTool(params: CompressFolderParams): Promise<CompressionResult> {
  try {
    console.log(`\n📁 Scanning folder: ${params.folderPath}`);

    // 1. Scan for files
    const pattern = params.includePattern || '**/*.md';
    const files = await glob(pattern, {
      cwd: params.folderPath,
      ignore: params.excludePattern || '**/node_modules/**',
      nodir: true,
      absolute: false
    });

    if (files.length === 0) {
      throw new Error(`No files found matching pattern: ${pattern}`);
    }

    console.log(`   Found ${files.length} file(s)`);

    // 2. Read all files
    const documents = files.map(file => {
      const fullPath = join(params.folderPath, file);
      const content = readFileSync(fullPath, 'utf-8');

      return {
        path: file,
        content,
        metadata: {
          relativePath: file,
          absolutePath: fullPath
        }
      };
    });

    const totalSize = documents.reduce(
      (sum, doc) => sum + Buffer.byteLength(doc.content, 'utf-8'),
      0
    );

    console.log(`   Total size: ${formatSize(totalSize)}`);

    const input: DocumentInput = {
      files: documents,
      totalSize,
      fileCount: documents.length
    };

    // 3. Select strategy
    const strategyName = params.strategy || 'hierarchical-yaml';
    const strategy = getStrategy(strategyName);

    // 4. Configure compression
    const config: StrategyConfig = {
      level: 'medium',
      preserveCodeBlocks: true,
      preserveExamples: true,
      symbolsEnabled: true,
      combineFiles: params.combineFiles !== false // Default to true
    };

    // 5. Compress
    console.log(`\n🗜️  Compressing with ${strategyName} strategy...`);
    const result = await strategy.compress(input, config);

    // 6. Determine output path
    const outputPath = params.outputPath || generateOutputPath(params.folderPath);

    // 7. Write output
    writeFileSync(outputPath, result.compressed, 'utf-8');
    result.metadata.outputPath = outputPath;

    // 8. Log results
    console.log(`\n✅ Compression complete!`);
    console.log(`   Files:      ${input.fileCount}`);
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
 * Generate output file path for folder compression
 */
function generateOutputPath(folderPath: string): string {
  const folderName = basename(folderPath);
  const timestamp = new Date().toISOString().slice(0, 10);

  return join(folderPath, `LLM-KNOWLEDGE-BASE-${folderName}-${timestamp}.yaml`);
}

/**
 * Format byte size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
