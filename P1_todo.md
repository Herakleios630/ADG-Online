# P1 TODO - Rule Knowledge + Data Foundation

Status: Complete - accepted by user on 2026-05-16
Intended branch: `docs/p1-rule-data-foundation`
Master plan: `roadmap.md`
Architecture source: `docs/architecture.md`
Governance source: `docs/project-governance.md`
Rules workspace: `docs/rules/`

## Purpose

P1 turns the accepted P0 shell foundation into a rule-governed planning and data foundation for later implementation phases.

P1 is documentation, source-verification workflow, data-model planning, and initial validation strategy. It does not implement P2 geometry, P3 terrain/setup interaction, P4 movement commands, official movement legality, army-builder behavior, combat, AI, replay, or multiplayer.

P1 must make later phases harder to get wrong: rule facts are source-referenced, open verification is tracked, unit instance state is separated from rule tables, hidden information is treated as a local gameplay concern, and Standard 200 remains the default target without claiming tournament completeness.

## How To Use This Board

Work one checklist card at a time. Do not batch cards unless the user explicitly asks.

Before each card:
1. Read this file section for the current card.
2. Re-read `roadmap.md` P1 and relevant sections of `docs/architecture.md`, `docs/project-governance.md`, and `docs/rules-knowledge.md`.
3. Re-check relevant source material in priority order:
   1. `Konzepte/Errata_ADG_V4_English.pdf`
   2. `Konzepte/Rules.pdf`
   3. `Konzepte/ArmyLists1-82.pdf`
   4. `Konzepte/Army_list_spreadsheet_V4 (1).xlsx`
   5. `Konzepte/Reglettes.pdf`
   6. `Konzepte/Konzept.pdf`
   7. OCR working copies such as `Konzepte/merged.pdf` as search helpers only, never as authoritative replacements
   8. `docs/rules-knowledge.md` and `docs/rules/`
   9. `docs/architecture.md`, `docs/project-governance.md`, and `roadmap.md`
4. Run `git status --short` and protect unrelated user changes.
5. Give the user a short PM block brief before edits.
6. Keep implementation inside P1 scope.

PM block brief must include:
- exact goal;
- planned files;
- new documentation or data-model sections;
- rule-source verification target;
- validation commands;
- manual acceptance steps;
- non-goals.

After each completed card, update this file and report:
- completed card id and title;
- files touched;
- source material checked;
- validation run;
- manual user review and expected result;
- still-open next card or blocker.

Context-loss rule: a future AI session should be able to resume from this file without reading the chat transcript.

## Global P1 Scope Guardrails

In scope:
- AI-readable rule markdown structure;
- source-reference and open-verification workflow;
- Standard 200 profile facts and unresolved verification items;
- data separation blueprint for unit definitions, unit instances, rosters, format profiles, and rule tables;
- official setup sequence as a state-machine plan;
- terrain/setup knowledge skeleton needed before P3;
- hidden-information and player-view requirements;
- initial test/data validation approach;
- file-size guard convention documentation;
- roadmap and P1 board status updates.

Out of scope:
- no P2 geometry implementation;
- no P3 terrain placement or deployment UI;
- no P4 official movement command implementation;
- no ZOC, charge, conformation, shooting, melee, rout, pursuit, cohesion, or victory implementation;
- no army-list data conversion beyond planning requirements;
- no multiplayer transport;
- no AI opponent behavior;
- no claim that the current docs are tournament-complete.

Hard rules:
- Errata overrides base rules.
- Image-only PDFs require manual/source verification and open verification tracking.
- OCR working copies may accelerate search and drafting, but they do not replace the original source PDFs and errata.
- Markdown rule summaries are working knowledge, not authority.
- Rule accuracy beats implementation convenience.
- Hidden information is required for local gameplay, hotseat, replay, future multiplayer, and future AI fairness.
- P1 cannot be marked complete until the user approves it before P2 begins.

## Shared P1 Facts

