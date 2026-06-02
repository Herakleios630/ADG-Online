# P9V2-MINI-12I Reviewer Handoff

Current card status: Implementation slice complete, pending Reviewer / Rules Agent decision
Current card: P9V2-MINI-12I - Flank/Rear Additive Bonus Re-open (Case 1 + Multi-Flank)
Next role: Reviewer / Rules Agent
Suggested model: GPT-5.4 (preferred); use GPT-5.5 only if source interpretation needs deeper triage
Expected output: Approved or Needs Changes or Blocked with concrete findings and exact coding todo

## Goal

Validate that source-closed flank/rear lanes now apply a deterministic additive attacker situation bonus (+1 baseline) while preserving branch ownership, defender-to-zero handling, cancellation semantics, and source-open honesty.

## Scope Under Review

- Additive attacker flank/rear bonus is emitted only for source-closed, non-cancelled branch lanes.
- Branch/to-zero behavior remains explicit and non-cumulative for defender combat-factor-to-zero application.
- Multi-candidate flank/rear cases apply a single deterministic owner lane for additive bonus arithmetic.
- Matrix-core lane payload and resolver/state branch payload carry aligned additive branch values.
- Case 1 UI recap parity reflects support + flank additive semantics without hiding source-open seam diagnostics.

## Files Under Review

- src/engine/melee-v2/modifier-pipeline.js
- src/engine/melee-v2/combat-matrix-v2.js
- src/engine/melee/resolution.js
- src/state/p9-melee-v2.js
- src/data/melee-drill-scenarios.js
- src/state/p9-melee-v2.test.js
- src/engine/melee/resolution.test.js
- src/ui/p0-app.test.js
- P9_v2_todo.md

## Focused Tests

- P9V2-MINI-12I applies source-closed flank/rear attacker situation bonus additively
- p9v2-mini-12I case2 applies a single additive flank bonus despite multiple branch candidates
- melee case1 pre-roll modifier sum matches post-roll factor recap modifier sum
- P9V2-MINI-12G source-closed gold rows match exact stage-ledger and result values

## Last Validation

- node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js src/ui/p0-app.test.js src/data/melee-drill-scenarios.test.js
- Result: pass 122/122

## Runtime Checkpoint Evidence

- Case 1 melee dialog: attacker bonuses show `Simple support bonus: +1` and `Melee support bonus (combat factor +1): +2`, with no visible attacker-side `Flank or rear situation bonus` row in the main-pair dialog; `Modifier sum: +3`.
- Case 2 melee dialog: branch candidates list includes multiple candidates, while attacker bonuses show three `Melee support bonus (combat factor +1): +2` rows and no visible attacker-side `Flank or rear situation bonus` row in the main-pair dialog; `Modifier sum: +6`.

Fresh browser checkpoint recapture is still pending after this alignment slice.

## Reviewer Checklist

- Confirm additive branch value is never applied on source-open lanes.
- Confirm cancellation family path suppresses additive flank bonus only when cancellation is source-closed and matching.
- Confirm no double-application in multi-candidate branch scenarios.
- Confirm the main-pair dialog currently exposes branch ownership metadata without a visible attacker-side additive situation row for Case 1 and Case 2, and that packet text matches that runtime surface.
- Confirm stage-ledger invariants remain intentional: residual situation lanes affect resolved differential but do not mutate ledger stage-sum semantics.

## If Decision Is Needs Changes

Return:

1. Severity-ordered findings with file path and exact issue.
2. Rule/source basis for each finding.
3. Exact next coding todo (single card slice, no scope expansion).
