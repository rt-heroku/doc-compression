import {
  extractCodeBlocks,
  restoreCodeBlocks,
  parseSections,
  listHeadings,
  listCodeBlocks,
  normalizeForMatch
} from '../src/markdown';

describe('extractCodeBlocks / restoreCodeBlocks', () => {
  it('round-trips code blocks byte-identically', () => {
    const md = 'Intro\n\n```javascript\nfunction processOrder(order) {\n  return client.charge(order.amount);\n}\n```\n\nOutro';
    const { text, blocks } = extractCodeBlocks(md);
    expect(text).not.toContain('function processOrder');
    expect(blocks.size).toBe(1);
    expect(restoreCodeBlocks(text, blocks)).toBe(md);
  });

  it('handles multiple blocks and tilde fences', () => {
    const md = '```a\none\n```\nmiddle\n~~~\ntwo\n~~~';
    const { blocks } = extractCodeBlocks(md);
    expect(blocks.size).toBe(2);
  });

  it('keeps an unterminated fence instead of dropping it', () => {
    const md = 'text\n```js\nconst x = 1;';
    const { blocks } = extractCodeBlocks(md);
    expect([...blocks.values()][0]).toContain('const x = 1;');
  });
});

describe('parseSections', () => {
  it('preserves content before the first heading (preamble bug regression)', () => {
    const md = 'This preamble was silently dropped by v1.\n\n# Title\nBody';
    const sections = parseSections(md);
    expect(sections[0].level).toBe(0);
    expect(sections[0].content).toContain('preamble was silently dropped');
  });

  it('ignores headings inside code blocks', () => {
    const md = '# Real\n```bash\n# not a heading\necho hi\n```';
    const headings = listHeadings(md);
    expect(headings).toEqual([{ title: 'Real', level: 1 }]);
  });
});

describe('listCodeBlocks', () => {
  it('returns normalized blocks for comparison', () => {
    const md = '```js\nconst a = 1;   \n```';
    const blocks = listCodeBlocks(md);
    expect(blocks[0]).toBe('```js\nconst a = 1;\n```');
  });
});

describe('normalizeForMatch', () => {
  it('matches headings across naming styles (v1 fidelity-checker bug regression)', () => {
    expect(normalizeForMatch('Core Concepts')).toBe(normalizeForMatch('core_concepts'));
    expect(normalizeForMatch('Core Concepts')).toBe(normalizeForMatch('core-concepts'));
  });
});
