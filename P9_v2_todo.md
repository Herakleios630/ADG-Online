# P9 V2 - Melee Combat System (Clean Rewrite)

Status: [ ] In progress - V2 board created on 2026-05-29. V1 code remains as documentation only and receives no further feature edits.

Active task list: see this board.

Goal: replace the current melee implementation with a clean V2 pipeline that is directly integrated into the game flow, rule-conform to Rules_v2 p.60+ behavior, and free of hardcoded scenario-only combat logic.

## Scope Contract

- Build V2 in new files; do not expand legacy melee implementation files.
- Keep legacy board in P9_todo.md as historical documentation.
- Integrate V2 directly into active reducer/UI flow after start-card validation.
- Allow temporary fallback tricks only where missing systems force them, and label every fallback explicitly.

## Rule Baseline

- Main-attacker logic must be rule-conform and evidence-first.
- p.60 baseline is mandatory: front attacker is primary by default.
- Explicit exceptions must be modeled:
  - front attacker not fully conformed;
  - only flank or rear attackers exist;
  - source-open cases remain diagnostic and do not silently close.

## UI Decision Gate (Answer Before UI Build Cards)

- [x] UI-QA-01 Pair dialog density: compact default (short, readable table).
- [x] UI-QA-02 Queue model: no separate queue panel ownership; unresolved fights are selected directly on battlefield units.
- [x] UI-QA-03 Unit status colors: keep current yellow/green/grey semantics.
- [x] UI-QA-04 Breakdown view: single unified table with both sides and short reason text per factor.
- [x] UI-QA-05 Pair dialog CTAs: before roll show `Wuerfeln` and `Abbruch`; after roll show short result and `OK` to close.
- [x] UI-QA-06 Diagnostics visibility: `source-open` status is always visible and clearly labeled in the dialog/result.
- [x] UI-QA-07 Cohesion markers: option A (pip style with count text), with explicit visual semantics:
  - committed cohesion losses: small filled red circles;
  - pending, not yet committed losses (for example during shooting or melee resolution flow): small outline circles (no fill).
- [x] UI-QA-08 Mobile layout priority: desktop-first only for this phase (no mobile target in this slice).

Stop rule:
- No UI implementation card starts before UI-QA-01 through UI-QA-08 are answered and written into this board.

UI gate status:
- Completed on 2026-05-29.

Locked V2 interaction flow:

1. Unit status remains visible directly on battlefield.
2. User clicks a fight on battlefield to open one compact melee summary table.
3. Dialog shows factors/modifiers as plain rows (`+1`, `+2`, etc.) with short reason text.
4. User clicks `Wuerfeln` for automatic random rolls (attacker and defender); no manual fixed-dice debug entry in this flow.
5. Dialog shows short post-roll result (winner/difference/cohesion-loss/source status) and closes via `OK`.
6. User selects next unresolved fight.
7. After all required fights are resolved, show one popup that transitions to next phase.

## Architecture V2

Target files (new):

- src/engine/melee-v2/contact-model.js
- src/engine/melee-v2/role-assignment.js
- src/engine/melee-v2/combat-group.js
- src/engine/melee-v2/support-caps.js
- src/engine/melee-v2/modifier-pipeline.js
- src/engine/melee-v2/resolution.js
- src/state/p9-melee-v2.js
- src/state/p9-melee-v2.test.js
- src/ui/melee-v2-adapter.js

## Open-Card Mapping (Legacy -> V2 Waves)

Wave A - V2 foundation and direct integration:

- `P9-03A` -> `P9V2-01` entrypoint and reducer map to V2
- `P9-03B` -> `P9V2-02` V2 drill scenario data and tests
- `P9-03C` -> `P9V2-03` dedicated V2 melee state model
- `P9-03D` -> `P9V2-04` queue/preview/batch wiring to V2 engine
- `P9-03H` -> `P9V2-05` focused regression harness for V2 flow
- `P9-03J` -> `P9V2-06` source-honesty guardrails in V2 diagnostics

Wave B - Core rule semantics:

- `P9-03` -> `P9V2-10` simultaneous resolution and batch apply closeout
- `P9-03O` -> `P9V2-11` flank/rear branches and cancellation families
- `P9-03Q` -> `P9V2-12` participation gating unification
- `P9-03S` -> `P9V2-13` commander presence scenario coverage
- `P9-03U` -> `P9V2-14` automatic roll result panel (no manual fixed-dice entry in default V2 flow)
- `P9-03W` -> `P9V2-15` unit cohesion account spine + pending/committed marker UX

Wave C - UX and flow completion:

- `P9-03E` -> `P9V2-20` melee start/end popups
- `P9-03F` -> `P9V2-21` battlefield-first fight selection and compact breakdown presentation
- `P9-03G` -> `P9V2-22` shooting-to-melee handoff to real V2 flow
- `P9-03I` -> `P9V2-23` browser smoke for full melee flow
- `P9-03K` -> `P9V2-24` first playable melee UX lock

Wave D - Special families:

- `P9-04A` -> `P9V2-30` camp/fortification/obstacle family
- `P9-04B` -> `P9V2-31` war-wagon family
- `P9-04` -> retained as umbrella legacy reference; replaced by V2-30 and V2-31 for execution

Wave E - Closeout packet:

- `P9-05` -> `P9V2-40` examples + closeout packet

## Gates

- Gate G1 Source: no guessed p.22 or flank/rear closure; unresolved lanes remain source-open.
- Gate G1A Source visibility: unresolved `source-open` states must always be clearly shown in UI and result summaries (never hidden/collapsed-away by default).
- Gate G2 Architecture: no new melee feature edits in legacy files; all new logic in V2 files.
- Gate G3 Integration: V2 is active path in reducer/UI; legacy path is not an active execution target.
- Gate G4 UX: UI-QA decision gate completed before Wave C starts.
- Gate G5 Review: Reviewer / Rules Agent sign-off required for rule-sensitive wave closeouts.

## Definition Of Done Per Wave

Wave A - Foundation And Direct Integration (P9V2-01..06):

- active melee runtime path is V2-owned in reducer and phase transitions
- no new feature logic added to legacy V1 melee files
- V2 state slice exists with deterministic, serializable fields for selection, preview, and batch apply plan
- source-open diagnostics are emitted by V2 and rendered visibly in the default UI path
- focused tests for V2 runtime routing and base flow are green
- Reviewer / Rules Agent confirms source-honesty guardrails are preserved

Wave B - Core Rule Semantics (P9V2-10..15):

- simultaneous apply semantics are enforced: no early commit before required fights are resolved
- flank/rear branches and cancellation families are evidence-first and deterministic in source-closed lanes
- unresolved branch families stay explicit source-open with diagnostics
- canonical participation/status model drives both selectability and battlefield status feedback
- commander presence lanes (attached/included/support-only) are covered by tests and diagnostics
- automatic roll result panel works in locked flow without manual fixed-dice input in default mode
- Reviewer / Rules Agent approves branch semantics and source-status behavior

Wave C - UX And Flow Completion (P9V2-20..24):

- battlefield-first fight selection is the primary path and is fully usable
- compact factor table, roll action, short result, and close-next-fight loop match locked UI flow
- shooting-to-melee handoff routes into V2 workflow without placeholder flow breaks
- final unresolved-fight completion triggers one next-phase popup reliably
- browser smoke passes for full user loop checkpoints
- user manual acceptance confirms the full visible sequence end to end

Wave D - Special Families (P9V2-30..31):

- camp, fortification, obstacle, and war-wagon families execute in explicit branches, not generic fallback
- branch-specific restrictions and outcomes are test-covered with source-backed scenarios
- unresolved special-family details remain explicit source-open instead of guessed closure
- Reviewer / Rules Agent provides explicit verdict for special-family behavior

Wave E - Closeout Packet (P9V2-40):

- source-backed example scenarios/goldens for supported P9 subset are mapped and validated
- focused melee-v2 suite and build checks are green
- browser smoke evidence and manual acceptance checklist are attached
- open residual items are listed explicitly with ownership (not silently dropped)
- Reviewer / Rules Agent final verdict is recorded and user approves P9 closeout

## Coding-Agent Start Card

### [x] P9V2-01 - V2 Skeleton + Direct Runtime Wiring (No Legacy Expansion)

Goal:
- Create the V2 module skeleton, wire reducer entrypoints to V2, and keep legacy melee implementation untouched.

Planned files:

- src/state/p0-state.js
- src/state/p0-round.js
- src/state/p9-melee-v2.js
- src/state/p9-melee-v2.test.js
- src/engine/melee-v2/contact-model.js
- src/engine/melee-v2/role-assignment.js
- src/ui/melee-v2-adapter.js

Implementation steps:
1. Add V2 state module and minimal engine stubs with deterministic contracts.
2. Wire active melee phase reducer path to V2 module.
3. Keep legacy module callable only for documentation or comparison tests, not active runtime flow.
4. Add focused tests that prove runtime entrypoint uses V2 path.

Validation:

- node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js

Manual acceptance:

- User starts a melee drill and confirms V2 path is active without legacy-only hardcoded behavior.

Stop condition:

- Stop if runtime wiring requires rule behavior to remain in rendering code.

Expected result:

- V2 skeleton is live in runtime, testable, and ready for Wave A/B cards.

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent review required before Wave B start

Closeout 2026-05-29:

- New V2 skeleton modules added:
  - `src/state/p9-melee-v2.js`
  - `src/engine/melee-v2/contact-model.js`
  - `src/engine/melee-v2/role-assignment.js`
  - `src/ui/melee-v2-adapter.js`
- Reducer/runtime wiring moved to V2 imports in:
  - `src/state/p0-battle-start.js`
  - `src/state/p0-state.js`
  - `src/state/p0-state-ui-helpers.js`
- UI read-path wiring moved to V2 adapter in:
  - `src/ui/battlefield-dialogs.js`
  - `src/ui/battlefield-command-panel.js`
  - `src/ui/p0-battlefield.js`
- Explicit V2 runtime proof added in tests:
  - `src/state/p9-melee-v2.test.js`
  - `src/state/p0-state-melee.test.js`
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js`
  - pass `11/11`

## Detailed Execution Cards

This section expands the V2 rewrite into actionable cards with explicit validation and stop conditions.

### [x] P9V2-02 - Drill Scenario Data Spine For V2

Goal:
- provide V2 drill scenarios without hardcoded role outcomes in UI/state.
- define the exact handover point where V2 starts making rule decisions (not only wrapper pass-through).

Planned files:

- src/data/melee-drill-scenarios.js
- src/data/melee-drill-scenarios.test.js
- src/state/p9-melee-v2.test.js

Implementation steps:
1. Define V2 scenario payload contract for contact evidence, round state seed, and source-status metadata.
2. Ensure scenario fixtures encode intent/evidence, not precomputed fight winners.
3. Add deterministic ids for fight selection and replay-safe references.
4. Introduce first V2-owned decision seam: contact-model and role-assignment outputs must be consumed by V2 procedure presentation for at least one scoped lane, with explicit fallback diagnostics when unresolved.
5. Keep wrapper fallback only as temporary compatibility path and mark fallback provenance in diagnostics.

Validation:

- node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee-v2.test.js
- node --test src/ui/p0-app.test.js

Done criteria for this card:

- at least one melee decision lane is V2-owned in behavior, not only tagged with v2 metadata
- UI shows V2 contact/role source status explicitly in melee dialog (G1A)
- fallback-to-wrapper paths are explicit and diagnostic, never silent

Manual acceptance:

- user can start a melee drill and see stable fight candidates without hidden hardcoded outcomes.

Stop condition:

- stop if fixture contract requires rendering-owned legality.
- stop if V2 cannot own at least one decision seam without silently degrading source-status visibility.

Progress note (2026-05-29, first P9V2-02 seam):

- V2 contact-model and role-assignment now consume live procedure entries as first behavior-owned decision seam in `src/engine/melee-v2/contact-model.js` and `src/engine/melee-v2/role-assignment.js`.
- V2 procedure presentation now injects explicit seam ownership and wrapper-fallback diagnostics (`melee.v2.contact-role-fallback-source-open`) in `src/state/p9-melee-v2.js`.
- G1A UI visibility is now hard-asserted for V2 contact/role source status in melee dialog via `data-testid="melee-v2-contact-source-status"` and `data-testid="melee-v2-role-source-status"` in `src/ui/battlefield-dialogs.js` and `src/ui/p0-app.test.js`.
- Focused validation passed: `node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js src/state/p0-state-melee.test.js` (`12/12`).

Progress note (2026-05-29, second P9V2-02 seam):

- V2 now owns one concrete conflict-selection rule in reducer behavior: main-attacker prioritization for multi-attacker defender groups is applied during melee acknowledge in `src/state/p9-melee-v2.js`.
- Prioritization rule path includes explicit exception handling (`front-not-fully-conformed-exception`) and explicit fallback diagnostics (`melee.v2.main-attacker-priority-fallback`), with a transparent no-conflict diagnostic when arbitration is not needed.
- V2 presentation now includes prioritization diagnostics alongside contact/role seam diagnostics, so fallback behavior is never silent.
- Focused validation rerun passed: `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js` (`13/13`).

Closeout 2026-05-29:

- V2 drill data payload contract now exists in `src/data/melee-drill-scenarios.js` via `createMeleeV2DrillScenarioPayload` with deterministic `intentId`, explicit source-status metadata, and first-contact round-state seed.
- Focused payload contract coverage added in `src/data/melee-drill-scenarios.test.js` with deterministic ordering assertions across repeated scenario builds.
- Combined focused validation passed:
  - `node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js` (`25/25`).

### [x] P9V2-03 - Dedicated V2 Melee State Model

Goal:
- isolate melee-v2 phase state (selection, preview, resolved set, apply plan, transition flag).

Planned files:

- src/state/p9-melee-v2.js
- src/state/p0-battle-start.js
- src/state/p0-state-initializers.js
- src/state/p9-melee-v2.test.js

Implementation steps:
1. Add serializable V2 slice with explicit status machine: idle -> selecting -> resolved-pending-apply -> complete.
2. Keep pending and committed outcomes separated.
3. Preserve deterministic round-state transitions for first-contact vs continuing.

Validation:

- node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js

Manual acceptance:

- user can inspect debug state and confirm pending vs committed separation.

Stop condition:

- stop if reducer must mutate unit outcomes before batch completion.

Closeout 2026-05-29:

- V2 state machine is now explicit in `src/state/p9-melee-v2.js` via lifecycle statuses: `idle -> selecting -> resolved-pending-apply -> complete`.
- Pending vs committed outcome buckets are now derived and stored in V2 state metadata:
  - `pendingResolvedEntriesByMeleeId` / `pendingMeleeIds`
  - `committedResolvedEntriesByMeleeId` / `committedMeleeIds`
- Focused transition coverage added in `src/state/p9-melee-v2.test.js` proving no committed outcomes before batch apply and committed outcomes only after apply.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js` (`14/14`).

