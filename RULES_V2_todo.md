# RULES V2 TODO - Color-Scan Rules Corpus With Examples

Status: In progress - RV2-01, RV2-02, RV2-02A, RV2-03, and RV2-04 are agent-complete; RV2-05A global rule-knowledge sync is materially advanced; RV2-06 has a technically clean first QA snapshot; manual acceptance and formal handoff gates remain pending
Date drafted: 2026-05-23
Planner: AdG-Rules-Engine-Agent
Preferred executor: GPT-5.4 after user approval
Master plan: roadmap.md
Parent execution board: SOURCE_OCR_todo.md
Primary scan source: docs/source/new scan/Rules_Color_300DPI.pdf
Primary future rules artifact: docs/source/Rules_v2.md
Example image output folder: docs/source/rules-v2-examples/
Scan review output: docs/source/new scan/rules_color_review/
Scan review handoff: docs/source/rules-v2-scan-review-2026-05-23.md
Authority chain: Konzepte/Errata_ADG_V4_English.pdf > docs/source/new scan/Rules_Color_300DPI.pdf > Konzepte/Rules.pdf > Konzepte/merged.pdf

User decisions recorded 2026-05-23:
- Priority after this list review: start Rules-v2 when the new color PDF is available.
- Example PNG scope: extract all explicit examples plus their directly associated diagrams and tables.
- File layout remains flexible: the default paths above are acceptable for planning, but the final artifacts may move under a clearer `docs/source/rules/` layout during `RV2-00` if that reads better.

Initial scan review recorded 2026-05-23:
- `Rules_Color_300DPI.pdf` exists at the planned new-scan location and has `86` pages.
- Each page contains an embedded `2481 x 3506` image, matching the expected 300-DPI A4 scan profile.
- Embedded text extraction is available on `83` pages; page `86` is the back cover with no useful rules text layer.
- Contact-sheet and single-page review found the scan usable for the Rules-v2 pass. No immediate rescan request is required.
- Low-contrast metric pages `2`, `12`, `13`, `14`, and `18` remain visually readable in rendered review pages.
- Yellow tables, yellow example boxes, black-background picture examples, and diagram captions are all source-significant and must be extracted visually, not only by text search.
- Full-page PNG renders are review/preflight artifacts only. The reusable rules examples must be individual cropped images, not whole-page screenshots.

## Purpose

Create a fast, AI-readable AdG V4 rules corpus from the new color scan, with every rules example extracted as a PNG and referenced from the Markdown rules digest.

This is a source-analysis task, not gameplay implementation. The output should improve later engine phases by giving us structured rules, source page/column references, errata overlays, and visual example anchors without requiring repeated PDF spelunking.

## Reading Contract

- Treat the new color PDF as the primary layout source once it exists.
- Treat each printed column as a separate reading unit: read the full left column first, then the full right column, then continue to the next printed page.
- Do not bind rules, tables, or examples by raw OCR vertical alignment across two columns.
- Preserve rule sequence, subheadings, tables, diagrams, examples, and errata overlays as separate structured entries.
- Extract every explicit rules example, plus directly associated diagrams and tables, as PNG into `docs/source/rules-v2-examples/` and reference it from `docs/source/Rules_v2.md`.
- Examples must be image-backed, with source page/column and a short project-wording summary. Do not rely on OCR text alone for example semantics.
- Treat yellow example boxes, yellow rule tables, black-background diagram examples, terrain diagrams, line-of-sight diagrams, conformation diagrams, charge/evade diagrams, melee examples, and setup diagrams as first-class source assets.
- Do not use text search alone to find examples: many critical examples are picture-led or color-box-led and may not contain a clean searchable `Example` label.
- For every extracted example image, store source page, printed page number if visible, column/region, crop bounds, rule area, and the Markdown section that consumes it.

## Example Image Crop Contract

The example-image deliverable is a library of small, focused PNG crops suitable for direct Markdown embedding and later Markdown-to-PDF export.

Required crop behavior:

- Do not embed whole rendered pages as rule examples.
- Crop one logical source asset per file: one yellow example box, one diagram panel, one black battlefield example panel, one directly associated table, or one tightly grouped diagram-plus-caption block.
- Include enough surrounding context for labels, arrows, legends, captions, and table headers to be understandable without opening the source page.
- Exclude unrelated neighboring columns, unrelated body text, page headers/footers, and broad blank margins whenever they are not needed for the example.
- If a single example spans multiple disconnected visual regions, create multiple numbered crops and link them as one example group in the index.
- Use stable, descriptive filenames such as `rv2-p47-evade-blocked-zoc-a.png`, `rv2-p57-shooting-zone-los-a.png`, or `rv2-p72-terrain-table-a.png`.
- Keep crop dimensions practical for Markdown/PDF output. Prefer faithful readable crops over page-scale images; if a source panel is very large, split it into readable sub-crops rather than embedding an entire page.
- Store a Markdown-friendly alt text, caption, and suggested display width in the example index for each crop.

Markdown embedding format:

```markdown
![Example: blocked evade after reorientation](rules-v2-examples/rv2-p47-evade-blocked-zoc-a.png)
```

Whole-page renders may remain under `docs/source/new scan/rules_color_review/` for QA and traceability, but they are not the final example assets for `Rules_v2.md`.

## PM And Game Design Verdict

The correct next project move is to convert the new rules scan into the Rules-v2 source corpus before continuing rule-sensitive feature implementation.

Project-management rationale:

- P7A2, P7B, P8, P9, P10, and P11 all depend on rule areas where examples and diagrams can change implementation details.
- Continuing feature work from the older OCR-era source layer risks avoidable rework in evade, conformation, shooting line of sight, melee support, rout/pursuit, and army-builder setup/budget logic.
- Rules-v2 is a source phase, not gameplay scope creep. It should improve implementation confidence without secretly advancing a feature phase.

Game-design rationale:

- The cropped example images are future training UX assets, not just source evidence. They can later support rules explanations, scenario drill cards, and PDF-friendly documentation.
- Rules Markdown should remain readable as plain text while using images only where visual examples materially clarify geometry, line of sight, conformation, movement, or table-driven decisions.
- Each implementation phase should consume source-backed invariants from Rules-v2, then build focused player-facing affordances from those invariants.

## Feature-Phase Source Gate

Before any further rule-sensitive feature implementation starts, GPT-5.4 should treat Rules-v2 as the current source-lock path unless the user explicitly overrides this gate.

Affected phases:

- `P7A2` evade completion: must re-check evade p.47-49, charge procedure, blocked evade, table exit, and no-shoot-after-evade against Rules-v2 examples and text.
- `P7B` conformation: must re-check conformation p.50-54, ZOC examples, incomplete conformation, shifting, and pursuit/conformation diagrams against Rules-v2 images.
- `P8` shooting: must re-check line of sight, shooting zone/range, cover, visibility, hills, terrain, and shooting examples against Rules-v2 diagrams and yellow boxes.
- `P9` melee: must re-check combat factors, support, multiple attacks, ability interactions, terrain modifiers, and all melee example images.
- `P10` rout/pursuit: must re-check pursuit, routed units, elephant rampage, army cohesion, flank-march panic, and example images.
- `P11` army-builder: must re-check budget, command value, camps, fortifications, terrain/setup, optional formats, and army-list data-readiness cross-links.

After `Rules_v2.md` and example PNG extraction are complete, run a dedicated global rule-knowledge review before resuming implementation. The goal is to catch earlier misunderstandings caused by OCR stream order, missing column logic, and unused examples.

## Scope

In scope:

- new color rules PDF intake
- page and column map
- complete source-order rules digest
- all example image extraction as individual cropped PNG assets
- example index with IDs, page/column references, rule area, and target Markdown anchors
- errata overlay notes
- open-verification list for diagrams, ambiguous examples, and OCR/layout conflicts

Out of scope:

- no engine implementation
- no UI changes
- no generated rule JSON until the source corpus is accepted
- no tournament-complete implementation claim

## Cards

### [x] RV2-00 - Source Intake And File Layout

Goal: add the future color rules PDF and establish the exact output layout.

Completed 2026-05-23 as an intake/readability gate.

Findings:
- The PDF is present at `docs/source/new scan/Rules_Color_300DPI.pdf`.
- The file has `86` pages and every page has a 300-DPI-scale embedded page image.
- Rendered contact sheets and targeted 180-DPI single-page renders show the rules text, yellow boxes, tables, black example panels, and diagrams are usable for extraction.
- Page `86` has no text layer, but it is the back cover and not a rules-content blocker.
- Low-contrast metric pages are visually readable; no immediate rescan request is required.

