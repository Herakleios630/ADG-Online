# P8 TODO - Shooting System

Status: In progress - `P8-00` through `P8-03` are implemented/validated on 2026-05-28; Reviewer / Rules Agent review remains required before the Lead treats those cards as accepted
Date drafted: 2026-05-28
Planner: Lead / Phase Steward
Preferred future executor: GPT-5.4 after user approval and the first source gate
Intended branch: feature/p8-shooting-system
Master plan: roadmap.md
Architecture source: docs/architecture.md
Governance source: docs/project-governance.md
Agent operating model: docs/agents/index.md
Rules workspace: docs/rules/
Primary rule source: docs/source/Rules_v2.md `rv2.shooting-core`
Source-lock digest: docs/rules/shooting.md
Open verification source: docs/rules/open-verification.md
Example inventory: docs/source/rules-v2-examples/index.md
Related long-term example board: RULEBOOK_EXAMPLES_todo.md

## Purpose

P8 implements the first honest shooting system for AdG Online. It should let eligible missile units declare and resolve shooting through reducer-owned actions, with explicit eligibility, target priority, range/zone geometry, line of sight, support aggregation, deterministic dice, cohesion-loss output, and UI explanations.

P8 is not full tournament-complete shooting on day one. The phase must be explicit about supported weapon profiles, source-open modifier cases, overhead-fire limits, and scenario/test coverage.

## How To Use This Board

- Do not start P8 implementation until the user approves this board.
- Execute cards in order unless the Lead explicitly revises the board.
- Before each implementation card, give the user a short PM block brief with goal, planned files, scope split, validation, manual acceptance, and non-goals.
- After each implementation card, update this board with files touched, validation run, remaining risks, manual acceptance instructions, and the next exact card.
- Rule-sensitive cards require Reviewer / Rules Agent review before the Lead treats them as accepted.
- If a card encounters source uncertainty that changes legality, stop and return `Blocked` or `Needs Source Check` instead of widening the implementation silently.

## Required Pre-P8 Gates

- `P7B` Reviewer / Rules Agent recheck approved the supported subset on 2026-05-28, and the user explicitly said to continue into P8-01.
- Lead review and `P8-00` source/scope locking are complete as of 2026-05-28.
- User approval of this `P8_todo.md` board is satisfied for planning/scope purposes by the 2026-05-28 GPT-5.5 Lead task, and implementation started with `P8-01` after the P7B gate cleared.
- Reviewer / Rules Agent review remains required for `P8-01` through `P8-03` before Lead acceptance; later cards should keep that review debt visible.
- `docs/rules/shooting.md` remains the working baseline, but its status explicitly says implementation-grade only after ordered modifier-stack and overhead-fire edge cases are manually accepted.
- The `shooting.target-priority-los-and-melee-exclusions` item in `docs/rules/open-verification.md` must remain visible until P8 source checks decide what is implemented, what is diagnostic-only, and what is deferred.

## Scope Decision

In scope for P8:

- first `shooting` engine model and reducer state seam
- explicit missile profile/capability data, starting from shared profile data rather than per-fixture unit overrides
- shooting eligibility predicates for sequence locks, movement locks, melee/support locks, and target-already-shot locks
- deterministic shooting dice/result model suitable for replay and later multiplayer
- range and shooting-zone geometry for the approved first profile set
- target-priority and line-of-sight solver for the approved first subset
- one-target-per-phase tracking and combined shot support aggregation
- first modifier/protection stack for accepted simple cases, with source-open cases clearly deferred
- UI declaration/preview/why surface for selecting shooters and targets
- debug logging for eligibility, target selection, geometry, support, roll claims, and result application
- source-example classification and first golden fixtures/tutorial routing for Rules-v2 p.56-59 assets

Out of scope for P8 unless a later approved card explicitly adds them:

- melee, rout, pursuit, rally, army morale, and victory implementation
- official army-builder legality or full army-list import
- hidden-information shooting cases beyond preserving current visibility discipline
- full terrain/fortification/cover system if exact terrain geometry remains source-open
- full overhead-fire family support before exact predicates are accepted
- optional event cards, reduced format, big battles, sandbox, or AI shooting choices
- claiming tournament-complete shooting for the early subset

## Source Risk Posture

Working baseline:

- `docs/source/Rules_v2.md` `rv2.shooting-core` is scan-confirmed for p.56-59.
- `docs/rules/shooting.md` summarizes the current source-locked baseline and engine invariants.
- Errata remains above base rules in the authority chain.

Open source-risk gates before implementation claims can expand:

- `unit-capabilities.missile-family-taxonomy`: define the first `missileProfileId` taxonomy before shooting coverage is claimed beyond the initial profiles.
- `shooting.target-priority-los-and-melee-exclusions`: keep target priority, line of sight, cover, and melee/support exclusions source-visible during P8.
- Ordered modifier/protection stack: crossbow, firearm, longbow, incendiary, pavise, cover, and fortification interactions need explicit ordered predicates before broad resolution support.
- Overhead fire: hill, artillery over light troops, artillery over enemy light troops, integrated light artillery, and light-horse support-over-light-horse cases need exact predicates before implementation.
- Terrain/cover geometry: terrain cover and more-than-`1 UD` blocking must stay aligned with future terrain modeling rather than a private shooting-only shortcut.

## P8-00 Source/Scope Gate Result

Status: complete for planning on 2026-05-28; blocked for Coding until P7B reviewer/user acceptance.

P7B gate check:

- `P7B_todo.md` still says P7B is awaiting a short Reviewer / Rules Agent recheck after wording/fixture-honesty corrections.
- `roadmap.md` still says P7B-00 through P7B-08 are implemented and validated, but reviewer/lead closeout and user approval remain required before P8.
- Result: P8 implementation cannot start yet, even though this P8 source/scope board is now approved.

First supported implementation subset:

- Use the existing shared profile seam as the first data anchor: `sp-light-missile-foot`, `sp-mounted-bow`, and `sp-none`.
- P8-01 may formalize those IDs into implementation-grade shooting profile rows and attach them to `light-infantry` and `cavalry-bow` representative profiles only.
- First geometry subset is normal front-edge rectangular shooting zone only: weapon range depth, shooting-edge width, and `1 UD` extra width on each side.
- First LOS subset is unit blockers plus clear corner-to-target-edge point geometry. Terrain, ambush, cover, and more-than-`1 UD` cover-blocking stay diagnostic/source-open until exact predicates are accepted.
- First priority subset is nearest directly in front, nearest in normal zone if no direct-front target exists, and `most in front` tie diagnostics where the p.58 example can be represented honestly.
- First support subset includes one target per shooting phase, one main shooter, support up to `+3`, and light-troop half-support rounding.
- First resolution subset may include baseline opposed `D6`, target protection values for source-checked first profiles, support bonus, one cohesion loss maximum, and simultaneous-result records.

Explicitly deferred from first implementation subset:

- light cavalry `360 degrees` shooting and all special-zone families until a dedicated profile card accepts them;
- light chariot rear-edge shooting, war-wagon flank-edge phase choice, medium/heavy artillery extended zone, elephant light artillery, and artillery movement/wheel edge cases;
- crossbow, firearm, longbow, incendiary, pavise, cover, fortification, shooting-from-cover, difficult-terrain, and formed-infantry-versus-mounted circumstance modifiers until P8-07 source-checks exact table order and values;
- all overhead-fire families;
- stable target retention across later turns unless P8-05 can represent geometry-change tracking honestly;
- target/LOS effects for ambush and hidden information beyond preserving source-open visibility diagnostics;
- full reproduction of the p.59 worked example if its light-cavalry special shooting cannot be represented inside the first subset.

Reviewer expectation before first Coding card:

- Reviewer / Rules Agent should treat this as `Approved for planning, Blocked for Coding by P7B gate` unless P7B is accepted in a later message.
- Coding Agent must not start `P8-01` until the user says to proceed after P7B clears.

## Source Example Gate

P8 must classify all Rules-v2 shooting assets before implementation starts.

