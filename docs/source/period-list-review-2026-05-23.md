# Period Army-List Review - 2026-05-23

Reviewer: AdG-Rules-Engine-Agent
Scope: `docs/source/Ancient_Period.md`, `docs/source/Classic_Period.md`, `docs/source/new scan/Ancient_Period.pdf`, `docs/source/new scan/Classical_Period.pdf`
Purpose: check whether the first two period corpora are reliable enough for continued source work and later army-designer planning.

## Status

Needs follow-up before data import, but usable as the current human/AI source layer.

- Ancient lists `1-37`: structurally complete after the 2026-05-23 repair pass.
- Classical lists `38-82`: structurally complete after stale routing markers were removed from the top-level page map.
- Both period documents should remain separate canonical working sources by epoch.
- Neither period document should be treated as direct army-designer data until a data-readiness normalization pass converts prose conditions into structured fields.

## Checks Run

- Verified both period PDFs exist and are readable.
- Counted list headings against expected ranges.
- Checked for duplicate or missing list numbers.
- Checked every list section for `Source`, `Status`, `Date range`, `Region / classification`, `Command value`, `Terrain`, and the standard troop-entry table header.
- Checked for table-cell question marks and stale placeholder markers such as `needs deep pass`, `starter coverage only`, and `pending exact map`.
- Rendered Ancient scan pages `1-2` and visually rechecked early lists after the audit found real omissions.

## Findings

### High - Ancient Lists 1-3 Had Missing Or Misplaced Rows

Area: army-builder source quality

Issue: the previous Ancient file had incomplete early-list content. `List 1 - Sumer and Akkad` contained mostly the right-column continuation, `List 2 - Sumerian Successor` lacked command/terrain/table structure plus scout/guard rows, and `List 3 - Amorite Highlanders` had visible Gasgan and Guti mercenary rows only partially represented.

Correction applied:

- Rebuilt `List 1` from Ancient scan page `1`, including opening chariot, scout, guard, core warrior, militia, Zagros, continuation, ally, strategist, and dismount entries.
- Rebuilt `List 2` metadata and troop table from Ancient scan pages `1-2`, including scouts, royal guardsmen, tail light infantry javelin, and the missing Elamite ally.
- Added the scan-visible Gasgan replacement rows and Makkan/Melukhkan Guti mercenary rows to `List 3`.
- Added missing `Source` anchors for Ancient lists `1-9`.

Rule/source basis: Ancient color scan pages `1-2`, with the known rule that each column must be read fully in printed order.

### Medium - Classical Top-Level Routing Table Was Stale

Area: source navigation

Issue: `Classic_Period.md` contained a historical routing table still saying `needs deep pass` and `pending exact map`, even though the actual list sections were already scan-first hardened.

Correction applied:

- Replaced the table with a current page map derived from each list's `Source` line.
- All Classical lists `38-82` now show `first hardening pass complete` in the top-level map.

### Medium - Human-Readable Does Not Yet Mean Data-Ready

Area: army-designer readiness

Issue: the period Markdown files are good working source references, but many army-builder-relevant concepts remain prose-heavy: shared unit pools, `replace all`, dated sub-armies, named commander variants, ally windows, terrain variants, strategist entries, dismount notes, and group restrictions.

Required follow-up:

- Add a data-readiness pass before importing to army-designer data.
- Introduce stable row IDs, condition IDs, shared pool IDs, replacement relationships, ally relationship IDs, and source anchors.
- Decide whether the first generated army-designer data should be JSON, YAML, or JS modules after schema design.

### Low - Ancient Header Status Is Mixed By History

Area: editorial consistency

Issue: Ancient lists still use a mix of `ocr-assisted, spreadsheet-crosschecked` and `scan-first, spreadsheet-crosschecked` section statuses even when rows are now scan-confirmed.

Recommended correction:

- In a later cleanup pass, normalize period file statuses to a consistent vocabulary such as `first hardening pass, scan-first` at section level and keep row-level statuses in the table.

## Current Open Verification

- Ancient and Classical are suitable for source lookup and phase planning, but a second row-by-row visual audit is still prudent before automated data import.
- Ancient early-list repairs fixed the obvious structural failures discovered by the audit, but the discovery itself argues for one future full-period row-count spot-check before declaring Ancient data-import ready.
- Classical residual caveats remain intentionally grouped in `List 76 - Scythian`, continuation-sensitive `List 80 - Warring States`, and the page-edge missile tail of `List 82 - Yayoi Japanese`.
- Strategist/general notes are not yet normalized across all period docs as first-class data fields.
- Errata overlay against army lists has not been exhaustively rechecked inside each period document.

## Improvement Rules For Future Epochs

- Keep one canonical Markdown file per epoch.
- Start every epoch with a current page map, not a historical starter table.
- Render pages early and keep page images available for re-audit.
- Treat two-column pages as left-column complete, then right-column complete.
- Use color blocks and visible unit columns before OCR text.
- Record `Source` for every list from the beginning.
- Add a file-level QA snapshot before closing a period pass.
- Separate human-readable troop rows from future data-import fields instead of trying to make one table do both jobs.
- After the human-readable pass, run a dedicated army-designer data-readiness pass.

## Army-Designer Implication

The period Markdown files are now good source references, but the Army Designer should not ingest them directly. The next source-to-data step should design a structured list schema with:

- list metadata: id, name, date range, period, region, command, terrain, strategists
- troop rows: row id, label, troop type, quality, abilities, min, max, points
- grouping: shared pool id, color-block group, replacement target, max-half modifiers
- conditions: date windows, sub-army names, commander-specific hooks, terrain variants
- allies: ally list id, date window, faction restriction, contingent notes
- notes: dismounting, camps, fortifications, special restrictions
- source anchors: period PDF page, column/block note, Markdown section, row status

Conclusion: Ancient and Classical can be treated as the current separated source foundation. They still need a structured data-readiness pass before army-designer implementation.

## User Decisions After Review

- Keep the period documents separated by epoch.
- Next source priority: start Rules-v2 as soon as the new color rules PDF is available.
- Rules-v2 example scope: extract all explicit examples plus directly associated diagrams and tables as PNGs.
- Rules-v2 file layout can remain at the planned paths for now, but `RV2-00` may move the final artifacts under a clearer `docs/source/rules/` layout if that is more ergonomic.
