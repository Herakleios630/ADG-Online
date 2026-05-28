# CHARGE_DRILL_2 TODO - Troop-Family Matrix + Readable Bases

Status: Reconciled support board - CD2-00 through CD2-05 and BVR-00 through BVR-02 are complete/accepted for the current support scope; BVR-03 through BVR-05 remain deferred and future UI symbols must stay rule-relevant
Planner: AdG-Rules-Engine-Agent
Preferred future executor: GPT-5.4 after user approval
Recommended review support: GPT-5.5 for `CD2-00` taxonomy/source review and `BVR-00` visual architecture review
Master plan: roadmap.md
Primary active dependency: P7A2_todo.md must be accepted before implementation starts unless the user explicitly approves CD2 as a support preflight while P7A2 remains open
Profile/data dependency: UNIT_CAPABILITIES_todo.md now provides the current representative unit profile/capability spine; future new lanes must consume profile IDs first and keep source-open family expansion explicit
Related future boards: LOGGING_todo.md, UNIT_CAPABILITIES_todo.md, P7B_todo.md, P7C_todo.md, P8 planning
Source workspace: docs/rules/, docs/source/Rules_v2.md, docs/source/army-lists.md, docs/source/Ancient_Period.md, docs/source/Classic_Period.md
Primary source PDFs: Konzepte/Errata_ADG_V4_English.pdf, Konzepte/Rules.pdf, Konzepte/Reglettes.pdf, Konzepte/ArmyLists1-82.pdf, docs/source/new scan/Rules_Color_300DPI.pdf

## Purpose

This board turns the Charge Drill from a mostly generic regression fixture into a deliberate training and validation matrix for representative AdG troop families and movement/reaction behavior.

Conform Drill split note 2026-05-26: source-backed conformation example reconstruction from `Rules_v2` p.53 now belongs in `CONFORM_DRILL_todo.md`. Charge Drill remains the troop-family charge or reaction or evade matrix and may still supply generic P7B smoke anchors, but it is no longer the planned home for book-example conformation drills.

After the 2026-05-25 planning review, this board is explicitly profile-first: do not add broad new behavior by hardcoding per-unit evade/reaction facts directly into fixture units. Build or consume `UNIT_CAPABILITIES_todo.md` first so battlefield units reference source-shaped profiles such as light infantry, cavalry bow, pike, or elephant.

UCD-00 planning note 2026-05-25: the first supported representative profile set is now defined as `light-infantry`, `medium-infantry`, `heavy-infantry`, `cavalry`, `cavalry-bow`, `pike`, and `elephant`. `CD2-00` and later fixture lanes should start from those profile IDs and treat further families such as `camelry`, `light cavalry`, `javelinmen`, or `light chariot` as explicit follow-up additions only when a lane needs them.

UCD-01 implementation note 2026-05-25: `src/data/unit-profiles.js` now exists as the first reusable profile data module for those representative families. `UCD-03` later migrated the current representative Charge Drill units onto that profile-backed path.

UCD-02 implementation note 2026-05-25: charge reaction resolution and the current light-troop end-half-turn hook can now derive default capability data from `profileId` when present, while explicit scenario/test overrides still win. `CD2` can therefore plan against a real profile-backed resolver path.

UCD-03 implementation note 2026-05-25: the current Charge Drill has now been migrated to that profile-backed default path for its representative families. Future `CD2` lane work should add `profileId` first and only keep explicit reaction/capability overrides for clearly labeled scenario controls or fault-injection lanes.

It also plans a separate readable-base visual layer inspired by the rulebook example bases: the player should be able to distinguish infantry, cavalry, cavalry bow, heavy infantry, medium infantry, pike, elephants, and other movement-relevant families by footprint and figure silhouette without reading side-panel labels.

This board is not an army-builder phase. It uses army-list access to choose representative labels and families, but the scenario itself remains a deliberately artificial drill, not a legal army list.

## Scope Split

Execute the work in two independent slices:

1. `CD2` cards: troop-family data and Charge Drill fixture matrix. Recommended immediately after P7A2 acceptance and before serious P7B/P8 browser smoke.
2. `BVR` cards: base visual readability and optional pre-rendered base atlas. Recommended after P7B/P7C rendering surfaces stabilize, unless the user explicitly prioritizes visuals earlier.

The `CD2` slice may be completed without implementing the `BVR` slice. The `BVR` slice must not block P7A2 acceptance.

## Product Invariant

The Charge Drill should be a proving ground for rule behavior, not a pretty but misleading tableau.

- Fixture units must expose explicit movement/reaction capability data.
- Fixture units should reference source-shaped unit profiles for normal behavior.
- Fixture IDs and scenario roles must be stable enough for automated tests and manual browser instructions.
- Direct fixture overrides are allowed only as labeled test/fault-injection controls, not as the normal way to make a family behave correctly.
- Visual bases must never redefine rule geometry. Legal footprint, contact, ZOC, path blocking, and conformation still use `widthUd`, `depthUd`, and `rotationRadians` from unit state and engine geometry.
- Render profiles may improve recognition, but they do not own legality.

## Timing Recommendation

Current timing state after the accepted support preflight work:

1. UCD0 current support scope is complete enough for CD2/P7B/P8 smoke baselines.
2. `CD2-00` through `CD2-05` are complete for the accepted fixture/data scope.
3. `BVR-00` through `BVR-02` are complete for the accepted readable-base baseline, with the user constraint that future UI symbols must be rule-relevant.
4. Do not start `BVR-03` through `BVR-05` before P7A2 repair unless the user explicitly reprioritizes visual work.
5. Return to P7A2, then proceed toward P7B only after P7A2 validation and manual acceptance.

## Immediate Handoff Sequence For GPT-5.4

Use this exact order unless the user reprioritizes:

1. Resume `P7A2` regression repair and validation.
2. Treat UCD0, CD2 fixture/data, and BVR-02 readable-base work as already available support baselines.
3. Stop after agent validation for any remaining P7A2 manual acceptance steps; do not imply that user-facing manual acceptance has already happened.
4. After P7A2 acceptance, start P7B from `P7B_todo.md` using the current Charge Drill anchors as smoke baselines.
5. Keep `BVR-03` through `BVR-05` and deeper UCD canonical-definition/table work deferred unless explicitly reprioritized.

Practical shorthand for the next executor:

- `P7A2 repair + validation -> P7A2 manual acceptance -> P7B PM block`, with UCD/CD2/BVR support already in place.

## GPT-5.4 Execution Contract

GPT-5.4 should execute cards sequentially unless a card explicitly says otherwise.

- Start a feature/bug branch before implementation if requested by the user.
- Before each card, give the user a PM block brief with exact goal, planned files, scope split, validation commands, manual acceptance steps, and non-goals.
- Do not implement official army-list legality in this board.
- Do not add new normal-path fixture capabilities directly on individual units when a unit profile can supply the fact.
- Preserve explicit fixture overrides only when they are labeled as scenario/test overrides and covered by tests.
- Do not add combat factors, cohesion values, or shooting results unless a later approved board owns them.
- Do not replace the battlefield with a canvas renderer. Keep DOM token hitboxes and current overlay layers unless a later visual-system phase approves a broader renderer.
- Keep JavaScript files under the project size targets. If `src/data/charge-drill-scenarios.js` approaches the limit, split scenario helpers into focused modules before adding more fixture rows.
- After each card, update this board with files touched, validation run, manual acceptance status, and the next exact card.

## GPT-5.5 Review Gates

Use GPT-5.5 review before implementation proceeds past these gates:

- After `CD2-00`: review the troop-family taxonomy against rules, errata, movement ruler data, and army-list source notes. Output should confirm that the fixture matrix is representative without claiming tournament completeness.
- After `BVR-00`: review the visual architecture contract. Output should confirm that the design keeps rule geometry separate from render art and does not force a battlefield canvas rewrite.
- Optional after `CD2-03`: review whether the expanded fixture matrix covers the intended charge-reaction and evade edge cases without accidental overlap between lanes.

## Non-Goals For The Whole Board

- no legal army-list generation
- no points/budget validation
- no official army composition claims
- no tournament-complete unit taxonomy
- no combat factor table implementation
- no full terrain movement effects
- no group movement or group charge implementation
- no copyrighted figure art extraction from rule PDFs
- no full battlefield canvas rewrite
- no multiplayer or replay viewer work beyond preserving stable serializable metadata

## Manual Acceptance Themes

Manual acceptance should focus on whether the drill is useful and readable:

- The user can load Charge Drill and immediately see distinct troop-family lanes.
- Each lane has a clear test purpose without needing to drag units into position.
- Charge reactions exercise representative rule differences.
- Evade and follow-through branches can be smoke-tested from stable IDs.
- Base shapes and silhouettes are readable at normal battlefield zoom.
- Visual recognition improves without breaking selection, overlays, or token hitboxes.

## Execution Cards

### [x] CD2-00 - Troop-Family Matrix Source Review

Goal: define the representative troop-family coverage matrix before touching fixture code.

Planned files:

- CHARGE_DRILL_2_todo.md
- roadmap.md
- docs/rules/movement.md
- docs/rules/charge.md
- docs/rules/units-and-bases.md
- docs/rules/open-verification.md
- docs/source/army-lists.md
- docs/source/Ancient_Period.md
- docs/source/Classic_Period.md

Implementation steps:
1. Re-check movement family, evade, charge reaction, and base-size references in the rule docs and source notes.
2. Cross-check `Reglettes.pdf` or extracted ruler knowledge for movement families that materially affect charge or evade behavior.
3. Review army-list source notes only to select representative names/categories, not legal compositions.
4. Create a matrix with at least these families: light infantry, medium infantry, heavy infantry, pike, cavalry, cavalry bow, elephants.
5. Add any additional standard or special movement families that change reaction/evade behavior and are already source-readable enough.
6. For each row, record intended fixture purpose: may evade, must evade, cannot evade, bow/crossbow reaction, light-troop end half-turn, impetuous/impact hooks, blocked by ZoC, table exit, obstacle wheel, conformation-relevant contact.
7. Mark open source questions explicitly instead of filling gaps by intuition.
8. Ask GPT-5.5 for a review of the matrix before code implementation.

Non-goals:

- no scenario layout edits
- no code
- no legal army-list or points validation
- no combat-factor extraction

Validation:

- Markdown diagnostics pass.
- GPT-5.5 review returns no blocker for the representative fixture matrix.

Manual acceptance:

- User confirms the proposed fixture families and priority lanes before code starts.

Stop condition:

- Stop if a family needed for charge/evade behavior cannot be source-checked well enough to create reliable capability data.

Expected result: GPT-5.4 has a reviewed matrix for what to add to the Charge Drill and why.

Progress 2026-05-25:

- Re-checked the current CD2/UCD source basis against `docs/rules/movement.md`, `docs/rules/charge.md`, `docs/rules/units-and-bases.md`, `docs/rules/open-verification.md`, `docs/source/army-lists.md`, `docs/source/Ancient_Period.md`, and `docs/source/Classic_Period.md`.
- Kept the first matrix aligned to the already approved UCD representative profile set: `light-infantry`, `medium-infantry`, `heavy-infantry`, `pike`, `cavalry`, `cavalry-bow`, and `elephant`.
- Treated the current matrix as representative fixture planning only. It does not claim tournament-complete troop taxonomy, mounted subfamily completeness, or a closed base-profile catalog.

CD2-00 representative troop-family matrix draft:

| Profile ID | Representative source anchors | Working rule/data anchor | Intended Charge Drill purpose | Source-confidence note |
| --- | --- | --- | --- | --- |
| `light-infantry` | `Ancient_Period` Lists `1-3` light infantry bow/javelin/sling rows; `Classic_Period` Lists `39-40` light infantry bow and javelinmen tails | `bp-foot-light`; `mp-light-foot`; charge family `light-infantry`; current default ability `light-troops` | Primary `may-evade` and `must-evade` lane; light-troop end half-turn; obstacle-wheel evade; table-exit evade; ZoC-blocked evade | Representative and useful now, but the exact `light troops` subset remains open under `unit-capabilities.light-troops-family-boundary` |
| `medium-infantry` | `Ancient_Period` Lists `1-2` medium spearmen / medium swordsmen core rows; `Classic_Period` List `38` mixed `Warriors and peltasts` block | `bp-foot-formed`; `mp-medium-foot`; charge family `medium-infantry` | Baseline formed-foot control lane; default non-evade target; ZoC sentry/blocker anchor; neutral front-contact/conformation baseline | This is a representative formed-foot anchor, not a promise that all medium-foot missile or weapon splits are already modeled |
| `heavy-infantry` | `Classic_Period` Lists `38-40` hoplite / heavy spearmen rows | `bp-foot-formed`; `mp-heavy-foot`; charge family `heavy-infantry`; current heavy-charge anchor | Cannot-evade control lane; heavy-charger versus light-infantry `must-evade` trigger; adjusted-charge heavy exception anchor; solid front-contact baseline | Useful for first drill expansion, but armour/protection and all heavy-foot subfamilies remain out of scope |
| `pike` | `Classic_Period` Lists `38-41` phalangite / pikemen rows | `bp-foot-deep`; `mp-pike-foot`; charge family `pike` | Deep-foot footprint anchor; conformation-relevant front-contact lane; non-evade control lane; later pike-specific movement-cost smoke anchor | Pike is source-readable enough to justify its own drill lane, but the shared deep-foot base catalog still depends on `unit-capabilities.base-profile-family-catalog` |
| `cavalry` | `Classic_Period` Lists `39-41` medium/heavy cavalry rows as the generic mounted formed benchmark | `bp-mounted`; `mp-mounted`; charge family `cavalry` with the current non-impact, non-impetuous default | Baseline mounted `may-evade` lane; front/flank/rear mounted target anchor; continuation, earlier-contact, and table-exit mounted anchor | This first matrix uses generic cavalry only. `impact`, `impetuous`, `light-cavalry`, `camelry`, and `light-chariot` remain explicit follow-up splits |
| `cavalry-bow` | `Ancient_Period` Lists `1-2` `Scouts on equids`; `Classic_Period` List `40` `Sogdians, Scythians or Bactrians` | `bp-mounted`; `mp-mounted-provisional`; charge family `cavalry` plus `hasBow`; future shooting hook `sp-mounted-bow` | Bow/crossbow-capable mounted reaction lane; mounted evade lane distinct from generic cavalry; later shooting/range anchor | Strong enough for a representative mounted-missile lane, but mounted bow versus light cavalry/crossbow sub-splits remain open |
| `elephant` | `Classic_Period` Lists `40-41` elephant rows | `bp-elephant`; `mp-elephant`; charge family `elephant` | Special-target non-evade anchor; future elephant-contact and conformation lane; explicit anti-light-troop contrast anchor | Worth its own lane now, but exact shared elephant base dimensions still inherit the open base-profile catalog question |

Deferred follow-up families intentionally not in the first CD2 matrix:

- `light-cavalry`
- `javelinmen`
- `camelry`
- `light-chariot`

Reason for deferral:

- `docs/rules/charge.md` already treats these as materially relevant evade-capable families, but the current approved first matrix stays on the seven UCD profiles until the mounted and loose-foot evade-family split is source-checked well enough to avoid inventing defaults.
- `CD2-01` and later cards may add these as explicit new lanes once their representative capability/default boundaries are sharp enough to be stable.

Current CD2-00 review posture:

- GPT-5.5 taxonomy/source review gate completed on 2026-05-25 with `Status: Approved` and no review findings.
- Agent validation is complete for the matrix draft: Markdown diagnostics passed and the GPT-5.5 gate returned no blocker.
- Not ready for `CD2-01` implementation until the user confirms the first-priority lanes in the manual acceptance step.

GPT-5.5 review result 2026-05-25:

```markdown
Rule Guardian Review

Status: Approved

Findings:
- There are no review findings. The CD2-00 matrix is acceptable as representative fixture planning output, not as a tournament-complete taxonomy.

Open Verification:
- Keep `unit-capabilities.light-troops-family-boundary` open.
- Keep `unit-capabilities.base-profile-family-catalog` open.
- Keep `unit-capabilities.evade-mounted-subfamily-split` open.
- The seven selected profiles match the current UCD spine and are defensible first Charge Drill representatives.
- Roadmap state is aligned and still treats CD2 as draft/pending manual acceptance before implementation.
```

### [x] CD2-01 - Unit Family Data Spine

Goal: introduce a small data spine for representative unit families without turning fixtures into an army builder.

Planned files:

- src/data/unit-families.js or src/data/unit-profiles.js
- src/data/unit-families.test.js or src/data/unit-profiles.test.js
- src/data/charge-drill-scenarios.js
- src/data/charge-drill-scenarios.test.js
- src/engine/charge/reaction.js only if existing capability lookup must accept profile IDs
- src/engine/charge/reaction.test.js if profile lookup changes reaction behavior
- CHARGE_DRILL_2_todo.md

Implementation steps:
1. Define a compact unit-family/profile table with IDs, labels, footprint defaults, movement family ID, and charge reaction capability defaults.
2. Include render-facing metadata only as inert descriptors, not actual visuals yet: `renderProfileId`, `baseSilhouette`, `figureSilhouette`, and optional `formationHint`.
3. Keep current explicit fixture overrides available for targeted regression cases.
4. Update `createChargeDrillUnit` to accept a family/profile ID and derive defaults when explicit values are omitted.
5. Ensure missing or unknown profile IDs fail loudly in tests instead of silently defaulting to medium infantry.
6. Keep unit instance state plain and serializable.
7. Add tests proving the required representative families exist and expose expected capability fields.