| Example ID | Initial P8 classification | Planned route | Gate/blocker |
| --- | --- | --- | --- |
| `rv2-p56-shooting-ranges-table-a` | `golden-fixture` plus tutorial reference | use for first missile-profile range table tests for `sp-light-missile-foot` and `sp-mounted-bow` | broader weapon rows stay deferred until their profile families are added |
| `rv2-p57-shooting-zone-a` | partial `golden-fixture` plus tutorial reference | use for normal front-edge rectangle tests in P8-04 | special light-cavalry, war-wagon, light-chariot, artillery, and elephant zones are deferred |
| `rv2-p58-line-of-sight-a` | partial `golden-fixture` plus tutorial reference | use for unit-blocker LOS and priority tests where exact diagram predicates are source-accepted | terrain/cover/ambush blockers remain source-open |
| `rv2-p58-shooting-modifiers-a` | `deferred-reference` until modifier order is accepted, then partial `golden-fixture` | use first as table/source metadata; P8-07 may implement only accepted baseline/support/protection cases | ordered modifier/protection stack remains open for all special modifiers |
| `rv2-p59-shooting-example-a` | partial `tutorial` plus deferred full `golden-fixture` | use later for priority, support, and simultaneous-result regression where the first subset can represent it | full reproduction is blocked by light-cavalry/special-zone and complete modifier prerequisites |

If a source example cannot be faithfully reproduced in P8, record the exact missing prerequisite here and in `RULEBOOK_EXAMPLES_todo.md` instead of simplifying it silently.

## Shared Assumptions

- Default target remains standard 200 points, two players, three corps per army, mandatory camp, 120 x 80 cm battlefield for 6-15 mm, `UD = 4 cm`.
- Early P8 may use scenario/drill units, but missile behavior must come from shared profiles/capabilities whenever possible.
- A target may be shot only once per shooting phase in the supported model.
- Shooting results are deterministic through reducer-owned roll claims/results, not direct UI randomness.
- Simultaneous shooting means result application must not erase legal counterfire already declared in the same phase.
- UI may explain legality and show candidates, but engine/reducer code owns legality.

## Logging Gate

P8 must not start as an uninstrumented combat phase.

- Expected areas: `shooting`, `command`, `ui`, `visibility`, `replay`, and `random` where roll claims/results are created.
- Minimum levels: `warn`/`error` for impossible or source-open states; `debug` summaries for eligibility decisions, target-priority ranking, LOS blockers, support aggregation, modifier stack, roll claims/results, and cohesion-loss application.
- Logs must be structured, bounded, and filterable.
- Logging may explain engine/reducer decisions but must never decide legality or mutate state.
- Browser/manual debug checks should name the filtered URL or runtime filter combination used, following `LOGGING_todo.md` and `docs/browser-automation.md`.

## Role Routing

- Lead / Phase Steward, preferred GPT-5.5 and allowed GPT-5.4 when the user explicitly directs it: owns `P8-00`, source-risk decisions, board revisions, roadmap updates, and cross-board conflicts.
- Coding Agent, GPT-5.4: implements one approved P8 card at a time after `P8-00` and user approval.
- Reviewer / Rules Agent, GPT-5.4: reviews rule-sensitive implementation cards before acceptance.
- Reviewer / Rules Agent with GPT-5.5 only if exact shooting source reconstruction or errata conflicts exceed normal review.
- Optional Data / Validation mode: may be invoked for broad missile-profile table extraction, army-list/profile mapping, or schema-heavy validation.

## Execution Order

1. `P8-00 - Source Gate And Shooting Scope Lock`
2. `P8-01 - Missile Profile And Capability Spine`
3. `P8-02 - Deterministic Shooting Roll And Result Model`
4. `P8-03 - Shooting Phase State And Eligibility Seam`
5. `P8-04 - Range And Shooting-Zone Geometry`
6. `P8-05 - Target Priority And Line Of Sight`
7. `P8-06 - Combined Shot And Support Aggregation`
8. `P8-07 - Resolution And Modifier Stack Subset`
9. `P8-08 - Shooting Declaration UI And Why Surface`
10. `P8-09 - Source Example Validation And Closeout`

## Definition Of Done

P8 is done only when:

- all approved cards are complete or explicitly deferred with exact blockers;
- focused engine/reducer/UI tests pass;
- `npm run build` passes;
- browser smoke validates the implemented shooting flow if browser tooling is available;
- rule-sensitive cards have Reviewer / Rules Agent approval;
- P8 examples are either implemented as source-backed fixtures/tutorial assets or deferred with blockers;
- `roadmap.md` and this board reflect final status;
- user accepts the P8 phase closeout.

## Planned Cards

### [x] P8-00 - Source Gate And Shooting Scope Lock

Goal: lock the exact first P8 shooting subset, example routing, and source-risk gates before implementation.

Planned files:

- P8_todo.md
- roadmap.md
- docs/rules/shooting.md if source-risk wording needs sharpening
- docs/rules/open-verification.md if a source item is narrowed or resolved
- RULEBOOK_EXAMPLES_todo.md if any shooting example is deferred outside P8

Implementation steps:
1. Re-read `docs/source/Rules_v2.md` `rv2.shooting-core`, `docs/rules/shooting.md`, and the shooting entries in `docs/rules/open-verification.md`.
2. Confirm the first supported missile profiles and explicitly list deferred profile families.
3. Classify each p.56-59 example as live P8 fixture/tutorial/deferred reference.
4. Decide whether the first P8 implementation includes only basic front-edge shooters or also light cavalry/special zones.
5. Decide which modifier/protection cases are implemented first and which remain source-open.
6. Update this board and roadmap with the accepted first subset.

Non-goals:

- no engine code
- no UI code
- no scenario implementation
- no broad army-list data import

Validation:

- planning review only
- markdown diagnostics if available

Logging / instrumentation expectations:

- non-goal for this planning/source card, but it must define logging expectations for later P8 cards

Role routing:

- Implementing role: Lead / Phase Steward / preferred GPT-5.5; GPT-5.4 also allowed when the user explicitly directs it
- Required review: Reviewer / Rules Agent / GPT-5.4 if any source-risk gate is marked resolved rather than deferred
- Data / Validation mode: optional only if missile-profile taxonomy becomes table-heavy

Manual acceptance:

- user approves the first P8 subset, source-risk gates, and example routing before code work starts

Stop condition:

- stop if ordered modifiers, overhead fire, or missile taxonomy remain too unclear to define a bounded first subset

Expected result: P8 can move from planning to the first implementation card without pretending the whole shooting chapter is solved.

Closeout 2026-05-28:

- `P8-00` is complete as a Lead / Phase Steward planning card. The first P8 implementation subset is locked to profile-backed `sp-light-missile-foot` and `sp-mounted-bow`, normal front-edge rectangular shooting zones, unit-blocker LOS, basic priority, one-target-per-phase support aggregation, deterministic opposed-roll records, and only source-checked baseline/support/protection resolution.
- Deferred scope is explicit: all special shooting zones, overhead fire, terrain/cover/ambush LOS, broad weapon taxonomy, stable target retention across later turns, and ordered special modifier/protection interactions.
- Source examples p.56-p.59 are classified above as first-subset golden fixtures, tutorial references, partial fixtures, or deferred full reproduction cases.
- P7B gate status was checked and remains blocking: P7B still awaits reviewer/user acceptance, so Coding Agent may not start `P8-01` yet.
- Files touched for this card: `P8_todo.md`, `roadmap.md`, `docs/rules/shooting.md`, and `docs/rules/open-verification.md`.
- Validation: planning/source review plus `git diff --check` for changed planning/source-risk files.
- Next exact blocker: P7B Reviewer / Rules Agent recheck and user acceptance.
- Next exact Coding card after blocker clears: `P8-01 - Missile Profile And Capability Spine`.

### [x] P8-01 - Missile Profile And Capability Spine

Goal: add shared shooting capability/profile data so unit shooting behavior is profile-driven instead of fixture-specific.

Planned files:

- src/data/unit-profiles.js
- src/data/unit-profiles.test.js
- src/engine/shooting/model.js
- src/engine/shooting/index.js
- P8_todo.md

Implementation steps:
1. Create a minimal serializable `missileProfileId` vocabulary accepted by `P8-00`.
2. Define profile fields for weapon family, range, shooting-edge rule, special-zone kind, support eligibility, and source status.
3. Attach first profiles to supported scenario/profile units through shared unit-profile data.
4. Keep unsupported weapons/profiles explicit as `needs-source-check` or absent, not as misleading defaults.
5. Add data-shape tests for supported profiles and no-shoot profiles.
6. Do not add special-zone profile behavior in this card; `sp-mounted-bow` is treated as normal front-edge mounted bow until a later source-locked light-cavalry/special-zone card expands it.

Non-goals:

- no target selection yet
- no shooting resolution yet
- no army-list legality import

Validation:

- focused unit-profile/shooting-model tests
- `npm run build`

Logging / instrumentation expectations:

- no runtime logging required unless profile resolution exposes diagnostics; if diagnostics are logged, area `shooting`, level `debug` for profile resolution and `warn` for unknown profile IDs

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4
- Lead gate: yes if first profile set changes from `P8-00`
- Data / Validation mode: optional if many profile rows are added

Manual acceptance:

