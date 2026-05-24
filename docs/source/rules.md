# AdG V4 Rules Source Corpus

Status: Scaffold - target file for SOURCE OCR pass; not yet complete
Created: 2026-05-21
Primary sources: `Konzepte/Rules.pdf`, `Konzepte/Errata_ADG_V4_English.pdf`
OCR helper: `Konzepte/merged.pdf`
Execution board: `SOURCE_OCR_todo.md`

## Purpose

This file is the single durable AI-readable rules corpus for AdG Online. It should cover the full rulebook in source order using original project wording, structured facts, table values, source page references, errata overlays, and extraction confidence.

The original PDFs remain authoritative. This file is not a raw full-text replacement for the rulebook.

## Extraction Status Vocabulary

- `verified`: checked against the original PDF page and errata.
- `ocr-assisted`: drafted from OCR, then reviewed enough for planning but still worth spot-checking before implementation.
- `needs-source-check`: OCR or diagram/table layout is not reliable enough for implementation.
- `errata-overridden`: base rule exists but the effective rule is changed by errata.
- `blocked`: source cannot be resolved without manual user/PDF review.

## Rule Entry Template

```markdown
### rule.id

Source: Rules.pdf p.X; Errata_ADG_V4_English.pdf p.Y if applicable
Status: verified | ocr-assisted | needs-source-check | errata-overridden | blocked
Applies to: setup | command | movement | zoc | charge | evade | conformation | shooting | melee | rout | victory

Project wording:
- ...

Engine invariant:
- ...

Tables / values:
- ...

Exceptions:
- ...

Open verification:
- ...
```

## Coverage Checklist

- [ ] Introduction, scales, equipment, dice, measurement conventions
- [ ] Unit characteristics, quality, cohesion, bases, abilities
- [ ] Sequence of play
- [ ] Commanders, command range, CP, corps, orders
- [ ] Setup, terrain selection, deployment, camps, fortifications, obstacles, ambushes, flank marches
- [ ] Movement allowances, manoeuvres, wheels, slides, turns, group movement, difficult manoeuvres
- [ ] ZOC, most-threatening enemy, voluntary and involuntary ZOC exit
- [ ] Charge declaration, direction, target reaction, charge movement, secondary targets
- [ ] Evade movement, blocked evade, adjusted evade distance, wheels, slides, table exit, caught evaders
- [ ] Contact and conformation
- [ ] Shooting
- [ ] Melee combat, support, factors, cohesion outcomes
- [ ] Rout, pursuit, rally, army cohesion, victory
- [ ] Terrain effects and special terrain rules
- [ ] Special abilities and troop-specific exceptions
- [ ] Reference tables and index cross-check
- [ ] Errata overlay applied or cross-referenced

## QA Snapshot

Status: SOCR-04 started on 2026-05-21

Coverage state:
- Source-order rules coverage exists from front matter through `rules.reference-tail`.
- Core rule areas now have at least one corpus section, but many entries remain `ocr-assisted` and several geometry-heavy areas remain intentionally open in `docs/rules/open-verification.md`.
- The current corpus is strong enough for planning and source routing, but not yet strong enough to treat all tables, examples, diagrams, or quick-reference values as implementation-safe.

QA gates:
- Every promoted rules section must keep an explicit `Status` line.
- Any unresolved table, diagram, or errata interaction must stay mirrored in `docs/rules/open-verification.md`.
- Reference-tail material may cross-check values, but must not silently override detailed sections or errata.

Priority follow-up:
- Upgrade the most implementation-relevant high-risk sections first: setup, conformation diagrams, charge or evade tables, and combat tables.
- Use focused page-image checks to retire `ocr-check` blockers instead of broad new OCR passes.

## Source Notes

Initial tool check on 2026-05-21:

- `Rules.pdf` exists but direct `pdfplumber` extraction returns 0 characters.
- `Errata_ADG_V4_English.pdf` extracts readable text and should be applied as an overlay.
- `merged.pdf` extracts readable OCR text and can speed up search, but it is only a helper and has known page-order issues.
- Fresh OCR may require installing or configuring an OCR engine because Tesseract is not currently on PATH.

SOCR-01 tooling decision:

- Use `merged.pdf` with `pdfplumber` or PyMuPDF as the first OCR-helper extraction path.
- Use `Errata_ADG_V4_English.pdf` direct text extraction as authoritative overlay text.
- Do not install a fresh OCR stack unless a specific rules section fails with the existing OCR helper.
- Watch especially for two-column interleaving, table loss, diagram-only rules, fractions, and degree symbols.

## Page Map

SOCR-00 verified this source map on 2026-05-21:

- `Rules.pdf` has 84 pages and is image-based for local text extraction.
- `merged.pdf` pages 52-135 correspond to `Rules.pdf` pages 1-84.
- Mapping formula: `Rules.pdf page N` maps to `merged.pdf page N + 51` when looking up OCR helper text.
- Example: `merged.pdf p.93` maps to `Rules.pdf p.42` and contains charge-procedure OCR helper text.
- Example: `merged.pdf p.97` maps to `Rules.pdf p.46` and contains evade-movement OCR helper text.

Source reference convention:

- Use `Rules.pdf p.N` as the primary reference.
- Add `merged.pdf p.N OCR helper` only as supporting extraction evidence.
- Apply `Errata_ADG_V4_English.pdf p.N` as an overlay where it changes or clarifies a rule.
- Mark entries as `needs-source-check` when diagrams, table layout, or OCR noise make the rule unsafe for implementation.

