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

## Source Extraction Notes

- `Rules.pdf` and `ArmyLists1-82.pdf` produced almost no usable text through normal PDF extraction.
- `merged.pdf` is now available as an OCR working copy, but it is in the wrong internal order with army lists before rules and may contain OCR errors.
- OCR-derived facts from `merged.pdf` must be treated as helper text until confirmed against `Rules.pdf`, `ArmyLists1-82.pdf`, and `Errata_ADG_V4_English.pdf`.
- Rendered visual page sheets exist in the temporary extraction folder from the initial architecture pass, but durable rule summaries must be written here before implementation relies on them.
- Errata text was readable and should be summarized into `errata.md` before implementing affected systems.

## P1-00 Source Inventory Snapshot

- Available authoritative sources in `Konzepte/`: `Errata_ADG_V4_English.pdf`, `Rules.pdf`, `ArmyLists1-82.pdf`, `Army_list_spreadsheet_V4 (1).xlsx`, `Reglettes.pdf`, `Konzept.pdf`.
- Available OCR helper in `Konzepte/`: `merged.pdf`.
- Current practical reading status:
	- `Errata_ADG_V4_English.pdf`: text-readable.
	- `Konzept.pdf`: text-readable.
	- `Army_list_spreadsheet_V4 (1).xlsx`: spreadsheet-readable.
	- `Reglettes.pdf`: partially text-readable.
	- `Rules.pdf`: effectively image-based for normal extraction.
	- `ArmyLists1-82.pdf`: effectively image-based for normal extraction.
	- `merged.pdf`: OCR-searchable helper with wrong section order and imperfect accuracy.
- No source file is missing, but OCR uncertainty remains an open verification concern rather than a blocker.

## P1-02 Standard 200 Notes

- ID: standard-200.budget-table.values
	Status: open
	Area: setup
	Sources: `Rules.pdf` budget section, `Army_list_spreadsheet_V4 (1).xlsx` `Standard format (200 pts)` sheet
	Question: what are the exact commander, camp, sacred camp, fortified camp, fortification, and obstacle budget values for Standard 200?
	Why it matters: P3 and P11 cannot safely validate camps or roster spending without the exact table values.
	Next check: direct page-by-page confirmation against the rulebook plus spreadsheet cross-check.

- ID: standard-200.initiative-inputs
	Status: open
	Area: setup
	Sources: `Rules.pdf` setup section, `Errata_ADG_V4_English.pdf`
	Question: which exact inputs and modifiers are required before attacker or defender decision and region choice in Standard 200?
	Why it matters: P3 setup flow and later deterministic setup state need the exact pre-battle input model.
	Next check: verify the setup sequence directly against rulebook and errata.

- ID: standard-200.commander-exceptions
	Status: open
	Area: army-lists
	Sources: `Rules.pdf`, `ArmyLists1-82.pdf`, `Army_list_spreadsheet_V4 (1).xlsx`
	Question: are there any Standard 200 exceptions or special interactions for allied or unreliable commanders that affect required data fields?
	Why it matters: P1 should not overstate the commander structure if later list validation needs special cases.
	Next check: cross-check army-list and spreadsheet notes against the authoritative printed or PDF source.

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
	Status: open
	Area: setup
	Sources: `Rules.pdf` overview and command or phase sections, `Errata_ADG_V4_English.pdf`
	Question: what are the exact official battle-phase names and order, and are any steps simultaneous or conditional?
	Why it matters: P4-P10 need a stable lifecycle skeleton before detailed validators are attached.
	Next check: verify phase order from the authoritative rulebook and errata.

## P1-05 Terrain And Setup Blockers

- ID: terrain.region-table-and-quotas
	Status: open
	Area: setup
	Sources: `Rules.pdf` terrain and setup sections, `merged.pdf` helper
	Question: what is the exact region table, including compulsory terrain and terrain-selection quotas for Standard 200 setup?
	Why it matters: P3 cannot model legal terrain selection without the authoritative region and quota structure.
	Next check: direct rulebook pass over region and terrain-selection pages.

- ID: terrain.size-and-placement-geometry
	Status: open
	Area: setup
	Sources: `Rules.pdf` terrain description and setup sections, `Errata_ADG_V4_English.pdf`
	Question: what are the exact size limits, overlap restrictions, edge constraints, and road or river placement rules for terrain pieces?
	Why it matters: P3 needs a geometry-ready placement validator boundary even before full terrain interaction logic exists.
	Next check: verify terrain dimension and placement language directly against the rulebook and errata.

- ID: setup.camps-fortifications-obstacles
	Status: open
	Area: setup
	Sources: `Rules.pdf` setup section, `Errata_ADG_V4_English.pdf`, `Army_list_spreadsheet_V4 (1).xlsx`
	Question: what are the exact legality, budget, and placement rules for camps, sacred camps, fortified camps, fortifications, obstacles, and stakes?
	Why it matters: P3 and P11 cannot safely model setup objects or point impacts without exact rules.
	Next check: verify camp and fortification sections directly, then cross-check against format profile assumptions.

- ID: setup.deployment-zone-math
	Status: open
	Area: setup
	Sources: `Rules.pdf` deployment and setup sections, `Errata_ADG_V4_English.pdf`
	Question: what are the exact deployment-zone boundaries and any terrain or battle-plan interactions that alter them?
	Why it matters: P3 deployment planning must not rely on the P0 visual guide once official setup begins.
	Next check: direct source verification of deployment-zone diagrams and wording.

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
