# Agent Operating Model

AdG Online uses a small, board-driven agent workflow. The goal is better rule fidelity and cleaner handoffs, not more process for its own sake.

This file is the central operating guide for role switching. It complements `.github/copilot-instructions.md`, `docs/project-governance.md`, `roadmap.md`, and the active phase board such as `P7B_todo.md`. It does not replace them.

## Core Roles

### Lead / Phase Steward

Preferred model: GPT-5.5.

GPT-5.4 may also act as Lead / Phase Steward when the user explicitly chooses it; GPT-5.5 remains the preferred option for deeper source-risk triage, larger board drafting, and heavier roadmap work.

Use for large planning, new phase boards, roadmap changes, scope splits, source-risk triage, and conflict resolution between rule accuracy, architecture, effort, and delivery order.

Role guide: `docs/agents/lead-agent.md`.

### Coding Agent

Preferred model: GPT-5.4.

Use for implementing exactly one approved execution-board card at a time, running focused validation, and updating the active board with what changed and what remains open.

Role guide: `docs/agents/coding-agent.md`.

### Reviewer / Rules Agent

Preferred model: GPT-5.4 for normal review; GPT-5.5 only for difficult source-lock or errata reconstruction.

Use after rule-relevant implementation slices, before closing risky cards, and whenever a source ambiguity could affect legality.

Role guide: `docs/agents/reviewer-agent.md`.

## Optional Data / Validation Mode

Do not keep a standing fourth agent for normal work. Invoke a data/validation specialist only when the active task is clearly data-heavy: source OCR corpus, army lists, spreadsheet mapping, unit profile tables, schema validation, or P11 army-builder work.

When invoked, it reports back to the Lead or Reviewer. It does not replace rule review or final user acceptance.

## Switching Contract

The current agent must make switching instructions explicit and compact.

At the end of a planning or implementation task, include a short switch note when another role should take over:

```text
Next role: Reviewer / Rules Agent
Suggested model: GPT-5.4
Task: Review P7B-04 implementation against docs/rules/conformation.md and P7B_todo.md.
Expected output: Approved / Needs Changes / Blocked with findings.
```

The user switches model and agent manually. The repo cannot reliably change the model automatically. The workflow should avoid long back-and-forth: one role completes its task, then gives the next role, model, and exact task in the final handoff.

Every handoff must also state the current card status and the next exact todo or card. Do not assume the user can infer this from prior messages.

Minimum handoff status block:

```text
Current card status: Done | Needs follow-up fix | Awaiting review | Blocked
Current card: P7B-05 - Shifting Skeleton
Next exact todo/card: P7B-06 - Conformation Preview UI
```

If the current card is not done, say that explicitly and name the remaining gate, for example review, manual acceptance, or source check. Never end a handoff without naming either the next exact card or the exact blocker that prevents one.

## Routing Rules

Use the Lead / Phase Steward when:

- drafting or revising a phase board;
- changing `roadmap.md` phase scope;
- resolving cross-board conflicts;
- deciding whether a source-open rule blocks implementation;
- routing `Rules_v2` worked examples into scenario/tutorial drills, golden fixtures, or the `RULEBOOK_EXAMPLES_todo.md` deferred backlog;
- preparing P8/P9/P10-level planning.

Use the Coding Agent when:

- the user says `weiter` or names a specific approved card;
- the card has clear planned files, non-goals, validation, and stop condition;
- implementation can stay inside the current phase.

Use the Reviewer / Rules Agent when:

- a rule-sensitive coding card is complete;
- conformation, charge, evade, ZOC, command, setup, shooting, melee, rout, army-builder, replay, hidden information, or AI fairness is affected;
- browser-visible battlefield behavior changed;
- a card is about to be marked done but source risk remains.

Use optional Data / Validation mode when:

- many source tables or profile mappings changed;
- OCR, army-list, spreadsheet, or schema consistency is the main risk;
- the task is more about data integrity than engine control flow.

## Handoff Packets

Every handoff must name the purpose, files, expected output, and blockers.

Lead -> Coding:

```text
Card: P7B-04
Goal: ...
Planned files: ...
Rule sources: ...
Non-goals: ...
Validation: ...
Manual acceptance: ...
Stop condition: ...
```

Coding -> Reviewer:

```text
Current card status: Awaiting review
Implemented card: ...
Files changed: ...
Rule basis used: ...
Tests/build/browser checks run: ...
Known risks/open questions: ...
Reviewer focus: ...
Next exact todo/card after approval: ...
```

Reviewer -> Lead:

```text
Status: Approved | Needs Changes | Blocked
Findings: ...
Required fixes or source checks: ...
Planning impact: ...
Current card status after review: Done | Needs follow-up fix | Blocked
Next exact todo/card: ...
```

Lead -> Coding after review:

```text
Current card status: Done | Needs follow-up fix
Fix scope: ...
Files allowed: ...
Required validation: ...
Do not expand into: ...
Next exact todo/card after this slice: ...
```

## Review Status Language

- `Approved`: the change fits the approved card and no blocking rule, architecture, validation, or browser issue was found.
- `Needs Changes`: implementation can proceed after focused fixes; source basis is adequate.
- `Blocked`: a source, phase-scope, architecture, or validation gap prevents safe implementation or closeout.

Avoid generic praise. Findings should name the rule area, exact issue, basis, and required correction.

## Board Integration

The active execution board remains the source of truth for the current card. Each card should state the expected role routing after this model is adopted.

Minimum per-card routing metadata:

- expected implementing role and model;
- whether Reviewer / Rules Agent review is required before closeout;
- whether Lead / Phase Steward review is required for planning or scope impact;
- whether optional Data / Validation mode is relevant.

The final answer for a completed card should always include the next recommended role and model when a switch is needed.
It must also always include whether the current card is done and the next exact todo or card.
