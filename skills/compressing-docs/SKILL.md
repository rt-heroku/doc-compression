---
name: compressing-docs
description: Compress markdown documentation into a token-efficient YAML knowledge base with verified fidelity. Use when asked to compress docs, build an LLM knowledge base, or reduce documentation token footprint.
---

# Compressing Documentation

## Overview

You perform the semantic compression — deciding what is redundant — because
that is a language-understanding task. The `doc-compress` CLI performs
everything that must be deterministic: token counting, lossless cleanup, and
verification. Never skip verification: it is what makes the output trustworthy.

The CLI lives in this plugin. Build it once if `dist/` is missing
(`npm install && npm run build` in the plugin directory), then run it as
`node <plugin-dir>/dist/cli.js <command>`.

## Hard rules

1. **Code blocks are preserved verbatim.** Never rewrite, abbreviate, or
   reformat code. If a code block is genuinely worthless (e.g. duplicated
   output logs), omit it and declare it in `META.omissions`.
2. **Numbers, names, paths, versions, and constraints survive.** "Refunds are
   processed 5 times per day" must keep the 5. Compression removes redundancy,
   not facts.
3. **Namespace by source file.** Every source document gets its own top-level
   key under `SOURCES`. Two files with an `## Installation` heading must never
   collide.
4. **Omissions are declared, never silent.** Anything intentionally dropped
   goes in `META.omissions` with a reason.
5. **Never compress prose by symbol substitution** (and → ∧, times → ×).
   It corrupts meaning and usually costs MORE tokens.

## Procedure

### Step 1: Scan

```bash
node <plugin-dir>/dist/cli.js scan <project-dir>
```

Returns JSON: each doc with its path and token count. Confirm the file list
with the user if it looks surprising (e.g. hundreds of files).

### Step 2: Read and compress each file

Read each source file. Produce a compressed YAML entry per file:

- Keep every heading as a key (normalized: lowercase, underscores). The
  verifier checks heading coverage — a missing heading is a missing topic.
- Rewrite prose tersely: drop marketing language, repeated explanations,
  transitional filler. Keep every fact, constraint, warning, and edge case.
- Convert enumerable prose to YAML lists/maps where natural.
- Code blocks: copy byte-for-byte into YAML block scalars (`|-`).
- Tables: keep as compact YAML maps or keep the markdown table if already terse.

### Step 3: Assemble the knowledge base

```yaml
META:
  generated_at: <ISO date>
  generator: doc-compression v2
  sources:
    - path: docs/api.md
    - path: README.md
  omissions:                      # only if something was dropped
    - source: README.md
      type: code
      item: "```text — sample output log"
      reason: duplicated verbatim in docs/api.md
SOURCES:
  readme_md:
    _source: README.md
    <heading keys with compressed content>
  docs_api_md:
    _source: docs/api.md
    ...
INDEX:                            # one line per topic, for selective loading
  payments: SOURCES.docs_api_md.payments
  installation: SOURCES.readme_md.installation
```

Write it to `<project>/LLM-KNOWLEDGE-BASE.yaml` (or the path the user chose).

### Step 4: Verify — mandatory

```bash
node <plugin-dir>/dist/cli.js verify <kb.yaml> <source files...>
```

- **If it fails:** read the failure list (missing headings, lost code blocks),
  fix the KB, and re-verify. Do not lower thresholds to make it pass; do not
  use `--allow-code-loss` unless the user explicitly accepts code loss.
- **If it passes:** report the real numbers to the user — token counts before
  and after, the measured ratio, and any warnings (e.g. missing numeric facts).

### Step 5: Report honestly

Report the *measured* token ratio from the verifier, never an estimate.
If compression came out low (< 2x), say so — terse, well-structured source
docs don't compress much, and that's fine. If the output is larger than the
input, the source was already compact: recommend keeping the original.

## When compression is NOT worth it

- Source is already terse reference material (mostly tables/code)
- Source changes frequently (the KB will rot; suggest regeneration hooks)
- Total docs under ~2,000 tokens (just load them directly)

Tell the user instead of producing a useless artifact.
