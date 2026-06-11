# doc-compression

A Claude Code plugin that compresses project documentation into token-efficient
YAML knowledge bases — with measured, verified fidelity instead of promises.

## How it works

The work is split by what each side is good at:

- **Claude (via skill)** performs the semantic compression — deciding which
  prose is redundant. This is a language-understanding task; regexes can't do it.
- **A deterministic CLI** does everything that must be exact: token counting
  (real BPE tokenizer, not bytes), lossless cleanup, doc discovery, and
  structural verification of the output.

Compression runs once per documentation set and the result is cached as a
file, so the LLM cost amortizes to zero for static context.

### Guarantees, enforced by the verifier

- Code blocks preserved **verbatim** (byte-identical after whitespace normalization)
- Every heading/topic covered, or explicitly declared omitted with a reason
- Numeric facts (limits, versions, frequencies) checked for retention
- Token ratio **measured**, never estimated — including a warning when
  "compression" made the output larger
- Sections namespaced per source file (duplicate headings across files can't collide)

Verification fails loudly. There is no self-grading: the checks compare the
output against the original sources, not against the compressor's own heuristics.

## Installation

```bash
git clone https://github.com/rt-heroku/doc-compression.git
cd doc-compression
npm install && npm run build
```

Then add it as a Claude Code plugin (e.g. via your plugin marketplace config,
or symlink into your plugins directory). The plugin manifest is at
`.claude-plugin/plugin.json`.

## Usage

### In Claude Code

```
/doc-compression:compress-docs docs/      # build a verified knowledge base
/doc-compression:kb payments              # load just the relevant KB section
/doc-compression:kb                       # list available topics
```

`compress-docs` scans the docs, has Claude compress them following the
`compressing-docs` skill rules, writes `LLM-KNOWLEDGE-BASE.yaml`, and runs the
verifier — iterating until it passes. You get the real numbers.

`kb` loads knowledge base sections selectively. This is where the token
savings actually materialize: loading one 1–2k-token section instead of the
full documentation set.

### CLI (standalone)

```bash
doc-compress scan <dir>                      # list docs with token counts (JSON)
doc-compress clean <file> [--write]          # lossless cleanup (whitespace, badges, HTML comments)
doc-compress tokens <files...>               # token counts
doc-compress verify <kb.yaml> <sources...>   # verify a KB; exit 1 on failure
```

`verify` options: `--heading-coverage 0.9` (threshold), `--allow-code-loss`
(downgrade undeclared code loss to a warning), `--json`.

### Knowledge base format

```yaml
META:
  generated_at: 2026-06-11
  sources:
    - path: docs/api.md
  omissions:                 # anything dropped is declared, never silent
    - source: docs/api.md
      type: code
      item: "```text — sample output log"
      reason: duplicated in README
SOURCES:
  docs_api_md:
    _source: docs/api.md     # provenance on every section
    payments:
      ...compressed content, code blocks verbatim...
INDEX:                       # topic → path, for selective loading
  payments: SOURCES.docs_api_md.payments
```

## What to expect

Realistic token ratios are **2–4x for verbose prose documentation**. Terse
reference docs compress less; docs under ~2,000 tokens aren't worth
compressing at all (the tooling will tell you). Claims of 5–7x with "100%
fidelity" from deterministic text-mangling are not credible — that approach
was tried in v1 of this project and corrupted code, deleted phrases, and lost
entire sections silently. v2 exists because of that post-mortem; see
CHANGELOG.md.

### Why not compress everything sent to the LLM (hooks/filters)?

Deterministic prose compression without a model can't know which words are
safe to drop, and byte-level changes to in-flight context break prompt
caching — you can pay more while "compressing". The lossless `clean` command
is the safe subset. For semantic compression, do it once, offline, for static
context, and load it selectively. That's what this plugin does.

## Development

```bash
npm run build     # tsc → dist/
npm test          # jest — includes regression tests for every v1 data-loss bug
```

Source layout:

```
src/
├── cli.ts        # doc-compress CLI
├── markdown.ts   # parsing; code-block extraction/restoration (verbatim)
├── tokens.ts     # token counting (gpt-tokenizer BPE)
├── cleanup.ts    # lossless transforms only
├── scanner.ts    # doc discovery; never re-ingests its own outputs
└── verify.ts     # structural verification against sources
commands/         # /compress-docs, /kb
skills/           # compressing-docs, loading-knowledge-base
.claude-plugin/   # plugin manifest
```

## License

MIT