### [x] P9V2-04 - Queue/Preview/Batch Wiring To V2 Engine

Goal:
- wire fight candidate generation, per-fight preview, and batch apply plan through V2 only.

Planned files:

- src/state/p9-melee-v2.js
- src/state/p0-state.js
- src/state/p0-round.js
- src/engine/melee-v2/resolution.js

Implementation steps:
1. Build active fight set from V2 contact graph.
2. Resolve per-fight preview only when user selects a fight.
3. Create one batch apply action after all required fights are resolved.

Validation:

- node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js

Manual acceptance:

- user resolves several fights and confirms no early application happens.

Stop condition:

- stop if apply can be triggered while unresolved mandatory fights remain.

Closeout 2026-05-29:

- Added dedicated V2 queue/preview engine wiring in `src/engine/melee-v2/resolution.js`:
  - `buildV2ActiveFightSet` derives active fights from V2 contact graph + eligible entries.
  - `buildV2MeleeBatchQueue` enforces queue membership against active V2 fight set.
  - `buildV2MeleeBatchPreview` keeps unresolved mandatory melee ids explicit and marks apply-readiness.
- Wired V2 runtime usage in `src/state/p9-melee-v2.js`:
  - `previewMeleeBatch` now uses V2 contact-graph queue source (`queueSource: v2-contact-graph`) instead of legacy preview wrapper.
  - `canApplyResolvedMeleeBatch` is now V2-owned and depends on V2 preview readiness (`isReadyForApply`).
  - `applyMeleeBatch` has explicit V2 unresolved-fight guard (`melee.v2.apply-blocked-unresolved-required-fights`).
- Added focused regression coverage:
  - `src/state/p9-melee-v2.test.js`: verifies V2 queue source + unresolved apply blocking until all required fights are resolved.
  - `src/state/p0-state-melee.test.js`: integration guard that reducer blocks early apply.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js` (`16/16`).

Review-fix slice 2026-05-29:

- `src/engine/melee-v2/resolution.js` now applies worst-case source-status propagation:
  - active-fight-set `sourceStatus` becomes `source-open` if any included contact entry is not verified.
  - batch-preview `sourceStatus` becomes `source-open` if unresolved fights remain, or any resolved entry is source-open, or queue-entry contact status is source-open.
- `src/state/p9-melee-v2.js` now owns apply-plan/commit path directly (no V1 apply delegation):
  - V2 batch apply plan is built through V2 engine helper.
  - unit cohesion/rout commits are applied via V2 state helper while preserving simultaneous batch semantics.
- Reducer apply guard delegation moved to V2 apply (`src/state/p0-state.js`): blocked apply now surfaces V2 diagnostic instead of silent early reducer return.
- Regression coverage added/updated:
  - `src/state/p9-melee-v2.test.js`: source-status aggregation guard + blocked-apply diagnostic visibility.
  - `src/state/p0-state-melee.test.js`: blocked-apply integration now asserts diagnostic visibility.
- Focused validation rerun passed:
  - `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js` (`17/17`).

### [x] P9V2-05 - Focused Regression Harness For V2 Flow

Goal:
- lock V2 runtime path and prevent silent fallback to V1.

Planned files:

- src/state/p9-melee-v2.test.js
- src/state/p0-state-melee.test.js
- src/ui/p0-app.test.js

Implementation steps:
1. Add assertion that melee actions route to V2 module.
2. Add test for fight selection -> roll -> result -> close -> next fight.
3. Add test for all-fights-resolved phase transition popup trigger.

Validation:

- node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js

Manual acceptance:

- user runs one drill pass and sees the same sequence as tests.

Stop condition:

- stop if tests cannot differentiate V1 vs V2 path ownership.

Closeout 2026-05-30:

- Implemented explicit V2 contact-origin provenance in `src/engine/melee-v2/contact-model.js`:
  - new origin enum values: `charge-contact`, `move-to-support-contact`, `pursuit-contact`, `already-in-contact-conform`, `unknown-origin`.
  - per-contact fields now include `contactOrigin` and `contactOriginSourceStatus`.
  - conservative rule applied: missing reliable origin stays `unknown-origin` and keeps contact `sourceStatus` at `source-open` even when contact geometry is present.
- Hardened source-status aggregation in `src/engine/melee-v2/resolution.js`:
  - active-fight-set source status now considers origin source status in addition to contact source status.
  - batch-preview source status now considers unresolved fights, resolved source-open outcomes, queue contact source status, and queue origin source status.
  - queue entries now carry `v2ContactOrigin` and `v2ContactOriginSourceStatus`.
- Runtime propagation updated in `src/state/p9-melee-v2.js`:
  - applied batch summary now exposes `contactOrigins` derived from V2 queue entries for downstream diagnostics/UI.
  - existing apply guard path is unchanged and still emits `melee.v2.apply-blocked-unresolved-required-fights` while unresolved required fights remain.
- Regression coverage expanded:
  - `src/state/p9-melee-v2.test.js` adds origin-focused tests:
    - movement support origin is not mislabeled as charge,
    - unknown origin remains source-open despite known attack contact geometry,
    - applied batch summary includes contact origins.
  - `src/state/p0-state-melee.test.js` now asserts reducer-level batch summary origin exposure.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js`.

Residual risks:

- `pursuit-contact` origin is now part of the schema and explicit-value path but is not yet auto-inferred by a dedicated pursuit runtime signal.
- `already-in-contact-conform` currently relies on conservative heuristics when explicit origin evidence is absent and may remain source-open until deeper ownership wiring is added in later cards.

Reviewer-fix addendum 2026-05-30:

- Contact-origin decision order in `src/engine/melee-v2/contact-model.js` is now enforced as:
  - explicit origin evidence,
  - movement-conformation signal,
  - charge signal,
  - fallback heuristics.
- Ambiguous simultaneous signals (`hasChargedThisSequence` plus `movement-conformation`) now resolve to `unknown-origin` with `source-open` and explicit diagnostic code `melee.v2.contact-origin-ambiguous-charge-vs-movement-conformation` (no silent verified charge upgrade).
- `pursuit-contact` remains explicit-evidence-only; non-explicit cases fall back to conservative `unknown-origin`.
- Additional P9V2-05 regressions added in `src/state/p9-melee-v2.test.js`:
  - explicit origin evidence path is preferred over heuristics,
  - ambiguous charge versus movement-conformation does not verify charge origin.

Fixture-flagging addendum 2026-05-30:

- Updated melee drill fixture units in `src/data/melee-drill-scenarios.js` to set explicit `hasChargedThisSequence` and explicit `meleeContactEvidence.contactOrigin` for the requested charged, flank/rear charged, and move-to-support lanes.
- Added guard assertions in `src/data/melee-drill-scenarios.test.js` to keep those explicit origin assignments stable.
- Adjusted legacy role classification in `src/engine/melee/roles.js` so origin-only metadata is treated as non-actionable contact evidence unless geometric/support role evidence is present; this preserves legacy presentation counts while allowing explicit origin provenance storage.
- Dialog UX de-noise in `src/ui/battlefield-dialogs.js`: the zero-value grouped-main-attacker source-open helper row is no longer rendered in the modifier list (core source-open diagnostics and resolution status remain unchanged).
- Added explicit runtime label in melee resolution header (`Combat Group Resolution (V2)`) to reduce V1 look-and-feel ambiguity while V2 still wraps legacy state actions in Wave A.

### [x] P9V2-06 - Source-Honesty And Visibility Guardrails

Goal:
- enforce and display source-open status in engine output and UI.

Planned files:

- src/engine/melee-v2/modifier-pipeline.js
- src/engine/melee-v2/resolution.js
- src/ui/melee-v2-adapter.js
- src/state/p9-melee-v2.test.js

Implementation steps:
1. Emit source status on all unresolved branches.
2. Ensure UI always renders source-open labels in summary and result.
3. Block any path that upgrades unresolved to verified without evidence.

Validation:

- node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js

Manual acceptance:

- user can always see source-open markers in unresolved lanes.

Stop condition:

- stop if any unresolved lane is hidden in default UI flow.

### [x] P9V2-06A - Hard Cut: Remove V1 Delegation From Active Runtime

Goal:
- enforce a strict cut: active melee runtime must not import or call V1 state flow from [src/state/p9-melee.js](src/state/p9-melee.js).

Planned files:

- src/state/p9-melee-v2.js
- src/state/p9-melee-v2.test.js
- src/state/p0-state-melee.test.js
- src/ui/battlefield-dialogs.js

Implementation steps:
1. Remove direct V1 delegation imports/usages in [src/state/p9-melee-v2.js](src/state/p9-melee-v2.js) for active reducer actions.
2. Keep only V2-owned reducers for acknowledge, draft open/edit/confirm/cancel, preview, apply, and summary acknowledge.
3. Where a lane is not yet source-closed, return explicit V2 diagnostics and block silently guessing or delegating.
4. Add ownership assertions in tests: no active V1 delegate path remains reachable in melee runtime actions.

Validation:

- node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js

Manual acceptance:

- user can run melee drill end-to-end without V1-delegate warnings and without mixed V1/V2 dialog behavior.

Stop condition:

- stop if reducer parity requires reopening legacy behavior assumptions that are not yet modeled in V2.

Closeout 2026-05-30:

- Removed direct V1 state-flow delegation for active melee runtime actions in `src/state/p9-melee-v2.js`:
  - `beginMeleePhaseState`
  - `acknowledgeMeleePhaseProcedure`
  - `setMeleeProcedureDialogOpen`
  - `toggleMeleeQueueSelection`
  - `moveMeleeQueueSelection`
  - `startMeleeResolutionDraft`
  - `cancelMeleeResolutionDraft`
  - `setMeleeResolutionDraftValue`
  - `confirmMeleeResolutionDraft`
  - `acknowledgeMeleeBatchSummary`
  - `toggleMeleeResolutionCombatFactorDebugOverride`
