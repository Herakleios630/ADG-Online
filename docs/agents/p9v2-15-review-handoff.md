# P9V2-15 Reviewer Handoff

Current card status: Implementation slice complete, pending Reviewer / Rules Agent decision
Current card: P9V2-15 - Unit Cohesion Account Spine + Marker UX
Next role: Reviewer / Rules Agent
Suggested model: GPT-5.4 (preferred); use GPT-5.5 only if source interpretation or Lead-gate triage needs deeper review
Expected output: Approved or Needs Changes or Blocked with concrete findings and exact coding todo

## Goal

Validate that the new P9-only shared cohesion account spine is source-backed, keeps event-channel separation intact, and drives battlefield markers from shared state instead of melee-local shortcut fields.

## Scope Under Review

- Profile-backed `maxCohesion` / `defaultCohesion` bindings come from the page 22 unit-characteristics table for the currently supported representative profiles.
- The melee apply path writes a shared per-unit `cohesionAccount` with:
  - `maxCohesion`
  - `remainingCohesion`
  - `status` (`good-order`, `disordered`, `routed-pending-removal`, `removed`)
  - pending/committed lane totals split by source
  - committed history entries for replay/debug visibility
- Pending marker UX is projected from unresolved-but-confirmed melee results before apply.
- Committed marker UX is projected from committed shared account state after apply.
- Multiple-attack immediate cohesion remains an event lane distinct from melee combat-result cohesion.
- No live P8 shooting runtime behavior was wired in this slice.
- No live P10 rout/pursuit runtime behavior was wired in this slice.

## Files Under Review

- src/data/unit-profiles.js
- src/data/unit-profiles.test.js
- src/state/p9-melee-v2.js
- src/state/p9-melee-v2.test.js
- src/state/p0-state-melee.test.js
- src/ui/melee-v2-adapter.js
- src/ui/p0-battlefield.js
- src/ui/p0-battlefield.test.js
- src/styles/p0-battlefield.css
- src/ui/p0-app.test.js
- P9_v2_todo.md

## Source Packet

- `docs/source/Rules_v2.md`
  - `rv2.unit-status-and-orientation`
  - `rv2.troop-attributes`
- `docs/source/rules-v2-examples/rv2-p22-unit-characteristics-tables-a.png`
- `docs/rules/melee.md`
- `docs/rules/melee-decision-matrix.md` (especially L4 immediate-event separation)
- `docs/rules/shooting.md`
- `docs/rules/rout-and-pursuit.md`

## Implementation Notes

- Source-backed profile cohesion bindings added for the current representative troop profiles:
  - `light-infantry = 2`
  - `light-infantry-javelin = 3`
  - `medium-infantry = 3`
  - `medium-infantry-swordsmen = 3`
  - `heavy-infantry = 4`
  - `heavy-infantry-spearmen = 4`
  - `cavalry = 3`
  - `medium-cavalry-impetuous = 3`
  - `heavy-cavalry-impact = 3`
  - `cavalry-bow = 2` via existing repo classification of that representative as `light-cavalry`
  - `pike = 4`
  - `elephant = 3`
- Commanders remain intentionally unbound for `defaultCohesion` in this slice.
- Non-profile battlefield fixtures are ignored by the marker projection helper instead of throwing.
- Legacy `meleeCohesionLossTotal` / `meleeRouted` are still written for compatibility, but battlefield marker rendering now reads shared account state.

## Focused Tests

- `profile-backed cohesion defaults stay source-bound to the p22 representative rows`
- `unit max cohesion prefers explicit instance data and otherwise falls back to the shared profile default`
- `p9v2-15 shared cohesion marker state tracks pending losses before apply and committed losses after apply`
- `apply melee batch writes shared cohesion accounts onto affected units`
- `battlefield renders pending outline markers before apply and committed filled markers after apply from the shared cohesion account`

## Last Validation

- `node --test src/data/unit-profiles.test.js src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js src/ui/p0-app.test.js src/ui/p0-battlefield.test.js`
- Result: pass `174/174`

## Reviewer Checklist

- Confirm the page 22 cohesion bindings match the representative runtime profiles now using them.
- Confirm `cavalry-bow = 2` is acceptable for this representative because the repo already classifies it as `light-cavalry` in charge/evasion/shooting support.
- Confirm commanders staying unbound is acceptable for this slice and does not create a hidden closure claim.
- Confirm multiple-attack immediate cohesion still remains event-only and is not folded back into arithmetic modifier lanes.
- Confirm pending markers are driven by pending batch projection and committed markers by committed shared account state.
- Confirm no P8 or P10 runtime logic was silently introduced under the shared account umbrella.
- Confirm compatibility retention of `meleeCohesionLossTotal` / `meleeRouted` is acceptable for this slice or call out removal if it should now happen.
- Confirm the card should remain open pending the stated Lead gate because `rally.test-thresholds-and-post-rally-locks` and `army-cohesion.loss-accounting-and-simultaneous-rout` are still unresolved.

## If Decision Is Needs Changes

Return:

1. Severity-ordered findings with file path and exact issue.
2. Rule/source basis for each finding.
3. Exact next coding todo limited to the same P9-only cohesion-account slice.