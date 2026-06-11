---
name: loading-knowledge-base
description: Selectively load sections from a compressed LLM-KNOWLEDGE-BASE.yaml when answering project-specific questions, instead of loading entire documentation. Use when a knowledge base file exists and the user asks about project architecture, concepts, or workflows.
---

# Loading a Knowledge Base Selectively

## Overview

A compressed knowledge base only saves tokens if you load it selectively.
Loading all of it for every question throws the savings away.

## Procedure

1. **Decide if you need it at all.** General programming questions don't need
   project context. Questions about *this project's* architecture, concepts,
   workflows, or decisions do.

2. **Check what's already in context.** If the relevant section was loaded
   earlier in this conversation, reference it — don't reload.

3. **Find the KB.** Look for `LLM-KNOWLEDGE-BASE.yaml` in the project root,
   then in `docs/`. If absent, fall back to reading the original docs.

4. **Use the INDEX.** Read the file's `INDEX` and `META` sections first (head
   of the file). The INDEX maps topics to paths like
   `SOURCES.docs_api_md.payments`. Then read only the matching section —
   use Grep with the section key and `-A`/context lines, or Read with offset,
   rather than reading the whole file.

5. **Answer with provenance.** Each section carries a `_source` key naming the
   original file. Cite it, and if the user needs exhaustive detail (the KB is
   compressed — details may have been condensed), offer to read the original
   source file.

## Staleness check

Compare the KB's `META.generated_at` against recent git history of the source
files when accuracy matters. If sources changed after generation, warn the
user and prefer the originals.