- Default format: `standard-200`.
- Players: `2`.
- Points: `200` per army.
- Corps: `3` per army.
- Camp: mandatory.
- Standard 6-15 mm battlefield: `120 cm x 80 cm`.
- Scale: `1 UD = 4 cm`.
- P0 test harness exists: `npm run test`.
- Build command exists: `npm run build`.
- JavaScript target: under `800` lines per file; `1000` lines is the maximum without explicit approval and a refactor plan.
- Hidden information areas: battle plans, ambushes, fake markers, flank marches, reveal triggers, player-view state, replay visibility, and future multiplayer privacy.

## Phase Status

- [x] P0 accepted complete by user
- [x] P1 approved for implementation
- [x] P1 implementation started
- [x] Rule-source inventory completed
- [x] Rule docs workflow established
- [x] Standard 200 profile reviewed
- [x] Data separation blueprint reviewed
- [x] Setup state-machine plan reviewed
- [x] Hidden-information model reviewed
- [x] Foundation test/data validation strategy selected
- [x] P1 demonstrated to user
- [x] P1 approved complete by user

## Definition Of Done

P1 is done when:

- [x] `docs/rules/index.md` explains the rule-doc structure, source-reference format, and open-verification workflow.
- [x] First extracted summaries exist or are expanded for P2-P4 planning areas.
- [x] `docs/rules/standard-200.md`, `docs/rules/sequence-of-play.md`, `docs/rules/terrain-and-setup.md`, and `docs/rules/hidden-info.md` are reviewed enough to guide P2-P4.
- [x] Unit-level match state is documented separately from movement, combat, terrain, command, and army-list rule tables.
- [x] Standard 200 data requirements are captured: 200 points, 3 corps, mandatory camp, table profile, commander/camp budget, and initiative inputs.
- [x] Hidden information is documented as a local gameplay and player-view concern.
- [x] Open verification items are recorded for source gaps and image-only PDF sections.
- [x] `npm run test` can run at least one foundation or placeholder validation test.
- [x] `npm run build` passes.
- [x] File-size guard convention is documented.
- [x] Roadmap and this board reflect final P1 status.
- [x] User approves P1 before P2 begins.

## Execution Cards

### [x] P1-00 - Phase Preflight And Source Inventory

Goal: start P1 from a known repository state and create a reliable source inventory before changing rule docs.

Planned files:
- `P1_todo.md`
- `roadmap.md`
- optional source-inventory notes in `docs/rules/index.md` or `docs/rules/open-verification.md`

Implementation steps:
1. Run `git status --short --branch`.
2. Confirm the active branch or create/switch to `docs/p1-rule-data-foundation` if implementation is approved.
3. Confirm P0 is accepted complete by the user and update phase status only if needed.
4. Verify source files exist under `Konzepte/`.
5. Identify which sources are text-readable, spreadsheet-readable, image-only, or manual-verification-only.
6. Confirm current rule-doc files under `docs/rules/`.
7. Record missing source-access blockers or OCR caveats in `docs/rules/open-verification.md`.

Non-goals:
- no rule interpretation beyond source inventory;
- no data schema design yet;
- no test harness changes.

Validation:
- `git status --short --branch`
- source-file existence check
- `npm run build` only if docs tooling or imports are touched

Manual acceptance:
- user confirms P1 may proceed and the listed source-access limitations are accurate.

Stop condition:
- required source documents are missing or unreadable in a way that blocks P1 planning.

Expected result: P1 begins with explicit branch, source availability, OCR helper policy, and known verification limits.

Completed 2026-05-14:
- Confirmed the current working branch is still `feature/p0-shell-planning`; the intended dedicated P1 docs branch remains `docs/p1-rule-data-foundation` for later branch cleanup if desired.
- Verified all expected source files exist in `Konzepte/`: `Errata_ADG_V4_English.pdf`, `Rules.pdf`, `ArmyLists1-82.pdf`, `Army_list_spreadsheet_V4 (1).xlsx`, `Reglettes.pdf`, `Konzept.pdf`, and the new OCR helper `merged.pdf`.
- Recorded the practical source-reading status: errata and concept are text-readable, the spreadsheet is readable through spreadsheet tooling, reglettes are partial, rules and army lists remain effectively image-based for normal extraction, and `merged.pdf` is a helpful but imperfect OCR copy.
- Updated the rule-doc workflow so `merged.pdf` is treated as a search/extraction aid only, with mandatory fallback to the authoritative originals and errata whenever OCR wording, table layout, diagrams, or ordering are unclear.
- Updated `docs/rules/open-verification.md` with the source inventory snapshot and OCR caveat policy instead of treating OCR uncertainty as a hard blocker.

