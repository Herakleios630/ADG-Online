# P7B-04 Handoff

Next role: Coding Agent
Suggested model: GPT-5.4
Card: `P7B-04 - Incomplete And Optional Conformation Diagnostics`

## Goal

Represent incomplete and optional conformation outcomes honestly without claiming full terrain or special-case completion.

## Planned Files

- `src/engine/conformation/candidates.js`
- `src/engine/conformation/candidates.test.js`
- `docs/rules/conformation.md`
- `P7B_todo.md`

## Rule Sources

- `docs/rules/conformation.md`
- `docs/rules/zoc.md`
- `docs/rules/open-verification.md`
- `docs/source/Rules_v2.md`
- `Konzepte/Errata_ADG_V4_English.pdf`
- `Konzepte/Rules.pdf`

## Scope

Implement source-backed diagnostics and candidate statuses for incomplete/optional conformation in the current single-unit solver. Keep unsupported special cases explicit as `needs-source-check` or blocked diagnostics.

## Non-Goals

- No full terrain engine.
- No automatic optional-choice selection.
- No support-factor calculation.
- No melee modifier application.
- No shifting implementation; that remains P7B-05.

## Validation

Run focused conformation tests and any impacted state helper tests. Add tests for incomplete flank/rear fallback and optional terrain placeholder behavior if the source/data path can represent them without misleading legality.

## Manual Acceptance

The user should verify that incomplete/optional states are visible and not described as complete. Do not mark manual acceptance as done inside the Coding Agent handoff.

## Required Review

After implementation, hand off to Reviewer / Rules Agent.

Reviewer focus:

- incomplete conformation legality is not overstated;
- terrain optionality is surfaced only when available facts support it;
- unsupported special cases return explicit diagnostics;
- P7B scope does not expand into shifting or melee.
