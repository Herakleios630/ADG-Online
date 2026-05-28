# P7B-06 Handoff

Current card status: Done
Current card: `P7B-05 - Shifting Skeleton`
Next role: Coding Agent
Suggested model: GPT-5.4
Next exact todo/card: `P7B-06 - Conformation Preview UI`

## Goal

Render conformation plans as read-only engine output without introducing UI-owned rules logic.

## Planned Files

- `src/ui/p0-battlefield.js`
- `src/ui/battlefield-command-panel.js`
- `src/styles/p0-battlefield.css`
- focused UI tests
- `P7B_todo.md`

## Rule Sources

- `docs/rules/conformation.md`
- `docs/rules/open-verification.md`
- `docs/browser-automation.md`
- `P7B_todo.md`

## Scope

Render post-conform candidate ghosts, blocked/incomplete/optional states, and shifting previews from existing engine/reducer state. Keep explanation text in the panel and keep shifted-unit ghosts visually distinct from charge-start slide.

## Non-Goals

- No new conformation solver rules.
- No automatic candidate selection beyond existing engine state.
- No charge-completion state mutation; that remains `P7B-07`.
- No browser-only acceptance claims without an actual smoke run.

## Validation

Run focused UI tests for the conformation preview slice. If browser tooling is available, run a narrow battlefield smoke for one supported shifting case and one blocked/incomplete case.

## Manual Acceptance

The user must verify that conformation ghosts and shifting ghosts are visually distinct from charge-start slide and that blocked/incomplete states are readable. Do not mark manual acceptance done inside the Coding Agent handoff.

## Required Review

After implementation, hand off to Reviewer / Rules Agent.

Reviewer focus:

- the UI renders engine-owned conformation/shifting state without inventing legality;
- shifted ghosts are visually distinct from charge-start slide;
- blocked, incomplete, optional, and source-open states remain honest in the panel and battlefield;
- P7B-06 stays presentation-only and does not start `P7B-07` charge completion logic early.