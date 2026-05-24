# Open Rule Verification

This file tracks rule areas that must be checked directly against the source documents before implementation.

## How To Use This File

- This is the single tracker for unresolved rule-source questions in the repository.
- Add an item here whenever a rule summary depends on OCR help, uncertain page ordering, unclear diagrams, conflicting wording, or missing page references.
- Close an item only after the relevant authoritative source and errata have been checked directly.
- Do not leave unresolved rule uncertainty only inside feature docs such as `movement.md` or `terrain-and-setup.md`; link back here instead.

## Status Labels

- `open`: unresolved source question still blocks or weakens confidence.
- `ocr-check`: OCR helper text exists, but authoritative confirmation is still required.
- `errata-check`: base rule and errata interaction still needs direct confirmation.
- `resolved`: checked against the authoritative source and no longer blocks planning.

## Entry Format

Use this compact entry format for new items:

```markdown
- ID: setup.sequence.order
	Status: open | ocr-check | errata-check | resolved
	Area: setup | movement | zoc | charge | combat | army-lists | hidden-info
	Sources: Rules.pdf p.X, Errata_ADG_V4_English.pdf p.Y, merged.pdf helper
	Question: ...
	Why it matters: ...
	Next check: ...
```

## High Priority

- Standard 200-point profile: 200 points, three corps, mandatory camp, commander/camp budget, standard battlefield profile, and initiative inputs.
- Sequence of play and exact phase names.
- Complete pre-battle sequence: initiative, attacker/defender, region, terrain, terrain adjustment, camps/fortifications, battle plan, ambushes, deployment, dismounting, start battle.
- Terrain placement procedure: regions, compulsory terrain, selection quotas, legal terrain shapes, deployment zones, camps, fortifications, obstacles, roads, rivers, hills, and villages.
- Hidden information: battle plans, ambush contents, fake markers, flank marches, reveal triggers, hotseat player views, replay visibility.
- Deployment: corps zones, command range at deployment, commander placement, visible/off-table forces, dismounting order.
- Movement allowance table by troop type, terrain, road, and special state.
- Wheel, slide, turn, extension, contraction, interpenetration, and difficult maneuver restrictions.
- ZOC definition, exceptions, most-threatening enemy tie breakers, and ZOC movement permissions.
- Charge declaration, contact type, charge range, minimum advance, evade, and reaction rules.
- Conformation diagrams, shifting restrictions, incomplete conformation, already-in-contact cases, and errata amendments.
- Shooting ranges, line of sight, cover, terrain effects, target priorities, and results.
- Melee combat factors, support, multiple attacks, terrain penalties, abilities, quality, cohesion loss, and errata amendments.
- Rout, pursuit, rally, army cohesion, victory, and end-game conditions.
- Army list data conversion from printed lists and spreadsheet formulas.

## P4 Handoff Note

- P4 is accepted complete as a movement-command foundation only.
- Remaining post-P4 rule blockers were carried into later phases and must stay source-explicit here until verified: movement allowances by troop type, terrain movement effects, wheel/slide/turn edge cases beyond the approved subset, broader ZOC legality interpretation, group movement, difficult maneuvers, special troop exceptions, charge, and conformation.

## P5 Handoff Note

- P5 is accepted complete as a conservative ZOC + movement-legality foundation, including implemented active-player ownership and movement-phase gating plus display-only diagnostics overlays.
- Unresolved source-sensitive ZOC/movement interpretation items in this file remain open by design and must continue to surface as `needs-source-check` rather than being treated as tournament-complete coverage.

## Source Extraction Notes

- `Rules.pdf` and `ArmyLists1-82.pdf` produced almost no usable text through normal PDF extraction.
- `merged.pdf` is now available as an OCR working copy, but it is in the wrong internal order with army lists before rules and may contain OCR errors.
- OCR-derived facts from `merged.pdf` must be treated as helper text until confirmed against `Rules.pdf`, `ArmyLists1-82.pdf`, and `Errata_ADG_V4_English.pdf`.
- Rendered visual page sheets exist in the temporary extraction folder from the initial architecture pass, but durable rule summaries must be written here before implementation relies on them.
- Errata text was readable and should be summarized into `errata.md` before implementing affected systems.

## SOCR-04 Corpus Checkpoint

- `docs/source/rules.md` is the first planning lookup for rule areas, but it does not by itself clear implementation blockers.
- `docs/source/army-lists.md` is the first planning lookup for list data, allies, replacements, and list notes, but it does not by itself clear implementation blockers.
- This file remains the authoritative blocker ledger for both corpus files.
- Preferred local workflow: corpus section first, blocker check second, phase-planning decision third.

## P1-00 Source Inventory Snapshot

- Available authoritative sources in `Konzepte/`: `Errata_ADG_V4_English.pdf`, `Rules.pdf`, `ArmyLists1-82.pdf`, `Army_list_spreadsheet_V4 (1).xlsx`, `Reglettes.pdf`, `Konzept.pdf`, `Reference_Sheet_V4.pdf`.
- Available OCR helper in `Konzepte/`: `merged.pdf`.
- Current practical reading status:
	- `Errata_ADG_V4_English.pdf`: text-readable.
	- `Konzept.pdf`: text-readable.
	- `Army_list_spreadsheet_V4 (1).xlsx`: spreadsheet-readable.
	- `Reglettes.pdf`: partially text-readable.
	- `Reference_Sheet_V4.pdf`: tournament quick-reference source, currently not text-readable through the available local tools; use as a manual cross-check, not as an override over errata or the full rulebook.
	- `Rules.pdf`: effectively image-based for normal extraction.
	- `ArmyLists1-82.pdf`: effectively image-based for normal extraction.
	- `merged.pdf`: OCR-searchable helper with wrong section order and imperfect accuracy.
- No source file is missing, but OCR uncertainty remains an open verification concern rather than a blocker.

	SOCR-04 corpus usage checkpoint:

	- `docs/source/rules.md` and `docs/source/army-lists.md` now exist as the planning-first corpus layer.
	- Open verification items in this file remain the authoritative blocker list for corpus sections that are still `ocr-assisted`, `ocr-check`, or otherwise unsafe for implementation.
	- When a corpus entry is sharpened enough to retire a blocker, close the blocker here rather than only updating the corpus prose.

## P3-00 Reference Sheet And Tournament Setup Notes

- ID: setup.reference-sheet-v4-cross-check
	Status: open
	Area: setup
	Sources: `Reference_Sheet_V4.pdf`, `Rules.pdf`, `Errata_ADG_V4_English.pdf`
	Question: which setup, terrain, deployment, ambush, flank-march, and battle-plan details from the tournament reference sheet should be used as quick-reference confirmations for P3?
	Why it matters: the reference sheet is used in tournament practice, but it must cross-check rather than override the full rules and errata.
	Next check: manually compare the reference sheet against the setup and terrain sections before implementing any official setup validator.

