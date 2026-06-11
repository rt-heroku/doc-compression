import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { verifyKnowledgeBase } from '../src/verify';

function tmpFiles(files: Record<string, string>): Record<string, string> {
  const dir = mkdtempSync(join(tmpdir(), 'doc-compression-test-'));
  const paths: Record<string, string> = {};
  for (const [name, content] of Object.entries(files)) {
    const p = join(dir, name);
    writeFileSync(p, content, 'utf-8');
    paths[name] = p;
  }
  return paths;
}

const SOURCE_A = `# Overview

Service C handles billing. Critical: charges run nightly at 2am.

## Refund Policy

Refunds are processed 5 times per day, max 30 days after charge.

\`\`\`javascript
function processOrder(order) {
  return client.charge(order.amount);
}
\`\`\`
`;

describe('verifyKnowledgeBase', () => {
  it('passes a faithful knowledge base', async () => {
    const kb = `META:
  sources:
    - path: a.md
SOURCES:
  a_md:
    _source: a.md
    overview: "Service C handles billing. Charges run nightly at 2am."
    refund_policy:
      frequency: 5 times per day
      window: max 30 days after charge
      code: |-
        \`\`\`javascript
        function processOrder(order) {
          return client.charge(order.amount);
        }
        \`\`\`
`;
    const paths = tmpFiles({ 'a.md': SOURCE_A, 'kb.yaml': kb });
    const report = await verifyKnowledgeBase(paths['kb.yaml'], [paths['a.md']]);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.sources[0].headings.covered).toBe(2);
    expect(report.sources[0].code.preserved).toBe(1);
  });

  it('fails when a topic silently disappears (v1 duplicate-heading data-loss regression)', async () => {
    const kb = `SOURCES:
  a_md:
    _source: a.md
    overview: "Service C handles billing."
`;
    const paths = tmpFiles({ 'a.md': SOURCE_A, 'kb.yaml': kb });
    const report = await verifyKnowledgeBase(paths['kb.yaml'], [paths['a.md']]);
    expect(report.passed).toBe(false);
    expect(report.failures.join(' ')).toContain('Refund Policy');
  });

  it('fails when code blocks are rewritten instead of preserved', async () => {
    const kb = `SOURCES:
  a_md:
    _source: a.md
    overview: Service C handles billing, charges nightly at 2am
    refund_policy: 5 times per day, max 30 days
    code: "fn processOrder(order) { return client.charge(order.amount); }"
`;
    const paths = tmpFiles({ 'a.md': SOURCE_A, 'kb.yaml': kb });
    const report = await verifyKnowledgeBase(paths['kb.yaml'], [paths['a.md']]);
    expect(report.passed).toBe(false);
    expect(report.failures.join(' ')).toContain('code block');
  });

  it('accepts declared omissions instead of failing', async () => {
    const kb = `META:
  omissions:
    - source: a.md
      type: code
      item: "\`\`\`javascript function processOrder"
      reason: example duplicated elsewhere
SOURCES:
  a_md:
    _source: a.md
    overview: Service C handles billing, charges nightly at 2am
    refund_policy: 5 times per day, max 30 days after charge
`;
    const paths = tmpFiles({ 'a.md': SOURCE_A, 'kb.yaml': kb });
    const report = await verifyKnowledgeBase(paths['kb.yaml'], [paths['a.md']]);
    expect(report.passed).toBe(true);
    expect(report.sources[0].code.omitted).toBe(1);
  });

  it('warns when numeric facts vanish', async () => {
    const kb = `SOURCES:
  a_md:
    _source: a.md
    overview: Service C handles billing nightly
    refund_policy:
      info: refunds processed regularly
      code: |-
        \`\`\`javascript
        function processOrder(order) {
          return client.charge(order.amount);
        }
        \`\`\`
`;
    const paths = tmpFiles({ 'a.md': SOURCE_A, 'kb.yaml': kb });
    const report = await verifyKnowledgeBase(paths['kb.yaml'], [paths['a.md']]);
    expect(report.warnings.join(' ')).toContain('numeric facts');
  });

  it('warns when the "compressed" output is larger than the source', async () => {
    const small = '# Tiny\nOne line.\n';
    const kb = `SOURCES:\n  s_md:\n    _source: small.md\n    tiny: "${'One line. '.repeat(50)}"\n`;
    const paths = tmpFiles({ 'small.md': small, 'kb.yaml': kb });
    const report = await verifyKnowledgeBase(paths['kb.yaml'], [paths['small.md']]);
    expect(report.warnings.join(' ')).toContain('LARGER');
  });

  it('fails on invalid YAML', async () => {
    const paths = tmpFiles({ 'a.md': SOURCE_A, 'kb.yaml': 'key: [unclosed' });
    const report = await verifyKnowledgeBase(paths['kb.yaml'], [paths['a.md']]);
    expect(report.passed).toBe(false);
    expect(report.failures[0]).toContain('not valid YAML');
  });
});
