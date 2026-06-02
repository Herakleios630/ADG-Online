# P9-03O Reviewer Handoff

Current card status: Implementation slice complete, pending Reviewer / Rules Agent decision
Current card: P9-03O - Flank/Rear Deterministic Branches And Cancellations
Next role: Reviewer / Rules Agent
Suggested model: GPT-5.4 (preferred); recommend GPT-5.5 only if source or errata interpretation remains ambiguous
Expected output: Approved or Needs Changes or Blocked with concrete findings and exact coding todo

## Goal

Validate that P9-03O implements evidence-first flank/rear branching, source-closed to-zero gating, and branch-owned cancellation behavior without silently closing unresolved families.

## Required Reviewer Output Format

Use this exact structure:

```markdown
Rule Guardian Review

Status: Approved | Needs Changes | Blocked

Findings:
- Severity: High | Medium | Low
  Area: conformation | movement | ZOC | command | charge | setup | UI | tests | source-status
  Issue: ...
  Rule basis: ...
  Required correction: ...

Open Verification:
- ...
```

## Rule Anchors

- docs/rules/melee.md (`P9-03TF Melee Factor Rules Freeze`, flank/rear baseline and cancellation baseline)
- docs/rules/open-verification.md ID: melee.main-unit-support-multiple-attack-and-modifiers
- docs/rules/errata.md (flank/rear and cancellation wording cross-check where applicable)

## Scope Under Review (must be true)

- Flank/rear branch context is derived from contact/conformation evidence in state, not from UI-only flags.
- Defender combat-factor-to-0 branch applies only when preconditions are source-closed (contact type, conformation, formed non-light proof).
- Formed-troop proof is explicit and guarded (`formedTroop`, formation fields, profile-base fallback) and stays source-open when unresolved.
- Cancellation behavior is branch-owned and family/contact-type matched (`rear-contact-formed` with rear, `flank-contact-formed` with flank).
- Unknown/unresolved cancellation families remain source-open diagnostics and do not silently suppress flank/rear +1.
- Attached commander selection path resolves to host main unit for branch troop-class derivation (no commander-profile leakage).

## Out Of Scope (must remain unclosed in this card)

- Camp/fortification/obstacle/war-wagon special families.
- Full modifier/protection family closure beyond the P9-03TF frozen baseline.
- New commander lifecycle or detach-lock enforcement cards.

## Evidence Pack

### Focused resolver and state tests

- src/engine/melee/resolution.test.js
  - P9-03O applies source-closed flank/rear defender-factor-to-zero branch deterministically
  - P9-03O keeps unresolved flank/rear to-zero branch source-open instead of silently applying it
  - P9-03O branch cancellation can suppress generic flank/rear +1 situation bonus
  - P9-03O keeps cancellation branch source-open when cancellation family is unresolved
  - P9-03O keeps cancellation source-open when family does not match attack contact type
- src/state/p9-melee.test.js
  - P9-03O derives flank branch context from contact evidence into draft modifier context
  - P9-03O keeps rear-or-flank ambiguity as source-open branch diagnostic in draft context
  - P9-03O keeps to-zero branch source-open when conformation evidence is incomplete
  - P9-03O keeps to-zero branch source-open for light troop attackers even with explicit eligibility flag
  - P9-03O blocks to-zero for non-light attackers when formed-troop evidence is explicitly unformed
  - P9-03O blocks to-zero when formed-troop evidence is unknown and keeps branch source-open
  - P9-03O infers formed cancellation family from source-closed rear contact evidence
  - P9-03O keeps cancellation family source-open when conformation evidence is incomplete
  - P9-03O keeps cancellation family source-open when formed proof is unknown
  - P9-03O attached commander selection keeps host-unit flank branch troop class (no commander profile leakage)
- src/data/melee-drill-scenarios.test.js
  - commander fixture uses dedicated UNIT_PROFILE_IDS.COMMANDER and is neither LI nor cavalry

### Last focused runs

- node --test src/data/melee-drill-scenarios.test.js src/state/p9-melee.test.js src/engine/melee/resolution.test.js
- Result: pass 69/69
- node --test src/data/charge-drill-scenarios.test.js src/data/unit-profiles.test.js
- Result: pass 15/15

## Reviewer Decision Checklist

- Confirm branch preconditions are evidence-first and source-status honest.
- Confirm to-zero never closes when formed/conformation/contact evidence is unresolved.
- Confirm cancellation matrix does not suppress +1 on family/contact mismatch.
- Confirm attached commander path cannot leak commander profile into flank/rear troop-class logic.
- Confirm unresolved lanes stay source-open and routed through diagnostics.

## If Decision Is Needs Changes

Return:

1. Severity-ordered findings with file path and exact issue.
2. Rule basis for each finding.
3. Exact coding todo for the Coding Agent (single next slice, no scope expansion).

## If Decision Is Approved

Return:

1. Approval statement scoped explicitly to P9-03O branch/cancellation hardening slice only.
2. Residual risks that remain source-open.
3. Next exact implementation todo recommendation for Coding Agent.