- ID: setup.tournament-battle-plan-board
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf`, `Reference_Sheet_V4.pdf`, tournament practice note from user
	Question: what exact official meaning and timing attach to the tournament battle-plan sheet, including left/center/right corps assignment, flank march assignment, and ambush marker contents?
	Why it matters: P3 should model the practical battle-plan UI as private setup data without confusing its three sectors with battlefield terrain/deployment sectors.
	Next check: verify battle-plan, ambush, and flank-march wording against the rulebook, errata, and reference sheet.

- ID: setup.deployment-corps-relative-and-overlap
	Status: open
	Area: setup
	Sources: `Rules.pdf`, `Reference_Sheet_V4.pdf`, `Errata_ADG_V4_English.pdf`
	Question: what exact constraints govern corps relative deployment, unit overlap prevention, ambush/off-table exceptions, commander placement, and legal zone membership during deployment?
	Why it matters: P3 can add placeholder non-overlap and footprint hooks, but official deployment validators need exact source wording before claiming legality.
	Next check: verify deployment and battle-plan sections directly against source PDFs and errata.

- ID: hidden-info.multiplayer-secret-battle-plan
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf`, `Reference_Sheet_V4.pdf`, future multiplayer visibility policy
	Question: exactly which battle-plan, flank-march, ambush, fake-marker, and off-table facts must remain secret in player views and multiplayer payloads, and when do they become public?
	Why it matters: future multiplayer must not accidentally serialize private setup truth to the opponent.
	Next check: verify setup disclosure, reveal, ambush, and flank-march wording, then map each hidden data class to a visibility rule.

## P1-02 Standard 200 Notes

- ID: standard-200.budget-table.values
	Status: errata-check
	Area: setup
	Sources: `docs/source/Rules_v2.md` `rv2.budget-and-force-costing`, `Rules_Color_300DPI.pdf` p.81, `docs/source/rules-v2-examples/rv2-p81-budget-commander-camp-a.png`, `Army_list_spreadsheet_V4 (1).xlsx` `Standard format (200 pts)` sheet
	Question: can the scan-confirmed p.81 commander/camp table values be imported directly as canonical Standard 200 profile data after spreadsheet and errata cross-check?
	Why it matters: P3 and P11 cannot safely validate camps or roster spending without the exact table values.
	Next check: treat p.81 as the working baseline and keep this open only for exact table transcription plus spreadsheet and errata confirmation.

- ID: army-budget.core-vs-optional-profile-boundary
	Status: errata-check
	Area: setup
	Sources: `docs/source/Rules_v2.md` `rv2.budget-and-force-costing` and `rv2.optional-rules-and-variants`, `Rules_Color_300DPI.pdf` p.81-85, `Errata_ADG_V4_English.pdf`, `docs/rules/standard-200.md`
	Question: does any errata or later planning need alter the working boundary that p.81 is core Standard 200 while p.82-85 are optional or variant overlays?
	Why it matters: AdG Online must not silently mix optional-rule packages into the default tournament target when building format profiles or UI defaults.
	Next check: use the p.81 versus p.82-85 split as the working baseline and keep this item open only for explicit variant-profile mapping.

- ID: standard-200.initiative-inputs
	Status: errata-check
	Area: setup
	Sources: `docs/source/Rules_v2.md` `rv2.setup-terrain-selection-and-placement`, `Rules_Color_300DPI.pdf` p.73, `Errata_ADG_V4_English.pdf`
	Question: do errata or later setup details alter the scan-confirmed initiative baseline of commander-value sum, strategist bonus, scouting, capped differential, and opposed `D6` roll before attacker/defender and region choice?
	Why it matters: P3 setup flow and later deterministic setup state need the exact pre-battle input model.
	Next check: use p.73 initiative as the baseline and keep this open only for exact scouting proportions and manual acceptance.

- ID: standard-200.commander-exceptions
	Status: open
	Area: army-lists
	Sources: `Rules.pdf`, `ArmyLists1-82.pdf`, `Army_list_spreadsheet_V4 (1).xlsx`
	Question: are there any Standard 200 exceptions or special interactions for allied or unreliable commanders that affect required data fields?
	Why it matters: P1 should not overstate the commander structure if later list validation needs special cases.
	Next check: cross-check army-list and spreadsheet notes against the authoritative printed or PDF source.

