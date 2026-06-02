# P9 Melee V2 External AI Handoff (2026-05-31)

Status: Needs Source Check
Scope owner: P9 melee active board in P9_v2_todo.md
Legacy note: P9_todo.md is frozen as historical V1 documentation.

## 1) Purpose of this handoff

This handoff is for an external AI that should quickly understand:

- where current melee-v2 problems are,
- what has already been tried,
- what is stable right now,
- and what the next planning and implementation slices are.

The external AI must not treat this as tournament-complete melee coverage.

## 2) Current problem focus

Primary mismatch seen in recent review and user feedback:

- Expectation mismatch around flank or rear handling:
  - user expectation: flank attack should add a numeric +1 modifier in visible arithmetic,
  - current Decision Matrix v1 mini-slice contract: flank or rear stage is non-additive in arithmetic ledger and represented as stage marker 0, while to-zero impact is represented through base-stage derivation.

Current unresolved point:

- This is currently a design-contract mismatch, not a red-test mismatch.
- Tests are green for the current matrix contract, but interpretation agreement on additive flank or rear handling is still open for future matrix versioning.

## 3) Source and contract baseline

Working source anchors used in this slice:

- docs/rules/melee.md
- docs/rules/open-verification.md
- docs/rules/errata.md
- docs/source/Rules_v2.md
- scanned page references noted in P9_v2_todo.md for p.27, p.60, p.61, p.63

Current arithmetic contract (Decision Matrix v1 mini-slice):

- stage keys per side: base, support, flankRear, disorder, die, final
- flankRear stage is hard non-additive marker 0 in this mini-slice
- flank or rear to-zero branch effect is represented in base stage
- support uses CF + 1 for melee-support contributors
- disorder is flat -1 for main melee unit only
- multiple-attack immediate cohesion is event-channel data, not arithmetic addend

## 4) What has been tried so far

V1 to V2 migration and hardening attempts already completed:

1. V2 runtime path activation
- V2 state and engine path was wired into active reducer and UI flow.
- Legacy V1 path is retained as documentation and historical reference.

2. Contact and branch source-honesty work
- flank or rear and cancellation-family handling moved to evidence-first branch logic.
- unresolved branch families remain explicit source-open instead of silent closure.

3. Stage-ledger hardening (MINI-11A)
- explicit stage ledger contract added with invariant checks.
- non-ledger residual modifier diagnostics exposed to prevent hidden arithmetic lanes.

4. Arithmetic parity locks
- MINI-11B: pair 11 versus 12 parity under identical participants and dice.
- MINI-11C: pair 15 pending versus pair 16 committed parity (lifecycle changes allowed, arithmetic drift forbidden).

5. Cohesion-channel split
- payload channels separated so immediate multiple-attack cohesion is independent from combat-result cohesion and from numeric arithmetic ledger.

## 5) Current stable state

Functional state now considered stable for this slice:

- Focused V2 regression suite is green for the relevant parity and lifecycle checks.
- Pending versus committed arithmetic parity for MINI-11C is covered in both state and reducer-flow tests.
- Source-open diagnostics are still explicit where evidence is unresolved.

Recent focused validation evidence:

- node --test src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js
- result observed in-session: 53 passed, 0 failed

Repository status at handoff creation:

- branch: feature/p8-09-closeout
- commit pushed: aaee37b
- PR opened: https://github.com/Herakleios630/ADG-Online/pull/10

## 6) Active risks and open questions

1. Rule-interpretation risk (high)
- additive flank or rear expectation versus current matrix-v1 non-additive stage design remains unresolved.
- requires explicit source decision before changing arithmetic contract.

2. Scope drift risk (medium)
- many Wave C to E cards remain open; arithmetic contract changes now could invalidate recent parity tests.

3. Source-status transparency risk (medium)
- unresolved lanes must remain clearly source-open in both model and UI.

4. Regression coupling risk (medium)
- adapter or helper export regressions can break broad suites quickly; keep changes tightly scoped and test-first.

## 7) Current planning state

Execution source of truth:

- roadmap.md
- P9_v2_todo.md

Important open cards after MINI-11C:

- P9V2-MINI-11D: Cohesion event channel hard split closeout (no numeric coupling)
- P9V2-15: cohesion marker pending versus committed UX
- P9V2-20 to P9V2-24: start-end popups, battlefield-first loop, handoff flow, browser smoke, first playable UX lock
- P9V2-30 and P9V2-31: special families (camp, fortification, obstacle, war-wagon)
- P9V2-40: examples and closeout packet

## 8) External AI task request

Please perform an independent review of the current P9 melee-v2 state with emphasis on:

1. whether current Decision Matrix v1 implementation is internally consistent,
2. whether flank or rear handling should remain non-additive in this mini-slice or be escalated to a matrix-version update,
3. whether cohesion event channels are fully separated from arithmetic payloads,
4. whether pending versus committed lifecycle transitions can still cause hidden recomputation drift.

Required output format:

- Approved, Needs Changes, or Blocked
- file-level findings ordered by severity
- exact coding todo for the next single implementation slice

## 9) Recommended next role handoff

Next role: Reviewer or Rules Agent
Suggested model: GPT-5.5 for deeper source-risk triage, GPT-5.4 acceptable for standard independent review
Exact task: validate melee-v2 Decision Matrix v1 contract consistency versus source interpretation, especially flank or rear additive expectation gap
Expected output: Approved, Needs Changes, or Blocked with concrete file-level findings and one exact next coding todo