Sample quality baseline:

- `merged.pdf p.93` / `Rules.pdf p.42`: charge-procedure OCR is usable for drafting.
- `merged.pdf p.97-99` / `Rules.pdf p.46-48`: evade OCR is usable for drafting, but tables and examples still require source checks.
- `merged.pdf p.135` / `Rules.pdf p.84`: tail/reference-card OCR is usable for drafting.

## Source-Order Coverage Map

Status: `ocr-assisted` outline, created during `SOCR-02` on 2026-05-21 from `merged.pdf` OCR helper. Page headings are normalized where OCR noise is obvious. This map is for navigation and extraction planning; it is not yet a verified rule digest.

| Rules pages | Merged pages | Working area | Extraction status | Notes |
| --- | --- | --- | --- | --- |
| 1-3 | 52-54 | index and contents | ocr-assisted | front matter and table of contents; useful for cross-checking page ranges |
| 4-7 | 55-58 | overview, introduction, rules organization | ocr-assisted | includes general game overview and distance/rules conventions |
| 8-10 | 59-61 | unit status, orientation, game etiquette | ocr-assisted | unit facing/front concepts and fair-play material |
| 11-21 | 62-72 | troops, troop attributes, troop descriptions, unit characteristic tables | ocr-assisted | tables require careful source checks before becoming data |
| 22-27 | 73-78 | how to play and command | ocr-assisted | command/order flow and related sequence material |
| 28-33 | 79-84 | movement, slides, contraction, manoeuvrability | ocr-assisted | slide examples and manoeuvre diagrams need source checks |
| 34-37 | 85-88 | zone of control and most threatening enemy | ocr-assisted | ZOC examples and flank protection need diagram checks |
| 38-41 | 89-92 | interpenetration, contacting enemy, special movements | ocr-assisted | interpenetration and contact restrictions are high-risk for geometry |
| 42-45 | 93-96 | charge procedure and continuing charge | ocr-assisted | charge flow is relevant to P7/P7A/P7A2/P7B |
| 46-49 | 97-100 | evade movement | ocr-assisted | blocked evade, direction, adjusted evade distance, evade movement, caught evaders |
| 50-53 | 101-104 | conformation | ocr-assisted | conformation diagrams and ambiguous conformation require manual verification |
| 54 | 105 | rallying and rally test | ocr-assisted | ties into rout/recovery flow |
| 55-58 | 106-109 | shooting and line of sight | ocr-assisted | line-of-sight diagrams and shooting modifiers need later source checks |
| 59-66 | 110-117 | melee, supports, multiple attacks, modifiers | ocr-assisted | combat tables/modifiers must be checked before implementation |
| 67-68 | 118-119 | rout and pursuit | ocr-assisted | elephant rampage and pursuit details need careful rule extraction |
| 69-71 | 120-122 | terrain | ocr-assisted | terrain size, shape, visibility, and effects need table extraction |
| 72-79 | 123-130 | setting up, camps, fortifications, ambush, deploying corps | ocr-assisted | setup sequence and hidden information rules tie back to P3/P12+ |
| 80 | 131 | army budget | ocr-assisted | cross-check with spreadsheet and army-builder docs |
| 81-83 | 132-134 | optional rules, big battles, cards, demoralisation, rerolls | ocr-assisted | variants and optional systems stay out of core standard-200 unless approved |
| 84 | 135 | tail/reference-card material | ocr-assisted | useful for quick-reference cross-checks |

## Initial Rules Digest

Status: first-pass source-order digest scaffold. Detailed rule entries will be expanded section by section during `SOCR-02`; every item below remains `ocr-assisted` until checked against the original page image and errata.

### rules.front-matter.index-and-contents

Source: Rules.pdf p.1-3; merged.pdf p.52-54 OCR helper
Status: ocr-assisted
Applies to: source-navigation

Project wording:
- The rulebook front matter provides the primary page structure used by this corpus.
- Use it to cross-check later section page ranges, but do not treat OCR line order as authoritative when headings or page numbers are noisy.

Engine invariant:
- None. This section supports source navigation only.

Open verification:
- Verify final page ranges after detailed extraction of each section.

### rules.game-overview-and-materials

Source: Rules.pdf p.4-7; merged.pdf p.55-58 OCR helper
Status: ocr-assisted
Applies to: global, measurement, equipment

Project wording:
- This area introduces the game, materials, dice, distance conventions, and basic organization.
- Any values that affect measurement, dice, base assumptions, or scale must be converted into structured entries before implementation use.

Engine invariant:
- Global scale and measurement assumptions should be data/config values, not scattered UI constants.

Open verification:
- Confirm all scale and distance conventions against original page images before adding new rule tables.

### rules.units-and-troops

Source: Rules.pdf p.8-21; merged.pdf p.59-72 OCR helper
Status: ocr-assisted
Applies to: units, bases, troop-types, attributes

Project wording:
- This area defines unit orientation/status, troop categories, troop attributes, troop descriptions, and unit characteristic tables.
- Unit-instance state should store current match facts, while movement/combat/ZOC/troop facts belong in source-backed rule tables.

Engine invariant:
- Unit definitions and rule tables must drive movement, combat, shooting, ZOC, evade capability, and conformation behavior.