Non-goals:

- no official army-list schema
- no movement table completeness beyond fixture needs
- no render implementation
- no points or cost data

Validation:

- `node --test src/data/unit-families.test.js src/data/charge-drill-scenarios.test.js`
- If reaction lookup changes: `node --test src/engine/charge/reaction.test.js src/data/charge-drill-scenarios.test.js`
- Editor diagnostics on touched files.

Manual acceptance:

- None required if tests prove data shape only; summarize data IDs for user review.

Stop condition:

- Stop if the profile table starts duplicating army-builder responsibilities or becomes too broad for a fixture support slice.

Expected result: Charge Drill fixtures can be written in source-shaped family terms instead of repeating ad hoc cavalry/medium-infantry fields everywhere.

Progress 2026-05-25:

- Reused and extended the existing `src/data/unit-profiles.js` spine instead of creating a parallel `unit-families` module.
- Added shared fixture-planning `BASE_PROFILES` for `bp-foot-light`, `bp-foot-formed`, `bp-foot-deep`, `bp-mounted`, and `bp-elephant`, all still marked `needs-source-check` rather than source-complete base catalog facts.
- Added inert `VISUAL_PROFILES` descriptors with `baseSilhouette`, `figureSilhouette`, and `formationHint` for later readable-base work; no renderer or legality logic consumes these as rule geometry.
- Added `getBaseProfile`, `getVisualProfile`, and `getDefaultFootprintForProfile` helpers with loud failures for unknown IDs.
- Updated `createChargeDrillUnit` so omitted fixture `widthUd`, `depthUd`, and `baseShape` can derive from `profileId`; existing explicit fixture dimensions and explicit scenario overrides still win.
- Exported the Charge Drill unit factory for focused data-shape testing only.

Validation update 2026-05-25:

- `node --test src/data/unit-profiles.test.js src/data/charge-drill-scenarios.test.js` passes `12/12`.
- `npm run build` passes.

Manual acceptance summary:

- No manual acceptance required for this data-shape card.
- Active profile IDs remain `light-infantry`, `medium-infantry`, `heavy-infantry`, `pike`, `cavalry`, `cavalry-bow`, and `elephant`.
- Active base profile IDs are fixture-planning defaults only: `bp-foot-light`, `bp-foot-formed`, `bp-foot-deep`, `bp-mounted`, and `bp-elephant`.

Next exact card: `CD2-02 - Charge Drill Troop-Family Layout Expansion`.

### [x] CD2-02 - Charge Drill Troop-Family Layout Expansion

Goal: add stable Charge Drill lanes for the representative troop families.

Planned files:

- src/data/charge-drill-scenarios.js
- src/data/charge-drill-scenarios.test.js
- docs/browser-automation.md
- CHARGE_DRILL_2_todo.md

Implementation steps:
1. Split `src/data/charge-drill-scenarios.js` into helpers if file size approaches the project limit.
2. Add stable scenario roles and IDs for each matrix lane from `CD2-00`.
3. Preserve existing lane IDs unless a deliberate migration note and tests are added.
4. Add lanes for at minimum: light infantry evade, cavalry bow evade/reaction, heavy infantry non-evade or adjusted-charge special case, medium infantry baseline, pike contact/conformation anchor, elephant special-target anchor, cavalry baseline.
5. Add labels that explain the drill role without pretending to be historical army list units.
6. Keep lanes spatially separated enough that target search, ZoC, and earliest-contact diagnostics do not bleed into unrelated lanes.
7. Add tests asserting every required scenario role exists, has stable owner/corps, has expected profile IDs, and has expected footprint dimensions.
8. Update browser automation selectors for key new lanes.

Non-goals:

- no official army deployment
- no terrain movement effects
- no conformation implementation changes
- no visual-base implementation

Validation:

- `node --test src/data/charge-drill-scenarios.test.js src/state/p0-state.test.js`
- `node --test src/engine/charge/declaration.test.js src/engine/charge/reaction.test.js src/state/p0-state.test.js`
- `npm run build`

Manual acceptance:

- User loads Charge Drill and confirms the new lanes are visually separable enough for testing.

Stop condition:

- Stop if the expanded scenario becomes too crowded for reliable manual testing; split into separate drill scenarios instead of cramming everything into one table.

Expected result: the Charge Drill contains a representative, stable set of troop-family anchors for future charge/evade/conformation/shooting smoke tests.

Progress 2026-05-25:

- Kept `src/data/charge-drill-scenarios.js` in one file because the scenario remains below the project size limit after the current expansion.
- Preserved the existing cavalry/light/medium anchor lanes and added the missing first-matrix family anchors as stable units with profile-backed defaults:
	- `charge-drill-p1-cavalry-bow-charger` / `charge-drill-p2-cavalry-bow-target`
	- `charge-drill-p1-heavy-infantry-charger` / `charge-drill-p2-heavy-infantry-target`
	- `charge-drill-p1-pike-charger` / `charge-drill-p2-pike-target`
	- `charge-drill-p1-elephant-charger` / `charge-drill-p2-elephant-target`
- Updated `docs/browser-automation.md` with stable selectors for key new family anchors.
- Tightened the lower-right legacy lane spacing by moving the table-exit lane left to `xUd 27.2`; this keeps the light-troop lane and table-exit lane from sharing the same evade corridor.
- Kept the legacy front lane stable for charge-targeting smoke, but replaced one fixture-bound state test with a reducer-level synthetic slide-choice setup because the old front-lane evade-choice assumption is no longer a stable scenario contract.

Validation update 2026-05-25:

- `node --test src/data/charge-drill-scenarios.test.js src/state/p0-state.test.js` passes `158/158`.
- `node --test src/engine/charge/declaration.test.js src/engine/charge/reaction.test.js src/state/p0-state.test.js` passes `193/193`.
- `npm run build` passes.

