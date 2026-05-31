# RULEBOOK EXAMPLES TODO - Scenario, Tutorial, And Golden Fixture Library

Status: Draft long-term support board - `RBE-00` policy anchoring is complete on 2026-05-26; future rule-sensitive phase boards must now classify relevant examples before implementation, and missed pre-policy examples are reserved for a post-P16 catch-up pass
Date drafted: 2026-05-26
Planner: Lead / Phase Steward
Preferred future executor: GPT-5.5 for planning and GPT-5.4 for approved scenario/test implementation cards
Recommended review support: Reviewer / Rules Agent / GPT-5.4 for rule-sensitive drill or golden-fixture upgrades
Master plan: roadmap.md
Source inventory: docs/source/Rules_v2.md and docs/source/rules-v2-examples/index.md
Related child board: CONFORM_DRILL_todo.md
Primary product goal: tutorial and example database for learning AdG Online and preparing for tournament play

## Purpose

This board turns accepted-scan rulebook examples into a durable product and validation program. The long-term target is an in-game tutorial and example database where players can load source-backed situations, understand the relevant rule, and practice tournament-relevant decisions.

It also protects future implementation discipline: when shooting, melee, rout, setup, terrain, group movement, or another rule area has a good book example, the implementation board must explicitly classify that example instead of letting it vanish behind synthetic tests.

## Product Decision

Every usable rulebook example from accepted scans should eventually be one of these things:

- `scenario`: a playable in-game drill or example lane;
- `tutorial`: a learning entry with source image, explanation, and playable or inspectable state;
- `golden-fixture`: an automated validation fixture tied to the example ID;
- `deferred-reference`: a named future case with exact missing prerequisites;
- `out-of-scope-variant`: an optional or variant-system example that is intentionally not part of the standard-200 core track yet.

Synthetic fixtures remain allowed for narrow engine tests and awkward edge cases. They are not a substitute for source-backed examples when the rulebook already gives us a canonical training situation.

## Source Example Gate For Future Phases

Before a future rule-sensitive phase starts, the Lead / Phase Steward must:

1. Search `docs/source/rules-v2-examples/index.md` for that phase's rule area.
2. List relevant example IDs in the active phase board.
3. Classify each relevant example as `scenario`, `tutorial`, `golden-fixture`, `deferred-reference`, or `out-of-scope-variant`.
4. Add implementation cards for examples that fit the current phase scope.
5. Add blockers for examples that need later systems such as group movement, group conformation, terrain, support networks, hidden information, or optional variants.
6. Keep the roadmap and this board aligned when example status changes.

## Post-P16 Catch-Up Policy

Examples missed before this policy was adopted are not lost. They are parked for the post-P16 rules-completeness and tutorial-library pass unless the user explicitly pulls one forward earlier.

High-priority post-P16 catch-up areas:

- group basics and command examples from `rv2-p10` and `rv2-p24` through `rv2-p27`;
- movement and manoeuvre examples from `rv2-p29` through `rv2-p34`, especially group movement, line/column changes, extension, contraction, half-turns, and war-wagon turns;
- ZOC examples from `rv2-p35` through `rv2-p38`;
- interpenetration and contact examples from `rv2-p39` and `rv2-p41`;
- charge and evade examples from `rv2-p43` through `rv2-p49` that were not already promoted into live drill lanes;
- early conformation examples from `rv2-p50` through `rv2-p54`, with `CONFORM_DRILL_todo.md` handling the current p.53 cluster first;
- rallying example `rv2-p55` after rallying has an approved implementation path.

## Future Phase Example Obligations

These examples should be planned with their matching phase instead of waiting for the post-P16 catch-up pass:

- P8 shooting: `rv2-p56-shooting-ranges-table-a`, `rv2-p57-shooting-zone-a`, `rv2-p58-line-of-sight-a`, `rv2-p58-shooting-modifiers-a`, and `rv2-p59-shooting-example-a`.
	- 2026-05-28 delta: phase-board mapping for these five examples is now recorded in `P8_todo.md` closeout notes with implemented-vs-deferred status per example.
