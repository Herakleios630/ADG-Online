# Charge Phase Procedure Concept

Status: planning concept, not implementation-complete rules text.
Date: 2026-05-19
Scope owner: AdG-Rules-Engine-Agent

## Purpose

This document replans the remaining P7 charge flow around the official charge procedure sequence after the current P7 work already completed or partially front-loaded points 1 and 2.

The goal is to turn the remaining charge procedure into a clear game flow, reducer state machine, and implementation roadmap that can later be refined with the user in question/answer style before GPT-5.4 executes approved cards.

## Phase Split Decision 2026-05-20

User preference now supersedes the earlier mega-phase direction: basic evade and basic conformation should be implemented before P16, but P7 should not absorb all remaining charge-procedure complexity.

The approved planning direction is to insert two before-P8 follow-up phases:

- P7 closes as Charge Declaration + Target Reaction Gate.
- P7A implements basic Evade + Charge Movement Branches.
- P7B implements basic Conformation + Shifting Foundation.
- P8 Shooting starts only after P7B is accepted.

This split keeps official charge procedure order while limiting the active P7 board to a coherent deliverable. P7 freezes the declaration and reaction decision; P7A resolves the evade/follow-through branch; P7B resolves conformation enough for later melee.

Basic before-P16 does not mean tournament-complete. Group charges, point 7 partial group behavior, point 8 group continuation, full secondary-target recursion, terrain-complete evade/conformation, special troop exceptions, and advanced shifting chains remain explicit later work unless a future board pulls them forward.

## Source Basis Checked

Working source notes used for this concept:

- `docs/source/Rules_v2.md` for the scan-confirmed charge, evade, and conformation digest.
- `docs/rules/charge.md` and `docs/rules/conformation.md` for the current source-lock workspace notes that narrow engine-facing invariants and deferrals.
- `docs/rules/zoc.md` for most-threatening-enemy and ZoC constraints that control charge continuation and conformation.
- `docs/rules/open-verification.md` for the remaining narrowed errata-check and solver-boundary items.
- `Konzepte/Errata_ADG_V4_English.pdf` for charge, evade, and conformation clarifications.
- `Konzepte/merged.pdf` only as historical OCR helper context for how the earlier planning slice was derived.

Important source caveat:

- The working baseline is no longer broad OCR helper text. It now comes from the Rules-v2 scan-confirmed corpus plus the source-lock workspace notes. Remaining risk is concentrated in errata overlays, exact geometry predicates, and deferred special cases, which stay explicit in `docs/rules/open-verification.md`.

## P7A-00 Source-Lock Result

The first P7A documentation pass fixed the initial supported evade branch tightly enough for planning, and the later Rules-v2 source-lock pass now replaces the earlier OCR-era broad uncertainty with a narrower errata/special-case boundary.

Locked first supported subset:

- `may-evade`: evade-capable troops that are not currently mandatory, blocked, or forbidden to evade.
- `must-evade`: light infantry in open terrain charged by heavy troops, unless after conformation they would be in melee with light troops, elephants, or scythed chariots, or would be in a support position.
- `cannot-evade`: units outside evade-capable troop families, plus units engaged in melee or melee support; simple support remains the explicit exception.
- `blocked-evade`: after free initial reorientation, an enemy ZoC lies directly ahead, or a simple blocker less than `1 UD` ahead cannot be avoided inside the approved first-pass geometry.

Evade-capable troop families locked for the first pass:

- LI
- LH
- javelinmen
- cavalry with the rule-quoted bow/crossbow combination cases
- other cavalry, camelry, and light chariots without `Impact` or `Impetuous`

Locked adjusted-distance mapping from the Rules-v2 scan-confirmed pass:

- charge: `1-2 => movement -1 UD`, `3-4 => normal movement`, `5-6 => movement +1 UD`
- evade: `1-2 => movement -1 UD`, `3-4 => normal movement`, `5-6 => movement +1 UD`

Explicit first-pass deferrals kept outside this lock:

- full group evade and group continuation
- terrain-complete evade behavior
- complete interpenetration and obstacle-avoidance solver
- table-exit loss integration
- optional evade-direction wheel in the first movement slice
- light-troop free end half-turn
- full mounted exception completeness beyond explicit capability flags

P7A2 update, 2026-05-21: the user approved pulling optional evade-direction wheel, obstacle wheel, table exit, light-troop end half-turn, and after-evade phase hooks into the next evade-completion gate. The deferral list above describes the accepted P7A preview/follow-through slice, not the P7A2 implementation target.

Practical implementation consequence:

- P7A-01 may now replace drill-only reaction shortcuts with explicit capability data without reopening the basic reaction categories or die-distance mapping.

## RV2 Recalibration Note 2026-05-23

- Charge, evade, and conformation are no longer waiting on generic Rules-v2 readability. The current planning baseline comes from the RV2-04 source-lock work in `docs/source/Rules_v2.md`, `docs/rules/charge.md`, `docs/rules/conformation.md`, and `docs/rules/zoc.md`.
- RV2-05A now needs this concept file to stay aligned with that baseline so later P7A2/P7B execution cards do not carry stale OCR-era gate language.
- Remaining pre-implementation uncertainty is now specific: errata-sensitive edge cases, exact geometry predicates, optional terrain choices, and deferred group/special-unit branches.

## Current Implementation Position

Already implemented or mostly implemented in P7:

- Point 1, target and charge range: reducer-owned target candidates, raw range and path feasibility diagnostics, supported straight/slide/wheel path families.
- Point 2, direction of the charge: charge-start tools and frozen direction are implemented more deeply than the rule procedure point itself. Current UI lets the player choose target, no start manoeuvre, charge-start slide, or charge-start wheel.
- Early point 3 groundwork: `reactionRequests` and `reaction-pending` state exist, but the visible reaction UI is still only a helper/diagnostic message.
- Early point 4/5 groundwork: straight path, earliest contact, clipped guide, contact snapshots, and contact classification exist before final movement application.
- Early point 9 groundwork: contact side classification exists, including reducer-owned `rear-or-flank` side selection, but no conformation solver exists yet.

Conceptual correction needed now:

- The active player should explicitly confirm the final charge direction/start path before the target reaction gate opens. The opponent reacts to an announced direction, not to a still-dragging preview.

## Official Procedure Interpreted As Game Gates

The remaining implementation should be designed around gates, not one giant action.

### Gate A - Direction Confirmation

Rule procedure position: after point 2 and before point 3.

Player-facing goal:

- Active player confirms target, charge-start tool, slide/wheel values, frozen direction, projected path, and currently detected first contact.
- Once confirmed, this becomes the immutable declaration snapshot passed to the defender reaction gate.

State goal:

- Add a serializable `chargeDeclarationSnapshot` or equivalent field that freezes:
  - charger id and owner
  - initial target id(s)
  - target snapshot(s)
  - start pose before any charge-start tool
  - chosen start manoeuvre
  - final charge start pose
  - frozen direction
  - current legal path family
  - current path/contact preview
  - current contact classification and selected `rear-or-flank` side if relevant
  - command context snapshot

Recommended status names:

- `direction-confirming` after a legal target/start path is previewable.
- `reaction-pending` after active player confirms direction.

Why this matters:

- Multiplayer needs a clean handoff: active player has finished the declaration; defender is now making a reaction choice.
- Replay needs one atomic declaration action before defender input.
- UI dragging must not keep mutating the facts while the opponent decides.

### Gate B - Target Reaction

Rule procedure position: point 3.

Rules checked:

- The initial target may choose to evade if it is able to do so.
- Some troops must evade, notably LI in open terrain when contacted by heavy troops, unless after conformation they would be in melee with light troops, elephants, scythed chariots, or in a support position.
- Evading is not allowed for units engaged in melee or melee support, except a unit providing only simple support can evade.
- Evade can be blocked by enemy ZoC or by obstacles after the initial reorientation.

Player-facing target reaction categories:

- `cannot-evade`: no decision, show reason.
- `may-evade`: defender chooses yes/no.
- `must-evade`: show reason, confirm/continue, no real yes/no choice unless a future rules exception exists.
- `blocked-evade`: target could otherwise evade, but the evade move is blocked; show reason and continue as no-evade branch.
- `needs-source-check`: block final resolution until source uncertainty is resolved or an explicit debug override is used.

Hotseat/local UX:

- Open a modal after direction confirmation.
- Header: target reaction.
- Content: target unit, reaction type, reasons, and consequences.
- `may-evade`: buttons `Evade` and `Do not evade`.
- `must-evade`: button `Resolve mandatory evade`.
- `cannot-evade` or `blocked-evade`: button `Continue charge`.
- `needs-source-check`: button `Cancel charge preview` plus disabled/diagnostic resolution controls.

Multiplayer UX:

- Active player sees a waiting modal: opponent is resolving target reaction.
- Defending player receives the reaction modal.
- The active player should not be able to change direction or target while waiting.
- Only the final reaction result is returned to active player state.

Data model:

```js
ReactionGate = {
  id,
  status, // pending | resolved | blocked
  actingPlayerId,
  waitingPlayerId,
  declarationSnapshot,
  requests: ReactionRequest[],
  decisions: ReactionDecision[],
  diagnostics,
};

ReactionRequest = {
  targetUnitId,
  reactionType, // cannot-evade | may-evade | must-evade | blocked-evade | needs-source-check
  sourceStatus,
  contactSnapshot,
  pathSnapshot,
  reasons,
};

ReactionDecision = {
  targetUnitId,
  choice, // no-evade | evade | forced-evade | blocked-no-evade
  decidedByPlayerId,
  timestampOrSequence,
};
```

First-pass implementation policy:

- Implement the modal and state transitions before implementing full evade movement.
- For `Do not evade`, continue into the no-evade point 5 path.
- For `Evade`, enter an `evade-resolving` state with explicit source-gated steps rather than pretending the move is complete.

### Gate C - Evade Resolution

Rule procedure position: printed pages 47 to 49, used by point 3 and point 6.

Rules checked:

- Evade is a reaction movement to avoid combat and a unit can evade multiple times in a phase if necessary.
- Troops that can evade include LI, LH, javelinmen, some cavalry with bow/crossbow combinations, and other cavalry/camelry/light chariots without Impact or Impetuous.
- Initial reorientation is free:
  - charged on front: half-turn.
  - charged on flank: quarter-turn.
  - charged on rear: keep facing.
- Evade may be blocked by enemy ZoC after reorientation or by obstacle/friendly/enemy/impassable terrain less than 1 UD ahead that cannot be avoided by a slide of 1 UD or less.
- Evade direction may optionally wheel to exactly match the charge direction, but this costs evade distance.
- Evade distance is adjusted by a die roll: `1-2 => movement -1 UD`, `3-4 => normal movement`, `5-6 => movement +1 UD` in the current Rules-v2 scan-confirmed source-lock pass.
- During evade move, all enemy ZoCs are ignored.
- Evade move is straight up to maximum adjusted distance, with limited slide/wheel obstacle avoidance.
- Light troops may make an extra free half-turn at the end.
- Evaders cannot shoot after evading.
- If caught by a charging enemy, the evading unit loses one cohesion point unless the charger consists of light troops, and later fights as if attacked from the rear.
- A unit exiting the table while evading is lost.

Evade is large enough to be its own sub-engine.

Recommended data model:

```js
EvadePlan = {
  targetUnitId,
  cause, // charge-reaction | secondary-target | zoc-exit | pursuit
  initialContactSide,
  initialReorientation,
  blockedStatus,
  optionalDirectionWheel,
  adjustmentRoll,
  adjustedDistanceUd,
  pathSegments,
  obstacleAvoidanceSteps,
  finalPose,
  exitsTable,
  caughtByChargers,
  diagnostics,
};
```

Historical first-pass scope for accepted P7A:

- Do not implement full evade geometry yet unless the user explicitly approves it as a major sub-phase.
- First implement reaction choice and no-evade branch to point 5.
- Then implement a controlled evade sandbox for one isolated target with no obstacles, no interpenetration, no terrain, no table exit, and manual/deterministic dice input.
- Only after that expand to blocked evade, caught evaders, and secondary target chains.

P7A2 update, 2026-05-21 plus 2026-05-24 UX refinement: the user approved the evade-completion gate and later narrowed the player decision to the initial branch only. P7A2 should include the no-direction branch, optional direction wheel, obstacle wheel, table exit, light-troop end half-turn, cannot-shoot hooks, and repeated-evade hooks while still deferring interpenetration and group evade; once the initial branch is chosen, the solver should maximize legal distance automatically and keep the intermediate steps replayable/clickable for learning.

High-risk evade issues:

- Need exact troop data: Impact, Impetuous, Bow/Crossbow combinations, Javelinmen, LI/LH, mounted categories.
- Need terrain state for open, rough, difficult, penalizing in combat.
- Need obstacle/interpenetration engine reuse from movement.
- Need dice workflow and replay logging.
- Need table-exit and army-loss effects later in P10.
- Need LI destruction/caught behavior before full melee/rout exists.

### Gate D - Charge Movement Branch Resolution

Rule procedure position: point 4, but its outcome depends on points 5 to 7.

Important rule shape:

- The charge movement path is announced before reaction, but how far it actually continues depends on whether targets evade.
- The direction cannot be changed once the charge has started.
- Charge movement must comply with ZoC rules.
- At the beginning of the charge only, the unit/group can wheel or slide but not both. Quarter-turn/half-turn plus optional wheel without sliding also exists, but current P7 has deferred quarter/half-turn.

We should not treat point 4 as a single `apply full ghost` action.

Instead:

```js
ChargeMovementResolution = {
  branch, // no-initial-evade | all-initial-evade | partial-initial-evade
  declarationSnapshot,
  reactionDecisions,
  adjustedChargeDistanceRolls,
  maxChargeDistanceUd,
  minimumRequiredAdvanceUd,
  stopPolicy,
  pathSegments,
  contactEvents,
  secondaryTargetEvents,
  finalChargerPose,
  diagnostics,
};
```

### Branch 1 - Point 5: Initial Targets Do Not Evade

Rule procedure position: point 5.

Rule shape:

- All units that can do so must contact the enemy or move into support position.
- Other charging units that have not contacted may continue the charge under point 8.

Single-unit first interpretation:

- If the selected initial target does not evade, the existing clipped ghost can become the committed charge movement to contact.
- Then conformation gate opens.
- For one charging unit and one target, this is the cleanest first playable path.

Recommended MVP:

- Implement `no-evade` decision.
- Commit the charger from current pose to `contactSnapshot.chargerContactPose`.
- Mark the charge as awaiting conformation rather than applying combat.
- Preserve pre-contact and post-contact poses for replay.
- Do not move target except through conformation.
- If contact is blocked, show diagnostics and do not apply movement.

### Branch 2 - Point 6: All Initial Targets Evade

Rule procedure position: point 6.

Rule shape:

- Charging unit/group rolls 1D6 to adjust charge distance.
- Charge distance uses the same Rules-v2 scan-confirmed mapping as evade: `1-2 => movement -1 UD`, `3-4 => normal movement`, `5-6 => movement +1 UD`.
- Charging HI never reduces its charge distance.
- Groups with different movement allowances roll separately by sub-group.
- Units that increase distance may contact secondary targets not originally within charge range.
- Non-impetuous units should advance if possible at least 1 UD for foot or 2 UD for mounted, then may stop or continue to max adjusted distance.
- Impetuous units must continue to full adjusted charge distance.
- Stop if the unit meets an enemy unit, an enemy ZoC blocking movement, a friendly non-interpenetrable unit, or table edge.

Single-unit first interpretation:

- For one initial target, if it evades, point 6 is the primary evade branch.
- Before the adjusted charge distance roll in point 6, the evader's own evade movement must be resolved and committed as branch-authoritative state. A preview-only `EvadePlan` is not enough for conformation readiness.
- This branch needs both defender evade movement and attacker adjusted charge movement.

Recommended implementation order:

1. Add dice workflow and deterministic roll injection for tests/replay.
2. Add isolated single-target evade movement without obstacles.
3. Commit the resolved evader movement to canonical board state before adjusted charge distance.
4. Add adjusted charge distance and charger follow-through from the committed evader state.
5. Add non-impetuous stop/continue choice.
6. Add impetuous forced full movement.
7. Add caught-evader detection.
8. Add secondary target encounter and new reaction gate.
9. Add obstacles/interpenetration/table exit/LI destruction.

P7A completed an accepted preview/follow-through subset of steps 1, 2, 4, 7, and 8. P7A2 exists to close step 3 and the complete supported single-unit evade flow before P7B conformation starts, including the initial evade-branch choice, direction wheel, obstacle wheel, table exit, light-troop end half-turn, and after-evade phase hooks.

Do not implement group sub-rolls in first pass.

### Branch 3 - Point 7: Not All Targets Evade

Rule procedure position: point 7.

Rule shape:

- Units that can do so must contact the enemy.
- Units that do not contact must advance following point 6 rules except that movement allowance is not adjusted.

Single-unit first interpretation:

- Mostly out of scope until group or multi-initial-target charges exist.
- For one unit vs one target, the practical branch collapses to either point 5 or point 6.

First-pass policy:

- Represent this as a future branch in data, but do not implement group logic.
- If a future multi-target situation appears through secondary targets, treat each secondary target as its own reaction event rather than claiming point 7 completeness.

### Gate E - Continuing A Charge

Rule procedure position: point 8.

Rule shape:

- Units in a charging group that have not contacted an enemy and are not in support may continue up to maximum movement allowance.
- Continuing is optional for non-impetuous units.
- Continuing is mandatory for impetuous units if they can contact a new enemy or pursue evaders, unless uncontrolled-charge exceptions apply.
- Continuing can separate a charging group without changing CP cost.
- A charge stops on enemy unit, blocking enemy ZoC, penalizing combat terrain, friendly non-interpenetrable unit, or table edge.
- Secondary targets may evade if able; normal evade procedure applies, except the charging unit does not move beyond already determined max adjusted movement allowance.

First-pass policy:

- Defer group continuation.
- For single-unit, allow continuation only as a later extension of point 6 after an evaded initial target.
- Secondary target reaction should reuse the same reaction modal/state machine, but with `cause: secondary-target`.

High-risk issues:

- Impetuous and uncontrolled-charge exceptions are intertwined.
- Terrain penalizing in combat is not fully modeled.
- Secondary target chains can become recursive reaction/evade/continue loops.

### Gate F - Conformation

Rule procedure position: point 9.

Rule shape checked:

- All units that contacted enemy must conform after each charge.
- Conformation is a special movement aligning contacted units before combat.
- Conformation can happen even from corner contact.
- The most threatening enemy and ZoC dictate conformation.
- A melee or melee-support unit aligns front edge against enemy, front corner to front corner, or in flank/rear attacks front corner to enemy rear corner if needed.
- A unit must conform as fully as possible; otherwise incomplete conformation applies.
- Units do not have to enter terrain penalizing them in melee, but may choose to do so.
- Only phasing-player units conform.
- No CP cost and no movement allowance deduction.
- Conformation after charge is done first by sliding, then pivoting.
- If several units are in the ZoC of the same enemy, first entry into that ZoC matters.
- ZoCs and contact restrictions take precedence over obligation to conform.
- Shifting friendly units may be allowed to make space, using minimum number of units and minimum distance, priority rear then flank.
- Shifted non-light units cannot move/rally later in the movement phase.
- Incomplete conformation fallback rules choose front/rear/flank alternatives where possible and otherwise preserve temporary incomplete contact.
- Errata clarifies rear-corner conformation as complete in specific physically blocked flank-contact cases, but it does not let a unit avoid ZoC.