- user reviews the visible first profile set and confirms no unsupported missile family is being implied as implemented

Stop condition:

- stop if profile rows require unresolved army-list taxonomy decisions beyond the first P8 subset
- stop if the implementation needs to decide whether `cavalry-bow` is light cavalry for `360 degrees` shooting; that split is explicitly deferred

Expected result: supported units can be identified as shooters through shared data and unsupported units remain honest non-shooters or source-open cases.

Closeout 2026-05-28:

- Implemented the first profile-driven shooting spine without adding target selection, reducer actions, UI, shooting resolution, or special shooting zones.
- Added `src/engine/shooting/model.js` and `src/engine/shooting/index.js` with serializable profile rows for `sp-none`, `sp-light-missile-foot`, and `sp-mounted-bow` only.
- Confirmed p.56 shooting range table from the original scan during implementation: `LI or LH with slings, bows, crossbows or firearms; MI with Atlatl` has range `2`, and `Cv with bows, crossbows or firearms` has range `2`. Javelin range `1`, incendiary, crossbow/firearm, artillery, war wagon, and other rows remain outside this card.
- Moved the exported `SHOOTING_PROFILE_IDS` vocabulary behind the shooting model while preserving the existing `src/data/unit-profiles.js` export seam for current consumers.
- Added `getShootingProfileForUnit(...)` so unit instances resolve shooting through explicit unit override or shared unit profile data; unknown shooting profile IDs fail loudly.
- Kept `sp-mounted-bow` as normal front-edge rectangle only and marked `light-cavalry-360-zone` as deferred rather than deciding whether the current `cavalry-bow` representative is light cavalry.
- Validation passed: `node --test src/engine/shooting/model.test.js src/data/unit-profiles.test.js` passed `18/18`.
- Build passed: `npm run build` passed with only the existing Vite large-chunk warning.
- Files touched: `src/engine/shooting/model.js`, `src/engine/shooting/index.js`, `src/engine/shooting/model.test.js`, `src/data/unit-profiles.js`, `src/data/unit-profiles.test.js`, `P8_todo.md`, `roadmap.md`.
- Manual acceptance remains: user reviews the first visible shooting profile set and confirms no unsupported missile family is being implied as implemented.
- Current card status: implemented and validated; awaiting Reviewer / Rules Agent review before Lead acceptance.
- Reviewer focus: confirm range/source honesty for the two first shooter profiles, the `sp-mounted-bow` special-zone deferral, and that unsupported missile families are not implied by `sp-light-missile-foot` naming.
- Next exact card after review approval: `P8-02 - Deterministic Shooting Roll And Result Model`.

### [x] P8-02 - Deterministic Shooting Roll And Result Model

Goal: add reducer-safe shooting roll claims/results and serializable shot-resolution records before legality and UI depend on dice.

Planned files:

- src/engine/shooting/model.js
- src/engine/shooting/model.test.js
- src/engine/shooting/index.js
- possibly src/state/p0-shooting.js
- P8_todo.md

Implementation steps:
1. Define shooting roll claim fields for shooter, target, phase, acting player, declaration snapshot, and action-log token.
2. Define roll result records for shooter D6, target D6, modifiers, protection value, final totals, cohesion loss, and source status.
3. Keep roll generation deterministic and reducer-owned; UI only submits or selects the deterministic roll result in current local mode.
4. Preserve simultaneous-resolution metadata so later counterfire is not invalidated by early result application.
5. Add serialization and invariant tests.

Non-goals:

- no target legality yet
- no cohesion mutation yet unless a pure model fixture requires it
- no random networking/multiplayer implementation

Validation:

- focused shooting model tests
- replay/serialization shape tests if a replay helper already fits
- `npm run build`

Logging / instrumentation expectations:

- area `shooting` and `random`; `debug` for claim/result creation; `warn` for missing claim or invalid D6 value

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4
- Lead gate: no unless result timing changes phase scope
- Data / Validation mode: not expected

Manual acceptance:

- user confirms deterministic local dice interaction remains understandable before UI expansion

Stop condition:

- stop if the result model cannot preserve simultaneous shooting semantics cleanly

Expected result: P8 has a replay-ready shooting roll/result contract before legality and UI are layered on top.

Closeout 2026-05-28:

- Implemented reducer-safe shooting roll claims and roll results in `src/engine/shooting/model.js` without adding legality, reducer flow, geometry, or UI behavior.
- Added `createShootingRollClaim(...)` for acting player, shooter, target, phase, declaration snapshot, action-log token, and simultaneous-group metadata.
- Added `createShootingRollResult(...)` for shooter D6, target D6, shooter modifier total, target protection value, computed totals, bounded cohesion loss, and source status.
- Added `createShotResolutionRecord(...)` as the first serializable shot-resolution wrapper so later state work can preserve simultaneous-resolution application timing instead of applying counterfire-sensitive results immediately.
- Kept the model deterministic and reducer-ready: no random subsystem, no network/multiplayer behavior, and no target legality or state mutation were added in this card.
- Validation passed: `node --test src/engine/shooting/model.test.js` passed `9/9`.
- Build passed: `npm run build` passed with only the existing Vite large-chunk warning.
- Files touched: `src/engine/shooting/model.js`, `src/engine/shooting/index.js`, `src/engine/shooting/model.test.js`, `P8_todo.md`.
- Manual acceptance remains: user confirms the deterministic claim/result record shape stays understandable before the later UI card exposes it.
- Current card status: implemented and validated; awaiting Reviewer / Rules Agent review.
- Reviewer focus: confirm D6/result-model honesty, one-cohesion-loss cap, and simultaneous-resolution metadata sufficiency without hidden legality or reducer-scope creep.
- Next exact card after review approval: `P8-03 - Shooting Phase State And Eligibility Seam`.

### [x] P8-03 - Shooting Phase State And Eligibility Seam

Goal: add reducer-owned shooting phase state and eligibility predicates for who may shoot and who may be targeted in the first subset.

Planned files:

- src/engine/shooting/eligibility.js
- src/engine/shooting/eligibility.test.js
- src/state/p0-shooting.js
- src/state/p0-state.js
- src/state/p0-state.test.js or focused reducer tests
- P8_todo.md

Implementation steps:
1. Add a shooting phase state shape for declared shots, already-targeted unit IDs, pending roll claims, and resolved shot records.
2. Implement eligibility predicates for supported shooter profiles, moved/charged/evaded/disengaged locks, artillery movement lock if in first subset, melee/support locks, and target already shot.
3. Keep eligibility independent from UI rendering.
4. Reset/update shooting state at the correct phase/sequence boundaries in the current phase tracker without redesigning the whole turn loop.
5. Add focused tests for allowed, disallowed, and source-open eligibility states.

Non-goals:

- no LOS/range legality yet except placeholders for later cards
- no full turn-loop redesign
- no melee/rout side effects

Validation:

- focused eligibility/reducer tests
- `npm run build`

Logging / instrumentation expectations:

- area `shooting`; `debug` eligibility summary per candidate; `warn` for source-open locks or impossible phase state

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4
- Lead gate: yes if phase lifecycle changes beyond shooting state
- Data / Validation mode: not expected

Manual acceptance:

- user verifies the first shooter/target eligibility explanation remains honest and does not claim full shooting coverage

Stop condition:

- stop if current phase state cannot represent both own-sequence and opponent-sequence shooting without overhauling the phase tracker

Expected result: units have reducer-owned shooting eligibility and phase tracking that later geometry and UI can consume.

Closeout 2026-05-28:

- Added the first reducer-owned `game.shooting` seam in `src/state/p0-shooting.js` with serializable declared-shot, targeted-unit, pending-roll-claim, and resolved-shot arrays.
- Wired the shooting state into battle start and round flow so entering the shooting round phase creates an active shooting state for the acting player, while new corps-movement turns reset stale shooting trackers.
- Added `src/engine/shooting/eligibility.js` with pure shooter and target eligibility predicates for the current supported subset.
- Current source-closed shooter locks: non-shooter profiles, wrong phase, active-player ownership in the current local sequence seam, second-or-later move lock, charged-this-sequence, evaded-this-sequence, explicit `cannotShootThisSequence`, engaged-in-melee, and melee-support locks.
- Current source-closed target locks: self/friendly target rejection, target-already-shot rejection, engaged-in-melee rejection, and melee-support rejection.
- Kept opponent-sequence reactive shooting source-open in this card instead of pretending the current turn-phase tracker already models it fully; the eligibility seam returns explicit `source-open` diagnostics for that case.
- Ordinary first-move shooting remains allowed for the current non-artillery subset, matching the source baseline that only second or third moves block normal shooters in the same sequence. The reducer-owned seam now tracks `moveCountThisSequence` at committed movement, charge, and evade paths so later cards can distinguish legal first-move shooting from blocked later moves.
- The eligibility seam also accepts `disengaged-this-sequence` and `retreated-out-of-ZoC` predicate inputs because the source lock requires those later, but the current P8-03 reducer slice does not yet produce live committed flags for them. Treat both as deferred seam support, not as verified live flow coverage.
- No LOS, range, target-priority ranking, declaration UI, result application, or broader turn-loop redesign was added in this card.
- Focused validation passed: `node --test src/engine/shooting/eligibility.test.js --test-name-pattern "P8-03|requesting the next corps spends the active corps and can branch into shooting|round begin resets stale shooting phase tracking" src/state/p0-state.test.js` passed.
- Build passed: `npm run build` passed with only the existing Vite large-chunk warning.
- Files touched: `src/engine/shooting/eligibility.js`, `src/engine/shooting/eligibility.test.js`, `src/engine/shooting/index.js`, `src/state/p0-shooting.js`, `src/state/p0-battle-start.js`, `src/state/p0-round.js`, `src/state/p0-state.test.js`, `P8_todo.md`.
- Manual acceptance remains: user verifies that the first shooter/target eligibility explanations stay honest about the current subset and the opponent-sequence source-open gap.
- Current card status: implemented and validated; awaiting Reviewer / Rules Agent review.
- Reviewer focus: confirm the eligibility locks are honest for the current subset, including that `charged` and `evaded` are live reducer-owned locks while `disengaged` and `retreated-out-of-ZoC` remain deferred seam inputs, the new `game.shooting` seam resets at the right round boundaries, and opponent-sequence reactive shooting is left source-open rather than implicitly implemented.
- Next exact card after review approval: `P8-04 - Range And Shooting-Zone Geometry`.

### [x] P8-04 - Range And Shooting-Zone Geometry

Goal: implement source-backed shooting range and zone predicates for the first approved profile set.

Planned files:

- src/engine/shooting/geometry.js
- src/engine/shooting/geometry.test.js
- src/engine/shooting/index.js
- possibly src/ui/battlefield-shooting-overlays.js for testable projection helpers only if needed
- P8_todo.md

Implementation steps:
1. Implement range measurement from shooting edge to target base for approved profile shapes.
2. Implement normal rectangular shooting zone: weapon depth and shooting edge width plus `1 UD` each side.
3. Return source-open diagnostics for all special zones in the first subset.
4. Add boundary/equality tests and profile-specific source-status tests.
5. Tie geometry output to eligibility as diagnostics, not UI-only decisions.

Non-goals:

- no LOS blockers yet
- no target priority ranking yet
- no terrain cover modeling except diagnostic hooks

Validation:

- focused shooting geometry tests
- source-example fixture candidates for `rv2-p56` and `rv2-p57` where accepted
- `npm run build`

Logging / instrumentation expectations:

- area `shooting`; `debug` for zone/range candidate summaries; `warn` for unsupported special zone family

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4
- Lead gate: yes if special-zone scope changes
- Data / Validation mode: not expected

Manual acceptance:

- user checks that visual or textual range/zone feedback matches the approved first subset and labels deferred shapes honestly

Stop condition:

- stop if exact special-zone geometry cannot be separated cleanly from unsupported profile families

Expected result: approved shooters can compute in-range/in-zone targets with source-status diagnostics.

Closeout 2026-05-28:

- Added `src/engine/shooting/geometry.js` with pure range and zone evaluation for the approved P8-04 subset.
- Range is now measured from any point on the shooting front edge to any point on the target base for the current supported rectangle shooters, including circle targets.
- Implemented the normal front-edge rectangular zone as the shooting edge width plus `1 UD` lateral padding on each side and full profile range depth ahead of the front edge.
- Added source-open/deferred diagnostics for profiles that still carry special-zone families outside the current slice, instead of pretending those families are already implemented.
- Kept mounted bow on the approved normal-rectangle subset for this card while surfacing its deferred special-zone warning honestly; light cavalry `360 degrees` shooting remains deferred.
- Recorded the future-shape nuance that deferred `360 degrees` light-cavalry shooting is not a single plain rectangle and should later be modeled as edge-based coverage rather than silently inherited from the current rectangle helper.
- No LOS, target priority, terrain cover, declaration UI, or reducer application logic was added in this card.
- Focused validation passed: `node --test src/engine/shooting/geometry.test.js` passed.
- Build passed: `npm run build` passed with only the existing Vite large-chunk warning.
- Files touched: `src/engine/shooting/geometry.js`, `src/engine/shooting/geometry.test.js`, `src/engine/shooting/index.js`, `P8_todo.md`, `roadmap.md`.
- Manual acceptance remains: user verifies that the current range/zone behavior feels correct for the approved rectangle subset and that deferred special zones are labeled honestly.
- Current card status: implemented and validated; awaiting Reviewer / Rules Agent review.
- Reviewer focus: confirm front-edge range measurement, rectangle-zone boundary semantics, mounted-bow deferred special-zone honesty, and absence of LOS/priority/UI creep.
- Next exact card after review approval: `P8-05 - Target Priority And Line Of Sight`.

### [x] P8-05 - Target Priority And Line Of Sight

Goal: implement target-priority ranking and LOS predicates for supported shooter/target cases.

Planned files:

- src/engine/shooting/target-priority.js
- src/engine/shooting/line-of-sight.js
- src/engine/shooting/target-priority.test.js
- src/engine/shooting/line-of-sight.test.js
- P8_todo.md

Implementation steps:
1. Implement nearest-directly-in-front priority for the approved subset.
2. Implement nearest-in-zone fallback and `most in front` tie diagnostics where source-accepted.
3. Preserve only a diagnostic hook for stable target retention unless the current state can track geometry changes honestly; do not implement retention by guesswork.
4. Implement LOS corner-to-single-point predicate for unit blockers in the approved subset.
5. Keep terrain/ambush cover blockers source-open unless exact predicates are accepted by `P8-00` or later board update.
6. Add tests tied to `rv2-p58-line-of-sight-a` where the diagram can be faithfully represented.

Non-goals:

- no full terrain visibility system
- no ambush reveal logic
- no target choice UI yet beyond projected diagnostics

Validation:

- focused target-priority and LOS tests
- source-example geometry fixture if accepted
- `npm run build`

Logging / instrumentation expectations:

- area `shooting`; `debug` ranked target candidates and LOS blocker summaries; `warn` for source-open terrain/ambush predicates

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4
- Lead gate: yes if target-retention or terrain visibility becomes scope-changing
- Data / Validation mode: not expected

Manual acceptance:

- user verifies target priority/LOS explanations are readable and do not hide a source-open blocker as legal

Stop condition:

- stop if the p.58 diagram cannot be mapped to exact enough predicates for the claimed tests

Expected result: supported shooters can identify legal/priority targets and explain blocked or non-priority candidates.

Closeout 2026-05-28:

- Added `src/engine/shooting/target-priority.js` with pure priority ranking for the approved subset.
- Implemented nearest-directly-in-front priority first, then nearest-in-zone fallback when nothing is directly in front.
- Kept the exact geometric `most in front` tie-break source-open: equal-distance directly-in-front targets now stay a player-choice seam until the wording is closed more precisely.
- Kept stable repeated-target retention deferred as an explicit diagnostic instead of pretending the current state already tracks geometry changes across turns.
- Added `src/engine/shooting/line-of-sight.js` with the current P8-05 unit-blocker LOS subset: both shooting-edge corners must see a single supported point on one target edge.
- Current LOS subset uses deterministic edge-point candidates on the target base for unit blockers only; terrain, ambush, cover-depth, and broader exact-diagram predicates remain source-open diagnostics in this card.
- No declaration UI, reducer target locking, support aggregation, or modifier stack logic was added in this card.
- Focused validation passed: `node --test src/engine/shooting/target-priority.test.js src/engine/shooting/line-of-sight.test.js` passed.
- Build passed: `npm run build` passed with only the existing Vite large-chunk warning.
- Files touched: `src/engine/shooting/target-priority.js`, `src/engine/shooting/target-priority.test.js`, `src/engine/shooting/line-of-sight.js`, `src/engine/shooting/line-of-sight.test.js`, `src/engine/shooting/index.js`, `P8_todo.md`, `roadmap.md`.
- Manual acceptance remains: user verifies that target-priority and LOS explanations feel readable and do not hide deferred blocker families as solved.
- Current card status: implemented and validated; awaiting Reviewer / Rules Agent review.
- Reviewer focus: confirm nearest-front versus nearest-in-zone priority honesty, player-choice tie handling, current unit-blocker LOS subset honesty, and absence of UI/reducer/support-scope creep.
- Next exact card after review approval: `P8-06 - Combined Shot And Support Aggregation`.