- ID: army-lists.index-pdf-spreadsheet-row-drift
	Status: ocr-check
	Area: army-lists
	Sources: `ArmyLists1-82.pdf`, `merged.pdf` p.1-51 OCR helper, `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
	Question: does the spreadsheet `Armies V4` row order map cleanly to printed list numbering and page flow, or are there header, helper, separator, or renamed rows that must be filtered before corpus extraction?
	Why it matters: SOCR-03 cannot safely use spreadsheet order as a navigation anchor if list IDs, names, or row counts drift from the printed book.
	Next check: continue comparing printed-page anchors already captured in `docs/source/army-lists.md` for lists `1-25` and body-level headers for lists `28-30` and `38-40` against the spreadsheet index before treating later sheets as navigation-safe.

- ID: army-lists.options-replacements-and-conditional-rows
	Status: ocr-check
	Area: army-lists
	Sources: `ArmyLists1-82.pdf`, `merged.pdf` p.1-51 OCR helper, `Errata_ADG_V4_English.pdf`
	Question: how should options, replacements, downgrades, upgrades, and conditional troop rows be segmented when OCR blurs table structure or note attachment?
	Why it matters: army-builder data import will break if optional substitutions are flattened into mandatory troop rows or detached from their triggering notes.
	Next check: keep using the strongest current corpus anchors in `docs/source/army-lists.md` such as `List 20 - Hittite`, `List 21 - Hurri-Mitanni`, `List 30 - Mycenaean`, `List 38 - Early Macedonian`, `List 39 - Alexandrian Macedonian`, and `List 40 - Alexander the Great` as the reference set for source-linked replacement and date-gate notes instead of flattening them into normalized rows.

- ID: army-lists.allies-and-allied-contingent-linkage
	Status: ocr-check
	Area: army-lists
	Sources: `ArmyLists1-82.pdf`, `merged.pdf` p.1-51 OCR helper, `Errata_ADG_V4_English.pdf`, `Rules.pdf`
	Question: how exactly are allies, allied contingent limits, and ally-specific commander or troop restrictions attached to each list when OCR does not preserve visual grouping cleanly?
	Why it matters: allied-contingent legality is a structural rule boundary, so SOCR-03 must not lose the binding between an ally option and its controlling notes or commander restrictions.
	Next check: treat the ally-rich corpus entries in `docs/source/army-lists.md` such as `List 20 - Hittite`, `List 21 - Hurri-Mitanni`, `List 22 - Syria, Canaan and Ugarit`, `List 23 - Ancient Hebrew`, `List 24 - Sea Peoples`, `List 28 - Medes`, and `List 29 - Phrygian` as the current anchor set for preserving ally lines and adjacent restrictions before any further normalization.

## P1-04 Sequence And Setup State-Machine Notes

- ID: setup.sequence.public-private-boundaries
	Status: open
	Area: setup
	Sources: `Rules.pdf` setup section, `Errata_ADG_V4_English.pdf`, `merged.pdf` helper
	Question: which setup decisions are public immediately, which remain private, and which become visible only through later reveal rules?
	Why it matters: P3 setup flow and hidden-info model must know exactly which state outputs are visibility-scoped.
	Next check: verify battle plan, ambush, flank march, deployment, and dismount timing directly against authoritative sources.

- ID: setup.sequence.locked-transitions
	Status: open
	Area: setup
	Sources: `Rules.pdf` setting up section, `Errata_ADG_V4_English.pdf`
	Question: which setup decisions lock immediately and which can still be changed by later terrain adjustment or setup steps?
	Why it matters: the setup reducer cannot safely enforce state transitions without knowing what becomes immutable at each step.
	Next check: direct rulebook pass over setup order and adjustment language.

- ID: turn.loop.phase-order
	Status: errata-check
	Area: setup
	Sources: `docs/source/Rules_v2.md` `rv2.sequence-and-turn-structure`, `Rules_Color_300DPI.pdf` p.23, `Errata_ADG_V4_English.pdf`
	Question: do later chapter details or errata alter the scan-confirmed high-level sequence of movement/corps activation, shooting, combat, rout or pursuit, victory check, and end handling?
	Why it matters: P4-P10 need a stable lifecycle skeleton before detailed validators are attached.
	Next check: use the p.23 sequence as the working baseline and re-check shooting, melee, rout/pursuit, and victory chapters during their RV2-04 passes before implementation-complete claims.

## P1-05 Terrain And Setup Blockers

- ID: terrain.region-table-and-quotas
	Status: errata-check
	Area: setup
	Sources: `docs/source/Rules_v2.md` `rv2.setup-terrain-selection-and-placement`, `Rules_Color_300DPI.pdf` p.73-75, `docs/source/rules-v2-examples/rv2-p73-compulsory-terrain-table-a.png`, `docs/source/rules-v2-examples/rv2-p74-terrain-selection-table-a.png`, `Errata_ADG_V4_English.pdf`
	Question: does errata or manual table reading alter the scan-confirmed region, compulsory-terrain, and terrain-quota baseline from p.73-75?
	Why it matters: P3 cannot model legal terrain selection without the authoritative region and quota structure.
	Next check: use p.73-75 as the working baseline and keep this open for exact structured-table transcription and spot-check acceptance.

- ID: terrain.region-choice-and-compulsory-terrain-binding
	Status: errata-check
	Area: setup
	Sources: `docs/source/Rules_v2.md` `rv2.setup-terrain-selection-and-placement`, `Rules_Color_300DPI.pdf` p.73-75, `Errata_ADG_V4_English.pdf`
	Question: do any later setup or errata details alter the working baseline that attacker/defender role and region choice immediately bind compulsory terrain, terrain privileges, and later placement order?
	Why it matters: the setup reducer needs to know which terrain facts become fixed before later terrain selection, adjustment, and deployment states.
	Next check: use the p.73-75 baseline and keep this item open only for exact locked-transition wording.

- ID: terrain.size-and-placement-geometry
	Status: errata-check
	Area: setup
	Sources: `docs/source/Rules_v2.md` `rv2.terrain-fundamentals` and `rv2.setup-terrain-selection-and-placement`, `Rules_Color_300DPI.pdf` p.70-75, terrain and placement example crops, `Errata_ADG_V4_English.pdf`
	Question: do errata alter the scan-confirmed terrain size, overlap, sector, edge, road, river, and coastal placement baseline from p.70-75?
	Why it matters: P3 needs a geometry-ready placement validator boundary even before full terrain interaction logic exists.
	Next check: use p.70-75 as the working baseline and keep this open for exact geometry predicate transcription and manual spot checks.

- ID: setup.camps-fortifications-obstacles
	Status: errata-check
	Area: setup
	Sources: `docs/source/Rules_v2.md` `rv2.terrain-adjustment-and-camps`, `rv2.budget-and-force-costing`, `Rules_Color_300DPI.pdf` p.75-76 and p.81, `Errata_ADG_V4_English.pdf`, `Army_list_spreadsheet_V4 (1).xlsx`
	Question: which exact camp, fortified camp, sacred camp, fortification, obstacle, and stake legality and placement facts are now source-locked, and which remain spreadsheet or errata cross-check work?
	Why it matters: P3 and P11 cannot safely model setup objects or point impacts without exact rules.
	Next check: use p.75-76 plus p.81 as the working baseline and keep this open only for exact cost transcription and stake-specific cross-check.

- ID: setup.camp-attack-and-defense-special-cases
	Status: errata-check
	Area: setup
	Sources: `docs/source/Rules_v2.md` `rv2.melee-examples-and-camp-assault` and `rv2.fortifications-obstacles-and-war-wagons`, `Rules_Color_300DPI.pdf` p.65-67, `Errata_ADG_V4_English.pdf`
	Question: do errata alter the scan-confirmed special combat, support, evade, cover, and contact rules for camp assault and for combats across fortifications or obstacles?
	Why it matters: setup objects are not just placement items; they alter later combat and movement behavior, so P3/P7/P8 boundaries need a source-locked special-case model.
	Next check: use p.65-67 as the baseline and keep this open only for exact stakes handling and errata confirmation.

- ID: setup.deployment-zone-math
	Status: errata-check
	Area: setup
	Sources: `docs/source/Rules_v2.md` `rv2.ambushes-and-deployment`, `Rules_Color_300DPI.pdf` p.77-78, `docs/source/rules-v2-examples/rv2-p78-deployment-zones-a.png`, `Errata_ADG_V4_English.pdf`
	Question: do errata or hidden-info clarifications alter the scan-confirmed heavy versus light deployment-zone boundaries, corps-zone constraints, and terrain occupancy rules from p.77-78?
	Why it matters: P3 deployment planning must not rely on the P0 visual guide once official setup begins.
	Next check: use p.77-78 as the working baseline and keep this open for exact zone predicate extraction and hidden-info acceptance.

- ID: setup.flank-march-arrival-edge-and-entry-sequence
	Status: errata-check
	Area: hidden-info
	Sources: `docs/source/Rules_v2.md` `rv2.flank-marches-and-hesitant-corps`, `Rules_Color_300DPI.pdf` p.79-80, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: do errata or later army-cohesion accounting details alter the scan-confirmed flank-march arrival roll, declared-edge, compulsory perpendicular first move, and lost-on-failure branches from p.79-80?
	Why it matters: the source corpus now records declared arrival edge, perpendicular first move, and `enter this turn or be lost`, but setup and later movement reducers need the exact official sequence and exception model.
	Next check: use p.79-80 as the working baseline and keep this open for exact off-table-loss accounting and hesitant-corps timing acceptance.
	Next check: direct page-image and reference-sheet pass over flank-march arrival wording, same-flank conflict resolution, entry edge limits, and failure/loss conditions.

## P1-06 Hidden Information And Player-View Notes

- ID: hidden-info.roster-disclosure-timing
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf` setup and deployment sections, `merged.pdf` helper
	Question: when does the opponent legally know full roster content, corps assignment details, and hidden declarations during standard setup?
	Why it matters: player-view filtering and hotseat privacy cannot be modeled safely without the disclosure boundary.
	Next check: verify setup and deployment wording directly in authoritative sources.

