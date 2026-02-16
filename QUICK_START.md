# Quick Start Guide - Documentation Compression Plugin

Get started with the Documentation Compression Plugin in 5 minutes.

---

## 📦 Installation

### Option 1: From GitHub (Recommended)

```bash
# Clone the Cerebro repository
git clone https://github.com/rt-heroku/doc-compression.git

# Navigate to the plugin
cd doc-compression

# Install dependencies
npm install

# Build the plugin
npm run build
```

### Option 2: Direct Install to Claude Code

```bash
# Clone and copy to Claude Code plugins directory
git clone https://github.com/rt-heroku/doc-compression.git
cp -r doc-compression ~/.claude/plugins/

# Install and build
cd ~/.claude/plugins/doc-compression
npm install && npm run build
```

### Option 3: Symlink (For Development)

```bash
# Clone the repo
git clone https://github.com/rt-heroku/doc-compression.git

# Create symlink
ln -s $(pwd)/doc-compression ~/.claude/plugins/doc-compression

# Install and build
cd ~/.claude/plugins/doc-compression
npm install && npm run build
```

---

## ✅ Verify Installation

Restart Claude Code and check that these tools are available:

- `doc_compress_file` ✓
- `doc_compress_folder` ✓
- `doc_scan_compress` ✓

---

## 🚀 Basic Usage

### 1. Compress a Single File

```typescript
// In Claude Code
doc_compress_file({
  filePath: "/path/to/your/README.md",
  level: "medium"
})
```

**Output:** `COMPRESSED-README.yaml` in the same directory

### 2. Compress an Entire Documentation Folder

```typescript
doc_compress_folder({
  folderPath: "/path/to/your/docs",
  combineFiles: true
})
```

**Output:** `LLM-KNOWLEDGE-BASE.yaml` combining all markdown files

### 3. Auto-Scan and Compress Project

```typescript
doc_scan_compress({
  projectPath: "/path/to/your/project",
  autoDetectStrategy: true,
  generateReport: true
})
```

**Output:**
- `LLM-KNOWLEDGE-BASE.yaml` (compressed docs)
- `COMPRESSION-REPORT.md` (quality metrics)

---

## 🎯 Real Example: Compress Your Project

**Step 1:** Navigate to your project in Claude Code

**Step 2:** Run the compression tool:

```typescript
doc_scan_compress({
  projectPath: process.cwd(),
  autoDetectStrategy: true,
  generateReport: true
})
```

**Step 3:** Check the output:

```bash
# View the compressed knowledge base
cat LLM-KNOWLEDGE-BASE.yaml

# View the quality report
cat COMPRESSION-REPORT.md
```

**Expected Results:**
- 5-7x compression ratio
- 95-99% coverage
- 98%+ fidelity
- Processing time: 3-10 seconds

---

## 📊 Understanding the Output

### LLM-KNOWLEDGE-BASE.yaml Structure

```yaml
META:
  compression_ratio: 6.6x
  coverage: 98%
  fidelity: 100%
  source_files: 11
  original_size_kb: 251
  compressed_size_kb: 39

CORE_CONCEPTS:
  # Your key concepts here

ARCHITECTURE:
  # Your architecture here

PATTERNS:
  # Your patterns here

# ... more sections
```

### COMPRESSION-REPORT.md

Shows:
- Compression ratio and file sizes
- Fidelity score (information preservation)
- Coverage score (completeness)
- Per-section coverage breakdown
- Recommendations for improvement

---

## ⚙️ Configuration (Optional)

### Create a Config File

Create `doc-compression.config.yaml` in your project root:

```yaml
compression:
  defaultStrategy: hierarchical-yaml
  level: medium

  input:
    include:
      - "docs/**/*.md"
      - "README.md"
    exclude:
      - "**/node_modules/**"

  output:
    filename: "LLM-KNOWLEDGE-BASE.yaml"
    generateReport: true

  validation:
    minCoverage: 0.95
    minFidelity: 0.98
```

### Use the Config

The plugin automatically loads `doc-compression.config.yaml` from your project root.

---

## 🎓 Next Steps

### Try Different Strategies