### [x] P8-06 - Combined Shot And Support Aggregation

Goal: implement one-shot-per-target phase tracking and support aggregation for multiple shooters on one target in the first supported subset.

Planned files:

- src/engine/shooting/support.js
- src/engine/shooting/support.test.js
- src/state/p0-shooting.js
- src/state/p0-shooting.test.js
- P8_todo.md

Implementation steps:
1. Model a declared shot group with one main shooter, target, and eligible supporting shooters.
2. Enforce that a target is shot at most once per shooting phase in the supported state seam.
3. Implement support cap `+3` and light-troop half-support rounding for the first subset.
4. Keep unsupported support networks or source-open families as diagnostics.
5. Add tests for cap, light-support rounding, duplicate target lock, and unsupported support cases.

Non-goals:

- no melee support implementation
- no group command system rewrite
- no automatic shooter AI selection

Validation:

- focused support aggregation tests
- reducer tests for target-shot tracking
- `npm run build`

Logging / instrumentation expectations:

- area `shooting`; `debug` for shot-group aggregation; `warn` for duplicate target declarations or unsupported support family

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4
- Lead gate: no unless support scope expands into melee/P9 systems
- Data / Validation mode: not expected

Manual acceptance:

- none for this engine/state-only slice

Stop condition:

- stop if support aggregation requires melee-support role data that P9 owns and P8 cannot safely stub

Expected result: a target can receive one combined shooting calculation with source-backed support metadata.

Closeout 2026-05-28:

- Added `src/engine/shooting/support.js` with pure combined-shot aggregation for one main shooter plus supporting shooters in the current subset.
- Implemented light-troop half-support rounding after totaling and enforced the source-backed `+3` support cap.
- Supporting shooters that cannot legally contribute in the current subset are rejected explicitly instead of being silently counted.
- Source-open support families stay diagnostic-only for now and are not registered into reducer-owned phase target locks.
- Added reducer-owned `declareShootingShotGroup(...)` in `src/state/p0-shooting.js` so declared shot groups append into `game.shooting.declaredShots` and lock `targetedUnitIds` once per phase.
- Duplicate target declarations in the same shooting phase are rejected through the state seam instead of relying on UI-only filtering.
- No declaration UI, AI shooter choice, melee-support wiring, or resolution/modifier logic was added in this card.
- Focused validation passed: `npm test -- --test src/engine/shooting/support.test.js src/state/p0-shooting.test.js` passed.
- Build passed: `npm run build` passed with only the existing Vite large-chunk warning.
- Files touched: `src/engine/shooting/support.js`, `src/engine/shooting/support.test.js`, `src/engine/shooting/index.js`, `src/state/p0-shooting.js`, `src/state/p0-shooting.test.js`, `P8_todo.md`, `roadmap.md`.
- Manual acceptance: none for this engine/state-only slice.
- Current card status: implemented and validated; awaiting Reviewer / Rules Agent review.
- Reviewer focus: confirm one-target-per-phase locking honesty, support-cap and light-support rounding correctness, source-open support-family handling, and absence of UI/resolution/melee-scope creep.
- Next exact card after review approval: `P8-07 - Resolution And Modifier Stack Subset`.

### [x] P8-07 - Resolution And Modifier Stack Subset

Goal: resolve supported shooting declarations into deterministic cohesion-loss outcomes with an explicitly bounded modifier/protection stack.

Planned files:

- src/engine/shooting/resolution.js
- src/engine/shooting/resolution.test.js
- src/engine/shooting/index.js
- P8_todo.md

Implementation steps:
1. Implement only the baseline/support/protection cases accepted by `P8-00`.
2. Compare shooter and target deterministic D6 totals with shooter circumstance modifiers and target protection.
3. Apply at most one cohesion loss per target per phase.
4. Preserve simultaneous-resolution records so counterfire remains valid even if a unit would later disorder or rout.
5. Mark crossbow/firearm/longbow/incendiary/pavise/cover/fortification/overhead interactions as deferred in this first implementation slice unless a later Lead source gate explicitly expands scope.
6. Add tests for supported result outcomes and deferred modifier diagnostics.

Non-goals:

- no full rout/pursuit from cohesion loss
- no broad fortification/camp combat model
- no overhead fire unless exact predicates were accepted earlier

Validation:

- focused shooting resolution tests
- deterministic dice/result serialization tests
- `npm run build`

Logging / instrumentation expectations:

- area `shooting`; `debug` modifier stack and final totals; `warn` for source-open modifier/protection cases; `error` for impossible roll/result state

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4, with GPT-5.5 recommended if modifier order is contested
- Lead gate: yes for any modifier-stack scope expansion
- Data / Validation mode: not expected

Manual acceptance:

- user reviews the first resolution subset and confirms source-open modifiers are not displayed as implemented

Stop condition:

- stop if ordered modifier/protection cases cannot be implemented without guessing

Expected result: supported shots can resolve into deterministic no-effect or one-cohesion-loss outcomes with honest modifier reporting.

Closeout 2026-05-28:

- Added `src/engine/shooting/resolution.js` as the first pure P8-07 resolver on top of the existing declared-shot and roll/result model.
- Implemented the supported baseline only: combined-shot support bonus feeds the shooter modifier total, while target protection resolves only through explicit verified protection input in the current narrow subset.
- Removed the earlier overclaim that basic protection could already be inferred as verified from current ability tags alone; unresolved basic protection families now stay source-open until a truly source-closed protection table exists.
- Kept an explicit verified-protection override seam so later data-backed or fixture-backed protection inputs can be passed in without pretending that the whole table is already source-closed.
- Broader circumstance and protection families stay honest and source-open in this slice: cover, fortifications, shooting-from-cover, difficult-terrain shooting, longbow, crossbow, firearm, incendiary, pavise, mounted-target bonuses, and overhead-fire cases currently return diagnostics instead of invented totals.
- Preserved simultaneous-resolution metadata by returning `claim`, `result`, and `record` through the existing serializable shooting model.
- No UI flow, reducer result application, cohesion mutation, rout logic, or broader modifier-table implementation was added in this card.
- Focused validation passed: `npm test -- --test src/engine/shooting/resolution.test.js` passed.
- Build passed: `npm run build` passed with only the existing Vite large-chunk warning.
- Files touched: `src/engine/shooting/resolution.js`, `src/engine/shooting/resolution.test.js`, `src/engine/shooting/index.js`, `P8_todo.md`, `roadmap.md`.
- Manual acceptance remains: user reviews the first resolution subset and confirms the source-open modifier/protection families are shown as deferred rather than implemented.
- Current card status: implemented and validated; awaiting Reviewer / Rules Agent review.
- Reviewer focus: confirm support bonus application, explicit verified-protection override handling, source-open treatment for unresolved basic protection and broader modifier/protection families, and absence of reducer/UI/rout-scope creep.
- Next exact card after review approval: `P8-08 - Shooting Declaration UI And Why Surface`.

### [ ] P8-08 - Shooting Declaration UI And Why Surface

Goal: expose shooting through a lean battlefield UI with shooter-first guidance, reducer-owned priority target and shooting-zone overlays, popup-based shot confirmation/resolution input, and a source-honest guided shooting-phase procedure.

Status: in progress - the replanned lean choose-shooter rail, reducer-owned priority target plus supported zone overlays, popup-first `Schiessen -> OK` flow, finished-marker/target-lock follow-through, round-relative active-player to passive-player shooting handoff, and richer mirrored `Shooting Drill` fixture are implemented and validated on 2026-05-28. P8-08 is now ready for Reviewer / Rules Agent recheck and user manual acceptance.

P8-08 preparation note:

- For browser tests and debug work, prefer adding one or more dedicated shooting-phase scenario entries that load directly into the shooting phase with pre-arranged legal and source-open target cases. Treat these as test/debug fixtures for the P8 UI flow, not as a new game-mode branch or a substitute for normal phase progression.

Lead planning delta 2026-05-28 - guided shooting procedure:

- Rule classification: shooting is optional, target priority is rule-constrained, shooting results are simultaneous, and the phasing player chooses the order in which shots are resolved locally. Therefore the UI may guide the player through all relevant shooters, but it must not describe shooting as mandatory and must provide a reducer-owned `Pass` / `Skip` completion path for an eligible unit.
- Phase-start popup: when a shooting phase segment starts for the current phasing player, show a compact overview with at least these reducer-derived counts: total ranged units for that player, ranged units actually eligible to shoot in the current sequence, ranged units blocked from shooting with the dominant reason family, and source-open/deferred cases if any. The same popup component should work for Player A and Player B when each player's own sequence reaches shooting. The popup starts the procedure but must not auto-select the first active shooter.
- Player-order rework requirement: after the popup, unresolved eligible shooters are selectable by the phasing player. Left-to-right ordering may be used only for visual sorting and deterministic tests; it must not choose the next active shooter for official play.
- Shooter/target flow: when the player selects a shooter, the reducer computes that shooter's priority target set from eligibility, range, zone, line of sight, and target-priority rules. If there is exactly one priority target, the reducer auto-selects it. If there are multiple equal-priority targets, the player chooses among those tied targets only. A non-priority target cannot be selected just because it is visible.
- Support flow: all shooting at one target is one combined shot. The player chooses one main shooter, and other eligible shooters may support only if they can legally shoot that same target under their own eligibility, range, line of sight, and target-priority state. If a potential supporter has a different priority target, it cannot support this shot. If several unresolved shooters share the same priority target, the chosen main shooter fires and the other eligible same-target shooters are offered as support, capped at `+3`, with light-troop support counted as half and rounded up after totaling.
- Support presentation: show support lines from each included supporter to the target and display the current contribution label (`+1` or `+1/2`) without letting the UI decide support legality. Source-open support families must stay diagnostic rather than silently counted.
- Battlefield status language during the procedure: the active shooter stays normally rendered and receives the active/range/priority overlay; ranged units that cannot shoot are marked with a red front strip; ranged units not yet processed are marked with a yellow front strip; ranged units whose shooting decision is finished are marked with a green front strip; non-ranged melee-only profiles are muted/greyed as whole unit tokens, not merely front-strip marked.
- Done means either a confirmed shot, being consumed as a supporting shooter in a confirmed combined shot, or an explicit pass/skip, because official shooting is optional. A green status must not imply the unit fired as the main shooter.
- The status colours must be projections of reducer/engine shooting procedure state, not DOM-local UI decisions. Hover/tooltip why text should reuse the same eligibility, priority, and source-open diagnostics already exposed by the shooting presentation layer.
- Target lock: once a combined shot at a target is confirmed, that target is considered shot for the phase and cannot be selected again. The main shooter and all included supporting shooters are finished for the phase.
- Simultaneity guard: procedure status, eligibility, and modifier/protection inputs for later shots in the same simultaneous window must not be affected by cohesion losses or routed/disordered results recorded earlier in the UI order. Result records remain pending until the simultaneous application slice applies them.
- Current P8 boundary: implement the guided active-player own-sequence procedure first. Opponent reactive shooting/counterfire inside the opponent's sequence remains source-open/deferred unless a later approved card closes that seam.

Lead planning delta 2026-05-28 - simplified P8-08 UX:

- Left-side procedure shell: when the shooting phase starts, the left command area should collapse to one broad procedure bar such as `Waehle Schuetzen` plus a compact overview of remaining eligible/blocked/done counts. Do not keep the current multi-button command stack visible at equal weight during the choose-shooter state.
- Choose-shooter state: before a shooter is chosen, the left panel should primarily communicate procedure state, not per-shot mechanics. The player selects an unresolved shooter on the battlefield. Optional shooting still requires a reducer-owned pass/skip path, but it should be visually secondary to the main choose-shooter guidance rather than presented as a competing primary action block.
- Shooter-selected state: once a shooter is selected, the reducer should immediately project the currently legal priority target state onto the battlefield. At minimum this means a visible priority-target marker or line from shooter to target. If the current supported geometry can produce a source-closed shot zone for that shooter profile, also render the shooting rectangle/zone overlay at the same time.
- Shooting-zone dependency boundary: P8 may only render zone overlays for the currently supported source-closed zone family, which is the normal front-edge rectangular zone. If a future weapon/profile depends on deferred special-zone behavior, the UI must show a source-open/deferred notice rather than inventing a fake rectangle.
- Left-side action after shooter selection: once a shooter and legal target are established, the left panel should reduce to one clear primary action, `Schiessen`. Supporting explanation may remain compact, but dice/protection editing should not stay spread across the left command stack. Because shooting is optional, `Pass` / `Ueberspringen` still needs to exist, but as a clearly secondary action.
- Popup-first resolution flow: clicking `Schiessen` should open a modal/popup for the current combined shot. That popup becomes the home of the current verified-protection input, shooter/target dice controls, support summary, and the short result preview. Later the popup may show the final resolved outcome directly, but the current bounded roll/protection seam should already move into that popup instead of the left rail.
- Confirmation semantics: confirming the popup with `OK` should finish that shooter's decision immediately for the current phase, including support consumption and target lock where applicable, then return the battlefield to choose-shooter mode for the next unresolved shooter.
- Priority visibility requirement: if the reducer auto-selects a unique priority target, the battlefield must make that automatic choice obvious through the target marker/line before the player presses `Schiessen`. If priority remains tied, the battlefield should communicate that the player is still choosing among tied targets and should not pretend one tie winner already exists.
- UI honesty boundary: do not imply that every future weapon family already has a bespoke zone overlay. Current P8 may lean on the approved normal-rectangle subset backed by `sp-light-missile-foot` and current `sp-mounted-bow` treatment; broader special-zone families stay deferred until a later source-locked card.

Planned files:

- src/state/p0-shooting.js
- src/state/p0-round.js
- src/ui/battlefield-command-panel.js
- src/ui/battlefield-dialogs.js
- src/ui/p0-battlefield.js
- src/ui/p0-app.js
- src/ui/battlefield-shooting-overlays.js if needed
- src/styles/p0-battlefield.css
- src/state/p0-shooting.test.js
- src/state/p0-round.test.js if the phase dialog reducer seam needs new coverage
- src/ui/battlefield-command-panel.test.js
- src/ui/p0-battlefield.test.js
- src/ui/battlefield-dialogs.test.js if the popup renderer gets focused coverage
- src/data/charge-drill-scenarios.js or a dedicated shooting-drill scenario file if the fixture surface should stay phase-specific
- P8_todo.md

Implementation steps:
1. Add shooting entry points only when reducer-owned shooting eligibility allows them.
2. Replace the choose-shooter left rail with a broad procedure bar and compact counts summary instead of a dense multi-button command stack.
3. Show target candidates and priority/LOS/range explanations from engine projections.
4. When a shooter is selected, immediately project the priority target marker/line and, for supported zone families only, the shooting-zone overlay from shared shooting geometry.
5. Let the user declare/cancel/confirm supported shots without UI-owned legality.
6. Move deterministic roll/protection interaction into a dedicated popup for the active combined shot instead of keeping it in the left command panel.
7. Show resolved result summary and source-open reasons inside that popup flow without blocking unrelated battlefield state.
6. Preserve P7C command-menu hierarchy and do not reopen finished movement commands.
8. Add at least one direct-to-shooting debug/browser fixture so P8 UI smoke tests do not need to click through earlier phases.
9. Add reducer-owned shooting procedure state for phase overview counts, selectable unresolved shooter ids, selected shooter id, priority target candidates, optional tied-target choice, included supporter ids, processed shooter ids, passed shooter ids, target locks, and procedure completion.
10. Replace the generic shooting phase placeholder dialog with a real shooting-start popup that shows total ranged, eligible, blocked, and source-open counts for the current phasing player, then drops into the slim choose-shooter rail.
11. After the popup, leave the player in selectable-shooter mode instead of auto-focusing the leftmost shooter; selecting any eligible unresolved shooter establishes the active shot draft.
12. For the selected shooter, compute priority targets in reducer/state from engine projections; auto-select one priority target, or ask the player only when equal-priority targets remain tied.
13. Compute same-target eligible supporters from reducer/engine projections. A supporter must be unresolved, able to shoot the selected target, and not blocked by its own target-priority state; different-priority shooters are not support candidates.
14. Render included supporters with support lines and contribution labels (`+1` or `+1/2`), priority target marking, and supported shooting-zone overlays, then open the shot popup for dice/protection confirmation.
15. Confirming the shot popup finishes the main shooter and included supporters, locks the target for the phase, and returns to choose-shooter mode for the next unresolved shooter.
16. Add battlefield status markers for ranged blocked / ranged waiting / ranged finished / active shooter, and grey whole non-ranged melee-only unit tokens during the shooting procedure.
17. Keep confirmed shooting results pending for simultaneous application; do not mutate cohesion or let earlier resolved-shot records change later same-phase eligibility.

Non-goals:

- no AI target selection
- no multiplayer visibility implementation
- no new movement/charge/conformation behavior
- no permanent bypass of normal battle progression outside explicit debug/test fixtures
- no mandatory shooting rule or auto-fire-all behaviour; optional shooting requires pass/skip
- no opponent reactive shooting implementation inside this delta unless separately source-checked and approved
- no UI-owned legality or colour state that can diverge from reducer projections
- no same-phase cohesion/rout application before the simultaneous application slice
- no full automatic protection/modifier table beyond the current explicit verified-protection seam
- no arbitrary target picking when the reducer has exactly one priority target
- no support from a unit whose own legal priority target is different from the selected shot target

Validation:

- focused UI presentation tests
- focused battlefield render tests
- `npm run build`
- browser smoke for the slim phase-start rail, player-selected shooting order, selecting shooter, auto priority target marking/line, supported shooting-zone overlay, equal-priority target choice, support labels/lines, opening the shot popup, resolving a supported shot inside that popup, and seeing a source-open target reason if browser tooling is available
- browser/debug smoke should prefer the direct shooting-phase fixture so validation does not depend on clicking through earlier phases first
- focused reducer tests for phase overview counts, selectable shooter set construction, no automatic left-to-right active shooter, phasing-player chosen order, priority-target auto-selection, tied priority target choice, same-priority supporter enforcement, shot-group participant completion, pass/skip completion, target locking, and same-phase pending result isolation
- focused render/browser tests for the Player A/Player B shooting popup overview, the slim choose-shooter rail, battlefield colour legend, priority target marker/line, supported shooting-zone overlays, and support presentation: active normal, red blocked ranged, yellow waiting ranged, green finished ranged, whole-token grey non-ranged melee-only units, support lines, and support contribution labels

Logging / instrumentation expectations:

- areas `shooting` and `ui`; `debug` for surfaced command groups, target candidate projections, roll dialog transitions, and result summaries; `warn` for impossible UI state

Role routing:

- Implementing role: Coding Agent / GPT-5.4
- Required review: Reviewer / Rules Agent / GPT-5.4 plus browser smoke evidence
- Lead gate: yes if UI scope changes command-menu structure beyond P8 needs
- Data / Validation mode: not expected

Manual acceptance:

- user verifies the shooting flow is understandable in normal play, the left rail stays lean in choose-shooter mode, the shot popup is a clearer home for dice/protection input than the old left-panel stack, and the direct shooting-phase debug fixture is sufficient for repeatable browser checks
- user verifies the phase-start overview counts are understandable and that the battlefield status colours match the intended procedure language without implying that optional units are forced to shoot
- user verifies that selecting a shooter makes the priority target obvious on the battlefield and that a shooting-zone overlay appears only for currently supported zone families rather than being guessed for deferred special cases

Stop condition:

- stop if the UI would need to decide shooting legality itself or conflict with P7C branch ownership

Expected result: users can perform the supported shooting flow from the battlefield UI with rule-owned explanations.

Progress 2026-05-28:

- Added a dedicated `Shooting Drill` entry on the new-game screen plus `src/data/shooting-drill-scenarios.js` so browser/debug checks can enter the supported shooting subset directly in the shooting phase.
- Extended `src/state/p0-shooting.js` with reducer-owned declaration preview state, target selection, why-surface projections, and confirm/cancel declaration helpers; target legality still comes from engine/state projection rather than UI filtering.
- Wired the battlefield UI through `src/ui/battlefield-command-panel.js`, `src/ui/p0-battlefield.js`, and `src/ui/p0-app.js` so eligible shooters get a `Shoot` branch, targets can be clicked in-place, why/diagnostic cards explain blocked or source-open picks, and confirmed declarations still use the existing reducer-owned target lock seam.
- Added the bounded local roll/result slice on top of the existing P8-07 resolver: a reducer-owned resolution draft, explicit verified protection input, deterministic shooter/target D6 selection, source-open preview when protection is missing, and frozen resolved-shot summaries after confirmation.
- Fixed the reviewer-found stale-preview leak by clearing shooting preview/resolution draft state on phase exit and by only surfacing the effective `shoot` branch during the shooting phase.
- Added focused tests for the new drill/menu entry, shoot branch button, why card, bounded roll/result controls, battlefield target metadata, the phase-switch regression, and the reducer-owned resolution draft path.
- Intentional honesty boundary for the current in-progress state: the battlefield UI now supports declaration plus the bounded roll/result flow only when the user provides an explicit verified protection value; broader modifier/protection families and inferred basic protection remain source-open diagnostics rather than guessed values.
- Focused validation passed: `npm test -- --test src/state/p0-shooting.test.js src/state/p0-state.test.js src/ui/p0-app.test.js src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js` passed.
- Build passed: `npm run build`.
- Browser smoke passed on the direct `Shooting Drill` fixture: declaration, bounded roll/result confirmation with verified protection input, frozen resolved-shot summary, and removal of shooting controls after switching to `Movement` were verified in the live app.
- Initial guided-procedure implementation also passed focused reducer/UI tests, build, and live browser smoke for the shooting-start popup, procedure start, active shooter controls, pass path, battlefield procedure colours, whole-token non-ranged greying, and pending-result isolation.
- Lead/user recheck reopened the guided-procedure portion before closeout: official shooting order is chosen by the phasing player, so the current left-to-right active queue must be replaced by selectable unresolved shooters; support grouping must be derived from same-target priority legality, not from arbitrary helper selection.
- Guided-procedure rework is now implemented in the reducer/UI slice: no automatic left-to-right active shooter remains, unresolved shooter order is player-selected, unique priority targets auto-select, same-target supporters are derived only from each supporter's own legal priority state, support lines plus `+1` / `+1/2` badges are reducer-owned UI projections, and confirming a combined shot now finishes the main shooter and included supporters together while keeping simultaneous results pending.
- Focused validation passed for the rework: `npm test -- --test src/state/p0-shooting.test.js`, `npm test -- --test src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js`, and `npm run build` all passed.
- Replanned UX implementation is now validated end-to-end: the left rail opens as `Waehle Schuetzen`, selecting a shooter immediately shows the reducer-owned priority line plus supported normal-rectangle zone overlay, `Schiessen` opens the popup-owned dice/protection flow, and confirming `OK` returns to choose-shooter mode with the shooter marked finished and the target lock preserved.
- Added reducer-owned end-of-sequence handoff flow: once all eligible shooters in the active sequence are finished, a shooting-phase popup now asks for handoff to the next player when another supported sequence exists, or shows `Weiter mit Nahkampfphase` and advances the live battle phase to melee on confirmation when no further supported shooting sequence applies.
- Corrected the handoff semantics inside that flow: reducer-owned shooting-sequence handoff now uses the current round's active player and passive player instead of a hardcoded player-1-first assumption, so the first completed shooting segment always hands off into the opposing side's shooting segment for that round, and only the passive side's completion opens the melee handoff popup.
- Corrected the direct `Shooting Drill` fixture to enter the active guided shooting procedure immediately, so the first selected shooter now exposes the optional `Pass` action alongside `Schiessen` instead of behaving like a pre-acknowledge phase-start state.
- Focused validation for the handoff follow-up passed: `npm test -- --test src/state/p0-state.test.js src/ui/p0-battlefield.test.js`, `npm run build`, and rebuilt browser smoke on the direct `Shooting Drill` confirmed the final melee-handoff popup and live transition into `Melee` after the last shooter was resolved/passed.
- Refined validation after the handoff correction passed: `npm test -- --test src/state/p0-state.test.js src/ui/p0-battlefield.test.js`, `npm run build`, and rebuilt browser smoke on the direct `Shooting Drill` confirmed `Pass` on the first selected shooter, the player-1 `Abgabe an naechsten Spieler?` popup, the player-2 zero-shooter `Gefuehrte Shooting Procedure` popup, and the final `Weiter mit Nahkampfphase` transition into `Melee`.
- Expanded the direct `Shooting Drill` fixture into a mirrored active/passive browser/debug lane: player 1 and player 2 now each have light-foot main/support pairs, both sides have additional mounted-bow and alternate-target reference units, and player-2 shooters are explicitly south-facing so the passive side can legally return fire toward player 1 during the same drill.
- Added focused drill coverage for the richer fixture and active/passive semantics: `src/data/shooting-drill-scenarios.test.js` now locks the mirrored layout and scenario description, while `src/state/p0-state.test.js` and `src/ui/p0-battlefield.test.js` now verify the round-relative handoff path and the richer two-sided shooting drill assumptions.
- Fresh validation for the richer active/passive drill passed: `npm test -- --test src/data/shooting-drill-scenarios.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js` passed, `npm run build` passed, and rebuilt browser smoke on the direct `Shooting Drill` confirmed a player-1 supported shot with visible priority line and zone overlay, `Pass` on the first selected shooter, the active-player-to-passive-player handoff popup, a player-2 supported return shot into player 1, and the final `Weiter mit Nahkampfphase` popup.
- Files touched for the rework: `src/state/p0-shooting.js`, `src/state/p0-shooting.test.js`, `src/ui/battlefield-command-panel.js`, `src/ui/p0-battlefield.js`, `src/ui/p0-battlefield.test.js`, `src/styles/p0-battlefield.css`, `P8_todo.md`, and `roadmap.md`.
- Files touched for the handoff follow-up: `src/state/p0-shooting.js`, `src/state/p0-round.js`, `src/state/p0-state.js`, `src/state/p0-state.test.js`, `src/ui/p0-app.js`, `src/ui/battlefield-dialogs.js`, `src/ui/battlefield-command-panel.js`, `src/ui/p0-battlefield.js`, `src/ui/p0-battlefield.test.js`, `P8_todo.md`, and `roadmap.md`.
- Files touched for the active/passive drill follow-up: `src/data/shooting-drill-scenarios.js`, `src/data/shooting-drill-scenarios.test.js`, `src/state/p0-state.js`, `src/state/p0-state.test.js`, `src/ui/p0-battlefield.test.js`, `P8_todo.md`, and `roadmap.md`.
- Reviewer focus for the rework: confirm phasing-player-selected shooting order, auto-vs-tied priority target handling, same-priority support enforcement, joint main/supporter completion, battlefield support projection honesty, popup-first resolution flow clarity, and the supported-zone-only overlay honesty boundary.
- Lead planning update after user UX feedback: P8-08 should not merely repair the existing command-panel flow. The remaining implementation inside this card now needs a slim choose-shooter rail, visible priority target marking, supported shooting-zone overlays, and a popup-first shot confirmation/resolution flow so the battlefield reads more like `Waehle Schuetzen -> Schiessen -> OK` and less like a dense left-side control stack.
- Next exact work inside this still-open card: Reviewer / Rules Agent should recheck the rule-sensitive guided-procedure, popup flow, and new end-of-sequence handoff behavior, then the user can perform manual acceptance on the direct `Shooting Drill` fixture.