Conformation must be its own solver.

Recommended data model:

```js
ConformationPlan = {
  status, // pending | complete | incomplete | blocked | optional-choice | needs-source-check
  contactEventId,
  principalEnemyId,
  mostThreateningEnemyId,
  candidates: ConformationCandidate[],
  selectedCandidateId,
  shiftingPlan,
  optionalChoices,
  diagnostics,
};

ConformationCandidate = {
  id,
  contactSide,
  targetPose,
  targetAlignment,
  movementKind, // slide-then-pivot | pivot-only | incomplete | simple-support
  isComplete,
  requiresPenalizingTerrain,
  zocViolations,
  blockers,
  shiftsRequired,
  priorityScore,
  diagnostics,
};
```

Recommended first-pass scope:

- Single charger, single defender, no groups.
- No shifting in the first conformation slice unless a simple adjacent-friendly blocker test is explicitly selected.
- Generate candidates for front, flank, rear, and `rear-or-flank` chosen side.
- Validate battlefield bounds and obvious blockers.
- Return `complete`, `incomplete`, or `blocked` preview.
- Render pre-conform contact pose and post-conform ghost separately.

Later scope:

- Group conformation.
- Shifting priority and locks.
- Terrain optional choices.
- Already-in-contact cases.
- Support-position conformation.
- Column special conformation.
- War wagon/artillery/fortification/stakes special cases.

## Recommended Product Flow

### Singleplayer/Hotseat Flow

1. Active player selects charger.
2. Press `Charge`.
3. Select target.
4. Choose/preview charge-start direction tool.
5. Press `Richtung bestaetigen`.
6. Reaction modal opens:
   - no evade possible: continue.
   - may evade: defender chooses yes/no.
   - must evade: defender confirms mandatory evade.
   - blocked/needs-source-check: show reason.
7. If no evade, charge movement commits to contact.
8. Conformation preview opens.
9. Player confirms conformation or source-blocked issue remains visible.
10. Charge ends awaiting later melee phase.

### Multiplayer Flow

1. Active player completes steps 1 to 5.
2. Server/host freezes declaration snapshot.
3. Active player sees waiting modal.
4. Defender receives reaction modal.
5. Defender decision resolves reaction gate.
6. Active player receives updated battlefield and continues branch.

Privacy/fairness note:

- AI and multiplayer controllers must submit normal legal reaction decisions using only player-visible state.
- Hidden information must not leak through diagnostics shown to the active player.

## Immediate Next Implementation Slices

Replanning map:

- `P7-07A`, `P7-07B`, and the no-evade bridge remain P7 closeout work.
- The evade sandbox becomes P7A work.
- Minimal conformation preview becomes P7B work.

### P7-07A - Direction Confirm And Visible Reaction Modal

Goal:

- Make the current `reaction-pending` state visible and understandable.

Work:

- Add `CONFIRM_CHARGE_DIRECTION` or equivalent action.
- Change `SELECT_CHARGE_START_MANOEUVRE` from finalizing directly into reaction to preparing a direction-confirming state.
- Add reaction modal/callout in hotseat mode.
- Add active-player waiting copy placeholder for future multiplayer.
- Use current `chargeReactionProfile` in drill units.

Manual acceptance:

- In Charge Drill, choose target/start direction, press confirm, see reaction modal.
- Choosing `Do not evade` proceeds to no-evade branch placeholder or current contact-ready state.
- Choosing `Evade` enters explicit evade-pending/source-blocked state if full evade is not implemented yet.

### P7-07B - Reaction Decision State

Goal:

- Store defender decision as reducer-owned data.

Work:

- Add `ReactionDecision` objects.
- Add action `RESOLVE_CHARGE_REACTION`.
- Support `no-evade`, `evade`, `forced-evade`, `blocked-no-evade`.
- Keep replay-ready declaration and reaction snapshots.

### P7-05/P7-11 Bridge - No-Evade Commit