Source material checked:
- `Konzepte/Errata_ADG_V4_English.pdf`
- `Konzepte/Rules.pdf`
- `Konzepte/ArmyLists1-82.pdf`
- `Konzepte/Army_list_spreadsheet_V4 (1).xlsx`
- `Konzepte/Reglettes.pdf`
- `Konzepte/Konzept.pdf`
- `Konzepte/merged.pdf`
- `docs/rules-knowledge.md`
- `docs/rules/index.md`
- `docs/rules/open-verification.md`

Agent validated:
- `git status --short --branch`
- source-file existence check in `Konzepte/`
- VS Code Problems on touched planning/rules files

Manual acceptance:
- user confirms the OCR-helper policy is acceptable: prefer `merged.pdf` for search speed, but fall back to the authoritative originals and errata whenever OCR quality is uncertain;
- user confirms P1 may continue using the current OCR helper until a cleaner OCR scan is added later.

Still open:
- next card is `P1-01 - Rules Structure And Verification Workflow`.

### [x] P1-01 - Rules Structure And Verification Workflow

Goal: make `docs/rules/` the stable AI-readable working area with a clear source-reference and open-verification workflow.

Planned files:
- `docs/rules/index.md`
- `docs/rules/open-verification.md`
- `docs/rules/errata.md`
- `docs/rules-knowledge.md`

Implementation steps:
1. Review current `docs/rules/index.md` and `docs/rules-knowledge.md` if they exist.
2. Define a compact extraction-entry format: status, source references, summary, engine invariants, data needs, tests, open verification.
3. Clarify that extracted markdown must not copy long copyrighted rulebook passages.
4. Add source priority and errata-overrides-rulebook language if missing.
5. Ensure `docs/rules/open-verification.md` is the single tracker for unresolved source checks.
6. Add or refine first errata summary structure without implementing affected rules.

Non-goals:
- no complete rulebook transcription;
- no official legality claims from unverified summaries;
- no movement, setup, or combat implementation.

Validation:
- markdown review for broken internal links;
- `npm run build` if documentation is imported or rendered by the app;
- VS Code Problems on touched markdown files.

Manual acceptance:
- user reviews the extraction workflow and confirms it is strict enough for later implementation.

Stop condition:
- source-reference format cannot distinguish verified facts from planning assumptions.

Expected result: rule docs have a repeatable workflow for source-backed summaries and unresolved verification.

Completed 2026-05-14:
- Tightened `docs/rules/index.md` so it now acts as the canonical rules-workspace policy: source authority, OCR-helper limits, status labels, minimum rule-entry fields, and verification workflow are all explicit.
- Expanded `docs/rules/open-verification.md` into the single repository tracker for unresolved rule-source questions, with a compact entry format and shared status labels.
- Strengthened `docs/rules/errata.md` with explicit extraction rules and a small errata-entry format so future summaries stay concise and source-safe.
- Updated `docs/rules-knowledge.md` so its rule-entry template matches the stricter status labels and references the central open-verification tracker.

Source material checked:
- `docs/rules/index.md`
- `docs/rules/open-verification.md`
- `docs/rules/errata.md`
- `docs/rules-knowledge.md`
- OCR-helper policy from `Konzepte/merged.pdf`

Agent validated:
- `npm run build`
- VS Code Problems on touched markdown files

Manual acceptance:
- user reviews whether the status labels and entry format are strict enough to distinguish verified, OCR-assisted, unresolved, and errata-sensitive rule notes;
- user confirms `docs/rules/open-verification.md` should remain the only central unresolved-source tracker.

Still open:
- next card is `P1-02 - Standard 200 Profile And Format Facts`.

### [x] P1-02 - Standard 200 Profile And Format Facts

Goal: expand the `standard-200` profile enough to guide P2-P4 and later army-builder work without claiming complete roster validation.

