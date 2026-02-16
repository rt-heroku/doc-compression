# Testing the Knowledge Base Loader Skill

**Verify the skill works correctly**

---

## Pre-Test Checklist

✅ Knowledge base file exists: `/path/to/LLM-KNOWLEDGE-BASE.yaml`
✅ Skill installed in: `~/.claude/skills/` or `.claude/skills/`
✅ File path in skill matches actual KB location
✅ Claude Code is running

---

## Test Suite

### Test 1: Manual Load (Basic)

**Command:**
```
/kb
```

**Expected Response:**
```
✅ Loaded project overview (CORE_CONCEPTS + ARCHITECTURE, ~15KB)

[Shows overview of project]

Available sections:
- ARCHITECTURE
- CORE_CONCEPTS
- WORKFLOWS
- TOOLS
- PATTERNS

What would you like to know?
```

**Status:** ☐ Pass ☐ Fail

---

### Test 2: Auto-Trigger (Architecture)

**Command:**
```
How does the routing system work?
```

**Expected Response:**
```
✅ Loaded ARCHITECTURE from knowledge base (~8KB)

The routing system works as follows:
[Detailed answer based on KB content]
```

**Status:** ☐ Pass ☐ Fail

---

### Test 3: Auto-Trigger (Concept)

**Command:**
```
What is a skill in this project?
```

**Expected Response:**
```
✅ Loaded CORE_CONCEPTS from knowledge base (~7KB)

A skill in this project is:
[Detailed answer based on KB content]
```

**Status:** ☐ Pass ☐ Fail

---

### Test 4: Context Awareness (No Reload)

**Command:**
```
# First, trigger a load
How does the architecture work?

# Then immediately ask follow-up
And what about the components?
```

**Expected Response:**
```
# First response:
✅ Loaded ARCHITECTURE from knowledge base (~8KB)
[Answer about architecture]

# Second response (should NOT reload):
Based on the architecture documentation:
[Answer about components - no "✅ Loaded" message]
```

**Status:** ☐ Pass ☐ Fail

---

### Test 5: Specific Section Load

**Command:**
```
/kb-architecture
```

**Expected Response:**
```
✅ Loaded ARCHITECTURE section (~8KB)

The ARCHITECTURE section covers:
- System design
- Component structure
- Layer organization
- Data flow

What would you like to know about the architecture?
```

**Status:** ☐ Pass ☐ Fail

---

### Test 6: Full KB Load

**Command:**
```
/kb-full
```

**Expected Response:**
```
✅ Loaded complete knowledge base (39KB, all sections)

Available sections:
- ARCHITECTURE
- CORE_CONCEPTS
- WORKFLOWS
- TOOLS
- PATTERNS

Full project context is now available. What would you like to explore?
```

**Status:** ☐ Pass ☐ Fail

---

### Test 7: Status Check

**Command:**
```
/kb-status
```

**Expected Response:**
```
📊 Knowledge Base Status:

Currently loaded:
- ARCHITECTURE (loaded 2 messages ago)
- Last load: 2024-02-15 14:23:15

Total context from KB: ~8KB

To load additional sections: /kb-[section-name]
```

**Status:** ☐ Pass ☐ Fail

---

### Test 8: No Load (Unrelated Question)

**Command:**
```
What's the weather like?
```

**Expected Response:**
```
[Should answer without loading KB]

I don't have access to real-time weather data...
[No "✅ Loaded" message]
```

**Status:** ☐ Pass ☐ Fail

---

### Test 9: Search Command

**Command:**
```
/kb-search workflows
```

**Expected Response:**
```
✅ Loaded WORKFLOWS section (~6KB)

Searching for: workflows

The WORKFLOWS section contains:
[Relevant workflow information]
```

**Status:** ☐ Pass ☐ Fail

---

### Test 10: Multiple Sections

**Command:**
```
How do skills integrate with the architecture?
```

**Expected Response:**
```
✅ Loaded CORE_CONCEPTS.SKILLS and ARCHITECTURE sections (~12KB)

Skills integrate with the architecture as follows:
[Answer combining both sections]
```

**Status:** ☐ Pass ☐ Fail

---

## Debugging Failed Tests

### Test Failed: File Not Found

**Error Message:**
```
❌ Knowledge base file not found.
```

**Fix:**
1. Verify file exists:
   ```bash
   ls /path/to/LLM-KNOWLEDGE-BASE.yaml
   ```

2. Update path in skill:
   ```markdown
   # Edit load-knowledge-base.md
   # Update file path in "File Path Detection" section
   ```

3. Retry test

---

