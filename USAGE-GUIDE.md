# Usage Guide: Documentation Compression Plugin

## Quick Start

### 1. Install and Build

```bash
cd /Users/rtorres/projects/cerebro/plugins/doc-compression
npm install
npm run build
```

### 2. Compress a Single File

```javascript
// In Claude Code
doc_compress_file({
  filePath: "/path/to/documentation.md",
  level: "medium"
})
```

**Output**: `COMPRESSED-documentation-2026-02-15.yaml`

### 3. Compress a Folder

```javascript
doc_compress_folder({
  folderPath: "/path/to/docs",
  combineFiles: true,
  includePattern: "**/*.md"
})
```

**Output**: `LLM-KNOWLEDGE-BASE-{foldername}-2026-02-15.yaml`

## Compression Workflow

### Automated Workflow (Current)

```
Input: documentation.md (100 KB)
  ↓
[Phase 1 Plugin]
  • Parse markdown into sections
  • Apply semantic clustering
  • Generate YAML structure
  • Apply abbreviations
  • Remove redundancy
  ↓
Output: COMPRESSED-documentation.yaml (80-100 KB)
Compression: ~1-1.5x
```

### Enhanced Workflow (Recommended for 6.6x)

```
Input: documentation.md (100 KB)
  ↓
[Phase 1 Plugin]
  • Automated YAML generation
  ↓
Intermediate: COMPRESSED-documentation.yaml (90 KB)
  ↓
[Manual Enhancement]
  • Extract formulas
  • Create symbolic notation
  • Build relationship graphs
  • Add domain abbreviations
  ↓
Output: LLM-KNOWLEDGE-BASE.yaml (15 KB)
Compression: ~6.6x ✅
```

## Manual Enhancement Techniques

### 1. Formula Extraction

**Before** (verbose):
```yaml
INTELLIGENCE:
  description: |-
    Intelligence is composed of 70% instructions through system
    prompts and context files, 25% tools and their quality, and
    5% the underlying model capability.
```

**After** (compressed):
```yaml
INTELLIGENCE_FORMULA:
  equation: I = Instructions(70%) × Tools(25%) × Model(5%)
  components:
    instructions: [system_prompts, context_files, skills]
    tools: [exec, read, write, web_search]
    model: reasoning_capability
```

**Compression**: ~3x

### 2. Symbolic Notation

**Before**:
```yaml
MODES:
  minimal:
    trigger: when context usage is between 70% and 95%
```

**After**:
```yaml
MODES:
  minimal:
    trigger: context_usage ∈ [70%, 95%]
```

**Symbols to use**:
- `∈` = "in range"
- `→` = "leads to" / "transforms to"
- `↔` = "bidirectional"
- `×` = "multiplied by"
- `÷` = "divided by"
- `∧` = "and"
- `∨` = "or"
- `¬` = "not"

### 3. Inline Objects

**Before**:
```yaml
SKILLS:
  load_type: on_demand
  format: markdown
  trigger: keyword_matching
```

**After**:
```yaml
SKILLS: {load: on_demand, format: markdown, trigger: keyword_matching}
```

**Compression**: ~2x

### 4. Flow Notation

**Before**:
```yaml
FLOW:
  - Client sends message to gateway
  - Gateway routes to router
  - Router sends to queue manager
  - Queue manager dispatches to agent runner
  - Agent runner processes and returns response
```

**After**:
```yaml
FLOW: client → gateway → router → queue_mgr → agent_runner → response
```

**Compression**: ~4x

### 5. Relationship Graphs

**Before**:
```yaml
RELATIONSHIPS:
  - Skills enable infinite extensibility
  - Skills require markdown format
  - Subagents enable parallel work
  - Subagents require isolated sessions
```

**After**:
```yaml
RELATIONSHIPS:
  skills: {enables: infinite_extensibility, requires: markdown_format}
  subagents: {enables: parallel_work, requires: isolated_sessions}
```

**Compression**: ~2x

## Compression Levels

