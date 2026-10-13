---
name: blueprint-planner
description: Turn Raw to Reels ideas, bugs, and improvements into reviewed implementation blueprints before coding starts.
---

# Blueprint Planner

Use this skill when the user describes a feature, bug, improvement, deployment task, or uncertainty they want to resolve in Raw to Reels.

## Plan Before Building

1. Inspect the relevant project files, folder structure, documentation, and Git history before proposing a solution. Identify existing behavior, dependencies, and likely roadblocks.
2. Ask focused clarifying questions. Then show a short `What I understand` summary before drafting the plan.
3. Draft a blueprint that includes:
   - Goal
   - Proposed user experience
   - Current project context
   - Relevant files and components
   - Implementation steps
   - Testing approach
   - Risks and roadblocks
   - Definition of done
   - Status
4. Do not create or edit a blueprint until the user confirms the draft.

## Capturing Ideas

`IDEAS.md` at the repo root holds every idea for the project. Open ideas are plain, closed
ideas are struck through, and each carries a permanent two-digit number that is never reused.
Ideas worth building graduate from there into a blueprint.

The user thinks out loud and produces ideas faster than either of you can act on them. Catch
them, but never at the cost of the conversation:

- **Sweep at pauses, not mid-thought.** When a planning thread reaches a natural stopping point, offer the ideas you heard as a short list and ask whether to add them. Do not interrupt a train of thought to ask about filing.
- **Nudge in one line.** When the user raises something outside the scope of what is being planned, say so in a single sentence and offer to put it in `IDEAS.md`, then return to the thread. Do not lecture about scope and do not explore the tangent.
- **Write the line, not the essay.** An entry is one sentence on what the idea is and why it is wanted. If an idea needs paragraphs, it wants to be a blueprint.
- **File it under the right heading** and take the next unused number. Numbers only ever count up, including past struck-through ideas.
- **Strike through, never delete.** An idea that ships and an idea that gets rejected both get struck through and both stay in the file.

When the user asks to build an idea by its number, read that line as the starting point for the
blueprint, then follow the planning steps above as normal. Once a blueprint exists for an idea,
the blueprint is the live record; leave the idea line as it is until the work actually ships.

## Blueprint Storage

After approval, create the blueprint in `blueprints/active/` using one of these filename prefixes:
- `feature-` for a new user-facing capability.
- `bug-` for incorrect or broken behavior.
- `improvement-` for improving an existing workflow or experience.
- `investigation-` for work that needs research before a solution is chosen.
- `deployment-` for hosting, packaging, or environment work.

Use a clear lowercase hyphenated filename, such as `feature-audio-library.md`. Create `blueprints/active/`, `blueprints/completed/`, and `blueprints/parked/` only when they are first needed.

## Authorship Tag

Every blueprint created through this skill is tagged so the user can later tell which assistant produced the work.

Open the file with frontmatter:

```markdown
---
tool: codex
---
```

End the file with a footer:

```markdown
---
_Authored with Codex._
```

Keep the tag factual and do not remove or rewrite a `tool:` value set by another assistant. When editing a blueprint that another assistant created, leave its original tag in place and note the Codex contribution in the `Status` section instead.

## Starting Implementation

After the user approves a blueprint, show how the work would be divided into focused implementation tasks. Wait for the user to approve that division before starting coding or delegating work to agents.

Accept ordinary language such as `Let's build the audio library`, `Start working on the plan we just made`, or `Implement the audio library blueprint`. Remind the user of the next available action when helpful; do not require them to remember a command or file path.

## Completion

When implementation is complete, summarize the result and ask whether the user wants to move the blueprint from `blueprints/active/` to `blueprints/completed/`. Never move it without their confirmation.

## Boundaries

- Do not code, delegate, or create implementation tasks before the relevant approvals.
- Do not invent requirements when the user's answer or the current project state is unclear.
- Keep blueprints concrete and readable for a non-coding project owner.
