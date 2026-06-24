# BRIEFING — 2026-06-19T17:42:58+03:00

## Mission
Integrate live Supabase data for characters/campaigns and enable GM character management/XP distribution in the D&D Companion App.

## 🔒 My Identity
- Archetype: Project Orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: D:\DnD\.agents\orchestrator_live_data\
- Original parent: main agent
- Original parent conversation ID: 22cad626-5b57-4537-bc05-7086fcaa1dd2

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: D:\DnD\PROJECT.md
1. **Decompose**: Decompose the live integration and GM character management tasks into milestones.
2. **Dispatch & Execute**:
   - **Direct (iteration loop)**: Spawn Explorer -> Worker -> Reviewer for single-cycle milestones.
   - **Delegate (sub-orchestrator)**: Spawn sub-orchestrator for larger milestones.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Explore current codebase and data context [pending]
  2. Plan implementation milestones [pending]
  3. Execute implementation milestones via workers [pending]
  4. Final verification and testing [pending]
- **Current phase**: 1
- **Current focus**: Explore current codebase and data context

## 🔒 Key Constraints
- Never write, modify, or create source code files directly.
- Never run build/test commands yourself — require workers to do so.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.
- Zero-tolerance for integrity violations (no hardcoding, no dummy facades).
- All visual effects on React Flow nodes must not use direct CSS transform. (Not directly relevant here but good to keep in mind).

## Current Parent
- Conversation ID: 22cad626-5b57-4537-bc05-7086fcaa1dd2
- Updated: not yet

## Key Decisions Made
- [initial decision] Choose Project pattern for long-running multi-milestone integration.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_1 | teamwork_preview_explorer | CampaignContext investigation | completed | 23fde2b6-14e7-4bed-aeec-905aa79fde71 |
| explorer_2 | teamwork_preview_explorer | DashboardPage investigation | completed | 705c52fe-682b-450e-8e77-63ab22f5206b |
| explorer_3 | teamwork_preview_explorer | GMDashboard investigation | completed | 16f33388-9c7c-4c4b-acab-433150a32cdd |
| worker_1 | teamwork_preview_worker | Live data and GM dashboard implementation | completed | 609ddde2-034c-41f0-abce-e62c9e44ff42 |
| reviewer_1 | teamwork_preview_reviewer | Correctness Review | completed | cc0fb5b8-cdc4-483d-b028-2ef88d5c9304 |
| reviewer_2 | teamwork_preview_reviewer | Robustness Review | completed | 1a0096a9-7d07-486b-84d6-f4ccaf42c20c |
| challenger_1 | teamwork_preview_challenger | Character Creation Verifier | completed | 0adc4e31-70a4-40ca-bdb1-af9d1cbbb157 |
| challenger_2 | teamwork_preview_challenger | XP Distribution Verifier | completed | 068b2c1b-ce66-40f5-99ca-119c412e2772 |
| auditor_1 | teamwork_preview_auditor | Forensic Integrity Audit | completed | 40b23c6b-930f-4967-919c-62bb1c8957e3 |
| explorer_4 | teamwork_preview_explorer | Remediation Investigation | pending | eff590a0-57b5-45ef-b117-8d3d9497ab0b |

## Succession Status
- Succession required: no
- Spawn count: 10 / 16
- Pending subagents: eff590a0-57b5-45ef-b117-8d3d9497ab0b
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: task-9
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run `manage_task(Action="list")` — re-create if missing

## Artifact Index
- D:\DnD\.agents\orchestrator_live_data\BRIEFING.md — Briefing file
- D:\DnD\.agents\orchestrator_live_data\ORIGINAL_REQUEST.md — Original request verbatim
