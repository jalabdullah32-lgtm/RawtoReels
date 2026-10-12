---
name: project-worklog
description: Draft dated changelog and detailed worklog entries for Raw to Reels, and gently offer to log meaningful project changes.
---

# Project Worklog

Use this skill to maintain a clear project history for Raw to Reels.

## After Meaningful Changes

After completing a meaningful project change, ask one line: `Would you like to add this to today's changelog?`

A meaningful change includes a completed feature, bug fix, behavior change, useful refactor, significant project decision, or a discovery that affects future work.

Do not ask after read-only work, a trivial formatting change, a failed change that leaves no useful discovery, or when the user has already asked to log the work or declined logging during the current conversation.

## When the User Requests a Log

1. Read `CHANGELOG.md` and `WORKLOG.md` if they exist.
2. Inspect local Git commits made on the requested date. Also inspect uncommitted changes when they relate to the request.
3. Use commit messages, changed file names, and diff summaries to understand the work. Do not include large code blocks in either log.
4. Draft, but do not write, two entries for the user's approval:
   - `CHANGELOG.md`: a concise dated summary of meaningful changes.
   - `WORKLOG.md`: a dated record of the goal, work completed, failed attempts, discoveries, and useful next steps.
5. Write the approved entries only after the user confirms the draft.

## Authorship Tag

Entries written through this skill are tagged so the user can later tell which assistant produced the work.

In `CHANGELOG.md`, suffix each bullet Codex is responsible for:

```markdown
## 2026-10-12
- Added audio library panel. _(codex)_
```

In `WORKLOG.md`, add a `**Tool:**` line directly under the entry heading:

```markdown
## 2026-10-12 — Audio library
**Tool:** Codex

Goal: ...
```

Tag only the work Codex actually did. When an entry covers work from more than one assistant, say so plainly rather than claiming all of it. Never add, change, or remove a tag on an existing entry, and never retroactively tag untagged history — untagged entries pre-date the tagging convention and should stay that way.

## Writing Rules

- Include meaningful progress, failures, and discoveries when they help explain the project history.
- Use plain language and mention relevant files when useful.
- Do not invent work from a Git diff or commit message. Ask when the available evidence is unclear.
- Do not create a plan or break down a feature. A separate planning skill handles that.
