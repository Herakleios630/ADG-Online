# CONFORM_DRILL TODO - Rulebook Example Reference Scenarios

Status: Paused support board - planned from `Rules_v2` p.53 on 2026-05-26; `CFD-E1` is accepted as the first live lane, but further Conform Drill example work is paused because `CFD-E2` and later cases need missing multi-unit, support-network, terrain, and follow-up conformation rule implementations
Date drafted: 2026-05-26
Planner: Lead / Phase Steward
Preferred future executor: GPT-5.4 after user approval
Recommended review support: Reviewer / Rules Agent / GPT-5.4; GPT-5.5 only if scope or source triage expands
Master plan: roadmap.md
Parent example-library board: RULEBOOK_EXAMPLES_todo.md
Primary active dependency: P7B_todo.md remains the active conformation board and must keep its current card discipline
Related support boards: CHARGE_DRILL_2_todo.md, LOGGING_todo.md
Source workspace: docs/source/Rules_v2.md, docs/source/rules-v2-examples/index.md, docs/rules/conformation.md, docs/rules/open-verification.md
Primary source example IDs: rv2-p53-shifting-units-a, rv2-p53-incomplete-conformation-a, rv2-p53-conformation-terrain-a, rv2-p53-incomplete-flank-conforming-a
Primary source PDFs: docs/source/new scan/Rules_Color_300DPI.pdf, Konzepte/Errata_ADG_V4_English.pdf, Konzepte/Rules.pdf

## Purpose

This board plans a dedicated `Conform Drill` scenario that recreates source-backed conformation examples from the accepted Rules-v2 scan. It is the first concrete child board of the broader `RULEBOOK_EXAMPLES_todo.md` program, so conformation validation and future training UX can use rulebook examples directly instead of relying only on the synthetic Charge Drill matrix.

`Conform Drill` is a support board, not a replacement for `P7B_todo.md`. P7B still owns conformation engine and UI scope. This board only plans the drill scenario, the example-to-lane mapping, and the honest staging of supported versus deferred book examples.

## Product Decision

Do not keep loading rulebook conformation examples into `Charge Drill`.

- `Charge Drill` remains the troop-family, charge, reaction, evade, and generic smoke matrix.
- `Conform Drill` becomes the source-backed conformation example board.
- Each lane must map to a named `Rules_v2` example ID, not a loose paraphrase.
- If a book example depends on terrain, multi-unit support networks, later-turn cleanup, or other out-of-scope systems, keep it as an explicit deferred reference case instead of simplifying it into a different legal position.

## Source Example Inventory

| Drill slot | Example ID | Book caption | Current planning role | Immediate support state | Current blocker |
| --- | --- | --- | --- | --- | --- |
| `CFD-E1` | `rv2-p53-shifting-units-a` | Shifting units when conforming | first live interactive lane | supported live lane | accepted for current support scope |
| `CFD-E2` | `rv2-p53-incomplete-conformation-a` | Incomplete conformation | required future reference lane | paused / deferred | needs multi-unit in-contact and support-network-aware conformation |
| `CFD-E3` | `rv2-p53-conformation-terrain-a` | Conformation and terrain | future terrain reference lane | deferred | terrain system and terrain-sensitive conformation choice |
| `CFD-E4` | `rv2-p53-incomplete-flank-conforming-a` | Incomplete flank conforming | future flank-fallback reference lane | deferred | terrain plus later-turn fallback and defender-turn follow-up behavior |

Current source-backed summaries for planning:

- `CFD-E1`: cavalry `B1` charges `A1`, slides right to conform, and `B2` is pushed back only as much as needed so `B1` can conform.
- `CFD-E2`: `B1`, `B2`, and `B3` contact `A1`, `A2`, and `A3`; full conformation is impossible because supporting or already-engaged units cannot be shifted.
- `CFD-E3`: `B` is not required to conform into penalizing terrain; the later enemy turn then resolves the remaining conformation.
- `CFD-E4`: a flank contact that cannot fully conform must fall back to front if possible, otherwise remain incomplete until the later turn.

## Scope Split

