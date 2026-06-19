## Harness

This project uses harnais_de_projet for its agent workflow.
Harness location: docs/harness (symlink → harnais_de_projet)

### How to use
- Full task workflow: Read docs/harness/orchestrator.md
- Single phase: Read the phase entry point for the phase you need:
  - Plan: docs/harness/01_plan/PLAN_PHASE.md
  - Work: docs/harness/02_work/WORK_PHASE.md
  - Review: docs/harness/03_review/REVIEW_PHASE.md
  - Compound: docs/harness/04_compound/COMPOUND_PHASE.md
- Session management: Read docs/harness/05_session/SESSION_MANAGEMENT.md
- Specific agent: Read docs/harness/{phase}/agents/{name}.md (e.g. docs/harness/01_plan/agents/best-practices-researcher.md)

### Phases
- `01_plan` — Research, brainstorm, produce a plan
- `02_work` — Execute the plan, write code and tests
- `03_review` — Validate quality, catch issues
- `04_compound` — Document solutions for future reference
- `05_session` — Cross-session management (pause/resume)

### On session start

1. **Check harness symlink**: Verify `docs/harness/orchestrator.md` is accessible. If not, the symlink to harnais_de_projet may be broken — tell the user: "The harness symlink at docs/harness is not resolving. Check that harnais_de_projet is still at the expected path." To update the harness, run `git pull` in harnais_de_projet.

2. If the user hasn't given a specific task, read `docs/todo.md` and suggest the highest-priority item that isn't already in progress. Present it as a suggestion, not an action — wait for the user to confirm before starting work.

3. If the user asks to use `get-shit-done` slash commands in Claude Code and they fail to run, check `.claude/settings.local.json` for `Bash(npx get-shit-done-cc@latest:*)` and add it if missing.

### Project docs (canonical structure)
- docs/design-rules.md — visual/design rules for this project
- docs/todo.md — prioritized task list
- docs/memory/ — working memory across sessions (includes continue-here files)
- docs/plans/ — feature plans
- docs/plans/summaries/ — completion summaries from work phase
- docs/solutions/ — solved problems
- docs/structure/ — repo structure docs
