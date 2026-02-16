/**
 * Auto-scan and compress tool
 * Scans project for documentation and applies optimal compression
 */

import { glob } from 'glob';
import { readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { DocumentAnalyzer } from '../analyzer';
import { HierarchicalYAMLStrategy } from '../strategies/hierarchical-yaml';
import { DenseNotationStrategy } from '../strategies/dense-notation';
import { AdjacencyListsStrategy } from '../strategies/adjacency-lists';
import { TableCompressionStrategy } from '../strategies/table-compression';
import { TieredStructureStrategy } from '../strategies/tiered-structure';
import { HybridStrategy } from '../strategies/hybrid';
import type { CompressionResult, DocumentInput, StrategyConfig } from '../types';

export interface ScanCompressParams {
  projectPath: string;
  autoDetectStrategy?: boolean;
  generateReport?: boolean;
  outputPath?: string;
}

export async function scanAndCompressTool(params: ScanCompressParams): Promise<CompressionResult> {
  try {
    console.log(`\n🔍 Scanning project: ${params.projectPath}`);

    // 1. Scan for documentation files
    const files = await scanDocumentation(params.projectPath);

    if (files.length === 0) {
      throw new Error('No documentation files found');
    }

    console.log(`   Found ${files.length} documentation file(s)`);

    // 2. Read all files
    const documents = files.map(file => {
      const content = readFileSync(file, 'utf-8');
      return {
        path: file,
        content,
        metadata: { absolutePath: file }
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

    // 3. Analyze content if auto-detect is enabled
    let strategyName = 'hierarchical-yaml';

    if (params.autoDetectStrategy !== false) {
      console.log(`\n📊 Analyzing content...`);
      const analyzer = new DocumentAnalyzer();
      const analysis = await analyzer.analyze(input);

      strategyName = analysis.recommendedStrategy;

      console.log(`   Recommended strategy: ${strategyName}`);
      console.log(`   - Formulas: ${(analysis.hasFormulas * 100).toFixed(0)}%`);
      console.log(`   - Relationships: ${(analysis.hasRelationships * 100).toFixed(0)}%`);
      console.log(`   - Structured Data: ${(analysis.hasStructuredData * 100).toFixed(0)}%`);
      console.log(`   - Complexity: ${(analysis.complexity * 100).toFixed(0)}%`);

      // Generate analysis report if requested
      if (params.generateReport) {
        const report = analyzer.generateReport(analysis);
        const reportPath = join(params.projectPath, 'COMPRESSION-ANALYSIS.md');
        writeFileSync(reportPath, report, 'utf-8');
        console.log(`   Analysis report: ${reportPath}`);
      }
    }

    // 4. Select and apply strategy
    const strategy = getStrategy(strategyName);
    const config: StrategyConfig = {
      level: 'medium',
      preserveCodeBlocks: true,
      preserveExamples: true,
      symbolsEnabled: true
    };

    console.log(`\n🗜️  Compressing with ${strategyName}...`);
    const result = await strategy.compress(input, config);

    // 5. Determine output path
    const outputPath = params.outputPath ||
      join(params.projectPath, `LLM-KNOWLEDGE-BASE-${basename(params.projectPath)}.yaml`);

    // 6. Write output
    writeFileSync(outputPath, result.compressed, 'utf-8');
    result.metadata.outputPath = outputPath;

    // 7. Generate compression report if requested
    if (params.generateReport) {
      const report = generateCompressionReport(result, input, strategyName);
      const reportPath = join(params.projectPath, 'COMPRESSION-REPORT.md');
      writeFileSync(reportPath, report, 'utf-8');
      console.log(`   Compression report: ${reportPath}`);
    }

    // 8. Log results
    console.log(`\n✅ Compression complete!`);
    console.log(`   Strategy:   ${strategyName}`);
    console.log(`   Files:      ${input.fileCount}`);
    console.log(`   Original:   ${formatSize(result.originalSize)}`);
    console.log(`   Compressed: ${formatSize(result.compressedSize)}`);
    console.log(`   Ratio:      ${result.compressionRatio.toFixed(1)}x`);
    console.log(`   Output:     ${outputPath}`);

    return result;
  } catch (error) {
    console.error('❌ Scan and compress failed:', error);
    throw error;
  }
}

/**
 * Scan project for documentation files
 */
async function scanDocumentation(projectPath: string): Promise<string[]> {
  const patterns = [
    '**/*.md',
    '**/*.markdown',
    '**/README*',
    '**/GUIDE*',
    '**/CHANGELOG*'
  ];

  const exclude = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**'
  ];

  const allFiles: string[] = [];

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: projectPath,
      ignore: exclude,
      nodir: true,
      absolute: true
    });

    allFiles.push(...files);
  }

  // Remove duplicates
  return [...new Set(allFiles)];
}

