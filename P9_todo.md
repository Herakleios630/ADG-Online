# P9 - Melee Combat System

Status: [ ] In progress - `P9-00`, `P9-01`, and `P9-02` are complete; `P9-03` is now in progress with queue/batch foundations, deterministic placement closure (`P9-03Z`), contact-graph multiple-attack wiring (`P9-03M`), commander engagement wiring (`P9-03N`), and first-contact round-state timing hooks (`P9-03V`) complete; the next follow-up card is `P9-03O`.

Active task list: see this board.

Legacy execution note (2026-05-29): this board is now frozen as historical documentation for P9 V1.

- New melee planning/execution board: `P9_v2_todo.md`
- Legacy code policy: keep V1 files as documentation, do not expand V1 feature logic
- Runtime policy: V2 is the active integration target after start-card validation

## P9 V2 Migration Overlay (Planning Sync)

Source of truth for active V2 execution:

- `P9_v2_todo.md`

Wave mapping summary:

- Wave A (foundation/direct integration): legacy open cards `P9-03A` through `P9-03D`, `P9-03H`, `P9-03J`
- Wave B (core semantics): legacy open cards `P9-03`, `P9-03O`, `P9-03Q`, `P9-03S`, `P9-03U`, `P9-03W`
- Wave C (UX/flow completion): legacy open cards `P9-03E`, `P9-03F`, `P9-03G`, `P9-03I`, `P9-03K`
- Wave D (special families): legacy open cards `P9-04A`, `P9-04B`, with `P9-04` retained as umbrella legacy reference
- Wave E (closeout): legacy open card `P9-05`

V2 gates:

- no guessed source closure for p.22 or flank/rear families; unresolved lanes remain explicit `source-open`
- no new feature edits in legacy melee implementation files
- V2 is the active reducer/UI execution path
- UI decision gate must be answered before UI implementation wave starts
- Reviewer / Rules Agent sign-off required for rule-sensitive wave closeouts

V2 coding-agent start card:

- `P9V2-01` in `P9_v2_todo.md` (V2 skeleton + direct runtime wiring, no legacy expansion)

Goal: implement the first honest melee slice with the same source discipline used for P8 shooting: the active player chooses which melees to resolve, the UI shows the queued fights and their breakdown, and results are applied only after the full chosen set has been resolved.

## Phase Rules

- Melee follows movement and shooting.
- The phasing player chooses the local resolution order, but melee outcomes are simultaneous.
- This phase must not move legality, contact classification, or support ownership into rendering code.
- Camp assault, fortification, obstacle, and war-wagon branches are special melee families and must stay explicit.
- `Rules_v2` melee examples must be classified in this board as live scenarios, tutorial entries, golden fixtures, or deferred references before closeout.
- Do not claim melee is tournament-complete until the ordered factor/modifier pipeline and example mapping are source-honest.

## Dependencies

- P8 approved and accepted.
- Relevant melee source-lock baseline accepted from the Rules-v2 pass: `docs/source/Rules_v2.md` plus `docs/rules/melee.md`, `docs/rules/conformation.md`, and the narrowed melee items in `docs/rules/open-verification.md`.
- Contact and support classification from conformation.
- Rule table data model for combat factors.
- Deterministic dice/random module.

## Success Criteria

- Dice rolls are deterministic from seed and logged actions.
- Melee calculations show full factor/modifier breakdown.
- Cohesion loss is applied from the rule table.
- Errata-sensitive abilities are tested.
- UI presents combat resolution without owning combat logic.
- `Rules_v2` melee examples are classified in the active P9 board as live scenarios, tutorial entries, golden fixtures, or deferred references before P9 implementation starts.
- User approves P9 before P10 begins.

## Current Planning State

- P9 is the next core combat phase after the shooting closeout.
- The first implementation slice should mirror the P8 pattern only where that pattern matches melee: active-player selection, queued resolution, explicit breakdown, and one combined apply step after all chosen combats are processed.
- Unlike shooting, melee should not introduce a player-switching flow; the active player stays in control until the selected melee batch is fully resolved.
- The start-of-phase popup should summarize eligible melee work, and the end-of-phase summary should show what resolved, what was blocked, and what remains for later in the sequence.
- The source-boundary for P9 is the p.60-p.67 melee set, including support roles, multiple attacks, modifiers, camp assault, fortification/obstacle cases, and war-wagon special handling.
- `P9-01` is complete: contact-role classification is now evidence-first, corner-only is excluded as non-contact, rear-or-flank ambiguity remains explicit source-open, and focused role tests are green.
- `P9-02` is complete with a deterministic resolver seam: staged modifier pipeline (`support`, `situation`, `terrain`, `die`, `final-result`) plus differential/loss-table mapping and source-open diagnostics for unverified factor/modifier inputs.
- `P9-02` is now closed with reviewer-approved source-status hardening: missing source status on unit-explicit factors and derived modifier contexts now stays `source-open` instead of silently defaulting to `verified`.
- `P9-03` has started with a first state seam: active-player order-preserving melee queue construction, pending simultaneous preview records, and a single batch-end cohesion/rout application plan.
- `P9-03X` is complete: melee drill fixtures now support deterministic token-authored placement intents with explicit blocked diagnostics for out-of-scope front-enemy alias selection.
- `P9-03Y` is complete: catalog-versus-resolver review is recorded pattern by pattern with explicit exact, mis-mapped, underdetermined, and blocked outcomes.
- `P9-03Z` is complete: placement formulas and token routing now resolve to deterministic exact-or-blocked outcomes, with flank-support tokens kept source-open (`needs-source-check`) until endpoint wording is explicitly tightened in the catalog.
- Combat-factor table binding values remain intentionally deferred (no guessed p22 values added), and flank/rear combat-factor-to-`0` plus cancellation families remain explicitly incomplete/open-verification for later cards.
- Workflow lock requested on 2026-05-28: first playable melee UX must run with exactly two front-to-front melee pairs in the drill scenario, start-of-melee overview popup, per-pair resolution popup flow, deferred simultaneous apply, and end-of-melee summary popup before P10 rout/pursuit work.

## Next-Card Chain (Post P9-03TF Freeze)

Execution order baseline after accepted `P9-03TF` freeze:

Priority insertion (must run first):

- `P9-03Z` - Placement Pattern Formula Corrections And Deterministic Exactness Gate (complete)

Recently completed bridge slice:

- `P9-03X` - Placement Catalog Scenario-Builder Bridge
- `P9-03Y` - Placement Pattern Validator And Closure Review

1. `P9-03T` - Combat Factor Table Closure Wave 2 (Mounted Lanes)
2. `P9-03P` - Support Role Completion (Simple vs Melee Support)
3. `P9-03M` - Contact Graph And Multiple Attacks
4. `P9-03O` - Flank/Rear Deterministic Branches And Cancellations
5. `P9-03OA` - Movement-Phase Flank Trigger Bridge (to-zero + immediate cohesion trigger handoff)
6. `P9-03V` - First-Contact Round State + Ability Timing Hooks
7. `P9-03N` - Commander Engagement Wiring (Errata-Conform)
8. `P9-03S` - Commander Presence Scenarios (Attached And Included)
9. `P9-03Q` - Melee Participation Gating Unification (UI/Reducer)
10. `P9-03U` - Debug Override Parity (Dice) + Resolution Result Panel
11. `P9-03W` - Cohesion Loss Marker UX (Pending Grey -> Committed Red)
12. `P9-03K` - First Playable Melee UX Lock (2x Front-To-Front + 1x Flank Pair)
13. `P9-03` - Simultaneous Resolution And Batch Apply (closeout pass)
14. `P9-04A` - Special Family Branches (Camp/Fortification/Obstacle)
15. `P9-04B` - War-Wagon Special Family
16. `P9-05` - Example Scenarios And Closeout Packet

Ordering rule:

- if a card in this chain reveals unresolved source risk for a downstream card, pause and route to Reviewer / Rules Agent before continuing.

## P9-03 Gap Analysis Snapshot (2026-05-28)

Observed runtime miss states behind missing player-facing melee flow:

- `P9-03` state helpers currently exist only in `src/state/p9-melee.js` and tests, but are not wired into the active app reducer/UI flow.
- New game menu and app actions expose charge/conform/shooting entries only; there is no melee drill entry/action in `src/ui/p0-app.js`.
- Scenario data has no melee drill source file; current scenario files are charge/conform/shooting only under `src/data/`.
- Round dialog stack has a shooting-specific announce popup and a generic placeholder popup for non-shooting phase-announce, but no dedicated melee start/end popup in `src/ui/battlefield-dialogs.js`.
- Battlefield UI renders setup/round/shooting/charge dialogs, but no melee queue/preview/apply dialog wiring in `src/ui/p0-battlefield.js`.
- Command panel derives a full shooting flow when phase is `shooting`, but no equivalent melee branch in `src/ui/battlefield-command-panel.js`.
- State bootstrap creates/reset slices for movement/shooting/charge, but no dedicated melee state slice in `src/state/p0-battle-start.js`.

Execution todos to close these gaps before further P9-03 closeout:

- [ ] `P9-03A` Add melee drill/start entrypoint in shell and reducer action map (`src/ui/p0-app.js`, `src/state/p0-state.js`).
- [ ] `P9-03B` Add first source-backed melee drill scenario data plus focused scenario tests (`src/data/melee-drill-scenarios.js`, tests).
- [ ] `P9-03C` Add dedicated melee phase state model (queue, selected order, preview records, batch apply plan, popup status) to game bootstrap/reset (`src/state/p0-battle-start.js`, `src/state/p0-state-initializers.js`, `src/state/p0-state.js`).
- [ ] `P9-03D` Wire `createMeleeBatchQueue`, `resolveMeleeBatchPreview`, and `buildMeleeBatchApplicationPlan` into reducer actions and phase transitions (`src/state/p9-melee.js`, `src/state/p0-state.js`, `src/state/p0-round.js`).
- [ ] `P9-03E` Implement melee start popup (eligible fights + queued selection UX) and melee end popup (resolved/blocked/remain summary) (`src/ui/battlefield-dialogs.js`, `src/ui/p0-battlefield.js`).
- [ ] `P9-03F` Add melee branch to command panel with active-player queue ordering controls and read-only breakdown cards (`src/ui/battlefield-command-panel.js`).
- [ ] `P9-03G` Ensure shooting-to-melee handoff opens real melee workflow instead of placeholder continuation copy (`src/state/p0-state.js`, `src/ui/battlefield-dialogs.js`).
- [ ] `P9-03H` Add regression tests for menu entry, scenario start, melee popup visibility, queue ordering, pending-simultaneous preview, and batch-end apply semantics (`src/ui/*.test.js`, `src/state/*.test.js`).
- [ ] `P9-03I` Run browser smoke in battlefield flow for melee start popup, queue ordering interaction, and batch-end apply confirmation.
- [ ] `P9-03J` Keep source-honesty guardrails explicit in this slice: no guessed p22 combat-factor bindings and no silent closure of flank/rear combat-factor-to-`0` and cancellation families; unresolved branches must stay source-open diagnostics.