Planned files:
- `docs/rules/standard-200.md`
- `docs/rules/open-verification.md`
- `docs/architecture.md` if profile boundaries need clarification
- `roadmap.md` if P1 status changes

Implementation steps:
1. Check `Konzepte/Errata_ADG_V4_English.pdf` for Standard 200 or setup corrections.
2. Check `Konzepte/Rules.pdf` budget and setup sections by manual/source review.
3. Check `Konzepte/Army_list_spreadsheet_V4 (1).xlsx` Standard format sheets or fields for cross-checkable data.
4. Document required Standard 200 fields: points, player count, corps count, commander structure, mandatory camp, table profile, UD, initiative inputs, commander/camp budget hooks.
5. Separate verified facts from open verification.
6. Add explicit data-profile naming: `standard-200`, battlefield profile, and ruleset version.
7. Add test ideas for future schema validation.

Non-goals:
- no army-list import;
- no roster calculator;
- no UI selector beyond documenting requirements;
- no alternate formats except as later variants.

Validation:
- `npm run build` if touched docs are rendered or imported by the app;
- manual consistency check against `roadmap.md` P1 success criteria;
- VS Code Problems on touched markdown files.

Manual acceptance:
- user confirms the Standard 200 facts and open verification list are sufficient before P3/P11 planning depends on them.

Stop condition:
- commander/camp budget or format table facts cannot be verified and must remain blocking open items.

Expected result: Standard 200 has a clear data-requirements profile with source status and unresolved checks.

Completed 2026-05-14:
- Expanded `docs/rules/standard-200.md` from a short planning note into a clearer format-profile document with source status, required profile fields, verified planning facts, engine invariants, and data-separation implications.
- Recorded that the spreadsheet contains an explicit `Standard format (200 pts)` worksheet, which confirms a structured source surface for the format even though exact values still need tighter rulebook confirmation.
- Kept exact budget-table and setup-sensitive details in `docs/rules/open-verification.md` instead of overstating them as verified.
- Added explicit Standard 200 open-verification items for budget-table values, initiative inputs, and commander-exception questions that affect later P3/P11 work.

Source material checked:
- `docs/rules/standard-200.md`
- `docs/rules/open-verification.md`
- `Konzepte/Errata_ADG_V4_English.pdf`
- `Konzepte/Rules.pdf`
- `Konzepte/Army_list_spreadsheet_V4 (1).xlsx` worksheet names
- OCR-helper policy from `Konzepte/merged.pdf`

Agent validated:
- `npm run build`
- VS Code Problems on touched markdown files

Manual acceptance:
- user reviews whether the `standard-200` profile now names the right required fields for later setup and army-builder work without pretending exact budget values are already settled;
- user confirms the remaining budget and initiative questions should stay in `docs/rules/open-verification.md` until directly verified.

Still open:
- next card is `P1-03 - Unit, Roster, And Rule-Table Data Separation Blueprint`.

### [x] P1-03 - Unit, Roster, And Rule-Table Data Separation Blueprint

Goal: document how unit definitions, unit instances, rosters, format profiles, and rule tables stay separate before engine code grows.

Planned files:
- `docs/architecture.md`
- `docs/rules/index.md`
- possible new rule-planning file under `docs/rules/`, such as `units-and-bases.md`
- `docs/project-governance.md` if ownership rules need tightening

Implementation steps:
1. Review architecture sections for `state`, `data`, rule tables, and engine module ownership.
2. Define unit definition fields: troop type, quality, armor/protection, abilities, base profile, cost hooks, source refs.
3. Define unit instance fields: id, owner, corps, current pose, cohesion/status, command state, visibility state, selected options, current battlefield state.
4. Define roster fields: army list id, selected units, corps assignment, commanders, camp choice, points, validation results.
5. Define global rule tables: movement allowances, command, terrain, combat, ZOC, conformation, setup, army-list constraints.
6. State that UI labels and rendering assets never decide rule legality.
7. Add examples as small pseudo-shapes, not implementation code.

Non-goals:
- no TypeScript migration;
- no JSON schemas unless explicitly approved during the card;
- no army-list conversion;
- no movement or combat table extraction beyond naming responsibilities.

