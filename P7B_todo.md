# P7B TODO - Conformation + Shifting Foundation

Status: Awaiting short reviewer recheck after wording/fixture-honesty corrections - P7A2 is accepted, P7B-00 through P7B-08 are implemented and validated for the supported subset, and P8 remains gated on reviewer/user approval
Date drafted: 2026-05-20
Planner: AdG-Rules-Engine-Agent
Preferred future executor: GPT-5.4 after user approval
Intended branch: feature/p7b-conformation-foundation
Master plan: roadmap.md
Agent operating model: docs/agents/index.md
Current next-card handoff: Short Reviewer / Rules Agent recheck for P7B-08 closeout honesty, then Coding Agent may proceed with P7C-00
Related source-example support board: CONFORM_DRILL_todo.md
Concept source: docs/charge-phase-procedure-concept.md
Rules workspace: docs/rules/
Open verification source: docs/rules/open-verification.md
Rules source corpus target: docs/source/Rules_v2.md plus the RV2 source-lock workspace notes in docs/rules/; docs/source/rules.md remains legacy planning support only
Primary source PDFs: Konzepte/Errata_ADG_V4_English.pdf, docs/source/new scan/Rules_Color_300DPI.pdf, Konzepte/Rules.pdf, Konzepte/Reference_Sheet_V4.pdf
Rules-v2 source gate: the conformation/ZOC/terrain source-lock baseline from RV2-04 is now the working planning basis; before implementation, keep RV2-05A recalibration aligned for conformation-facing boards and get explicit user approval for the phase start

## Purpose

P7B implements the basic conformation foundation before P8 shooting and P9 melee. It consumes the contact, reaction, committed evade, and charge movement snapshots from P7/P7A/P7A2 and turns them into explainable conformation candidates and a safe charge-completion state.

P7B is not full melee combat. It does not calculate combat factors or cohesion loss except for state hooks handed off to P9/P10. It exists so melee later starts from a rule-shaped contact/conformation state rather than from raw visual overlap.

## Scope Decision

In scope for P7B:

- source-locked single-unit conformation candidate model
- front, flank, rear, and selected `rear-or-flank` conformation candidates
- complete, incomplete, blocked, optional, and `needs-source-check` statuses
- most-threatening enemy and ZOC inputs where needed for conformation priority
- first shifting skeleton for source-closed simple blockers
- shifted-unit movement/rally lock hooks where source-closed
- conformation preview UI and explanation cards
- final charge-completion state that preserves conformation metadata for P9 melee

Out of scope for P7B:

- group conformation completeness
- full multi-unit support networks
- melee factors and dice
- full terrain optional-choice UI if terrain rules remain source-open
- column special cases beyond explicit diagnostics
- war wagon, artillery, fortification, obstacle, and stakes special conformation unless source-locked for a small subset
- pursuit/rout conformation

Required pre-P7B gate:

- P7A2 acceptance is now satisfied. P7B must not build conformation candidates from a ghost-only `evadePlan`; it starts from the evader's actual post-evade board state or an explicit source-locked non-board-pose outcome.
- The Rules-v2 source-lock baseline in `docs/source/Rules_v2.md` plus `docs/rules/conformation.md` and `docs/rules/zoc.md` is now the working conformation basis. User approval to start P7B is now satisfied, and the remaining risk is the narrowed errata/solver layer rather than broad source unreadability.
- Accepted support baseline before P7B implementation: `LOG0`, current-scope `UCD0`, `CD2-00` through `CD2-05`, and `BVR-00` through `BVR-02` are already available as support work.
- The completed support baseline does not replace the requirement that conformation starts from canonical post-evade board state, but that gate is now already satisfied by accepted P7A2.
- P7B smoke may use representative light infantry, cavalry bow, heavy infantry, pike, elephant, cavalry, and medium infantry anchors from the current Charge Drill matrix. This is a support smoke baseline, not a conformation rule gate and not an army-list-legal scenario.

Accepted CD2 support baseline 2026-05-25:

- The current Charge Drill matrix is now accepted as a support baseline for upcoming P7B smoke and debug passes. It remains an artificial fixture, not an army-list-legal scenario.
- For future P7B browser/manual smoke, keep naming acting corps and target corps explicitly until the later visual readability slice reduces the lookup burden.
- Current drill anchors most relevant to P7B early smoke:
	- baseline mounted contact: `P1 Front Charger` (`p1-corps-1`) versus `P2 Front Target` (`p2-corps-1`)
	- light-troop evade and post-evade follow-on anchor: `P1 Light Troop Hook Charger` (`p1-corps-1`) versus `P2 Light Troop Half-Turn Target` (`p2-corps-3`)
	- cavalry-bow family anchor: `P1 Cavalry Bow Charger` (`p1-corps-2`) versus `P2 Cavalry Bow Target` (`p2-corps-2`)
	- pike future-special anchor: `P1 Pike Charger` (`p1-corps-2`) versus `P2 Pike Target` (`p2-corps-2`)
	- elephant future-special anchor: `P1 Elephant Charger` (`p1-corps-2`) versus `P2 Elephant Target` (`p2-corps-2`)