- ID: hidden-info.reveal-trigger-set
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf` ambush and flank march sections, `Errata_ADG_V4_English.pdf`
	Question: which reveal triggers are mandatory, optional, distance-based, line-of-sight-based, or phase-specific?
	Why it matters: reveal events need explicit legality and logging rules instead of ad hoc UI behavior.
	Next check: direct ambush and flank-march source pass with errata cross-check.

- ID: hidden-info.ambush-placement-and-reveal-constraints
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf` ambush and setup sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: what exact terrain eligibility, marker placement constraints, hidden contents rules, and reveal conditions apply to ambushes during setup and later turns?
	Why it matters: P3 hidden-setup state must separate legal ambush declaration from later public marker behavior without inventing reveal timing or placement freedom.
	Next check: direct source and reference-sheet pass over ambush sections, with explicit notes on legal terrain/object families, marker contents, reveal triggers, and public/private state changes.

- ID: hidden-info.player-view-explanations
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf`, future UI explanation policy
	Question: what explanation text may safely be shown to a player when the canonical validator knows hidden enemy data that the player should not know?
	Why it matters: explanation panels can leak hidden state even if battlefield objects are filtered correctly.
	Next check: keep as a planning constraint now and revisit once hidden-info source review and explanation surfaces are deeper.

## P1-08 Review And P2 Readiness Notes

- P1 review handoff status: documentation foundation accepted complete by the user on 2026-05-16; P2 may move into brainstorming and execution-board preparation.
- Geometry readiness note: the current open verification set does not block P2 pure geometry work for rotated rectangles, facing, and front or flank or rear relationships.
- Geometry boundary note: P2 should depend on `BaseProfile` dimensions and orientation conventions from the P1 planning docs, not on terrain, setup, movement allowance, or hidden-info rule confirmation.
- Carry-forward warning: setup, terrain, disclosure, and phase-order open items remain blockers for P3+ and must stay in this tracker until checked against authoritative sources.

## P4-01 Movement Command Notes

- ID: movement.command-context-minimum
	Status: errata-check
	Area: movement
	Sources: `docs/source/Rules_v2.md` p.23-29, `Rules_Color_300DPI.pdf` p.23-29, `Errata_ADG_V4_English.pdf`, `Reglettes.pdf` as distance helper only
	Question: does errata or later command wording alter the working minimum that legal movement needs active player, active corps, commander/order context, command range snapshot, CP availability, and per-corps activation lock?
	Why it matters: P4 must not claim official movement legality without the minimum active player, corps, commander, command range, CP, and in-command facts.
	Next check: use `docs/rules/command.md` and `docs/rules/movement.md` as the RV2 baseline; keep free-CP and special no-CP branches open until command/rally/charge areas are accepted.

- ID: movement.allowances-and-road-terrain
	Status: errata-check
	Area: movement
	Sources: `docs/source/Rules_v2.md` p.29, `Rules_Color_300DPI.pdf` p.29, `docs/source/rules-v2-examples/rv2-p29-movement-allowance-table-a.png`, `Reglettes.pdf`, `Errata_ADG_V4_English.pdf`
	Question: how should the scan-confirmed movement-allowance table, road bonus, mixed-terrain minimum, and heavy-infantry operational-zone exception be converted into structured data and cross-checked with errata?
	Why it matters: P4 can preview geometry, but cannot validate legal move distance without the authoritative allowance table and terrain interaction.
	Next check: transcribe the p.29 table into data only in a later approved data phase; keep this item open for errata and terrain-rule cross-check, not for basic source availability.

- ID: movement.wheel-measurement-and-pivot
	Status: errata-check
	Area: movement
	Sources: `docs/source/Rules_v2.md` p.30-31, `Rules_Color_300DPI.pdf` p.30-31, movement example crops, `Reglettes.pdf`, `Errata_ADG_V4_English.pdf`
	Question: do errata or group-specific cases alter the working baseline that wheels pivot on an outer front corner, measure the opposite front corner, cap normal wheels at `90 degrees`, and cap war wagons at `45 degrees`?
	Why it matters: P4 wants wheel preview and distance accounting, but incorrect pivot or distance measurement would poison later movement and charge logic.
	Next check: use Rules-v2 p.30-31 as the baseline and keep open only for exact group-wheel, artillery-wheel, and errata interaction checks.

- ID: movement.slide-distance-and-frequency
	Status: errata-check
	Area: movement
	Sources: `docs/source/Rules_v2.md` p.30, `Rules_Color_300DPI.pdf` p.30, slide example crop, `Errata_ADG_V4_English.pdf`
	Question: do errata or charge/evade/conformation exceptions alter the working baseline of one slide up to `1 UD` per movement phase, with required straight advance outside contact exceptions and no combination with turn/extension/contraction?
	Why it matters: P4 intends to include slide as a first movement command, but the cap and allowed repetition must be source-checked before official legality claims.
	Next check: use the p.30 baseline in movement logic; verify only exception families during charge, evade, conformation, and ZoC passes.

- ID: movement.group-movement-and-reshape
	Status: errata-check
	Area: movement
	Sources: `docs/source/Rules_v2.md` p.10 and p.29-34, `Rules_Color_300DPI.pdf` p.10 and p.29-34, movement example crops, `Errata_ADG_V4_English.pdf`
	Question: what exact solver steps should represent valid group start/end state, extension, contraction, temporary split, overlap allowances, and re-forming during movement?
	Why it matters: the first P4 slice intentionally defers full group movement, but the command model must preserve the right hooks for a later complete implementation.
	Next check: baseline facts are now scan-confirmed; keep open for solver decomposition and errata cross-check before implementing group validators.

- ID: movement.turns-difficult-maneuvers-and-errata
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` movement section, `Errata_ADG_V4_English.pdf`
	Question: what exact costs and restrictions apply to quarter-turns, half-turns, difficult maneuvers, and multi-turn combinations, especially for light troops?
	Why it matters: P4 may defer these moves, but the source split must be explicit because they constrain the later movement-command family.
	Next check: direct errata-led review of turn restrictions and difficult-maneuver cases.