Validation:
- consistency check against `docs/architecture.md` module responsibilities;
- `npm run build` if docs are imported;
- VS Code Problems on touched files.

Manual acceptance:
- user confirms the data separation is strict enough for P2-P4 and later army-builder work.

Stop condition:
- unit instance state starts duplicating rule-table facts such as movement distances or combat factors.

Expected result: future code has a documented boundary between mutable match state, roster selection, and authoritative rule data.

Completed 2026-05-14:
- Expanded `docs/architecture.md` so the data-model blueprint now names the strict split between `FormatProfile`, `Roster`, `UnitDefinition`, `UnitInstance`, `BaseProfile`, and global `RuleTables`.
- Added `docs/rules/units-and-bases.md` as a focused planning blueprint for unit identity, base-size ownership, roster boundaries, mutable match state, and shared rule tables.
- Explicitly documented which facts are allowed on a live unit instance and which must stay in shared data or rule tables, with examples and non-examples.
- Clarified that point caps, battlefield profile rules, movement allowances, combat factors, and setup restrictions must not be duplicated onto live units as authoritative state.

Source material checked:
- `docs/architecture.md`
- `docs/rules/index.md`
- `docs/rules/units-and-bases.md`
- `docs/project-governance.md`

Agent validated:
- `npm run build`
- VS Code Problems on touched markdown files

Manual acceptance:
- user reviews whether the split between `UnitDefinition`, `UnitInstance`, `Roster`, `FormatProfile`, and `RuleTables` is sharp enough for later P2-P4 and P11 work;
- user confirms that movement allowances, combat factors, and format constraints should stay out of live unit-instance state.

Still open:
- next card is `P1-04 - Sequence-Of-Play And Setup State-Machine Plan`.

### [x] P1-04 - Sequence-Of-Play And Setup State-Machine Plan

Goal: define the official setup and turn-flow plan as explicit states before P3 setup or P4 movement starts.

Planned files:
- `docs/rules/sequence-of-play.md`
- `docs/rules/terrain-and-setup.md`
- `docs/rules/hidden-info.md`
- `docs/rules/open-verification.md`
- `docs/architecture.md` if lifecycle language needs refinement

Implementation steps:
1. Check errata for setup, ambush, hesitant corps, deployment, or sequence corrections.
2. Review `Konzepte/Rules.pdf` setup and command/turn sections by manual/source verification.
3. Document setup states from format selection through start battle.
4. For each setup state, record owner, public/private data, required input, locked output, next-state condition, and open verification.
5. Document turn-loop phases at planning level and mark exact phase names/order as open until verified.
6. Add transition invariants: no skipped required decisions, no late mutation of locked decisions, every transition logged.
7. Identify P3 dependencies and P4 command-context dependencies.

Non-goals:
- no setup reducer implementation;
- no terrain placement validator;
- no deployment UI;
- no command-point implementation.

Validation:
- state list cross-check against `roadmap.md` P3 and P4 dependencies;
- `npm run build` if docs are rendered;
- VS Code Problems on touched markdown files.

Manual acceptance:
- user reviews the setup state-machine plan and confirms it is ready to guide P3 planning.

Stop condition:
- exact official setup order is unclear enough that P3 cannot safely proceed without additional manual source review.

Expected result: setup and turn flow are represented as explicit states with known public/private data boundaries.

Completed 2026-05-14:
- Expanded `docs/rules/sequence-of-play.md` from a simple ordered list into a setup state-machine planning document with explicit state names, owners, public/private data boundaries, required inputs, locked outputs, transition conditions, and linked open-verification notes.
- Added turn-loop planning states so later P4-P10 phases have a lifecycle skeleton without pretending the exact official names and order are already fully verified.
- Extended `docs/rules/terrain-and-setup.md` so terrain, camps, battle plans, ambushes, deployment, and dismounting are tied to specific setup states instead of one freeform setup editor.
- Extended `docs/rules/hidden-info.md` with a setup-state visibility map so hidden information is modeled as part of the setup sequence, not only as a later gameplay concern.
- Added explicit P1-04 sequence and transition questions to `docs/rules/open-verification.md` instead of burying them only in area-specific docs.