Manual acceptance 2026-05-25:

- User confirmed the new family lanes are visually separable enough for testing and selectable through the intended corps gate.
- Reminder for future smoke checks: click through `Runde beginnen`, clear the corps-selection dialog, then use `Player 1 + Corps II` for the four new chargers and `Player 2 + Corps II` for the four new targets.

Next exact card after acceptance: `CD2-03 - Reaction And Evade Regression Matrix`.

### [x] CD2-03 - Reaction And Evade Regression Matrix

Goal: prove the expanded drill exercises meaningful charge reaction and evade differences.

Planned files:

- src/engine/charge/reaction.test.js
- src/engine/charge/evade.test.js
- src/state/p0-state.test.js
- src/data/charge-drill-scenarios.test.js
- CHARGE_DRILL_2_todo.md

Implementation steps:
1. Add tests for may-evade, must-evade, cannot-evade, and blocked-evade lanes where source-shaped capability data supports them.
2. Add focused tests for light-troop end half-turn in the drill fixture, not only in synthetic engine tests.
3. Add a cavalry bow or bow-capable lane that preserves reaction/shooting hook metadata without implementing P8 shooting early.
4. Add a heavy infantry or heavy-style lane that preserves current adjusted-charge never-reduce behavior where source-locked.
5. Add pike and elephant anchors as conformation/special-target future hooks with explicit source-open diagnostics if their special behavior is not implemented yet.
6. Add table-exit or edge-adjacent lane coverage if P7A2 table-exit state is accepted by this point.
7. Ask GPT-5.5 for optional review if the matrix produces surprising reaction categories or ambiguous source-open diagnostics.

Non-goals:

- no shooting resolution
- no melee resolution
- no elephant combat special rules beyond safe hooks/diagnostics
- no pike melee factors

Validation:

- `node --test src/data/charge-drill-scenarios.test.js src/engine/charge/reaction.test.js src/engine/charge/evade.test.js src/state/p0-state.test.js`
- `npm run build`

Manual acceptance:

- User can follow at least three new lanes in the browser: light troop evade, cavalry bow reaction hook, and elephant or pike future-special anchor.

Stop condition:

- Stop if tests depend on brittle pixel/position assumptions rather than stable scenario roles and engine facts.

Expected result: the fixture matrix becomes a real regression surface for charge reaction and evade work, not merely a visual demo.

Progress 2026-05-25:

- Added scenario-backed reaction regressions in `src/engine/charge/reaction.test.js` for:
	- mounted `may-evade` on the new cavalry-bow lane
	- explicit light-troop hook lane preservation as `may-evade`
	- `cannot-evade` anchors for the new pike and elephant targets
	- the dedicated blocked-evade blocker corridor
- Added scenario-backed evade regressions in `src/engine/charge/evade.test.js` for:
	- the live Charge Drill light-troop end-half-turn lane
	- the new cavalry-bow mounted lane without a light-troop half-turn hook
- Kept the current heavy-infantry `never reduce` adjusted-charge regression in place as the heavy-style anchor for this card rather than duplicating it in another brittle fixture test.
- Did not invent pike or elephant combat special rules; they remain safe future hooks, while the current regression matrix proves they stay in the non-evade category.

Validation update 2026-05-25:

- `node --test src/data/charge-drill-scenarios.test.js src/engine/charge/reaction.test.js src/engine/charge/evade.test.js` passes `62/62`.
- `node --test src/data/charge-drill-scenarios.test.js src/engine/charge/reaction.test.js src/engine/charge/evade.test.js src/state/p0-state.test.js` passes `218/218`.
- `npm run build` passes.

Manual acceptance 2026-05-25:

- User confirmed the regression slice is understandable enough to proceed.
- Keep naming acting corps and target corps explicitly in future smoke instructions because the current drill still spreads live test anchors across multiple corps.

Next exact card after acceptance: `CD2-04 - Browser Smoke Script And Manual Runbook`.

### [x] CD2-04 - Browser Smoke Script And Manual Runbook

Goal: make the expanded drill easy for GPT-5.4 and the user to smoke-test repeatedly.

Planned files:

- docs/browser-automation.md
- CHARGE_DRILL_2_todo.md
- optional test helper docs if browser tooling has stable selectors

Implementation steps:
1. Add selectors for the most important new Charge Drill lanes.
2. Write manual smoke steps for at least five representative flows: baseline cavalry, light infantry end half-turn, cavalry bow reaction hook, heavy infantry/never-reduce adjusted charge, elephant or pike special anchor.
3. Include expected state labels or data attributes, not only visual descriptions.
4. Include a note that browser smoke should use embedded browser tools when available; otherwise use render tests and screenshot review.
5. Keep manual acceptance separate from automated validation. Do not claim the user has accepted until the user says so.

Non-goals:

- no new gameplay implementation
- no Playwright dependency migration unless already approved

Validation:

- Markdown diagnostics pass.
- Existing focused tests still pass after selector docs are updated.

Manual acceptance:

- User confirms the runbook is understandable and the expanded drill can be navigated without hidden knowledge.

Stop condition:

- Stop if stable selectors are missing for the intended lanes; add selectors in UI tests before writing fragile instructions.

Expected result: future phases have a repeatable browser smoke path for representative troop-family charge behavior.

Progress 2026-05-25:

- Expanded `docs/browser-automation.md` into a real CD2 smoke runbook instead of a selector stub.
- Added stable selectors for shared Charge Drill controls: player switch, corps switch, charge start, reaction decisions, evade distance roll, handoff acknowledgement, adjusted-charge roll, and charge cancel.
- Added five representative smoke flows with acting corps and target corps called out explicitly:
	- baseline cavalry charge lane
	- light-troop evade plus end half-turn
	- cavalry-bow reaction hook
	- heavy-infantry adjusted-charge never-reduce anchor
	- pike or elephant future-special anchor