- P9 melee and camp: `rv2-p61-support-example-1-a`, `rv2-p61-support-example-2-a`, `rv2-p62-melee-resolution-table-a`, `rv2-p63-flank-rear-attack-a`, `rv2-p64-situation-modifier-example-a`, `rv2-p64-height-advantage-a`, `rv2-p65-melee-examples-a`, `rv2-p66-attacking-camp-example-a`, and `rv2-p67-war-wagons-support-a`.
- P10 rout, pursuit, and victory: `rv2-p68-elephant-rampage-table-a`, `rv2-p68-routing-example-a`, `rv2-p69-army-cohesion-losses-a`, and `rv2-p69-army-rout-example-a`.
- P11/setup or later terrain/setup work: `rv2-p71-river-difficulty-table-a`, `rv2-p71-hills-visibility-a`, `rv2-p72-terrain-table-a`, `rv2-p73-compulsory-terrain-table-a`, `rv2-p74-terrain-selection-table-a`, `rv2-p75-terrain-sectors-a`, `rv2-p75-terrain-position-table-a`, `rv2-p76-terrain-adjustment-table-a`, `rv2-p77-ambush-zones-a`, `rv2-p78-deployment-zones-a`, and `rv2-p81` budget tables.
- Optional/variant work: `rv2-p85` event-card tables stay out of the standard-200 core unless the user explicitly prioritizes optional rules.

## Execution Contract

- Do not implement example scenarios without an approved active card.
- Do not widen a gameplay solver just to make an example playable; if the rule logic is missing, mark the example as deferred.
- Every implemented example scenario must preserve its source example ID in data, tests, browser selectors, or tutorial metadata.
- Example scenarios must be tournament-training honest: no army-list legality claim unless an army-builder board owns it, and no rule-complete claim unless the relevant rule area is implemented and reviewed.
- Tutorial copy and player-facing explanation should be layered on top of engine-owned diagnostics, not replace them.

## Execution Cards

### [x] RBE-00 - Long-Term Policy And Backlog Anchor

Goal: make rulebook examples a permanent project workflow and product target.

Planned files:

- RULEBOOK_EXAMPLES_todo.md
- roadmap.md
- docs/project-governance.md
- .github/copilot-instructions.md
- docs/agents/index.md
- docs/agents/lead-agent.md
- CONFORM_DRILL_todo.md

Implementation steps:
1. Record the tutorial/example database product goal.
2. Require future rule-sensitive phases to classify relevant examples before implementation.
3. Add a post-P16 catch-up policy for examples missed by earlier phases.
4. Link `Conform Drill` as the first concrete child board.
5. Update agent/governance instructions so future Lead planning uses this workflow.

Non-goals:

- no engine code
- no UI code
- no scenario data implementation

Validation:

- markdown diagnostics pass
- scoped `git diff --check` passes for changed planning files

Logging / instrumentation expectations:

- non-goal for this planning card

Role routing:

- Implementing role: Lead / Phase Steward / GPT-5.5
- Required review: optional Reviewer / Rules Agent only if source-example classification becomes disputed
- Data / Validation mode: not expected

Manual acceptance:

- user confirms that all future rulebook examples should be treated as scenario/tutorial/golden/deferred assets

Stop condition:

- stop if the workflow would conflict with `roadmap.md` as the master plan or active phase-board ownership

Expected result: future phases and post-P16 planning cannot forget accepted-scan examples.

Closeout 2026-05-26:

- `RBE-00` is complete as a planning and governance slice.
- Next exact card: `P7B-06 - Conformation Preview UI` remains the active implementation/review card; `CFD-01` is the next Conform Drill card only if the user explicitly prioritizes it after the current P7B gate.

### [ ] RBE-01 - Example Registry Metadata Shape

Goal: define the minimal metadata shape future scenario/tutorial entries should carry.

Planned files:

- RULEBOOK_EXAMPLES_todo.md
- future scenario or data design docs
- possibly docs/architecture.md if the metadata becomes shared architecture

Implementation steps:
1. Define fields such as example ID, source page, rule area, scenario status, blocker, related phase, selectors, and tutorial readiness.
2. Keep the shape data-oriented and serializable.
3. Decide whether metadata lives inside each scenario module or a shared example registry.

Non-goals:

- no app UI
- no scenario implementation

Validation:

- planning review only

Logging / instrumentation expectations:

- non-goal

Role routing:

- Implementing role: Lead / Phase Steward / GPT-5.5
- Review: optional
- Data / Validation mode: optional if it becomes schema-heavy

Manual acceptance:

- user confirms the metadata shape before it becomes implementation convention

Stop condition:

- stop if the registry would become a competing planning system instead of a lightweight scenario metadata helper

Expected result: future example scenarios can carry consistent source metadata.

