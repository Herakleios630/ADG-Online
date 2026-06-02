# Melee Decision Matrix (Source-Closure Draft)

Status: draft
Owner: Rules Agent + Coding Agent
Board anchor: P9V2-MINI-12A
Last updated: 2026-05-31

## Purpose

This document defines lane-level decision ownership for the P9 melee matrix migration.
Each lane is explicitly tagged as:

- source-closed: implementable now with direct provenance
- source-open: not safe to close yet; must remain diagnostic

This draft is scoped to core lanes only and does not close special families.

## Source Baseline

Primary references used in this draft:

- Rules_v2 p.22
- Rules_v2 p.60-p.63
- docs/rules/melee.md
- docs/rules/errata.md
- docs/source/Rules_v2.md
- docs/rules/open-verification.md

## Lane Decisions

### L1 Base combat factor lookup (main unit)

- status: source-open (partial)
- decision:
  - source-closed bindings from p.22 may be implemented as deterministic lookup entries.
  - unresolved troop/profile lanes must remain source-open and cannot be guessed.
- owner: matrix base stage
- implementation note:
  - lookup must emit sourceStatus per binding.

### L2 Flank/rear to-zero branch (defender CF to zero)

- status: source-closed for baseline trigger, source-open for residual branch families
- decision:
  - baseline trigger is closed: defender CF can be reduced to zero when qualifying flank/rear conditions are met.
  - unresolved residual families remain source-open (see blockers).
- owner: branch lane (not UI-only)

### L3 Flank/rear additive arithmetic lane

- status: source-closed for MINI-12I supported subset; source-open outside that subset
- decision:
  - baseline additive lane is closed for the supported subset: a main unit situated on an enemy flank or rear gains a `+1` situation modifier even if conformation is incomplete.
  - additive application remains branch-owned and must stay deterministic, single-owner, and source-honest in multi-candidate lanes.
  - residual special families and unresolved edge combinations remain source-open until separately closed.
- owner: decision-matrix versioning gate

### L4 Multiple-attack immediate cohesion event

- status: source-closed for event-channel semantics
- decision:
  - must remain event-channel data, not combat-factor arithmetic.
  - trigger preconditions must be explicit and validated.
  - cap is one per defender per sequence or phase in this current contract.
- owner: immediate-event channel

### L5 Melee support value

- status: source-closed for current scope
- decision:
  - support contribution follows CF + 1 for qualifying melee support lanes.
  - support-value calculation is independent from ability/disorder/commander overlays.
- owner: support stage

### L6 Disorder in melee

- status: source-closed for current scope
- decision:
  - disorder is a flat penalty lane for main melee unit.
  - support lanes do not receive this disorder modifier directly.
- owner: situation/disorder stage

### L7 Commander engagement lane (current subset)

- status: source-closed for current subset, source-open for residual timing edges
- decision:
  - optional engagement in first-contact lanes is supported in current subset.
  - continuing-round lock behavior is supported where prior engagement is explicit.
  - unresolved attach/detach combat-lock timing edge cases remain source-open.
- owner: commander context lane + diagnostics

### L8 Engine to UI ledger parity

- status: source-closed requirement
- decision:
  - UI arithmetic must be rendered from engine ledger payload only.
  - no local UI math lane is allowed for totals.
- owner: state adapter + UI breakdown renderer

## Explicit Out Of Scope For This Draft

- camp or fortification or obstacle branch families
- war-wagon special handling
- full closeout of all p.22 residuals in one pass

These remain in separate board cards (P9V2-30 and P9V2-31).

## Open Blockers (Must Stay Source-Open)

### B1 Flank/rear additive lane closure

- why blocked:
  - resolved for the MINI-12I supported subset only.
  - residual edge families outside the supported subset still need explicit source confirmation and reviewer decision before additive closure can be claimed more broadly.
- affected lanes:
  - L3 outside the MINI-12I supported subset and any downstream broader final-sum expectations.

### B2 Residual p.22 binding completeness

- why blocked:
  - not all troop/profile combinations are closed yet in current working corpus.
- affected lanes:
  - L1 completeness and migration confidence for default switch.

### B3 Branch cancellation families and edge combinations

- why blocked:
  - residual cancellation-family wording and edge combinations still require source hardening.
- affected lanes:
  - L2 deterministic closure in all edge cases.

### B4 Commander timing edge cases

- why blocked:
  - attach/detach and continuing combat lock timing still has open-verification dependencies.
- affected lanes:
  - L7 full closure.

## Required Next Checks Before 12B/12C

1. Reviewer/Rules sign-off on L2/L3 interpretation boundary (to-zero branch vs additive lane).
2. Confirm which p.22 entries are source-closed and which stay diagnostic in first lookup slice.
3. Freeze blocker list into open-verification tracker before coding 12C.

## Implementation Constraints For Coding Cards

- Every matrix lane output must include value, sourceStatus, and explanation.
- Any unresolved lane must produce source-open diagnostics.
- Immediate cohesion events must never be merged into arithmetic modifier sums.
- Parallel-path feature flag (if used) must have explicit sunset criteria.