- Included expected selector/data-attribute checks such as `data-unit-owner`, `data-unit-corps-id`, `aria-pressed`, `data-charge-preview-corridor`, and `data-charge-preview-ghost` so the runbook does not depend only on visual intuition.
- Recorded the workflow preference that embedded browser tools are first choice when available and screenshot review is only fallback evidence.

Validation update 2026-05-25:

- `node --test src/data/charge-drill-scenarios.test.js src/engine/charge/reaction.test.js src/engine/charge/evade.test.js` passes after the selector/runbook update.
- Markdown diagnostics pass on the touched docs.

Manual acceptance 2026-05-25:

- User confirmed the runbook is understandable enough for the current phase.
- Corps mapping should continue to be called out explicitly in future smoke instructions until the visual base/readability slice reduces the lookup burden.

Next exact card after acceptance: `CD2-05 - Troop-Matrix Handoff To P7B/P8`.

### [x] CD2-05 - Troop-Matrix Handoff To P7B/P8

Goal: update downstream boards so P7B/P8 know how to use the richer drill matrix without treating it as an army-list system.

Planned files:

- P7B_todo.md
- P7C_todo.md only if command-menu smoke needs new selectors
- future P8_todo.md if it exists by then
- roadmap.md
- CHARGE_DRILL_2_todo.md

Implementation steps:
1. Add P7B manual smoke references for pike, elephant, light troop, and mounted targets where relevant to conformation.
2. Add P8 planning notes for bow/cavalry bow hooks without implementing shooting yet.
3. Update roadmap status to mark `CD2` fixture matrix accepted after user manual acceptance.
4. Keep the visual-base `BVR` slice open unless it has been separately accepted.

Non-goals:

- no P7B implementation
- no P8 implementation
- no army-builder integration

Validation:

- Markdown diagnostics pass.
- User-facing runbook links still match real selectors and scenario IDs.

Manual acceptance:

- User confirms the richer drill matrix is acceptable as a support baseline for upcoming P7B/P8 work.

Stop condition:

- Stop if the downstream board wording implies the fixture is tournament-complete or army-list-legal.

Expected result: P7B and P8 can use the new drill matrix without reopening its purpose every time.

Progress 2026-05-25:

- Updated `P7B_todo.md` so the accepted Charge Drill matrix is now an explicit support baseline for early conformation smoke, with corps-aware anchor references for mounted baseline, light-troop hook, cavalry-bow, pike, and elephant lanes.
- Updated `roadmap.md` so the current `CD2` fixture/data slice is marked accepted through the downstream handoff, while the later `BVR` visual readability slice remains open.
- Did not edit `P7C_todo.md` because the current command-menu board does not need extra CD2-specific selector notes beyond the shared browser runbook already captured in `docs/browser-automation.md`.
- No `P8_todo.md` exists yet in the workspace, so the P8 part of the handoff is recorded in roadmap/board wording rather than in a missing phase file.

Validation update 2026-05-25:

- Markdown diagnostics pass on the touched board/roadmap files.
- Existing runbook links and scenario IDs remain aligned with `docs/browser-automation.md` and the current Charge Drill fixture.

Manual acceptance 2026-05-25:

- User proceeded from the CD2 handoff review into the BVR visual-readability slice, so the richer Charge Drill matrix is accepted as the support baseline for upcoming P7B work and future P8 planning notes.
- Current `CD2` fixture/data slice is complete for the accepted support scope; the remaining related work is the separate `BVR` visual readability slice or downstream approved phase boards.

Post-review correction 2026-05-25:

- Removed the hidden Player 1 generic-cavalry `chargeWeight: heavy` fixture override from `createChargeDrillUnit`; heavy adjusted-charge behavior now comes from the heavy-infantry profile path or explicit test capability data.
- Flipped the four new Corps II family lanes so the P1 chargers sit nearer the north edge at `yUd: 3.4` and the P2 targets sit inward at `yUd: 6.8`, preventing the new P2 targets from immediately evading off the north table edge.
- Added tests proving generic P1 cavalry remains generic and the new P2 family targets stay away from the north edge.

### [x] BVR-00 - Base Visual Reference And Architecture Contract

Goal: define the readable-base visual contract before implementing token art.

Planned files:

- CHARGE_DRILL_2_todo.md
- docs/architecture.md if the render-layer contract needs a durable note
- roadmap.md
- optional docs/battlefield-visuals.md if the contract becomes long

Implementation steps:
1. Review the rulebook page-8 style example and current battlefield token rendering.
2. Define visual goals for infantry, cavalry, cavalry bow, pike, elephant, commander, and other high-value families.
3. Decide which marks are base/footprint marks and which are figure silhouettes.
4. Confirm that DOM button hitboxes remain the interactive elements.
5. Define render descriptors that can be applied as CSS-only, SVG-like DOM primitives, or pre-rendered canvas atlas images.
6. Define the canvas/atlas fallback path: if `OffscreenCanvas` is unavailable, use an in-document canvas cache or CSS silhouette fallback.
7. Ask GPT-5.5 to review the visual architecture before implementation.

Non-goals:

- no art implementation
- no full canvas battlefield
- no copyrighted art extraction
- no rule geometry changes

Validation:

- Markdown diagnostics pass.
- GPT-5.5 review returns no architecture blocker.

Manual acceptance:

- User approves the visual direction and confirms which families need first-pass readability.

Stop condition:

- Stop if the proposed visuals require replacing current selection/overlay architecture.

Expected result: GPT-5.4 has a reviewed visual target that improves readability while preserving rule geometry.

Progress 2026-05-25:

- Drafted `docs/battlefield-visuals.md` as the first durable readable-base contract instead of keeping the whole decision inside the board text.
- Added a short durable architecture seam in `docs/architecture.md` so future visual work stays tied to the existing token/hitbox model.
- Kept the contract anchored to the already existing inert visual descriptors in `src/data/unit-profiles.js`: `visualProfileId`, `baseSilhouette`, `figureSilhouette`, and `formationHint`.
- Defined the first-pass family readability targets for light foot, medium foot, heavy foot, cavalry, cavalry bow, pike, elephant, and commander.
- Split the visual language into footprint marks, figure silhouettes, facing markers, and state accents so later slices do not mix decorative art with legality overlays.
- Locked the implementation ladder to CSS/DOM first, optional atlas second, with DOM button tokens remaining the authoritative interactive surface.
- Recorded the fallback rule that an atlas slice must fall back to in-document cache or CSS silhouette treatment when `OffscreenCanvas` is unavailable.

Validation update 2026-05-25:

- Markdown diagnostics pass on the touched docs and boards.
- The draft stays aligned with the current profile spine and does not require engine or UI code changes yet.

Review and manual acceptance 2026-05-25:

- GPT-5.5 visual architecture review found no BVR-00 architecture blocker; the follow-up findings were about CD2 fixture cleanup, phase-status cleanup, file-size pressure, and the missing commander descriptor for BVR-01.
- User approved proceeding into BVR-01 after the CD2 cleanup and Corps II smoke.
- BVR-00 is complete for the architecture-contract scope; next exact card: `BVR-01 - Render Descriptor Data Model`.

### [x] BVR-01 - Render Descriptor Data Model

Goal: add inert render-profile metadata to units and fixture profiles.

Planned files:

- src/data/unit-render-profiles.js or combined unit-family data file
- src/data/unit-render-profiles.test.js
- src/data/unit-families.js or src/data/unit-profiles.js
- src/data/charge-drill-scenarios.js
- src/data/charge-drill-scenarios.test.js
- CHARGE_DRILL_2_todo.md

Implementation steps:
1. Define render profile IDs for `foot-light`, `foot-medium`, `foot-heavy`, `pike-block`, `mounted`, `mounted-bow`, `elephant`, and `commander`.
2. Define descriptor fields such as base silhouette, figure count hint, figure shape hint, facing marker, accent slot, and owner-color treatment.
3. Ensure descriptors are serializable plain data.
4. Attach render profile IDs through unit-family defaults or explicit fixture overrides.
5. Add tests that all Charge Drill units have a valid render profile after the fixture matrix expansion.

Non-goals:

- no visual rendering yet
- no image assets
- no canvas code

Validation:

- `node --test src/data/unit-render-profiles.test.js src/data/charge-drill-scenarios.test.js`
- Editor diagnostics on touched files.

Manual acceptance:

- None required if data-only; summarize profile IDs and examples for user review.

Stop condition:

- Stop if descriptor data starts containing rule facts that should live in engine data.

Expected result: the UI can request a visual profile without looking at troop rules directly.

Progress 2026-05-25:

- Started the data-only descriptor slice by adding explicit commander visual descriptor data to the existing inert visual-profile spine: `vp-commander`, `baseSilhouette=commander`, `figureSilhouette=leader`, and `formationHint=command-stand`.
- Attached `visualProfileId` to Charge Drill unit instances through profile defaults, with an explicit commander visual profile override for the drill commander.
- Extended the existing `VISUAL_PROFILES` spine instead of creating a second descriptor module yet; each visual profile now carries data-only render descriptor fields for render family, figure-count hint, figure-shape hint, facing marker, accent slot, and owner-color treatment.
- Added `getVisualProfileForUnit(unit)` so future UI/render code can resolve a unit-facing visual descriptor without reading troop-rule fields directly.
- Exposed the resolved visual descriptor surface on battlefield tokens as data attributes in `p0-battlefield.js`, so BVR-02 can style against token-owned descriptor data instead of reaching back into profile tables.
- Did not add renderer, CSS, SVG, canvas, or UI behavior.

Validation update 2026-05-25:

- `node --test src/data/unit-profiles.test.js src/data/charge-drill-scenarios.test.js` passes for the descriptor layer.
- `node --test src/ui/p0-battlefield.test.js src/data/unit-profiles.test.js src/data/charge-drill-scenarios.test.js` passes for the token data-attribute seam.
- `node --test src/data/unit-profiles.test.js src/data/charge-drill-scenarios.test.js src/engine/charge/reaction.test.js src/engine/charge/evade.test.js src/state/p0-state.test.js` passes `228/228`.
- `npm run build` passes.

Manual acceptance summary:

- No separate manual acceptance required for this data-only card.
- BVR-01 is complete for the accepted scope: token-owned descriptor data is now available without any renderer or CSS implementation.

Next BVR-01 step:

- The current evidence says the existing `VISUAL_PROFILES` spine is sufficient for BVR-01. Next exact card: `BVR-02 - CSS/DOM Readable Base Prototype`.

### [x] BVR-02 - CSS/DOM Readable Base Prototype

Goal: create a low-risk first readable-base prototype using current DOM token architecture.

Planned files:

- src/ui/p0-battlefield.js
- src/styles/p0-battlefield.css
- src/ui/p0-battlefield.test.js
- src/data/unit-render-profiles.js
- CHARGE_DRILL_2_todo.md

Implementation steps:
1. Render an inner visual layer inside the existing unit token button.
2. Add data attributes for render profile and base silhouette.
3. Use CSS pseudo-elements or inner spans for simple circles/ovals/blocks: infantry dots, mounted ovals, pike lines, elephant block, bow marker.
4. Preserve `data-action="select-unit"`, automation IDs, token dimensions, rotation, contact side overlays, and command range rings.
5. Keep labels out of the battlefield token unless needed for accessibility; use title/aria and side panel for text.
6. Add render tests for profile classes/attributes without fragile pixel assertions.

Non-goals:

- no canvas atlas yet
- no animation
- no full visual redesign
- no token geometry changes

Validation:

- `node --test src/ui/p0-battlefield.test.js src/data/unit-render-profiles.test.js`
- `npm run build`
- Browser smoke for token selection, charge target highlight, contact side markers, and command range hover.

Manual acceptance:

- User confirms the first-pass symbols improve readability and do not obscure charge/conformation overlays.

Stop condition:

- Stop if CSS symbols make overlays or selection markers harder to read.

Expected result: the board is more readable without committing to an atlas implementation yet.

Progress 2026-05-25:

- Added a decorative inner visual layer inside the existing battlefield unit button instead of replacing the token architecture.
- The first-pass CSS/DOM prototype now reads directly from the BVR-01 token descriptor seam: mounted, mounted-bow, formed foot, deep foot, elephant, and commander each render distinct inner marks.
- Kept the visual layer pointer-events-free and below debug labels/contact markers so selection, charge overlays, and command-range rings remain the authoritative interaction and rules surfaces.
- Added a mounted-bow marker for cavalry-bow and a distinct ring/leader mark for commanders without introducing labels into the token art.

Validation update 2026-05-25:

- Isolated token-render checks cover the new inner visual layer classes for cavalry, cavalry-bow, and commander.
- Full `p0-battlefield.test.js` still contains unrelated pre-existing hotseat/handoff failures, so BVR-02 validation should use isolated render checks plus build until that separate surface is repaired.

Manual acceptance 2026-05-25:

- User confirmed the current layout direction is acceptable for the readable-base slice.
- The current BVR-02 result is accepted as a CSS/DOM readability baseline, not as a full rule-complete troop-symbol taxonomy.
- Future added UI symbols should be limited to rule-relevant distinctions only.

Next exact step:

- Do not start `BVR-03` yet.
- First prepare a compact rule-relevant visual feature matrix that separates stable visual recognition from rule-facing capability differences, especially for mounted bow versus non-bow, foot missile cues, and later infantry weapon cues.

### [ ] BVR-03 - Optional Pre-Rendered Base Atlas Prototype

Goal: evaluate a cached canvas/atlas approach for richer miniature-style bases while preserving DOM hitboxes.

Planned files:

- src/ui/unit-base-atlas.js or src/ui/unit-render-atlas.js
- src/ui/unit-base-atlas.test.js if practical with pure descriptor output
- src/ui/p0-battlefield.js
- src/styles/p0-battlefield.css
- CHARGE_DRILL_2_todo.md

Implementation steps:
1. Build a small cache keyed by render profile, owner color, selected/highlight state where needed, and device pixel ratio.
2. Draw base backgrounds and figure silhouettes onto an offscreen or hidden canvas, using generated primitive shapes only.
3. Return a data URL or CSS paint value only for stable cached profiles, not per-frame drawing.
4. Keep token DOM buttons as the selection and accessibility surface.
5. Add fallback to the CSS/DOM prototype from `BVR-02` if canvas support is unavailable or performance is worse.
6. Measure render cost with the existing perf logger during Charge Drill load and charge preview.

Non-goals:

- no external art import
- no continuous canvas redraw loop
- no replacing overlays with canvas
- no per-unit custom images in game state

Validation:

- Focused unit tests for descriptor-to-cache-key behavior if possible.
- `node --test src/ui/p0-battlefield.test.js`
- `npm run build`
- Browser perf smoke with `?perf=1` comparing Charge Drill steady load and charge preview before/after.

Manual acceptance:

- User compares CSS prototype versus atlas prototype and chooses whether atlas quality/performance is worth keeping.

Stop condition:

- Stop and keep CSS-only rendering if atlas data URLs increase memory, trigger OOM-like behavior, or complicate token overlay behavior.

Expected result: a measured decision on whether pooled pre-rendered bases should become the default visual path.

### [ ] BVR-04 - Visual State Integration With Charge/Evade/Conformation Overlays

Goal: ensure readable bases cooperate with tactical state overlays instead of fighting them.

Planned files:

- src/ui/p0-battlefield.js
- src/styles/p0-battlefield.css
- src/ui/p0-battlefield.test.js
- CHARGE_DRILL_2_todo.md

Implementation steps:
1. Verify selected, active corps, spent, charge-target eligible, charge-target blocked, charge-target selected, attach target, and disabled states remain visible.
2. Verify evade ghosts, committed trail tokens, table-exit state, and conformation ghosts use compatible visual language.
3. Ensure commander/included-commander markings remain distinct from troop-family silhouettes.
4. Add tests for data attributes/classes that show render profile plus tactical state can coexist.
5. Run browser smoke across normal, selected, charge-target, and evade-choice states.

Non-goals:

- no new rule states
- no conformation logic changes
- no command-menu redesign

Validation:

- `node --test src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js`
- `npm run build`
- Browser smoke with screenshots if browser tools are available.

Manual acceptance:

- User confirms the battlefield remains readable during active charge/evade/conformation interactions, not only at idle.

Stop condition:

- Stop if visual family symbols obscure target selection, side markers, or important warnings.

Expected result: visual readability survives actual gameplay overlays.

### [ ] BVR-05 - Base Visual Handoff And Future Asset System Notes

Goal: close the base-readability slice and hand off durable decisions to the later visual asset system.

Planned files:

- CHARGE_DRILL_2_todo.md
- roadmap.md
- docs/architecture.md or docs/battlefield-visuals.md
- P15 planning notes if a P15 board exists by then

Implementation steps:
1. Record chosen rendering path: CSS-only, canvas atlas, or hybrid.
2. Record performance results and any memory concerns.
3. Record how later PNG sprites, atlases, masks, and player-color variants can replace the primitive silhouettes without changing engine state.
4. Update roadmap/P15 notes so the full visual asset system builds on this slice instead of redesigning it blindly.
5. Stop for user manual acceptance.

Non-goals:

- no production art pipeline
- no custom army paint system
- no replacing all UI visuals

Validation:

- Markdown diagnostics pass.
- Last focused UI/render tests and build are recorded.

Manual acceptance:

- User accepts the visual baseline or asks for a follow-up visual polish slice.

Stop condition:

- Stop if the chosen rendering path cannot be explained as a future-compatible layer over current rule geometry.

Expected result: P15 can later become a true visual asset phase instead of rediscovering token rendering decisions.