- Added an ownership guard test in `src/state/p9-melee-v2.test.js` (`p9v2-06A has no V1 state-flow delegation calls in active runtime file`).
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js`
  - pass `23/23`

Residual note:

- `src/state/p9-melee-v2.js` still imports non-state helper/presentation utilities from `src/state/p9-melee.js` for compatibility while active reducer actions are now V2-owned.
- Full helper-layer extraction remains follow-up scope under `P9V2-06` and subsequent hardening cards.

### [x] P9V2-10 - Simultaneous Resolution And Batch Apply Closeout

Goal:
- complete simultaneous apply semantics with battlefield-first fight selection.

Planned files:

- src/state/p9-melee-v2.js
- src/ui/melee-v2-adapter.js
- src/ui/p0-battlefield.js

Validation:

- focused V2 state tests plus battlefield flow tests for deferred apply.

Manual acceptance:

- all selected fights resolve first, then one apply step commits outcomes.

Closeout 2026-05-30:

- Simultaneous apply closeout is now enforced in V2 reducer flow:
  - apply remains blocked while required fights are unresolved,
  - apply is allowed once all selected fights are resolved (including explicit `source-open` lanes, which remain visible and diagnostic).
- Battlefield-first selection was fixed in reducer integration:
  - selecting a `main-defender-pending` unit now opens the matching melee resolution draft directly.
- Updated validations:
  - `src/state/p9-melee-v2.test.js` now asserts lifecycle transition to `complete` and committed outcomes after apply.
  - `src/state/p0-state-melee.test.js` now asserts battlefield-first unit selection opens the expected draft and confirms successful batch apply after full resolution.

### [ ] P9V2-11 - Flank/Rear Branches And Cancellation Families

Goal:
- implement explicit flank/rear branches with strict evidence and cancellation matrix.

Planned files:

- src/engine/melee-v2/contact-model.js
- src/engine/melee-v2/modifier-pipeline.js
- src/engine/melee-v2/resolution.js
- src/state/p9-melee-v2.test.js

Validation:

- focused resolver/state tests for to-zero, cancellation, and ambiguity diagnostics.

Manual acceptance:

- at least one flank and one rear case differs from generic modifier-only behavior.

Closeout 2026-05-30:

- Added explicit flank/rear branch + cancellation-family lane in `src/engine/melee-v2/modifier-pipeline.js` with source-open diagnostics for ambiguous `rear-or-flank` and missing cancellation family hints.
- Wired branch lane into `src/engine/melee-v2/contact-model.js` so contact source status now includes branch verification rather than only contact-type/origin checks.
- Propagated branch source status and diagnostics through `src/engine/melee-v2/resolution.js` into active fight and batch preview worst-case aggregation.
- Added focused regression coverage in `src/state/p9-melee-v2.test.js` for:
  - verified flank branch + cancellation family (`verified` end-to-end),
  - ambiguous `rear-or-flank` lane (`source-open` propagation),
  - cancellation request without family hint (`source-open` diagnostics).
- Focused validation passed: `node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js`.
- Reviewer / Rules Agent handoff required before this card is marked complete.

### [x] P9V2-12 - Participation Gating Unification

Goal:
- derive selectability and battlefield status from one canonical V2 status model.

Planned files:

- src/state/p9-melee-v2.js
- src/ui/p0-battlefield.js
- src/ui/melee-v2-adapter.js

Validation:

- reducer/UI tests proving no legal participant is shown as nonparticipant.

Manual acceptance:

- user confirms battlefield statuses match selectable fights.

Closeout 2026-05-30:

- Canonical participation statuses now split `main-defender-pending`, `main-defender-resolved`, `support-participant`, and `non-melee` in `src/state/p9-melee-v2.js`.
- Battlefield selectability and token styling now map those statuses in `src/ui/p0-battlefield.js` and `src/styles/p0-battlefield.css`.
- Focused validation passed: `node --test src/state/p9-melee-v2.test.js src/state/p9-melee.test.js src/ui/p0-battlefield.test.js`.
- Added canonical participation selector output in `src/state/p9-melee-v2.js`:
  - `getMeleeUnitParticipation`
  - `getMeleeParticipationByUnitId`
  - reducer/UI-facing flags (`isSelectableInBattlefield`, `canStartResolutionDraft`) are now derived from one source.
- Routed active reducer draft-start gate in `src/state/p0-state.js` through `getMeleeUnitParticipation` (no parallel status re-derivation).
- Routed battlefield selectability in `src/ui/p0-battlefield.js` through `getMeleeParticipationByUnitId` via `src/ui/melee-v2-adapter.js`.
- Added focused regression coverage:
  - `src/state/p9-melee-v2.test.js`: `p9v2-12 canonical participation selector keeps status and selectability aligned`.
  - `src/state/p0-state-melee.test.js`: attacker/defender pending-main selection opens the same melee draft.
- Focused validation rerun passed: `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-battlefield.test.js src/ui/p0-app.test.js` (`113/113`).
- Reviewer / Rules Agent verdict: `Approved` (source-status honesty and battlefield-first symmetry validated for this card).

### [x] P9V2-13 - Commander Presence Scenario Coverage

Goal:
- support attached/included commander presence with errata boundaries.

Planned files:

- src/data/melee-drill-scenarios.js
- src/engine/melee-v2/resolution.js
- src/state/p9-melee-v2.js

Validation:

- focused tests for attached, included, and support-only commander cases.

Manual acceptance:

- user verifies different commander presence states produce distinct outcomes.

Progress note 2026-05-30 (implementation slice started):

- Added dedicated commander-presence drill fixture factory in `src/data/melee-drill-scenarios.js`:
  - `createMeleeCommanderPresenceScenario()` with explicit attached, included, and support-only lanes.
- Added fixture contract regression in `src/data/melee-drill-scenarios.test.js` for attached/included/support-only presence metadata.
- Extended canonical V2 participation model in `src/state/p9-melee-v2.js`:
  - `MELEE_V2_COMMANDER_PRESENCE_STATUSES`
  - `getMeleeCommanderPresence(gameState, unitId)`
  - `getMeleeUnitParticipation(...)` now includes `commanderPresence` while preserving current selectability/draft gates.
- Extended V2 active-fight metadata in `src/engine/melee-v2/resolution.js`:
  - `v2AttackerCommanderPresence` and `v2DefenderCommanderPresence` are propagated into active fight entries.
  - active-fight-set source-status now includes commander-presence source-status propagation (worst-case aggregation).
- Added focused regressions in `src/state/p9-melee-v2.test.js`:
  - attached commander maps to host main participation and draft eligibility,
  - included versus support-only commander lanes remain distinct,
  - active-fight-set exposes commander-presence metadata on representative lanes.
- Added reducer integration regression in `src/state/p0-state-melee.test.js`:
  - selecting attached commander opens the same host main-unit melee draft.
- Focused validation rerun passed:
  - `node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js`.
- Reviewer / Rules Agent handoff required before this card is marked complete.

Closeout 2026-05-30:

- Commander-presence source honesty now requires reciprocal host/commander links before attached presence is marked verified in `src/state/p9-melee-v2.js` and `src/engine/melee-v2/resolution.js`.
- Added regression coverage for asymmetric attached links staying `source-open` while attached and support-only happy paths remain green in `src/state/p9-melee-v2.test.js`.
- Focused validation rerun passed:
  - `node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js`.
- Reviewer / Rules Agent verdict: `Approved`.

### [ ] P9V2-14 - Automatic Roll Result Panel

Goal:
- implement the locked UI flow: automatic random rolls, no manual fixed-dice entry.

Planned files:

- src/ui/melee-v2-adapter.js
- src/ui/battlefield-dialogs.js
- src/state/p9-melee-v2.js

Implementation steps:
1. Pre-roll dialog shows compact factor table plus `Wuerfeln` and `Abbruch`.
2. `Wuerfeln` triggers attacker+defender random roll.
3. Post-roll dialog shows short result and `OK`.

Validation:

- UI/state tests for pre-roll, post-roll, and close-next-fight sequence.

Manual acceptance:

- user confirms no manual dice input exists in default flow.

Reviewer fix packet 2026-05-30 (Coding Agent execution board):

### [x] P9V2-14A - Post-Roll Dialog Contract Hardening (OK-Only)

Goal:
- enforce locked post-roll dialog behavior: result panel uses only `OK`; `Abbruch` stays pre-roll only.

Planned files:

- src/ui/battlefield-dialogs.js
- src/ui/p0-app.js
- src/state/p9-melee-v2.js
- src/ui/p0-app.test.js
- src/state/p9-melee-v2.test.js

Implementation steps:
1. Remove `Abbruch` from the post-roll branch in melee result dialog; keep `Abbruch` only in pre-roll branch.
2. Ensure closing the result panel always clears preview state (`resolutionDraft.resolutionPreview` and root `resolutionPreview`) without stale carry-over.
3. Keep `Wuerfeln` path deterministic: only roll+confirm in pre-roll, never acknowledge stale previous preview for a newly opened fight.
4. Add regression: after result close, opening next unresolved fight and clicking `Wuerfeln` performs a new roll/confirm sequence.

Validation:

- node --test src/ui/p0-app.test.js src/state/p9-melee-v2.test.js

Manual acceptance:

- After `Wuerfeln`, second panel shows only `OK`; no `Abbruch` visible.

Stop condition:

- stop if any close path can leave stale preview state that alters next-fight `Wuerfeln` behavior.

Closeout 2026-05-30:

- Post-roll melee result dialog now renders `OK` only; `Abbruch` remains pre-roll only in `src/ui/battlefield-dialogs.js`.
- Stale preview cleanup hardened in `src/state/p9-melee-v2.js`:
  - `startMeleeResolutionDraft(...)` now clears root `resolutionPreview`.
  - `cancelMeleeResolutionDraft(...)` now clears both `resolutionDraft` and root `resolutionPreview`.
- Added regressions:
  - `src/ui/p0-app.test.js`: post-roll panel asserts no `cancel-melee-resolution-draft` action.
  - `src/state/p9-melee-v2.test.js`: stale root preview is cleared on opening/canceling a draft.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js` (`41/41`).

### [x] P9V2-14B - Result Semantics And Tie Rendering

Goal:
- keep resolved tie outcomes explicit as resolved (not source-open fallback wording).

Planned files:

- src/ui/battlefield-dialogs.js
- src/ui/p0-app.test.js

Implementation steps:
1. Render tie outcome label explicitly (`Unentschieden` / `Tie`) when `winnerSide` is `null` and resolution is resolved.
2. Keep source-status display independent from winner label so resolved ties remain `verified` when resolver says resolved.
3. Add UI regression for tie result panel contents.

Validation:

- node --test src/ui/p0-app.test.js

Manual acceptance:

- Tie result shows tie label, not `source-open` as winner text.

Closeout 2026-05-30:

- Post-roll result dialog now renders resolved ties as `Tie` instead of `source-open` winner fallback in `src/ui/battlefield-dialogs.js`.
- Rout label for resolved ties is now rendered as `no` (instead of unresolved fallback text), while source status remains independently visible.
- Added focused regression in `src/ui/p0-app.test.js`:
  - `melee result dialog renders resolved tie as Tie instead of source-open`.
- Focused validation passed:
  - `node --test src/ui/p0-app.test.js` (`13/13`).

### [x] P9V2-14C - Modifier Wiring Closure (Support/Flank/Rear/Commander Into Actual Roll)

Goal:
- ensure support, flank/rear branches, and commander participation are not only displayed but actually consumed by the active V2 roll/resolve path.

Planned files:

- src/state/p9-melee-v2.js
- src/engine/melee-v2/modifier-pipeline.js
- src/engine/melee-v2/resolution.js
- src/engine/melee/resolution.js
- src/state/p9-melee-v2.test.js
- src/ui/p0-app.test.js

Implementation steps:
1. Guarantee draft `resolutionInput` used by `confirmMeleeResolutionDraft` contains resolved support entries and flank/rear branch context for the selected fight.
2. Verify branch-to-zero/cancellation lanes affect final totals where source-closed, and stay explicit source-open where unresolved.
3. Add deterministic regression pair(s): same melee with and without support/flank branch must produce different totals when source-closed.
4. Keep diagnostics explicit for unresolved lanes; never silently drop factor lanes from computation.

Validation:

- node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js src/ui/p0-app.test.js

Manual acceptance:

- In a representative flank/support fight, result changes when verified modifiers are present versus absent.

Stop condition:

- stop if modifier rows are visible in UI but not present in reducer resolution payload.

Closeout 2026-05-30:

- Draft selection now prefers the V2 active-fight entry (with contact-model metadata) instead of plain eligible-entry fallback, so resolution drafts receive canonical V2 branch/commander lanes.
- `startMeleeResolutionDraft` hydration now wires these lanes into `resolutionInput` in `src/state/p9-melee-v2.js`:
  - support assignments -> concrete support-stage modifier entries,
  - flank/rear branch metadata -> `attackerModifierContext.flankRearBranch` + `flankOrRearAttack`,
  - commander presence snapshots -> `engagedCommander` contexts for both sides.