Open verification:
- Extract and verify every troop attribute and unit-characteristic table before using it for data import or legality.

### rules.sequence-command-and-orders

Source: Rules.pdf p.22-27; merged.pdf p.73-78 OCR helper
Status: ocr-assisted
Applies to: sequence, command, corps, orders, CP

Project wording:
- This area covers play flow and command mechanics.
- P6 command context should remain the implementation anchor until the full command corpus is extracted.

Engine invariant:
- Command range, active corps, commander, CP cost, and phase state must be reducer/engine state, not UI-only state.

Open verification:
- Cross-check P6 command assumptions against this section before later command refinements.

### rules.movement

Source: Rules.pdf p.28-33; merged.pdf p.79-84 OCR helper
Status: ocr-assisted
Applies to: movement, slide, wheel, contraction, manoeuvrability

Project wording:
- This area covers normal movement operations, turns, wheels, slides, contraction or extension topics, and the command-sensitive context in which movement occurs.
- Existing workspace source notes support the planning-safe boundary that official movement is command-context dependent and must not be presented as official AdG legality without active player, active corps, commander, range, and CP context.
- Current OCR-assisted workspace notes support that wheel distance is measured by the outer front corner that travels furthest.
- Current OCR-assisted workspace notes also support that slide is a distinct manoeuvre, normally limited to `1 UD`, and that slide distance counts against movement except where later rules create an explicit exception.
- Current OCR helper fragments indicate that a unit or group may in some contexts wheel or slide, but not both, and that quarter-turn or half-turn handling is rule-sensitive and later corrected by errata.
- Existing workspace notes treat contraction and extension as source-relevant reshape mechanics rather than cosmetic formation edits.
- Movement examples and diagrams should be converted into geometry tests only after source-image verification.

Engine invariant:
- Movement solvers must operate on full unit footprints and replayable movement segments.
- Turn, wheel, slide, and reshape operations must remain explicit movement primitives rather than being inferred from end positions.
- Movement legality must stay separate from renderer convenience: command context, terrain, ZOC, and contact restrictions are rule decisions, not drawing constraints.

Open verification:
- Extract exact slide/wheel/contraction costs and diagram-based examples before broad movement expansion.
- Verify the exact once-per-move or once-per-phase limits for slide, and confirm where wheel can or cannot combine with other manoeuvres.
- Verify quarter-turn and half-turn allowances against errata, especially the light-troop free-turn wording and the restrictions on combining multiple turns in one move.
- Verify terrain and road interaction with movement allowance before using any movement-distance table as implementation law.

### rules.zoc

Source: Rules.pdf p.34-37; merged.pdf p.85-88 OCR helper
Status: ocr-assisted
Applies to: ZOC, most-threatening enemy, flank protection, ZOC exit

Project wording:
- This area covers zone-of-control definition, most-threatening-enemy priority, flank protection, constrained movement in ZoC, and voluntary or involuntary ZoC exit.
- Existing workspace notes and OCR helper fragments support that the most-threatening enemy remains the anchor for charge alignment and later conformation decisions.
- Errata-backed workspace notes indicate that movement in ZoC includes clarified permissions to wheel, slide, quarter-turn, or half-turn to become more aligned with the most-threatening enemy before charging it.
- Errata-backed notes also indicate that a quarter-turn or half-turn in place can be allowed to face an enemy exerting ZoC on a unit's flank or rear, even if part of the front edge leaves that ZoC during the turn.
- OCR helper fragments support that a unit can voluntarily exit an enemy ZoC only under specific conditions, including by making an evade move in its own turn where the rules permit it.
- The OCR helper text is more specific than the earlier digest: a unit or group capable of evading can exit an enemy ZoC in its own turn by making an evade move without an enemy charge, the initial reorientation is done only relative to the ZoC of the most threatening enemy, and the move then follows evade-procedure points `1` to `5`.
- The same OCR helper slice indicates that units may exit the table in this way.
- OCR helper fragments and later conformation pages also support that units may leave or enter enemy ZoCs involuntarily because of alignment, conformation, shifting, or interpenetration side effects.
- Errata-backed notes indicate that ZoC is not exerted into, from, or while in terrain that penalises the unit in combat.

Engine invariant:
- ZOC validation must remain engine-owned and source-explainable.
- The engine must preserve both the constraining enemy identity and the reason a move is allowed despite ZoC pressure, such as align-to-charge, involuntary exit, or evade-specific handling.
- ZoC checks must be segment-aware and state-aware; they cannot be reduced to a single end-position overlap test.

Open verification:
- Confirm diagram-heavy ZOC examples before changing P5 validators.
- Verify the precise most-threatening-enemy tie-breaks and front-geometry test against the original page images.
- Verify the exact permitted manoeuvre set while constrained by ZoC and where each permission belongs to normal movement, charging, or evade-specific rules.
- Verify the exact wording for voluntary ZoC exit, including which troop types or manoeuvres must use evade rather than normal movement.
- Verify whether the `follow points 1 to 5 of the evade procedure` wording imports every later evade-side effect, including no-shoot and end-half-turn consequences, into voluntary ZoC-exit evades.

### rules.interpenetration-contact-special-movement

Source: Rules.pdf p.38-41; merged.pdf p.89-92 OCR helper
Status: ocr-assisted
Applies to: interpenetration, contact, special-movement, geometry

