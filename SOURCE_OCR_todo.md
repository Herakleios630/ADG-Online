# SOURCE OCR TODO - Rules And Army Lists Corpus

Status: In progress - SOCR-00, SOCR-01, and SOCR-02 are complete; SOCR-03 and SOCR-04 remain active with Ancient- and Classical-period deep passes complete; Rules-v2 RV2-01, RV2-02, RV2-02A, RV2-03, and RV2-04 are agent-complete and RV2-05A is materially advanced; manual acceptance and formal RV2-06 handoff wording remain the last open gate for treating the Rules-v2 layer as fully accepted project-wide
Planner: AdG-Rules-Engine-Agent
Preferred future executor: GPT-5.4 or a dedicated source-extraction agent after user approval
Intended branch: docs/source-ocr-corpus
Master plan: roadmap.md
Governance source: docs/rules-knowledge.md, docs/project-governance.md
Target rules corpus: docs/source/rules.md
Target army-list corpus: docs/source/army-lists.md
Ancient deep-pass working reference: docs/source/Ancient_Period.md
Classical deep-pass working reference: docs/source/Classic_Period.md
Rules v2 execution board: RULES_V2_todo.md
Primary source PDFs: Konzepte/Errata_ADG_V4_English.pdf, Konzepte/Rules.pdf, Konzepte/ArmyLists1-82.pdf
OCR helper source: Konzepte/merged.pdf
Spreadsheet cross-check: Konzepte/Army_list_spreadsheet_V4 (1).xlsx
Ancient color-scan source: docs/source/new scan/Ancient_Period.pdf
Classical color-scan source: docs/source/new scan/Classical_Period.pdf
Rules color-scan source: docs/source/new scan/Rules_Color_300DPI.pdf

## Purpose

Create durable AI-readable source corpora for the rules and army lists, so future implementation phases stop repeatedly fighting OCR and page-order problems.

The output should be complete in coverage, not a blind verbatim republication. Each section should use original project wording, structured facts, normalized tables, source page references, errata overlays, extraction confidence, and open-verification markers. Short source quotes may be used only when necessary to disambiguate a rule.

Current board interpretation:

- `docs/source/rules.md` remains the broad legacy rules corpus and backfill/routing layer.
- `docs/source/Rules_v2.md` plus extracted example PNGs are now the working default source-lock target for P7A2, P7B, P8, P9, P10, and P11 in hardened rule areas, while manual acceptance still governs final project-wide signoff.
- `docs/source/army-lists.md` remains the broad all-period army-list index and routing corpus.
- Period army-list files are intended to remain separate canonical working sources by epoch instead of being merged back into one monolithic army-list file.
- `docs/source/Ancient_Period.md` is the canonical working source for Ancient lists `1-37`.
- `docs/source/Classic_Period.md` is the canonical working source for Classical lists `38-82`.

## Current Extraction Facts

Verified on 2026-05-21:

- `Konzepte/Rules.pdf`: exists, 84 pages, `pdfplumber` extracts 0 characters.
- `Konzepte/ArmyLists1-82.pdf`: exists, 51 pages, `pdfplumber` extracts 0 characters.
- `Konzepte/Errata_ADG_V4_English.pdf`: exists, 7 pages, `pdfplumber` extracts about 15,504 characters.
- `Konzepte/merged.pdf`: exists, 135 pages, `pdfplumber` extracts about 400,369 characters; useful as OCR helper but page order is known to combine army lists before rules.
- `Konzepte/Army_list_spreadsheet_V4 (1).xlsx`: exists and can be read with `openpyxl`.
- Python 3.12 and `pdfplumber` / `openpyxl` are available.
- Tesseract is not currently on PATH, so fresh OCR needs either a tool install, a Python OCR alternative, or reliance on `merged.pdf` plus manual verification.

Verified on 2026-05-22:

- `docs/source/rules.md` exists and contains a source-order rules digest strong enough for planning/source routing, though still not fully implementation-safe everywhere.
- `docs/source/army-lists.md` exists and contains first-pass whole-book army-list coverage, but later list-quality is still uneven and much of it remains OCR-shaped rather than image-confirmed.
- `docs/source/Ancient_Period.md` exists and now serves as the single working canonical Ancient-period reference for lists `1-37`.
- `docs/source/new scan/Ancient_Period.pdf` exists and has been used as the controlling scan for Ancient-period list reconstruction.
- The Ancient deep pass now has all lists `1-37` present in `docs/source/Ancient_Period.md` with row statuses normalized to `scan-confirmed` where the color scan is visually secure.
- All temporary `Open verification` blocks have been removed from `docs/source/Ancient_Period.md`; remaining uncertainty was reduced to zero row-level `needs-source-check` entries during the latest pass.

Verified on 2026-05-23:

- The user confirmed that army-list epochs should remain in separate documents.
- `docs/source/Classic_Period.md` exists and now serves as the canonical working Classical-period reference for lists `38-82`.
- `docs/source/new scan/Classical_Period.pdf` exists and has been used as the controlling scan for Classical-period list reconstruction.
- `docs/source/new scan/Rules_Color_300DPI.pdf` exists and is the controlling scan for the Rules-v2 pass.
- Rules-color scan metrics: `86` pages, image on every page, embedded `2481 x 3506` page image profile, readable text layer on `83` pages, and page `86` as non-blocking back cover/no-text layer.
- Contact sheets and targeted single-page renders under `docs/source/new scan/rules_color_review/` show the scan is good enough for source extraction; low-contrast metric pages `2`, `12`, `13`, `14`, and `18` are visually readable.
- `RULES_V2_todo.md` exists as the execution board for the color rules scan, including column-order reading, individual cropped example PNG extraction, yellow-box/table handling, black-panel diagram handling, Markdown/PDF-friendly image references, and the post-extraction global rule-knowledge recalibration gate.
- `docs/source/Rules_v2.md` now contains a first full source-order digest across `p1-86`.
- `docs/source/rules-v2-examples/index.md` now records explicit page decisions across `p1-86`, and the current focused-crop library covers all currently identified rule-significant visual assets.
- `RULES_V2_todo.md` now has `RV2-01`, `RV2-02`, `RV2-02A`, and `RV2-03` at agent-complete status, while `RV2-04` and `RV2-05A` are the active recalibration gates before rule-sensitive implementation resumes.

## Source Page Map

Verified during `SOCR-00` on 2026-05-21:

| Source | Page count | Direct text extraction | Role |
| --- | ---: | --- | --- |
| `Konzepte/ArmyLists1-82.pdf` | 51 | 0 chars via `pdfplumber` | authoritative printed army-list source |
| `Konzepte/Rules.pdf` | 84 | 0 chars via `pdfplumber` | authoritative printed rules source |
| `docs/source/new scan/Rules_Color_300DPI.pdf` | 86 | text layer on 83 pages via PyMuPDF | controlling color-scan layout source for Rules-v2 |
| `Konzepte/Errata_ADG_V4_English.pdf` | 7 | readable text via `pdfplumber` | authoritative corrections and clarifications |
| `Konzepte/merged.pdf` | 135 | readable OCR text via `pdfplumber` | OCR helper only |
| `Konzepte/Army_list_spreadsheet_V4 (1).xlsx` | workbook | readable via `openpyxl` | army-list and format cross-check |

`merged.pdf` page relation:

- `merged.pdf` pages 1-51 map to `ArmyLists1-82.pdf` pages 1-51.
- `merged.pdf` pages 52-135 map to `Rules.pdf` pages 1-84.
- Formula: `Rules.pdf page N` maps to `merged.pdf page N + 51`.
- Formula: `ArmyLists1-82.pdf page N` maps to `merged.pdf page N`.
- `merged.pdf` page count equals `51 + 84 = 135`, matching the two original PDFs exactly.

Sample OCR heading sanity check from `merged.pdf`:

- page 1: army-list content begins.
- page 50-51: army-list tail pages.
- page 52: rulebook front/index area begins.
- page 93: charge procedure area; maps to `Rules.pdf` page 42.
- page 97: evade movement area; maps to `Rules.pdf` page 46.
- page 135: rulebook tail page; maps to `Rules.pdf` page 84.