Source material checked:
- `docs/rules/sequence-of-play.md`
- `docs/rules/terrain-and-setup.md`
- `docs/rules/hidden-info.md`
- `docs/rules/open-verification.md`
- OCR-helper policy from `Konzepte/merged.pdf`

Agent validated:
- `npm run build`
- VS Code Problems on touched markdown files

Manual acceptance:
- user reviews whether the setup sequence now reads like an explicit state machine rather than a loose checklist;
- user confirms the public/private visibility boundaries are explicit enough for P3 planning without pretending exact rulebook wording is already settled.

Still open:
- next card is `P1-05 - Terrain/Setup Knowledge Skeleton And P3 Blockers`.

### [x] P1-05 - Terrain/Setup Knowledge Skeleton And P3 Blockers

Goal: expand terrain and setup notes enough to identify P3 data needs, source gaps, and verification blockers.

Planned files:
- `docs/rules/terrain-and-setup.md`
- `docs/rules/open-verification.md`
- `docs/rules/standard-200.md`
- `roadmap.md` if P3 dependency notes need refinement

Implementation steps:
1. Check errata for terrain, setup, deployment, camp, fortification, obstacle, and ambush corrections.
2. Review `Konzepte/Rules.pdf` terrain and setup pages by manual/source verification.
3. Document terrain definition fields needed later: type, category, region availability, compulsory status, size bounds, placement order, constraints, road/river interactions, effects, ambush permissions, source refs.
4. Document setup object fields needed later: camps, fortified or sacred camps, fortifications, obstacles, deployment zones, battle plans, ambush markers, flank marches, dismounting.
5. Mark exact terrain tables, dimensions, and restrictions as verified or open.
6. Add P3-specific blockers to `docs/rules/open-verification.md`.

Non-goals:
- no terrain placement implementation;
- no rendered map interaction;
- no terrain movement/combat effects implementation;
- no official deployment-zone math implementation.

Validation:
- cross-check with `roadmap.md` P3 success criteria;
- `npm run build` if docs are rendered;
- VS Code Problems on touched markdown files.

Manual acceptance:
- user confirms the P3 blockers are explicit and no unverified setup fact is being treated as implemented.

Stop condition:
- terrain/setup source verification cannot identify enough fields to plan P3 safely.

Expected result: P3 has a documented terrain/setup knowledge skeleton and a precise blocker list.

Completed 2026-05-14:
- Expanded `docs/rules/terrain-and-setup.md` from a short planning note into a clearer P3 knowledge skeleton with terrain object families, terrain instance fields, setup object fields, explicit P3 data requirements, and a blocker summary.
- Added explicit blocker entries to `docs/rules/open-verification.md` for region tables and quotas, terrain size and placement geometry, camps or fortifications or obstacles, and official deployment-zone math.
- Added a short linkage note in `docs/rules/standard-200.md` so Standard 200 format assumptions do not get mistaken for already verified terrain or deployment rules.
- Kept all exact geometry, counts, and placement restrictions open rather than overstating them as settled facts.

Source material checked:
- `docs/rules/terrain-and-setup.md`
- `docs/rules/open-verification.md`
- `docs/rules/standard-200.md`
- OCR-helper policy from `Konzepte/merged.pdf`

Agent validated:
- `npm run build`
- VS Code Problems on touched markdown files

Manual acceptance:
- user reviews whether the terrain and setup documents now identify the right P3 data buckets and blocker list;
- user confirms that deployment-zone math and terrain-placement details should remain blocked until directly verified from authoritative sources.

Still open:
- next card is `P1-06 - Hidden-Information And Player-View Model`.

### [x] P1-06 - Hidden-Information And Player-View Model

Goal: define hidden information as a local gameplay, replay, future multiplayer, and AI-fairness requirement.

Planned files:
- `docs/rules/hidden-info.md`
- `docs/rules/sequence-of-play.md`
- `docs/rules/open-verification.md`
- `docs/architecture.md`

