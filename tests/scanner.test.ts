import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { scanDocs } from '../src/scanner';

describe('scanDocs', () => {
  it('finds markdown and excludes generated outputs (v1 self-ingestion regression)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'doc-compression-scan-'));
    writeFileSync(join(dir, 'README.md'), '# Hello\nWorld');
    mkdirSync(join(dir, 'docs'));
    writeFileSync(join(dir, 'docs', 'api.md'), '# API\nDetails');
    // Outputs from a previous run — must never be re-ingested.
    writeFileSync(join(dir, 'LLM-KNOWLEDGE-BASE.yaml'), 'SOURCES: {}');
    writeFileSync(join(dir, 'COMPRESSION-REPORT.md'), '# Report');
    writeFileSync(join(dir, 'COMPRESSION-ANALYSIS.md'), '# Analysis');
    mkdirSync(join(dir, 'node_modules', 'pkg'), { recursive: true });
    writeFileSync(join(dir, 'node_modules', 'pkg', 'README.md'), '# dep');

    const result = await scanDocs(dir);
    const paths = result.docs.map(d => d.path).sort();
    expect(paths).toEqual(['README.md', 'docs/api.md']);
    expect(result.totalTokens).toBeGreaterThan(0);
  });

  it('rejects a non-directory', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'doc-compression-scan-'));
    const file = join(dir, 'x.md');
    writeFileSync(file, 'hi');
    await expect(scanDocs(file)).rejects.toThrow('Not a directory');
  });
});