- When P7B cards ask for browser smoke, prefer the selectors and flow steps already recorded in `docs/browser-automation.md` instead of restating ad hoc click paths.

Accepted source-example drill planning note 2026-05-26:

- The Rules-v2 p.53 conformation example cluster now has a dedicated support-board path in `CONFORM_DRILL_todo.md`.
- Current P7B smoke may still use Charge Drill, but source-backed conformation example recreation should move to Conform Drill rather than further loading the troop-family charge fixture.
- `CFD-E1` is accepted as the source-backed smoke support for `P7B-06`; further Conform Drill example work is paused until the missing rule implementations exist.

## Logging Gate

P7B must not start as an uninstrumented solver phase.

- Before implementing a P7B card, record logging expectations for that card or explicitly mark logging as a non-goal for trivial board/doc work.
- Minimum supported areas for the phase are expected to include `conformation`, `charge`, `contact`, and `ui`; add `movement`, `zoc`, or `terrain` when a card depends on those seams.
- Minimum supported levels should include `warn`/`error` diagnostics plus a `debug` decision summary for candidate generation, blocked/incomplete outcomes, optional choices, shifting results, and confirmation state.
- Browser/manual debug checks should state the filtered URL or runtime filter combination to use, following `LOGGING_todo.md` and `docs/browser-automation.md`.

## GPT-5.4 Execution Contract

GPT-5.4 must treat P7B as the conformation foundation phase and keep it strictly downstream of P7, P7A, and P7A2.

Execution order for P7B stays sequential unless a card explicitly says otherwise:

1. `P7B-00`
2. `P7B-01`
3. `P7B-02`
4. `P7B-03`
5. `P7B-04`
6. `P7B-05`
7. `P7B-06`
8. `P7B-07`
9. `P7B-08`

Execution rules for GPT-5.4:

- Do not start `P7B-07` charge completion until `P7B-06` preview UI has passed focused validation and manual acceptance for the supported subset.
- `P7B-05` shifting remains a constrained sub-solver. If a case needs a chain-push or broad group logic, stop and return blocked/incomplete diagnostics instead of expanding scope.
- `P7B-06` is presentation-only. It must render candidate, blocked, incomplete, optional, and shifting output from engine/reducer state.
- If multiple legal conformation outcomes exist and the user has not approved an auto-pick policy, stop and surface an explicit choice state instead of selecting silently.
- Each conformation card must state its logging area/level expectations and must not add family-specific behavior directly to individual fixture units when the UCD profile path can supply it.
- After each completed card, update this file with files touched, validation run, manual acceptance instructions, and the next exact card to execute.

## Agent Routing For Remaining P7B Cards

Use the role model in `docs/agents/index.md` for all remaining P7B work.

- Lead / Phase Steward, GPT-5.5: use only for P7B scope changes, source-risk decisions that affect more than one card, P8/P9 planning, or roadmap changes.
- Coding Agent, GPT-5.4: implement the current approved P7B card only.
- Reviewer / Rules Agent, GPT-5.4: review every remaining rule-sensitive P7B card before the Lead treats it as accepted. Use GPT-5.5 only if review requires difficult errata/source reconstruction.
- Optional Data / Validation mode: not expected for P7B-04 through P7B-08 unless a card starts changing source corpus, army-list data, unit-profile tables, or schema-style data validation.

Remaining-card routing:

| Card | Implementing role | Review required | Lead gate | Data mode |
| --- | --- | --- | --- | --- |
| P7B-04 | Coding Agent / GPT-5.4 | Reviewer / Rules Agent / GPT-5.4 | only if optional terrain source status changes scope | no |
| P7B-05 | Coding Agent / GPT-5.4 | Reviewer / Rules Agent / GPT-5.4 | yes if shifting source remains ambiguous | no |
| P7B-06 | Coding Agent / GPT-5.4 | Reviewer / Rules Agent / GPT-5.4 plus browser smoke when available | only for UX scope disputes | no |
| P7B-07 | Coding Agent / GPT-5.4 | Reviewer / Rules Agent / GPT-5.4 | yes for incomplete-conformation confirmation warning surface | no |
| P7B-08 | Lead / Phase Steward / GPT-5.5 for closeout review, with Reviewer input | Reviewer / Rules Agent / GPT-5.4 | yes | no |

Every Coding Agent closeout must include a compact reviewer handoff: implemented card, changed files, rule basis, validation, known risks, and reviewer focus. The final user-facing answer must say when the user should switch role/model.
Every Lead, Coding, and Reviewer handoff must also say whether the current card is done, still awaiting a gate, or blocked, and must name the next exact todo/card or exact blocker.

## Player Flow Contract For P7B

P7B consumes a contact/handoff state from P7, P7A, or P7A2 and must preserve the following player-facing flow:

1. When a supported charge branch ends in contact, the UI enters conformation preview automatically.
2. The player sees at least three distinct visual states where applicable: pre-conform contact, post-conform candidate ghost, and any shifted-unit ghost.
3. If exactly one legal candidate exists, the UI may show that candidate directly with a single `Konformation bestätigen` action.
4. If several legal candidates or an optional terrain choice exist, the UI must expose an explicit choice state; it must not auto-pick without prior user approval.
5. If only incomplete conformation is legal, label it clearly as incomplete and only allow confirmation if the source-locked subset permits it.
6. If the result is blocked or `needs-source-check`, the UI must not pretend the charge can be completed.

Shift-preview contract:

- Shifted-unit ghosts must be visually distinct from charge-start slide.
- Shifted-unit lock consequences must be visible before confirmation.
- If a shift would require unsupported chain behavior, the UI stays in blocked/incomplete state.

Default product decisions for P7B unless the user overrides them:

- Prefer explicit player choice over silent auto-selection whenever more than one legal conformation outcome exists.
- Keep explanatory detail in the side panel; keep battlefield text minimal.
- Do not open P9 melee logic early just to explain conformation.

Confirmed user decisions 2026-05-21:

- If several legal conformation outcomes exist, the player chooses explicitly; no deterministic auto-pick in the first P7B UX.
- Until a real terrain/conformation-terrain slice exists, terrain-dependent optional conformation stays a fixed blocker instead of a fake optional-choice flow.
- If incomplete conformation is source-locked as legal in the supported subset, it should remain confirmable with a clear warning rather than being silently treated as complete.

## User Decision Gates

The following user decisions should be reconfirmed before GPT-5.4 implements the affected cards:

- `P7B-00`: satisfied on 2026-05-26. P7A2 is accepted and conformation consumes committed post-evade state, not a preview-only ghost.
- `P7B-07`: warning is required if a supported incomplete conformation is legal; only the exact warning surface still remains to choose if the first UX needs one decision between modal warning and side-panel warning.

## Open P7B Questions For User Or Source Check

GPT-5.4 must ask or source-check before implementing affected behavior:

- Source check: exact solver predicates for front-edge, front-corner, rear-corner, and selected `rear-or-flank` candidate outcomes from the now source-locked p.50-54 baseline plus errata.
- Source check: when incomplete conformation is legal to confirm versus when it remains blocked in the supported single-unit subset.
- Source check: whether most-threatening enemy and first-ZoC-entry priority are required in the first single-unit candidate subset or can be diagnostic-only until a broader conformation pass.
- User choice: if several complete candidates are legal and equivalent, the first UX should require explicit selection; later deterministic defaults would need a separate user approval.
- User choice: should simple shifting preview be shown in the same conformation confirmation modal or as a separate side-panel step before confirmation.

RV2-04 recalibration note 2026-05-23:

- The Rules-v2 scan-confirmed pass now supports the following P7B baseline as source-locked working knowledge: conformation is a separate post-contact step; most-threatening enemy controls the candidate target; post-charge conformation follows a slide-then-pivot reading; incomplete conformation is a real legal state in some cases; terrain can create optional rather than mandatory full-alignment outcomes; and shifting follows minimum-units, minimum-distance, rear-before-flank logic with a light-troop exception to the post-shift move/rally lock.
- Remaining P7B-00 risk is now concentrated on errata overlays, solver-predicate precision, and deferred special cases, not on broad uncertainty about whether conformation diagrams are usable.

## Execution Cards

### [x] P7B-00 - Conformation Source Lock And Candidate Rules

Goal: source-lock the supported conformation subset before implementation.

Planned files:

- docs/source/Rules_v2.md after the Rules-v2 pass is accepted
- docs/source/rules-v2-examples/index.md after example extraction is accepted
- RULES_V2_todo.md
- docs/rules/conformation.md
- docs/rules/open-verification.md
- docs/charge-phase-procedure-concept.md
- P7B_todo.md

Implementation steps:
1. Confirm P7A2 acceptance and verify that the current charge state exposes committed post-evade unit poses before conformation.
2. Confirm that the RV2-04 conformation/ZOC/terrain source-lock entries and the current RV2-05A recalibration notes still align across `docs/source/Rules_v2.md`, `docs/rules/conformation.md`, `docs/rules/zoc.md`, and this board; do not block on unrelated later rule areas.
3. Manually cross-check Rules p.50-54 plus Errata conformation changes against `docs/source/Rules_v2.md`, extracted example PNGs, and original scan pages.
4. Extract candidate rules for front, flank, rear, corner, selected `rear-or-flank` cases, incomplete conformation, and shifting from both prose and visual examples.
5. Decide which terrain and ZOC constraints are supported in the first P7B subset.
6. List group, support, special-base, column, and special-unit exceptions as explicit deferrals or blockers.

Non-goals:

- no engine code
- no UI work

Validation:

- markdown diagnostics pass
- open-verification IDs are aligned

Manual acceptance:

- user confirms the first conformation subset and deferrals

Stop condition:

- stop if front/flank/rear candidate geometry cannot be mapped from the source diagrams confidently enough
- stop if the Rules-v2 conformation/shifting examples are not yet extracted well enough to source-lock supported candidate geometry

Expected result: P7B starts from explicit source-backed candidate rules.

Progress 2026-05-26:

- Re-read `docs/rules/conformation.md`, `docs/rules/zoc.md`, and the RV2 conformation core/special-case corpus after accepted P7A2. The supported first subset is now explicit enough for implementation start: post-charge conformation is a separate solver stage, uses most-threatening-enemy input, follows the scan-backed slide-then-pivot reading, supports complete/incomplete/blocked/optional outcomes, and keeps shifting as a constrained helper rather than normal movement.
- The first P7B deferral boundaries are now explicit rather than implicit: group conformation, broad support-network solving, terrain-choice UX beyond blocker or optional surfacing, column special cases, and broad special-unit families remain deferred or diagnostic-only for the first implementation slice.
- Remaining open-verification items are narrowed to later solver precision, not phase-start blockers: `conformation.single-unit-candidate-selection` still carries direct errata confirmation plus exact geometry-predicate pinning, and `conformation.shifting-priority-and-locks` still carries direct errata confirmation for non-shiftable unit families and narrower exceptions. They no longer block the first supported P7B implementation slice.

Closeout 2026-05-26:

- `P7B-00` is satisfied for the approved first subset. The source-locked baseline, supported subset, and explicit deferrals are aligned across this board, `docs/rules/conformation.md`, `docs/rules/zoc.md`, and the open-verification ledger.
- Next exact card: `P7B-02 - Front Conformation Candidate Solver`.

### [x] P7B-01 - Conformation Data Model And Candidate Spine

Goal: create a serializable conformation model without applying movement.

Planned files:

- new src/engine/conformation/model.js
- new src/engine/conformation/model.test.js
- src/engine/conformation/index.js
- src/engine/charge/model.js if integration fields need adjustment

Implementation steps:
1. Define `ConformationPlan`, `ConformationCandidate`, `ConformationDiagnostic`, and optional-choice records.
2. Preserve source status and deterministic priority fields.
3. Keep candidates independent from UI rendering and from melee combat resolution.
4. Add serialization tests.

Non-goals:

- no candidate solver yet
- no UI rendering

Validation:

- focused model tests

Manual acceptance:

- user reviews model shape if questions arise

Stop condition:

- stop if the model cannot preserve enough evidence for replay and explanation

Expected result: P7B has a stable conformation data spine.

Progress 2026-05-26:

- Added a dedicated `src/engine/conformation/` model module with serializable factories for `ConformationPlan`, `ConformationCandidate`, `ConformationDiagnostic`, `ConformationOptionalChoice`, and `ConformationShiftPlan`, plus explicit status enums for plan, candidate, source, optional-choice, and shifting states.
- Kept the model independent from UI and melee logic: the new records only preserve replay-ready state such as contact snapshot/classification, controlling/principal opponent ids, deterministic ranking fields, optional-choice payloads, shifting micro-plan facts, and diagnostics.
- Wired the existing `createChargeConformationPlan(...)` helper through the new conformation model as a backward-compatible alias so later reducer/UI work can keep using the charge preview spine without duplicating conformation defaults.

Validation 2026-05-26:

- Focused model validation is green: `node --test src/engine/conformation/model.test.js src/engine/charge/model.test.js` passed `10/10`.

Closeout 2026-05-26:

- `P7B-01` is satisfied. P7B now has a stable serializable conformation data spine ready for the first candidate solver slice.
- Next exact card: `P7B-02 - Front Conformation Candidate Solver`.

### [x] P7B-02 - Front Conformation Candidate Solver

Goal: solve the simplest complete front-contact conformation case first.

Planned files:

- new src/engine/conformation/candidates.js
- new src/engine/conformation/candidates.test.js
- src/engine/geometry/ as reused helpers

Implementation steps:
1. Consume the actual charge contact pose, not the max-distance ghost.
2. Generate slide-then-pivot candidate geometry for front contact.
3. Validate battlefield bounds and obvious physical blockers.
4. Return complete, incomplete, blocked, or `needs-source-check` diagnostics.

Non-goals:

- no flank/rear solver yet
- no shifting yet
- no group conformation

Validation:

- tests for clean complete front conform, table-edge blocked, and blocker incomplete cases

Manual acceptance:

- user verifies pre-conform and post-conform ghost readability

Stop condition:

- stop if current geometry helpers cannot represent corner-to-corner alignment robustly

Expected result: a no-evade front charge can preview conformation.

Progress 2026-05-26:

- Added `src/engine/conformation/candidates.js` as the first supported front-only candidate solver. It consumes the actual `contactSnapshot`, builds a single ideal front-edge-to-front-edge pose from the committed contact state, and distinguishes three currently supported outcomes: clean complete conformation, table-edge-blocked conformation, and blocker-driven incomplete fallback.
- Reused existing geometry and overlap infrastructure instead of inventing a parallel collision system: the solver derives the ideal facing from the defender pose, checks battlefield containment, and uses the existing overlap helper from the evade-geometry seam to detect obvious physical blockers while still ignoring the attacker and principal defender themselves.
- Wired the supported no-reaction front-contact result into the reducer-owned charge preview path so a direct no-evade front charge now carries a non-idle `conformationPlan` immediately after contact is resolved. Unsupported non-front classifications still remain deferred to the next card instead of being silently guessed.