Spreadsheet sheets available for cross-check:

- `Standard format (200 pts)`
- `Reduced format (100 pts)`
- `Big battles (300 pts)`
- `Version History`
- `Armies V4`

The page map is stable enough for source references. It does not make the OCR text authoritative.

## Source Reference Conventions

- Always cite the authoritative document first, e.g. `Rules.pdf p.47` or `ArmyLists1-82.pdf p.12`.
- If OCR helped locate or draft the entry, add the helper reference, e.g. `merged.pdf p.98 OCR helper`.
- For rulebook pages found through `merged.pdf`, calculate `Rules.pdf page = merged page - 51`.
- For army-list pages found through `merged.pdf`, the page number is the same as the original army-list PDF.
- For errata, cite `Errata_ADG_V4_English.pdf p.N` directly and mark the affected base rule or list entry as `errata-overridden` where applicable.
- For army-list values checked against the spreadsheet, cite the sheet name and any stable row/list identifier available.
- If OCR text, original page image, errata, and spreadsheet conflict, source priority is: errata, original PDF page, spreadsheet for calculator/list cross-check, OCR helper.

## OCR Tooling Decision

Verified during `SOCR-01` on 2026-05-21:

Available locally:

- Python 3.12
- `pdfplumber`
- PyMuPDF / `fitz`
- `openpyxl`
- Pillow / `PIL`

Not currently available on PATH or importable:

- `tesseract`
- `pdftoppm`
- ImageMagick / `magick`
- `pytesseract`
- `easyocr`
- `paddleocr`
- `cv2`
- `pdf2image`

Decision for `SOCR-02` and `SOCR-03`:

- Use `merged.pdf` as the first OCR helper because it already contains searchable text with useful character density.
- Use `pdfplumber` and/or PyMuPDF text extraction from `merged.pdf` for initial draft extraction.
- Use the original `Rules.pdf` and `ArmyLists1-82.pdf` page images as authoritative review targets whenever OCR layout, tables, diagrams, or examples are unclear.
- Use `Errata_ADG_V4_English.pdf` direct text extraction as an authoritative overlay.
- Use `openpyxl` on `Army_list_spreadsheet_V4 (1).xlsx` for army-list and format cross-checks.
- Do not install a fresh OCR stack yet. Revisit Tesseract/OCRmyPDF/PyMuPDF-rendered OCR only if `merged.pdf` plus original-PDF spot checks fail on a specific section.

Sample quality notes:

- `merged.pdf` p.1 / `ArmyLists1-82.pdf` p.1: around 2.4k extracted characters; usable army-list intro/list text.
- `merged.pdf` p.50 / `ArmyLists1-82.pdf` p.50: around 2.6k extracted characters; usable late army-list content.
- `merged.pdf` p.52 / `Rules.pdf` p.1: around 2.8k extracted characters; index/front-matter text.
- `merged.pdf` p.93 / `Rules.pdf` p.42: around 4.0k extracted characters; usable charge-procedure text.
- `merged.pdf` p.97-99 / `Rules.pdf` p.46-48: around 2.5k-2.8k extracted characters per page; usable evade-rule text, with table/layout checks still required.
- `merged.pdf` p.135 / `Rules.pdf` p.84: around 3.5k extracted characters; usable tail/reference-card text.

Spreadsheet quality notes:

- `Standard format (200 pts)`: 326 rows x 16 columns; headers include `List`, `Name`, and `Initiative`.
- `Reduced format (100 pts)`: 313 rows x 16 columns; same core headers.
- `Big battles (300 pts)`: 322 rows x 16 columns; same core headers.
- `Version History`: 13 rows x 2 columns.
- `Armies V4`: 300 rows x 2 columns; includes list IDs and army names such as list `1`, `Sumer and Akkad`.

Known failure modes to watch during extraction:

- two-column rule text may interleave lines;
- army-list table rows can lose column relationships;
- min/max/points cells must be cross-checked rather than trusted from OCR alone;
- examples and diagrams may require manual source checks;
- OCR may corrupt accented words, degree symbols, fractions, and special typography;
- `merged.pdf` is a helper only, never the final authority.

