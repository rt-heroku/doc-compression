---
description: Compress project documentation into a verified, token-efficient YAML knowledge base
argument-hint: [path-to-project-or-docs-folder]
---

Compress the documentation at the given path (default: current project root)
into a token-efficient knowledge base.

Use the `compressing-docs` skill from this plugin and follow it exactly:

1. Scan with the CLI (`node <plugin-dir>/dist/cli.js scan`) to list docs and
   token counts. If `dist/` is missing, build the plugin first.
2. Compress each file semantically per the skill's rules (code verbatim,
   facts preserved, per-file namespacing, declared omissions).
3. Write `LLM-KNOWLEDGE-BASE.yaml` and verify with the CLI. Iterate until
   verification passes.
4. Report measured token numbers, the verifier's per-file coverage, and any
   declared omissions.

Path argument: $ARGUMENTS