Execute this board in three layers:

1. Scenario shell:
   - separate menu entry and data surface for `Conform Drill`
   - stable lane IDs, labels, and selectors
   - source example metadata stored with each lane

2. Immediate supported lane:
   - `CFD-E1` as the first live page-53 drill
   - no new solver logic beyond the currently approved P7B or future approved conformation cards

3. Deferred reference lanes:
   - keep `CFD-E2`, `CFD-E3`, and `CFD-E4` as named target cases with exact blockers until their dependencies are approved and implemented
   - do not fake group, terrain, or later-turn behavior to make the drill look more complete than the engine really is

## Timing Recommendation

Recommended execution order unless the user reprioritizes:

1. Finish the current active P7B card gate first: `P7B-06` reviewer closeout plus remaining browser/manual acceptance.
2. If the user wants source-backed drill work before `P7B-07`, start `CFD-01` only after explicit approval.
3. Implement `CFD-E1` before touching the deferred page-53 examples.
4. Keep `CFD-E2`, `CFD-E3`, and `CFD-E4` blocked until their prerequisite systems are available or explicitly approved as new support slices.
5. Revisit page 54 examples only after the page-53 cluster has a clean home and stable naming.

## GPT-5.4 Execution Contract

GPT-5.4 should treat this board as scenario and validation work, not as permission to widen conformation rules.

- Keep `Conform Drill` separate from `Charge Drill` in menu copy, scenario IDs, data modules, selectors, and docs.
- Every lane must cite the source example ID it recreates.
- Do not add new conformation legality just because a book example exists; only consume already approved engine behavior.
- If an example needs unsupported terrain, multi-unit, or later-turn logic, surface it as blocked or deferred, not as a silently altered "close enough" lane.
- Keep files under project size targets; split data and UI helpers before a single scenario file turns into another mega-fixture.
- After each card, update this board, `roadmap.md`, and the affected active board with current card status and the next exact card.

## Non-Goals For The Whole Board

- no tournament-legal scenario claim
- no army-list legality
- no combat-factor or melee-resolution implementation
- no terrain engine implementation hidden inside a drill
- no multi-unit conformation solver added without its own approved board or card
- no copyrighted page art reuse inside the app beyond source-backed planning references already stored in the repository
- no replacement of Charge Drill as the general smoke matrix

## Manual Acceptance Themes

Manual acceptance should answer practical product questions:

- The user can tell why `Conform Drill` exists and how it differs from `Charge Drill`.
- Every visible lane points to a named rulebook example, not a vague theme.
- Supported lanes are playable and explanatory without inventing new rule behavior.
- Deferred lanes stay honest about what system is still missing.
- Browser smoke and later automated tests can refer to stable example IDs and labels.

## Execution Cards

### [x] CFD-00 - Source Lock And Example Mapping

Goal: define the page-53 example inventory, the split between supported and deferred lanes, and the boundary between `Charge Drill` and `Conform Drill`.

Planned files:

- CONFORM_DRILL_todo.md
- roadmap.md
- P7B_todo.md
- CHARGE_DRILL_2_todo.md
- docs/project-governance.md

Implementation steps:
1. Re-check `Rules_v2` p.53 and the extracted example index.
2. Record the four example IDs and short planning summaries.
3. Classify each example as immediate, deferred, or blocked based on current approved scope.
4. Separate `Conform Drill` from `Charge Drill` at the planning level.
5. Record the example-driven workflow rule in project governance.

Non-goals:

- no engine code
- no scenario data
- no browser automation implementation

Validation:

- markdown diagnostics pass
- source example IDs and captions align across `Rules_v2` and the example index

Logging / instrumentation expectations:

- non-goal for this planning card

Role routing:

- Implementing role: Lead / Phase Steward / GPT-5.5
- Review: optional Reviewer / Rules Agent only if the page-53 example mapping becomes source-ambiguous
- Data / Validation mode: not expected

Manual acceptance:

- user confirms the example inventory and the separation between `Charge Drill` and `Conform Drill`

Stop condition:

- stop if any page-53 example cannot be identified confidently from the current scan assets

Expected result: the repo has an explicit board for source-backed conformation drills.

Closeout 2026-05-26:

- `CFD-00` is complete as a planning slice.
- The four page-53 examples are explicitly mapped, their current blockers are named, and `Conform Drill` is now the planned home for source-backed conformation example work.
- Next exact card: `CFD-01 - Scenario Shell And Stable Example Lanes`.

### [x] CFD-01 - Scenario Shell And Stable Example Lanes

Goal: add a separate `Conform Drill` scenario shell with stable labels, lane metadata, and browser selectors.

Planned files:

- new src/data/conform-drill-scenarios.js
- src/data/battlefield-profiles.js if a new scenario profile is needed
- src/ui or menu files that register available scenarios
- tests for scenario registration and stable IDs
- docs/browser-automation.md
- CONFORM_DRILL_todo.md

Implementation steps:
1. Create a dedicated scenario entry and scenario ID such as `conform-drill`.
2. Add four named lane slots mapped to `CFD-E1` through `CFD-E4`.
3. Store example ID, caption, and current support status with each lane.
4. Add stable selectors and browser-runbook anchors.
5. Keep the scenario shell neutral: no new legality, no fake conformation results.

Non-goals:

- no new conformation solver behavior
- no terrain implementation
- no combat resolution

Validation:

- scenario registration tests
- selector/browser smoke for scenario entry and lane discovery
- editor diagnostics on touched files

Logging / instrumentation expectations:

- Areas: `ui` and `conformation`
- Minimum level: `warn` for blocked or deferred lane selection, `debug` for example-lane metadata exposure if the current logging seam is touched
- Browser/manual debug entry: filtered URL using `conformation,ui`

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4 for scenario honesty and selector stability
- Lead gate: yes if the scenario shell starts pressuring P7B scope or menu architecture
- Data / Validation mode: not expected

Manual acceptance:

- user verifies the scenario appears separately from Charge Drill and the four example lanes are clearly named

Stop condition:

- stop if the scenario shell cannot distinguish supported versus deferred lanes honestly

Expected result: the app has a separate conformation example scenario surface.

Closeout 2026-05-26:

- Added `conform-drill` as a separate scenario ID, New Game entry, reducer start action, and battlefield selector surface.
- Added four stable lane slots mapped to `CFD-E1` through `CFD-E4`, with source example IDs, captions, and supported/deferred status metadata.
- Kept the shell neutral: no new conformation solver behavior, no terrain implementation, and no fake group or flank fallback logic.
- Automated validation passed with `node --test src/data/conform-drill-scenarios.test.js src/state/p0-state.test.js src/ui/p0-app.test.js src/ui/p0-battlefield.test.js`.
- Browser smoke passed through the Conform Drill menu entry and all `CFD-E1` through `CFD-E4` lane selectors; manual acceptance remains pending.
- Next exact card: `CFD-02 - Live Example Lane For CFD-E1`.

### [x] CFD-02 - Live Example Lane For `CFD-E1`

Goal: recreate `rv2-p53-shifting-units-a` as the first playable page-53 conformation drill.

Planned files:

- `CFD-01` scenario files
- conformation-facing tests or fixtures
- docs/browser-automation.md
- CONFORM_DRILL_todo.md

Implementation steps:
1. Place the initial unit geometry to match the source example as closely as current approved rules allow.
2. Use existing or separately approved P7B state only; do not add new shifting legality here.
3. Preserve stable unit IDs and example metadata so browser smoke can refer directly to `CFD-E1`.
4. Add focused validation for the expected shift-preview outcome and explanation surface.

Non-goals:

- no chain shifting
- no new support-network solver
- no terrain behavior

Validation:

- focused scenario or UI tests
- browser smoke for `CFD-E1`
- touched-file diagnostics

Logging / instrumentation expectations:

- Areas: `conformation`, `charge`, and `ui`
- Minimum level: `warn` for blocked or source-open outcomes, `debug` for shift-plan summaries
- Browser/manual debug entry: filtered URL using `conformation,charge,ui`

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4
- Lead gate: only if the example cannot be recreated without widening current P7B scope
- Data / Validation mode: not expected

