### [ ] P9V2-MINI-12 - Combat Decision Matrix V2 Controlled Migration And Source-Locked Adoption

Goal:
- migrate from Decision Matrix v1 mini-slice to a controlled Decision Matrix v2 path without big-bang regressions, while keeping source-honesty and ledger transparency.

Problem statement:
- current v1 mini-slice is test-stable but still has an interpretation mismatch on flank/rear arithmetic expectations.
- base combat-factor and modifier closure still has residual source-risk lanes.
- broad wave-C through wave-E work remains open, so uncontrolled matrix rewrite would increase regression risk.

Scope contract:
- MINI-12 covers core matrix migration only (base CF, flank/rear branch semantics, modifier pipeline, engine/UI ledger parity, controlled rollout).
- special families remain out of MINI-12 scope and stay in existing cards:
  - `P9V2-30` camp/fortification/obstacle
  - `P9V2-31` war-wagon
- legacy V1 implementation files remain untouched.
- any new lane must be either source-closed with exact provenance or explicit source-open with diagnostics.

Rule baseline:
- Rules_v2 p.22 and p.60-p.63
- docs/rules/melee.md
- docs/rules/errata.md
- docs/rules/open-verification.md item `melee.main-unit-support-multiple-attack-and-modifiers`
- docs/source/Rules_v2.md

Global gates for MINI-12:
- Gate M12-G1 Source: 12A must be reviewer-approved before 12B implementation starts.
- Gate M12-G2 Core correctness: source-closed lanes must meet exact expected values.
- Gate M12-G3 Ledger parity: engine and UI must show identical arithmetic on source-closed lanes.
- Gate M12-G4 Transparency: source-open lanes remain explicit and never silently upgraded.
- Gate M12-G5 Safety: parallel-path feature flag is temporary with explicit sunset condition.
- Gate M12-G6 Review: no default-switch to v2 without Reviewer / Rules Agent `Approved` verdict.
