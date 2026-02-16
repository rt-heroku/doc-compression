# Setup Guide - Documentation Compression Plugin

**Get started in 5 minutes**

---

## Prerequisites

- Node.js ≥ 18.0.0
- npm or yarn
- Claude Code CLI (or compatible plugin system)

---

## Quick Setup

### 1. Navigate to Plugin Directory

```bash
cd /Users/rtorres/projects/cerebro/plugins/doc-compression
```

### 2. Install Dependencies

```bash
npm install
```

**Expected output:**
```
added 330 packages, and audited 331 packages in 8s
```

### 3. Build the Plugin

```bash
npm run build
```

**Expected output:**
```
> @cerebro/doc-compression@1.0.0 build
> tsc

✔ Build successful
```

### 4. Verify Installation

Check that the `dist/` folder exists with compiled JavaScript:

```bash
ls dist/
```

**Expected output:**
```
index.js
index.d.ts
strategies/
tools/
validators/
...
```

---

## Configuration (Optional)

### Create Project Config

Create a config file in your project root:

```bash
# In your project directory
touch doc-compression.config.yaml
```

**Basic configuration:**

```yaml
compression:
  defaultStrategy: hierarchical-yaml
  level: medium

  input:
    include:
      - "**/*.md"
      - "README.md"
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

**Or copy an example:**

```bash
cp examples/basic-compression.yaml /path/to/your/project/doc-compression.config.yaml
```

---

## Verify Plugin Works

### Test Compression

```bash
cd /Users/rtorres/projects/cerebro/plugins/doc-compression
node test-plugin.js
```

**Expected output:**
```
🧪 Testing Documentation Compression Plugin

Testing file: /Users/rtorres/projects/cerebro/README.md

✅ Compression complete!
   Original:   15.5 KB
   Compressed: 15.0 KB
   Ratio:      1.0x
   Output:     /Users/rtorres/projects/cerebro/COMPRESSED-README-...yaml

✅ Test passed! Plugin is working correctly.
```

---

## Plugin Integration

### For Claude Code

The plugin should auto-load if placed in the plugins directory. Verify with:

```bash
# Check plugin.json exists
cat plugin.json
```

**Expected:**
```json
{
  "name": "doc-compression",
  "version": "1.0.0",
  "description": "Documentation compression achieving 5-7x reduction...",
  ...
}
```

### Manual Registration

If the plugin doesn't auto-load, you can manually register it in your Claude Code configuration.

---

## Available Commands

Once set up, you have access to these tools and skills:

### 1. Compress Single File
```javascript
doc_compress_file({
  filePath: "/path/to/file.md",
  strategy: "hybrid",
  level: "medium"
})
```

### 2. Compress Folder
```javascript
doc_compress_folder({
  folderPath: "/path/to/docs",
  combineFiles: true,
  includePattern: "**/*.md"
})
```

### 3. Auto-Scan and Compress
```javascript
doc_scan_compress({
  projectPath: "/path/to/project",
  autoDetectStrategy: true,
  generateReport: true
})
```

### 4. Smart KB Loader (Auto-Triggers)

Once you have a compressed knowledge base, the skill automatically loads it:

```javascript
// Just ask questions naturally:
"How does the architecture work?"
// ✅ Auto-loads ARCHITECTURE section (8KB, not full 39KB)