## Copyright And Source Policy

- Do not create a raw full-text clone of commercial PDFs.
- The corpus should be a complete project digest: rules, constraints, tables, army-list entries, and errata effects rewritten in project wording.
- Preserve source references by document and page/list number.
- Mark every item as `verified`, `ocr-assisted`, `spreadsheet-crosschecked`, `needs-source-check`, or `errata-overridden`.
- If exact wording matters and cannot be safely paraphrased, store only a short quote and source reference, then flag for user/manual verification.
- The original PDFs remain authoritative.

## Output Files

Primary long-lived source corpus files for this pass:

- `docs/source/rules.md`
- `docs/source/army-lists.md`

Rules-v2 companion artifacts for the new color rules scan:

- `docs/source/Rules_v2.md`
- `docs/source/rules-v2-examples/`
- `docs/source/rules-v2-scan-review-2026-05-23.md`

Approved period companion artifacts already in use:

- `docs/source/Ancient_Period.md` is a sanctioned deep-pass companion artifact for Ancient lists `1-37` because the dedicated Ancient color scan created a materially better extraction path than the generic whole-book OCR flow.
- `docs/source/Classic_Period.md` is a sanctioned deep-pass companion artifact for Classical lists `38-82` because the dedicated Classical color scan created a materially better extraction path than the generic whole-book OCR flow.

Area-specific `docs/rules/*.md` files may later link to or summarize these corpus files. The user has approved keeping army-list epochs in separate documents, so period files should remain canonical working sources unless that decision is explicitly changed later.

## Extraction Schema

Each rules entry should use:

```markdown
### rule.id

Source: Rules.pdf p.X; Errata p.Y if applicable
Status: verified | ocr-assisted | needs-source-check | errata-overridden
Applies to: movement | charge | evade | combat | setup | ...

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

Each army-list entry should use:

```markdown
### List N - Army Name

Source: ArmyLists1-82.pdf p.X; spreadsheet row/sheet if applicable; Errata p.Y if applicable
Status: verified | ocr-assisted | spreadsheet-crosschecked | needs-source-check | errata-overridden
Date range: ...
Region / classification: ...
Command value: ...
Terrain: ...

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Options / replacements:
- ...

Allies:
- ...

Notes and restrictions:
- ...

