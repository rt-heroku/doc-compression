import { cleanupMarkdown } from '../src/cleanup';
import { countTokens } from '../src/tokens';

describe('cleanupMarkdown', () => {
  it('never modifies code blocks (v1 code-corruption regression)', () => {
    const code = '```javascript\nfunction processOrder(order) {\n  return client.charge(order.amount); // number of retries\n}\n```';
    const md = `# Doc\n\n\n\nSome   text   \n\n${code}\n`;
    const { cleaned } = cleanupMarkdown(md);
    expect(cleaned).toContain(code);
  });

  it('never rewrites prose words (no abbreviations, no symbol substitution)', () => {
    const md = '# T\nUse the API in order to process payments and refunds, 5 times per day.\n';
    const { cleaned } = cleanupMarkdown(md);
    expect(cleaned).toContain('in order to process payments and refunds, 5 times per day');
  });

  it('collapses blank lines and strips trailing whitespace', () => {
    const md = 'a   \n\n\n\n\nb\n';
    const { cleaned, applied } = cleanupMarkdown(md);
    expect(cleaned).toBe('a\n\nb\n');
    expect(applied).toContain('blank-lines');
    expect(applied).toContain('trailing-whitespace');
  });

  it('strips badge lines and HTML comments', () => {
    const md = '# T\n[![Version](https://img.shields.io/badge/v-1-blue.svg)](https://x)\n<!-- internal note -->\nReal content\n';
    const { cleaned } = cleanupMarkdown(md);
    expect(cleaned).not.toContain('shields.io');
    expect(cleaned).not.toContain('internal note');
    expect(cleaned).toContain('Real content');
  });

  it('never increases token count', () => {
    const md = '# Payment Service\n\nUse the API in order to process payments.\n\n```js\nconst x = 1;\n```\n';
    const result = cleanupMarkdown(md);
    expect(result.after.tokens).toBeLessThanOrEqual(result.before.tokens);
    expect(countTokens(result.cleaned)).toBe(result.after.tokens);
  });
});