Project wording:
- This area covers interpenetration, contacting enemies, contact restrictions, and special movement cases that feed directly into charge, evade, conformation, and later rout or pursuit.
- OCR helper fragments support that interpenetration is allowed during a normal movement, a charge, or an evade move.
- The OCR helper text is also clear that the moving unit must have enough movement allowance to at least partially reach the other side of the friendly unit or units being passed through.
- If the passed-through unit cannot be fully crossed, the positions of the units are adjusted afterward according to the rulebook's interpenetration procedure.
- The currently legible OCR helper text is strong enough to support that interpenetration permissions are selective and family-based rather than universal, but the full allowed matrix remains too OCR-fragile to treat as source-locked here yet.
- OCR helper text around `contacting enemy` supports that even corner contact can create engagement and that later conformation is then required.
- OCR helper fragments also indicate that the way a unit can contact an enemy depends on its starting position relative to the enemy front, flank, or rear.
- The adjacent `special movement` pages tie charge-specific contact restrictions into this section, including the distinction between a true charge into combat and a move that contacts an enemy already in melee to provide support.
- Existing workspace notes and OCR fragments together support that this section is one of the main hidden dependencies beneath later charge stop rules such as `friendly unit that cannot be interpenetrated` and evade rules such as `reorient the evading unit to make an interpenetration if possible`.

Engine invariant:
- Contact and interpenetration must be pure geometry/rules logic, not token snapping.
- The engine must model `contact`, `can interpenetrate`, and `cannot interpenetrate` as explicit legality outcomes because later charge, evade, and conformation branches all depend on them.
- Interpenetration resolution must preserve both movement-budget effects and any forced post-pass position adjustments; it cannot be represented as a zero-cost overlap ignore.

Open verification:
- Interpenetration remains deferred from P7A2 until this section is extracted and tested.
- Verify the full permitted interpenetration matrix from the page images before encoding troop-family permissions or direction restrictions in engine data.
- Verify the exact `contacting enemy` restrictions for front, flank, rear, side-sliding, and already-in-melee support cases before widening P7 contact logic.
- Verify the exact forced-adjustment rule when a unit partially but not fully crosses a friendly unit, because that geometry can affect replay state and downstream contact.

### rules.charge

Source: Rules.pdf p.42-45; merged.pdf p.93-96 OCR helper
Status: ocr-assisted
Applies to: charge, target-reaction, continuation, secondary-targets

Project wording:
- This area covers charge declaration order, target and range check, charge direction, target reaction, charge movement, the branch where initial targets do not evade, the branch where all initial targets evade, continuing charges, and conformation handoff.
- The phasing player conducts charges in the order they choose and does not have to declare all charges in advance.
- The player indicates a charge direction first. That direction can be chosen to allow secondary units to be contacted if the initial target later evades, but the direction must still respect the ZoC of the most threatening enemy.
- The initial target may choose to evade if it is able to do so.
- If the initial targets do not evade, units that can do so must contact the enemy or move into support position.
- If all initial targets evade, the charging unit or group rolls `1D6` to adjust charge distance, then either stops or continues up to its maximum adjusted charge distance, subject to branch-specific restrictions.
- OCR helper fragments indicate the charge stops if it meets an enemy unit, an enemy ZoC that blocks movement, a friendly unit that cannot be interpenetrated, or the table edge.
- OCR helper fragments also indicate that impetuous units must continue to their full adjusted charge distance, while non-impetuous chargers may have an option to stop earlier after distance adjustment.
- Continuing charge is a distinct step after the initial branch resolution: units of the charging group that have not contacted an enemy and are not in support may continue straight ahead up to their maximum movement allowance, still following the continuing-charge rules.
- OCR helper fragments indicate that continuing charge can separate a charging group without changing the CP cost of the charge move.
- When charging or continuing a charge, a unit may meet a new enemy in its path. These enemies become `secondary targets` of the charge.
- OCR helper fragments indicate that a secondary target may itself evade if able, using the normal evade procedure, except that the charging unit does not move beyond its already determined maximum adjusted movement allowance.
- The same OCR helper slice indicates that contact restrictions and ZOC rules still apply while resolving secondary-target contact.
- A separate OCR helper fragment on the ZOC page also shows a concrete target-switch case: if the most-threatening enemy cannot be contacted because another enemy is interposed, the interposed enemy becomes the new target for the charge. That appears narrower and more specific than the generic `secondary target` wording.

Engine invariant:
- Charge declaration, reaction, evade resolution, adjusted charge movement, secondary-target pause, and conformation must remain explicit reducer-owned pause points.
- The engine must preserve the distinction between the `not all targets evade` branch and the `all initial targets evade` branch because they lead to different follow-through logic.
- Target replacement and continuing-charge contact must be derived from the frozen charge direction plus post-evade board state, not improvised from the final UI pose.
- Secondary-target reactions are not a UI shortcut; they are another rule-owned branch layered on top of the already determined charge direction and adjusted movement budget.
- The engine should keep `secondary target reaction` separate from `new target due to interposed unit / most-threatening-enemy constraint` until the page-image pass confirms exactly where the rulebook draws that line.