Validation 2026-05-26:

- Focused solver and preview validation is green: `node --test src/engine/conformation/candidates.test.js src/engine/conformation/model.test.js src/engine/charge/model.test.js src/state/p0-state.test.js` passed `170/170`.

Manual acceptance:

- Open. Verify in the battlefield that a direct front no-evade charge now shows a distinct post-conformation ghost/readout instead of staying at an idle conformation state.
- Expected result: after selecting a simple legal front charge lane, the charge preview reaches `ready`, the conformation plan is populated, and the front candidate remains visibly distinct from the raw pre-conform contact pose.

Closeout 2026-05-26:

- `P7B-02` is satisfied for the approved first subset. Front no-evade charge preview now carries a source-backed conformation candidate with explicit complete, blocked, and incomplete outcomes.
- Next exact card: `P7B-03 - Flank, Rear, And Rear-Or-Flank Candidates`.

### [x] P7B-03 - Flank, Rear, And Rear-Or-Flank Candidates

Goal: extend candidate generation to the non-front contact sides already classified in P7.

Planned files:

- src/engine/conformation/candidates.js
- src/engine/conformation/candidates.test.js
- src/state/p0-state.js or focused charge helper

Implementation steps:
1. Generate flank conformation candidates using stored classification/contact side.
2. Generate rear conformation candidates.
3. Consume reducer-owned selected side for `rear-or-flank` rather than guessing.
4. Preserve diagnostics when selected side is not physically conformable.

Non-goals:

- no support-factor calculation
- no melee modifier application

Validation:

- tests for flank, rear, and selected `rear-or-flank` cases

Manual acceptance:

- user verifies the chosen green contact side leads to the expected conformation candidate or visible blocked reason

Stop condition:

- stop if rear-corner errata cannot be interpreted safely for the selected subset

Expected result: all current P7 contact classifications can feed conformation preview.

Progress 2026-05-26:

- Extended `src/engine/conformation/candidates.js` from a front-only helper into a shared single-unit conformation resolver for front, flank, rear, and reducer-selected `rear-or-flank` cases while keeping the existing front entry point as a compatibility alias.
- Added source-backed non-front ideal poses from defender geometry only: rear candidates now align front-edge to rear-edge with matched facing, flank candidates align onto the classified left/right flank with the expected quarter-turn, and `rear-or-flank` stays blocked on explicit reducer selection instead of guessing.
- Threaded the reducer-owned `selectedContactSide` through `resolveChargePreviewConformationPlan(...)` and its preview/reaction callsites so the chosen `rear-or-flank` side now reaches conformation candidate generation during the real charge preview flow, not only in isolated solver tests.

Validation 2026-05-26:

- Focused solver and helper validation is green: `node --test src/engine/conformation/candidates.test.js src/state/p0-charge-preview-helpers.test.js` passed `8/8`.
- Narrow reducer integration validation is green: `node --test --test-name-pattern "charge target selection immediately readies a direct legal none-start charge|rear-or-flank charge contact selection stores the chosen legal side for the current defender" src/state/p0-state.test.js` passed `2/2`.

Manual acceptance:

- Open. In the battlefield, verify that a supported flank or rear charge now shows a non-idle conformation preview after no-evade handoff, and that a `rear-or-flank` case only resolves once the intended contact side has been selected.
- Expected result: front, flank, rear, and chosen `rear-or-flank` contacts all produce a conformation candidate or an explicit choice-required/blocked diagnostic instead of silently falling back to front-only handling.

Closeout 2026-05-26:

- `P7B-03` is satisfied for the approved first subset. The conformation preview path now covers all currently classified single-unit contact sides, while still refusing to invent a `rear-or-flank` side when the reducer has not selected one.
- Next exact card: `P7B-04 - Incomplete And Optional Conformation Diagnostics`.

### [x] P7B-04 - Incomplete And Optional Conformation Diagnostics

Goal: represent incomplete and optional conformation outcomes honestly.

Planned files:

- src/engine/conformation/candidates.js
- src/engine/conformation/candidates.test.js
- docs/rules/conformation.md

Implementation steps:
1. Implement source-backed fallback ordering for incomplete conformation where supported.
2. Represent optional penalizing-terrain choices as `optional-choice` when terrain facts are available.
3. Return `needs-source-check` for unsupported special cases instead of snapping visually.

Non-goals:

- no full terrain engine completion
- no automatic choice where player option exists

Validation:

- tests for incomplete flank/rear fallback and optional terrain placeholder cases

Logging / instrumentation expectations:

- Areas: `conformation`, `charge`, and `ui` if any preview-facing diagnostics change.
- Minimum level: `warn` for blocked, incomplete, optional, or `needs-source-check` outcomes; `debug` for candidate-status decision summaries if the existing logging path is touched.
- Browser/manual debug entry: use `docs/browser-automation.md` P7B/Charge Drill flow and filter for conformation-facing diagnostics when browser smoke is available.

Role routing:

- Implementing role: Coding Agent with GPT-5.4.
- Required review: Reviewer / Rules Agent with GPT-5.4 after implementation.
- Lead gate: only if optional terrain cannot be represented without changing P7B scope.
- Data / Validation mode: not expected.
- Current handoff brief: `docs/agents/p7b-04-handoff.md`.