Manual acceptance:

- user verifies the live lane reads like the page-53 shifting example and that the shift preview is visually distinct from charge-start slide

Stop condition:

- stop if matching the example would require unapproved new shifting behavior

Expected result: one page-53 conformation example becomes a stable live drill.

Closeout 2026-05-26:

- Repositioned the existing `CFD-E1` B2 shifted-neighbor anchor so the lane uses the already approved P7B single-blocker shift path instead of adding new legality.
- The `CFD-E1` flow now starts a normal charge from B1 to A1, resolves no-evade, and exposes a ready front conformation plan plus a ready rear shift for B2.
- Added focused validation for scenario geometry, reducer-owned conformation/shifting state, battlefield conformation ghost rendering, and command-panel shift explanation copy.
- Added the stable conformation candidate selector `data-conformation-candidate-id` and documented the live `CFD-E1` smoke flow in `docs/browser-automation.md`.
- Automated validation passed with `node --test src/data/conform-drill-scenarios.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js`.
- Touched-file diagnostics were clean, and browser smoke passed on `http://127.0.0.1:4175/?debug=1&log=conformation,charge,ui&level=debug` for the complete `CFD-E1` no-evade flow.
- Manual acceptance and reviewer review are complete for the current support scope.
- Next exact card after acceptance: `CFD-03 - Reference Lane For CFD-E2`.

### [ ] CFD-03 - Reference Lane For `CFD-E2` - Paused / Needs Rework

Goal: stage `rv2-p53-incomplete-conformation-a` as the canonical future incomplete-conformation drill without faking unsupported multi-unit behavior.

Planned files:

- `CFD-01` scenario files
- later multi-unit conformation board(s)
- CONFORM_DRILL_todo.md

Implementation steps:
1. Recreate the start geometry and example metadata.
2. Determine whether the current approved engine can represent any honest subset of the example.
3. If not, keep the lane explicitly blocked or reference-only with its named multi-unit or support blocker.
4. Only promote the lane to live interactive status after a later approved conformation board closes the blocker.

Non-goals:

- no hidden multi-unit solver
- no fake support-network shifts
- no late-turn auto-resolution

Validation:

- metadata or scenario tests if a reference lane is added
- future focused engine tests only when the blocker is actually addressed

Logging / instrumentation expectations:

- Areas: `ui` and `conformation`
- Minimum level: `warn` for deferred or blocker state
- Browser/manual debug entry: filtered URL using `conformation,ui`

Role routing:

- Implementing role: Lead / Phase Steward for blocker triage first, then Coding Agent / GPT-5.4 only after approval
- Required review: Reviewer / Rules Agent / GPT-5.4 before any lane is upgraded from reference-only to live
- Lead gate: yes
- Data / Validation mode: not expected

Manual acceptance:

- user confirms that the lane is either honestly deferred or, later, truly supported

Stop condition:

- stop as soon as the lane would require unapproved multi-unit or support-network logic

Expected result: the incomplete-conformation book example is tracked in-product without overclaiming support.

Attempted implementation note 2026-05-26:

- A first six-token selector/reference attempt for B1/B2/B3 versus A1/A2/A3 exists, while preserving the original `conform-drill-cfd-e2-reference-anchor` selector as the B1 anchor.
- Kept `CFD-E2` explicitly deferred with blocker metadata: `Requires multi-unit in-contact and support-network-aware conformation.`
- Added `data-unit-scenario-blocker` to battlefield unit tokens so browser/manual smoke can verify deferred-lane honesty directly in the DOM.
- Did not add conformation legality, multi-unit solving, support-network shifts, or late-turn auto-resolution.
- Automated validation passed with `node --test src/data/conform-drill-scenarios.test.js src/ui/p0-battlefield.test.js` and the broader focused suite `node --test src/data/conform-drill-scenarios.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js`.
- Browser reference smoke passed on `http://127.0.0.1:4176/?debug=1&log=conformation,ui&level=debug`: all six `CFD-E2` anchors reported `rv2-p53-incomplete-conformation-a`, `deferred`, and the explicit multi-unit/support-network blocker.
- Reviewer/manual follow-up found the geometry is not yet source-faithful enough to accept as a reference lane, and broader page-53 examples need missing rule implementations.
- This board is paused here; do not continue to `CFD-04` until the missing conformation systems are approved and implemented or the user explicitly reopens reference-only geometry work.