Open verification:
- P7A2 must verify the all-initial-targets-evade timing before implementation.
- The Rules-v2 scan-confirmed pass now supports `1-2 => movement -1 UD`, `3-4 => normal movement`, `5-6 => movement +1 UD` for adjusted charge distance; keep only the direct errata-overrides-base check open.
- Verify the exact stop-or-continue permissions for non-impetuous chargers after the adjusted-distance roll.
- Verify the full continuing-charge and secondary-target wording on p.43-45 before claiming target-replacement completeness.
- Verify the exact trigger for when a newly met enemy becomes the new contacted target versus merely a secondary target that can react.
- Verify how the p.37 interposed-unit `new target` example interacts with the p.43-45 `secondary target` procedure before encoding replacement logic in P7A2.
- Verify whether all non-contacting group members use normal movement allowance or adjusted charge allowance during continuing charge in every sub-case.

### rules.evade

Source: Rules.pdf p.46-49; merged.pdf p.97-100 OCR helper
Status: ocr-assisted
Applies to: evade, blocked-evade, adjusted-evade-distance, caught-evaders

Project wording:
- This area covers evading unit orientation, evade eligibility, forced evade cases, blocked evade, evade direction, adjusted evade distance, straight movement, slides, wheels, table edge handling, light-troop end half-turn, cannot-shoot-after-evading, repeated evades, and catching evaders.
- OCR helper fragments support the current evade-capable families already tracked in [docs/rules/charge.md](docs/rules/charge.md): light infantry, light cavalry, javelinmen, some cavalry bow/crossbow cases, and other cavalry/camelry/light chariots without `Impact` or `Impetuous`.
- An evade is a reaction movement made to avoid combat and can happen several times during a phase if needed. The same section also ties evade movement to voluntary exit from an enemy ZoC.
- Evade starts with a free initial reorientation opposite the charge direction indicated by the opponent: half-turn if charged on the front, quarter-turn if charged on the flank, and no facing change if charged on the rear.
- After that initial reorientation, evade can be blocked in two broad ways already visible in the OCR helper: by an enemy ZoC directly ahead, or by an obstacle less than `1 UD` ahead that cannot be avoided by a slide of `1 UD` or less.
- Slide used to avoid an obstacle is not free and is deducted from evade distance.
- If the evade is not blocked after initial reorientation, the unit can optionally wheel to exactly match the charge direction; that wheel is not free and also reduces evade distance.
- The unit or group rolls `1D6` once per evading group or isolated unit to adjust evade distance, with separate rolls only for sub-groups that differ in movement allowance.
- OCR helper fragments indicate the actual evade move then continues in a straight line up to the maximum adjusted distance, while ignoring enemy ZoCs during the move itself.
- During that movement, the unit can make at most one slide together with one or more wheels totalling at most `90 degrees`; any slide or wheel reduces remaining evade distance.
- During the evade move, the unit cannot perform an additional quarter-turn or half-turn beyond the initial reorientation, but light troops may perform an additional free half-turn at the end of the evade move.
- The enemy camp cannot be contacted and must be avoided. Friendly units that can be interpenetrated are passed through without cohesion loss.
- If a new obstacle appears during the evade path, the evading unit must try to avoid it or interpenetrate it when it reaches the relevant distance threshold.
- No troops can shoot if they have evaded.
- If a charging enemy catches an evading unit, the evader immediately loses one cohesion point unless the charging unit consists of light troops.

Engine invariant:
- An evader must resolve and commit its movement before the charger rolls adjusted charge distance.
- Supported slide/wheel/table-exit/end-half-turn choices must be replayable and must affect charger follow-through.
- Evade resolution must distinguish clearly between `cannot evade`, `must evade`, `blocked evade`, and `legal evade with choices`; otherwise later charge and conformation logic becomes non-deterministic.
- The actual moved evader state, including facing after any free end half-turn, must become branch-authoritative state before follow-through or adjusted charge logic resumes.

Open verification:
- P7A2-00 should source-lock the exact wheel costs, table-exit consequence, light-troop family condition, and after-evade flag reset boundary.
- The Rules-v2 scan-confirmed pass now supports `1-2 => movement -1 UD`, `3-4 => normal movement`, `5-6 => movement +1 UD` for adjusted evade distance; keep only the direct errata-overrides-base check open.
- Verify the exact threshold wording for obstacle handling during the move, especially the `within 1 UD` versus `minimum more than 1 UD if a wheel is required` OCR fragment.
- Verify whether every end-of-move half-turn belongs to all light troops or only a narrower family.
- Verify the exact caught-evader consequences for non-charge evade cases and for automatic-destruction interactions involving light infantry in open terrain.

### rules.conformation

Source: Rules.pdf p.50-53; merged.pdf p.101-104 OCR helper
Status: ocr-assisted
Applies to: conformation, contact, shifting, terrain