Manual acceptance:

- user verifies incomplete/optional states are visible and not described as complete

Stop condition:

- stop if optional terrain cannot be represented without misleading legality

Expected result: conformation can fail or remain incomplete transparently.

Progress 2026-05-26:

- Extended `src/engine/conformation/candidates.js` so table-edge failure in the current single-unit subset falls back to explicit `incomplete` contact instead of a misleading blocked terminal result, matching the current source-locked reading that incomplete conformation is a real legal state when some contact can remain.
- Added an explicit optional-terrain branch gated by provided `terrainConformation` facts. The solver now emits `choice-required` plus `optional` / `incomplete` candidates only when the caller supplies concrete facts that full conformation would enter penalizing terrain.
- Added an explicit `special-case.needs-source-check` branch for war wagons, heavy artillery, and defensive-barrier cases so the solver does not silently claim generic support for those families before the later exception layer exists.
- Added focused tests for incomplete flank fallback, incomplete rear table-edge fallback, optional terrain choice surfacing, and special-case source-open diagnostics.

Validation 2026-05-26:

- `node --test src/engine/conformation/candidates.test.js src/state/p0-charge-preview-helpers.test.js`

Manual acceptance:

- UI visibility of incomplete/optional states remains for the later preview slice; do not mark manual acceptance complete yet.

Closeout 2026-05-26:

- `P7B-04` is complete for the approved single-unit solver subset. Incomplete and optional outcomes are now represented honestly in engine state, and unsupported special cases stay source-open instead of snapping visually.
- Next exact card: `P7B-05 - Shifting Skeleton`.

### [x] P7B-05 - Shifting Skeleton

Goal: add a first source-locked shifting plan for simple blockers.

Planned files:

- new src/engine/conformation/shifting.js
- new src/engine/conformation/shifting.test.js
- src/engine/conformation/candidates.js
- src/state/p0-state.js or focused charge helper

Implementation steps:
1. Source-lock minimum-number and minimum-distance shifting priority.
2. Model shifting as a conformation micro-operation, not normal movement.
3. Support one simple friendly blocker where shifting is legal.
4. Add shifted-unit phase lock hooks with verified light-troop exception only if source-closed.
5. Return blocked/incomplete diagnostics for unshiftable or chain cases.

Non-goals:

- no full chain-push solver
- no group conformation shifting completeness
- no rally implementation

Validation:

- tests for no shift, one legal shift, unshiftable blocker, and lock hook

Manual acceptance:

- user verifies shifting preview is visually distinct from charge-start slide

Stop condition:

- stop if shifting priority remains too source-open for deterministic implementation

Expected result: P7B can explain simple conformation blockers and one legal shift plan.

Progress 2026-05-26:

- Added `src/engine/conformation/shifting.js` with a first simple conformation-shift solver for one friendly blocker only. The solver applies minimum-distance direction ordering (rear first, then smaller flank option), treats shifting as a conformation micro-operation, and returns a serializable `shiftingPlan`.
- Integrated the shifting skeleton into `src/engine/conformation/candidates.js` so legal one-blocker cases now produce a complete conformation candidate with attached shift diagnostics/steps/lock effects instead of forcing incomplete fallback.
- Added lock metadata in the shift plan with a verified light-troops exception (`movedOrRalliedLock: false` for light troops, true otherwise).
- Added focused coverage in `src/engine/conformation/shifting.test.js` for no-shift, one legal shift, unshiftable blocker, and light-troops lock exception; updated `src/engine/conformation/candidates.test.js` blocker cases to assert the new simple-shift path where legal.
- Tightened rule honesty after review: blocked chain cases now stay blocked at the conformation-plan layer, errata-open blocker-family exceptions stay source-open instead of verified, and shifted supporting units are rejected unless the current unit facts explicitly preserve support after the shift.
- Added focused regressions for chain-case propagation, support-preservation blocking, and errata-open blocker-family handling so the one-blocker solver does not silently widen into a legal incomplete fallback.

Validation 2026-05-26:

- `node --test src/engine/conformation/shifting.test.js src/engine/conformation/candidates.test.js src/state/p0-charge-preview-helpers.test.js`

Manual acceptance (pending):

- Visual distinction between charge-start slide and conformation shifting remains pending until `P7B-06` UI rendering; do not mark this manual check complete yet.

Current residual risk:

- Only one-blocker shifting is implemented; chain shifts and broader support-network constraints still intentionally stop at blocked or source-open diagnostics as scoped non-goals, and support preservation only uses the current explicit unit fact hook rather than a full support-geometry solver.

Closeout 2026-05-26:

- `P7B-05` is complete for the approved one-blocker shifting subset. Reviewer follow-up accepted the rule-honesty correction: blocked chain cases stay blocked, errata-open blocker families stay source-open, and support-preservation now fails safely through the current explicit unit fact hook.
- Next exact card: `P7B-06 - Conformation Preview UI`.

### [x] P7B-06 - Conformation Preview UI