### [ ] CFD-04 - Terrain Reference Lane For `CFD-E3`

Goal: keep `rv2-p53-conformation-terrain-a` as the named future terrain-backed conformation drill.

Planned files:

- CONFORM_DRILL_todo.md
- future terrain and conformation boards

Implementation steps:
1. Preserve the example ID, caption, and blocker in the scenario plan.
2. Revisit only after terrain and terrain-sensitive conformation choice have an approved board.
3. When reopened, add the lane as a terrain-choice validation surface, not as a disguised general terrain phase.

Non-goals:

- no terrain engine now
- no placeholder legality claims that terrain is already supported

Validation:

- planning only until a terrain slice exists

Logging / instrumentation expectations:

- non-goal until implementation starts

Role routing:

- Implementing role: Lead / Phase Steward until a terrain phase is approved
- Required review: Reviewer / Rules Agent when reopened
- Lead gate: yes
- Data / Validation mode: optional only if terrain tables or data move at the same time

Manual acceptance:

- user confirms that terrain remains explicitly deferred for this lane

Stop condition:

- stop unless terrain and terrain-choice conformation are approved work

Expected result: the terrain example stays visible in planning and cannot be forgotten or quietly simplified away.

### [ ] CFD-05 - Flank-Fallback Reference Lane For `CFD-E4`

Goal: track `rv2-p53-incomplete-flank-conforming-a` as the future drill for flank-to-front fallback and later-turn follow-up.

Planned files:

- CONFORM_DRILL_todo.md
- future conformation and terrain boards

Implementation steps:
1. Preserve the example geometry, caption, and fallback semantics in planning.
2. Wait for approved support for the blocked flank or rear fallback plus later-turn follow-up behavior.
3. Promote to a live lane only after the engine can represent the example honestly.

Non-goals:

- no fake later-turn defender conformation
- no hidden terrain approximation

Validation:

- planning only until prerequisites exist

Logging / instrumentation expectations:

- non-goal until implementation starts

Role routing:

- Implementing role: Lead / Phase Steward until prerequisites are approved
- Required review: Reviewer / Rules Agent when reopened
- Lead gate: yes
- Data / Validation mode: not expected

Manual acceptance:

- user confirms that the lane stays deferred until the right systems exist

Stop condition:

- stop unless flank-fallback and later-turn follow-up behavior are explicitly in scope

Expected result: the fourth page-53 example is preserved as a real future target, not a forgotten note.

### [ ] CFD-06 - Browser Runbook And Golden Example Handoff

Goal: turn the supported `Conform Drill` lanes into stable browser smoke and later golden-validation anchors.

Planned files:

- docs/browser-automation.md
- CONFORM_DRILL_todo.md
- future focused tests

Implementation steps:
1. Record selectors and lane-entry steps for each supported `Conform Drill` example.
2. Link supported lanes to focused tests or golden fixtures where practical.
3. Keep deferred lanes marked as reference-only until their blockers are gone.

Non-goals:

- no new scenario logic
- no phase-scope widening

Validation:

- browser smoke for each supported lane
- focused tests only for truly supported example behavior

Logging / instrumentation expectations:

- Areas: `conformation`, `charge`, and `ui`
- Minimum level: `warn` and `debug`
- Browser/manual debug entry: filtered URL using `conformation,charge,ui`

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4
- Lead gate: only if deferred lanes are being upgraded
- Data / Validation mode: not expected

Manual acceptance:

- user confirms the supported lanes are useful as reference drills and smoke cases

Stop condition:

- stop if the runbook would imply support for a lane that is still deferred

Expected result: supported source-backed conformation drills become stable validation anchors.