---
name: load-knowledge-base
description: Intelligently load compressed documentation knowledge base when user asks about project architecture, concepts, workflows, or technical details. Auto-triggers on relevant questions or manual "/kb" command.
triggers:
  - "how does [feature/component/system] work"
  - "what is [concept/term]"
  - "explain [architecture/design/implementation]"
  - "show me [workflow/process]"
  - "/kb"
  - "/load-kb"
  - "load knowledge base"
---

# Knowledge Base Loader

## Purpose

Load the compressed documentation knowledge base **selectively and intelligently** to provide project context without wasting tokens.

## When This Skill Triggers

### Automatic Triggers

1. **Architecture Questions**
   - "How does the routing system work?"
   - "What's the architecture of X?"
   - "Explain the component structure"
   - "Show me the system design"

2. **Concept Questions**
   - "What is a skill?"
   - "What are subagents?"
   - "Explain the prompt system"
   - "Define [technical term]"

3. **Workflow Questions**
   - "How do I create a plugin?"
   - "What's the workflow for X?"
   - "Walk me through the process"
   - "How does the compression work?"

4. **Implementation Questions**
   - "How is X implemented?"
   - "Show me how Y works"
   - "What does Z do?"

### Manual Triggers

- `/kb` - Load overview (CORE_CONCEPTS + ARCHITECTURE)
- `/kb-full` - Load entire knowledge base
- `/kb-[section]` - Load specific section (e.g., `/kb-architecture`)
- `/kb-search [query]` - Load most relevant section for query

## Loading Strategy

### IMPORTANT: Load Selectively, Not Everything

❌ **DON'T** load the entire 39KB knowledge base for every question
✅ **DO** load only the relevant section (5-8KB typically)

### Section Mapping

Based on the user's question, load the appropriate section:

| Question Type | Load Section | Size | Example |
|--------------|--------------|------|---------|
| Architecture/Design | ARCHITECTURE | ~8KB | "How does routing work?" |
| Core Concepts | CORE_CONCEPTS | ~7KB | "What is a skill?" |
| Workflows/Processes | WORKFLOWS | ~6KB | "How to create plugin?" |
| Tools/Capabilities | TOOLS | ~5KB | "What tools are available?" |
| Patterns/Best Practices | PATTERNS | ~5KB | "Best practices for X?" |
| Overview | CORE_CONCEPTS + ARCHITECTURE | ~15KB | "Tell me about the project" |
| Full Context | ALL SECTIONS | ~39KB | "Deep analysis needed" |

## Step-by-Step Procedure

### Step 1: Detect Topic and Determine Section

```
Analyze user's question:

IF question about "architecture" OR "design" OR "system structure" OR "components":
  → Load ARCHITECTURE section

ELSE IF question about "what is" OR "define" OR "explain concept":
  → Load CORE_CONCEPTS section

ELSE IF question about "how to" OR "workflow" OR "process" OR "steps":
  → Load WORKFLOWS section

ELSE IF question about "tools" OR "capabilities" OR "what can":
  → Load TOOLS section

ELSE IF question about "patterns" OR "best practices" OR "how should":
  → Load PATTERNS section

ELSE IF general overview OR first question about project:
  → Load CORE_CONCEPTS + ARCHITECTURE

ELSE IF user says "/kb-full" OR needs deep context:
  → Load ALL sections
```

### Step 2: Check Context Awareness

```
BEFORE loading:

1. Check if KB already loaded this session:
   - Search conversation history for "LLM-KNOWLEDGE-BASE"
   - If found recently (last 10 messages), reference it instead of reloading

2. Check if specific section already available:
   - If ARCHITECTURE already in context, don't reload
   - Just reference: "Based on the architecture documentation already loaded..."

3. Determine if load is actually needed:
   - Can you answer from general knowledge? Don't load KB
   - Is this a simple question? Don't load KB
   - Is this specific to the project? Load KB
```

### Step 3: Load the Knowledge Base

```
1. Determine the file path:
   - Check current working directory
   - If in project directory: use relative path
   - Otherwise: use absolute path to LLM-KNOWLEDGE-BASE.yaml

2. Read the file:
   Read({
     file_path: "/path/to/LLM-KNOWLEDGE-BASE.yaml"
   })

3. Parse YAML structure:
   - Understand the hierarchical structure
   - Identify section boundaries

4. Extract relevant section(s):
   - Don't include META section in response (just metadata)
   - Extract only the requested section(s)
   - Keep structure intact for readability
```

### Step 4: Present Context to User