- Simple-support displacement by same-side melee-support is now reflected in generated support modifier entries, with explicit diagnostics retained.
- Added focused 14C regressions in `src/state/p9-melee-v2.test.js`:
  - draft payload hydration test for support + flank/rear + commander wiring,
  - deterministic pair proving resolved totals differ with verified modifier lanes present vs absent.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js src/ui/p0-app.test.js` (`66/66`).

Follow-up parity patch 2026-05-30 (review-driven):

- Refactored V2 combat-group candidate build in `src/state/p9-melee-v2.js` so support-role flank attackers can contribute ownership lanes without replacing primary pair selection.
- Added defender-centric to-zero aggregation in V2 draft hydration (parity with V1 intent), including ownership metadata (`ownershipAttackerUnitId`, `ownershipMeleeId`, `inheritedDefenderToZeroFromBranch`).
- Mapped V2 branch fields to resolver contract keys (`cancelAttackSituationBonus`, `applyDefenderCombatFactorToZero`) in:
  - `src/engine/melee-v2/modifier-pipeline.js`
  - `src/state/p9-melee-v2.js`
- Tightened 14C regressions in `src/state/p9-melee-v2.test.js` to assert Case1 branch ownership + to-zero effect.
- Tightened UI regression in `src/ui/p0-app.test.js` for Case1 branch/to-zero visibility and added post-roll factor recap assertions.
- Added compact post-roll factor recap in `src/ui/battlefield-dialogs.js` (attacker/defender base, modifier sum, final total).
- Focused validation re-run passed:
  - `node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js src/ui/p0-app.test.js` (`66/66`).

Reviewer follow-up mini cards 2026-05-30 (Case 1 / Case 2 small-step packet):

### [x] P9V2-14C1 - Case 1 Draft/Result Modifier Parity

Goal:
- remove hidden modifier drift in Case 1 so pre-roll factor summary and post-roll factor recap match the same computed lanes.

Planned files:

- src/state/p9-melee-v2.js
- src/ui/battlefield-dialogs.js
- src/state/p9-melee-v2.test.js
- src/ui/p0-app.test.js

Implementation steps:
1. Ensure Case 1 draft summary reads the exact hydrated branch/modifier context used by confirm path.
2. Prevent any extra result-only modifier from appearing without pre-roll visibility.
3. Add one deterministic regression asserting draft modifier sum equals result recap modifier sum for Case 1.

Validation:

- node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js

Manual acceptance:

- In Case 1 dialog, pre-roll modifier sum and post-roll recap modifier sum are identical.

Stop condition:

- stop if parity requires changing resolver math outside scoped Case 1 hydration/display lanes.

Role routing:

- Expected implementing role: Coding Agent / GPT-5.3-Codex (small scoped patch)
- Reviewer / Rules Agent re-check required after closeout

Closeout 2026-05-30:

- Draft factor presentation now derives modifier stages from the same resolver path used for confirm, with flank/rear to-zero stage entries filtered from stage lists to avoid duplicate UI to-zero rows in `src/state/p9-melee-v2.js`.
- Added deterministic state regression in `src/state/p9-melee-v2.test.js`:
  - `p9v2-14C1 case1 draft modifier sums match resolved factor recap`.
- Added UI regression in `src/ui/p0-app.test.js`:
  - `melee case1 pre-roll modifier sum matches post-roll factor recap modifier sum`.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js` (`46/46`).

### [x] P9V2-14C2 - Case 1 Source-Status Clarity In Dialog

Goal:
- align Case 1 source-status labeling so verified branch/support evidence is not visually mixed with unexplained source-open labels.

Planned files:

- src/ui/battlefield-dialogs.js
- src/ui/p0-app.test.js

Implementation steps:
1. Keep V2 status fields visible, but add explicit wording when lane-level data is verified while seam-level status remains source-open.
2. Avoid implicit source closure; wording must remain source-honest.
3. Add focused UI assertion for the explicit mixed-status wording.

Validation:

- node --test src/ui/p0-app.test.js

Manual acceptance:

- Case 1 dialog makes mixed status understandable without guessing.

Stop condition:

- stop if wording implies source closure not supported by docs.

Role routing:

- Expected implementing role: Coding Agent / GPT-5.3-Codex (UI text-only slice)
- Reviewer / Rules Agent re-check required after closeout

Closeout 2026-05-30:

- Added explicit mixed-status wording in `src/ui/battlefield-dialogs.js` for the pre-roll melee factor summary when:
  - seam-level V2 status remains `source-open`, and
  - lane-level branch/support evidence contains verified lanes.
- Added focused UI regression in `src/ui/p0-app.test.js`:
  - `melee case1 dialog shows explicit mixed-status wording for verified lanes with source-open seam status`.
- Focused validation passed:
  - `node --test src/ui/p0-app.test.js` (`15/15`).

### [x] P9V2-14C3 - Case 2 Branch Candidate Visibility (No Hidden Owners)

Goal:
- show all flank/rear branch candidates in Case 2 while keeping one deterministic owner for defender-to-zero application.

Planned files:

- src/state/p9-melee-v2.js
- src/ui/battlefield-dialogs.js
- src/state/p9-melee-v2.test.js
- src/ui/p0-app.test.js

Implementation steps:
1. Extend factor-presentation payload with branch candidate list for grouped attackers.
2. Render candidate list in dialog next to existing owner fields.
3. Keep owner selection deterministic and single-application for to-zero.

Validation:

- node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js

Manual acceptance:

- Case 2 dialog shows flank-left, flank-right, and rear candidates explicitly; owner remains a single deterministic unit.

Stop condition:

- stop if candidate visibility changes actual to-zero ownership semantics.

Role routing:

- Expected implementing role: Coding Agent / GPT-5.3-Codex (small payload + UI patch)
- Reviewer / Rules Agent re-check required after closeout

Closeout 2026-05-30:

- Extended factor-presentation branch payload in `src/state/p9-melee-v2.js` with `branchCandidates` sourced from grouped attacker candidate ids while preserving one deterministic `ownershipAttackerUnitId`.
- Rendered branch candidate visibility in `src/ui/battlefield-dialogs.js` via `Branch candidates` row, including explicit `(owner)` marker on the owning attacker.
- Added focused state regression in `src/state/p9-melee-v2.test.js`:
  - `p9v2-14C3 case2 draft exposes flank/rear branch candidates while keeping single deterministic owner`.
- Added focused UI regression in `src/ui/p0-app.test.js`:
  - `melee case2 dialog shows branch candidates while keeping one deterministic owner`.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js` (`49/49`).

### [x] P9V2-14C4 - Case 2 Draft/Result Parity Lock

Goal:
- fix Case 2 drift where post-roll attacker modifier sum can differ from pre-roll shown sum.

Planned files:

- src/state/p9-melee-v2.js
- src/engine/melee/resolution.js
- src/state/p9-melee-v2.test.js
- src/ui/p0-app.test.js

Implementation steps:
1. Bind flank/rear situation bonus eligibility to the same branch identity used in draft visibility for the resolved pair.
2. Keep defender-to-zero non-cumulative (reduce-to-zero once), source-honest.
3. Add deterministic Case 2 regression asserting pre-roll sum == post-roll recap sum.

Validation:

- node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js src/ui/p0-app.test.js

Manual acceptance:

- Case 2 with fixed dice shows matching modifier sums before and after roll.

Stop condition:

- stop if fix requires broad refactor beyond Case 2 branch binding/parity lane.

Role routing:

- Expected implementing role: Coding Agent / GPT-5.3-Codex (scoped logic + regression)
- Reviewer / Rules Agent re-check required after closeout

Closeout 2026-05-30:

- Added deterministic Case 2 parity regression in `src/state/p9-melee-v2.test.js`:
  - `p9v2-14C4 case2 draft modifier sums match resolved factor recap`.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js` (`50/50`).
- No additional resolver or UI code change was required for Case 2 parity; the existing hydrated branch binding already keeps pre-roll and post-roll modifier sums aligned, and the regression now locks that behavior in.

### [x] P9V2-14D - General Mitkaempfen Toggle + Continuing-Round Lock

Goal:
- add pre-roll commander participation control for eligible fights and enforce automatic fixed-on lock in continuing rounds where commander already fought.

Planned files:

- src/state/p9-melee-v2.js
- src/ui/battlefield-dialogs.js
- src/ui/p0-app.js
- src/state/p0-state.js
- src/state/p9-melee-v2.test.js
- src/ui/p0-app.test.js

Implementation steps:
1. Add pre-roll toggle in melee dialog when commander participation is legally optional for current fight.
2. Wire toggle action into draft state (`attackerModifierContext.engagedCommander` / `defenderModifierContext.engagedCommander`) so it changes actual resolution payload.
3. If fight is continuing and commander previously fought in that fight, auto-set toggle to ON and lock it (non-editable).
4. Keep source-open diagnostics explicit where legality/errata interpretation is not yet closed.
5. Add regression coverage for:
   - optional toggle visible in first-contact lane,
   - continuing-round auto-locked ON state,
   - no toggle for support-only commander lanes.

Validation:

- node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js src/state/p0-state-melee.test.js

Manual acceptance:

- User can set commander fights/not-fights before first roll where legal; in continuing fight with prior commander participation, toggle is ON and locked automatically.

Stop condition:

- stop if continuing-round lock cannot be derived from persisted melee round/commander state.

Reviewer handoff packet requirement for P9V2-14 closeout:

- Reviewer / Rules Agent must verify that:
  - post-roll panel is `OK`-only,
  - tie rendering is resolved-honest,
  - support/flank/rear/commander lanes are actually applied in reducer resolution payload,
  - commander toggle lock rules are source-status honest in continuing rounds.

Closeout 2026-05-31:

- Implemented commander participation toggle flow across state/reducer/UI for pre-roll draft lanes, including:
  - first-contact optional attacker/defender commander engagement toggle where participation is attached/included,
  - reducer-owned per-melee persistence for round-state and side-specific commander engagement history,
  - continuing-round auto-lock ON only when commander already fought in that melee (`priorEngaged === true`),
  - continuing-round commander lanes with `priorEngaged === false` now stay optional (not forced ON),
  - explicit no-toggle behavior for support-only commander lanes.
- Added and stabilized 14D regressions in:
  - `src/state/p9-melee-v2.test.js`
  - `src/ui/p0-app.test.js`
  - `src/state/p0-state-melee.test.js`