Goal: render conformation plans as read-only engine output.

Planned files:

- src/ui/p0-battlefield.js
- src/ui/battlefield-command-panel.js
- src/styles/p0-battlefield.css
- UI tests

Implementation steps:
1. Render post-conform ghost, incomplete/blocked styling, and optional-choice state.
2. Render shifting preview separately from charge-start slide.
3. Add side-panel explanation for selected candidate, blockers, ZOC, and source status.
4. Keep battlefield labels minimal and avoid UI-owned solving.

Non-goals:

- no combat UI
- no decorative explanations on the battlefield

Validation:

- render tests and browser smoke

Manual acceptance:

- user verifies conformation preview is understandable at normal gameplay zoom

Stop condition:

- stop if pre-contact, contact, and conform ghosts cannot be visually distinguished

Expected result: conformation is usable by a player before confirmation.

Progress 2026-05-26:

- A first coding slice has already been implemented in `src/ui/p0-battlefield.js`, `src/ui/battlefield-command-panel.js`, `src/styles/p0-battlefield.css`, `src/ui/p0-battlefield.test.js`, and `src/ui/battlefield-command-panel.test.js`.
- Focused UI validation is green: `node --test src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js` passed after the conformation/shift ghost and panel explanation slice landed.
- Editor diagnostics were clean on the touched UI, CSS, and test files.
- Browser smoke is only partially complete so far: one normal conformation live pass succeeded, but the second live pass was interrupted before a clean blocked/source-open closeout was recorded.

Closeout 2026-05-26:

- `P7B-06` is accepted for the supported preview subset. Focused UI validation and browser/manual acceptance are satisfied by the implemented conformation preview UI plus the accepted `CFD-E1` source-backed live shifting example.
- The remaining page-53 Conform Drill cases are not P7B-06 blockers because they need rule implementations outside the current preview-card scope.
- Next exact card: `P7B-07 - Apply Conformation And Charge Completion`.

### [x] P7B-07 - Apply Conformation And Charge Completion

Goal: finalize a supported charge into stable unit state ready for later melee.

Planned files:

- src/state/p0-charge-conformation-reducers.js
- src/state/p0-state.js
- src/state/p0-movement.js
- src/state/p0-reset-reducers.js
- src/state/p0-state.test.js
- src/ui/battlefield-command-panel.js
- src/ui/battlefield-command-panel.test.js
- src/ui/p0-wheel-controls.js

Implementation steps:
1. Confirm only resolved reaction/evade and legal conformation states.
2. Apply final charger pose and any supported shifted-unit poses.
3. Mark relevant units as in-contact/melee-pending for P9 without resolving combat.
4. Mark charging unit finished for movement phase.
5. Preserve contact/conformation metadata for P9 and P13 replay.

Non-goals:

- no melee dice
- no combat factors
- no cohesion/rout resolution beyond hooks

Validation:

- reducer tests for complete-only confirm, blocked or source-open or incomplete no-op confirm, shifted-unit lock, reset, and downstream engaged-defender reaction regression

Manual acceptance:

- user verifies a supported charge resolves onto the table and cannot be moved again this phase

Stop condition:

- stop if legal incomplete conformation confirmation cannot be source-closed

Expected result: P7B hands P8/P9 a stable contact/conformation state.

Closeout 2026-05-26:

- `P7B-07` is implemented for the source-backed complete/no-evade supported subset. The new reducer action confirms only `no-evade-handoff` previews with a `ready` conformation plan, a complete selected candidate with a final pose, and no blocked/source-open shifting plan.
- The supported CFD-E1 path now applies the charger final pose, applies the simple shifted-neighbor pose, records conformation/contact metadata on involved units, marks the charger movement-finished, locks non-light shifted units for movement/rally, records `lastChargeCompletion`, and resets the active charge preview.
- Blocked, source-open, and incomplete confirmation attempts remain no-ops in this card. Incomplete confirmation still requires the explicit warning surface from the P7B user gate before it can become confirmable.
- Validation: `node --test src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js` passed 191/191, `npm test` passed 514/514, and `npm run build` passed. Diagnostics on touched files are clean. Browser smoke on `http://127.0.0.1:4177/` confirmed the CFD-E1 no-evade flow exposes `Konformation bestaetigen`, applies B1/B2 poses, clears preview ghosts, and blocks another same-phase charge for B1.
- Manual acceptance remains: run CFD-E1 through no-evade, click `Konformation bestaetigen`, verify B1 snaps into conformed contact, B2 shifts, the preview clears, and B1/B2 cannot start further movement in the same Movement phase.
- Reviewer focus: confirm scenario honesty for complete-only practical support, no hidden melee resolution, guarded blocked/source-open behavior, shifted-unit lock handling, and metadata sufficiency for P9/P13.
- Next exact card: `P7B-08 - Validation And Handoff`.

### [x] P7B-08 - Validation And Handoff

Goal: close P7B with the required full-evade charger-follow-through repair, then finish automated, browser, and documentation validation.

Planned files:

- P7B_todo.md
- roadmap.md
- docs/rules/open-verification.md