- ID: movement.special-troops-and-interpenetration
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` troop movement exceptions, `Errata_ADG_V4_English.pdf`
	Question: which special troop classes and interpenetration cases alter the standard movement-command assumptions for the P4 subset?
	Why it matters: P4 must not make a generic movement engine look rules-complete if major troop-class exceptions and interpenetration permissions are still unresolved.
	Next check: verify movement exceptions for light troops, war wagons, heavy artillery, cataphracts, pikemen, elephants, scythed chariots, and interpenetration cases.

- ID: interpenetration.matrix-and-partial-crossing-adjustment
	Status: ocr-check
	Area: movement
	Sources: `Rules.pdf` p.39-41 via `merged.pdf` helper OCR, `Errata_ADG_V4_English.pdf`
	Question: what is the exact permitted interpenetration matrix by troop family and direction, and what exact position-adjustment rule applies when a unit partially but not fully crosses a friendly unit?
	Why it matters: later charge, evade, and movement solvers all depend on deterministic `can interpenetrate` versus `cannot interpenetrate` results plus replay-safe post-pass geometry.
	Next check: direct page-image pass over the interpenetration matrix and the `partially reach the other side` wording before encoding any troop-family permissions or forced post-pass placement.

## P5-01 ZOC And Movement-Legality Notes

- P5 source-review status: ZOC and strict movement legality remain source-sensitive; this section lists the concrete blocker IDs that must stay explicit during P5 implementation.
- P5 implementation reminder: unresolved items below must be surfaced as `needs-source-check` diagnostics rather than silently treated as full official legality.

- ID: zoc.definition-front-geometry-and-range
	Status: errata-check
	Area: zoc
	Sources: `docs/source/Rules_v2.md` p.35-38, `Rules_Color_300DPI.pdf` p.35-38, ZoC definition crop, `Errata_ADG_V4_English.pdf`
	Question: does errata alter the scan-confirmed baseline that ZoC is less than `1 UD` directly in front, with exactly `1 UD` outside and footprint coverage tested by the aligned `1 UD` square?
	Why it matters: P5 ZOC detection must be deterministic and rule-conform; a wrong zone definition invalidates all downstream movement legality.
	Next check: use `docs/rules/zoc.md` as the working baseline; keep this item open for direct errata/manual acceptance only.

- ID: zoc.most-threatening-priority-and-tie-breaks
	Status: errata-check
	Area: zoc
	Sources: `Rules.pdf` ZOC and conformation-related sections, `Errata_ADG_V4_English.pdf`
	Question: what is the exact priority order and tie-break logic for selecting the most threatening enemy when multiple ZOCs apply?
	Why it matters: P5 movement legality and later conformation/charge behavior depend on one deterministic controlling enemy selection.
	Next check: direct source and errata cross-check of nearest/front/flank-rear priority and tie handling.

- ID: zoc.allowed-movement-while-constrained
	Status: errata-check
	Area: zoc
	Sources: `Rules.pdf` movement/ZOC sections, `Errata_ADG_V4_English.pdf`
	Question: which exact movement options are legal while constrained by the most threatening enemy ZOC (including facing/aligning/closing/charge-related allowances)?
	Why it matters: P5 cannot enforce entry/stay/exit legality without a source-backed action set for units currently in ZOC.
	Next check: direct errata-led pass on clarified ZOC permissions and movement prohibitions.

- ID: zoc.voluntary-exit-via-evade-side-effects
	Status: ocr-check
	Area: zoc
	Sources: `Rules.pdf` p.37 and p.47-49 via `merged.pdf` helper OCR, `Errata_ADG_V4_English.pdf`
	Question: when a unit voluntarily exits an enemy ZoC by making an evade move without an enemy charge, which exact parts of the evade procedure import fully, including table exit, no-shoot-after-evading, and any end-half-turn consequences?
	Why it matters: the source corpus now records that voluntary ZoC exit follows evade points `1` to `5`, but engine and UI behavior must not guess which later evade side effects also apply.
	Next check: direct page-image cross-check between the ZOC exit wording and the evade procedure pages, with explicit notes on imported steps and omitted effects.

- ID: zoc.mid-segment-entry-exit-detection
	Status: errata-check
	Area: zoc
	Sources: `docs/source/Rules_v2.md` p.35-38 and p.42-44, `Rules_Color_300DPI.pdf` p.35-38 and p.42-44, `Errata_ADG_V4_English.pdf`
	Question: how should the scan-confirmed endpoint and path constraints be split into immediate path-event checks when a move enters ZoC, leaves ZoC, or redirects to an interposed enemy?
	Why it matters: P5 path splitting/sampling must know when legality changes during a segment instead of checking only endpoints.
	Next check: use path-event detection as the working implementation model; keep exact same-step priority open with charge/conformation path-stop checks.

- ID: zoc.terrain-suppression-and-non-exerting-cases
	Status: errata-check
	Area: zoc
	Sources: `Rules.pdf` terrain/ZOC interactions, `Errata_ADG_V4_English.pdf`
	Question: which terrain states and unit categories suppress exerting or receiving ZOC, and what exact exceptions apply?
	Why it matters: false-positive ZOC enforcement is likely unless terrain and non-exerting exceptions are codified from source.
	Next check: errata-first review of terrain-penalized-combat ZOC suppression and unit-type exceptions.

- ID: movement.active-player-and-phase-legality
	Status: errata-check
	Area: movement
	Sources: `docs/source/Rules_v2.md` p.23 and p.29, `Rules_Color_300DPI.pdf` p.23 and p.29, `Errata_ADG_V4_English.pdf`
	Question: do later chapter details alter the working lifecycle gate that legal movement belongs to the phasing player, inside the movement/corps-activation segment, for the currently active corps only?
	Why it matters: P4 intentionally left this incomplete; P5 must add strict gating for ownership and phase legality without guessing lifecycle details.
	Next check: use `docs/rules/sequence-of-play.md`, `docs/rules/command.md`, and `docs/rules/movement.md` as the baseline; keep open for later phase-order acceptance.

- ID: movement.zoc-turn-slide-wheel-interactions
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` movement/ZOC sections, `Errata_ADG_V4_English.pdf`
	Question: how do turn, wheel, and slide permissions/restrictions change when a unit starts in ZOC, enters ZOC mid-move, or faces rear/flank ZOC cases?
	Why it matters: P5 legality for segmented `advance`/`wheel`/`slide` previews depends on these interaction rules and errata clarifications.
	Next check: errata-led source check for in-place turning allowances, alignment-before-charge allowances, and blocked lateral movement cases under ZOC.

## P6-00 Command-System Source Lock Notes

- P6 source-review status: corps activation order, command points, command-cost modifiers, and command-coupled movement limits are source-sensitive; this section lists concrete blocker IDs for the approved P6 subset.
- P6 implementation reminder: unresolved items below must be surfaced as `needs-source-check` diagnostics rather than treated as tournament-complete command legality.

- ID: command.corps-activation-order-and-lock
	Status: errata-check
	Area: movement
	Sources: `docs/source/Rules_v2.md` p.23 and p.25, `Rules_Color_300DPI.pdf` p.23 and p.25, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: does errata or the reference sheet alter the scan-confirmed baseline that corps are activated one at a time, each once, and one corps activation is completed before the next begins?
	Why it matters: P6 must enforce one-by-one corps activation without allowing replay-breaking or rule-breaking re-activation.
	Next check: use the p.23/p.25 baseline for planning; keep open for reference-sheet cross-check and manual acceptance.

- ID: command.range-nearest-point-measurement
	Status: errata-check
	Area: movement
	Sources: `docs/source/Rules_v2.md` p.26, `Rules_Color_300DPI.pdf` p.26, command-range crop, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: confirm boundary equality and group-target details for the scan-confirmed nearest-point command-range measurement, including light-troop doubling and attached-commander measurement.
	Why it matters: P6 command range validator depends on this geometric invariant; ambiguity would create non-deterministic in-command classification at range boundaries.
	Next check: use nearest-point measurement as baseline; keep exact range-boundary inclusivity and group treatment open for manual/errata check.

- ID: command.cp-formula-and-rounding
	Status: errata-check
	Area: movement
	Sources: `docs/source/Rules_v2.md` p.24-25, `Rules_Color_300DPI.pdf` p.24-25, commander table and strategist example crops, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: does errata or reference-sheet wording alter the scan-confirmed CP formula `ceil((D6 + commander value) / 2)`, commander-value mapping, strategist example, or free-CP limitations?
	Why it matters: CP generation must be deterministic and auditable; wrong rounding or value mapping invalidates all order costs.
	Next check: use formula and value mapping as baseline; keep free-CP use restrictions open until manual/errata acceptance.