Goal:

- Make point 5 playable before full evade complexity.

Work:

- If reaction decision is no-evade, apply charger movement to contact pose.
- Preserve the target pose.
- Enter conformation-preview state rather than ending the whole charge.
- Do not apply combat.

### P7B-02/P7B-03 - Minimal Single-Unit Conformation Preview

Goal:

- Generate the first conformation candidate after no-evade contact.

Work:

- Front-contact complete conformation first.
- Then flank/rear/rear-or-flank chosen side.
- No shifting/group/terrain optional logic yet.

### P7A-03 - Evade Sandbox

Goal:

- Make an isolated single-target evade actually move.

Work:

- Single unit only.
- No obstacles, no interpenetration, no terrain, no table exit.
- Manual/deterministic adjustment roll.
- Initial reorientation and straight evade movement.
- Charger adjusted movement and caught/no-caught result.

P7A2 update, 2026-05-21: this work block describes the accepted P7A sandbox. The next evade-completion gate expands beyond it to include source-locked slide, wheel, table-exit, end-half-turn, and after-evade status handling.

## Deferred Work

Defer until after the first playable no-evade charge-to-conformation loop:

- Full group charges.
- Point 7 partial-evade group branch.
- Point 8 group continuation.
- Secondary target reaction chains.
- Full evade obstacle avoidance and interpenetration.
- Terrain effects and penalizing-terrain optional choices.
- LI destruction/caught interactions with full rout/cohesion pipeline.
- Impetuous/uncontrolled-charge full exception matrix.
- Complete shifting solver and post-shift locks.
- Multiplayer network transport beyond local state handoff design.

## Known Planning Problems

1. Direction confirmation is missing as a visible player commitment.
2. Reaction UI is currently too hidden: helper text is not enough.
3. Evade eligibility needs real unit ability data, not only `troopType` strings.
4. Exact charge/evade adjustment die tables need manual source confirmation.
5. The current contact classifier is useful but conformation may be governed by most-threatening enemy/ZOC, not only selected contact side.
6. Conformation requires path facts such as first ZoC entry order; current contact snapshots may need extra fields.
7. `rear-or-flank` side selection is a player/legal intent input, not proof that conformation is possible.
8. Secondary targets create nested reaction gates and must be designed as repeatable events.
9. Dice, choices, and pause points must be replay-ready before multiplayer or AI can be fair.

## Questions For The Next Q/A Refinement

1. Should P7 first finish a no-evade charge-to-conformation loop before any actual evade movement is implemented?
2. Should dice in P7 be manual input, automatic random, or deterministic debug choice first?
3. For hotseat, should the reaction modal hide active-player information and use a handoff screen, or is a simple popup enough for now?
4. Should `Evade` initially produce a source-blocked placeholder, or should we immediately implement the isolated no-obstacle evade sandbox?
5. Which unit data fields should be added before true evade eligibility: category, abilities, impetuous, impact, light/heavy, terrain status?
6. Should conformation be implemented before full evade so the normal no-evade branch becomes playable sooner?
7. For single-unit first, do we allow secondary target contact in P7, or do we stop with a diagnostic until point 8 is implemented?
8. How should UI represent three ghosts: declared path, evade path, and final charge/conformation path?
9. Which rule page images should be manually reviewed and transcribed into `docs/rules/charge.md` before implementation resumes?

## Recommended PM Decision

The best next slice is not full evade. P7 should first finish `P7-07A - Direction Confirm And Visible Reaction Modal`, `P7-07B - Reaction Decision State`, and a no-evade handoff that is explicit about P7A/P7B dependency.

After P7 closes, P7A should implement the basic evade/follow-through branch, then P7B should implement the minimal conformation preview and application foundation.

Reason:

- It matches the official procedure order.
- It fixes the current UX confusion immediately.
- It creates the multiplayer/hotseat pause boundary correctly.
- It gives us a clear charge declaration path before adding evade movement.
- It keeps evade and conformation as deliberate follow-up phases instead of letting either swallow the active P7 board.