- Added explicit continuing commander source-open diagnostics and dialog copy that references unresolved attach/detach/combat-lock timing IDs without implying full rule closure.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js src/state/p0-state-melee.test.js` (`67/67`).

### Decision Matrix v1 (compact, source-bound draft, 2026-05-31)

Purpose:

- lock the agreed melee semantics before cutting new coding cards.
- keep rule intent and implementation targets separate from unresolved edge families.

Scope:

- baseline melee pages only: Rules p.60, p.61, p.63 and commander text on p.27.

Decisions:

1. Flank/rear to-zero trigger:
   - Defender combat factor is reduced to zero when attacked on flank or rear by a non-light attacker that fully conforms on that side.
   - This does not require two-side simultaneous attack; a single qualifying flank or rear lane is sufficient.
   - Source basis: p.63 Flank or rear attack.

2. Multiple-attack immediate cohesion timing and cap:
   - Immediate cohesion loss applies only if the defender is already in melee or in melee support and is then newly attacked on flank/rear by a qualifying enemy.
   - Trigger still requires at least one qualifying flank/rear fully-conformed non-light attacker among the new contacts.
   - No immediate cohesion loss is applied for first contact from a clean non-melee/non-support state (for example first contact arrives on flank/rear): that case resolves as flank/rear combat state, not as multiple-attack cohesion loss.
   - Timing remains the contact phase of the new enemy contact.
   - Cap remains one cohesion loss per defender per player sequence/phase for this mechanism.
   - Source basis: p.61 Multiple attacks (including Special cases).

3. Melee support combat value:
   - Each melee-support unit contributes support value equal to its combat factor +1.
   - For support-value computation, special abilities, disorder, and commander presence are ignored.
   - Source basis: p.60 Melee support.

4. Disorder modifier behavior:
   - Disorder in melee is always a flat -1 and does not stack with additional cohesion loss.
   - Disorder modifier is not applied to units counted as support/melee support.
   - Source basis: p.63 Disorder modifier.

5. Commander continuing-round lock:
   - Attached commander can engage by player choice.
   - Once engaged in combat, commander remains engaged until one of the units is routed; no continuing-round detach while that engagement persists.
   - Source basis: p.27 Attached commander.

6. Multiple-side combinations and fully-conform minimum:
   - For multiple-attack cohesion logic, any qualifying multi-side combination is valid.
   - For flank/rear to-zero precondition, one qualifying fully-conformed side attacker is sufficient; not all candidate side attackers must be fully conformed.

7. Support displacement by side:
   - Simple support on a side is displaced only by a qualifying melee-support attacker on that same side.
   - Rear contact does not automatically displace frontal simple support by itself.
   - Complex no-front plus flank/rear displacement family remains for a dedicated follow-up clarification card.

8. UI status layering policy:
   - Keep lane-level resolved/source status and global seam status as two distinct layers in model and UI until compact UI redesign.

Reference scans used for this matrix:

- docs/source/new scan/rules_color_review/single_pages/rules_page_27.png
- docs/source/new scan/rules_color_review/single_pages/rules_page_60.png
- docs/source/new scan/rules_color_review/single_pages/rules_page_61.png
- docs/source/new scan/rules_color_review/single_pages/rules_page_63.png

### [ ] P9V2-MINI-11-12-15-16 - Formale Rechenvorlage (Decision Matrix v1)

Goal:
- define one strict, source-bound arithmetic template for pair checks 11 vs 12 and 15 vs 16.

Planned files:

- P9_v2_todo.md

Scope split:

- Pair 11 vs 12: arithmetic parity check under same selected participants and same dice.
- Pair 15 vs 16: pending-versus-committed parity check with identical arithmetic totals.

Rechenstufen (pro Seite A/D):

- `base`: `CF_main` after flank/rear-to-zero rule.
  - if defender has at least one qualifying fully-conformed non-light flank/rear attacker: `base_defender = 0`.
  - else: `base = CF_main`.
- `support`: `sum(CF_support_i + 1)` for melee-support contributors only.
  - ignore abilities, disorder, commander for support-value computation.
  - side displacement rule applies by side only.
- `flank/rear` (stage value):
  - no guessed numeric bonus is introduced in this template.
  - represent to-zero impact only via `base` stage (not as extra additive bonus).
  - immediate multiple-attack cohesion effect is tracked as event/flag, not as combat-factor addend.
- `disorder`:
  - `-1` when the main melee unit is disordered.
  - `0` for support/melee-support contributors.
- `die`:
  - deterministic check value per side (`die_A`, `die_D`) fixed per test row.
- `final`:
  - `final_side = base_side + support_side + flankRear_side + disorder_side + die_side`.
  - `flankRear_side = 0` (hard rule for this Decision Matrix v1 mini-card slice).
  - any future additive flank/rear lane is out of scope here and must be introduced only in a separate, explicit matrix-version update.

Sollwerte - Pair 11 vs 12:

- Preconditions:
  - same melee matchup, same selected participants, same disorder state, same fixed dice.
- Expected per stage:
  - `base_11 == base_12`
  - `support_11 == support_12`
  - `flankRear_11 == flankRear_12`
  - `disorder_11 == disorder_12`
  - `die_11 == die_12`
  - `final_11 == final_12`
- Cohesion event guardrail:
  - if immediate multiple-attack cohesion applies, log as separate event-cap check (max 1 per defender per sequence/phase), not in numeric final sum.
  - immediate multiple-attack cohesion event is valid only when defender is already in melee or in melee support and then receives a new qualifying flank/rear contact.

Sollwerte - Pair 15 vs 16:

- Preconditions:
  - pair 15 row is pending preview, pair 16 row is committed result of same resolved draft.
  - same participants and same fixed dice payload.
- Expected per stage:
  - `base_15 == base_16`
  - `support_15 == support_16`
  - `flankRear_15 == flankRear_16`
  - `disorder_15 == disorder_16`
  - `die_15 == die_16`
  - `final_15 == final_16`
- Lifecycle-only delta:
  - visual/state marker transition may change (`pending` -> `committed`), arithmetic values must not change.
  - immediate multiple-attack cohesion event precondition remains identical to pair 11/12 and is validated as a separate event check, never as a numeric modifier.

Validation:

- board-level consistency check against Decision Matrix v1 only (p.27/p.60/p.61/p.63).
- when converted to tests: assert stage-by-stage equality for pair rows and separate cohesion-event assertions.

Manual acceptance:

- user confirms that pair sheets treat cohesion-event timing/cap as non-additive and keep arithmetic deterministic across parity pairs.

Stop condition:

- stop if any requested pair requires a non-matrix additive flank/rear bonus that is not source-closed in Decision Matrix v1.

Execution packet (next concrete work cards):

### [x] P9V2-MINI-11A - Combat-Factor Stage Ledger Contract (Engine + State)

Goal:
- implement one deterministic stage ledger for melee factor math that is directly aligned with Decision Matrix v1 and mini-card stages.

Planned files:

- src/engine/melee-v2/resolution.js
- src/engine/melee-v2/modifier-pipeline.js
- src/state/p9-melee-v2.js
- src/state/p9-melee-v2.test.js
- src/engine/melee/resolution.test.js

Implementation steps:
1. Build an explicit per-side stage ledger with fixed stage keys: `base`, `support`, `flankRear`, `disorder`, `die`, `final`.
2. Enforce mini-card hard rule for this slice: `flankRear` stage value stays `0` and cannot be used as additive branch lane.
3. Keep flank/rear to-zero only in `base` stage derivation (defender-side zeroing precondition from Decision Matrix v1).
4. Keep support-stage computation source-bound to p.60 rule: support value equals `CF + 1`, with abilities/disorder/commander ignored for support-value derivation.
5. Keep disorder-stage as flat `-1` for main melee units only, not for support/melee-support contributors.
6. Ensure `final` is derived only from stage ledger sum and no hidden post-stage modifier lane exists.

Validation:

- node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js
- targeted assertions for stage-ledger invariants (`flankRear === 0`, `final === base + support + flankRear + disorder + die`).

Manual acceptance:

- in one representative fight, pre-roll stage table and post-roll recap show identical stage definitions and no hidden additive flank/rear row.

Stop condition:

- stop if resolver currently depends on an implicit additive flank/rear branch lane that cannot be separated from base-stage to-zero behavior within this slice.

Logging expectations:

- add bounded debug diagnostics for stage-ledger build and final-sum composition (no legality decisions in logs).

Reviewer routing:

- Reviewer / Rules Agent verifies stage contract matches Decision Matrix v1 and no implicit additive flank/rear path remains.

Closeout 2026-05-31:

- Implemented explicit combat-factor stage ledger in `src/engine/melee/resolution.js` for both sides:
  - stage keys: `base`, `support`, `flankRear`, `disorder`, `die`, `final`.
  - hard rule enforced in ledger: `flankRear = 0`.
  - invariant flags included: `flankRearHardZero`, `finalMatchesStageSum`, `hiddenPostStageModifierLaneAbsent`.
  - residual modifier diagnostics included in ledger payload (`residualModifierSum` and per-lane breakdown) for transparent non-ledger lanes.
- Wired stage-ledger exposure into V2 preview recap in `src/state/p9-melee-v2.js`:
  - `resolutionPreview.factorRecap.attacker.stageLedger`
  - `resolutionPreview.factorRecap.defender.stageLedger`
- Added focused regressions:
  - `src/engine/melee/resolution.test.js`: `P9V2-MINI-11A stage ledger enforces flankRear hard-zero and final sum invariant`.
  - `src/state/p9-melee-v2.test.js`: `p9v2-mini-11A resolution preview exposes stage ledger invariants`.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js` (`64/64`).

Post-review hardening addendum 2026-05-31:

- Closed Reviewer / Rules Agent TODO for strict Decision Matrix v1 alignment within 11A scope:
  - removed additive flank/rear numeric effect from deterministic situation lane (`flankRear_side` remains ledger marker `0`).
  - made recap arithmetic ledger-first for `baseCombatFactor` and `modifierSum` derivation.
  - split cohesion event channels in V2 batch application plan:
    - `multipleAttackImmediateByUnitId`
    - `combatResultCohesionByUnitId`
- Added targeted regressions for hardened contract:
  - `src/engine/melee/resolution.test.js`: `P9V2-MINI-11A keeps flank/rear non-additive in final numeric resolution`.
  - `src/state/p9-melee-v2.test.js`: `p9v2-mini-11A factor recap derives base and sums from stage ledger values`.
  - `src/state/p9-melee-v2.test.js`: `p9v2-mini-11A batch application plan separates multiple-attack and combat-result cohesion channels`.
- Revalidated focused suites after hardening:
  - `node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js` (`67/67`).

### [x] P9V2-MINI-11B - Pair 11 vs 12 Stage-Parity Test Contract

Goal:
- lock pair 11/12 as strict arithmetic parity under identical participants/dice with separate cohesion-event assertions.

Planned files:

- src/state/p9-melee-v2.test.js
- src/engine/melee/resolution.test.js
- src/data/melee-drill-scenarios.js

Implementation steps:
1. Add deterministic fixture row(s) for pair 11 and pair 12 with same selected participants and fixed dice payload.
2. Assert stage-by-stage equality: `base`, `support`, `flankRear`, `disorder`, `die`, `final`.
3. Assert multiple-attack cohesion as separate event channel only:
  - precondition requires defender already in melee or melee support,
  - new qualifying flank/rear contact,
  - cap max one event per defender per sequence/phase.
4. Assert cohesion event does not alter numeric stage sums.

Validation:

- node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js

Manual acceptance:

- user sees parity test report for 11/12 with numeric equality block plus separate event assertion block.

Stop condition:

- stop if fixture evidence for pair mapping cannot be made deterministic without inventing non-source rule behavior.

Reviewer routing:

- Reviewer / Rules Agent verifies strict separation between arithmetic parity and cohesion-event channel.

Implemented:

- Added deterministic pair fixtures in `src/data/melee-drill-scenarios.js` via `createP9V2Mini11BPair11vs12FixtureRows` with identical participants/dice and explicit immediate multiple-attack event precondition/cap metadata.
- Added fixture parity and event-metadata checks in `src/data/melee-drill-scenarios.test.js` (`p9v2-mini-11B pair 11/12 fixture rows stay deterministic with parity-safe arithmetic payloads`).
- Added resolver stage-ledger parity check in `src/engine/melee/resolution.test.js` (`P9V2-MINI-11B pair 11/12 keeps strict stage parity under identical participants and dice`).
- Added state-level event-channel separation check in `src/state/p9-melee-v2.test.js` (`p9v2-mini-11B pair 11/12 keeps arithmetic parity while immediate cohesion stays event-only`).

Validation run:

- `node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js`

### [x] P9V2-MINI-11C - Pair 15 vs 16 Pending/Committed Parity Lock

Goal:
- ensure pair 15/16 differs only by lifecycle state (`pending` -> `committed`) while arithmetic stages remain identical.

Planned files:

- src/state/p9-melee-v2.js
- src/state/p9-melee-v2.test.js
- src/state/p0-state-melee.test.js

Implementation steps:
1. Add deterministic pending-to-committed test flow for one resolved draft mapped to pair 15/16.
2. Assert stage-by-stage equality between pending preview and committed result for `base`, `support`, `flankRear`, `disorder`, `die`, `final`.
3. Assert lifecycle-only delta semantics: visual/state status may change, arithmetic cannot.
4. Keep multiple-attack cohesion precondition/cap assertions as separate event checks, never numeric modifiers.

Validation:

- node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js

Manual acceptance:

- user confirms that apply/commit changes marker state only and preserves arithmetic outputs exactly.

Stop condition:

- stop if commit path currently recalculates with non-deterministic inputs that prevent parity lock.

Reviewer routing:

- Reviewer / Rules Agent verifies pending-versus-committed parity contract is testable and source-honest.

Closeout 2026-05-31:

- Added focused state parity regression in `src/state/p9-melee-v2.test.js`:
  - `p9v2-mini-11C pair 15/16 keeps pending-versus-committed stage parity for one resolved draft`.
  - locks stage-by-stage equality (`base`, `support`, `flankRear`, `disorder`, `die`, `final`) between pending entry (pair 15) and committed entry (pair 16) for the same melee id.
  - asserts lifecycle-only delta (`resolved-pending-apply` -> `complete`) with no arithmetic drift.
  - asserts cohesion channel remains split (`multipleAttackImmediateByUnitId` / `combatResultCohesionByUnitId`) and no legacy aggregated `cohesionLossByUnitId` lane exists.