- ID: command.order-cost-components
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` orders section, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: which exact CP components are additive for an order (in-range base cost, out-of-range surcharge, difficult manoeuvre surcharge, commander-engaged surcharge), what is the official resolution order, and does the commander-engaged `+1 CP` apply specifically when the moved unit is not the commander's own attached or included group?
	Why it matters: P6 command-cost diagnostics and reducer gates need deterministic component accounting.
	Next check: direct orders wording pass with explicit additive examples, especially the commander-in-combat exception boundary for attached or included groups. Current P6 policy is conservative: unresolved difficult-manoeuvre and commander-engaged cases block movement confirmation instead of being auto-priced from incomplete source closure.

- ID: command.order-timing-in-command-snapshot
	Status: resolved
	Area: movement
	Sources: `Rules.pdf` p.26, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: is out-of-command cost checked when the order is given, so a unit or group that starts in command keeps the normal order cost even if its later movement path ends outside command range?
	Why it matters: P6 should freeze order-cost command status at order start if that is the official rule, instead of re-pricing later sub-moves in the same declared order.
	Next check: resolved for timing by the page-26 rule text reported by the user: `Command range is evaluated at the moment the order is given. A commander can give an order, move to get in range and give another order.` Later second or third moves must therefore perform a fresh command-range check when that new order is given.

- ID: command.rally-and-charge-cp-gating
	Status: open
	Area: movement
	Sources: `Rules.pdf` orders/charge/rally sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: how should rally and uncontrolled-charge CP entries be represented before full charge/melee lifecycle phases are implemented?
	Why it matters: P6 must avoid fake completeness while still preserving correct future CP hooks.
	Next check: split this during P7 source lock into explicit charge-command cost/timing questions and a separate rally placeholder policy.

- ID: charge.single-unit-declaration-and-eligibility
	Status: open
	Area: charge
	Sources: `Rules.pdf` charge declaration and movement sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: which exact preconditions let a single unit declare a charge, and which states prohibit it (already moved, already in contact, same-edge melee support, compulsory movement conflicts, column restrictions, or other edge cases)?
	Why it matters: P7 must expose charge as a dedicated command before movement and disable it with reducer-owned reasons instead of letting illegal charge declarations slip into later path logic.
	Next check: direct source pass over charge declaration, prohibited charges, and any command-order timing notes that interact with P6 finished-unit state.

- ID: charge.start-manoeuvre-options-and-freeze
	Status: open
	Area: charge
	Sources: `Rules.pdf` charge movement diagrams and wording, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: which exact charge-start manoeuvres are legal for a single unit (shift/slide, wheel, quarter-turn, half-turn, combinations), which are mutually exclusive, and at what exact point does charge direction become frozen?
	Why it matters: the first P7 UI and engine slice must model charge-start controls separately from normal advance/wheel/slide, and a wrong assumption here would poison all later charge previews.
	Next check: direct charge-diagram source pass with an explicit table of legal opening manoeuvres, mutual exclusions, and direction-freeze timing.

- ID: charge.path-stop-and-first-contact
	Status: open
	Area: charge
	Sources: `Rules.pdf` charge, contact, and evade sections, `Errata_ADG_V4_English.pdf`
	Question: what exact event stops the charge path in the approved single-unit subset: first enemy contact, first valid target contact, friendly blocker, table edge, blocking terrain, or reaction outcome, and how are ties handled deterministically?
	Why it matters: P7 must detect contact along the path rather than from an end pose, and wrong stop ordering would break both legality and replay determinism.
	Next check: direct source pass over charge movement and contact wording, with explicit notes on first-contact priority and blocker ordering.

- ID: charge.contact-classification-basis
	Status: errata-check
	Area: charge
	Sources: `docs/source/Rules_v2.md` p.41 and p.50-54, `Rules_Color_300DPI.pdf` p.41 and p.50-54, `Errata_ADG_V4_English.pdf`
	Question: is front/flank/rear/corner charge contact classified from start position, first-contact geometry, final contact pose, or a combination of those facts?
	Why it matters: P7 contact labels must be deterministic and rule-conform before conformation or later melee modifiers can trust them.
	Next check: the current working basis is now `attacker front edge at charge-start contact geometry against defender pose`, not later conformation geometry. Keep this item open only for exact rear-boundary, corner-grey-zone, and errata tie handling.

- ID: charge.reaction-and-evade-pause-model
	Status: errata-check
	Area: charge
	Sources: `Rules.pdf` reaction and evade sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: beyond the now-defined first P7A subset, which reaction exceptions, mounted ability combinations, and blocked-evade details still require direct errata/page-image confirmation before they can be claimed rule-complete?
	Why it matters: P7 and early P7A now have an honest reaction-gate subset, but later evade completeness still depends on exact exception wording.
	Next check: direct authoritative pass over mounted bow/crossbow plus impact combinations, simple-support wording, and any errata interaction that changes may/must/cannot/blocked categorization.

- ID: charge.evade-adjusted-distance-mapping
	Status: errata-check
	Area: charge
	Sources: `docs/source/Rules_v2.md` p.42-49, `docs/source/new scan/Rules_Color_300DPI.pdf` p.43 and p.48, `Errata_ADG_V4_English.pdf`
	Question: what is the exact `1D6` to adjusted-distance mapping used for charge continuation and evade movement?
	Why it matters: P7A dice plumbing and replay-safe branch resolution must use the exact table, not an inferred spread.
	Next check: the Rules-v2 scan-confirmed pass now supports `1-2 => movement -1 UD`, `3-4 => normal movement`, `5-6 => movement +1 UD` for both adjusted charge and adjusted evade distance. Keep this item open only for a direct errata-overrides-base confirmation pass, not for further OCR clarification.

- ID: charge.evade-first-supported-subset
	Status: errata-check
	Area: charge
	Sources: `docs/source/Rules_v2.md` p.47-49, `docs/source/rules-v2-examples/index.md`, `Rules_Color_300DPI.pdf` p.47-49, `Errata_ADG_V4_English.pdf`, `docs/charge-phase-procedure-concept.md`
	Question: what is the smallest honest evade subset that P7A may implement first without inventing rules?
	Why it matters: P7A needs a stable delivery boundary before code starts, especially for `may-evade`, `must-evade`, `cannot-evade`, and `blocked-evade`.
	Next check: the scan-confirmed Rules-v2 evade pass now supports the complete supported single-unit P7A2 flow as the working baseline. For P7A2, treat wheel geometry as inherited from the scan-confirmed movement wheel baseline unless evade wording or errata overrides it, and treat table exit as immediate removal plus a deferred P10 accounting hook. Keep this item open only for the remaining direct errata confirmation points: exact light-troop family wording, any evade-specific wheel-cost wording that overrides the general wheel baseline, and any exception that narrows the supported single-unit subset.

- ID: charge.secondary-target-vs-new-target-trigger
	Status: errata-check
	Area: charge
	Sources: `docs/source/Rules_v2.md` p.37 and p.43-45, `Rules_Color_300DPI.pdf` p.37 and p.43-45, `Errata_ADG_V4_English.pdf`
	Question: what exact rule boundary separates a newly met enemy that is merely a `secondary target` with its own reaction from a narrower case where an interposed enemy becomes the new target of the charge?
	Why it matters: P7A2 follow-through and later full charge resolution cannot safely merge these cases without knowing when target replacement is mandatory versus when secondary-target procedure applies.
	Next check: use `secondary target` as the default continuation event and reserve `new target` for the narrower interposed-unit or most-threatening-enemy replacement case. Keep this item open only to confirm the exact pre-emption rule and movement-budget consequence when both readings appear plausible on the same geometry.

- ID: charge.path-stop-order
	Status: errata-check
	Area: charge
	Sources: `docs/source/Rules_v2.md` p.41-44, `Rules_Color_300DPI.pdf` p.41-44, `Errata_ADG_V4_English.pdf`
	Question: what exact event stops the charge path in the approved single-unit subset: first enemy contact, first valid target contact, friendly blocker, table edge, blocking terrain, or reaction outcome, and how are ties handled deterministically?
	Why it matters: P7 must detect contact along the path rather than from an end pose, and wrong stop ordering would break both legality and replay determinism.
	Next check: use earliest path event as the working baseline and keep same-step priority as the only open part, especially enemy contact versus foreign ZoC versus non-interpenetrable physical blocker.

- ID: conformation.single-unit-candidate-selection
	Status: errata-check
	Area: charge
	Sources: `docs/source/Rules_v2.md` p.50-54, `docs/source/rules-v2-examples/index.md`, `Rules_Color_300DPI.pdf` p.50-54, `Errata_ADG_V4_English.pdf`
	Question: how should a single charging unit choose between complete, incomplete, blocked, and optional conformation outcomes after front, flank, rear, or corner contact?
	Why it matters: P7 cannot reduce conformation to a visual snap; it needs candidate generation and deterministic selection with diagnostics.
	Next check: the scan-confirmed pass now supports these baseline solver rules: most-threatening-enemy-driven conformation, slide-then-pivot after charge, front-edge/front-corner support geometry, rear-corner blocked-flank handling, incomplete fallback, terrain-based optionality, and principal-opponent rejection of candidates that end more aligned with the wrong enemy. Current working measurement is contact completeness, then contact span, then lateral misalignment, then deterministic enemy id. Keep this item open only for direct errata confirmation and for pinning those rules to exact geometry predicates.

- ID: source-corpus.rules-ocr-layout-risk
	Status: open
	Area: source-corpus
	Sources: `Rules.pdf`, `merged.pdf`, `Errata_ADG_V4_English.pdf`
	Question: which rules sections remain unsafe to trust from helper OCR alone because of two-column interleaving, tables, diagrams, fractions, degree symbols, or example layouts?
	Why it matters: `docs/source/rules.md` is being built from `merged.pdf` helper text plus source checks. The corpus needs a central place to mark sections that still require original-page review before implementation.
	Next check: start by treating movement examples, ZOC examples, interpenetration, conformation diagrams, shooting/LOS diagrams, and melee factor tables as source-check-heavy sections even if their OCR text is searchable.
	Next check: source-lock conformation diagrams into explicit candidate rules, including incomplete and optional terrain cases.

- ID: conformation.shifting-priority-and-locks
	Status: errata-check
	Area: charge
	Sources: `docs/source/Rules_v2.md` p.53-55, `Rules_Color_300DPI.pdf` p.53-55, `Errata_ADG_V4_English.pdf`
	Question: which units may be shifted, which are unshiftable, what minimality and priority rules apply, and what post-shift movement/rally locks must be recorded?
	Why it matters: P7 shifting must be deterministic and minimal, and later melee/rally phases need correct state flags instead of ad hoc UI assumptions.
	Next check: the scan-confirmed pass now supports minimum-units minimum-distance shifting, rear-before-flank priority, support-preservation for shifted supports, and the moved-or-rally lock with the light-troop exception. Keep this item open for direct errata confirmation of non-shiftable unit families and any narrower exception wording.

- ID: charge.support-position-vs-contact-boundary
	Status: errata-check
	Area: charge
	Sources: `docs/source/Rules_v2.md` p.41-44 and p.50-52, `Rules_Color_300DPI.pdf` p.41-44 and p.50-52, `Errata_ADG_V4_English.pdf`
	Question: what exact geometry and sequencing boundary separates a legal `support position` from true new enemy contact in the first single-unit supported subset?
	Why it matters: P7A2 and P7B need the same reducer-owned distinction so a unit is not misclassified as contacting, supporting, or needing conformation at the wrong step.
	Next check: treat new enemy edge contact, including corner contact, as `contact` by default, and reserve `support position` for the narrower legal support geometry described by the source. Keep this item open only for direct errata/source confirmation of the exact geometry examples that qualify as support rather than main contact.

- ID: command.attach-detach-cost-and-timing
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` commander movement and orders wording, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: for a non-included commander attaching during movement, what is the exact official cost/timing model: does the attach sequence consume only the commander's movement allowance, also consume the corps free CP or a normal order cost, when exactly does the relation end, and what exact restrictions apply if enemies/contact/combat are involved? Current P6 reading from the user's direct rules summary treats voluntary same-turn detach as not allowed.
	Why it matters: P6 now exposes a movement-only attach preview skeleton and automatic turn-end release, but exact tournament-legal pricing, release timing, and contact constraints must be source-closed before this path can be claimed rule-complete.
	Next check: direct source pass over commander movement and attached/included wording, with explicit confirmation of cost examples, end-of-turn release wording, and combat/contact exceptions.

