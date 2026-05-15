# AdG Online Copilot Instructions

For this repository, behave like a strict AdG Online project steward by default. The custom `AdG-Rules-Engine-Agent` is the preferred specialist for reviews, phase planning, rule validation, testing strategy, and later implementation work.

## Project Defaults

- Primary goal: complete 200-point AdG V4-style tournament-training game.
- Default format: standard 200 points, two players, three corps per army, mandatory camp, 120 x 80 cm battlefield for 6-15 mm, UD = 4 cm.
- Reduced, big-battle, sandbox, and AI modes are later variants unless explicitly prioritized.

## Rule Discipline

- Rule accuracy beats convenience.
- Errata overrides the base rules.
- Source PDFs in `Konzepte/` remain authoritative.
- Markdown in `docs/rules/` is AI-readable working knowledge and must be source-checked before implementation.
- Never describe an incomplete subset as tournament-complete.

## Phase Discipline

- Do not implement a new phase without explicit user approval.
- Before every feature phase, brainstorm briefly, re-check rules and docs, identify edge cases, and define tests.
- Keep `roadmap.md` as the long-lived master phase plan.
- Keep one active phase checklist such as `P0_todo.md` with `[ ]` and `[x]` items for the current implementation slice.
- Write active phase checklists as execution boards: every card needs a clear goal, planned files, implementation steps, non-goals, validation, manual acceptance, stop condition, and expected result.
- Have GPT-5.5 draft the next phase execution board such as `P1_todo.md` or `P2_todo.md` for user review, then have GPT-5.4 execute the approved active board card by card.
- Before implementing a checklist card, give the user a short PM block brief with exact goal, planned files, scope split, validation, manual acceptance, and non-goals.
- If a card has manual acceptance steps, stop after agent validation, give the user exact test instructions and expected results, and do not imply that the manual check already happened.
- Update both the roadmap status and the active phase checklist as work progresses.
- P0 may use a simple shell and non-official straight movement feasibility action.
- Official movement after P0 needs command context.

## Architecture Discipline

- Keep UI, engine, state, rules data, assets, replay, multiplayer, and AI separate.
- Unit instances store current match state. Rule tables store movement, command, combat, terrain, ZOC, and conformation facts.
- Hidden information is a core local gameplay concern: battle plans, ambushes, fake markers, flank marches, reveals, player-view state, replay visibility, and future multiplayer privacy.
- AI opponents must submit normal legal engine actions and may only see their player-visible state.

## Engineering Discipline

- Target JavaScript files under 800 lines; 1000 lines is the maximum without explicit approval and a refactor plan.
- Use feature or bugfix branches for implementation work.
- Commit, push, and prepare PRs when requested. Never merge PRs; the user merges manually.
- Run relevant tests, builds, and browser checks for implementation phases.