Planned files:

- docs/source/new scan/Rules_Color_300DPI.pdf
- docs/source/Rules_v2.md
- docs/source/rules-v2-examples/
- docs/source/rules-v2-scan-review-2026-05-23.md
- RULES_V2_todo.md
- SOURCE_OCR_todo.md

Implementation steps:
1. Confirmed the PDF exists at `docs/source/new scan/Rules_Color_300DPI.pdf`.
2. Counted pages and rendered contact sheets plus targeted single-page samples.
3. Generated review assets under `docs/source/new scan/rules_color_review/`.
4. Recorded scan quality, page orientation, and embedded text-layer availability.

Non-goals:

- no full extraction yet
- no rules rewrite yet

Validation:

- page count recorded: `86`
- sample pages render correctly
- review output folder exists: `docs/source/new scan/rules_color_review/`

Manual acceptance:

- user confirms the PDF path and scan quality are acceptable

Stop condition:

- stop if the PDF is missing, unreadable, or has pages that need rescanning before analysis

Expected result: Rules-v2 extraction has a stable source file and output structure.

Next exact card:
- `RV2-01 - Page And Column Reading Map`

### [x] RV2-01 - Page And Column Reading Map

Goal: build a source-order page/column map before transcribing rules.

Completed 2026-05-23 with agent validation; manual spot-check still pending.

Planned files:

- docs/source/Rules_v2.md
- RULES_V2_todo.md
- docs/source/new scan/rules_color_review/scan_metrics.json

Implementation steps:
1. For each printed page, identify left-column and right-column reading boundaries.
2. Record major headings, tables, diagrams, and example blocks by page and column.
3. Treat `page N left column` and `page N right column` as separate routing units.
4. Mark any full-width tables or diagrams that interrupt normal two-column flow.
5. Record page-level asset categories: normal prose, yellow example box, yellow table, black diagram/example panel, full-width diagram, photo/illustration, reference sheet, back cover.

Findings:
- `docs/source/Rules_v2.md` now exists as the Rules-v2 scaffold with a complete `86`-page routing table.
- Every PDF page has a working-area assignment plus left/right routing anchors and page-level asset flags.
- The map marks visually risky pages instead of pretending OCR order is safe, especially low-contrast pages `2`, `12`, `13`, `14`, and `18`, plus weak-text or visually heavy pages `65`, `81`, and `86`.
- Geometry-heavy pages for charge, evade, conformation, shooting, melee, terrain, and setup are now explicitly grouped for later example extraction and source-image reading.

Non-goals:

- no paraphrased rule digest yet

Validation:

- page/column map covers every PDF page
- no heading is assigned only by raw OCR order where a visual column check is required

Agent validation completed:

- `docs/source/Rules_v2.md` contains a page-range coverage map plus a per-page routing table for pages `1-86`.
- The routing table preserves left-column-first then right-column order and flags pages that need later visual confirmation.

Manual acceptance:

- user spot-checks a few two-column pages against the map

Stop condition:

- stop if column boundaries cannot be visually resolved for a core rules section

Expected result: future extraction reads the rules in printed order instead of OCR stream order.

Manual acceptance note:

- Do not treat this card as user-accepted until the user spot-check confirms the routing table against a few representative two-column and diagram-heavy pages.

### [x] RV2-02 - Example Inventory And PNG Extraction

Goal: extract every rules example as a reusable PNG and index it.

Progress update 2026-05-23:

- Created `docs/source/rules-v2-examples/` and seeded `docs/source/rules-v2-examples/index.md`.
- Extended the explicit RV2-02A audit backward through `p1-23`: added the remaining clear pre-command assets on `p7-8`, `p10`, `p18-19`, and `p22`, and recorded no-focused-crop decisions for the remaining front-matter, prose, and decorative pages in that range.
- Extended the later-book audit with the remaining obvious example gaps on `p55-56`, `p62`, and `p65`, then completed explicit page decisions across `p47-86` from the contact sheets.
- Ran the first explicit RV2-02A early-range audit over pages `24-46`: added the missing command and movement tables/examples on `p24-25`, `p29`, `p33-35`, and recorded no-focused-crop decisions for prose-only or decorative pages `28`, `40`, `42`, and `45`.
- Added an early command/interpenetration/charge cluster from `p26-27`, `p39`, and `p43-44`, covering command-range measurement, commanders-and-groups attachment ambiguity, interpenetration adjustment, the adjusted-charge-distance table, continuing-charge behavior, and one prohibited-charge example.
- Added a focused movement-manouvre cluster from `p30-32`, covering distance measurement, slide examples, wheel examples, half-turn on the spot, line-to-column, column-to-line under blocked frontage, and the war-wagon quarter-turn special case.
- Closed the first early-pages visual gap with a focused ZOC/contact/charge cluster from `p36-38`, `p41`, and `p46`, covering most-threatening-enemy, prohibited and legal ZoC movement, flank protection, involuntary ZoC exit, terrain-sensitive ZoC, contact-type geometry, and uncontrolled-charge worked examples.
- Extracted the first focused crop batch for high-risk rules areas: evade (`p47-48`), conformation (`p50`), shooting zone (`p57`), and terrain table (`p72`).
- Expanded the seed batch with conformation panels (`p51-52`), line-of-sight and shooting modifier assets (`p58`), terrain-selection table (`p74`), and budget tables (`p81`).
- Closed the first-wave gaps on evade (`p49`), deeper conformation (`p50-54`), shooting example resolution (`p59`), and terrain adjustment (`p76`); page `80` was reviewed and currently does not need a focused crop.
- Added a second-wave cluster for melee, rout/pursuit, and optional reference assets: support examples (`p61`), flank or rear attack (`p63`), situation and height examples (`p64`), war wagon support (`p67`), elephant rampage and routing (`p68`), army cohesion tables (`p69`), and event-card tables (`p85`).
- Extended the terrain and setup inventory with attacking-camp example (`p66`), river and hill visibility assets (`p71`), compulsory-terrain and region-selection assets (`p73`, `p75`), plus ambush and deployment-zone diagrams (`p77-78`).
- Reviewed optional-rules prose pages `82-84` and left them without focused crops in this wave because they do not contain standalone example panels or equivalent colored table assets.
- Reviewed flank-march prose page `79` and left it without a focused crop in this wave because the page only contributes text plus decorative illustration in the current render.
- Embedded the current command, movement, interpenetration, ZOC/contact/charge, and later-wave seed batches into `docs/source/Rules_v2.md` so later digest work can reference stable relative image paths.
- RV2-02 now has a first full focused-crop inventory across the full rules book `p1-86`, with explicit `no-focused-crop` decisions where a page does not currently need an extracted image.
- Treat RV2-02 as agent-complete; manual crop-quality and completeness spot-checks are still pending before this card should be treated as user-accepted.

Planned files:

- docs/source/rules-v2-examples/*.png
- docs/source/rules-v2-examples/index.md
- docs/source/Rules_v2.md

Implementation steps:
1. Identify every yellow `Examples:` box, every black-background diagram/example panel, every labelled diagram, and every yellow table that explains an example-sensitive rule.
2. Include picture-led examples even when OCR does not contain a clean `Example` label.
3. Prioritize known high-value example families: groups of units, command range/orders, movement/wheel/slide/extension/contraction, ZOC, charge/uncontrolled charge, evade, interpenetration/burst-through, conformation, shifting, shooting zone, line of sight, shooting resolution, melee examples, fortifications/obstacles, rout/pursuit, visibility/ambush, hills/terrain, terrain placement, flank march, camps, budget, and optional rules.
4. Assign stable IDs such as `rv2-p46-charge-uncontrolled-a`, `rv2-p57-los-shooting-zone-a`, or `rv2-p72-terrain-table-a`.
5. Crop each example as its own focused PNG asset. Do not use full-page PNGs as final example images.
6. Preserve enough surrounding context to understand labels, arrows, table headers, and explanatory captions, while excluding unrelated neighboring content.
7. Record source page, printed page number, column/region, crop bounds, rule area, Markdown alt text, suggested display width, consuming Markdown anchor, and short summary in `index.md`.
8. Add Markdown image references in `Rules_v2.md` near the relevant rule digest section, using relative paths that can survive later Markdown-to-PDF export.

Non-goals:

- no image cleanup beyond faithful cropping unless the user approves enhancement
- no autogenerated interpretation of an example without a source-backed text summary

Validation:

- every identified example has a PNG file
- PNGs are readable at normal editor/browser zoom
- PNGs are focused crops rather than full-page renders
- image links resolve from Markdown
- image references use relative paths suitable for later Markdown-to-PDF export
- yellow boxes, yellow tables, and black example panels are covered by visual inventory, not only OCR keyword hits

Manual acceptance:

- user spot-checks representative examples for crop quality and completeness

Stop condition:

- stop if examples are too small or blurred and need a higher-resolution source scan

Expected result: rules examples become stable visual assets for AI-readable rules analysis and later training UI.

Manual acceptance note:

- RV2-02 is agent-complete, but it is not user-accepted until representative crops and completeness are spot-checked against the scan.

### [x] RV2-02A - Example Completeness QA

Goal: verify that no source-significant visual examples were missed before the rules digest depends on them.

Progress update 2026-05-23:

- Completed an explicit page-decision audit for the entire early rules range `p1-46`.
- The example index now records focused-crop decisions and explicit no-focused-crop decisions across the full rules book `p1-86`.
- Agent-side completeness QA is now functionally complete; manual spot-check acceptance is still pending before this card should be treated as fully accepted.

Planned files:

- docs/source/rules-v2-examples/index.md
- docs/source/new scan/rules_color_review/contact_*.png
- docs/source/Rules_v2.md
- RULES_V2_todo.md

Implementation steps:
1. Review every contact-sheet page against the example index.
2. Compare the color/yellow-page metrics against extracted assets to catch yellow boxes and tables missed by OCR.
3. Review known diagram-heavy pages individually, including pages around movement, ZOC, charge, evade, conformation, shooting, melee, terrain, setup, flank march, and budget.
4. Verify that every final example asset is a focused crop, not a whole-page render.
5. Mark every missed or ambiguous visual block as `needs-crop`, `not-rule-example`, or `needs-user-review`.
6. Spot-check Markdown embedding and a dry-run PDF-export path conceptually: relative image links, compact crop sizes, captions, and no dependence on editor-only image rendering.

Non-goals:

- no new rule interpretation beyond image inventory completeness

Validation:

- every high-yellow or diagram-heavy page has an explicit inventory decision
- every embedded example uses a focused crop and a relative path
- diagnostics clean

Manual acceptance:

- user spot-checks the example index before full rule digest writing

Stop condition:

- stop if a page is visually too unclear to decide whether a yellow/black visual block is rule-significant

Expected result: Rules-v2 does not repeat the earlier mistake of ignoring examples and diagrams.

### [x] RV2-03 - Rules V2 Markdown Spine

Goal: create the first complete `Rules_v2.md` digest in source order.

Progress update 2026-05-23:

- Started the first real digest slice in `docs/source/Rules_v2.md` for pages `5-11`.
- Added source-order early entries for overview/introduction, equipment and basing, unit status and orientation, groups and army composition, and game etiquette.
- Marked the visually checked early sections as `scan-confirmed` and kept the overview/introduction slice at `ocr-assisted` pending a direct page-image reread.
- Extended the digest into the troop chapter with a conservative attributes-and-ability anchor block based on direct reads of `p12`, `p13-14`, `p18-19`, and `p22`, while leaving the remaining troop-description pages explicitly open for later source checks.
- Extended the next adjacent digest slice through `p23-28`, covering high-level turn structure, corps activation flow, command values, strategist handling, command-point generation, command range, and commander attachment or combat rules.
- Extended the next source-order slice through `p29-34`, covering movement zones and allowances, movement measurement, slide and wheel rules, turn and reformation manoeuvres, extension and contraction, multiple moves, unmanoeuvrable troops, and difficult-manoeuvre costs.
- Extended the next source-order slice through `p35-38`, covering troop-specific movement exceptions, ZoC definition and measurement, most-threatening-enemy targeting, legal and illegal ZoC movement, ZoC exits, involuntary exits, and terrain-sensitive ZoC exceptions.
- Extended the next source-order slice through `p39-41`, covering interpenetration permissions and adjustments, burst through, disengage conditions and movement, sliding along the enemy, and the front-flank-rear contact geometry rules.
- Extended the next source-order slice through `p42-46`, covering charge definition and range, the ordered charge procedure, continuing charges and secondary targets, prohibited charges, spontaneous charges, uncontrolled charges, their combat penalty, and the main exception families.
- Extended the next source-order slice through evade `p47-49`, covering evade eligibility, forced evade, blocked paths, direction choice, adjusted distance, obstacle handling, catching evaders, and table exit.
- Extended the conformation chapter through `p50-52`, covering core definition, timing, post-charge alignment, support conformation, already-in-contact cleanup, conformation in melee, pursuit conformation, and ZoC-constrained flank or rear conformation; `p53-54` remain the next immediate follow-up.
- Completed the remaining conformation slice on `p53-54`, covering shifting units, incomplete conformation, terrain-limited conformation, ambiguous principal-opponent conformation, deep bases, LI special handling, war wagons, heavy artillery, defensive barriers, and columns attacked from the flank.
- Extended the next source-order slice through `p55-59`, covering rally procedure and rally tests, then the opening shooting rules: eligible shooters, ranges, target priority, line of sight, shooting zones, support fire, circumstance modifiers, simultaneous resolution, protection modifiers, and overhead-fire cases.
- Extended the next source-order slice through `p60-66`, covering melee roles and support, immediate multiple attacks, melee resolution and the loss table, modifier families, worked melee examples, and the separate camp-assault and looting rules.
- Extended the next source-order slice through `p67-69`, covering fortifications and obstacles, war wagon combat/support rules, routed units and elephant rampage, pursuit, and army-rout or army-cohesion accounting.
- Extended the next terrain/setup slice through `p70-76`, covering terrain categories and effects, visibility and ambush basics, region-based terrain selection, terrain placement sequence, roads and villages, terrain adjustment, camps and fortifications, and battle-plan recording.
- Completed the remaining setup slice through `p77-80`, covering ambush markers and reveal rules, visible corps deployment, dismounting timing, flank-march arrival and flee effects, driven-back flank marches, and hesitant or unreliable corps becoming reliable.
- Extended the source-order tail through `p81-85`, covering budget tables plus reduced-format, big-battle, random-factor, cards, rerolls, demoralisation, and event-rule variants; `p86` is now recorded as back-cover only.
- RV2-03 now has a first complete source-order digest pass across the full rules book `p1-86`.

Planned files:

- docs/source/Rules_v2.md
- docs/rules/open-verification.md if shared blockers need central tracking

Implementation steps:
1. Create a source-order heading spine for all major rules chapters.
2. Write project-wording summaries, not raw copied PDF text.
3. Add tables and values only after page/column verification.
4. Reference extracted example PNGs at the point where the example explains the rule.
5. Mark each section as `scan-confirmed`, `ocr-assisted`, `errata-overridden`, or `needs-source-check`.
6. For every rule area, note whether the strongest evidence is prose, table, yellow box, picture example, diagram, errata, or some combination.

Non-goals:

- no engine data model generation
- no claims that the game implements the rules

Validation:

- every major rules heading has a section
- every example image has at least one Markdown reference or a tracked reason why it is standalone
- diagnostics clean

Manual acceptance:

- user reviews the first complete digest for readability and source discipline

Stop condition:

- stop if OCR/layout quality makes a major rule area unsafe without manual source reading

Expected result: `Rules_v2.md` becomes the fast AI-readable rule corpus with image anchors.

Manual acceptance note:

- Treat RV2-03 as agent-complete but not user-accepted until the user reviews the first full digest for readability and source discipline.

### [ ] RV2-04 - Rules Deep Pass By Game Phase

Goal: harden the digest into implementation-grade rule knowledge one area at a time.

Progress update 2026-05-23:

- Started the first rules-deep-pass recalibration slice on the P7A2/P7B-critical charge, evade, and conformation block.
- Narrowed the old OCR-era adjusted-distance uncertainty to a remaining errata-overrides-base check and pushed the corrected mapping into the charge workspace docs.
- Promoted the conformation workspace from broad planning notes to a scan-confirmed first-subset source lock with explicit candidate, incomplete, shifting, and choice-state boundaries.
- Tightened the corresponding open-verification IDs so they now track remaining errata and solver-predicate questions instead of generic source-availability doubt.
- Synced P7A2 and P7B planning docs with the new baseline so later implementation cards start from the same source-backed invariants.
- Added a second RV2-04 refinement wave for the remaining solver-boundary questions: `support position` versus real contact, `secondary target` versus narrower `new target` replacement, and `principal opponent` handling for ambiguous conformation.
- Added one new focused verification ID for the `support position` boundary and downgraded the remaining ambiguity on the other two questions to narrower errata or geometry-predicate work instead of broad source doubt.
- Added a third RV2-04 refinement wave for deterministic geometry predicates: earliest path-event charge stopping, start-geometry-based contact classification, and a first measurable `principal opponent` ranking for ambiguous conformation candidates.
- Added a fourth RV2-04 source-lock wave for sequence, command, movement, and ZOC: promoted the turn-loop baseline from p.23, created command/movement/ZOC workspace source locks, and narrowed older P4/P5/P6 open-verification items from broad source-availability questions to errata/manual-acceptance and solver-decomposition checks.
- Added a fifth RV2-04 source-lock wave for shooting, melee, rout/pursuit, terrain/setup, and Standard 200 budget or initiative anchors: created new combat and end-of-sequence workspace source locks, upgraded the older terrain/setup and format-profile notes from planning state to Rules-v2 baselines, and narrowed the remaining broad setup/combat blocker IDs to explicit errata, table-transcription, hidden-state, and event-order questions.

Planned files:

- docs/source/Rules_v2.md
- docs/rules/*.md as needed for phase-facing summaries
- docs/rules/open-verification.md

Implementation steps:
1. Re-check sequence, command, movement, ZOC, charge, evade, conformation, shooting, melee, rout, pursuit, setup, terrain, army budget, and victory in order.
2. Overlay errata directly into the affected rule entries.
3. Extract engine invariants separately from explanatory prose.
4. List edge cases and tests implied by each rule area.
5. Link every visual example image to the rule invariant it demonstrates.
6. Compare the new source-backed invariants against existing `docs/rules/*.md`, `docs/rules-knowledge.md`, active phase boards, and known implementation assumptions.

Non-goals:

- no gameplay code until a later approved feature phase

Validation:

- each rule area has source page/column references
- errata conflicts are explicit
- open verification is centralized and not hidden in prose

Manual acceptance:

- user approves each major hardened rule area or marks it for rework

Stop condition:

- stop if a rule area has unresolved source conflict that would affect engine legality

Expected result: future implementation phases can begin from stable source-backed invariants.

Current remaining work:

- finish any last errata/manual-acceptance narrowing for the now source-locked sequence, command, movement, ZOC, shooting, melee, rout/pursuit, terrain/setup, and budget/victory anchors;
- move into RV2-05A global recalibration so older phase boards and workspace notes stop carrying OCR-era uncertainty where Rules-v2 now gives a stable baseline;
- feed each corrected invariant into the affected phase boards before rule-sensitive implementation resumes.

### [ ] RV2-05 - AI Readability And Army-Designer Cross-Links

Goal: make the new rules corpus easy for future agents and the army-designer work to consume.

Planned files:

- docs/source/Rules_v2.md
- docs/source/Ancient_Period.md
- docs/source/Classic_Period.md
- docs/army-builder.md
- SOURCE_OCR_todo.md

Implementation steps:
1. Add a compact rule-index section for quick lookup.
2. Cross-link army-list mechanics that need rules support: command value, terrain, allies, strategists, camps, fortifications, options, replacements, and budget constraints.
3. Identify fields that should become structured army-designer data.
4. Record which source facts are human-readable only and which are ready for data import.

Non-goals:

- no army-builder implementation
- no JSON schema finalization without user approval

Validation:

- cross-links are accurate and not circular
- field-readiness notes are explicit

Manual acceptance:

- user confirms whether the source corpus is ready to guide army-designer planning

Stop condition:

- stop if rules-source ambiguities block army-list data modeling

Expected result: source docs support later army-designer design instead of only human reading.

### [ ] RV2-05A - Global Rule Knowledge Recalibration

Goal: re-audit the project's accumulated rule knowledge against the new Rules-v2 corpus before further rule-sensitive implementation.

Progress update 2026-05-23:

- Started the first recalibration slice for charge and evade planning docs.
- Corrected the stale OCR-era adjusted-distance mapping in the charge workspace docs from `1 / 2-5 / 6` to the Rules-v2 scan-confirmed `1-2 / 3-4 / 5-6` table.
- Downgraded the remaining blocker from an OCR-clarification problem to a narrower direct errata-overrides-base confirmation check.
- Synced the board state so RV2-02A and RV2-03 now reflect agent-complete status while still awaiting manual acceptance.
- Recalibrated the wider rules workspace so sequence, command, movement, ZOC, shooting, melee, rout/pursuit, terrain/setup, and Standard 200 now live in explicit Rules-v2-facing source-lock notes instead of broad planning placeholders.
- Updated the main downstream planning surfaces to consume that baseline: `P7A2_todo.md`, `P7B_todo.md`, `docs/charge-phase-procedure-concept.md`, `roadmap.md`, and `docs/rules-knowledge.md` now point at the concrete source-lock docs rather than a generic future Rules-v2 gate.
- Narrowed the corresponding open-verification items from broad OCR/source-availability questions to specific errata-check, table-transcription, hidden-state, and solver-boundary questions.

Planned files:

- docs/rules-knowledge.md
- docs/rules/*.md
- docs/rules/open-verification.md
- P7A2_todo.md
- P7B_todo.md
- roadmap.md

Implementation steps:
1. Compare existing rule summaries and implementation assumptions against `Rules_v2.md` and the extracted examples.
2. Flag misunderstandings caused by old OCR stream order, missing column logic, or skipped examples.
3. Separate true rule corrections from implementation deferrals.
4. Update P7A2/P7B/P8/P9/P10/P11 source-lock requirements where the new corpus changes confidence or scope.
5. Produce a concise change log of corrected rule understanding.

Non-goals:

- no gameplay code
- no expansion of approved feature scope without user approval

Validation:

- diagnostics clean
- every changed rule assumption has a source anchor in Rules-v2

Manual acceptance:

- user approves the recalibrated rule baseline before GPT-5.4 resumes rule-sensitive implementation

Stop condition:

- stop if a current implementation assumption conflicts with a Rules-v2 source in a way that requires product-scope choice

Expected result: future phases start from corrected source knowledge instead of inherited OCR-era misunderstandings.

Current remaining work:

- keep the change log explicit so future implementation work can distinguish corrected rule knowledge from still-deferred feature scope;
- finish the QA/handoff snapshot for the Rules-v2 corpus and decide, with manual acceptance still pending, whether it is now the default lookup layer for rule-sensitive future planning.

### [ ] RV2-06 - QA Snapshot And Handoff

Goal: close the Rules-v2 source pass cleanly.

Progress update 2026-05-23:

- Markdown diagnostics are clean for `docs/source/Rules_v2.md`, `docs/source/rules-v2-examples/index.md`, and `docs/rules/open-verification.md`.
- A reference-existence sweep over `docs/source/Rules_v2.md` and `docs/source/rules-v2-examples/index.md` found `94` referenced PNG paths and `0` missing files.
- Manual acceptance still remains open on the corpus-as-default-source question even though the first QA snapshot is now technically clean.

Planned files:

- RULES_V2_todo.md
- SOURCE_OCR_todo.md
- roadmap.md
- docs/source/Rules_v2.md
- docs/source/rules-v2-examples/index.md

Implementation steps:
1. Summarize coverage, example extraction completeness, and unresolved source questions.
2. Verify all PNG links and Markdown diagnostics.
3. Record whether `Rules_v2.md` supersedes the older `docs/source/rules.md` for future source lookup.
4. Update master planning docs without starting unapproved gameplay implementation.

Non-goals:

- no merge into gameplay phases
- no claim of tournament-complete implementation

Validation:

- diagnostics clean
- example files exist and are referenced
- open verification list is explicit

Manual acceptance:

- user confirms the Rules-v2 corpus is acceptable as the default source layer

Stop condition:

- stop if examples or core rule areas remain too incomplete for reliable future use

Expected result: the project has a source-backed, image-supported, AI-readable rules corpus ready for later implementation planning.