- ID: movement.multiple-move-and-third-move-restrictions
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` movement multiple-movements sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: what exact constraints govern movement counts, 4 UD enemy-distance condition, and third-movement restrictions by troop class and commander presence once order atomicity is assumed?
	Why it matters: P6 movement budget and command-cost legality can be wrong if repeated movement constraints are omitted or misapplied.
	Next check: direct source pass over movement-count restrictions and exception classes. Order atomicity itself is now treated as source-closed from the user-supplied `Rules.pdf` quotations: `Each CP allows one move order to be given to a unit or a group of units`, `The player then performs ... all the movement, charges and rally attempts ... up to the CP available`, and `A movement can be performed by a unit or a group of units.` Remaining open work is the exact third-move and exception structure, not whether one order may be paused and interleaved with another.

- ID: movement.order-atomicity-and-no-interleaving
	Status: resolved
	Area: movement
	Sources: `Rules.pdf` command/orders wording as quoted by the user on 2026-05-18, `Errata_ADG_V4_English.pdf`
	Question: may a unit or group begin a movement order, pause it, activate another unit/group, and then return to finish the first order?
	Why it matters: reducer movement flow must know whether an order is one atomic action or a pausable sequence.
	Next check: resolved for P6. Treat one CP as one fully resolved move order for one unit/group, with no interleaving between units. Remaining multiple-move edge cases stay tracked separately under `movement.multiple-move-and-third-move-restrictions`.

- ID: movement.difficult-manoeuvre-classification
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` difficult manoeuvre sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: which maneuvers are classified as difficult for standard and unmanoeuvrable cases, and how this classification interacts with CP surcharges?
	Why it matters: P6 uses difficult-manoeuvre as a CP-cost input; misclassification corrupts command legality.
	Next check: source/errata cross-check for quarter-turn, half-turn, extension/contraction, reduced movement, ZoC-exit cases, special troop exceptions, and third-movement cases. Current policy is conservative: P6 keeps ordinary current-subset moves confirmable with a verified `no difficult trigger detected` result, but source-sensitive or explicitly marked difficult-manoeuvre cases now block confirmation instead of remaining advisory-only. The live reducer still does not auto-charge difficult-manoeuvre CP from the present advance/wheel/slide subset until the trigger set is source-closed.