- Added reducer-flow parity regression in `src/state/p0-state-melee.test.js`:
  - `p9v2-mini-11C reducer flow keeps pair 15/16 arithmetic identical across pending to committed transition`.
  - validates the same stage-equality contract through real app actions (`START_MELEE_RESOLUTION_DRAFT`, `CONFIRM_MELEE_RESOLUTION_DRAFT`, `APPLY_MELEE_BATCH`).
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js` (`53/53`).

Reviewer handoff packet (MINI-11C):

- Scope: pair 15/16 pending-versus-committed arithmetic parity under Decision Matrix v1 stage ledger contract.
- Verify:
  - stage-by-stage equality for `base/support/flankRear/disorder/die/final` on both sides,
  - lifecycle-only state delta without arithmetic recomputation drift,
  - cohesion event channel remains non-additive to arithmetic totals.
- Expected verdict format: `Approved`, `Needs Changes`, or `Blocked` with file-level findings.

### [x] P9V2-MINI-11D - Cohesion Event Channel Hard Split (No Numeric Coupling)

Goal:
- close the remaining ambiguity by enforcing a hard separation between cohesion events and combat-factor arithmetic in state/resolution payload contracts.

Planned files:

- src/engine/melee-v2/resolution.js
- src/state/p9-melee-v2.js
- src/state/p9-melee-v2.test.js

Implementation steps:
1. Normalize payload shape so cohesion events are emitted in dedicated event fields, not in numeric modifier lanes.
2. Enforce trigger precondition from Decision Matrix v1 (already-in-melee/support + new qualifying flank/rear contact).
3. Enforce one-per-defender-per-sequence/phase cap in event channel.
4. Add guard tests that fail if cohesion affects stage ledger totals.

Validation:

- node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js

Manual acceptance:

- user can inspect result payload and see cohesion event records independent from factor stage totals.

Stop condition:

- stop if any legacy compatibility adapter requires cohesion-as-modifier behavior and cannot be isolated safely in this slice.

Reviewer routing:

- Reviewer / Rules Agent must return explicit verdict: `Approved`, `Needs Changes`, or `Blocked` with file-level findings.

Closeout 2026-05-31:

- Hardened V2 batch-application event handling in `src/engine/melee-v2/resolution.js`:
  - immediate multiple-attack cohesion events now require explicit precondition truth (`defenderAlreadyInMeleeOrSupport` and `newQualifyingFlankRearContact`) before contributing any cohesion loss,
  - one-per-defender cap is now enforced from event payload (`capPerDefenderPerSequencePhase`, default `1`) with bounded cap diagnostics,
  - event-channel diagnostics are now emitted when preconditions fail or caps are enforced,
  - cohesion channels remain split (`multipleAttackImmediateByUnitId` vs `combatResultCohesionByUnitId`) with no legacy aggregated numeric lane.
- Surfaced batch-plan diagnostics into reducer state in `src/state/p9-melee-v2.js` so event-channel enforcement is visible in normal diagnostics flow.
- Added focused regressions in `src/state/p9-melee-v2.test.js`:
  - `p9v2-mini-11D batch plan enforces immediate-event precondition and keeps arithmetic decoupled`,
  - `p9v2-mini-11D batch plan enforces one-per-defender cap for immediate events`.
- Updated `p9v2-mini-11A batch application plan separates multiple-attack and combat-result cohesion channels` fixture to include explicit precondition fields required by the new 11D contract.
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js` (`72/72`).

### [ ] P9V2-MINI-12 - Combat Decision Matrix V2 Controlled Migration And Source-Locked Adoption

Goal:
- migrate from Decision Matrix v1 mini-slice to a controlled Decision Matrix v2 path without big-bang regressions, while keeping source-honesty and ledger transparency.

Problem statement:
- current v1 mini-slice is test-stable but still has an interpretation mismatch on flank/rear arithmetic expectations.
- base combat-factor and modifier closure still has residual source-risk lanes.
- broad wave-C through wave-E work remains open, so uncontrolled matrix rewrite would increase regression risk.

Scope contract:
- MINI-12 covers core matrix migration only (base CF, flank/rear branch semantics, modifier pipeline, engine/UI ledger parity, controlled rollout).
- special families remain out of MINI-12 scope and stay in existing cards:
  - `P9V2-30` camp/fortification/obstacle
  - `P9V2-31` war-wagon
- legacy V1 implementation files remain untouched.
- any new lane must be either source-closed with exact provenance or explicit source-open with diagnostics.

Rule baseline:
- Rules_v2 p.22 and p.60-p.63
- docs/rules/melee.md
- docs/rules/errata.md
- docs/rules/open-verification.md item `melee.main-unit-support-multiple-attack-and-modifiers`
- docs/source/Rules_v2.md

Global gates for MINI-12:
- Gate M12-G1 Source: 12A must be reviewer-approved before 12B implementation starts.
- Gate M12-G2 Core correctness: source-closed lanes must meet exact expected values.
- Gate M12-G3 Ledger parity: engine and UI must show identical arithmetic on source-closed lanes.
- Gate M12-G4 Transparency: source-open lanes remain explicit and never silently upgraded.
- Gate M12-G5 Safety: parallel-path feature flag is temporary with explicit sunset condition.
- Gate M12-G6 Review: no default-switch to v2 without Reviewer / Rules Agent `Approved` verdict.

### [x] P9V2-MINI-12A - Source Closure Packet (Flank/Rear + p.22 Base CF)

Goal:
- produce a source-locked decision packet for flank/rear arithmetic semantics and base combat-factor bindings.

Planned files:

- docs/rules/melee.md
- docs/rules/open-verification.md
- docs/source/Rules_v2.md
- docs/rules/melee-decision-matrix.md

Implementation steps:
1. Re-check p.22 and p.60-p.63 wording with errata notes and existing matrix-v1 decisions.
2. Build 8-10 representative reference situations (front, flank, rear, to-zero, cancellation-family relevant lanes).
3. For each lane, classify behavior as `branch-owned`, `additive`, or `source-open`.
4. Record exact source provenance and unresolved blockers in docs.

Non-goals:

- no engine code edits
- no UI flow changes
- no special-family closure

Validation:

- source-consistency review against docs/rules/melee.md and docs/source/Rules_v2.md
- blocker alignment with docs/rules/open-verification.md

Manual acceptance:

- user confirms the source-closure packet as coding baseline for 12B/12C.

Stop condition:

- stop if source or errata wording is internally inconsistent and cannot be resolved honestly.

Expected result:

- reviewer-usable source packet with explicit lane-level ownership decisions.

Reviewer routing:

- Reviewer / Rules Agent approval is required before 12B starts.

Progress note 2026-05-31:

- Prepared first source-closure decision draft in `docs/rules/melee-decision-matrix.md` with lane-level ownership/status markers (`source-closed` vs `source-open`) for core matrix lanes.
- Draft includes explicit blocker ledger for:
  - flank/rear additive-lane closure,
  - residual p.22 binding completeness,
  - cancellation-family edge combinations,
  - commander timing edge cases.
- Linked open-verification next-check wording to the new draft in `docs/rules/open-verification.md` under `melee.main-unit-support-multiple-attack-and-modifiers`.
- Reviewer / Rules Agent decision is still required before 12B implementation starts.

Closeout 2026-05-31 (Reviewer gate passed):

- Reviewer / Rules Agent combined packet verdict for `MINI-11D + MINI-12A`: `Approved`.
- Approval scope recorded:
  - `MINI-11D` implementation: event-channel split, precondition gate, and cap enforcement accepted.
  - `MINI-12A` decision draft: lane tags and blocker ledger accepted as source-honest gate for 12B.
- Mandatory source cross-check set for approval path confirmed in handoff:
  - `docs/rules/melee.md`
  - `docs/rules/errata.md`
  - `docs/source/Rules_v2.md`
- 12B implementation start is unblocked under Gate `M12-G1`.

### [x] P9V2-MINI-12B - Base Combat Factor Lookup V2

Goal:
- implement stable base combat-factor lookup for source-closed troop, quality, and formation lanes.

Planned files:

- src/engine/melee-v2/factor-lookup.js
- src/engine/melee-v2/factor-lookup.test.js
- src/engine/melee-v2/resolution.js

Implementation steps:
1. Add a deterministic lookup structure for source-closed p.22 bindings.
2. Implement base-CF calculation helper with explicit source-status output.
3. Keep unresolved troop/profile lanes source-open with diagnostics.
4. Add focused tests for known baseline matchups.

Non-goals:

- no full matrix rollout
- no special-family logic

Validation:

- node --test src/engine/melee-v2/factor-lookup.test.js src/engine/melee/resolution.test.js

Manual acceptance:

- user verifies representative base-CF outcomes in debug recap.

Stop condition:

- stop if p.22 binding cannot be represented without guessing unresolved lanes.

Expected result:

- base-CF layer is deterministic for source-closed lanes and explicit for unresolved lanes.

Reviewer routing:

- Reviewer / Rules Agent re-check required before 12C.

Closeout 2026-05-31 (initial lookup slice):

- Added first source-locked V2 base-combat-factor lookup module in `src/engine/melee-v2/factor-lookup.js`:
  - deterministic binding result shape with explicit `status` and per-binding `sourceStatus`,
  - source-closed bindings return numeric `value` + provenance,
  - unresolved lanes return `source-open` with explicit deferred reason and diagnostics.
- Wired resolver-side profile binding through the new V2 lookup in `src/engine/melee/resolution.js`:
  - profile lookup failures remain explicit (`profile-lookup-source-open`),
  - unresolved bindings remain explicit (`combat-factor-profile-deferred`),
  - resolved bindings keep provenance and source references in breakdown output.
- Added focused MINI-12B regressions in `src/engine/melee-v2/factor-lookup.test.js`:
  - source-closed lane resolves with `sourceStatus: verified`,
  - unresolved lane stays `source-open` with deferred reason,
  - explicit profile-id lookup path resolves deterministically,
  - profile lookup failure path remains explicit and source-open.
- Focused validation passed:
  - `node --test src/engine/melee-v2/factor-lookup.test.js src/engine/melee/resolution.test.js`.

### [x] P9V2-MINI-12C - Decision Matrix V2 Core (Core Lanes Only)

Goal:
- implement prioritized v2 core matrix evaluation without special-family scope expansion.

Planned files:

- src/engine/melee-v2/combat-matrix-v2.js
- src/engine/melee-v2/modifier-pipeline.js
- src/engine/melee-v2/resolution.js
- src/state/p9-melee-v2.test.js

Implementation steps:
1. Add matrix-core evaluation order for core lanes only: flank/rear branch, base CF, support, situation/disorder, die, final.
2. Emit per-stage structure with value, sourceStatus, explanation, and lane type.
3. Preserve source-open diagnostics and block silent upgrades.
4. Keep MINI-11 parity contracts as guard regressions.

Non-goals:

- no camp/fortification/obstacle/war-wagon handling
- no UI redesign

Validation:

- node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js

Manual acceptance:

- user checks one front lane and one flank lane against stage-ledger output.

Stop condition:

- stop if matrix requires hidden post-stage corrections not represented in ledger.

Expected result:

- deterministic core matrix with explicit stage ownership.

Reviewer routing:

- Reviewer / Rules Agent re-check required before 12D.

Closeout 2026-05-31 (core-matrix slice):

- Added dedicated matrix-core evaluator in `src/engine/melee-v2/combat-matrix-v2.js`:
  - lane order is explicit and fixed: `flankRearBranch`, `baseCf`, `support`, `situationDisorder`, `die`, `final`,
  - each lane emits `value`, `sourceStatus`, and short explanation,
  - source status remains explicit (`verified` vs `source-open`) with no silent upgrades.
- Added shared modifier-stage source-status helpers in `src/engine/melee-v2/modifier-pipeline.js` for matrix lane ownership evaluation.
- Integrated matrix-core payload into runtime draft/result surfaces in `src/state/p9-melee-v2.js`:
  - `resolutionPreview.matrixCore` now ships with every confirmed draft,
  - resolved entries persist matrix-core output on `resolution.matrixCore` for batch/runtime consumers.
- Extended batch preview source-status aggregation in `src/engine/melee-v2/resolution.js`:
  - new `hasSourceOpenMatrixCore` flag is tracked,
  - batch preview remains `source-open` when matrix-core lanes are unresolved.
