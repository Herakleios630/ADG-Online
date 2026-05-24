# P7B TODO - Conformation + Shifting Foundation

Status: Draft - P7A prerequisite satisfied on 2026-05-21; P7A2 acceptance is still required before phase start, and the conformation source-lock baseline now exists from RV2-04 with RV2-05A recalibration in progress; pending user review and explicit approval before phase start
Date drafted: 2026-05-20
Planner: AdG-Rules-Engine-Agent
Preferred future executor: GPT-5.4 after user approval
Intended branch: feature/p7b-conformation-foundation
Master plan: roadmap.md
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

- P7A2 must be accepted before P7B implementation starts. P7B must not build conformation candidates from a ghost-only `evadePlan`; it needs the evader's actual post-evade board state or an explicit source-locked non-board-pose outcome.
- The Rules-v2 source-lock baseline in `docs/source/Rules_v2.md` plus `docs/rules/conformation.md` and `docs/rules/zoc.md` is now the working conformation basis. P7B still requires user approval before implementation starts, and its remaining risk is the narrowed errata/solver layer rather than broad source unreadability.

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
- After each completed card, update this file with files touched, validation run, manual acceptance instructions, and the next exact card to execute.

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

- `P7B-00`: confirm P7A2 is accepted and that conformation consumes committed post-evade state, not a preview-only ghost.
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

### [ ] P7B-00 - Conformation Source Lock And Candidate Rules

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

### [ ] P7B-01 - Conformation Data Model And Candidate Spine

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

### [ ] P7B-02 - Front Conformation Candidate Solver

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

### [ ] P7B-03 - Flank, Rear, And Rear-Or-Flank Candidates

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

### [ ] P7B-04 - Incomplete And Optional Conformation Diagnostics

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

Manual acceptance:

- user verifies incomplete/optional states are visible and not described as complete

Stop condition:

- stop if optional terrain cannot be represented without misleading legality

Expected result: conformation can fail or remain incomplete transparently.

### [ ] P7B-05 - Shifting Skeleton

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

### [ ] P7B-06 - Conformation Preview UI

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

### [ ] P7B-07 - Apply Conformation And Charge Completion

Goal: finalize a supported charge into stable unit state ready for later melee.

Planned files:

- src/state/p0-state.js or focused charge state helper
- src/state/p0-state.test.js
- docs/rules/open-verification.md

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

- reducer tests for confirm, blocked confirm, incomplete legal confirm, shifted-unit lock, and reset

Manual acceptance:

- user verifies a supported charge resolves onto the table and cannot be moved again this phase

Stop condition:

- stop if legal incomplete conformation confirmation cannot be source-closed

Expected result: P7B hands P8/P9 a stable contact/conformation state.

### [ ] P7B-08 - Validation And Handoff

Goal: close P7B with automated, browser, and documentation validation.

Planned files:

- P7B_todo.md
- roadmap.md
- docs/rules/open-verification.md

Implementation steps:
1. Run focused and full test suites.
2. Run build.
3. Browser-smoke front, flank, rear, rear-or-flank, incomplete, blocked, and simple-shift cases.
4. Record all deferred group and special cases honestly.
5. Confirm P8 shooting can start with a stable pre-melee contact state.

Non-goals:

- no P8 shooting implementation
- no P9 melee combat implementation

Validation:

- `npm run test`
- `npm run build`
- browser smoke on local Vite app

Manual acceptance:

- user approves P7B completion before P8 starts

Stop condition:

- stop if conformation state is not stable enough for later melee support/factor classification

Expected result: P7B closes the basic pre-P16 conformation foundation and unblocks P8.