- ID: movement.commander-movement-budget
	Status: errata-check
	Area: movement
	Sources: `docs/source/Rules_v2.md` p.27-28, `Rules_Color_300DPI.pdf` p.27-28, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: do errata or reference-sheet wording alter the scan-confirmed baseline that individually based commanders move `5 UD`, rotate freely, do not block friendly movement, and may be minimally displaced?
	Why it matters: P6 fixture and command-range expectations depend on correct commander movement behavior.
	Next check: use p.27-28 as the movement-budget baseline; keep attachment and combat-lock details in their dedicated command IDs.

- ID: command.commander-attach-detach-legality
	Status: open
	Area: movement
	Sources: `Rules.pdf` commander movement and command sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: confirm exact legality, cost, and placement procedure when a non-included commander attaches to or detaches from a unit, including range limits and whether wheel/turn is involved.
	Why it matters: P6 commander command-actions must be reducer-deterministic and rule-conform; placement ambiguity would break replay consistency.
	Next check: direct source pass over commander join/leave wording and diagrams, with errata cross-check.

- ID: command.commander-detach-combat-lock-timing
	Status: open
	Area: movement
	Sources: `Rules.pdf` movement/melee/contact lifecycle sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: in which combat/contact states a commander may no longer leave an attached unit, and at what exact timing this lock applies or ends.
	Why it matters: attach/detach can be staged in P6, but combat-lock behavior must remain correctly phase-gated for P7+ without illegal early assumptions.
	Next check: verify contact/melee timing language and commander-engagement errata interaction.

- ID: rally.test-thresholds-and-post-rally-locks
	Status: ocr-check
	Area: combat
	Sources: `Rules.pdf` p.55 via `merged.pdf` helper OCR, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: what is the exact rally-test procedure, including thresholds, CP interactions, group-rally exceptions, and which movement or conformation restrictions apply after a rally attempt?
	Why it matters: the source corpus now records some post-rally restrictions, but future rally implementation cannot safely infer success logic, action locks, or group handling from partial OCR fragments.
	Next check: direct page-image pass over rally wording and examples, with explicit notes on post-rally move/conform prohibitions and any light-troop or group exceptions.

- ID: shooting.target-priority-los-and-melee-exclusions
	Status: errata-check
	Area: combat
	Sources: `docs/source/Rules_v2.md` `rv2.shooting-core`, `Rules_Color_300DPI.pdf` p.56-59, shooting example crops, `Errata_ADG_V4_English.pdf`
	Question: do errata or exact diagram reading alter the scan-confirmed shooting baseline for target priority, line of sight, range, cover, and melee/support exclusions?
	Why it matters: the corpus now records several hard shooting prohibitions, but P8 shooting validators and UI target aids need a complete rule-owned target and LOS model instead of hand-built exclusions.
	Next check: use `docs/rules/shooting.md` as the working baseline and keep this open only for ordered modifier stack, overhead-fire, and exact diagram-predicate confirmation.

- ID: melee.main-unit-support-multiple-attack-and-modifiers
	Status: errata-check
	Area: combat
	Sources: `docs/source/Rules_v2.md` melee sections p.60-67, `Rules_Color_300DPI.pdf` p.60-67, melee example crops, `Errata_ADG_V4_English.pdf`
	Question: do errata or exact table binding alter the scan-confirmed melee baseline for role classification, support, multiple attacks, factor and modifier ordering, and special-object combat?
	Why it matters: the corpus now has a conservative melee digest, but P8/P9 combat resolution needs exact tie-breaks, factor tables, and modifier scope before any engine implementation can be called source-locked.
	Next check: use `docs/rules/melee.md` as the working baseline and keep this open only for exact p.22 factor-table binding, modifier categorization, and errata confirmation.

- ID: pursuit.mandatory-optional-matrix-and-contact-branch
	Status: errata-check
	Area: combat
	Sources: `docs/source/Rules_v2.md` `rv2.pursuit-and-army-rout`, `Rules_Color_300DPI.pdf` p.69, `Errata_ADG_V4_English.pdf`
	Question: do errata alter the scan-confirmed pursuit obligation matrix, no-pursue exceptions, and new-enemy-contact branch?
	Why it matters: the corpus now records a first pursuit digest, but P10 flow cannot be implemented safely without a source-locked pursuit matrix, immediate-conform rule, evade timing, and non-charge melee scheduling.
	Next check: use `docs/rules/rout-and-pursuit.md` as the working baseline and keep this open only for exact branch matrix extraction.

- ID: rout.routed-unit-movement-and-elephant-rampage
	Status: errata-check
	Area: combat
	Sources: `docs/source/Rules_v2.md` `rv2.routed-units-and-elephant-rampage`, `Rules_Color_300DPI.pdf` p.68, `Errata_ADG_V4_English.pdf`
	Question: do errata alter the scan-confirmed routing baseline for reorientation, collateral losses, LI-only collateral, and elephant-rampage direction or victim rules?
	Why it matters: routed-unit travel and elephant-rampage cascades are core post-combat state transitions; leaving them implicit would corrupt replay, cohesion, and later contact legality.
	Next check: use `docs/rules/rout-and-pursuit.md` as the working baseline and keep this open only for exact event-order and cascade handling.

- ID: army-cohesion.loss-accounting-and-simultaneous-rout
	Status: errata-check
	Area: combat
	Sources: `docs/source/Rules_v2.md` `rv2.pursuit-and-army-rout`, `Rules_Color_300DPI.pdf` p.69, `Errata_ADG_V4_English.pdf`
	Question: do errata or setup-state interactions alter the scan-confirmed army-cohesion baseline for current value, loss accounting, expendables, camps, off-table units, and simultaneous rout?
	Why it matters: aggregate army-state calculations need a precise accounting model before P10/P11 or victory-state work can trust them.
	Next check: use `docs/rules/rout-and-pursuit.md` and `docs/rules/standard-200.md` as the working baseline and keep this open for exact off-table edge cases.

## P2-01 Geometry Assumptions Note

- P2 documentation boundary: geometry labels such as `front`, `leftFlank`, `rightFlank`, `rear`, `boundary`, and `ambiguous` are accepted as pure geometry/debug outputs for this phase.
- P2 non-claim reminder: these labels do not by themselves establish official AdG legality for movement, charge, ZOC, conformation, contact, combat, setup, or terrain interaction.
- P2 dependency reminder: base dimensions and pose are sufficient for current geometry work; unresolved setup, terrain, disclosure, and phase-order questions remain carried forward for P3+.