Project wording:
- This area covers conformation definition, conformation after charge, conformation to give support, units already in contact, conformation in melee, conformation against flank or rear, conformation and ZoC, shifting units, incomplete conformation, conformation and terrain, and ambiguous/special conformation.
- OCR helper fragments define conformation as a special movement that aligns units more neatly against opponents before combat is resolved.
- Conformation can occur whenever a unit is in contact with an enemy, even by only one corner.
- How a unit conforms is dictated by the ZoC of its most threatening enemy.
- Units in melee or melee support align their front edge against the enemy, usually front-corner to front-corner, or in flank/rear situations with a front corner against the enemy rear corner if needed.
- Units that cannot line up in front of an enemy conform in a simple-support position, front corner against front corner.
- A unit must conform as fully as possible, but OCR helper fragments indicate it does not have to enter terrain that would penalise it in melee, though it may choose to do so.
- Only units belonging to the phasing player conform. Conformation does not expend CPs, and conformation movement is not deducted from movement allowance.
- If the conforming unit is part of a group, other units in the group may also move up to `1 UD` to remain aligned as a group.
- OCR helper fragments place conformation during the Movement Phase and also during the Rout and Pursuit phase in specified cases, including after a charge, to support a friendly unit already in melee, to align units already in melee that could not fully conform previously, and when a pursuer contacts a new enemy.
- When conforming to an enemy that can evade in order to give support, the conforming unit conforms first and then the enemy makes its evade move; the conforming unit does not pursue that evading enemy, and this is not treated as a charge.
- ZoCs and restrictions on contact with the enemy take precedence over the obligation to conform.
- When conforming against an enemy flank or rear, enemy ZoCs still matter; OCR helper fragments indicate a flank or rear attack is forbidden if the unit cannot fully conform because of enemy ZoCs, except for a special case cross-referenced elsewhere.
- If necessary to create space for conformation, friendly units not already engaged in melee may be shifted. Support-position units may only be shifted if they remain in support.
- Shifted units may exit or enter enemy ZoCs involuntarily. A shifted friendly unit cannot later move or rally in the same movement phase unless it is light troops, although units that already moved or rallied may still be shifted by another unit's conformation.
- If full conformation is impossible because of terrain, table edge, or friendly units that cannot be shifted, units still fight in incomplete conformation.
- OCR helper fragments indicate a fallback order for incomplete conformation: if a unit cannot fully conform on a flank, it must fully conform on the front if possible; if it cannot fully conform on the rear, it must fully conform on the nearest flank if possible; otherwise it remains incompletely conformed until it can align later.
- Ambiguous conformation must still leave the unit clearly aligned with its principal opponent and not more aligned with another unit.
- Heavy artillery has a special conformation restriction: being immobile, it can only conform by a quarter-turn or half-turn and does not conform in other cases.

Engine invariant:
- Conformation candidates must be generated by engine solvers and rendered by UI as read-only projections.
- Conformation resolution must preserve why a candidate was chosen or rejected: principal opponent, most-threatening-enemy logic, ZoC restriction, terrain penalty refusal, shifted-friendly dependency, or incomplete fallback.
- Shifting is not freeform movement; it is a solver-owned side effect with explicit eligibility and post-shift restrictions.

Open verification:
- P7B must verify exact front/flank/rear/corner candidate geometry and incomplete conformation legality.
- Verify the exact ordering and minimality rule when several units are in the ZoC of the same enemy and the first-entered unit, rather than the contacting unit, becomes the conformer.
- Verify the precise legal geometry for `simple support` conformation and for rear-corner alignment cases against errata and page images.
- Verify the exact shift limits and exceptions before implementing any P7B shifting solver.

### rules.rally-shooting-melee

Source: Rules.pdf p.54-66; merged.pdf p.105-117 OCR helper
Status: ocr-assisted
Applies to: rally, shooting, line-of-sight, melee, support, modifiers

Project wording:
- This area covers rally tests, shooting restrictions and target selection, line of sight, melee structure, support, multiple attacks, melee modifiers, and cohesion-loss outcomes.
- OCR helper fragments around the rally pages indicate that a unit attempting to rally cannot voluntarily move or conform afterward, while some later combat participation remains possible; the exact exception wording remains source-open.
- OCR helper fragments on the shooting pages state that a unit engaged in melee or supporting a friend in melee cannot shoot.
- The same OCR helper slice also states that a unit cannot shoot at an enemy engaged in melee, or supporting another unit in melee, even if the shooter is not itself in contact because full conformation was not possible.
- Other units that are in contact with an enemy but are not providing support in a combat can still shoot and be targeted.
- The OCR helper text confirms that target selection and target priority are explicit rule steps in the shooting section, but their detailed ordering and exceptions are still too OCR-fragile to treat as source-locked here.
- OCR helper fragments on the melee pages state that a melee usually involves one unit against one enemy unit, but several units can fight a single opponent and, in that case, one `main unit` is determined while others only provide support.
- The same OCR helper slices indicate that after conformation the main unit is selected by contact geometry, including rules for front-edge contact, incomplete conformation, and flank-only contact.
- OCR helper fragments define melee support as a unit fully conformed with its front edge against the flank or rear of the enemy in melee with the supported friendly unit. If the flank or rear conformation is incomplete, that support counts as simple support instead.
- Each unit in melee support provides a support bonus equal to its combat factor `+1`, while special abilities and other modifiers such as disorder or commander presence are not counted in the support bonus itself.
- OCR helper fragments indicate that a multiple attack can occur during a charge, movement, conformation, or pursuit.
- The same pages indicate that a unit loses one cohesion point immediately if an enemy fully conforms on its flank or rear edge; if the enemy does not fully conform there, this flank/rear cohesion loss does not apply.
- Another OCR helper fragment indicates that a unit also loses one cohesion point if it is engaged in melee or in melee support on multiple sides by multiple enemy units during the same phase.
- The first-round melee pages indicate that some abilities, including Furious Charge, apply only in the first round of a melee when the unit charges or is charged on its front edge; they do not apply after conformation of an existing contact or after a pursuit.
- OCR helper fragments on melee modifiers indicate that if the main unit of a melee is on the enemy flank or rear, it receives a `+1` melee modifier even if conformation is incomplete.
- Existing errata notes in this repository also flag shooting, flank/rear attack, commander-engaged, and pursuit interactions as materially corrected or clarified and therefore not safe to treat as purely base-rule text.

