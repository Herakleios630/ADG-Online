# CLASSIC PERIOD TODO - One-File Pass For Lists 38-82

Status: In progress - scope reset to one-file Classical pass for lists 38-82; clean starter layer restored; deep pass now proceeds in internal slices
Date drafted: 2026-05-22
Planner: AdG-Rules-Engine-Agent
Preferred executor: GPT-5.4
Master plan: roadmap.md
Parent execution board: SOURCE_OCR_todo.md
Primary working artifact: docs/source/Classic_Period.md
Primary scan source: docs/source/new scan/Classical_Period.pdf
Authority chain: Konzepte/Errata_ADG_V4_English.pdf > docs/source/new scan/Classical_Period.pdf > Konzepte/ArmyLists1-82.pdf > Konzepte/Army_list_spreadsheet_V4 (1).xlsx > Konzepte/merged.pdf

## Purpose

Raise Classical lists `38-82` to the same scan-first quality bar already reached for Ancient lists `1-37`.

This is a source-corpus deep pass, not engine work. The goal is to replace broad OCR-shaped starter coverage with page-image-backed list headers, row ownership, options/replacements, allies, and notes.

The final target is one Markdown file, `docs/source/Classic_Period.md`, for the whole Classical range. Work may still be split into slices, but those slices are execution slices only, not separate final artifacts.

## Reading Contract

For this pass, use the same precedence already proven on the Ancient deep pass:

- bold headers
- beige/white block boundaries
- inner subdivisions inside one color block
- italics and OCR helper text only after the visible page structure is fixed

Additional Classical guards:

- two-column pages must still be read in printed column order
- page-tail contamination must not be flattened into one OCR stream
- `replace all` normally inherits min/max unless the page visibly assigns a new slot
- interleaved Roman/Carthaginian/Greek pages must stay grouped until the page image supports a cleaner split

## Scope

In scope:

- lists `38-82`
- direct header extraction from the new Classical scan
- scan-first troop-row normalization
- explicit `scan-confirmed` vs `needs-source-check` row status where useful
- ally and replacement cleanup using visible page ownership

Out of scope:

- engine/data implementation
- merging `Classic_Period.md` back into `army-lists.md` before the deep pass is stable

## Execution Order

1. `CP-00`
2. `CP-01`
3. `CP-02`
4. `CP-03`
5. `CP-04`
6. `CP-05`

## Cards

### [x] CP-00 - Scan Prep And Printed Page Map

Completed 2026-05-22.

Findings:
- `docs/source/new scan/Classical_Period.pdf` has `28` pages.
- Sample readability checks on pages `1`, `2`, `10`, and `18` confirm the scan is strong enough for the Ancient-style extraction method: bold list headers, beige/white block boundaries, and `Pts` / `Units` columns are visually usable.
- Working list-to-scan page map for the first Classical deep-pass range:
	- page `1`: lists `38-39`
	- page `2`: lists `40-41`
	- pages `3-4`: list `42`
	- page `5`: lists `43-44`
	- page `6`: list `45`
	- page `7`: list `46`
	- page `8`: lists `47-48`
	- page `9`: lists `49-50`
	- page `10`: lists `51-52`
	- page `11`: list `53`
	- page `12`: lists `54-55`
	- pages `13-14`: lists `56-58`
- First low-risk work slice: lists `38-48` on pages `1-8`.
- First interleaved risk slice: lists `49-58` on pages `9-14`, especially the Roman/Carthaginian/Sicilian and late-page continuation ranges.

Files touched:
- `CLASSIC_PERIOD_todo.md`

Validation run:
- page-count and text-density spot check via PyMuPDF
- rendered-page visual checks on sample pages `1`, `2`, `10`, and `18`

Manual acceptance:
- user has already confirmed continuing with CP-00 after adding `Classical_Period.pdf`

Next exact card:
- `CP-01 - Clean Opening Slice 38-45`

Goal: Starter-Layer für Listen 38–58 eintragen (grob, noch nicht scan-confirmed). Danach für jede Liste ein vollständiger Deep-Pass (Seitenabgleich, Blockstruktur, Bold/Italics, Optionen, Allies, Notizen).

Planned files:

- CLASSIC_PERIOD_todo.md
- docs/source/Classic_Period.md
- SOURCE_OCR_todo.md if the source-routing note needs tightening

Implementation steps:
1. Confirm page count and rendered-page workflow for `docs/source/new scan/Classical_Period.pdf`.
2. Record which printed pages cover lists `38-58`.
3. Mark the first low-risk slice and the first interleaved risk slice.

Non-goals:

- no troop-table rewriting yet

Validation:

- page-count and sample-render check complete

Expected result: the Classical deep pass has a reliable page map and a safe first work slice.

### [x] CP-01 - Scope Reset And Clean Starter Layer

Completed 2026-05-22.

