# P9-03N Reviewer Handoff

Current card status: Implementation complete, pending Reviewer / Rules Agent decision
Current card: P9-03N - Commander Engagement Wiring (Errata-Conform)
Next role: Reviewer / Rules Agent
Suggested model: GPT-5.4 (preferred); recommend GPT-5.5 only if source or errata interpretation remains ambiguous
Expected output: Approved or Needs Changes or Blocked with concrete findings and exact coding todo

## Goal

Validate that P9-03N is closed only for engagement wiring and errata boundary behavior, without silently claiming commander persistence or detach/combat-lock timing closure.

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

- docs/rules/errata.md (commander engaged-in-combat narrowing)
- docs/rules/melee.md (attached/included/support-only commander distinction)
- docs/rules/melee.md (first-contact vs continuing baseline)
- docs/rules/open-verification.md ID: command.commander-attach-detach-legality
- docs/rules/open-verification.md ID: command.commander-detach-combat-lock-timing

## Scope Under Review (must be true)

- Commander contribution is derived from canonical state (attached/included/support-only) in melee draft/resolution flow.
- Errata boundary is enforced: support-only commander does not grant main-unit engaged commander bonus.
- Commander token lookup/status behavior resolves through attached host where applicable.

## Out Of Scope (must remain unclosed in this card)

- Mandatory round-to-round commander lock enforcement.
- Persistence timing closure across later melee rounds.
- Detach/combat-lock timing closure.

## Evidence Pack

### Focused tests for derivation and boundary

- src/state/p9-melee.test.js
  - P9-03N derives included commander participation from main-unit state
  - P9-03N keeps melee-support commander as support-only and excludes main-unit commander bonus
  - P9-03N resolves attached commander selection to the host melee entry in drill lane
  - P9-03N reports attached commander drill token with host melee status
- src/engine/melee/resolution.test.js
  - P9-03N applies attached/included commander bonus and excludes support-only commander state

### Last focused run

- node --test src/state/p9-melee.test.js src/engine/melee/resolution.test.js
- Result: pass 39/39

## Reviewer Decision Checklist

- Confirm no persistence-enforcement claim is made in P9-03N card text or evidence.
- Confirm source-honesty: detach/combat-lock timing remains open and deferred.
- Confirm reviewer routing requirement is preserved for any detach/combat-lock wording ambiguity before enforcement.
- Confirm optional commander-factor overview visibility has not been promoted to mandatory behavior.

## If Decision Is Needs Changes

Return:

1. Severity-ordered findings with file path and exact issue.
2. Rule basis for each finding.
3. Exact coding todo for the Coding Agent (single next card/slice, no scope expansion).

## If Decision Is Approved

Return:

1. Approval statement scoped explicitly to engagement wiring plus errata boundary only.
2. Residual risks: persistence/detach lock timing still open and owned by P9-03V plus open-verification IDs.
3. Next exact implementation todo recommendation for Coding Agent.