Implementation steps:
1. Check errata for ambush, flank march, hesitant corps, reveal, and private-declaration clarifications.
2. Review `Konzepte/Rules.pdf` battle plan, ambush, deployment, and flank march sections by manual/source verification.
3. Define canonical state versus player-visible state.
4. Identify private data classes: battle plans, ambush contents, fake markers, flank marches, off-table units, reveal state, replay visibility.
5. Define visibility modes: owner view, opponent view, hotseat handoff, omniscient judge/replay, player-view replay, future AI view.
6. Document reveal events as explicit actions or system events.
7. Add future test requirements for visibility filtering and AI fairness.

Non-goals:
- no visibility engine implementation;
- no multiplayer sync;
- no AI behavior;
- no UI privacy handoff implementation.

Validation:
- consistency check against `docs/architecture.md` visibility, replay, multiplayer, and AI responsibilities;
- `npm run build` if docs are rendered;
- VS Code Problems on touched markdown files.

Manual acceptance:
- user confirms hidden information is modeled early enough for local play and not postponed as only a multiplayer problem.

Stop condition:
- source review cannot distinguish public, private, revealable, and replay-visible data for setup decisions.

Expected result: hidden information has a documented state/view model that P3 and later phases can follow.

Completed 2026-05-15:
- Expanded `docs/rules/hidden-info.md` into a clearer player-view planning document with canonical-versus-visible state, visibility modes, data-class policies, reveal event structure, and future hidden-info test requirements.
- Expanded `docs/architecture.md` with explicit visibility boundary rules plus planning shapes for `VisibilityState` and `PlayerView`.
- Tightened `docs/rules/sequence-of-play.md` so setup-state outputs keep visibility-scoped hidden information through the handoff into battle.
- Added explicit hidden-information open-verification items for roster-disclosure timing, reveal trigger sets, and explanation-surface leakage risk.

Source material checked:
- `docs/rules/hidden-info.md`
- `docs/rules/sequence-of-play.md`
- `docs/rules/open-verification.md`
- `docs/architecture.md`
- OCR-helper policy from `Konzepte/merged.pdf`

Agent validated:
- `npm run build`
- VS Code Problems on touched markdown files

Manual acceptance:
- user reviews whether canonical state versus player-view state is explicit enough for hotseat, replay, future multiplayer, and AI fairness;
- user confirms hidden-data explanations should be treated as a leak surface, not only the raw battlefield objects.

Still open:
- next card is `P1-07 - Foundation Test And Data Validation Strategy`.

### [x] P1-07 - Foundation Test And Data Validation Strategy

Goal: select and document the first testing approach for rule/data foundations while preserving the existing P0 test harness.

Planned files:
- `package.json`
- `src/state/p0-state.test.js` only if a minimal compatibility check is needed
- possible new focused test file under `src/` if approved
- `docs/project-governance.md`
- `docs/architecture.md`

Implementation steps:
1. Confirm existing scripts: `npm run test` and `npm run build`.
2. Decide whether P1 needs a placeholder foundation test, a data-shape test, or documentation-only validation.
3. If adding a test, keep it narrow and non-rule-claiming, such as verifying the current harness can run or validating a small documented profile fixture.
4. Document future validation layers: schema checks, source-reference checks, golden examples, visibility tests, deterministic reducer tests.
5. Ensure file-size guard convention is documented: target under `800` JS lines, hard stop at `1000` without approval/refactor.
6. Run the selected commands.

Non-goals:
- no broad test framework migration;
- no official rules fixture unless source-verified;
- no generated army-list validation;
- no browser automation unless a UI change is introduced.

Validation:
- `npm run test`
- `npm run build`
- VS Code Problems on touched files

Manual acceptance:
- user confirms the initial foundation validation approach is sufficient for P1 and does not overstate rule completeness.

Stop condition:
- test command cannot run or adding a foundation test would require unapproved framework churn.

Expected result: the project has a runnable foundation validation path and documented test strategy for later data-heavy phases.

Completed 2026-05-15:
- Kept the existing `npm run test` Node-based harness as the intentional baseline instead of introducing new framework churn during P1.
- Documented the current baseline commands and P1 testing policy in `docs/project-governance.md`, including the rule that unverified extracts must not be turned into authoritative legality tests.
- Expanded `docs/project-governance.md` with an explicit growth order for validation layers: baseline scripts, pure logic tests, data-shape checks, source-reference checks, golden examples, visibility tests, and browser smoke.
- Added the corresponding validation-layer framing to `docs/architecture.md` so testing stays aligned with engine modularity.