### Light
```javascript
doc_compress_file({
  filePath: "/path/to/file.md",
  level: "light"
})
```
- Preserves all examples and code blocks
- Minimal abbreviations
- Basic YAML structure
- **Target**: 1-1.5x

### Medium (Default)
```javascript
doc_compress_file({
  filePath: "/path/to/file.md",
  level: "medium"
})
```
- Preserves essential examples
- Common abbreviations
- Semantic clustering
- **Target**: 1-2x

### Aggressive
```javascript
doc_compress_file({
  filePath: "/path/to/file.md",
  level: "aggressive"
})
```
- Removes redundancy aggressively
- Extensive abbreviations
- Compact YAML structures
- **Target**: 1.5-2.5x

## Configuration

Create `doc-compression.config.yaml`:

```yaml
compression:
  defaultStrategy: hierarchical-yaml
  level: medium

  input:
    include:
      - "docs/**/*.md"
      - "README.md"
      - "*.md"
    exclude:
      - "**/node_modules/**"
      - "**/dist/**"

  output:
    format: yaml
    includeMetadata: true
    generateReport: true

  validation:
    minCoverage: 0.95
    minFidelity: 0.98
```

## Examples

### Example 1: Single README

```javascript
const result = await doc_compress_file({
  filePath: "/Users/rtorres/projects/cerebro/README.md",
  strategy: "hierarchical-yaml",
  level: "medium"
});

console.log(`Compressed ${result.originalSize} → ${result.compressedSize}`);
console.log(`Ratio: ${result.compressionRatio.toFixed(1)}x`);
```

### Example 2: Full Documentation Folder

```javascript
const result = await doc_compress_folder({
  folderPath: "/Users/rtorres/projects/cerebro/docs",
  combineFiles: true,
  includePattern: "**/*.md",
  level: "aggressive"
});

// Output: LLM-KNOWLEDGE-BASE-docs-2026-02-15.yaml
```

### Example 3: Multi-File with Exclusions

```javascript
const result = await doc_compress_folder({
  folderPath: "/Users/rtorres/projects/cerebro",
  combineFiles: true,
  includePattern: "**/*.md",
  excludePattern: "**/node_modules/**,**/dist/**,**/.git/**",
  level: "medium"
});
```

## Best Practices

### 1. Start with Medium Level
- Assess output quality
- Adjust level based on results
- Balance compression vs. readability

### 2. Combine Related Documents
- Use `combineFiles: true` for related docs
- Enable semantic clustering
- Deduplicate concepts across files

### 3. Manual Enhancement
- Review automated output
- Add formulas for complex concepts
- Use symbolic notation
- Create relationship graphs

### 4. Iterate and Refine
- Compress → Review → Enhance → Repeat
- Build domain-specific abbreviations
- Create templates for common patterns

### 5. Version Control
- Track compressed versions
- Document enhancement decisions
- Maintain changelog

## Troubleshooting

### Low Compression Ratio

**Issue**: Output is similar size or larger than input

**Solutions**:
1. Increase compression level to `aggressive`
2. Enable `combineFiles` for multiple documents
3. Manually enhance output with formulas and symbolic notation
4. Remove verbose sections before compression

### Missing Information

**Issue**: Important content omitted

**Solutions**:
1. Reduce compression level to `light`
2. Enable `preserveCodeBlocks` and `preserveExamples`
3. Review validation report
4. Manually add back critical information

### Invalid YAML Output

**Issue**: Generated YAML has syntax errors

**Solutions**:
1. Validate output with YAML parser
2. Check for special characters
3. Review section titles (avoid colons, brackets)
4. Report issue if persistent

## Next Steps

1. **Run compression** on your documentation
2. **Review output** and compression ratio
3. **Manually enhance** for higher compression
4. **Share results** and feedback
5. **Wait for Phase 2-4** for improved automation

---

**Questions? Issues?**
- Read: `PHASE-1-SUMMARY.md` for technical details
- Check: `CHANGELOG.md` for updates
- Report: Issues on GitHub
