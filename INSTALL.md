# Installation Guide - Documentation Compression Plugin

## Quick Install

### From GitHub (Recommended)

```bash
# Clone the Cerebro repository
git clone https://github.com/rt-heroku/doc-compression.git
cd doc-compression

# Install dependencies
npm install

# Build the plugin
npm run build
```

### Verify Installation

The plugin should now be available in Claude Code with these tools:
- ✅ `doc_compress_file` - Compress single files
- ✅ `doc_compress_folder` - Compress entire folders
- ✅ `doc_scan_compress` - Auto-scan and compress projects

## Alternative Installation Methods

### Method 1: Copy to Claude Code Plugins Directory

```bash
# Clone and copy
git clone https://github.com/rt-heroku/doc-compression.git
cp -r doc-compression ~/.claude/plugins/

# Install and build
cd ~/.claude/plugins/doc-compression
npm install && npm run build
```

### Method 2: Symlink (For Development)

```bash
# Clone the repo
git clone https://github.com/rt-heroku/doc-compression.git
cd doc-compression

# Create symlink
ln -s $(pwd) ~/.claude/plugins/doc-compression

# Install and build
npm install && npm run build
```

### Method 3: npm (If Published)

```bash
npm install @cerebro/doc-compression
```

## Requirements

- **Node.js:** ≥ 18.0.0
- **Claude Code:** Latest version
- **OS:** macOS, Linux, Windows (WSL)

## Post-Installation

### 1. Restart Claude Code

After installation, restart Claude Code to load the plugin.

### 2. Test the Installation

```typescript
// In Claude Code, try compressing a file
doc_compress_file({
  filePath: "/path/to/README.md",
  level: "medium"
})
```

### 3. View Available Tools

The following tools should be available:
- `doc_compress_file`
- `doc_compress_folder`
- `doc_scan_compress`

## Troubleshooting

### Plugin Not Loading

```bash
# Check installation
ls -la ~/.claude/plugins/doc-compression

# Verify dependencies
cd ~/.claude/plugins/doc-compression
npm install

# Rebuild
npm run build

# Check for errors
npm run build 2>&1 | grep -i error
```

### TypeScript Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Permission Issues

```bash
# Fix permissions
chmod -R 755 ~/.claude/plugins/doc-compression
```

## Development Setup

For plugin development:

```bash
# Clone the repo
git clone https://github.com/rt-heroku/doc-compression.git
cd doc-compression

# Install dependencies
npm install

# Run in watch mode
npm run dev

# Run tests
npm test
```

## Getting Help

- **Documentation:** [README.md](README.md)
- **Quick Start:** [QUICK_START.md](QUICK_START.md)
- **Examples:** [examples/](examples/)
- **Issues:** https://github.com/rt-heroku/doc-compression/issues

## Next Steps

After installation:
1. Read [QUICK_START.md](QUICK_START.md) for basic usage
2. Review [examples/](examples/) for configuration options
3. Try compressing your project documentation
4. Check [README.md](README.md) for advanced features

---

**Repository:** https://github.com/rt-heroku/doc-compression
**Version:** 1.0.0
**Status:** Production Ready ✅