Source material checked:
- `package.json`
- `docs/project-governance.md`
- `docs/architecture.md`
- current `npm run test` baseline

Agent validated:
- `npm run test`
- `npm run build`
- VS Code Problems on touched files

Manual acceptance:
- user reviews whether preserving the current small test harness is the right tradeoff for P1;
- user confirms the documented validation-layer growth order matches how later phases should add checks.

Still open:
- next card is `P1-08 - P1 Review Handoff And P2 Readiness Gate`.

### [x] P1-08 - P1 Review Handoff And P2 Readiness Gate

Goal: close P1 cleanly, update durable planning state, and make P2 readiness explicit without starting P2.

Planned files:
- `P1_todo.md`
- `roadmap.md`
- `docs/rules/open-verification.md`
- any P1-touched docs requiring final status notes

Implementation steps:
1. Review every P1 card and mark completed items only when validation and handoff are done.
2. Confirm P1 success criteria from `roadmap.md` are satisfied or explicitly blocked.
3. Update `roadmap.md` P1 status and P2 dependencies only after user-visible P1 work is complete.
4. Summarize source checks performed and unresolved open verification.
5. Confirm P2 readiness requirements: geometry scope, unit/base shape assumptions, source refs that affect geometry, expected tests.
6. Run final validation commands.
7. Stop for user approval before any P2 planning or implementation.

Non-goals:
- no P2 execution board unless the user explicitly asks;
- no geometry implementation;
- no setup, movement, or terrain implementation.

Validation:
- `npm run test`
- `npm run build`
- final `git status --short`
- VS Code Problems on touched files

Manual acceptance:
- user reviews P1 docs, open verification, and P2 readiness notes;
- user explicitly approves P1 complete before P2 begins.

Stop condition:
- any P1 success criterion remains unresolved without being documented as a blocker or open verification item.

Expected result: P1 ends with documented rule/data foundations, passing validation, clear open verification, and an explicit user gate before P2.

Completed 2026-05-15:
- Reviewed the completed P1 card set against the roadmap success criteria and kept the status truthful: P1 work is ready for user review, but not yet marked user-approved.
- Updated the board phase status so the completed P1 documentation slices are visible without falsely claiming final acceptance.
- Added explicit P2 readiness notes to the open-verification tracker so the next phase starts from a disciplined geometry boundary.
- Kept the durable roadmap in a review-ready state instead of advancing to P2 automatically.

P1 success criteria review:
- satisfied: AI-readable rules workspace and workflow are in place;
- satisfied: `standard-200`, sequence-of-play, terrain/setup, and hidden-info planning docs exist and are expanded enough to guide P2-P4;
- satisfied: unit state, roster, format, and rule-table separation is documented;
- satisfied: OCR-helper policy and open-verification workflow are documented;
- satisfied: `npm run test` and `npm run build` exist and pass as the current foundation validation baseline;
- still gated by user approval: P1 cannot be treated as complete for phase progression until the user explicitly approves it.

P2 readiness summary:
- P2 may start only after user approval of P1;
- P2 geometry can proceed without waiting for the current setup, terrain, or hidden-info open items, because those do not block rotated-rectangle geometry primitives;
- P2 should treat unit footprints as geometry-first rectangles driven by `BaseProfile` dimensions, independent of later sprite or terrain systems;
- P2 should start with pure functions and tests for center, corners, facing, and front/flank/rear relationships before any P3 or P4 coupling.

Source material checked:
- `roadmap.md`
- `docs/rules/open-verification.md`
- `P1_todo.md`

Agent validated:
- `npm run test`
- `npm run build`
- `git status --short`
- VS Code Problems on touched files

Manual acceptance:
- user reviews the P1 handoff, remaining open verification, and P2 readiness summary;
- user explicitly approves P1 complete before any P2 planning or implementation begins.

Still open:
- no further P1 implementation cards;
- P2 execution-board drafting and approval remain separate next steps.