Findings:
- `docs/source/Classic_Period.md` must be the single working file for the full Classical range `38-82`.
- The damaged later chat edits incorrectly introduced false `scan-confirmed` claims and duplicate placeholder content.
- The file is now reset to a clean starter-layer state with one-file scope, whole-range coverage table, and routed starter notes for the first slice.

Files touched:
- `docs/source/Classic_Period.md`

Validation run:
- markdown diagnostics clean

Expected result:
- the Classical pass now has one correct target file and no false deep-pass claims

Next exact card:
- `CP-02 - Clean Opening Slice 38-45`

### [x] CP-02 - Clean Opening Slice 38-45

Goal: harden the clearest early Classical lists first.

Progress 2026-05-22:
- lists `38-45` now have a first hardening pass in `docs/source/Classic_Period.md`
- `44` was completed conservatively across the `5-6` page break without flattening its dated Italy and Sicily option blocks

Validation:

- markdown diagnostics clean
- targeted scan review completed for printed pages `109-114`

Expected result: the opening Classical block now reaches an Ancient-style first hardening pass.

Next exact card:
- `CP-03 - Mid Classical Hardening 46-58`

Planned files:

- docs/source/Classic_Period.md

Implementation steps:
1. Migrate lists `38-45` into `Classic_Period.md` in printed-page order.
2. Normalize clear headers and troop rows from the scan.
3. Keep grouped rows where inter-page or inter-column structure is still ambiguous.

Non-goals:

- no aggressive split on mixed/interleaved pages

Validation:

- markdown diagnostics clean

### [x] CP-03 - Mid Classical Hardening 46-58

Goal: finish the remaining mid Classical slice before the later tail pages.

Progress 2026-05-22:
- lists `46-58` now have a first hardening pass in `docs/source/Classic_Period.md`
- the whole mid-Classical slice is now covered in printed-page order from `46` through `58`

Validation:

- markdown diagnostics clean
- targeted scan review completed for printed pages `115-122`

Expected result: lists `46-58` now match the same first-hardening standard as the opening Classical slice.

Next exact card:
- `CP-04 - Later Classical Tail 59-82`

Planned files:

- docs/source/Classic_Period.md

Implementation steps:
1. Add and harden lists `46-58`.
2. Resolve replacement hooks and ally bindings from the scan.
3. Preserve OCR helper wording only where the scan does not settle the row structure.

Non-goals:

- no late-Classical tail `59-82` deep pass yet

Validation:

- markdown diagnostics clean

### [x] CP-04 - Later Classical Tail 59-82

Goal: extend the same file through the later Classical tail and then deep-pass that tail in order.

Progress 2026-05-23:
- lists `59-82` now have a first hardening pass in `docs/source/Classic_Period.md`
- the later tail now runs in printed-page order from `Meroitic Kushite` through `Yayoi Japanese`
- `docs/source/Classic_Period.md` now covers the full Classical range `38-82` as the single scan-first working source

Planned files:

- docs/source/Classic_Period.md

Implementation steps:
1. Build the exact page map for lists `59-82` inside `Classical_Period.pdf` pages `15-28`.
2. Add rough coverage and then deepen those later lists in printed order.
3. Prioritize likely planning anchors such as `60`, `64`, `76`, and `79` early within that tail.

Non-goals:

- no guess-based over-splitting

Validation:

- markdown diagnostics clean
- targeted scan review completed for printed pages `123-136`

Expected result: the same Classical working file now covers the full range `38-82` at a consistent first hardening pass.

Next exact card:
- `CP-05 - QA Snapshot And Handoff`

### [x] CP-05 - QA Snapshot And Handoff

Goal: close the Classical deep pass slice cleanly.

Completed 2026-05-23.

Findings:
- `docs/source/Classic_Period.md` now records a full first hardening pass for lists `38-82` and explicitly states its own canonical role for the Classical range.
- The file-level QA snapshot now records both what is fully scan-first hardened and which few conservative grouped rows were intentionally left unsplit.
- `docs/source/army-lists.md` now points readers back to `docs/source/Classic_Period.md` for the authoritative Classical-period working source instead of silently leaving the old starter-layer wording in place.
- `SOURCE_OCR_todo.md` now reflects that the Classical deep pass completed and that the remaining OCR-corpus decisions are merge-model and later-period QA questions rather than unfinished Classical extraction.

Planned files:

- docs/source/Classic_Period.md
- SOURCE_OCR_todo.md
- docs/source/army-lists.md if a routing note is needed

Implementation steps:
1. Summarize what in `38-82` is now scan-confirmed.
2. Record the remaining conservative groupings or page-edge ambiguities that still need later tightening.
3. State whether `Classic_Period.md` is ready to act as the canonical working source for the full Classical range `38-82`.

Non-goals:

- no new source extraction pass beyond the current first hardening layer

Validation:

- diagnostics clean
- residual uncertainties are explicitly listed

Expected result: the project has a stable Classical companion corpus for lists `38-82`.