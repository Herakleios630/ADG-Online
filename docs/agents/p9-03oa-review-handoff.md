# P9-03OA Reviewer Handoff

Current card status: Implementation slice complete, pending Reviewer / Rules Agent decision
Current card: P9-03OA - Movement-Phase Flank Trigger Bridge (to-zero + immediate cohesion handoff)
Next role: Reviewer / Rules Agent
Suggested model: GPT-5.4 (preferred); recommend GPT-5.5 only if source or errata interpretation remains ambiguous
Expected output: Approved or Needs Changes or Blocked with concrete findings and exact coding todo

## Goal

Validate that movement/conformation trigger ownership is bridged into melee with strict source-status honesty, deterministic to-zero gating, cancellation-family anchoring, and explicit immediate multiple-attack trigger ingestion.

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

- docs/rules/melee.md (flank/rear factor flow, cancellation behavior, and immediate-effect wording checks)
- docs/rules/command.md (engagement context dependencies when needed)
- docs/rules/open-verification.md ID: melee.main-unit-support-multiple-attack-and-modifiers
- docs/rules/errata.md (cross-check any flank/rear or immediate-trigger clarifications)

## Scope Under Review (must be true)

- Conformation candidates emit explicit `meleeTriggerBridge` metadata for flank/rear contact ownership.
- Applied conformation metadata preserves bridge fields into state handoff.
- Melee branch ingestion uses bridge metadata first and keeps unresolved lanes source-open (never silent closure).
- To-zero branch requires source-closed preconditions including defender front-engagement when required by bridge payload.
- Cancellation family remains source-anchored (`flank-contact-formed` / `rear-contact-formed`) and unresolved families remain source-open.
- Immediate multiple-attack effect can be sourced from verified trigger object payloads, without deriving from queue multiplicity alone.

## Out Of Scope (must remain unclosed in this card)

- Full closure of `melee.main-unit-support-multiple-attack-and-modifiers` source wording.
- New rout/pursuit behavior.
- Broad resolver math redesign unrelated to trigger ingestion.

## Evidence Pack

### Producer and contract tests

- src/engine/conformation/candidates.test.js
  - flank candidate emits movement trigger bridge fields
  - rear candidate emits rear-specific bridge family hint
- src/engine/conformation/model.test.js
  - candidate model serializes bridge metadata deterministically

### Consumer and drill tests

- src/state/p9-melee.test.js
  - P9-03OA requires source-closed front engagement before to-zero closes from movement bridge evidence
  - P9-03OA drill acceptance indices 14, 19, 20, 21, 8 enforce expected to-zero outcomes
  - P9-03OA resolves immediate multiple-attack effect from verified trigger objects
- src/data/melee-drill-scenarios.test.js
  - P9-03OA drill acceptance units include movement/conformation trigger bridge metadata

### Last focused runs

- node --test src/engine/conformation/candidates.test.js src/engine/conformation/model.test.js
- Result: pass 17/17
- node --test src/state/p9-melee.test.js src/state/p0-state-melee.test.js src/data/melee-drill-scenarios.test.js
- Result: pass 53/53

## Reviewer Decision Checklist

- Confirm bridge payload ownership and source-status handling match rules intent.
- Confirm to-zero never closes when front-engagement gate is required but not source-closed.
- Confirm acceptance lane behavior for drill indices 14/19/20/21/8 matches card requirements.
- Confirm immediate trigger object ingestion does not bypass source-open safeguards.
- Confirm unresolved families still surface deterministic diagnostics.

## If Decision Is Needs Changes

Return:

1. Severity-ordered findings with file path and exact issue.
2. Rule basis for each finding.
3. Exact coding todo for the Coding Agent (single next slice, no scope expansion).

## If Decision Is Approved

Return:

1. Approval statement scoped explicitly to P9-03OA bridge slice only.
2. Residual source-open risks.
3. Next exact implementation todo recommendation for Coding Agent.