```
1. Confirm what was loaded:
   "✅ Loaded [SECTION_NAME] from knowledge base ([SIZE])"

2. Provide brief orientation:
   "The [SECTION] covers: [brief summary]"

3. Then answer the question:
   Use the loaded knowledge to provide accurate answer

4. Indicate source:
   "Based on the project knowledge base, [answer]..."
```

## Example Scenarios

### Scenario 1: Architecture Question

**User:** "How does the skill loading system work?"

**Your Process:**
```
1. Detect: "skill loading" → CORE_CONCEPTS (skills are a core concept)
2. Check context: Not recently loaded
3. Load: CORE_CONCEPTS.SKILLS section only
4. Respond:
   "✅ Loaded SKILLS documentation from knowledge base (~5KB)

   The skill loading system works as follows:
   [provide detailed answer based on KB]

   Source: Cerebro Knowledge Base > CORE_CONCEPTS > SKILLS"
```

### Scenario 2: General Overview

**User:** "Tell me about this project"

**Your Process:**
```
1. Detect: General overview → CORE_CONCEPTS + ARCHITECTURE
2. Check context: First question, nothing loaded
3. Load: Both sections (~15KB)
4. Respond:
   "✅ Loaded project overview (CORE_CONCEPTS + ARCHITECTURE, ~15KB)

   Here's an overview of Cerebro:
   [synthesize from both sections]

   Would you like me to dive deeper into any specific area?"
```

### Scenario 3: Already in Context

**User:** "And how does the routing work?" (continuation)

**Your Process:**
```
1. Detect: "routing" → ARCHITECTURE section
2. Check context: ARCHITECTURE loaded 2 messages ago ✓
3. Don't reload: Reference existing context
4. Respond:
   "Based on the architecture documentation we loaded:

   The routing system [answer from context]..."
```

### Scenario 4: Manual Full Load

**User:** "/kb-full"

**Your Process:**
```
1. Detect: Manual command for full KB
2. Load: ALL sections
3. Respond:
   "✅ Loaded complete knowledge base (39KB, all sections)

   Available sections:
   - ARCHITECTURE (system design)
   - CORE_CONCEPTS (fundamentals)
   - WORKFLOWS (processes)
   - TOOLS (capabilities)
   - PATTERNS (best practices)

   What would you like to know?"
```

### Scenario 5: No Load Needed

**User:** "What's a good name for a variable that stores user data?"

**Your Process:**
```
1. Detect: General programming question, not project-specific
2. Decision: KB not needed
3. Don't load anything
4. Respond:
   "For storing user data, good variable names include:
   - userData
   - userInfo
   - user
   [answer from general knowledge]"
```

## Manual Commands

### `/kb` - Load Overview
```
Load CORE_CONCEPTS + ARCHITECTURE sections
~15KB of context
Good for: Initial orientation, general questions
```

### `/kb-full` - Load Everything
```
Load ALL sections (META, CORE_CONCEPTS, ARCHITECTURE, WORKFLOWS, TOOLS, PATTERNS)
~39KB of full context
Good for: Deep analysis, complex questions spanning multiple areas
```

### `/kb-architecture` - Load Architecture Only
```
Load ARCHITECTURE section only
~8KB
Good for: System design questions, component interactions
```

### `/kb-concepts` - Load Core Concepts
```
Load CORE_CONCEPTS section only
~7KB
Good for: Understanding fundamentals, definitions
```

### `/kb-workflows` - Load Workflows
```
Load WORKFLOWS section only
~6KB
Good for: How-to questions, process understanding
```

### `/kb-tools` - Load Tools
```
Load TOOLS section only
~5KB
Good for: Capability questions, feature availability
```

### `/kb-patterns` - Load Patterns
```
Load PATTERNS section only
~5KB
Good for: Best practices, recommendations
```

### `/kb-search [query]` - Smart Search
```
Analyze query and load most relevant section(s)
Variable size based on relevance
Good for: Not sure which section, let skill decide
```

### `/kb-status` - Check What's Loaded
```
Report what sections are currently in context
Don't load anything, just report
Good for: Understanding current context state
```

## File Path Detection

### Auto-detect KB Location

```
1. Check current working directory:
   - If pwd contains "cerebro" or project name
   - Look for LLM-KNOWLEDGE-BASE.yaml in current dir or parent dirs

2. Common locations to check:
   - ./LLM-KNOWLEDGE-BASE.yaml
   - ../LLM-KNOWLEDGE-BASE.yaml
   - /Users/rtorres/projects/cerebro/LLM-KNOWLEDGE-BASE.yaml

3. If file not found:
   - Inform user: "❌ Knowledge base not found. Please specify path."
   - Ask: "Where is your LLM-KNOWLEDGE-BASE.yaml file located?"
```