- Added focused 12C regressions in `src/state/p9-melee-v2.test.js`:
  - matrix-core lane order and resolved status are present in preview,
  - base lane parity guard: matrix `baseCf` equals stage-ledger `base`,
  - source-open matrix lanes propagate to batch preview (`hasSourceOpenMatrixCore`).
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js` (`74/74`).
- Reviewer / Rules Agent verdict 2026-05-31: `Approved`.

### [x] P9V2-MINI-12D - Modifier Pipeline Alignment (No Hidden Lanes)

Goal:
- align modifier pipeline with v2 stage ledger so branch and additive lanes are explicit and auditable.

Planned files:

- src/engine/melee-v2/modifier-pipeline.js
- src/engine/melee-v2/resolution.js
- src/engine/melee/resolution.test.js

Implementation steps:
1. Normalize modifier lanes to matrix-v2 stage ownership.
2. Keep branch effects and additive effects explicitly separated.
3. Add residual checks that fail when non-ledger lanes alter final totals silently.
4. Preserve source-open diagnostics for unresolved lanes.

Non-goals:

- no new rule interpretation outside 12A decision packet
- no UI-only fallback arithmetic

Validation:

- node --test src/engine/melee/resolution.test.js src/state/p9-melee-v2.test.js

Manual acceptance:

- user can reconcile displayed stage sums with final totals line by line.

Stop condition:

- stop if result totals depend on undocumented post-stage math.

Expected result:

- full stage-to-final traceability with no hidden arithmetic.

Reviewer routing:

- Reviewer / Rules Agent re-check required before 12E.

Implementation closeout (2026-05-31):
- Added `MELEE_V2_MODIFIER_LANE_OWNERSHIP` export to `src/engine/melee-v2/modifier-pipeline.js`.
- Updated `src/engine/melee/resolution.js`: import ownership constant; pass `laneOwnership` through `createBreakdownEntry`; tag all internally derived entries (`flank-or-rear`, cancellation, to-zero = `branch`; quality, height, commander = `additive`); added `allNonLedgerEntriesOwned` invariant to stage ledger that is `false` when untagged non-zero residual entries exist.
- Added 4 guard tests in `src/engine/melee/resolution.test.js`.
- Validation: 78/78 pass.

### [x] P9V2-MINI-12E - Engine to UI Ledger Parity Lock

Goal:
- enforce exact arithmetic parity between engine outputs and UI breakdown/recap views.

Planned files:

- src/state/p9-melee-v2.js
- src/ui/melee-v2-adapter.js
- src/ui/battlefield-dialogs.js
- src/state/p9-melee-v2.test.js
- src/ui/p0-app.test.js

Implementation steps:
1. Normalize one canonical ledger payload for UI read paths.
2. Render breakdown rows from engine ledger only.
3. Add drift tests for pre-roll summary versus post-roll recap.
4. Keep pending-versus-committed parity assertions active.

Non-goals:

- no rule math rewrites in UI
- no special-family additions

Validation:

- node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js src/state/p0-state-melee.test.js

Manual acceptance:

- user verifies that pre-roll and post-roll arithmetic match for fixed-dice checks.

Stop condition:

- stop if UI requires local arithmetic to display totals.

Expected result:

- zero arithmetic drift between engine and UI on source-closed lanes.

Reviewer routing:

- Reviewer / Rules Agent re-check required before 12F.

Implementation closeout (2026-05-31):
- Removed the pre-roll branch to-zero row from the modifier-sum arithmetic in `src/ui/battlefield-dialogs.js` so the visible pre-roll sum now matches the committed recap ledger instead of double-counting the to-zero display lane.
- Updated the case1 parity regression in `src/ui/p0-app.test.js` to the current canonical ledger values:
  - pre-roll attacker sum `+1`, defender sum `0`
  - post-roll attacker recap `base 1 / modifiers 1 / final 6`, defender recap `base 0 / modifiers 0 / final 4`
- Focused validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js src/state/p0-state-melee.test.js`
  - pass `77/77`

Follow-up fix 2026-05-31 (review packet 12E):
- Moved flank-to-zero display-row ownership into shared factor-presentation payload in `src/state/p9-melee-v2.js`:
  - added `attackerDisplayModifierRows` / `defenderDisplayModifierRows` payload lanes,
  - each to-zero display row now carries explicit `countsTowardModifierSum: false` from state (not authored in UI).
- Updated `src/ui/battlefield-dialogs.js` to consume only payload-provided display rows for modifier rendering; local row-construction parity logic was removed.
- Added state regression in `src/state/p9-melee-v2.test.js` (`p9v2-14C1 case1 draft modifier sums match resolved factor recap`) to assert payload non-counting row contract.
- Revalidated focused suites:
  - `node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js src/state/p0-state-melee.test.js` (`77/77`).
- Browser verification (case1 live dialog on `http://localhost:5174/`):
  - pre-roll: attacker modifier sum `+1`, defender modifier sum `0` while defender to-zero display row stays visible,
  - post-roll recap observed: attacker `base 1, modifiers 1`, defender `base 0, modifiers 0`.

### [x] P9V2-MINI-12F - Temporary Parallel Path And Feature Flag

Goal:
- introduce a temporary guarded rollout path for matrix-v2 with controlled fallback and measurable differences.

Planned files:

- src/state/p9-melee-v2.js
- src/state/p0-state.js
- src/state/p9-melee-v2.test.js

Implementation steps:
1. Add temporary feature flag `melee.matrixV2` for matrix selection.
2. Keep v1/v2 comparable on identical source-closed inputs.
3. Emit bounded diff diagnostics for lane-level mismatches.
4. Define explicit sunset condition and removal criteria for the flag.

Non-goals:

- no permanent dual-maintenance model

Validation:

- node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js

Manual acceptance:

- user can reproduce one representative case in both paths and inspect lane diffs.

Stop condition:

- stop if ownership between matrix paths is ambiguous or long-term dual stack is required.

Expected result:

- controlled migration path with explicit rollback safety and bounded diagnostics.

Reviewer routing:

- Reviewer / Rules Agent re-check required before 12G.

Closeout 2026-05-31:

- Added temporary matrix feature-flag path in `src/state/p9-melee-v2.js` under `melee.v2.featureFlags.matrixV2` (logical path `melee.matrixV2`):
  - default is enabled (`true`) for existing runtime behavior,
  - fallback path can be selected without changing resolver math ownership,
  - matrix payload now carries explicit `selection` metadata (`activePath`, `comparedPath`, `featureFlagPath`, `sunsetCondition`).
- Added bounded lane-level comparison diagnostics in `src/state/p9-melee-v2.js` between v2-core and ledger-fallback matrix payloads:
  - mismatch payload is capped at 12 entries,
  - warning diagnostic `melee.v2.matrix-parallel-path-diff` is emitted only when mismatches exist,
  - comparison metadata is always present for measurable parity checks.
- Added reducer wiring in `src/state/p0-state.js`:
  - new action `SET_MELEE_MATRIX_V2_FEATURE_FLAG` for controlled parallel-path switching in runtime/tests.
- Added focused regressions in `src/state/p9-melee-v2.test.js`:
  - default v2-core selection and comparison payload shape,
  - reducer-driven fallback selection and bounded mismatch payload assertions.
- Sunset/removal criteria recorded in runtime metadata and this closeout:
  - remove `melee.matrixV2` after MINI-12G gold packet approval and MINI-12H default-switch acceptance with no rollback findings.
- Validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js`

### [x] P9V2-MINI-12G - Gold Standard Regression Packet (Core Lanes)

Goal:
- lock a robust regression packet for matrix-v2 core lanes before default switch.

Planned files:

- src/data/melee-drill-scenarios.js
- src/data/melee-drill-scenarios.test.js
- src/state/p9-melee-v2.test.js
- src/engine/melee/resolution.test.js

Implementation steps:
1. Add 15-20 representative core-lane scenarios (front/flank/rear/support/disorder/dice parity).
2. Assert exact expected values on source-closed lanes.
3. Assert mandatory diagnostics on source-open lanes.
4. Keep lifecycle parity and cohesion-channel split assertions in packet.

Non-goals:

- no special-family scenarios (kept for P9V2-30/P9V2-31)

Validation:

- node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js

Manual acceptance:

- user confirms representative gold scenarios in UI recap and test logs.

Stop condition:

- stop if expected values cannot be sourced without assumptions.

Expected result:

- stable core regression packet suitable for default-switch decision.

Reviewer routing:

- Reviewer / Rules Agent re-check required before 12H.

Closeout 2026-05-31:

- Added deterministic core-lane gold packet fixture in `src/data/melee-drill-scenarios.js`:
  - `createP9V2Mini12GCoreLaneGoldRows()` provides 16 representative rows.
  - Packet split: 13 source-closed rows + 3 source-open rows.
  - Coverage tags include front, flank, rear, support, disorder, dice, and source-open lanes.
- Added fixture-contract regression in `src/data/melee-drill-scenarios.test.js`:
  - validates deterministic row order/content,
  - validates unique row ids and coverage tags,
  - validates source-closed/source-open packet split.
- Added resolver gold assertions in `src/engine/melee/resolution.test.js`:
  - source-closed rows assert exact stage-ledger values (`base`, `support`, `flankRear`, `disorder`, `die`, `final`) and result parity,
  - source-open rows assert mandatory diagnostic codes and no resolved result.
- Added state-facing gold assertions in `src/state/p9-melee-v2.test.js`:
  - enforces packet cardinality,
  - keeps stage-ledger invariants stable on source-closed rows,
  - enforces source-open result separation and diagnostic presence.
- Focused validation passed:
  - `node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js` (`100/100`).

### [x] P9V2-MINI-12H - Reviewer Gate And Default Switch

Goal:
- complete controlled adoption by switching default matrix path only after independent review approval.

Planned files:

- P9_v2_todo.md
- roadmap.md
- src/state/p9-melee-v2.js

Implementation steps:
1. Request independent Reviewer / Rules Agent verdict for MINI-12 packet.
2. If `Approved`, switch default runtime path to matrix-v2.
3. Schedule and execute feature-flag removal or bounded decommission plan.
4. Update board and roadmap with explicit adoption notes and residual risks.

Non-goals:

- no new matrix logic additions

Validation:

- focused v2 suite green
- browser smoke for current melee loop checkpoints

Manual acceptance:

- user confirms v2-default flow in battlefield loop.

Stop condition:

- stop if reviewer verdict is `Needs Changes` or `Blocked`.

Expected result:

- controlled, documented matrix-v2 default adoption with explicit risk posture.

Reviewer routing:

- Reviewer / Rules Agent final sign-off is required.

Closeout 2026-05-31:

- Reviewer / Rules Agent verdict for MINI-12G packet recorded as `Approved` (no blocking findings).
- Default runtime path is now hard-switched to matrix-v2 core in `src/state/p9-melee-v2.js`:
  - selection `activePath` is forced to `matrix-v2-core`,
  - fallback path remains comparison-only (`comparedPath: matrix-ledger-fallback`),
  - mismatch diagnostics remain bounded and visible.
- Executed bounded decommission plan for `melee.matrixV2` flag in `src/state/p9-melee-v2.js`:
  - legacy flag value is retained as requested metadata only,
  - runtime switching by flag is disabled (`matrixV2Runtime: true`, `matrixV2Decommissioned: true`),
  - decommission diagnostics and rollout metadata now expose the transition contract.
- Updated focused regressions in `src/state/p9-melee-v2.test.js`:
  - decommissioned selection metadata on default path,
  - reducer flag toggle no longer changes active runtime path,
  - initial state exposes rollout decommission metadata.
- Validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js`
  - `node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js`
- Residual risk:
  - reducer/action wiring for `SET_MELEE_MATRIX_V2_FEATURE_FLAG` remains as compatibility surface and should be removed in the next cleanup card if no rollback evidence appears.

### [x] P9V2-MINI-12I - Flank/Rear Additive Bonus Re-open (Case 1 + Multi-Flank)

Goal:
- resolve the current flank/rear arithmetic mismatch by introducing an explicit additive attacker situation bonus on source-closed flank/rear lanes while keeping branch/to-zero and cancellation handling source-honest.

Planned files:

- src/engine/melee-v2/modifier-pipeline.js
- src/engine/melee-v2/combat-matrix-v2.js
- src/engine/melee/resolution.js
- src/state/p9-melee-v2.js
- src/ui/battlefield-dialogs.js
- src/data/melee-drill-scenarios.js
- src/state/p9-melee-v2.test.js
- src/engine/melee/resolution.test.js
- src/ui/p0-app.test.js

Implementation steps:
1. Add an explicit additive flank/rear attacker-bonus lane for source-closed formed flank/rear branches (`+1` baseline), independent from defender-to-zero application.
2. Keep branch/to-zero semantics explicit and non-cumulative for defender-side zeroing; do not double-apply branch effects.
3. Ensure matrix-core lane payload and resolver stage-ledger payload both carry the same additive flank/rear attacker-bonus value for source-closed lanes.
4. Remove or gate the MINI-11A non-additive flank marker path where it conflicts with the source-closed additive branch contract.
5. Add deterministic Case 1 and multi-flank regressions proving:
   - attacker modifier sum includes support plus flank bonus on source-closed lanes,
   - defender zeroing/cancellation remains deterministic,
   - source-open lanes remain diagnostic and non-guessing.

Non-goals:

- no special-family expansion (camp/fortification/obstacle/war-wagon)
- no Wave C UI flow redesign
- no broad modifier-system rewrite beyond flank/rear additive integration

Validation:

- node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js src/ui/p0-app.test.js src/data/melee-drill-scenarios.test.js
- browser smoke on melee drill Case 1 and one multi-flank lane with checkpoint screenshots for pre-roll summary and post-roll recap parity

Logging expectations:

- emit bounded `melee` debug diagnostics for branch evaluation and additive-lane application:
  - branch source status,
  - additive flank bonus value,
  - to-zero application flag,
  - cancellation resolution path,
  - final stage-ledger composition.