Engine invariant:
- Shooting and melee tables must be source-backed data; combat resolution must not infer factors from labels alone.
- Combat state must distinguish `in melee`, `melee support`, `simple support`, and `in contact but still allowed to shoot`, because the OCR-backed rules already treat those states differently.
- Main-unit selection, support contribution, first-round abilities, and cohesion-loss events must be explicit engine steps rather than hidden inside a single combat-factor calculation.

Open verification:
- Extract combat and shooting tables before P8/P9 implementation.
- Verify the full rally-test procedure, success thresholds, CP interactions, and post-rally restrictions from page images before any rally implementation claim.
- Verify shooting target-priority, line-of-sight, cover, and range details before building shooting validators or UI targeting aids.
- Verify main-unit tie-breaks, melee-support eligibility, multiple-attack conditions, and melee-modifier tables against the original page images and errata before P8/P9 implementation.

### rules.rout-pursuit

Source: Rules.pdf p.67-68; merged.pdf p.118-119 OCR helper
Status: ocr-assisted
Applies to: rout, pursuit, elephant-rampage

Project wording:
- This area covers routed units, pursuit behavior, pursuit-triggered new contact, army cohesion, and elephant-rampage-related downstream consequences.
- OCR helper fragments on the pursuit pages indicate that war wagons, artillery, and expendable levies never pursue.
- The same OCR helper slice indicates that pursuit is optional for non-impetuous units.
- OCR helper fragments also indicate that pursuit is mandatory for elephants and impetuous units, subject to listed exceptions that include at least destroying artillery, war wagons, scythed chariots, or elephants, and cases where pursuit would take the unit off the table or into terrain that penalises it.
- Another OCR helper fragment indicates that if a unit has enemies on its flank or rear after combat, it may not pursue and must instead immediately conform to face one of those enemies of its choice.
- Pursuit movement may bring the pursuing unit into contact with a new enemy.
- If this happens, the pursuing unit must immediately conform to the new enemy.
- Enemy units contacted by pursuers can then evade if permitted.
- The pursuing unit's movement remains limited to `1 UD` maximum when this pursuit contact branch is resolved.
- If the contacted enemy does not evade, the combat is resolved in the next melee phase and is not treated as a charge.
- OCR helper fragments on the same page also support the army-cohesion threshold rule: an army becomes routed when its losses are equal to or greater than its cohesion value, and simultaneous rout is possible.
- Existing errata notes in this repository already flag pursuit interactions as materially corrected or clarified, so this section should stay explicitly source-open until the page images and errata are checked together.

Engine invariant:
- Rout and pursuit should be later reducer-owned flows with replayable movement and cohesion outcomes.
- Pursuit is not just a post-combat animation: it can create new contact, trigger immediate conformation, allow evade reactions, and schedule non-charge melee in a later phase.
- Army cohesion and routed-army state must be reducer-owned aggregate calculations, not inferred ad hoc from visible routed markers.

Open verification:
- P10 must source-lock routed-unit and pursuit consequences before implementation.
- Verify the full mandatory-versus-optional pursuit matrix and all exception cases against the original page images and errata.
- Verify routed-unit movement, elephant-rampage specifics, army-loss accounting, and off-table loss treatment before any rout/pursuit implementation claim.
- Verify the exact timing of pursuit-triggered evade, conformation, and next-melee scheduling before building reducer flow for P10.

### rules.terrain-and-setup

Source: Rules.pdf p.69-79; merged.pdf p.120-130 OCR helper
Status: ocr-assisted
Applies to: terrain, setup, camps, fortifications, ambush, deployment

Project wording:
- This area covers terrain categories and terrain objects, camps and fortifications, setup sequence, battle-plan-linked declarations, ambushes, flank marches, deployment, and related hidden-information setup state.
- Existing repository planning notes already treat terrain and setup as one of the most source-sensitive areas because exact counts, geometry, placement order, and disclosure boundaries are not safe to infer from UI convenience.
- The rulebook index fragments in the OCR helper confirm the expected source-order anchors for this section: `Routed army 69`, `Rough terrain 70`, `River 71`, `Road 72`, `Setting up 73`, `Deployment 78`, and `Deployment zone 78`.
- The existing planning skeleton in [docs/rules/terrain-and-setup.md](c:/Users/ajsch/OneDrive/Documents/Coding/Games/ADG%20Online/docs/rules/terrain-and-setup.md) remains the best local project wording for this section's object families: region-driven compulsory terrain, optional terrain pieces, roads and rivers, camps, sacred or fortified camps, fortifications, obstacles, stakes, deployment zones, battle plans, ambush markers, flank marches, and dismounting decisions.
- OCR helper fragments from the late setup pages confirm at least one concrete hidden-information rule: flank marches are noted on the battle plan, declare the arrival edge, and on the turn after a successful arrival roll all units in the flank march must move onto the table in the player's movement phase or be lost.
- The same OCR helper fragments indicate that flank-march entry is constrained to the chosen short flank edge and that the first move onto the table is perpendicular to the entry edge.
- OCR helper snippets also support that setup and terrain interact directly with combat behavior: units defending fortifications, obstacles, or placed stakes receive special handling, units behind fortifications can count as in cover in some shooting cases, and a unit placed behind a fortification or obstacle cannot wheel.
- Existing repository planning notes also keep the following as planning-safe but not yet source-locked: region choice influences compulsory terrain, terrain selection is limited by quotas and duplicate-piece rules, road placement happens late in the sequence, terrain adjustment is a distinct step, and setup state must separate public placements from private declarations.