// Or use manual commands:
"/kb"              // Load overview
"/kb-full"         // Load everything
"/kb-architecture" // Load specific section
"/kb-status"       // Check what's loaded
```

**The skill provides:**
- ✅ Auto-loading on relevant questions (no manual steps)
- ✅ Selective section loading (80% token savings)
- ✅ Context awareness (no redundant loads)
- ✅ Manual override when needed

---

## Directory Structure

After setup, your plugin directory should look like:

```
doc-compression/
├── ✅ package.json
├── ✅ plugin.json
├── ✅ tsconfig.json
├── ✅ node_modules/
├── ✅ dist/ (compiled)
│   ├── index.js
│   ├── strategies/
│   ├── tools/
│   └── validators/
├── src/ (source code)
├── examples/ (config examples)
└── *.md (documentation)
```

---

## Troubleshooting

### Build Fails

**Error:** `Cannot find module 'typescript'`

**Solution:**
```bash
npm install --save-dev typescript
npm run build
```

---

### Plugin Not Loading

**Error:** Plugin not recognized

**Solution:**
1. Check `plugin.json` exists and is valid
2. Verify `dist/index.js` exists
3. Restart Claude Code
4. Check plugin directory permissions

---

### Import Errors

**Error:** `Cannot find module './strategies/...'`

**Solution:**
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

---

### Dependencies Missing

**Error:** `Cannot find module 'yaml'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules/
npm install
```

---

## Verify Everything Works

Run this checklist:

```bash
# 1. Check Node version
node --version  # Should be ≥18.0.0

# 2. Check npm packages
npm list --depth=0

# 3. Check build output
ls -la dist/

# 4. Test compression
node test-plugin.js

# 5. Verify all strategies compile
ls -la dist/strategies/
```

**Expected files in `dist/strategies/`:**
- ✅ hierarchical-yaml.js
- ✅ dense-notation.js
- ✅ adjacency-lists.js
- ✅ table-compression.js
- ✅ tiered-structure.js
- ✅ hybrid.js

---

## Environment Variables (Optional)

```bash
# Set default compression level
export DOC_COMPRESSION_LEVEL=aggressive

# Set default strategy
export DOC_COMPRESSION_STRATEGY=hybrid

# Enable debug logging
export DOC_COMPRESSION_DEBUG=true
```

---

## Setup the Smart Loader Skill (Recommended)

### Step 1: Install the Skill

The skill is already in the plugin directory. Choose an installation method:

**Option A: Symlink (Recommended)**
```bash
ln -s /Users/rtorres/projects/cerebro/plugins/doc-compression/skills/load-knowledge-base.md \
      ~/.claude/skills/load-knowledge-base.md
```

**Option B: Copy to Global Skills**
```bash
cp skills/load-knowledge-base.md ~/.claude/skills/
```

**Option C: Project-Specific**
```bash
mkdir -p .claude/skills
cp skills/load-knowledge-base.md .claude/skills/
```

### Step 2: Update KB Path in Skill

Edit the skill file and update the KB file path:

```bash
# Edit: ~/.claude/skills/load-knowledge-base.md
# Find line ~350 and update:
/Users/rtorres/projects/cerebro/LLM-KNOWLEDGE-BASE.yaml
```

### Step 3: Test the Skill

```bash
# In Claude Code:

# Test 1: Manual load
/kb

# Test 2: Auto-trigger
"How does the architecture work?"

# Test 3: Check status
/kb-status
```

**Expected:** Skill loads KB automatically when you ask project questions!

---

## Next Steps

✅ **Setup Complete!** Now you can:

1. **Compress your docs**: Use `doc_scan_compress` or `doc_compress_folder`
2. **Ask questions naturally**: Skill auto-loads KB when needed
3. **Save 80% tokens**: Selective loading vs full KB
4. **Read the guides**:
   - `USAGE-GUIDE.md` - Compression strategies
   - `skills/README.md` - Smart loader details
   - `USER-GUIDE.md` - Complete reference
5. **Try different strategies**: See examples in `examples/`
6. **Configure for your project**: Create `doc-compression.config.yaml`

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run build` | Compile TypeScript |
| `npm run watch` | Watch mode for development |
| `node test-plugin.js` | Test the plugin |

| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `USAGE-GUIDE.md` | Detailed usage examples |
| `SETUP-GUIDE.md` | This file |
| `examples/*.yaml` | Configuration examples |

---

## Support

- **Documentation**: Check all `*.md` files
- **Examples**: See `examples/` folder
- **Issues**: Check `TROUBLESHOOTING` section above

---

**Setup time: ~5 minutes**
**Status: Ready to use!**

🚀 Happy compressing!
