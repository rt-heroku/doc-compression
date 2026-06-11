---
description: Load relevant sections of the project knowledge base into context
argument-hint: [topic, section name, or "full"]
---

Load project knowledge from the compressed knowledge base
(`LLM-KNOWLEDGE-BASE.yaml`), using the `loading-knowledge-base` skill from
this plugin.

- No argument: read META + INDEX and list available topics with sizes.
- A topic/section argument: load only that section and summarize what's now
  available.
- `full`: load the entire knowledge base (confirm first if it exceeds ~10k
  tokens).

If no knowledge base exists, say so and offer to create one with
/doc-compression:compress-docs.

Requested topic: $ARGUMENTS
