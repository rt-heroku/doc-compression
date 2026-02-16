/**
 * Compression Reporter
 * Generates detailed compression reports
 */

import type { DocumentInput, CompressionResult, ValidationReport } from '../types';
import type { CoverageReport } from './coverage-analyzer';

export class CompressionReporter {
  /**
   * Generate comprehensive compression report
   */
  generate(
    original: DocumentInput,
    compressed: CompressionResult,
    validation: ValidationReport,
    coverage: CoverageReport
  ): string {
    return `# Compression Report

${this.generateSummary(original, compressed)}

${this.generateQualityMetrics(validation, coverage)}

${this.generateCoverageDetails(coverage)}

${this.generateRecommendations(compressed, validation, coverage)}

${this.generateFileList(original)}

---

*Generated on ${new Date().toISOString()}*
*Strategy: ${compressed.metadata.strategy}*
`;
  }

  /**
   * Generate summary section
   */
  private generateSummary(original: DocumentInput, compressed: CompressionResult): string {
    return `## Summary

| Metric | Value |
|--------|-------|
| Original Size | ${this.formatSize(compressed.originalSize)} |
| Compressed Size | ${this.formatSize(compressed.compressedSize)} |
| **Compression Ratio** | **${compressed.compressionRatio.toFixed(1)}x** |
| Files Processed | ${original.fileCount} |
| Strategy | ${compressed.metadata.strategy} |
| Processing Time | ${compressed.metadata.processingTimeMs || 0}ms |
`;
  }

  /**
   * Generate quality metrics section
   */
  private generateQualityMetrics(
    validation: ValidationReport,
    coverage: CoverageReport
  ): string {
    const fidelityIcon = validation.fidelity >= 0.98 ? '✅' : validation.fidelity >= 0.90 ? '⚠️' : '❌';
    const coverageIcon = coverage.overall >= 0.95 ? '✅' : coverage.overall >= 0.85 ? '⚠️' : '❌';

    return `## Quality Metrics

| Metric | Score | Status |
|--------|-------|--------|
| **Fidelity** | ${(validation.fidelity * 100).toFixed(1)}% | ${fidelityIcon} |
| **Coverage** | ${(coverage.overall * 100).toFixed(1)}% | ${coverageIcon} |
| Concepts Preserved | ${validation.details.concepts.preserved}/${validation.details.concepts.total} | - |
| Relationships Preserved | ${validation.details.relationships.preserved}/${validation.details.relationships.total} | - |
| Examples Preserved | ${validation.details.examples.preserved}/${validation.details.examples.total} | - |

**Overall Status**: ${validation.passed ? '✅ PASSED' : '❌ FAILED'}

### Targets

- ✅ **Fidelity**: ≥98% (measures concept preservation)
- ✅ **Coverage**: ≥95% (measures information representation)
`;
  }

  /**
   * Generate coverage details
   */
  private generateCoverageDetails(coverage: CoverageReport): string {
    let details = `## Coverage by Section\n\n`;

    details += `| Section | Coverage |\n`;
    details += `|---------|----------|\n`;

    const entries = Object.entries(coverage.perSection)
      .sort((a, b) => a[1] - b[1]); // Sort by coverage (lowest first)

    for (const [section, cov] of entries) {
      const percentage = (cov * 100).toFixed(0);
      const icon = cov >= 0.95 ? '✅' : cov >= 0.85 ? '⚠️' : '❌';
      details += `| ${section} | ${percentage}% ${icon} |\n`;
    }

    if (coverage.missing.length > 0) {
      details += `\n### Missing Content\n\n`;
      details += `The following sections may have incomplete coverage:\n\n`;
      for (const item of coverage.missing) {
        details += `- ${item}\n`;
      }
    }

    return details;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    compressed: CompressionResult,
    validation: ValidationReport,
    coverage: CoverageReport
  ): string {
    const recommendations: string[] = [];

    // Compression ratio recommendations
    if (compressed.compressionRatio < 2) {
      recommendations.push('📉 **Low compression ratio**. Consider:');
      recommendations.push('  - Try a different strategy (e.g., hybrid or dense-notation)');
      recommendations.push('  - Use aggressive compression level');
      recommendations.push('  - Manually enhance the output');
    } else if (compressed.compressionRatio >= 5) {
      recommendations.push('✅ **Excellent compression ratio** (≥5x)');
    }

    // Fidelity recommendations
    if (validation.fidelity < 0.98) {
      recommendations.push('⚠️ **Fidelity below target**. Consider:');
      recommendations.push('  - Use light or medium compression level');
      recommendations.push('  - Enable preserveCodeBlocks and preserveExamples');
      recommendations.push('  - Review missing concepts and relationships');
    } else {
      recommendations.push('✅ **Fidelity meets target** (≥98%)');
    }

    // Coverage recommendations
    if (coverage.overall < 0.95) {
      recommendations.push('⚠️ **Coverage below target**. Consider:');
      recommendations.push('  - ' + coverage.recommendation);
      recommendations.push('  - Review sections with low coverage');
    } else {
      recommendations.push('✅ **Coverage meets target** (≥95%)');
    }

    // Next steps
    recommendations.push('');
    recommendations.push('### Next Steps');
    recommendations.push('1. Review the compressed output');
    recommendations.push('2. Apply manual enhancements if needed');
    recommendations.push('3. Use as LLM knowledge base');
    recommendations.push('4. Version control the compressed file');

    return `## Recommendations\n\n${recommendations.join('\n')}`;
  }

  /**
   * Generate file list
   */
  private generateFileList(original: DocumentInput): string {
    let list = `## Source Files\n\n`;

    for (const file of original.files) {
      const size = Buffer.byteLength(file.content, 'utf-8');
      list += `- \`${file.path}\` (${this.formatSize(size)})\n`;
    }

    return list;
  }

  /**
   * Format byte size
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Generate coverage table for section
   */
  formatCoverageTable(perSection: Record<string, number>): string {
    const rows = Object.entries(perSection).map(([section, coverage]) => {
      const percentage = (coverage * 100).toFixed(0);
      const status = coverage >= 0.95 ? '✅' : coverage >= 0.85 ? '⚠️' : '❌';
      return `| ${section} | ${percentage}% | ${status} |`;
    });

    return `| Section | Coverage | Status |\n|---------|----------|--------|\n${rows.join('\n')}`;
  }
}
