# Knowledge Base Loader Skill

**Intelligently load your compressed documentation into Claude's context**

---

## What This Skill Does

Instead of manually loading your compressed knowledge base every time, this skill:

✅ **Auto-triggers** on relevant questions (architecture, concepts, workflows)
✅ **Loads selectively** (5-8KB sections vs 39KB full file)
✅ **Saves tokens** (80% reduction vs full load)
✅ **Context-aware** (doesn't reload unnecessarily)
✅ **Manual override** (slash commands when you need control)

---

## Installation

### Option 1: Plugin System (Automatic)

If using the doc-compression plugin, the skill is auto-discovered:

```bash
# Skill is already in: plugins/doc-compression/skills/
# Claude Code auto-loads it
```

### Option 2: Global Skills Directory

Copy to your global skills directory:

```bash
# Copy to Claude Code skills directory
cp load-knowledge-base.md ~/.claude/skills/

# Or create symlink
ln -s /Users/rtorres/projects/cerebro/plugins/doc-compression/skills/load-knowledge-base.md \
      ~/.claude/skills/load-knowledge-base.md
```

### Option 3: Project-Specific

Place in project's `.claude/skills/` directory:

```bash
mkdir -p .claude/skills
cp /path/to/load-knowledge-base.md .claude/skills/
```

---

## Quick Start

### 1. Create Your Knowledge Base

First, compress your documentation:

```javascript
doc_scan_compress({
  projectPath: "/path/to/project",
  autoDetectStrategy: true,
  generateReport: true
})

// Output: LLM-KNOWLEDGE-BASE-project.yaml
```

### 2. Update File Path in Skill

Edit `load-knowledge-base.md` and update the file path:

```yaml
# Find this section in the skill:
Common locations to check:
  - ./LLM-KNOWLEDGE-BASE.yaml
  - ../LLM-KNOWLEDGE-BASE.yaml
  - /Users/rtorres/projects/cerebro/LLM-KNOWLEDGE-BASE.yaml  # ← Update this
```

### 3. Test It Works

```bash
# In Claude Code, try these:

# Manual load (should work immediately)
"/kb"

# Auto-trigger (ask a project question)
"How does the architecture work?"

# Check status
"/kb-status"
```

---

## Usage Examples

### Automatic Triggering

The skill auto-loads when you ask relevant questions:

```
You: "How does the routing system work?"

Claude:
✅ Loaded ARCHITECTURE from knowledge base (~8KB)

The routing system works as follows:
[detailed answer based on your docs]

Source: Project Knowledge Base > ARCHITECTURE
```

### Manual Commands

```bash
# Load overview (concepts + architecture)
/kb

# Load full knowledge base
/kb-full

# Load specific section
/kb-architecture
/kb-concepts
/kb-workflows
/kb-tools
/kb-patterns

# Smart search (auto-select section)
/kb-search "how do plugins work"

# Check what's loaded
/kb-status
```

---

## How It Saves Tokens

### Without This Skill (Manual Full Load)

```
Every question:
  - Read entire 39KB file
  - ~10,000 tokens per load
  - 100 questions = 1M tokens

Cost: High
Efficiency: Poor
```

### With This Skill (Selective Load)

```
Per question:
  - Load relevant section only
  - ~1,500-2,000 tokens
  - 100 questions = 150K-200K tokens

Cost: 85% lower
Efficiency: Excellent
```

---

## Customization

### Adjust Section Mapping

Edit the skill to match your KB structure:

```markdown
# In load-knowledge-base.md

| Question Type | Load Section | Size | Example |
|--------------|--------------|------|---------|
| Your custom type | YOUR_SECTION | ~XKB | "Your example" |
```

### Add Custom Triggers

Add your own trigger keywords:

```markdown
### Automatic Triggers

1. **Your Custom Category**
   - "Your trigger phrase?"
   - "Another trigger?"
   - "Your pattern"
```

### Change Default Behavior

Modify the loading strategy:

```markdown
# Change from selective to always-full-load
ELSE IF user says "/kb-full" OR needs deep context:
  → Load ALL sections  # Make this the default
```

---

## Troubleshooting

### Skill Not Triggering

**Problem:** Skill doesn't load automatically

**Solutions:**
1. Check skill is installed:
   ```bash
   ls ~/.claude/skills/load-knowledge-base.md
   # or
   ls .claude/skills/load-knowledge-base.md
   ```

2. Verify trigger keywords match your question:
   ```
   Try: "How does [feature] work?"
   Not: "Tell me stuff"  # Too vague
   ```

3. Use manual trigger to test:
   ```
   /kb  # Should definitely work
   ```

---

### File Not Found

**Problem:** "Knowledge base file not found"

**Solutions:**
1. Verify file exists:
   ```bash
   ls /path/to/LLM-KNOWLEDGE-BASE.yaml
   ```

2. Update path in skill file:
   ```bash
   # Edit load-knowledge-base.md
   # Update the file path in "File Path Detection" section
   ```

3. Use absolute path:
   ```markdown
   # In skill, change to absolute path:
   /Users/rtorres/projects/cerebro/LLM-KNOWLEDGE-BASE.yaml
   ```

---

### Wrong Section Loaded

**Problem:** Skill loads wrong section

**Solutions:**
1. Check section exists in your KB:
   ```bash
   yq 'keys' LLM-KNOWLEDGE-BASE.yaml
   ```

2. Use manual section load:
   ```
   /kb-[exact-section-name]
   ```

3. Adjust trigger mapping in skill file

---

### Too Much Loaded

**Problem:** Loading too much content

**Solutions:**
1. Use more specific sections:
   ```
   /kb-architecture  # Not /kb-full
   ```

2. Adjust section sizes in your KB:
   ```javascript
   // Recompress with more granular sections
   ```

---

## Advanced Configuration

### Multi-Project Setup

For multiple projects with different KBs:

```markdown
# In skill, add project detection:

IF current_directory contains "project-a":
  kb_path = "/path/to/project-a/KB.yaml"
ELSE IF current_directory contains "project-b":
  kb_path = "/path/to/project-b/KB.yaml"
ELSE:
  kb_path = "LLM-KNOWLEDGE-BASE.yaml"  # Default
```

### Integration with Other Skills

Combine with other skills:

```markdown
# In other skills, reference KB loader:

"For detailed information, use /kb-[section] to load documentation"
```

### Webhook/API Integration

Load KB on external triggers:

```bash
# Example: Load KB when entering project directory
cd /path/to/project && echo "/kb" | claude
```

---

## Performance Tips

### 1. Structure Your KB Well

When compressing, organize into clear sections:

```yaml
ARCHITECTURE:
  # Architecture content

CORE_CONCEPTS:
  # Concept content

# etc.
```

### 2. Keep Sections Focused

Each section should be 5-10KB max for best performance

### 3. Use Manual Commands

For known questions, use specific sections:

```
Instead of: "Tell me about the system"  # Loads overview
Better: "/kb-architecture" then ask      # Loads only needed
```

### 4. Monitor Context Usage

Check context regularly:

```
/kb-status  # See what's loaded
```

---

## Skill Behavior Matrix

| Scenario | Skill Action | Tokens Used |
|----------|--------------|-------------|
| Architecture question | Load ARCHITECTURE section | ~2,000 |
| Concept question | Load CORE_CONCEPTS section | ~1,750 |
| General overview | Load CONCEPTS + ARCHITECTURE | ~4,000 |
| Manual /kb-full | Load entire KB | ~10,000 |
| Follow-up question | Reference existing context | 0 (cached) |
| Unrelated question | Don't load KB | 0 |

---

## Best Practices

### ✅ Do This

- Let skill auto-trigger for natural workflow
- Use specific sections when you know what you need
- Check /kb-status to avoid redundant loads
- Update KB regularly as docs change
- Use /kb for initial project orientation

### ❌ Don't Do This

- Don't always use /kb-full (wasteful)
- Don't reload unnecessarily
- Don't edit compressed KB manually (regenerate instead)
- Don't ignore "already loaded" messages
- Don't use KB for non-project questions

---

## Examples from Real Use

### Example 1: Starting Work on Project

```
You: "I'm working on the Cerebro project today"

Claude: (skill detects project name)
✅ Loaded project overview (CORE_CONCEPTS + ARCHITECTURE, ~15KB)

Ready to help! Cerebro is [brief summary].
What would you like to work on?
```

### Example 2: Deep Dive

```
You: "How does the skill loading system work exactly?"

Claude: (skill detects CORE_CONCEPTS.SKILLS topic)
✅ Loaded SKILLS documentation (~5KB)

The skill loading system:
1. [detailed explanation from KB]
2. [step-by-step with examples]
3. [based on compressed docs]
```

### Example 3: Efficient Follow-up

```
You: "And what about the architecture?"

Claude: (already in context from previous)
Based on the architecture documentation:
[uses previously loaded context, no reload needed]
```

---

## Maintenance

### Update KB After Doc Changes

When you update documentation:

```bash
# 1. Regenerate compressed KB
doc_scan_compress({
  projectPath: "/path/to/project",
  autoDetectStrategy: true
})

# 2. Skill automatically uses new KB (file is re-read each time)
# No skill updates needed!
```

### Verify Skill Health

Periodic check:

```bash
# 1. Test auto-trigger
"How does X work?"  # Should load automatically

# 2. Test manual trigger
/kb  # Should load

# 3. Test section load
/kb-architecture  # Should load specific section

# 4. Test status
/kb-status  # Should report what's loaded
```

---

## Summary

**This skill gives you:**
- 🎯 Smart auto-loading on relevant questions
- ⚡ 80% token savings vs manual full load
- 🤖 Seamless integration with conversation
- 🔧 Manual override when needed
- 📊 Context awareness (no redundant loads)

**Setup time:** 2 minutes
**Token savings:** 80%+
**Effort required:** Zero (auto-triggers)

---

**You're all set! The skill is ready to use.** 🚀

Try it: Ask Claude a question about your project and watch it load the KB automatically!