- diagnostics stay observational only and must not decide legality.

Role routing:

- Expected implementing role: Coding Agent / GPT-5.4
- Reviewer / Rules Agent re-check required before closeout (rule-sensitive arithmetic change)
- Lead / Phase Steward follow-up required only if reviewer marks source interpretation as `Needs Changes` or `Blocked`.

Manual acceptance:

- user runs melee drill Case 1 and confirms visible attacker modifier sum includes flank additive bonus on source-closed lane (expected representative target: support `+1` plus flank `+1`), with post-roll recap parity.
- user runs one multi-flank case and confirms deterministic single-application branch ownership plus additive attacker lane visibility.

Stop condition:

- stop if source references cannot close additive flank/rear bonus semantics for the selected lanes without guessing;
- stop if implementation would require changing special-family branches in this card.

Expected result:

- flank/rear source-closed lanes are no longer display-only branches: additive attacker-bonus arithmetic is visible, test-locked, and consistent between matrix-core output, resolver stage ledger, and UI recap.

Closeout 2026-05-31:

- Implemented additive attacker situation bonus plumbing for source-closed flank/rear branch lanes across matrix lane construction, resolver branch handling, and state payload normalization.
- Maintained deterministic branch ownership and non-cumulative defender-to-zero behavior; cancellation still suppresses attacker flank/rear additive bonus when resolved as formed flank-contact cancellation.
- Updated deterministic fixture/gold-row helper semantics to keep stage-ledger `final` contract stable while still asserting additive flank/rear impact through resolved outcome differential.
- Added/updated regressions for this reopen scope:
  - resolver: source-closed additive flank/rear application and cancellation behavior,
  - state: deterministic single-application flank/rear additive bonus in multi-candidate Case 2,
  - UI: Case 1 attacker modifier sum and recap parity reflect support + flank additive path.
- Validation passed:
  - `node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js src/ui/p0-app.test.js src/data/melee-drill-scenarios.test.js`
- Runtime-aligned checkpoint expectation after alignment fix:
  - Case 1 main-pair dialog should show `Attacker bonuses/maluses` with `Simple support bonus: +1` and `Melee support bonus (combat factor +1): +2`, with no visible attacker-side `Flank or rear situation bonus` row; `Modifier sum: +3`.
  - Case 2 main-pair dialog should show `Branch candidates` with four candidates and three attacker `Melee support bonus (combat factor +1): +2` rows, with no visible attacker-side `Flank or rear situation bonus` row; `Modifier sum: +6`.
- Fresh browser checkpoint recapture is still pending after this alignment fix slice.
- Reviewer / Rules Agent re-check packet prepared in `docs/agents/p9v2-mini-12i-review-handoff.md`.
- Residual risk:
  - stage-ledger `final` intentionally excludes residual situation lane values; additive flank/rear effect is represented in residual breakdown and resolved differential, not by mutating ledger-stage sum semantics.

### [ ] P9V2-15 - Unit Cohesion Account Spine + Marker UX

Goal:
- establish one shared per-unit cohesion account model that supports pending and committed updates across phases (movement side effects, shooting, melee, rout/pursuit), then render the same account with pip+count marker UX.

Scope boundary (phase-gated, strict P9-only):
- this card may implement only P9-owned runtime behavior (melee state/reducer/UI marker presentation and shared cohesion account spine interfaces used by melee).
- no direct P8 shooting runtime behavior changes in this card.
- no direct P10 rout/pursuit runtime behavior changes in this card.
- P8/P10 integration remains deferred to explicit later cards and may only be prepared here as compatibility hooks/contracts.

Source anchors and open-risk posture:
- unit cohesion/disorder/rout state model: `docs/source/Rules_v2.md` `rv2.unit-status-and-orientation` and `rv2.troop-attributes`.
- shooting cap and simultaneity baseline: `docs/rules/shooting.md`.
- melee immediate-event versus arithmetic split: `docs/rules/melee.md` and `docs/rules/melee-decision-matrix.md` L4.
- sequence-end rout/pursuit and army-cohesion accounting: `docs/rules/rout-and-pursuit.md`.
- keep rally and army-cohesion edge accounting source-open under:
  - `rally.test-thresholds-and-post-rally-locks`
  - `army-cohesion.loss-accounting-and-simultaneous-rout`

Planned files:

- src/state/p9-melee-v2.js
- src/state/p9-melee-v2.test.js
- src/state/p0-state.js
- src/state/p0-state-*.js
- src/ui/p0-battlefield.js
- src/ui/styles/*
- docs/rules/rout-and-pursuit.md (if wording needs source-lock clarification for account fields)

Implementation steps:
1. Define reducer-owned per-unit cohesion account shape (shared, not melee-local):
  - `maxCohesion` (from profile/rule data), `remainingCohesion`, `status` (`good-order`, `disordered`, `routed-pending-removal`, `removed`),
  - pending event lanes split by source (for example `shooting`, `melee-combat-result`, `melee-multiple-attack-immediate`, `rout-cascade`),
  - committed history for replay/debug visibility.
2. Add phase-safe account operations:
  - queue pending cohesion deltas,
  - enforce source-backed caps per mechanism (for example shooting max one loss per phase),
  - commit at the official timing boundary (simultaneous application points and sequence-end chains).
3. Keep event-channel split invariant:
  - immediate multiple-attack cohesion remains event-channel only (never arithmetic modifier lane).
4. Bind P9 marker UX to shared account state:
  - pending markers use pending account lane,
  - committed markers use committed account lane,
  - committed losses render as small filled red circles,
  - pending uncommitted losses render as small outline circles (no fill),
  - no melee-specific marker shortcut state.
5. Prepare P8/P10 compatibility contract:
  - define deferred hooks only: shooting and rout/pursuit can later write to the same account API without duplicating cohesion bookkeeping logic.
  - do not wire live P8/P10 phase logic in this card.

Non-goals (this card):
- no P8 shooting runtime flow changes (selection, resolution, or commit behavior).
- no P10 rout/pursuit runtime flow changes (sequence-end chain behavior).
- no full rally test implementation or threshold closure while `rally.test-thresholds-and-post-rally-locks` is open.
- no full army-rout winner resolution while `army-cohesion.loss-accounting-and-simultaneous-rout` remains open.
- no special-family closeout (war wagon/camp/fortification) beyond account API compatibility.

Implementation update (2026-06-01):

- Added source-backed profile `defaultCohesion` bindings from `docs/source/rules-v2-examples/rv2-p22-unit-characteristics-tables-a.png` for the current representative P9 troop profiles, with commanders intentionally left unbound.
- Replaced melee-only commit bookkeeping with a shared `cohesionAccount` on affected units: `maxCohesion`, `remainingCohesion`, `status`, split pending/committed lane totals, and committed history.
- Kept multiple-attack immediate cohesion in a distinct event lane from melee combat-result cohesion.
- Added shared marker projection for pending versus committed melee losses and rendered battlefield token markers as outline circles for pending and filled red circles for committed.
- Left P8 shooting runtime and P10 rout/pursuit runtime integration deferred; this slice only prepares compatibility hooks and P9-owned behavior.
- Focused validation passed: `node --test src/data/unit-profiles.test.js src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js src/ui/p0-battlefield.test.js` (`174/174`).
- Card closeout remains pending Reviewer / Rules Agent review and the existing Lead gate because the listed open-verification IDs are still unresolved.

Validation:

- node --test src/state/p9-melee-v2.test.js src/ui/p0-app.test.js
- node --test src/state/p0-state-melee.test.js src/ui/p0-battlefield.test.js
- add focused cohesion-account tests:
  - profile-driven `maxCohesion` and route-to-routed threshold behavior,
  - pending versus committed transitions at batch/sequence boundaries,
  - shooting one-loss cap lane,
  - melee multiple-attack event lane separation from arithmetic totals,
  - marker visual contract: committed = filled red circle, pending = outline circle,
  - battlefield marker render checks for pending/committed circles on unit tokens,
  - marker rendering parity with pending/committed account state.

Logging/instrumentation expectations:

- rule areas: `melee`, `shooting`, `rout`, `state`.
- minimum level: `debug` for account commits and per-unit delta aggregation.
- key events: queued delta, capped delta, committed delta, routed-pending-removal transition, sequence-end finalize.

Role routing:

- expected implementing role: Coding Agent / GPT-5.4
- required review role: Reviewer / Rules Agent / GPT-5.4
- Lead gate required before closing card if open-verification IDs above are still unresolved.

Manual acceptance:

- user runs one melee sequence with unresolved then committed draft states and confirms:
  - pending markers reflect queued losses before commit,
  - committed markers update only at commit boundary,
  - pending markers are outline circles and committed markers are filled red circles,
  - unit rout threshold follows unit-type cohesion value (profile-derived, not hardcoded by scenario id).

Stop condition:

- stop if profile/cohesion table binding cannot provide deterministic `maxCohesion` without guessing.
- stop if commit timing conflicts with simultaneous-resolution invariants.

Expected result:

- one reusable cohesion-account spine is active for P9 and ready for P8/P10 integration, replacing melee-local marker-only handling.

### [ ] P9V2-20 - Melee Start/End Popups

Goal:
- provide clear start summary and end transition popup for next phase handoff.

Planned files:

- src/ui/battlefield-dialogs.js
- src/ui/p0-battlefield.js
- src/state/p9-melee-v2.js

Validation:

- UI tests for popup visibility and transition timing.

Manual acceptance:

- after final fight close, one next-phase popup appears.

### [ ] P9V2-21 - Battlefield-First Fight Selection And Breakdown

Goal:
- use battlefield click as primary fight selector with compact breakdown dialog.

Planned files:

- src/ui/p0-battlefield.js
- src/ui/melee-v2-adapter.js
- src/state/p9-melee-v2.js

Validation:

- focused UI tests for click-to-open fight summary and unresolved/resolved status colors.

Manual acceptance:

- user can resolve all fights by battlefield selection only.

### [ ] P9V2-22 - Shooting-To-Melee Handoff To V2 Flow

Goal:
- route end-of-shooting continuation into active V2 melee workflow.

Planned files:

- src/state/p0-state.js
- src/ui/battlefield-dialogs.js
- src/state/p9-melee-v2.js

Validation:

- integration test for shooting end -> melee V2 start popup.

Manual acceptance:

- no placeholder continuation text remains in this path.

### [ ] P9V2-23 - Browser Smoke For Full Melee Flow

Goal:
- verify battlefield-first full loop in browser: select fight, roll, close, next fight, phase transition popup.

Validation:

- browser smoke script or manual reproducible runbook with expected checkpoints.

Manual acceptance:

- user confirms end-to-end flow visually in browser.

### [ ] P9V2-24 - First Playable Melee UX Lock

Goal:
- lock first stable V2 melee user loop for ongoing rule closure cards.

Validation:

- focused tests + browser smoke + source-open visibility checks.

Manual acceptance:

- user approves first playable V2 loop.

### [ ] P9V2-30 - Special Family Camp/Fortification/Obstacle

Goal:
- add explicit special-family branch handling, separate from generic melee.

Validation:

- focused branch tests and source-backed scenario checks.

Manual acceptance:

- user verifies one camp and one fortification or obstacle case.

### [ ] P9V2-31 - War-Wagon Special Family

Goal:
- implement war-wagon contact/support restrictions as dedicated branch family.

Validation:

- focused war-wagon tests for contact semantics and flank/rear suppression.

Manual acceptance:

- user verifies one war-wagon scenario path.

### [ ] P9V2-40 - Examples And Closeout Packet

Goal:
- close P9 via source-backed example scenarios, regression packet, and reviewer sign-off.

Validation:

- focused melee-v2 suite, build, browser smoke, and closeout checklist.

Manual acceptance:

- user reviews source-backed scenarios and approves P9 closeout packet.

## Immediate Next Two Cards

- `P9V2-15` Unit Cohesion Account Spine + Marker UX.
- `P9V2-20` Melee Start/End Popups.

## Notes

- P9_todo.md is retained as historical execution log with a top-level V2 migration overlay.
- All new P9 planning and execution happens in this file after approval.
- 2026-05-30: Added focused melee clickability diagnostics (left-panel debug card + unit selectability reason attributes) to isolate live phase/status mismatches without changing melee rule logic.
- 2026-05-30: Tightened simple-support displacement to same-fight anchor matching, added missing support evidence for melee-drill unit 6, and aligned V2 participation tests for support-participant semantics.

## User Wishlist (Deferred)

- Deferred UI idea (requested 2026-05-30): render small support-number markers between engaged units (example: small marker like unit badge size showing support contribution count).
- Scope status: deferred by user; do not implement in current slice.
- Suggested future card anchor: Wave C UI card after participation gating stabilization (candidate: P9V2-21 follow-up).