Engine invariant:
- Setup and hidden-information state must preserve public/private ownership and source status.
- Terrain, camps, fortifications, ambushes, flank marches, and deployments must be modeled as explicit setup object families with source references and visibility scope, not as loose battlefield decorations.
- Setup flow must remain reducer-owned and state-machine-like; region choice, terrain selection, terrain adjustment, camps/fortifications, private declarations, visible deployment, and later reveals cannot be collapsed into one freeform editor.

Open verification:
- P3 placeholder terrain/setup should not be upgraded to official legality until this area is fully extracted.
- Verify the exact terrain-region table, compulsory terrain rules, selection quotas, duplicate-piece limits, and road/river placement rules from the original page images before any official terrain validator claim.
- Verify the exact setup order, battle-plan timing, ambush and flank-march declaration rules, deployment-zone geometry, and disclosure boundaries before any tournament-complete setup claim.
- Verify the exact camp, fortified camp, fortification, obstacle, and stake rules together with their budget and placement interactions before P3/P11 implementation claims.

### rules.army-budget-and-variants

Source: Rules.pdf p.80-83; merged.pdf p.131-134 OCR helper
Status: ocr-assisted
Applies to: army-budget, optional-rules, big-battles, cards, demoralisation, rerolls

Project wording:
- This area covers the standard army-budget framework plus optional and variant systems such as big battles, average dice, rerolls, and cards.
- Standard `200` remains the default AdG Online target profile; reduced, big-battle, and other option packages remain variants unless the user explicitly reprioritizes them.
- Existing repository planning notes in [docs/rules/standard-200.md](c:/Users/ajsch/OneDrive/Documents/Coding/Games/ADG%20Online/docs/rules/standard-200.md) remain the best local wording for the default format: `200` points per army, `3` corps per army, one commander per corps, mandatory camp, and the standard battlefield profile.
- OCR helper fragments from the variant pages indicate that a `300-point` big-battle format exists in which an army has `4` corps, one or two may be allied up to `40%` of the budget, command value is increased by `1`, and list minima and maxima are multiplied by `1.5` rounding down except the camp; allied-corps minima and maxima remain halved.
- The same OCR helper slice indicates an `average dice` variant using six-sided dice marked `2, 3, 3, 4, 4, 5`.
- OCR helper fragments on the reroll/cards page indicate that a reroll may only happen once, the second result must be kept even if worse, and rerolls are not permitted for at least adjusted evade distance, attacking the camp, or eliminating a commander.
- The same page also indicates a card-based option package where only one picture card of each type can be active in the game and players redraw up to a hand size of three after picture-card selection.
- These option-package fragments are useful for source navigation and later profile modeling, but they should not be treated as part of the default tournament-complete rule target unless the user explicitly selects them.

Engine invariant:
- Army-builder and format logic should be data-driven and cross-checked against the spreadsheet.
- Format profiles must remain separate from army-list data and from optional-rule toggles; standard `200`, big battles, average dice, rerolls, and cards should be represented as explicit rule-profile or option-profile choices rather than hidden global flags.
- Budget validation, corps structure, commander requirements, and camp requirements must come from source-backed format data, not from assumptions embedded in UI flows.

Open verification:
- Extract army-budget values before P11 army-builder implementation.
- Verify the exact standard army-budget table values, including commanders, camps, sacred camps, fortified camps, fortifications, and obstacles, against the original page images and spreadsheet cross-check.
- Verify the full optional-variant rules for big battles, average dice, rerolls, and cards before exposing them as selectable profiles or toggles.
- Verify which parts of pages `80-83` are official core-format rules versus optional packages so the project does not accidentally mix default tournament play with variants.

### rules.reference-tail

Source: Rules.pdf p.84; merged.pdf p.135 OCR helper
Status: ocr-assisted
Applies to: reference, quick-check

Project wording:
- The tail/reference-card material is a quick-check surface for commonly used values, reminders, and summary tables rather than a new primary rules section.
- It is useful for auditing extracted factors, modifiers, phase reminders, and lookup tables against the detailed sections already covered earlier in this corpus.
- Because this kind of material is summary-oriented, it should be treated as a cross-check layer only and never as an override over errata or the detailed section text.

Engine invariant:
- Reference data should verify, not replace, detailed source sections.
- If a quick-reference value conflicts with a detailed rules section or errata, the detailed section plus errata wins and the reference-tail mismatch should be tracked explicitly.

Open verification:
- Compare reference-card values against the detailed sections and errata before using them in rule tables.
- Record any reference-tail mismatch as a source-audit issue rather than silently normalizing it away.

## Rules Corpus

The full source-order corpus will be filled by `SOURCE_OCR_todo.md` cards `SOCR-00` through `SOCR-04`.