Implementation steps:
1. Repair the accepted P7A/P7A2 full-evade not-caught branch if the charger still remains preview-only after the supported follow-through finishes.
2. Add a focused regression proving the supported full-evade branch commits the charger's canonical pose when no secondary pause or conformation handoff remains.
3. Run focused and full test suites.
4. Run build.
5. Browser-smoke front, flank, rear, rear-or-flank, incomplete, blocked, simple-shift, and full-evade follow-through commit cases.
6. Record all deferred group and special cases honestly.
7. Confirm P8 shooting can start with a stable pre-melee contact state.

Non-goals:

- no P8 shooting implementation
- no P9 melee combat implementation

Validation:

- `npm run test`
- `npm run build`
- browser smoke on local Vite app
- explicit full-evade not-caught follow-through check: the charger must not remain preview-only if the supported branch finishes without a secondary pause or conformation handoff

Manual acceptance:

- user approves P7B completion before P8 starts

Stop condition:

- stop if conformation state is not stable enough for later melee support/factor classification
- stop if a supported full-evade not-caught branch still leaves the charger only in `chargePreview.chargeMovementPlan` instead of canonical unit state

Expected result: P7B closes the basic pre-P16 conformation foundation and unblocks P8.

Routing note 2026-05-26:

- This card now explicitly owns the accepted follow-through gap: a supported full-evade not-caught branch must not leave the charger only in `chargePreview.chargeMovementPlan` once the branch is finished.
- Coding Agent scope for this card: repair the owning charge follow-through reducer path, add the narrow regression, rerun focused tests first, then broader validation, and update this card plus `roadmap.md` with the actual outcome.
- Reviewer / Rules Agent scope after the fix: confirm the repaired branch is rule-honest for the supported subset, does not hide a secondary pause, does not over-apply melee, and leaves P7B/P8 routing claims accurate.
- Focused fix status 2026-05-26: the owning follow-through reducers now commit the charger into canonical `game.units` when a supported full-evade branch ends with no contact events and no open continuation pause. Focused state validation is green for the new impetuous no-pause auto-commit regression and for the non-impetuous stop-choice commit path. Full suite, build, browser smoke, and reviewer re-review remain part of the still-open `P7B-08` closeout.
- Focused drill-stall update 2026-05-26: the reported Charge Drill evade-follow-up behavior still splits into two exact drill lanes, but the front lane now has a narrower source-honest repair. The exact front lane no longer invents a start-origin wheel; it now resolves as a committed late left slide off the straight evade path, and only then surfaces adjusted charge. The exact flank lane still remains correctly gated behind the hotseat handoff and defender choice after evade roll `6`. Focused engine, reducer, and command-panel regressions are green for both exact drill lanes, and the old impetuous command-panel expectation remains aligned with the already-supported auto-commit completion flow.

Closeout 2026-05-28:

- `P7B-08` implementation/validation is complete for the supported subset. The follow-through commit repair is in place and the owning state regression for the impetuous full-evade not-caught branch remains green; the charger no longer stays preview-only when the supported branch ends without a continuation pause or remaining contact.
- Validation passed after updating stale evade UI/solver expectations to the current supported behavior: `node --test --test-name-pattern "impetuous full-evade follow-through commits the charger|stop-choice commit" .\src\state\p0-state.test.js`, focused evade UI/engine/reducer reruns, `npm run test` passed 583/583, and `npm run build` passed with only the existing large-chunk warning.
- Built-app browser smoke on `http://127.0.0.1:4176/` confirmed the supported front-lane flow through `Neues Spiel -> Charge Drill -> Beginnen -> Corps 1 -> unit 1 -> Charge -> unit 15 -> Richtung bestaetigen`, with the charge-reaction modal visible for `P2 Front Target` and explicit `Ausweichen` / `Nicht ausweichen` actions present.
- Validation also re-synced the truth surface around current evade honesty: source-open table-edge cases remain source-open rather than auto-committed removal in the current subset, and the older obstacle-wheel/table-edge expectations were updated accordingly. Full-evade follow-through commit remains covered by reducer tests rather than a browser-end-to-end full continuation smoke in this closeout.
- Reviewer closeout wording fix 2026-05-28: roadmap and rules wording now keep table-edge evade explicitly source-open, and the two committed table-exit UI tests are labeled as generic fixture coverage rather than a live reducer path.
- Residual risk: browser smoke for the broader front/flank/rear/rear-or-flank/incomplete/blocked/simple-shift/full-evade scenario matrix was not replayed exhaustively in this closeout; that breadth still relies on the now-green automated coverage plus future manual review.
- Manual acceptance remains: verify the supported Charge Drill front-lane smoke in the browser and confirm P7B is accepted before P8 starts.
- Reviewer focus: confirm the updated P7B truth surface is still rule-honest for the supported subset, especially full-evade follow-through commit into canonical unit state, source-open table-edge handling, refreshed evade candidate expectations, and the claim that P8 now only waits on review/user approval rather than missing automation.
- Next exact handoff: short Reviewer / Rules Agent recheck for `P7B-08`, then Coding Agent may continue with `P7C-00A` while P8 remains gated on review/user approval.