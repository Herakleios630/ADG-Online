# P9V2-MINI-11D + MINI-12A Reviewer Handoff

Current packet status: Ready for independent review
Scope: MINI-11D implementation verdict + MINI-12A source-closure decision draft verdict
Next role: Reviewer / Rules Agent
Suggested model: GPT-5.5 for source-risk depth, GPT-5.4 acceptable for standard review
Expected output: Approved or Needs Changes or Blocked with severity-ordered findings in Rule Guardian format, explicit current-card status, and one exact next coding todo

## Required Reviewer Output Format

Use this exact structure:

```markdown
Rule Guardian Review

Status: Approved | Needs Changes | Blocked

Findings:
- Severity: High | Medium | Low
  Area: ...
  Issue: ...
  Rule basis: ...
  Required correction: ...

Open Verification:
- ...

Current Card Status After Review:
- MINI-11D: Done | Needs follow-up | Blocked
- MINI-12A: Done | Needs follow-up | Blocked

Next Coding Todo:
- One exact, scoped card-sized implementation step
```

## Review Scope A - MINI-11D (Implemented)

Goal under review:
- enforce hard separation of immediate cohesion events from arithmetic combat-factor lanes.

Files under review:
- src/engine/melee-v2/resolution.js
- src/state/p9-melee-v2.js
- src/state/p9-melee-v2.test.js
- P9_v2_todo.md

Expected contract:
1. Immediate multiple-attack cohesion is event-channel only, not arithmetic stage math.
2. Immediate event applies only if both preconditions are true:
   - defenderAlreadyInMeleeOrSupport
   - newQualifyingFlankRearContact
3. One-per-defender cap is enforced per sequence or phase.
4. No legacy aggregated cohesion lane is reintroduced.
5. Event-channel enforcement diagnostics are visible in reducer diagnostics.

Focused regressions to verify:
- p9v2-mini-11A batch application plan separates multiple-attack and combat-result cohesion channels
- p9v2-mini-11D batch plan enforces immediate-event precondition and keeps arithmetic decoupled
- p9v2-mini-11D batch plan enforces one-per-defender cap for immediate events

Last focused validation:
- node --test src/state/p9-melee-v2.test.js src/engine/melee/resolution.test.js
- Result: 72 passed, 0 failed

Reviewer checklist for MINI-11D:
- Confirm precondition gate blocks invalid immediate events.
- Confirm cap enforcement cannot overflow above configured cap.
- Confirm stage-ledger totals are unchanged by event-channel data.
- Confirm diagnostics are explicit and not silently swallowed.

## Review Scope B - MINI-12A (Prepared Source-Decision Draft)

Goal under review:
- validate lane-level source-closure decisions before 12B implementation begins.

Files under review:
- docs/rules/melee-decision-matrix.md
- docs/rules/open-verification.md
- P9_v2_todo.md

Mandatory source cross-check before approval:
- docs/rules/melee.md
- docs/rules/errata.md
- docs/source/Rules_v2.md

Expected contract:
1. Each core lane is explicitly tagged source-closed or source-open.
2. Flank/rear additive lane remains source-open unless reviewer can source-close it.
3. Base CF binding closure is partial and residual unresolved p.22 lanes stay explicit.
4. Cancellation-family edge combinations remain explicit blockers where unresolved.
5. Commander timing edge cases remain source-open where not source-locked.

Lane-level decisions to verify in draft:
- L1 Base combat factor lookup (main unit): source-open (partial)
- L2 Flank/rear to-zero branch: baseline source-closed, residual source-open
- L3 Flank/rear additive arithmetic lane: source-open
- L4 Multiple-attack immediate cohesion event: source-closed event channel
- L5 Melee support value: source-closed in current scope
- L6 Disorder lane: source-closed in current scope
- L7 Commander engagement lane: subset source-closed, edge timing source-open
- L8 Engine-UI ledger parity: mandatory source-closed requirement

Known blockers carried in draft:
- B1 Flank/rear additive-lane closure
- B2 Residual p.22 binding completeness
- B3 Branch cancellation-family edge combinations
- B4 Commander timing edge cases

Reviewer checklist for MINI-12A:
- Confirm lane tags are source-honest and not over-claimed.
- Confirm blockers are concrete and implementation-relevant.
- Confirm 12A is sufficient as gate for 12B start.
- Confirm no Wave-D special-family scope leaked into 12A closure.

## Decision Guidance

Return one combined verdict for the packet, but findings must identify whether issue belongs to:
- MINI-11D implementation
- MINI-12A decision draft
- both

If status is Needs Changes or Blocked:
- include one exact next coding todo only (single card-sized slice, no scope expansion).

If status is Approved:
- state approval scope explicitly as:
  - MINI-11D implementation approval scope
  - MINI-12A decision-draft approval scope
- list residual source-open risks that remain intentionally unresolved.