/**
 * Get strategy by name
 */
function getStrategy(name: string) {
  const strategies: Record<string, any> = {
    'hierarchical-yaml': new HierarchicalYAMLStrategy(),
    'dense-notation': new DenseNotationStrategy(),
    'adjacency-lists': new AdjacencyListsStrategy(),
    'table-compression': new TableCompressionStrategy(),
    'tiered-structure': new TieredStructureStrategy(),
    'hybrid': new HybridStrategy()
  };

  const strategy = strategies[name];
  if (!strategy) {
    throw new Error(`Unknown strategy: ${name}`);
  }

  return strategy;
}

/**
 * Generate compression report
 */
function generateCompressionReport(
  result: CompressionResult,
  input: DocumentInput,
  strategyName: string
): string {
  return `# Compression Report

## Summary

- **Date**: ${new Date().toISOString().split('T')[0]}
- **Strategy**: ${strategyName}
- **Files Processed**: ${input.fileCount}

## Results

| Metric | Value |
|--------|-------|
| Original Size | ${formatSize(result.originalSize)} |
| Compressed Size | ${formatSize(result.compressedSize)} |
| **Compression Ratio** | **${result.compressionRatio.toFixed(1)}x** |
| Processing Time | ${result.metadata.processingTimeMs}ms |

## File List

${input.files.map(f => `- \`${f.path}\``).join('\n')}

## Strategy Details

**${strategyName}**

${getStrategyDescription(strategyName)}

## Recommendations

${generateRecommendations(result, input)}

## Next Steps

1. Review the compressed output
2. Manually enhance if targeting 6.6x+ compression
3. Use as LLM knowledge base
4. Version control the compressed file

---

*Generated by Documentation Compression Plugin*
`;
}

/**
 * Get strategy description
 */
function getStrategyDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'hierarchical-yaml': 'Hierarchical YAML with semantic clustering and symbolic notation',
    'dense-notation': 'Mathematical formulas and symbolic shorthand for maximum density',
    'adjacency-lists': 'Relationship graphs using adjacency list notation',
    'table-compression': 'Structured data extracted into compact markdown tables',
    'tiered-structure': '3-tier organization with progressive detail levels',
    'hybrid': 'Intelligent combination of multiple strategies'
  };

  return descriptions[name] || 'Strategy description not available';
}

/**
 * Generate recommendations
 */
function generateRecommendations(result: CompressionResult, input: DocumentInput): string {
  const ratio = result.compressionRatio;
  const recommendations: string[] = [];

  if (ratio < 2) {
    recommendations.push('- Low compression ratio. Consider trying different strategies or manual enhancement.');
    recommendations.push('- Review USAGE-GUIDE.md for manual enhancement techniques.');
  } else if (ratio < 4) {
    recommendations.push('- Good compression achieved. Manual enhancement can improve further.');
    recommendations.push('- See examples in LLM-KNOWLEDGE-BASE.yaml for optimization patterns.');
  } else {
    recommendations.push('- Excellent compression ratio! ✓');
    recommendations.push('- Consider this as your LLM knowledge base.');
  }

  if (input.fileCount > 1) {
    recommendations.push('- Multiple files compressed. Ensure no duplicate concepts across files.');
  }

  return recommendations.join('\n');
}

/**
 * Format byte size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