### [ ] RBE-02 - Future Phase Example Gate Template

Goal: create a reusable checklist snippet for P8, P9, P10, P11, and later boards.

Planned files:

- RULEBOOK_EXAMPLES_todo.md
- docs/project-governance.md if the snippet becomes standard
- future phase boards when drafted

Implementation steps:
1. Write a compact `Source Example Gate` section template.
2. Include example ID inventory, classification, blockers, validation plan, and tutorial/database routing.
3. Use the template when drafting P8 and later active boards.

Non-goals:

- no code

Validation:

- planning review only

Logging / instrumentation expectations:

- non-goal

Role routing:

- Implementing role: Lead / Phase Steward / GPT-5.5
- Review: optional
- Data / Validation mode: not expected

Manual acceptance:

- user confirms the template is clear enough for future phase boards

Stop condition:

- stop if the template causes phase boards to overclaim implementation scope

Expected result: future boards classify examples consistently.

### [ ] RBE-03 - Post-P16 Missed Examples Inventory Pass

Goal: inventory examples missed by the P0-P16 beta track and prioritize them for tutorial/database conversion.

Planned files:

- RULEBOOK_EXAMPLES_todo.md
- roadmap.md
- child drill boards as needed

Implementation steps:
1. Re-read the full Rules-v2 example index after P16.
2. Mark which examples already have live scenarios, tests, tutorial entries, or deferrals.
3. Prioritize group movement, group conformation, terrain, ZOC, charge/evade, and command examples that were intentionally narrowed in the first beta track.
4. Create child boards only where a cluster needs real implementation work.

Non-goals:

- no immediate implementation during this planning pass

Validation:

- source index cross-check

Logging / instrumentation expectations:

- non-goal

Role routing:

- Implementing role: Lead / Phase Steward / GPT-5.5
- Required review: Reviewer / Rules Agent if the catch-up priority affects rule-completeness claims
- Data / Validation mode: optional for inventory/status table checks

Manual acceptance:

- user approves the post-P16 catch-up priority order

Stop condition:

- stop if P16 release notes do not yet clearly separate implemented, placeholder, and open rule areas

Expected result: missed examples become an explicit post-P16 work plan.

### [ ] RBE-04 - Tutorial Database UX Concept

Goal: plan how example scenarios become a player-facing tutorial and tournament-prep database.

Planned files:

- roadmap.md
- docs/architecture.md or a future UX concept document
- RULEBOOK_EXAMPLES_todo.md

Implementation steps:
1. Decide how players browse examples by rule area, phase, source page, and difficulty.
2. Decide how much source image/context appears in-app versus docs-only.
3. Define how tutorial explanation consumes engine diagnostics and replay steps.
4. Keep tutorial UI separate from legality solvers.

Non-goals:

- no tutorial UI implementation until core game flow is stable

Validation:

- user review of UX concept

Logging / instrumentation expectations:

- non-goal until UI work begins

Role routing:

- Implementing role: Lead / Phase Steward / GPT-5.5
- Required review: optional UX/product review
- Data / Validation mode: not expected

Manual acceptance:

- user confirms the tutorial/database direction

Stop condition:

- stop if the concept would delay the current P0-P16 beta track without explicit reprioritization

Expected result: the example library has a product shape beyond internal validation.

### [ ] RBE-05 - Golden Example Regression Harness

Goal: plan how implemented examples become stable automated validation assets.

Planned files:

- future test architecture docs
- RULEBOOK_EXAMPLES_todo.md
- relevant phase boards

Implementation steps:
1. Define what counts as a golden example for geometry, rule decision, UI explanation, and replay validation.
2. Decide how to keep golden examples stable while source-open cases evolve.
3. Add golden example gates only where the engine already supports the relevant rule behavior.

Non-goals:

- no broad test-framework rewrite during planning

Validation:

- planning review and later focused tests

Logging / instrumentation expectations:

- non-goal until implementation starts

Role routing:

- Implementing role: Lead / Phase Steward / GPT-5.5 for planning, Coding Agent / GPT-5.4 for approved harness cards
- Required review: Reviewer / Rules Agent for rule-sensitive golden cases
- Data / Validation mode: optional if schema/status validation is added

Manual acceptance:

- user confirms which examples should become hard regression gates versus soft tutorial references

Stop condition:

- stop if a golden test would freeze a source-open or incomplete rule interpretation as final

Expected result: rulebook examples become durable validation assets where the rule support is mature enough.