### [ ] P8-09 - Source Example Validation And Closeout

Goal: close P8 by tying implemented behavior back to Rules-v2 shooting examples, validation results, and remaining source-risk backlog.

Status: in progress - the reviewer-recommended immediate coding packet `rv2-p58-line-of-sight-a` is now implemented and locally validated on 2026-05-28 as a dedicated source-backed shooting scenario. The current supported subset now has focused data, LoS, priority, reducer, UI, build, and browser-smoke coverage for the exact page 58 claim set, but broader P8 source-example closeout and final phase closeout review remain open.

Planned files:

- P8_todo.md
- roadmap.md
- RULEBOOK_EXAMPLES_todo.md
- docs/rules/shooting.md
- docs/rules/open-verification.md if any item is narrowed or resolved
- focused scenario/test files if source examples are implemented in P8

Implementation steps:
1. Revisit each p.56-p.59 source example and record final status: implemented fixture, tutorial/drill route, deferred reference, or out-of-scope.
2. Add or confirm golden fixtures for examples that the supported subset can reproduce honestly.
3. Run the full P8 validation set and record commands/results on this board.
4. Request Reviewer / Rules Agent closeout review for P8 rule honesty.
5. Update `roadmap.md` phase status and keep unresolved source-risk items open.
6. Stop for user manual acceptance with exact browser/test instructions.

Reviewer-recommended immediate coding packet: rv2-p58-line-of-sight-a

Goal:

- recreate the page 58 source example as a dedicated shooting scenario so the current supported LoS plus priority subset is checked against one exact book case instead of only synthetic drill layouts

Source lock:

- source image: docs/source/rules-v2-examples/rv2-p58-line-of-sight-a.png
- source text: docs/source/Rules_v2.md
- binding claims that the implementation must preserve:
- B blocks line of sight from A1 and A2 to C1
- C2 is in line of sight of A2
- D is the nearest target to A1 but is not directly in front
- B is directly in front of both bowmen and is closer to A2 than C2, so B is the priority target for both A1 and A2
- A1 and A2 can both shoot at B, with either unit allowed to be the main shooter and the other contributing support

Planned files:

- P8_todo.md
- src/data/shooting-drill-scenarios.js or a new dedicated source-example shooting scenario file if that keeps the exact-book layout cleaner
- focused tests in src/data/shooting-drill-scenarios.test.js or a sibling source-example test file
- focused engine tests in src/engine/shooting/line-of-sight.test.js
- focused engine tests in src/engine/shooting/target-priority.test.js
- UI/battlefield assertions in src/ui/p0-battlefield.test.js if the scenario is exposed through the drill/debug entrypoint

Implementation steps:

- create a dedicated source-backed scenario entry labeled with the exact example id rv2-p58-line-of-sight-a; keep the scenario roles visible in code and tests as A1, A2, B, C1, C2, D
- preserve the book-facing geometry, not a loose approximation: A1 and A2 are the bottom shooters, B sits between them and the upper targets, C1 and C2 are the upper targets, and D sits off-angle so it is nearest to A1 without being directly in front
- derive one canonical coordinate layout from the crop and keep it stable; if the image does not give exact measurements, document the chosen UD coordinates in code comments or scenario metadata and make sure every source claim above is mechanically testable
- add a LoS test proving A1 -> C1 blocked by B, A2 -> C1 blocked by B, and A2 -> C2 visible under the current unit-blocker subset
- add a priority test proving A1 still prioritizes B over nearer off-axis D, and A2 prioritizes B over visible C2
- add a support/declaration test proving that once B is selected, either A1 or A2 may be the main shooter and the other can support on the same target
- if the scenario is exposed in the browser drill flow, add a focused UI test or browser assertion that the scenario surfaces blocked C1, visible-but-non-priority C2 for A2, and support availability on B
- keep the implementation honest about the open seam in src/engine/shooting/target-priority.js: do not claim that this example closes the separate most in front tie-breaker wording, because that logic is still deferred when equal-priority ties remain

Non-goals:

- no new shooting functionality beyond closeout fixes
- no post-P8 melee/rout implementation
- no broad tutorial database UI unless separately approved
- no terrain, cover, ambush, special shooting-zone, or artillery extensions for this example
- no claim that page 58 is fully covered beyond the current supported subset of unit blockers, normal front shooting zones, and already-implemented support/declaration flow

Validation:

- npm test -- --test src/engine/shooting/line-of-sight.test.js src/engine/shooting/target-priority.test.js
- the focused scenario test file for the new source-backed example
- npm test -- --test src/ui/p0-battlefield.test.js if the scenario is rendered in the battlefield drill flow
- npm run build
- browser smoke if the scenario is exposed in the drill menu: verify B is the selectable or auto-selected target for both shooters, C1 stays blocked, C2 stays visible but non-priority for A2, and support on B works with either bowman as main shooter

Manual acceptance:

- user opens the dedicated p.58 scenario and visually compares it with docs/source/rules-v2-examples/rv2-p58-line-of-sight-a.png
- expected result: the on-screen unit roles and relations match the book example closely enough that the five source claims above are obvious without needing hidden test knowledge

Stop condition:

- stop if reproducing the book geometry reveals a contradiction in the current corner-to-target-edge LoS subset or in the current directly-in-front priority interpretation that cannot be fixed locally without re-opening source analysis

Expected result:

- the repo has one source-backed p.58 scenario and focused assertions for the exact LoS plus priority interaction already supported today, while still marking unsupported p.58-adjacent rule families honestly as deferred

Non-goals:

- no new shooting functionality beyond closeout fixes
- no post-P8 melee/rout implementation
- no broad tutorial database UI unless separately approved

Validation:

- focused P8 test suite
- `npm run build`
- browser smoke on the supported shooting flow if browser tooling is available
- source-example fixture checks for implemented examples

Logging / instrumentation expectations:

- verify logs for `shooting` and `ui` filters during browser smoke; no new logging unless closeout finds a gap

Role routing:

- Implementing role: Coding Agent / GPT-5.4 for validation/fixes, then Lead / Phase Steward / GPT-5.5 for closeout docs
- Required review: Reviewer / Rules Agent / GPT-5.4
- Lead gate: yes for final phase acceptance
- Data / Validation mode: optional if example metadata changes broadly

Manual acceptance:

- user runs or reviews the supported shooting flow and confirms P8 can close without implying tournament-complete shooting

Stop condition:

- stop if a source example exposes a rule contradiction or unsupported prerequisite that changes implemented legality

Expected result: P8 closes with implemented behavior, examples, validation, review, and remaining source risks all recorded honestly.