## Cards

### [x] P9-00 - Melee Source Mapping And Board Lock

Goal: classify the p.60-p.67 example crops and lock the first approved melee slice before implementation.

Planned files:

- P9_todo.md
- roadmap.md
- RULEBOOK_EXAMPLES_todo.md if any example is deferred instead of implemented now
- docs/rules/melee.md
- docs/rules/open-verification.md if a source-open melee item needs narrowing

Implementation steps:
1. Re-check the melee source baseline against `docs/source/Rules_v2.md` and the current melee summary docs.
2. Classify each p.61-p.67 example as live scenario, tutorial entry, golden fixture, or deferred reference.
3. Lock the first P9 implementation subset and note explicit non-goals.
4. Update `roadmap.md` to reflect the approved P9 start state.
5. Hand off the approved slice to the Coding Agent.

Non-goals:

- no combat-factor implementation yet
- no UI overhaul beyond planning and board wording
- no broad melee rule expansion beyond the approved first subset

Validation:

- source check against `docs/source/Rules_v2.md`
- board consistency check against `docs/rules/melee.md`
- `RULEBOOK_EXAMPLES_todo.md` cross-check if examples are deferred

Manual acceptance:

- user confirms the board and first subset boundaries before coding starts

Stop condition:

- stop if a melee example cannot be classified honestly without reopening source analysis

Expected result:

- P9 has a source-honest first implementation boundary and a resolved example-routing plan

Closeout 2026-05-28:

- p61 support examples: live scenarios for the core support spine.
- p62 melee resolution table: golden fixture for the ordered factor/modifier pipeline.
- p63 flank or rear attack: live scenario for flank/rear and multiple-attack handling.
- p64 situation modifier and height advantage: golden fixtures for modifier ordering.
- p65 melee examples: tutorial reference for combined worked-breakdown regression coverage.
- p66 attacking the camp: live scenario for the dedicated camp-assault branch.
- p67 war-wagon support: live scenario in P9, not a P10 rout/pursuit item.

- The approved first P9 slice now stays centered on support roles, combat-factor ordering, simultaneous batch apply, and the explicit special melee branches that the p.60-p.67 pages actually cover.

Role routing:

- Expected implementing role: Lead / Phase Steward
- Preferred model: GPT-5.5 for the board lock and source-risk split
- Reviewer / Rules Agent review required before any source-sensitive closeout

### [x] P9-01 - Contact Roles And Support Spine

Goal: build the first engine/state role classification for melee contact and support.

Planned files:

- src/engine/melee/*
- src/state/* melee-related reducers or selectors
- focused tests near the owning melee modules
- src/ui/* only if a read-only UI breakdown is needed for this slice

Implementation steps:
1. Model melee participants as main unit, simple support, or melee support.
2. Preserve partial conformation and `most in front` handling as owned by the rule layer, not the view layer.
3. Keep support classification serializable and explicit for later factor calculation.
4. Add focused regression coverage for front, flank, rear, and corner-only contact cases.

Non-goals:

- no full combat-factor table yet
- no camp assault branch yet
- no war-wagon or fortification special branch yet

Validation:

- focused melee-role tests
- targeted type/lint/build checks if needed for the touched slice

Manual acceptance:

- user can inspect the resolved role labels in the melee debug flow

Stop condition:

- stop if the current contact model cannot distinguish support roles without inventing new legality

Expected result:

- melee participants have a stable, testable role classification spine

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

### [x] P9-02 - Combat Factor And Modifier Pipeline

Goal: implement the ordered melee factor and modifier calculation path.

Planned files:

- src/engine/melee/*
- src/data/* for combat-factor tables if needed
- focused engine tests for resolution and modifiers
- docs/rules/melee.md if the source summary needs sharpening

Implementation steps:
1. Bind the combat-factor table used by the supported subset.
2. Separate combat factor, support, die modifier, final result modifier, immediate multiple-attack loss, and special auto-rout stages.
3. Keep quality, flank/rear, height, terrain, commander, and first-round-only effects in the correct stage.
4. Add focused examples or golden fixtures for the first supported resolution lanes.

Non-goals:

- no camp assault yet
- no victory or rout phase integration yet
- no broad army-builder data work

Validation:

- focused resolution tests
- `npm run build`

Manual acceptance:

- user can inspect the full breakdown for one supported melee case

Stop condition:

- stop if any modifier order remains ambiguous in the current source baseline

Expected result:

- melee resolution has a deterministic ordered pipeline with explicit breakdown output

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

### [x] P9-03X - Placement Catalog Scenario-Builder Bridge

Goal: anchor melee scenario authoring to `docs/placement-catalog-v1.md` so agents can build test scenarios deterministically from placement patterns instead of ad hoc coordinate edits.

Planned files:

- P9_todo.md
- docs/placement-catalog-v1.md
- src/data/melee-drill-scenarios.js
- src/data/melee-drill-scenarios.test.js
- src/state/p9-melee.test.js
- docs/rules/index.md

Implementation steps:
1. Define a single bridge contract for scenario authoring input: `unit`, `anchor`, `pattern token`, optional `ref=anchor-front-enemy`, and deterministic blocked reasons.
2. Add a compact pattern-to-geometry translation table for the currently supported P9 scenario fixtures, explicitly reusing placement-catalog tokens.
3. Require scenario fixture metadata to store placement intent payloads next to resolved coordinates so later regressions can be regenerated from intent.
4. Add focused tests that validate each referenced pattern resolves to expected side/corner contacts in at least one melee fixture lane.
5. Add explicit guardrail behavior for simple-contact-only scope: multi-front-enemy alias requests must return blocked and stay deferred to post-P16.

Non-goals:

- no new melee rule legality beyond current P9 scope
- no UI snap implementation
- no automatic disambiguation for ambiguous natural language intents

Validation:

- focused fixture tests proving token-intent and resolved-contact geometry stay aligned
- regression check that existing melee drill lanes keep stable ids, order, and support-role expectations
- source-honesty check that unresolved legality still surfaces as `needs-source-check` where applicable

Manual acceptance:

- user requests one new lane by token-based intent and verifies the generated placement matches expected anchor-side/corner contact without manual coordinate tweaking

Stop condition:

- stop if a requested lane needs multi-unit or ambiguous-front-enemy selection logic not allowed in simple-contact V1 scope

Expected result:

- AI can reliably create and update melee test scenarios from placement intents, with deterministic mapping and reproducible fixture geometry

Logging expectations:

- each scenario-generated placement action should log `patternToken`, `anchorId`, optional `refMode`, contact-check pass/fail summary, and blocked reason when not exact

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Implementation status:

- Completed in `src/data/melee-drill-scenarios.js` with `resolveMeleeDrillPlacementIntent` and scenario-level placement bridge metadata.
- Focused coverage added in `src/data/melee-drill-scenarios.test.js` and `src/state/p9-melee.test.js`.

### [x] P9-03Y - Placement Pattern Validator And Closure Review

Goal: review the placement catalog patterns one by one and separate genuinely exact geometry from patterns that are currently underdetermined, mis-mapped, or should stay source-open until the catalog is tightened.

Planned files:

- P9_todo.md
- docs/placement-catalog-v1.md
- src/data/melee-drill-scenarios.js
- src/data/melee-drill-scenarios.test.js
- src/state/p9-melee.test.js

Implementation steps:
1. Recheck each implemented pattern token against its catalog line and note whether the current pose formula is exact, mirrored correctly, or underdetermined.
2. Identify all patterns that need an explicit endpoint/corner rule to avoid the wrong edge/corner landing.
3. Split exact cases from source-open cases in the board text so future implementation does not claim more than the geometry actually proves.
4. Record the specific failure mode for each risky pattern: edge mismatch, corner mismatch, orientation mismatch, or underdetermined pattern.

Non-goals:

- no engine rewrite
- no scenario code changes in this card
- no UI work

Validation:

- catalog-to-geometry consistency review
- focused geometry notes for each token
- no code execution beyond read-only checks unless a later implementation card is opened

Manual acceptance:

- reviewer confirms which patterns are exact now and which must stay blocked or source-open until the catalog is tightened

Stop condition:

- stop once every implemented pattern token has an honest status and the remaining ambiguous ones are explicitly tracked

Expected result:

- the board cleanly distinguishes exact placement rules from patterns that still need catalog tightening or engine-side derivation

Role routing:

- Expected implementing role: Lead / Phase Steward or Coding Agent for analysis only
- Review role: Reviewer / Rules Agent if any source-sensitive wording changes are proposed

Closeout 2026-05-29:

- Scope executed as analysis-only board closure: no engine, scenario, or UI code changes in this card.
- Resolver-versus-catalog review completed for all listed V1 tokens in `docs/placement-catalog-v1.md` against `getPlacementPoseInReferenceFrame` in `src/data/melee-drill-scenarios.js`.

Pattern-by-pattern closure note:

| Token | Resolver routing status | Geometry status | Mirror status | Closure classification | Remaining failure mode |
| --- | --- | --- | --- | --- | --- |
| `simple-support-left` | implemented | matches declared side/corner lock | left base variant | exact (source status still `needs-source-check`) | none found in this slice |
| `simple-support-right` | implemented | matches mirror of left support lock | mirror of `simple-support-left` | exact mirror (source status still `needs-source-check`) | none found in this slice |
| `flank-attack-left` | implemented | does not satisfy catalog endpoint intent in current formula | has right-side mirror formula | mis-mapped, not exact | edge/corner mismatch: resulting placement aligns wrong local edge/corner pair versus catalog `front -> left` + `FL -> FL` intent |
| `flank-attack-right` | implemented | mirror of same mapping issue | mirror of `flank-attack-left` | mis-mapped mirror, not exact | mirrored edge/corner mismatch on right-side variant |
| `rear-attack` | implemented | consistent with declared rear lock in current subset | bilateral by definition | exact (source status still `needs-source-check`) | none found in this slice |
| `front-attack-full` | implemented | consistent with declared full front contact in current subset | bilateral by definition | exact (source status still `needs-source-check`) | none found in this slice |
| `front-attack-left-offset` | not implemented in resolver token set | n/a | right mirror exists in catalog only | source-open and blocked in runtime | `pattern-token-not-yet-routed-in-p9-03x` |
| `front-attack-right-offset` | not implemented in resolver token set | n/a | mirror of left-offset catalog entry only | source-open and blocked in runtime | `pattern-token-not-yet-routed-in-p9-03x` |
| `simple-support-flank-left` | implemented | currently reuses same center/orientation mapping as `simple-support-left` | has right-side mirror formula | underdetermined versus catalog wording | endpoint/corner under-specification: current formula does not encode a unique flank-side endpoint rule beyond plain support-left mapping |
| `simple-support-flank-right` | implemented | currently reuses same center/orientation mapping as `simple-support-right` | mirror of `simple-support-flank-left` | underdetermined mirror | same under-specification on mirrored side |

Alias review:

- `enemy-front-support-left` and `enemy-front-support-right` normalize to flank-support tokens with `ref=anchor-front-enemy` and stay deterministic for the simple one-front-enemy case.
- Alias path remains intentionally blocked when front-enemy selection is not unique: `non-simple-front-enemy-selection-deferred-post-p16`.

Closure outcome for P9-03Y:

- Exact in current resolver slice: `simple-support-left`, `simple-support-right`, `rear-attack`, `front-attack-full`.
- Implemented but not exact: `flank-attack-left`, `flank-attack-right`.
- Implemented but underdetermined versus catalog endpoint specificity: `simple-support-flank-left`, `simple-support-flank-right`.
- Catalog-listed but intentionally unrouted/blocked: `front-attack-left-offset`, `front-attack-right-offset`.
- All unresolved items remain explicitly source-open; no silent promotion to exact.

### [x] P9-03Z - Placement Pattern Formula Corrections And Deterministic Exactness Gate

Goal: eliminate the known placement mismatches from `P9-03Y` so flank attacks, flank-support variants, and offset front contacts resolve to deterministic exact geometry or explicit blocked diagnostics, never ambiguous partial matches.

Planned files:

- P9_todo.md
- docs/placement-catalog-v1.md
- src/data/melee-drill-scenarios.js
- src/data/melee-drill-scenarios.test.js
- src/state/p9-melee.test.js

Implementation steps:
1. Correct `flank-attack-left` and `flank-attack-right` formulas to satisfy catalog endpoint/corner constraints exactly (`front -> left/right` plus `FL/FR -> FL/FR`) instead of the currently mis-mapped edge/corner landing.
2. Split `simple-support-flank-left/right` from plain `simple-support-left/right` by introducing explicit deterministic endpoint rules; if the catalog wording remains underdetermined for a case, return a stable blocked reason instead of silently reusing plain support mapping.
3. Route `front-attack-left-offset` and `front-attack-right-offset` into the resolver with deterministic formulas and mirror guarantees, replacing the current `pattern-token-not-yet-routed-in-p9-03x` gap for these two tokens.
4. Add a post-solve constraint validator per token that checks required side/corner constraints and marks output as `exact` only when all constraints pass; otherwise emit deterministic blocked diagnostics with first-failure reason.
5. Add focused mirror and regression tests for left/right pairs and alias flows (`ref=anchor-front-enemy`) so future edits cannot regress flank placement correctness.

Non-goals:

- no UI snap system work
- no expansion to group placement or post-P16 multi-reference placement families
- no change to melee legality ownership outside scenario-authoring placement contract

Validation:

- token-by-token constraint checks for all routed V1 tokens
- explicit tests proving `flank-attack-left/right` now satisfy catalog edge/corner locks
- explicit tests proving `simple-support-flank-left/right` are either exact by dedicated rule or blocked deterministically when underdetermined
- explicit tests proving offset front-contact tokens are routed and mirror-consistent

Manual acceptance:

- user requests at least one lane each for left flank attack, right flank attack, left flank support, right flank support, and both offset front-contact variants; returned placements must match expected contact geometry without manual coordinate tweaking

Stop condition:

- stop if any required token remains ambiguous under current catalog wording without a deterministic exact-or-blocked contract outcome

Expected result:

- agents can issue flank and support placement intents with deterministic, reproducible geometry that is either exact to catalog constraints or explicitly blocked with named reasons

Logging expectations:

- every placement attempt logs token, reference mode, constraint check results, and first failing constraint when non-exact

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Closeout 2026-05-29:

- Resolver updates landed in `src/data/melee-drill-scenarios.js`:
	- corrected flank attack formulas (`flank-attack-left`, `flank-attack-right`)
	- dedicated deterministic mapping for `simple-support-flank-left/right` (no longer silent reuse of plain support formulas)
	- routed `front-attack-left-offset` and `front-attack-right-offset`
	- added post-solve constraint validator with deterministic blocked diagnostics when required constraints are not met
- Focused regression coverage added in `src/data/melee-drill-scenarios.test.js` for token routing, flank geometry, flank-support differentiation, and offset-front constraints.

Exact-vs-blocked proof (current resolver behavior):

| Token / request | Result | Evidence |
| --- | --- | --- |
| `simple-support-left` | exact | token-routing test + constraint assertions |
| `simple-support-right` | exact | token-routing test + mirror routing |
| `simple-support-flank-left` | exact | flank-support deterministic endpoint lock test |
| `simple-support-flank-right` | exact | flank-support deterministic endpoint lock test |
| `flank-attack-left` | exact | corrected flank-attack geometry test |
| `flank-attack-right` | exact | corrected flank-attack geometry test |
| `rear-attack` | exact | token-routing test |
| `front-attack-full` | exact | token-routing test |
| `front-attack-left-offset` | exact | routed offset-front constraint test |
| `front-attack-right-offset` | exact | routed offset-front constraint test |
| `simple-support-flank-left` | deterministic-choice, source-open (`needs-source-check`) | flank-support endpoint lock test + source-status assertion |
| `simple-support-flank-right` | deterministic-choice, source-open (`needs-source-check`) | flank-support endpoint lock test + source-status assertion |
| unknown token (example: `unknown-pattern-token`) | blocked | deterministic `pattern-token-not-routed` |
| alias with non-unique/absent front enemy (`ref=anchor-front-enemy`) | blocked | deterministic `non-simple-front-enemy-selection-deferred-post-p16` |

Validation run:

- `node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee.test.js` -> pass `25/25`.

### [ ] P9-03 - Simultaneous Resolution And Batch Apply

Goal: make the active player resolve a chosen melee batch while results still apply simultaneously.

Planned files:

- src/state/* melee sequencing or phase reducers
- src/ui/* melee command or popup flow
- focused tests for phase ordering and apply timing

Implementation steps:
1. Let the active player choose the melee order for the phase.
2. Queue the chosen melees and show the breakdown before applying results.
3. Apply outcomes after the chosen batch is complete, not after each individual fight.
4. Keep replay and logging hooks ready for later phases.

Non-goals:

- no new melee math beyond the supported pipeline
- no player-switching shooting-style flow
- no replay viewer work

Validation:

- focused sequencing tests
- browser smoke if the melee popup is visible in the battlefield flow

Manual acceptance:

- user verifies that queued melees resolve in chosen order but land as a simultaneous batch

Stop condition:

- stop if the UI or reducer would accidentally commit partial results too early

Expected result:

- melee keeps active-player control without losing simultaneous application semantics

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

### [ ] P9-03K - First Playable Melee UX Lock (2x Front-To-Front + 1x Flank Pair)

Goal: lock the immediate user-visible melee workflow so P9 delivers one coherent playable loop before expanding to more melee families.

Planned files:

- src/data/melee-drill-scenarios.js
- src/state/p9-melee.js
- src/state/p0-state.js
- src/ui/battlefield-dialogs.js
- src/ui/p0-battlefield.js
- src/ui/battlefield-command-panel.js
- focused tests under src/data, src/state, and src/ui

Implementation steps:
1. Provide a melee drill scenario with three engaged player-1 vs player-2 melee pairs for this slice: two direct front-to-front pairs plus one flank-contact pair with conformed front-edge alignment; optional non-melee reserves are allowed for grey-state feedback.
2. At melee phase start, show a compact popup summary with at least: main melee units count and support units count, then continue with `OK`.
3. On battlefield view after `OK`, visually classify units: non-melee units greyed out, unresolved melee participants with yellow front bar, resolved melee participants with green front bar.
4. Resolve melee pair-by-pair by explicit player click selection of a melee pair, then open a melee resolution popup that lists the full breakdown inputs and components for both sides (combat factors, computed support participation, staged modifiers, dice) with deterministic confirmation.
5. Store each resolved pair result without mutating unit outcomes immediately; mark the involved units as resolved (green) in the battlefield feedback layer.
6. After all required melee pairs are resolved, apply outcomes in one batch (simultaneous semantics), then show an end popup summarizing at least cohesion-loss count and destroyed/routed count.
7. Hand off only to rout/pursuit phase entry (P10 scope) after the end summary is acknowledged.

Non-goals:

- no expansion to flank/rear or cancellation-family completion in this card
- no guessed combat-factor table values where source binding is still open
- no P10 rout/pursuit implementation beyond the handoff trigger

Validation:

- focused tests for scenario shape (2 melee pairs), start-summary counts, per-pair resolve state transitions, deferred apply semantics, and end-summary aggregates
- browser smoke proving the full user path: start popup -> battlefield status colors/bars -> per-pair popup resolve -> final batch apply summary

Manual acceptance:

- user runs one melee drill pass and confirms the exact visual/status loop: yellow unresolved -> green resolved -> single batch outcome summary

Stop condition:

- stop if any step would require inventing unresolved factor bindings or silently closing source-open flank/rear families

Expected result:

- one stable, user-visible, source-honest melee loop matching the locked P9 training scenario expectations

Rule-conformity note (RV2 baseline):

- This workflow is aligned with current source lock: player-selected local order is allowed, while combat outcomes remain simultaneous and are committed only after the selected melee set is complete.

Progress note (2026-05-28, strict support geometry pass):

- Melee-pair eligibility now stays geometry-driven (direct contact + classified legal contact, including flank/rear boundary cases).
- Flank support counting now requires direct flank adjacency, parallel facing, and front-edge projection alignment (same forward front line), avoiding scenario-role hardcoding.
- Drill support fixture and focused tests were aligned to the stricter support geometry requirement.

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

### [ ] P9-04 - Camp Fortification And War-Wagon Branches

Goal: implement the special melee branches that must stay explicitly separate from ordinary combat.

Planned files:

- src/engine/melee/* special-branch logic
- focused tests for camp assault, fortification, obstacles, and war wagons
- src/ui/* only if a branch-specific explanation panel is needed

Implementation steps:
1. Add camp assault as a dedicated melee state.
2. Keep fortified camp, looting, and camp-obstacle consequences explicit.
3. Model fortification and obstacle contact as special geometry branches.
4. Preserve war-wagon special contact and support restrictions as a distinct family.

Non-goals:

- no general terrain refactor
- no army-cohesion phase work
- no rule expansion outside the p.65-p.67 melee families

Validation:

- focused special-branch tests
- source-backed scenario checks for camp and war-wagon cases

Manual acceptance:

- user can inspect the dedicated branch behavior without hidden rule assumptions

Stop condition:

- stop if one of the special branches would require a broader rules rewrite to stay honest

Expected result:

- camp, fortification, obstacle, and war-wagon melee stay separate and testable

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

### [ ] P9-05 - Example Scenarios And Closeout Packet

Goal: route the p.61-p.67 worked examples into the repository as honest scenario/reference fixtures and close P9 with a validation packet.

Planned files:

- P9_todo.md
- rule/example scenario files under src/data, src/engine, or src/ui as appropriate
- RULEBOOK_EXAMPLES_todo.md if examples remain deferred
- roadmap.md

Implementation steps:
1. Implement the supported melee examples as live scenarios or golden fixtures where the source fit is exact.
2. Keep any unsupported branches explicitly deferred rather than silently widened.
3. Run the focused melee tests and the repository build.
4. Record the closeout packet and remaining source-open items.
5. Request Reviewer / Rules Agent review before marking P9 complete.

Non-goals:

- no P10 rout/pursuit work
- no broad tutorial framework
- no hidden source assumptions for camp or war-wagon edge cases

Validation:

- focused melee suite
- `npm run build`
- browser smoke if the melee scenario is exposed in the battlefield flow

Manual acceptance:

- user reviews one or more source-backed melee scenarios against the book crops

Stop condition:

- stop if the example reconstruction reveals a contradiction that belongs in a future source pass

Expected result:

- P9 ends with a source-honest melee closeout packet and clear follow-up scope

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

## Findings-Driven Closeout Cards (2026-05-28)

Current card status:

- `P9-03` is playable as a drill workflow, but not closeout-ready for rule-complete melee.
- The cards below split closeout work into executable rule-closure slices with explicit source gates.

### [x] P9-03L - Combat Factor Table Binding (p.22 + Errata)

Goal: replace manual primary factor input with source-bound combat-factor table binding and keep UI factor edits as debug fallback only.

Planned files:

- src/engine/melee/resolution.js
- src/data/unit-profiles.js and/or dedicated melee factor data file
- src/ui/battlefield-dialogs.js
- src/engine/melee/resolution.test.js
- src/state/p9-melee.test.js

Implementation steps:
1. Bind combat factors from verified profile/table data (p.22 + errata cross-check) in resolver-owned logic.
2. Mark factor source status as `verified` only for truly source-closed bindings; keep unresolved lanes as explicit `source-open` diagnostics.
3. Downgrade manual attacker/defender factor selects to explicit debug/fallback path so normal flow uses bound values.
4. Update factor breakdown rendering to show bound source and fallback provenance.

Non-goals:

- no flank/rear-to-0 or cancellation branch completion in this card
- no special-object family implementation (camp/fortification/war-wagon)
- no P10 rout/pursuit scope

Validation:

- focused resolver tests for bound factor lookup, source status integrity, and fallback isolation
- focused state/UI tests proving default flow resolves without manual factor edits when source-closed

Manual acceptance:

- user verifies one melee pair resolves with bound factors while debug override remains opt-in only

Stop condition:

- stop if p.22/errata table transcription cannot be confirmed source-honestly

Expected result:

- combat factors are reducer/engine-owned from source-bound data, not user-entered as primary path

Source gates:

- keep `docs/rules/open-verification.md` item `melee.main-unit-support-multiple-attack-and-modifiers` open until p.22 binding + errata check is explicitly confirmed

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Progress:

- Resolver now binds verified p.22 infantry lanes for the representative `medium swordsmen` and `heavy spearmen` drill profiles without manual factor entry.
- Representative cavalry and LI-javelin lanes stay explicit `source-open` until direct cavalry/impact errata wording and javelin taxonomy closure are transcribed into rule data.
- Melee dialog now defaults to bound factor presentation and exposes manual factor selects only behind an explicit debug override toggle.
- Follow-up requested by user: keep this card closed as delivered slice, but run the next closure wave to approve more p.22 lanes (especially cavalry-vs-cavalry) and mirror the same debug-gated UX pattern for dice input and result visibility cards below.

### [x] P9-03M - Contact Graph And Multiple Attacks

Goal: replace one-attacker/one-defender queue assumptions with contact-graph pairing and add immediate multiple-attack effects before normal melee resolution.

Planned files:

- src/state/p9-melee.js
- src/engine/melee/roles.js
- src/engine/melee/resolution.js
- src/state/p9-melee.test.js
- src/state/p0-state-melee.test.js
- src/data/melee-drill-scenarios.js

Implementation steps:
1. Build queue candidates from contact graph (N:M capable), not first-hit attacker pairing plus defender lockout.
2. Preserve deterministic ordering while allowing several simultaneous contacts against one defender where legal.
3. Add immediate multiple-attack effect lane before ordinary melee resolution/apply path.
4. Keep diagnostics explicit when ambiguous contact families still remain source-open.

Non-goals:

- no commander integration in this card
- no flank/rear-to-0 cancellation family closure in this card
- no special-object family implementation

Validation:

- focused state tests for multi-contact queue generation and deterministic order
- focused resolver/state tests for immediate multiple-attack cohesion-loss timing
- drill scenario regression with at least one legal multi-attack lane

Manual acceptance:

- user confirms one defender can appear in multiple legal contacts and immediate loss occurs before normal pair results

Stop condition:

- stop if deterministic order and simultaneous apply cannot be preserved together without reopening model boundaries

Expected result:

- multiple attacks are represented and resolved in the correct timing lane instead of being silently dropped by queue construction

Source gates:

- keep unresolved rear/flank ambiguity paths source-open and diagnostic-only

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Progress:

- Queue candidate construction now uses a deterministic contact graph (N:M capable), replacing defender-lockout first-hit pairing so one defender can be queued against multiple legal attackers.
- Melee preview now consumes an explicit immediate `multiple-attack-immediate` trigger from the contact-generation slice instead of inventing it from queue multiplicity; unresolved multi-contact lanes stay diagnostic/source-open until the upstream contact phase owns the trigger.
- Draft selection by `unitId` now records an ambiguity diagnostic when a unit belongs to multiple queue entries and deterministically selects the first candidate until dedicated UI disambiguation is added.
- Focused validation passed: `node --test src/state/p9-melee.test.js src/state/p0-state-melee.test.js src/data/melee-drill-scenarios.test.js`.

Closeout follow-up 2026-05-29:

- Combat-group attacker ownership is now role-aware in `src/state/p9-melee.js`: geometry-only candidates are filtered so support-role units and explicit wrong-opponent lanes are excluded from grouped attacker ownership.
- Grouped melee-support conversion is no longer applied as a blanket `additionalAttackers -> +1` rule; grouped support entries now require explicit `melee-support` role binding to the same defender.
- Support-context interpretation is now fixed for grouped resolution: flank/rear melee-support occupancy displaces same-side simple-support (`17/18` style lanes are excluded when `19/20` style flank melee support exists), with explicit draft diagnostics for displaced supports.
- Additional grouped main-attacker contribution remains explicit `source-open` only for non-support residual families, without introducing a separate lane in this support-context slice.
- Focused regressions added for both bug classes (same-side simple-support inflation and wrong-opponent geometric-contact inclusion), and full focused melee/UI regression rerun passed.

### [x] P9-03N - Commander Engagement Wiring (Errata-Conform)

Goal: derive melee commander modifiers from actual command/unit state (attached/included/engaged) instead of optional ad hoc context flags. Scope is engagement wiring only.

Planned files:

- src/state/p9-melee.js
- src/engine/melee/resolution.js
- src/state/p0-state.js
- src/state/p9-melee.test.js
- src/engine/melee/resolution.test.js

Implementation steps:
1. Map commander participation state into melee input pipeline from canonical game state.
2. Encode errata boundary: melee-support commander state must not be treated as fighting main-unit commander bonus.
3. Keep explicit diagnostics for any commander state not yet source-closed.
4. Surface commander contribution clearly in staged modifier breakdown.

Non-goals:

- no CP/order-cost redesign
- no commander movement/attach lifecycle overhaul outside melee-input ownership
- no commander persistence or detach-combat-lock timing closure across later melee rounds
- no mandatory round-to-round commander lock behavior in this card
- no mandatory commander-factor visibility in the overview UI (optional visibility remains allowed)
- no special-object family work

Validation:

- focused resolver tests for attached/included/engaged cases and errata exclusions
- focused state tests that commander modifier is state-derived without manual input injection
- closeout evidence for this card is limited to attached/included/support-only derivation and errata-boundary behavior only

Manual acceptance:

- user verifies one engaged commander case and one melee-support-only case produce different outcomes

Stop condition:

- stop if commander state semantics conflict with unresolved command lifecycle source blockers

Expected result:

- commander effects in melee are deterministic, state-derived, and errata-conform

Source gates:

- cross-check against errata commander engaged-in-combat wording before marking this card done
- keep commander persistence and detach-combat-lock timing source-open and deferred to `P9-03V` plus `docs/rules/open-verification.md` IDs `command.commander-attach-detach-legality` and `command.commander-detach-combat-lock-timing`
- maintain engagement boundary anchor only for this card: `docs/rules/errata.md` commander narrowing and `docs/rules/melee.md` commander participation split; do not silently promote round-to-round persistence claims here
- route any ambiguity on detach/combat-lock wording to Reviewer / Rules Agent before coding persistence enforcement

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Progress:

- Melee draft construction now derives commander engagement context from canonical unit/command state (`hasIncludedCommander`, `attachedCommanderId`, commander reverse-link, and command-context attachment fallback) instead of optional ad hoc booleans.
- Resolver commander bonus now accepts structured commander context and enforces errata boundary: `support-only` commander participation never grants main-unit engaged-commander bonus.
- Focused coverage added for included, attached, and support-only commander lanes in `src/state/p9-melee.test.js` and `src/engine/melee/resolution.test.js`.
- Reviewer handoff packet prepared: `docs/agents/p9-03n-review-handoff.md`.

Closeout evidence draft (scope-locked to P9-03N):

- Evidence set intentionally excludes persistence-enforcement behavior and any mandatory round-to-round commander lock claims.
- State derivation evidence:
	- `P9-03N derives included commander participation from main-unit state` (`src/state/p9-melee.test.js`)
	- `P9-03N keeps melee-support commander as support-only and excludes main-unit commander bonus` (`src/state/p9-melee.test.js`)
	- `P9-03N resolves attached commander selection to the host melee entry in drill lane` (`src/state/p9-melee.test.js`)
	- `P9-03N reports attached commander drill token with host melee status` (`src/state/p9-melee.test.js`)
- Errata-boundary resolver evidence:
	- `P9-03N applies attached/included commander bonus and excludes support-only commander state` (`src/engine/melee/resolution.test.js`)
- Focused validation run (2026-05-29):
	- `node --test src/state/p9-melee.test.js src/engine/melee/resolution.test.js` -> pass `39/39`.

Closeout 2026-05-29:

- Reviewer / Rules Agent verdict: `Approved` with explicit scope lock to engagement wiring + errata boundary only.
- Source-status honesty preserved: commander persistence and detach/combat-lock timing remain open and deferred to `P9-03V` + open verification IDs `command.commander-attach-detach-legality` and `command.commander-detach-combat-lock-timing`.
- Card closure accepted without adding persistence-enforcement behavior in this slice.

### [ ] P9-03O - Flank/Rear Deterministic Branches And Cancellations

Goal: implement explicit flank/rear branches including defender-factor-to-0 conditions for formed troops, explicit flank/rear situation bonuses, and cancellation families instead of generic context bonus only.

Planned files:

- src/engine/melee/resolution.js
- src/state/p9-melee.js
- src/engine/melee/resolution.test.js
- src/state/p9-melee.test.js
- docs/rules/melee.md (if wording needs narrowing)

Implementation steps:
1. Consume the frozen flank/rear and modifier-stage baseline from `P9-03TF` without redefining lane semantics.
2. Add explicit flank/rear branch predicates tied to conformation/contact evidence.
3. Implement defender combat-factor-to-0 conditions for formed troops in source-closed lanes when flank/rear branch preconditions are met.
4. Implement cancellation families as dedicated branch logic, not ad hoc modifier subtraction.
5. Implement explicit flank/rear bonus lanes as source-owned branches rather than optional UI context flags.
6. Keep unresolved edge families source-open with diagnostics instead of guessed closure.

Non-goals:

- no multiple-attack queue redesign (owned by P9-03M)
- no camp/fortification/war-wagon special families
- no P10 routing changes

Validation:

- focused resolver golden tests for flank/rear to-0 and cancellation interactions
- focused state tests that branch evidence comes from contact/conformation, not UI flags

Manual acceptance:

- user verifies at least one flank and one rear case where branch outcome differs from generic modifier-only behavior
- user verifies one formed-troop flank case where defender factor drops to `0` only when branch preconditions are satisfied

Stop condition:

- stop if branch closure would require inventing unresolved errata interactions

Expected result:

- flank/rear effects are first-class deterministic branches with explicit cancellation handling

Source gates:

- confirm branch predicates and cancellation wording against melee source + errata before closeout

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Execution dependency:

- start only after `P9-03TF` is reviewed and accepted

Progress (first resolver slice 2026-05-29):

- Added first branch-owned flank/rear resolver hook in `src/engine/melee/resolution.js` for explicit defender-factor-to-`0` application via `modifierContext.flankRearBranch.applyDefenderCombatFactorToZero`.
- Branch-owned to-`0` entries stay source-honest: unresolved branch status (`sourceStatus != verified`) is surfaced as `source-open` through existing modifier diagnostics instead of silent application.
- Added first cancellation hook in derived flank/rear situation handling: when `modifierContext.flankRearBranch.cancelAttackSituationBonus` is active, the generic flank/rear `+1` situation bonus is no longer auto-applied; unresolved cancellation evidence remains `source-open`.
- Focused resolver coverage added in `src/engine/melee/resolution.test.js`:
	- `P9-03O applies source-closed flank/rear defender-factor-to-zero branch deterministically`
	- `P9-03O keeps unresolved flank/rear to-zero branch source-open instead of silently applying it`
- Step 1 completed: state draft construction now derives `attackerModifierContext.flankRearBranch` / `defenderModifierContext.flankRearBranch` from contact/conformation evidence (`meleeContactEvidence`/`conformationApplied`) instead of UI-only flags.
- Ambiguous `rear-or-flank` evidence now stays explicit source-open in state via diagnostic code `melee.flank-rear.branch-source-open-ambiguous` and branch `attackContactType: rear-or-flank`.
- Step 2 completed: focused tests now cover evidence-first branch mapping and branch predicates:
	- `P9-03O derives flank branch context from contact evidence into draft modifier context` (`src/state/p9-melee.test.js`)
	- `P9-03O keeps rear-or-flank ambiguity as source-open branch diagnostic in draft context` (`src/state/p9-melee.test.js`)
	- `P9-03O branch cancellation can suppress generic flank/rear +1 situation bonus` (`src/engine/melee/resolution.test.js`)
- Focused validation passed after Step 1+2: `node --test src/state/p9-melee.test.js src/engine/melee/resolution.test.js` (`50/50` pass).
- Follow-up Step 1 completed (strict predicates): to-zero branch closure now requires source-closed evidence for flank/rear contact type, full conformation evidence, and formed/non-light attacker classification; otherwise the branch stays source-open with `melee.flank-rear.to-zero-branch-source-open`.
- Follow-up Step 2 completed (cancellation matrix): cancellation is now branch-family owned in resolver (`rear-contact-formed`, `flank-contact-formed`); unresolved/unknown families remain source-open and emit branch source-open diagnostics rather than silently suppressing flank/rear `+1`.
- Additional focused coverage added:
	- `P9-03O keeps to-zero branch source-open when conformation evidence is incomplete` (`src/state/p9-melee.test.js`)
	- `P9-03O keeps to-zero branch source-open for light troop attackers even with explicit eligibility flag` (`src/state/p9-melee.test.js`)
	- `P9-03O keeps cancellation branch source-open when cancellation family is unresolved` (`src/engine/melee/resolution.test.js`)
- Focused validation rerun after follow-up slice: `node --test src/state/p9-melee.test.js src/engine/melee/resolution.test.js` (`53/53` pass).
- Formed-troop proof hardening completed: `to-zero` closure no longer assumes `formed` from non-light fallback alone; explicit formed-troop evidence is now parsed (`formedTroop`, `attackerTroopFormation`/`attackerFormation`/`troopFormation`) and combined with profile-base formed proof before closure.
- If formed proof is not source-closed (`unformed`/`unknown`/missing source closure), `to-zero` stays blocked and source-open with explicit branch diagnostics.
- Added focused non-light-unformed guard test: `P9-03O blocks to-zero for non-light attackers when formed-troop evidence is explicitly unformed` (`src/state/p9-melee.test.js`).
- Focused validation rerun after formed-proof hardening: `node --test src/state/p9-melee.test.js src/engine/melee/resolution.test.js` (`54/54` pass).
- Added focused unknown-formed guard test: `P9-03O blocks to-zero when formed-troop evidence is unknown and keeps branch source-open` (`src/state/p9-melee.test.js`).
- Focused validation rerun after unknown-formed guard: `node --test src/state/p9-melee.test.js src/engine/melee/resolution.test.js` (`55/55` pass).
- Cancellation wave-2 completed (branch-owned matrix tightening):
	- State now infers formed cancellation families from source-closed rear/flank + full-conformation evidence when explicit cancellation is present and no family is supplied.
	- Resolver now requires cancellation family/contact-type match (`rear-contact-formed` with rear, `flank-contact-formed` with flank); mismatch remains source-open instead of silently suppressing flank/rear `+1`.
- Added focused cancellation wave-2 coverage:
	- `P9-03O infers formed cancellation family from source-closed rear contact evidence` (`src/state/p9-melee.test.js`)
	- `P9-03O keeps cancellation family source-open when conformation evidence is incomplete` (`src/state/p9-melee.test.js`)
	- `P9-03O keeps cancellation source-open when family does not match attack contact type` (`src/engine/melee/resolution.test.js`)
- Focused validation rerun after cancellation wave-2: `node --test src/state/p9-melee.test.js src/engine/melee/resolution.test.js` (`58/58` pass).
- Reviewer correction applied: cancellation family inference in state is now additionally gated by `formedTroopClosed`; formed-related cancellation families are no longer inferred when formed proof is unresolved.
- Added focused guard test: `P9-03O keeps cancellation family source-open when formed proof is unknown` (`src/state/p9-melee.test.js`).
- Focused validation rerun after formed-proof gate on cancellation inference: `node --test src/state/p9-melee.test.js src/engine/melee/resolution.test.js` (`59/59` pass).
- Drill taxonomy hygiene follow-up applied: attached commander fixtures now use dedicated `UNIT_PROFILE_IDS.COMMANDER` profile mapping (instead of LI/cavalry stand-ins), keeping commander-only scenario metadata explicit.
- Added regression guards in `src/data/melee-drill-scenarios.test.js` to assert the commander fixture is `UNIT_PROFILE_IDS.COMMANDER` and remains neither `UNIT_PROFILE_IDS.LIGHT_INFANTRY` nor `UNIT_PROFILE_IDS.CAVALRY`.
- Added P9-03O host-path regression guard in `src/state/p9-melee.test.js`: selecting attached commander id resolves branch troop-class derivation from host main unit (`formed-non-light`), preventing commander profile leakage into flank/rear branch logic.
- Charge drill consistency follow-up applied: `charge-drill-p1-general` now also uses dedicated `UNIT_PROFILE_IDS.COMMANDER` profile mapping and no longer depends on special-case general fallback capability construction.
- Focused validation rerun for drill + melee state/resolver coverage: `node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee.test.js src/engine/melee/resolution.test.js` (`69/69` pass).
- Focused validation rerun for charge/profile integrity: `node --test src/data/charge-drill-scenarios.test.js src/data/unit-profiles.test.js` (`15/15` pass).
- Reviewer handoff packet prepared: `docs/agents/p9-03o-review-handoff.md`.

### [x] P9-03OA - Movement-Phase Flank Trigger Bridge (to-zero + immediate cohesion handoff)

- Implemented movement/conformation -> melee trigger bridge payload on conformation candidates (`meleeTriggerBridge`) and persisted it into applied conformation metadata.
- Added explicit bridge fields for flank/rear attack contact type, to-zero eligibility, front-engagement requirement, cancellation-family hint, and immediate multiple-attack trigger payload.
- Melee draft branch ingestion now consumes bridge metadata with strict source-status gating and deterministic source-open diagnostics.
- To-zero closure now additionally enforces source-closed defender front-engagement when the bridge requires it.
- Front-engagement closure supports both explicit source-closed front evidence and mirrored pending front-contact fallback from geometry when explicit evidence is absent.
- Batch preview now accepts verified `multipleAttackImmediateTrigger` objects (in addition to legacy numeric hint), preserving source-open diagnostics when unresolved.
- Drill fixture bridge payloads were added for acceptance units (`melee-drill-p1-flank-c`, `melee-drill-case1-side-melee`, `melee-drill-case2-flank-left`, `melee-drill-case2-flank-right`, `melee-drill-case2-rear`).
- Focused test coverage added for producer model/candidates, drill fixture bridge metadata, front-engagement gate behavior, acceptance indices `14/19/20/21/8`, and immediate trigger ingestion.
- Focused validation runs:
	- `node --test src/engine/conformation/candidates.test.js src/engine/conformation/model.test.js` (`17/17` pass)
	- `node --test src/state/p9-melee.test.js src/state/p0-state-melee.test.js src/data/melee-drill-scenarios.test.js` (`53/53` pass)
- Reviewer handoff packet prepared: `docs/agents/p9-03oa-review-handoff.md`.

Goal: bridge movement/conformation evidence into melee so flank/rear to-zero eligibility and immediate multiple-attack cohesion triggers can be produced in the live phase flow instead of fixture-only injection.

Planned files:

- src/state/p0-charge-conformation-reducers.js
- src/engine/conformation/candidates.js
- src/state/p9-melee.js
- src/state/p9-melee.test.js
- src/state/p0-state-melee.test.js
- src/data/melee-drill-scenarios.js
- src/data/melee-drill-scenarios.test.js
- docs/rules/open-verification.md

Implementation steps:
1. Extend movement/conformation metadata contract so melee-relevant branch triggers can be passed explicitly (`defenderFactorToZeroEligible`, cancellation family hints, immediate multiple-attack trigger source).
2. Keep source-status honesty strict: only emit source-closed trigger fields when contact type, conformation state, and formed proof are all closed; otherwise emit deterministic source-open diagnostics.
3. Wire the new metadata fields into the P9 melee draft branch context without changing existing safety gates.
4. Add focused drill proof lanes for movement-phase-triggered flank cases and immediate cohesion triggers.

Non-goals:

- no rewrite of melee resolver math outside trigger ingestion
- no rout/pursuit redesign
- no silent closure of unresolved flank/rear families

Validation:

- focused handoff tests movement -> melee branch context
- focused tests proving source-open diagnostics remain explicit when movement evidence is incomplete
- focused drill tests for the requested movement-phase flank trigger set

Manual acceptance:

- For melee drill fixture order indices `14`, `19`, `20`, `21`, and `8`, treat each as "performed a flank attack in movement phase" and verify downstream branch handling.
- Unit `8` must not produce to-zero because no qualifying contact exists.
- Units `14`, `19`, `20`, and `21` must produce to-zero only when the defender is already front-engaged and all branch preconditions are source-closed.

Stop condition:

- stop if movement/conformation source wording is insufficient to mark trigger ownership as source-closed

Expected result:

- live gameplay path can generate the same to-zero and immediate cohesion trigger behavior currently only possible via explicit fixture hints, while preserving source-status guardrails

Source gates:

- keep `melee.main-unit-support-multiple-attack-and-modifiers` open until trigger ownership wording is source-checked against melee + errata anchors

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

### [x] P9-03P - Support Role Completion (Simple vs Melee Support)

Goal: complete support detection and counting for both simple support and melee support with role/cap constraints from rules.

Planned files:

- src/state/p9-melee.js
- src/engine/melee/roles.js
- src/engine/melee/resolution.js
- src/state/p9-melee.test.js
- src/engine/melee/roles.test.js

Implementation steps:
1. Extend support detection beyond flank-to-flank alignment-only heuristic to full simple-support and melee-support role model.
2. Enforce side/cap/ownership constraints for competing support candidates.
3. Ensure support role affects the correct stage (support) and does not leak commander/ability rules incorrectly.
4. Keep source-open diagnostics where support family detail is not yet closed.

Non-goals:

- no special-object family rules
- no commander-lifecycle redesign
- no UI redesign outside current factor breakdown visibility

Validation:

- focused role tests for simple support, melee support, competing supporters, and non-contact corner-only exclusions
- focused resolver tests proving support stage totals are deterministic and source-status safe

Manual acceptance:

- user verifies one pair where simple-support and melee-support produce distinct displayed breakdown effects

Stop condition:

- stop if support tie-break wording cannot be validated against source examples

Expected result:

- support contributions are complete for the approved P9 subset and no longer reduced to one geometry-only heuristic

Source gates:

- keep unresolved support tie-break details source-open until direct source confirmation

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Closeout 2026-05-29:

- Support assignment in `src/state/p9-melee.js` now consumes role-aware support classification via `resolveMeleeSupportAssignments` instead of relying only on flank-to-flank geometry.
- Ownership and opponent constraints are enforced for support candidates; only friendly supporters bound to the active main unit are counted.
- Side-cap handling for competing support candidates is deterministic (one selected candidate per role+side bucket) and emits explicit `source-open` diagnostics when competition occurs.
- Resolution drafts now inject support-stage modifier entries explicitly for both `simple-support` and `melee-support`, each with source status propagated into resolver safety checks.
- Geometry-only support fallback remains available but is explicitly marked `needs-source-check` to preserve source-status honesty where contact evidence is missing.
- Focused validation passed: `src/engine/melee/roles.test.js` and `src/state/p9-melee.test.js`.

### [ ] P9-03Q - Melee Participation Gating Unification (UI/Reducer)

Goal: remove legacy melee selection gates and derive participation/selectability only from `getMeleeProcedurePresentation` / `getMeleeUnitStatus`.

Planned files:

- src/state/p0-state.js
- src/state/p9-melee.js
- src/ui/p0-battlefield.js
- src/state/p0-state-melee.test.js
- src/ui/p0-app.test.js

Implementation steps:
1. Replace legacy `engagedInMelee` / `meleePendingOpponentId` selection gate paths in melee phase reducer flow.
2. Ensure visual grey/pending/resolved classes follow one canonical status model only.
3. Add conform-drill regression where legal contact participants never stay grey as nonparticipants.
4. Keep diagnostics in logs for status transitions to simplify runtime bug tracing.

Non-goals:

- no combat-math changes
- no queue semantics expansion beyond gating correctness
- no phase-order redesign

Validation:

- focused reducer/UI tests for selection gating and status classes
- focused conform-drill regression proving legal-contact enemy is not greyed as nonparticipant

Manual acceptance:

- user reruns conform drill with debug flags and confirms combat participants are not greyed out

Stop condition:

- stop if canonical status model cannot represent required drill states without reworking round-phase ownership

Expected result:

- one status source of truth drives both reducer behavior and battlefield greying/highlight feedback

Source gates:

- none beyond existing melee contact legality source gates

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

### [x] P9-03R - Melee Drill Unit Taxonomy Upgrade (Rule-Conform Families)

Goal: move the melee drill from broad placeholder families (`medium-infantry`, `heavy-infantry`, `cavalry`) to rule-conform representative families needed for melee factors and modifiers (for example medium swordsmen, heavy spearmen, light infantry javelin, medium cavalry impetuous, heavy cavalry impact).

Planned files:

- src/data/unit-profiles.js
- src/data/melee-drill-scenarios.js
- src/data/melee-drill-scenarios.test.js
- src/engine/melee/resolution.test.js
- src/state/p9-melee.test.js
- docs/rules/units-and-bases.md (only if boundary wording must be sharpened)

Implementation steps:
1. Define a minimal P9 representative melee profile subset with explicit family/ability identity required for melee logic, without pretending full army-list closure.
2. Upgrade melee drill units to these profiles so scenario labels and role intent map to rules-facing families instead of generic anchors.
3. Ensure drill metadata captures ability-bearing distinctions used by melee (for example impact, impetuous, missile-capable LI variants).
4. Keep unresolved profile families source-open and diagnostic-only, not silently normalized.

Non-goals:

- no full army-list import
- no broad UCD catalog closure beyond the approved P9 representative subset
- no visual overhaul of unit rendering families

Validation:

- focused scenario tests asserting profile IDs and intended melee family roles
- focused melee tests proving profile distinctions can drive deterministic factor/modifier branches once source-closed

Manual acceptance:

- user confirms melee drill now contains named representative families (not only generic medium/heavy/cavalry placeholders)

Stop condition:

- stop if required family boundaries cannot be source-checked without reopening wider UCD scope

Expected result:

- melee drill is rules-facing and suitable for factor/modifier closure work because units represent concrete troop families and abilities

Source gates:

- keep `unit-capabilities.formed-foot-family-split`, `unit-capabilities.missile-family-taxonomy`, and `unit-capabilities.special-ability-catalog` explicitly open until direct source confirmation for each added representative profile

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Progress note (2026-05-28, Coding Agent):

- Added representative P9 melee profile anchors in shared profile data for drill-safe family differentiation: `light-infantry-javelin`, `medium-infantry-swordsmen`, `heavy-infantry-spearmen`, `medium-cavalry-impetuous`, and `heavy-cavalry-impact`.
- Upgraded melee drill pair and reserve units to the new profile IDs and exposed drill metadata fields (`scenarioTroopFamily`, `scenarioMeleeTraits`) so ability-bearing distinctions are visible in scenario/debug state.
- Added focused tests that assert representative profile coverage in the drill scenario plus ability/capability differentiation (`javelin`, `impetuous`, `impact`) and a deterministic resolver lane using representative cavalry profiles with source-closed modifier inputs.

### [ ] P9-03S - Commander Presence Scenarios (Attached And Included)

Goal: add explicit melee drill lanes and resolver wiring for commander presence states: attached commander behind host unit and included commander in unit, with errata-conform melee effect boundaries.

Planned files:

- src/data/melee-drill-scenarios.js
- src/state/p9-melee.js
- src/engine/melee/resolution.js
- src/state/p9-melee.test.js
- src/data/melee-drill-scenarios.test.js
- src/state/p0-state-melee.test.js

Implementation steps:
1. Add dedicated melee drill cases with an attached commander stand and a separate included-commander unit case.
2. Derive commander melee contribution from canonical unit/command state (`attachedCommanderId`, `attachedUnitId`, `hasIncludedCommander`) instead of ad hoc flags.
3. Enforce errata boundary: commander in melee support is not equivalent to fighting with the main melee unit.
4. Show commander contribution and source status clearly in melee breakdown diagnostics.

Non-goals:

- no command CP economy redesign
- no commander movement phase rewrite
- no broader multiplayer privacy work

Validation:

- focused scenario tests for attached/included commander fixture correctness
- focused melee resolver/state tests for attached vs included vs support-only commander outcomes
- focused integration test ensuring drill flow remains stable with commander-present lanes

Manual acceptance:

- user verifies one attached-general melee and one included-general melee case with visible, distinct breakdown impact

Stop condition:

- stop if commander-combat timing cannot be aligned with unresolved command lifecycle blockers

Expected result:

- P9 melee flow has real commander-presence coverage and no longer relies on optional context-only commander flags

Source gates:

- keep command attach/detach timing blockers open where needed; close this card only after errata commander-engaged boundary is explicitly validated for melee

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Progress note (2026-05-29, commander placement fix):

- `melee-drill-p1-commander-b` now sits at the exact behind-host edge-touch pose for `melee-drill-p1-frontline-b` instead of overlapping the host footprint.
- Focused scenario tests now assert the attachment linkage and the exact edge-touch offset for the commander lane.
- Remaining commander-presence work still belongs to resolver wiring and errata-boundary validation; this slice only tightens the fixture geometry.

### [x] P9-03TF - Melee Factor Rules Freeze (Pre-Closure Gate)

Goal: establish one source-owned melee factor rule baseline before further closure cards (T/O/V/U/W), including factor matrix, modifier staging, first-contact timing, flank/rear factor-0 and cancellations, and explicit errata provenance per approved lane.

Planned files:

- docs/rules/melee.md
- docs/rules/open-verification.md
- docs/source/Rules_v2.md (anchors only, no broad rewrite)
- P9_todo.md

Implementation steps:
1. Build a canonical factor matrix for the current representative melee profile subset, with per-lane status: `approved`, `source-open`, or `blocked`.
2. Freeze one modifier catalog by stage with explicit ownership: `combat factor`, `situation`, `die`, `final result`.
3. Freeze first-contact vs continuing-combat effects and identify which abilities can apply in each state.
4. Freeze flank/rear branch baseline, including factor-to-0 conditions and cancellation sets, plus incomplete-conformation `+1 situation` lane behavior.
5. Require explicit errata provenance per approved lane and list residual source-open lanes by exact reason.

Non-goals:

- no resolver/UI implementation in this card
- no P10 rout/pursuit flow closure
- no special-object family completion (camp/fortification/war-wagon) beyond factor-baseline annotations

Validation:

- reviewer cross-check of freeze artifacts against p.22 and melee pages with errata references
- consistency check that all later cards T/O/V/U/W consume this frozen baseline without redefining it

Manual acceptance:

- user reviews and approves the freeze matrix + modifier-stage catalog as the implementation baseline for the next P9 cards

Stop condition:

- stop if any approved lane cannot be backed by direct source/errata anchors

Expected result:

- one shared melee factor rule baseline exists so later implementation cards focus on coding, not re-interpreting rules

Source gates:

- keep `melee.main-unit-support-multiple-attack-and-modifiers` open until freeze residuals are explicitly narrowed and accepted

Role routing:

- Expected implementing role: Lead / Phase Steward (planning artifact) with Reviewer / Rules Agent cross-check
- Suggested model: GPT-5.5 for source-risk triage depth; GPT-5.4 allowed when user explicitly keeps it

Closeout 2026-05-29:

- Freeze artifact is now published in `docs/rules/melee.md` under `P9-03TF Melee Factor Rules Freeze`.
- Canonical lane matrix now distinguishes `approved`, `source-open`, and `blocked` representative lanes with explicit residual list.
- Modifier-stage ordering, first-contact/continuing timing baseline, and flank/rear branch baseline are frozen for downstream implementation cards.
- Open verification item `melee.main-unit-support-multiple-attack-and-modifiers` remains open by design until residual lanes are closed with direct source/errata provenance.
- Execution gate is now satisfied: coding cards `P9-03T`, `P9-03O`, `P9-03U`, `P9-03V`, and `P9-03W` must consume this freeze baseline without redefining it.

### [x] P9-03T - Combat Factor Table Closure Wave 2 (Mounted Lanes)

Goal: expand p.22 table approval beyond the current infantry slice, with priority on cavalry-vs-cavalry and other mounted matchups that can be source-closed with direct errata wording.

Planned files:

- src/data/melee-combat-factors.js
- src/engine/melee/resolution.js
- src/engine/melee/resolution.test.js
- docs/rules/open-verification.md

Implementation steps:
1. Consume the frozen baseline from `P9-03TF` as the only planning input for mounted-lane closure.
2. Perform a direct p.22 plus errata pass for mounted combat-factor rows and capture only source-closed matchup lanes.
3. Add source-owned mounted bindings for approved lanes, including cavalry-vs-cavalry where exact wording is closed.
4. Keep unresolved mounted lanes explicit as `source-open` with provenance diagnostics.
5. Update open-verification notes so the remaining non-closed mounted lanes are named explicitly instead of hidden under one broad blocker.

Non-goals:

- no flank/rear branch closure in this card (owned by P9-03O)
- no commander engagement changes
- no UI redesign beyond existing factor provenance display

Validation:

- focused resolver tests for mounted-vs-mounted approved lanes and source-open fallback lanes
- focused diagnostics assertions for unresolved mounted lanes

Manual acceptance:

- user verifies one cavalry-vs-cavalry drill lane that resolves with bound factors without manual factor entry

Stop condition:

- stop if mounted table wording still cannot be transcribed source-honestly from p.22 plus errata

Expected result:

- more combat-factor table lanes are truly approved while unresolved mounted lanes stay explicit and reviewable

Source gates:

- keep `melee.main-unit-support-multiple-attack-and-modifiers` open until mounted-lane residuals are narrowed and listed explicitly

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Execution dependency:

- start only after `P9-03TF` is reviewed and accepted

Closeout 2026-05-29:

- Representative mounted `Cv` lanes are now partially closed from p.22 in `src/data/melee-combat-factors.js` with source-owned provenance labels.
- The priority lane `medium-cavalry-impetuous` vs `heavy-cavalry-impact` now resolves as bound factor `+1` vs mounted (no manual factor input required).
- Additional representative unconditional `Cv` closures were added for `Cv` vs `MI` (medium swordsmen) and `Cv` vs `LMI` (light infantry javelin) base-factor lanes.
- Conditional mounted lanes remain explicit `source-open`: `Cv` vs `HI` where flank/rear evidence is required, and first-contact bonus timing lanes (owned by `P9-03V`).
- Open-verification residual wording is narrowed accordingly; `mounted-vs-mounted` is no longer listed as unresolved.

### [ ] P9-03U - Debug Override Parity (Dice) + Resolution Result Panel

Goal: mirror the successful factor debug-gate UX for melee dice input and always show the computed result panel (winner, differential, cohesion loss, rout) in the pair dialog.

Planned files:

- src/state/p9-melee.js
- src/ui/battlefield-dialogs.js
- src/state/p0-state.js
- src/ui/p0-app.js
- src/ui/p0-app.test.js
- src/state/p9-melee.test.js

Implementation steps:
1. Consume `P9-03TF` stage definitions and first-contact timing baseline for result panel semantics.
2. Add explicit debug toggle for attacker/defender D6 controls; default flow remains deterministic and non-debug first.
3. Keep existing confirm flow, but render result preview details in the dialog from resolver output.
4. Show at minimum: winner/loser side, difference, cohesion loss, rout flag, and source status.
5. Ensure result display does not claim source-closed outcomes when inputs remain source-open.

Non-goals:

- no new melee math branches in this card
- no batch-apply sequencing rewrite
- no cohesion marker rendering work (owned by P9-03W)

Validation:

- focused UI/state tests for hidden-by-default dice controls and debug opt-in behavior
- focused UI tests for result panel presence and cohesion-loss rendering

Manual acceptance:

- user verifies dice controls are hidden until debug toggle is enabled and that result/cohesion output is visible before pair confirmation

Stop condition:

- stop if current resolver/state contract cannot provide deterministic preview output without expanding scope into new melee branches

Expected result:

- melee dialog gets safer default UX plus immediate readability of outcome impact

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Execution dependency:

- start only after `P9-03TF` is reviewed and accepted

### [x] P9-03V - First-Contact Round State + Ability Timing Hooks

Goal: add canonical melee round-state tracking (`first-contact` vs `continuing`) and wire first-round-sensitive ability timing (for example impact/furious charge families) into melee resolution and drill fixtures.

Planned files:

- src/state/p9-melee.js
- src/engine/melee/resolution.js
- src/data/melee-drill-scenarios.js
- src/state/p9-melee.test.js
- src/engine/melee/resolution.test.js
- src/data/melee-drill-scenarios.test.js

Implementation steps:
1. Implement the first-contact vs continuing baseline frozen in `P9-03TF` without redefining timing categories in code.
2. Introduce canonical per-melee round-state fields that persist across phases and subsequent melee rounds.
3. Mark drill pairs and general melee entries as `first-contact` or `continuing` from real combat lifecycle state, not ad hoc UI flags.
4. Route first-round-sensitive ability hooks through this state and keep unresolved ability interactions explicit as source-open diagnostics.
5. Ensure the state transitions to `continuing` after the first resolved contact round.
6. Own commander persistence behavior for continuing rounds here (not in `P9-03N`) and keep detach-combat-lock timing as source-open diagnostics until direct source wording is closed.

Non-goals:

- no full P10 rout/pursuit integration
- no commander lifecycle redesign
- no complete special-object family closure

Validation:

- focused resolver tests for first-contact vs continuing ability timing differences
- focused state tests for round-state persistence across melee phase boundaries
- focused drill tests for visible round-state labeling
- explicit acceptance criteria for continuing-round commander persistence diagnostics tied to `docs/rules/open-verification.md` IDs `command.commander-attach-detach-legality` and `command.commander-detach-combat-lock-timing`

Manual acceptance:

- user verifies one pair where first-contact and continuing rounds produce different ability timing behavior

Stop condition:

- stop if first-round ability timing cannot be closed against errata wording without reopening wider ability-catalog scope

Expected result:

- melee timing state becomes explicit and reliable for both rules and UX

Source gates:

- keep unresolved `impact`/`furious charge` errata interactions source-open until direct wording closure is recorded
- commander persistence and detach-combat-lock timing must remain source-open until `docs/rules/open-verification.md` IDs `command.commander-attach-detach-legality` and `command.commander-detach-combat-lock-timing` are closed
- consume `docs/rules/melee.md` first-contact/continuing baseline without redefining `P9-03N` engagement-wiring boundary
- route detach/combat-lock wording ambiguity to Reviewer / Rules Agent before persistence enforcement is implemented

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Execution dependency:

- start only after `P9-03TF` is reviewed and accepted

Progress (diagnostics-first kickoff 2026-05-29):

- Added canonical melee round-state scaffolding in state (`first-contact`/`continuing`) with persistence map keyed by melee id.
- After first confirmation, melee entries now store continuing-round snapshots for commander participation (`attached`/`included`/`none`) without enforcing detach/combat-lock legality.
- Draft creation now emits explicit source-open diagnostics for continuing-round commander persistence with open-verification binding to `command.commander-attach-detach-legality` and `command.commander-detach-combat-lock-timing`.
- Any continuing-round participation delta now emits an immediate reviewer-routing ambiguity diagnostic (`reviewerHandoffRequired: true`) instead of reducer-level lock enforcement.
- Focused diagnostics-first state tests were added in `src/state/p9-melee.test.js`; no new persistence-enforcement tests were introduced.
- Follow-up slice wired `meleeRoundState` through resolver timing logic in `src/engine/melee/resolution.js` and gates first-contact-sensitive `impact` and `furious-charge` lanes in continuing rounds as source-open diagnostics.
- Continuing-round unresolved timing lanes now emit resolver diagnostics code `first-contact-ability-continuing-source-open` and do not introduce detach/combat-lock enforcement.
- Focused resolver tests now prove first-contact vs continuing divergence and source-open behavior in `src/engine/melee/resolution.test.js`; a focused state flow test confirms first-contact to continuing draft transition in `src/state/p9-melee.test.js`.
- Mini-slice update: first-contact gating in `src/engine/melee/resolution.js` now uses explicit modifier metadata `appliesInRoundState` instead of code/label text matching; focused first-contact/continuing tests were updated to assert the metadata path directly.

Closeout 2026-05-29:

- Reviewer / Rules Agent verdict: `Approved`.
- Round-state gating is now metadata-based via explicit modifier timing field `appliesInRoundState` in `src/engine/melee/resolution.js`; first-contact vs continuing timing no longer depends on label/code text matching.
- Continuing-round first-contact-only lanes remain explicit resolver `source-open` diagnostics (`first-contact-ability-continuing-source-open`) instead of silent application.
- Commander persistence and detach/combat-lock timing remain diagnostics-only and source-open; no detach/combat-lock enforcement was introduced in this card.

### [ ] P9-03W - Cohesion Loss Marker UX (Pending Grey -> Committed Red)

Goal: add persistent unit-level cohesion marker rendering on the rear base edge, with phase-local pending markers in grey and committed markers in red after melee batch confirmation.

Planned files:

- src/ui/p0-battlefield.js
- src/ui/styles/* battlefield unit styling files
- src/state/p9-melee.js
- src/state/p0-state.js
- src/ui/p0-app.test.js
- src/state/p9-melee.test.js

Implementation steps:
1. Consume the frozen result/cohesion semantics from `P9-03TF` so marker state reflects the same rules baseline as resolver output.
2. Add renderer support for rear-edge cohesion pips using unit state totals.
3. During active melee batch preview/resolution, show newly added cohesion as pending grey markers.
4. After melee batch apply/acknowledge, commit those markers into persistent red totals.
5. Keep marker count/state deterministic and replay-safe.

Non-goals:

- no combat-factor math changes
- no rout/pursuit phase redesign
- no non-melee visual theme overhaul

Validation:

- focused reducer tests for pending vs committed cohesion-marker counts
- focused UI render tests for rear-edge marker position and color-state transitions
- browser smoke check for melee phase before and after batch confirmation

Manual acceptance:

- user verifies that new cohesion appears grey during melee resolution and turns red only after the melee phase batch is applied/confirmed

Stop condition:

- stop if current unit-state model cannot distinguish pending versus committed cohesion without unsafe temporary UI-only state

Expected result:

- cohesion loss is immediately visible and phase-correct without hiding whether a loss is still pending or already committed

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

Execution dependency:

- start only after `P9-03TF` is reviewed and accepted

### [ ] P9-04A - Special Family Branches (Camp/Fortification/Obstacle)

Goal: implement explicit special melee families for camp assault and barrier combats with dedicated legality/support/result handling.

Planned files:

- src/engine/melee/*
- src/state/p9-melee.js
- src/engine/melee/*.test.js
- src/state/p9-melee.test.js
- src/data/* dedicated special-family scenarios

Implementation steps:
1. Add camp assault state branches (fortified vs unfortified) with dedicated outcome rules.
2. Model fortification/obstacle combat branches and support restrictions separately from generic melee.
3. Preserve looted-camp obstacle persistence hooks needed for later scoring/rout integration.
4. Keep unresolved edge conditions explicit as source-open diagnostics.

Non-goals:

- no war-wagon family in this card (handled in P9-04B)
- no P10 scoring/victory closure
- no generic terrain refactor

Validation:

- focused branch tests for camp and fortification/obstacle lanes
- source-backed scenario tests from p.65-p.67 mapping where applicable

Manual acceptance:

- user verifies one camp lane and one fortification/obstacle lane in deterministic flow

Stop condition:

- stop if branch behavior would require guessing unresolved errata interactions

Expected result:

- camp/fortification/obstacle melee behavior is explicit, testable, and not merged into generic differential path

Source gates:

- `setup.camp-attack-and-defense-special-cases` remains open until direct errata confirmation is recorded

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

### [ ] P9-04B - War-Wagon Special Family

Goal: implement war-wagon contact/support restrictions as a dedicated family with explicit main-unit and anti-flank/rear behavior.

Planned files:

- src/engine/melee/*
- src/state/p9-melee.js
- src/engine/melee/*.test.js
- src/state/p9-melee.test.js
- src/data/* war-wagon scenarios

Implementation steps:
1. Add war-wagon family branch where all edges count as front in combat context.
2. Enforce no flank/rear attack and no multiple-attack branches against war wagons per source baseline.
3. Enforce one-enemy-main-unit selection rule against a wagon in the same melee resolution lane.
4. Keep support and cancellation interactions explicit and diagnostic where still source-open.

Non-goals:

- no camp or fortification logic in this card
- no P10 pursuit/victory closure
- no broad wagon unit-profile overhaul outside melee branch needs

Validation:

- focused war-wagon branch tests for contact classification, support, and pairing limits
- source-backed scenario checks for p.67 war-wagon support example routing

Manual acceptance:

- user verifies one war-wagon case where generic flank/rear logic is correctly suppressed

Stop condition:

- stop if source text for wagon edge/contact interactions cannot be verified without reopening source pass

Expected result:

- war-wagon melee rules run as explicit family branch and cannot silently fall back to generic melee assumptions

Source gates:

- keep any unresolved war-wagon support/cancellation nuances as source-open diagnostics until errata-confirmed

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before closeout

## Notes

- Keep `roadmap.md` and this board synchronized.
- Do not open P10 scope inside P9.
- Any source-risk issue that grows beyond the supported first melee slice should be deferred explicitly rather than hidden in UI or reducer code.

