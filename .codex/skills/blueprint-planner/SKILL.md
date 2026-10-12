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

## Blueprint Storage

After approval, create the blueprint in `blueprints/active/` using one of these filename prefixes:
- `feature-` for a new user-facing capability.
- `bug-` for incorrect or broken behavior.
- `improvement-` for improving an existing workflow or experience.
- `investigation-` for work that needs research before a solution is chosen.
- `deployment-` for hosting, packaging, or environment work.

Use a clear lowercase hyphenated filename, such as `feature-audio-library.md`. Create `blueprints/active/`, `blueprints/completed/`, and `blueprints/parked/` only when they are first needed.

## Starting Implementation

After the user approves a blueprint, show how the work would be divided into focused implementation tasks. Wait for the user to approve that division before starting coding or delegating work to agents.

Accept ordinary language such as `Let's build the audio library`, `Start working on the plan we just made`, or `Implement the audio library blueprint`. Remind the user of the next available action when helpful; do not require them to remember a command or file path.

## Completion

When implementation is complete, summarize the result and ask whether the user wants to move the blueprint from `blueprints/active/` to `blueprints/completed/`. Never move it without their confirmation.

## Boundaries

- Do not code, delegate, or create implementation tasks before the relevant approvals.
- Do not invent requirements when the user's answer or the current project state is unclear.
- Keep blueprints concrete and readable for a non-coding project owner.