```typescript
// For mathematical content
doc_compress_file({
  filePath: "/path/to/math-heavy-doc.md",
  strategy: "dense-notation"
})

// For relationship diagrams
doc_compress_file({
  filePath: "/path/to/architecture.md",
  strategy: "adjacency-lists"
})

// Let the plugin decide
doc_compress_file({
  filePath: "/path/to/mixed-content.md",
  strategy: "hybrid"
})
```

### Available Strategies

| Strategy | Best For | Ratio |
|----------|----------|-------|
| `hierarchical-yaml` | General docs (default) | 6.6x |
| `dense-notation` | Math/formulas | 7x |
| `adjacency-lists` | Relationships/graphs | 6x |
| `table-compression` | Structured data | 5x |
| `tiered-structure` | Multi-level docs | 3-8x |
| `hybrid` | Auto-detect optimal | 7-8x |

### Compression Levels

| Level | Ratio | Best For |
|-------|-------|----------|
| `light` | 3-4x | Testing, first-time use |
| `medium` | 5-6x | Production (default) |
| `aggressive` | 7-8x | Maximum compression |

---

## 📖 Examples

### Example 1: Documentation Website

Compress your docs site:

```typescript
doc_compress_folder({
  folderPath: "./docs",
  combineFiles: true,
  includePattern: "**/*.md",
  strategy: "hierarchical-yaml",
  level: "medium"
})
```

### Example 2: API Documentation

Compress API docs with structure preservation:

```typescript
doc_compress_folder({
  folderPath: "./api-docs",
  strategy: "table-compression",  // Good for structured endpoint docs
  level: "medium"
})
```

### Example 3: Architecture Documentation

Compress architecture docs with relationship mapping:

```typescript
doc_compress_file({
  filePath: "./ARCHITECTURE.md",
  strategy: "adjacency-lists",  // Preserves component relationships
  level: "medium"
})
```

---

## 🔧 Troubleshooting

### Plugin Not Found

```bash
# Verify installation
ls -la ~/.claude/plugins/doc-compression

# Rebuild if needed
cd ~/.claude/plugins/doc-compression
npm install && npm run build

# Restart Claude Code
```

### Low Compression Ratio

Try these strategies in order:
1. Use `strategy: "hybrid"` for auto-optimization
2. Increase to `level: "aggressive"`
3. Check the compression report for recommendations

### Validation Failures

If coverage/fidelity is below target:
1. Reduce to `level: "medium"` or `"light"`
2. Use `strategy: "hierarchical-yaml"` (most reliable)
3. Check excluded files - you might be excluding important docs

---

## 💡 Pro Tips

### Tip 1: Use in CI/CD

Add to your build script:

```json
{
  "scripts": {
    "compress-docs": "node -e \"require('./compress-docs.js')\""
  }
}
```

### Tip 2: Batch Processing

Compress multiple projects:

```typescript
const projects = ["project-a", "project-b", "project-c"];
for (const p of projects) {
  await doc_scan_compress({ projectPath: `../${p}` });
}
```

### Tip 3: Watch Mode

Use in development:

```bash
cd ~/.claude/plugins/doc-compression
npm run dev  # Auto-rebuilds on changes
```

---

## 📚 Learn More

- **Full Documentation:** [README.md](README.md)
- **Example Configs:** [examples/](examples/)
- **GitHub Repository:** https://github.com/rt-heroku/doc-compression
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

## 🤝 Get Help

**Issues?** https://github.com/rt-heroku/doc-compression/issues
**Questions?** Open a discussion on GitHub
**Contributing?** See [README.md#contributing](README.md#contributing)

---

## ✨ Success Story: Cerebro Project

The Cerebro project successfully compressed its documentation:

- **Before:** 11 markdown files, 251 KB
- **After:** 1 YAML file, 39 KB
- **Ratio:** 6.6x compression
- **Quality:** 98-99% coverage, 100% fidelity
- **Benefit:** 11x faster for LLMs to load

**Your project can achieve similar results!**

---

**Ready to compress your docs? Start with:**

```typescript
doc_scan_compress({
  projectPath: process.cwd(),
  autoDetectStrategy: true,
  generateReport: true
})
```

**Happy compressing! 🎉**