## Token Efficiency

### Calculate Before Loading

```
Before loading, estimate token cost:

Section sizes:
- ARCHITECTURE: ~8KB = ~2,000 tokens
- CORE_CONCEPTS: ~7KB = ~1,750 tokens
- WORKFLOWS: ~6KB = ~1,500 tokens
- TOOLS: ~5KB = ~1,250 tokens
- PATTERNS: ~5KB = ~1,250 tokens
- FULL KB: ~39KB = ~10,000 tokens

Only load if:
- Question requires project-specific knowledge
- Can't answer from general knowledge
- User explicitly requests it
```

## Quality Guidelines

### When to Load

✅ **DO load when:**
- Question is about project-specific concepts
- User asks about architecture or design
- Need to explain workflows or processes
- User manually requests it
- Answer requires project context

❌ **DON'T load when:**
- Question is general programming (not project-specific)
- Answer is obvious or from general knowledge
- Simple question that doesn't need documentation
- KB was loaded very recently (within last 5 messages)

### How to Respond After Loading

**Good response structure:**
```
✅ Loaded [SECTION] from knowledge base (~XKB)

[Brief orientation of what the section contains]

[Answer the user's question using the loaded knowledge]

[Indicate source: "Based on the project documentation..."]
```

**Bad response structure:**
```
❌ [Just dumps the entire YAML content]
❌ [Answers without confirming what was loaded]
❌ [Loads but doesn't use the knowledge]
```

## Error Handling

### File Not Found
```
If LLM-KNOWLEDGE-BASE.yaml not found:

"❌ Knowledge base file not found.

I looked in:
- [list of paths checked]

Please either:
1. Specify the path: '/kb-load /path/to/file.yaml'
2. Create the knowledge base using the doc-compression plugin
3. Let me know where the file is located"
```

### Invalid Section
```
If user requests non-existent section:

"❌ Section 'INVALID_NAME' not found in knowledge base.

Available sections:
- ARCHITECTURE
- CORE_CONCEPTS
- WORKFLOWS
- TOOLS
- PATTERNS

Try: /kb-[section-name]"
```

### Parsing Error
```
If YAML parsing fails:

"❌ Error parsing knowledge base file.

The file may be:
- Corrupted
- Invalid YAML syntax
- Incompatible format

Please verify the file or regenerate it using the doc-compression plugin."
```

## Advanced Features

### Relevance Scoring

```
For /kb-search [query], score each section for relevance:

1. Extract keywords from query
2. Score each section:
   - Does section title match keywords? +3 points
   - Does section content contain keywords? +1 point per keyword
   - Is section typically relevant for this type of query? +2 points

3. Load section(s) with highest score
4. If tie, load both sections
```

### Caching Strategy

```
Track what's been loaded this session:

1. Maintain mental state:
   - Last loaded section
   - Timestamp of load
   - Messages since load

2. Smart reloading:
   - Same section within 10 messages? → Don't reload, reference existing
   - Different section but overlapping? → Load only the new parts
   - User explicitly requests reload? → Reload fresh

3. Context pressure handling:
   - If context getting full (>80%)
   - Summarize previously loaded KB sections
   - Keep only most relevant parts
```

### Multi-Section Queries

```
If query spans multiple areas:

User: "How does the skill system integrate with the architecture?"

Load both:
1. CORE_CONCEPTS.SKILLS
2. ARCHITECTURE.SKILL_LOADING

Respond:
"✅ Loaded SKILLS and ARCHITECTURE sections (~12KB)

The skill system integrates with architecture as follows:
[synthesize from both sections]"
```

## Testing the Skill

### Self-Test Commands

Try these to verify the skill works:

1. `/kb-status` → Should report nothing loaded initially
2. "How does X work?" → Should load relevant section
3. `/kb-architecture` → Should load architecture section
4. `/kb-full` → Should load everything
5. Ask follow-up → Should reference already-loaded context
6. `/kb-status` → Should report what's in context

## Summary

**This skill makes the knowledge base:**
- 🎯 **Smart**: Loads only what's needed
- ⚡ **Efficient**: Saves 80% of tokens vs full load
- 🤖 **Automatic**: Triggers on relevant questions
- 🔧 **Flexible**: Manual override available
- 📊 **Aware**: Doesn't reload unnecessarily

**User Experience:**
- Asks about architecture → KB loads automatically
- Gets accurate project-specific answers
- No manual steps required (unless wanted)
- Transparent about what's loaded
- Token-efficient operation

---

**Remember:** The goal is to be helpful without being wasteful. Load knowledge when it adds value, skip it when general knowledge suffices.