### Test Failed: Skill Not Triggering

**Error Message:**
```
[Claude answers but doesn't load KB]
```

**Fix:**
1. Check skill installed:
   ```bash
   ls ~/.claude/skills/load-knowledge-base.md
   ```

2. Restart Claude Code

3. Try manual trigger first: `/kb`

4. If manual works but auto doesn't, check trigger keywords match

---

### Test Failed: Wrong Section Loaded

**Error Message:**
```
✅ Loaded [WRONG_SECTION]
```

**Fix:**
1. Check your KB structure:
   ```bash
   yq 'keys' LLM-KNOWLEDGE-BASE.yaml
   ```

2. Update section mapping in skill

3. Use manual section load: `/kb-[correct-section]`

---

### Test Failed: Context Not Cached

**Error Message:**
```
# Both loads show "✅ Loaded"
```

**Fix:**
1. Ensure questions are close together (within 10 messages)

2. Check if different sections needed (expected behavior)

3. Verify caching logic in skill

---

## Performance Tests

### Test P1: Token Efficiency

**Measure:**
```
1. Load full KB: /kb-full
   Expected tokens: ~10,000

2. Load section only: /kb-architecture
   Expected tokens: ~2,000

Savings: 80%
```

**Status:** ☐ Pass ☐ Fail

---

### Test P2: Load Time

**Measure:**
```
Time between command and response

Expected: < 2 seconds for section load
Expected: < 5 seconds for full load
```

**Status:** ☐ Pass ☐ Fail

---

### Test P3: Accuracy

**Measure:**
```
Compare answers with KB loaded vs without

With KB: Should be accurate and detailed
Without KB: Should be general or ask to load KB
```

**Status:** ☐ Pass ☐ Fail

---

## Integration Tests

### Test I1: With Other Skills

**Command:**
```
# First use another skill
/commit

# Then ask KB question
How does the commit workflow work in this project?
```

**Expected:**
- Both skills work independently
- No conflicts
- KB loads when needed

**Status:** ☐ Pass ☐ Fail

---

### Test I2: Long Conversation

**Command:**
```
# Ask 20+ questions
# Some requiring KB, some not
```

**Expected:**
- KB loads selectively
- Context management works
- No memory issues

**Status:** ☐ Pass ☐ Fail

---

## Edge Case Tests

### Test E1: Malformed KB

**Setup:**
```
# Temporarily break YAML syntax in KB
```

**Expected:**
```
❌ Error parsing knowledge base file.

The file may be:
- Corrupted
- Invalid YAML syntax
- Incompatible format
```

**Status:** ☐ Pass ☐ Fail

---

### Test E2: Missing Section

**Command:**
```
/kb-nonexistent
```

**Expected:**
```
❌ Section 'nonexistent' not found in knowledge base.

Available sections:
- ARCHITECTURE
- CORE_CONCEPTS
- WORKFLOWS
- TOOLS
- PATTERNS
```

**Status:** ☐ Pass ☐ Fail

---

### Test E3: Empty KB

**Setup:**
```
# Create empty KB file
```

**Expected:**
```
❌ Knowledge base is empty or invalid.
```

**Status:** ☐ Pass ☐ Fail

---

## Test Results Summary

Fill in after running all tests:

```
Basic Tests:        ___ / 10 passed
Performance Tests:  ___ / 3 passed
Integration Tests:  ___ / 2 passed
Edge Case Tests:    ___ / 3 passed

Total:             ___ / 18 passed

Overall Status: ☐ All Pass ☐ Some Fail ☐ Major Issues
```

---

## Next Steps

### If All Tests Pass ✅
- Skill is ready for production use
- Start using in daily workflow
- Monitor for any issues
- Collect user feedback

### If Some Tests Fail ⚠️
- Review failed test debugging steps
- Fix identified issues
- Re-run failed tests
- Document any workarounds

### If Major Issues ❌
- Review skill installation
- Verify KB file validity
- Check Claude Code version
- Consult skill documentation
- Report bugs if needed

---

## Continuous Testing

### Weekly Check
```
1. Quick test: /kb
2. Auto-trigger test: Ask architecture question
3. Verify token savings working
```

### After KB Updates
```
1. Regenerate KB
2. Run Test 1 (manual load)
3. Run Test 2 (auto-trigger)
4. Verify sections still work
```

### After Skill Updates
```
1. Full test suite
2. Check all 18 tests
3. Document any new behaviors
4. Update this testing guide
```

---

**Testing completed on:** __________
**Tested by:** __________
**Version:** __________
**Result:** ☐ Pass ☐ Fail
