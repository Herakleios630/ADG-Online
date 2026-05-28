# AdG Online Copilot Instructions

For this repository, behave like a strict AdG Online project steward by default. The custom `AdG-Rules-Engine-Agent` is now split operationally into the lightweight role model documented in `docs/agents/index.md`: Lead / Phase Steward, Coding Agent, and Reviewer / Rules Agent.

Use the role split to keep planning, implementation, and independent rule review separate. The user switches agent/model manually; every handoff that needs a switch must state the next role, suggested model, exact task, and expected output clearly in the final response.

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
- Worked examples from accepted scans are first-class source and product assets. The long-term goal is an in-game tutorial and example database for learning the rules and preparing for tournaments.
- When relevant examples exist in `docs/source/Rules_v2.md` or `docs/source/rules-v2-examples/`, future implementations must plan whether to recreate them as in-game scenarios, tutorial/drill entries, golden validation fixtures, or explicitly deferred reference cases.
- Examples missed by earlier phases before this policy are tracked for a post-P16 catch-up pass rather than silently forgotten.

## Phase Discipline

- Do not implement a new phase without explicit user approval.
- Before every feature phase, brainstorm briefly, re-check rules and docs, identify edge cases, and define tests.
- For rule-sensitive phases, identify relevant book examples from the good scans before implementation and prefer source-backed drill/reference scenarios over purely synthetic fixtures where practical; if the example cannot yet be implemented, record the exact blocker in the active board or `RULEBOOK_EXAMPLES_todo.md`.
- Keep `roadmap.md` as the long-lived master phase plan.
- Keep one active phase checklist such as `P0_todo.md` with `[ ]` and `[x]` items for the current implementation slice.
- Write active phase checklists as execution boards: every card needs a clear goal, planned files, implementation steps, non-goals, validation, manual acceptance, stop condition, and expected result.
- Prefer GPT-5.5 to draft the next phase execution board such as `P1_todo.md` or `P2_todo.md` for user review, but GPT-5.4 may also draft or revise it when the user explicitly chooses that route; then have GPT-5.4 execute the approved active board card by card.
- Use Lead / Phase Steward for large planning, roadmap changes, new execution boards, and source-risk triage. Prefer GPT-5.5 for those tasks, but GPT-5.4 may also handle them when the user explicitly chooses it. Use Coding Agent with GPT-5.4 for approved implementation cards. Use Reviewer / Rules Agent for independent rule review after rule-sensitive implementation slices.
- Before implementing a checklist card, give the user a short PM block brief with exact goal, planned files, scope split, validation, manual acceptance, and non-goals.
- If a card has manual acceptance steps, stop after agent validation, give the user exact test instructions and expected results, and do not imply that the manual check already happened.
- Update both the roadmap status and the active phase checklist as work progresses.
- P0 may use a simple shell and non-official straight movement feasibility action.
- Official movement after P0 needs command context.

## Architecture Discipline

- Keep UI, engine, state, rules data, assets, replay, multiplayer, and AI separate.
- Unit instances store current match state. Rule tables store movement, command, combat, terrain, ZOC, and conformation facts.
- Unit behavior in fixtures must come from shared unit profiles, definitions, capabilities, or rule tables whenever possible. Per-unit scenario overrides are only for labeled test/fault-injection cases.
- Hidden information is a core local gameplay concern: battle plans, ambushes, fake markers, flank marches, reveals, player-view state, replay visibility, and future multiplayer privacy.
- AI opponents must submit normal legal engine actions and may only see their player-visible state.

## Engineering Discipline

- Target JavaScript files under 800 lines; 1000 lines is the maximum without explicit approval and a refactor plan.
- Use feature or bugfix branches for implementation work.
- Commit, push, and prepare PRs when requested. Never merge PRs; the user merges manually.
- Run relevant tests, builds, and browser checks for implementation phases.
- For visual gameplay changes on the battlefield, actively verify the rendered result in the browser when browser tooling is available; do not rely only on reducer or geometry tests.
- If browser tooling is unavailable in the current session, state that limitation explicitly and fall back to focused render tests plus screenshot review instead of claiming browser validation.
- Every complex gameplay feature should be loggable by rule area and detail level from its first implementation slice. Planning cards must state logging expectations or explicitly mark logging as a non-goal.
- Keep debug logs structured, bounded, and filterable. Logging may explain engine/reducer decisions but must never decide legality or mutate game state.

## Agent Handoff Discipline

- Do not create a parallel planning system. `roadmap.md` remains the master plan and the active `P*_todo.md` board remains the execution source of truth.
- Do not use a root `AGENTS.md` while `.github/copilot-instructions.md` is active; detailed role guidance lives in `docs/agents/`.
- Coding Agent handoffs for rule-sensitive cards must include a Reviewer / Rules Agent review packet unless the active board explicitly marks review as a non-goal.
- Reviewer / Rules Agent returns `Approved`, `Needs Changes`, or `Blocked` with concrete findings, not generic approval.
- Lead / Phase Steward resolves cross-board planning impact and tells the user when GPT-5.5 is recommended for depth or source-risk, without treating it as a hard gate when the user explicitly keeps GPT-5.4.