Open verification:
- ...
```

## Execution Cards

### [x] SOCR-00 - Source Corpus Policy And Page Map

Completed 2026-05-21: source counts, `merged.pdf` page relation, spreadsheet sheet names, and corpus policy have been documented. User continued with `weiter`, accepting the digest-style corpus policy and page-map gate.

Goal: establish the page map and extraction policy before writing the large corpus.

Planned files:

- SOURCE_OCR_todo.md
- docs/source/rules.md
- docs/source/army-lists.md
- docs/rules-knowledge.md

Implementation steps:
1. Build a page map between `merged.pdf`, `Rules.pdf`, and `ArmyLists1-82.pdf`.
2. Record which pages are rules, army lists, errata, index, tables, diagrams, and examples.
3. Confirm that the corpus is complete in coverage but written in original project wording.
4. Add extraction status vocabulary and source-reference conventions.

Non-goals:

- no engine implementation
- no army JSON import yet
- no full OCR pass yet

Validation:

- page counts and source paths verified
- status vocabulary appears in both target MD files

Manual acceptance:

- user confirms the corpus policy and accepts digest-style source extraction rather than raw full-text copying

Stop condition:

- stop if the user requires raw full-text reproduction instead of a project digest

Expected result: the OCR corpus has a stable source map and legally safer format.

### [x] SOCR-01 - OCR Tooling Decision

Agent progress 2026-05-21: tooling probe complete. `merged.pdf` plus `pdfplumber`/PyMuPDF is selected as the first extraction path; `openpyxl` is selected for spreadsheet cross-checks; fresh OCR installation is deferred until a specific section proves `merged.pdf` insufficient.

Completed 2026-05-21: the tooling decision is stable enough to guide the corpus work. On 2026-05-22 the board gained one important extension: for Ancient lists, the dedicated color-scan path in `docs/source/new scan/Ancient_Period.pdf` became the preferred visual authority over generic OCR where beige/white row ownership matters.

Goal: choose and validate the extraction toolchain for the full pass.

Planned files:

- SOURCE_OCR_todo.md
- optional local helper script if approved later

Implementation steps:
1. Decide whether to install/use Tesseract, OCRmyPDF, PyMuPDF rendering plus OCR, or rely on `merged.pdf` plus manual PDF verification.
2. Run sample extraction on pages with tables, two-column text, examples, and diagrams.
3. Compare OCR output against the original page image and existing search artifacts.
4. Record known OCR failure modes: wrong page order, split columns, table rows, accents, symbols, army-list min/max columns.

Non-goals:

- no full corpus writing yet
- no code integration

Validation:

- sample pages produce usable text and table boundaries
- failure modes are documented

Manual acceptance:

- user confirms whether tool installation is acceptable if needed

Stop condition:

- stop if local OCR cannot produce reviewable output and manual transcription is required

Expected result: future extraction work uses a chosen, tested OCR path.

### [x] SOCR-02 - Rules Corpus Extraction

Agent progress 2026-05-21: started after user continued with `weiter`; completed source-order coverage map and initial digest spine in `docs/source/rules.md`; expanded first detailed OCR-assisted digest slice for charge, evade, and conformation from `Rules.pdf` p.42-53 with explicit engine invariants and open verification notes; then added a stricter second pass for continuing charge and secondary targets plus the next detailed `movement` and `zoc` digest entries from `Rules.pdf` p.28-37 and errata-backed movement/ZOC clarifications; then expanded `rules.interpenetration-contact-special-movement` with a conservative detail digest for interpenetration timing, partial-crossing requirements, contact basics, and source-open matrix risks from `Rules.pdf` p.38-41; then added the first conservative `rules.rally-shooting-melee` detail digest from `Rules.pdf` p.54-66, including rally restrictions, shooting prohibitions, main-unit selection, melee support, multiple attacks, and first-round ability boundaries; then added the first conservative `rules.rout-pursuit` detail digest from `Rules.pdf` p.67-68 plus granular combat tracker entries for rally, shooting/LOS, melee-structure, pursuit, routed-unit, elephant-rampage, and army-cohesion source closure; then added the first conservative `rules.terrain-and-setup` detail digest from `Rules.pdf` p.69-79 using the existing P3 planning skeleton plus the currently reliable OCR anchors for flank marches, camps, fortifications, roads, rivers, and deployment; then hardened setup tracking for compulsory-terrain binding, ambush constraints, and flank-march arrival rules, and added the first conservative `rules.army-budget-and-variants` digest from `Rules.pdf` p.80-83 for standard 200, big battles, average dice, rerolls, and cards; then tightened `rules.reference-tail` as an audit-only quick-reference layer. This first rules-corpus pass is complete enough to move into army-list extraction while keeping open verification centralized in `docs/rules/open-verification.md`.

Goal: populate `docs/source/rules.md` with complete rules coverage in project wording.

Planned files:

- docs/source/rules.md
- docs/rules/open-verification.md
- docs/rules-knowledge.md

Implementation steps:
1. Extract rules in source order: introduction, equipment, units, sequence, command, movement, ZOC, charge, evade, conformation, shooting, melee, rout, terrain, setup, victory, appendices, and index.
2. Convert tables into structured markdown and source-referenced values.
3. Overlay errata at the affected sections instead of leaving contradictions hidden.
4. Mark diagrams/examples as `needs-source-check` where geometry cannot be reconstructed safely.
5. Link unresolved details to `docs/rules/open-verification.md`.

Non-goals:

- no engine rule implementation
- no tournament-complete claim until rules are verified and tested

Validation:

- every major rules heading has a section
- every extracted value has source and status
- errata references are applied or listed as open

Manual acceptance:

- user spot-checks selected rules sections against the PDF

Stop condition:

- stop if OCR quality makes a section unreliable and user/manual lookup is required

Expected result: one searchable rules MD is available for future planning and implementation.

### [ ] SOCR-03 - Army Lists Corpus Extraction

Agent progress 2026-05-21: started after SOCR-02 reached a complete first-pass rules digest; `docs/source/army-lists.md` now records workbook sheet names, a spreadsheet-crosschecked list-index anchor from `Armies V4`, the first `25` confirmed list IDs and names, the initial `Standard format (200 pts)` sheet structure note for later calculator-aware extraction, an early printed-index cross-check for lists `1-10` that links internal printed pages `92-97` to `ArmyLists1-82.pdf` pages `7-12` as a conservative page-anchor layer, a second printed-index cross-check for lists `11-25`, body-level starter entries for lists `1-58`, a late Classical starter layer for lists `59-82`, and cautious troop-row normalization blocks under `List 7 - Assyrian`, `List 9 - Assyrian Empire and Sargonid`, `List 10 - Old and Middle Kingdom Egyptian`, `List 11 - Nubian`, `List 12 - Libyan`, `List 13 - Hyksos`, `List 15 - Libyan Egyptian`, `List 16 - Kushite Egyptian`, `List 18 - Syrian City States`, `List 20 - Hittite`, `List 21 - Hurri-Mitanni`, `List 22 - Syria, Canaan and Ugarit`, `List 23 - Ancient Hebrew`, `List 24 - Sea Peoples`, `List 25 - Philistine`, `List 28 - Medes`, `List 29 - Phrygian`, `List 30 - Mycenaean`, `List 31 - Geometric Greek`, `List 32 - Phoenicians of Cyprus`, `List 33 - Celts`, `List 34 - Indus Valley`, `List 35 - Vedic India`, `List 36 - Erlitou Shang Chinese`, `List 37 - Zhou and Spring and Autumn Chinese`, `List 38 - Early Macedonian`, `List 39 - Alexandrian Macedonian`, `List 40 - Alexander the Great`, `List 41 - Early Successors`, `List 42 - Seleucid`, `List 43 - Ptolemaic`, `List 44 - Pyrrhic`, and `List 45 - Later Macedonian`, now with targeted quality passes that extract explicit allies, replacement hooks, named-commander restrictions, extra Classical troop rows, page-`21` through page-`29` OCR-backed header and body uplifts, blocker-level cross-links from `docs/rules/open-verification.md` back to the strongest current corpus anchors, and a shared normalization convention for how `Options / replacements`, `Allies`, and `Notes and restrictions` should be interpreted in the current strong-entry set. A later retroactive recalibration pass then added durable reading rules from user-verified corrections on `List 68 - Later Achaemenid Persian`, `List 75 - Early Arab`, and the `List 76/77` Scythian/Sarmatian handoff: bold subsection headers scope until the next bold header, `replace all` usually inherits min/max, terrain/subgroup headers often bind only terrain/allies/explicit troop hooks, and two-column list pages must be read column-by-column in printed-page order rather than as one OCR stream.
Agent progress 2026-05-22: the army-list pass now has two layers. `docs/source/army-lists.md` still holds the broad all-period corpus, while `docs/source/Ancient_Period.md` has been elevated into a dedicated deep-pass reconstruction for Ancient lists `1-37` using `docs/source/new scan/Ancient_Period.pdf` and rendered page images. That Ancient deep pass now covers all lists `1-37`, incorporates user-calibrated conflict resolutions, removes all `Open verification` sections, and reduces all row-level Ancient troop entries to either `scan-confirmed` or broader settled metadata with no remaining row-level `needs-source-check` entries.
Agent progress 2026-05-23: the same companion-artifact model has now been extended to `docs/source/Classic_Period.md`, which covers lists `38-82` with a full first scan-first hardening pass from `docs/source/new scan/Classical_Period.pdf`. The broad `docs/source/army-lists.md` corpus remains useful for all-period routing, but the Classical working authority now lives in the dedicated Classical file rather than the old starter-layer blocks.

Goal: populate `docs/source/army-lists.md` with complete army-list coverage in project wording and normalized tables.

Planned files:

- docs/source/army-lists.md
- docs/rules/open-verification.md
- docs/army-builder.md

Implementation steps:
1. Extract list index, list names, dates, regions, command values, terrain, notes, allies, and troop tables.
2. Normalize troop entries into repeatable table columns.
3. Cross-check list IDs, names, and point values against `Army_list_spreadsheet_V4 (1).xlsx`.
4. Overlay errata corrections as explicit patches on affected list entries.
5. Mark uncertain OCR rows, min/max values, and option relationships as `needs-source-check`.

Non-goals:

- no JSON army data generation yet
- no roster UI
- no automatic army legality validator

Validation:

- every printed list has a section or an explicit blocked extraction note
- spreadsheet cross-check summary is recorded
- errata changes are either applied or listed as open verification
- corpus QA notes explicitly record the retroactive re-audit rules for two-column reading, header scope, replacement inheritance, and narrow subgroup binding
- the Ancient deep-pass artifact records the stronger `scan-confirmed` versus `needs-source-check` status distinction where a dedicated color scan exists

Manual acceptance:

- user spot-checks representative army lists and one errata-adjusted list

Stop condition:

- stop if army-list table OCR cannot preserve min/max/points reliably enough for structured transcription

Expected result: one searchable army-list MD is available for army-builder planning and later data import.

Current remaining work:

- keep Ancient and Classical as separate canonical period documents while using `docs/source/army-lists.md` as the all-period routing/index corpus;
- continue image-confirmed recalibration outside the Ancient and Classical ranges where `docs/source/army-lists.md` is still only OCR-backed;
- apply the same stronger row-status discipline to later periods when dedicated scan sources become available;
- continue `RULES_V2_todo.md` from `RV2-04`, then `RV2-05A` and `RV2-06`, so the new rules corpus becomes the accepted default source layer before further rule-sensitive phase work.

Completed SOCR-03 Classical deep pass on 2026-05-23:

- `Classic Period Deep Pass`: lists `38-82`, starting from the existing Classical starter layers in `docs/source/army-lists.md`.
- planned working artifact: `docs/source/Classic_Period.md`.
- source reality: a dedicated `docs/source/new scan/Classical_Period.pdf` scan companion now exists; this pass should use that scan first, then `ArmyLists1-82.pdf`, `merged.pdf`, and spreadsheet cross-checks where needed.
- quality result: the Classical companion file now matches the same first-hardening standard used for the Ancient deep pass, with row ownership, options/replacements, allies, and shared units columns promoted from page-image evidence wherever visually secure.
- residual caution: a few continuation-heavy or page-edge rows remain intentionally grouped in the Classical file rather than over-split.

Readability check on 2026-05-22:

- Sample rendered pages from the new Classical scan are good enough for scan-first extraction.
- Large bold period/region headers are clear.
- List headers, date ranges, terrain, and command values are readable.
- Beige/white troop blocks and the `Pts` / `Units` columns are visually usable for the same extraction method already used on the Ancient pass.

### [ ] SOCR-04 - Corpus QA And Cross-Reference

Agent progress 2026-05-21: started after the first full army-list coverage pass reached list `82`; added explicit QA snapshot sections to `docs/source/rules.md` and `docs/source/army-lists.md` so both corpus files now state current coverage quality, QA gates, and priority follow-up areas instead of relying only on the execution board. Later in the same session, the army-list QA layer was tightened again with user-calibrated OCR reading rules: page columns on two-column list spreads are treated as their own pages in printed order, bold subsection headers scope until the next bold header, `replace all` normally inherits the replaced min/max slot, and terrain/subgroup labels often bind only terrain/allies plus explicit troop hooks.
Agent progress 2026-05-22: QA now also includes the Ancient color-scan pass. `docs/source/Ancient_Period.md` has been hardened into a scan-first corpus slice for lists `1-37`, giving the project one area where OCR helper text has been overtaken by direct page-image confirmation rather than merely supplemented.
Agent progress 2026-05-23: QA now also includes the completed Classical companion pass. `docs/source/Classic_Period.md` is now the canonical scan-first working source for lists `38-82`, with explicit file-level QA notes recording the few conservative grouped rows that were intentionally left unsplit.

Goal: make the two corpus files trustworthy enough to use in phase planning.

Planned files:

- docs/source/rules.md
- docs/source/army-lists.md
- docs/rules-knowledge.md
- docs/rules/open-verification.md

Implementation steps:
1. Add coverage checklists for source pages, rules headings, army-list IDs, and errata items.
2. Run spot checks against original PDFs.
3. Ensure no section silently relies on raw OCR without status.
4. Add cross-links from existing `docs/rules/*.md` planning files to the source corpus where useful.

Non-goals:

- no gameplay implementation
- no generated JSON data

Validation:

- source coverage checklist complete
- open verification list updated
- diagnostics clean
- `docs/source/Ancient_Period.md` is internally consistent and free of stale `Open verification` sections if it remains an approved companion artifact

Manual acceptance:

- user approves the corpus as the default AI-readable source layer

Stop condition:

- stop if too many core sections remain `needs-source-check` to support the next approved implementation phase

Expected result: future rule planning can start from the two corpus files instead of ad hoc OCR searches.

Current remaining work:

- keep the companion-corpus model by period: `docs/source/Ancient_Period.md` and `docs/source/Classic_Period.md` are lasting canonical working sources unless the user explicitly changes this later;
- expand the same QA discipline to non-Ancient list ranges still sitting in first-pass OCR form;
- finish the active `RULES_V2_todo.md` recalibration and handoff gates so Rules-v2 can replace repeated ad hoc OCR lookup for later rule-sensitive phases;
- keep yellow example boxes, yellow tables, black-background picture examples, diagrams, and captions inside the Rules-v2 extraction scope rather than treating them as illustrations;
- treat full-page PNGs as review artifacts only; final Rules-v2 example assets must be focused crops that can be embedded in Markdown and later exported to PDF;
- update roadmap/source-planning references if the companion-artifact model becomes permanent.

### [ ] SOCR-05 - Handoff To P7A2 And Later Phases

Goal: connect the new corpus to active implementation planning without starting unapproved code work.

Progress update 2026-05-23:

- `P7A2_todo.md`, `P7B_todo.md`, `docs/charge-phase-procedure-concept.md`, `roadmap.md`, and `docs/rules-knowledge.md` now point at the Rules-v2 corpus and the matching `docs/rules/` source-lock notes as the working baseline for charge, conformation, combat, terrain/setup, and format-profile planning.
- The handoff language is now narrower: later phases are no longer waiting on a generic scan-readiness gate for these rule areas, but on the specific source-lock docs plus the remaining manual-acceptance and errata-check items in `docs/rules/open-verification.md`.

Planned files:

- P7A2_todo.md
- P7B_todo.md
- RULES_V2_todo.md
- roadmap.md
- docs/rules-knowledge.md

Implementation steps:
1. Point P7A2 source-lock work at `docs/source/Rules_v2.md`, `docs/source/rules-v2-examples/index.md`, and `docs/rules/charge.md` once the user accepts the recalibrated baseline.
2. Point P7B conformation source-lock work at the Rules-v2 corpus, extracted conformation/shifting examples, and the matching `docs/rules/` source-lock notes once the user accepts the recalibrated baseline.
3. Point P8, P9, and P10 source-lock work at the Rules-v2 corpus and the matching `docs/rules/` source-lock notes for shooting, melee, rout, pursuit, terrain, and visibility examples before implementation boards are drafted or approved.
4. Point army-builder planning at `docs/source/army-lists.md` for all-period routing, at period canonical files such as `docs/source/Ancient_Period.md` and `docs/source/Classic_Period.md` for data-ready list details, and at Rules-v2 for budget/setup/camp/terrain constraints.
5. Keep source corpus work separate from engine implementation branches unless the user approves combining them.

Non-goals:

- no P7A2 engine code
- no P7B conformation code
- no P8/P9/P10 implementation code
- no army-builder implementation

Validation:

- planning docs link to the source corpus consistently

Manual acceptance:

- user confirms when source corpus is ready to serve as default rule lookup

Stop condition:

- stop if the corpus remains too incomplete for a specific implementation decision

Expected result: source extraction reduces repeated OCR churn in later feature phases.
