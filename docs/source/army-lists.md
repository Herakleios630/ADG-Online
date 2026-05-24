# AdG V4 Army Lists Source Corpus

Status: Broad all-period routing corpus - period-specific working sources now hold the strongest Ancient and Classical list details
Created: 2026-05-21
Primary sources: `Konzepte/ArmyLists1-82.pdf`, `Konzepte/Errata_ADG_V4_English.pdf`
Spreadsheet cross-check: `Konzepte/Army_list_spreadsheet_V4 (1).xlsx`
OCR helper: `Konzepte/merged.pdf`
Execution board: `SOURCE_OCR_todo.md`

## Purpose

This file is the broad all-period army-list routing corpus for AdG Online. It should cover the printed army-list range using original project wording, normalized list tables where available, source page/list references, spreadsheet cross-checks, errata overlays, and extraction confidence.

The strongest current army-list working sources are period-specific documents:

- `docs/source/Ancient_Period.md` for Ancient lists `1-37`.
- `docs/source/Classic_Period.md` for Classical lists `38-82`.

Do not merge period documents back into this file unless the user explicitly changes the source-corpus model.

The original PDFs and spreadsheet remain authoritative. This file is not a raw full-text replacement for the army-list book.

## Extraction Status Vocabulary

- `verified`: checked against the original PDF page and errata.
- `ocr-assisted`: drafted from OCR, then reviewed enough for planning but still worth spot-checking before data import.
- `spreadsheet-crosschecked`: value or list identity was checked against `Army_list_spreadsheet_V4 (1).xlsx`.
- `needs-source-check`: OCR/table layout is not reliable enough for implementation.
- `errata-overridden`: base list entry exists but the effective rule/value is changed by errata.
- `blocked`: source cannot be resolved without manual user/PDF review.

## Army List Entry Template

```markdown
### List N - Army Name

Source: ArmyLists1-82.pdf p.X; spreadsheet sheet/range if applicable; Errata_ADG_V4_English.pdf p.Y if applicable
Status: verified | ocr-assisted | spreadsheet-crosschecked | needs-source-check | errata-overridden | blocked
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

## Coverage Checklist

- [ ] Printed list index and list numbering
- [ ] All list names and date ranges
- [ ] Region/classification fields where source provides them
- [ ] Command values and strategist/general notes
- [ ] Terrain preferences and restrictions
- [ ] Troop entries with type, quality, abilities, min, max, and points
- [ ] Options, upgrades, downgrades, replacements, and conditional entries
- [ ] Allies and allied-contingent restrictions
- [ ] Army-specific notes and special restrictions
- [ ] Camp, fortification, obstacle, and format-specific notes where list-specific
- [ ] Errata overlay applied or cross-referenced
- [ ] Spreadsheet cross-check summary for list index, points, and calculator-relevant fields

## QA Snapshot

Status: SOCR-04 started on 2026-05-21

Coverage state:
- A first coverage pass now exists across the whole printed army-list range `1-82`.
- Ancient lists `1-37` now route to `docs/source/Ancient_Period.md` for the current scan-first working source.
- Classical lists `38-82` now route to `docs/source/Classic_Period.md` for the current scan-first working source.
- Older starter blocks in this broad file are retained for all-period navigation and historical OCR context, not as the strongest data-import source.
- A retroactive SOCR recalibration pass has now been applied after user-verified corrections on `List 68`, `List 75`, and the `List 76/77` handoff. Earlier entries were re-audited conservatively: clear grouped starters were kept, but any section that depends on page continuation, two-column flow, bold subsection scope, `replace` inheritance, or narrow subgroup-header binding must still be treated as provisional until rechecked against the printed page image.

QA gates:
- Every list entry must keep explicit `Status`, `Source`, and open-verification notes where OCR remains ambiguous.
- Workbook-only starter entries must not acquire invented date, terrain, command, or troop data before direct source confirmation.
- Grouped rows for options, replacements, allies, and mixed-profile troop families should stay grouped until the original layout is checked.
- On two-column army-list spreads, each column must be read as its own page in printed-page sequence. Do not bind entries across columns just because OCR lines share the same vertical position.
- Bold subsection headers scope following rows and notes until the next bold subsection header unless the page image clearly shows otherwise.
- `Replace all` normally inherits the replaced block's min/max slot unless the page explicitly assigns a new bound; related `replace 1/2`, `min halve`, and `max halve` notes should be read as transformations of the inherited slot.
- Terrain or subgroup labels often scope only terrain, allies, and explicitly named troop hooks; do not extend them to unrelated troop rows without page-image evidence.

Normalization conventions for the current strong entries:
- `Options / replacements` is for date-gated swaps, explicit `replace some ...` lines, and profile-choice structures that change what may be fielded.
- `Allies` is for ally identity plus any visible date window or list binding; do not move ally-linked commander or troop restrictions out of adjacent notes until the page layout is checked.
- `Notes and restrictions` is for named commanders, dismount rules, elite caps, grouped-row cautions, and any OCR-stable restriction that does not cleanly belong inside one troop row.
- If OCR shows a family label clearly but not the visual binding of nearby notes, preserve the relationship in prose here instead of flattening it into normalized data.
- If a list spans a page break or shares a printed page with another list, prefer `starts on`, `continues on`, `interleaved with`, or `needs source check` wording over row-level normalization unless the column order is already verified.

Priority follow-up:
- Upgrade the strongest OCR-backed lists first, especially where command value, terrain, troop families, and option windows are already visible.
- Retire row-drift, ally-linkage, and option/replacement ambiguities through targeted page-image checks instead of broad re-transcription.
- Re-audit all continuation-heavy ranges in source order with the new rules before promoting more row-level detail: early shared-page lists `1-25`, cross-page/interleaved lists `21-58`, and late-page continuations `59-82`.

## Source Notes

Initial tool check on 2026-05-21:

- `ArmyLists1-82.pdf` exists but direct `pdfplumber` extraction returns 0 characters.
- `Army_list_spreadsheet_V4 (1).xlsx` is readable with `openpyxl` and should be used for cross-checking.
- `Errata_ADG_V4_English.pdf` extracts readable text and should be applied as an overlay.
- `merged.pdf` extracts readable OCR text and can speed up search, but it is only a helper and has known page-order issues.
- Fresh OCR may require installing or configuring an OCR engine because Tesseract is not currently on PATH.

SOCR-01 tooling decision:

- Use `merged.pdf` with `pdfplumber` or PyMuPDF as the first OCR-helper extraction path.
- Use `openpyxl` against `Army_list_spreadsheet_V4 (1).xlsx` for list ID, army name, initiative, format, and point-value cross-checks.
- Use `Errata_ADG_V4_English.pdf` direct text extraction as authoritative overlay text.
- Do not install a fresh OCR stack unless a specific army-list page fails with the existing OCR helper.
- Watch especially for table row/column drift, min/max/points relationships, options, allies, and army-specific notes.
- Watch specifically for printed pages that must be read as separate columns in page order rather than as one top-sorted OCR stream; this is now a confirmed failure mode, not just a suspicion.

## Page Map

SOCR-00 verified this source map on 2026-05-21:

- `ArmyLists1-82.pdf` has 51 pages and is image-based for local text extraction.
- `merged.pdf` pages 1-51 correspond to `ArmyLists1-82.pdf` pages 1-51.
- Mapping formula: `ArmyLists1-82.pdf page N = merged.pdf page N` when looking up OCR helper text.
- `Army_list_spreadsheet_V4 (1).xlsx` is readable and has these sheets: `Standard format (200 pts)`, `Reduced format (100 pts)`, `Big battles (300 pts)`, `Version History`, and `Armies V4`.

Source reference convention:

- Use `ArmyLists1-82.pdf p.N` as the primary printed-list reference.
- Add `merged.pdf p.N OCR helper` only as supporting extraction evidence.
- In discussion and calibration notes, printed army-list page numbers refer to the footer page numbers shown in the book, not to PDF viewer position.
- Use spreadsheet sheet names for point-format, list-index, and calculator cross-checks.
- Apply `Errata_ADG_V4_English.pdf p.N` as an overlay where it changes or clarifies a list entry.
- Mark entries as `needs-source-check` when OCR cannot safely preserve min/max, points, options, allies, or note relationships.

Sample quality baseline:

- `merged.pdf p.1` / `ArmyLists1-82.pdf p.1`: army-list intro/list OCR is usable for drafting.
- `merged.pdf p.50` / `ArmyLists1-82.pdf p.50`: late army-list OCR is usable for drafting.
- Spreadsheet sheets available for cross-check: `Standard format (200 pts)`, `Reduced format (100 pts)`, `Big battles (300 pts)`, `Version History`, `Armies V4`.

## Spreadsheet Index Anchor

Source: `Army_list_spreadsheet_V4 (1).xlsx` sheets `Armies V4` and `Standard format (200 pts)`
Status: spreadsheet-crosschecked
Applies to: list-index, workbook-structure, early SOCR-03 routing

Project wording:
- The workbook currently provides the most reliable machine-readable index anchor for the army-list corpus.
- Sheet names confirmed on 2026-05-21: `Standard format (200 pts)`, `Reduced format (100 pts)`, `Big battles (300 pts)`, `Version History`, and `Armies V4`.
- The `Armies V4` sheet contains `300` non-empty rows, which is a useful first cross-check surface for list numbering and army names before deeper page-by-page extraction from the printed list book.
- The `Standard format (200 pts)` sheet exposes a structured calculator surface where row `2` contains at least the headers `List`, `Name`, and `Initiative`, while later rows shift into camp, defenses, corps, and troop-calculator structure rather than a simple list index.

Open verification:
- Confirm whether all `300` non-empty `Armies V4` rows correspond one-to-one with printed list entries or whether header, separator, or helper rows must be filtered further.
- Cross-check the spreadsheet list index against the printed army-list PDF before treating spreadsheet order as authoritative pagination.

## Initial Army List Index Digest

Source: `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: spreadsheet-crosschecked
Applies to: list-index, naming, early corpus navigation

Project wording:
- The first verified spreadsheet index slice is enough to anchor early list navigation and future page-by-page extraction.
- First `25` list IDs and names currently confirmed from `Armies V4`:

| List | Army name | Status |
| --- | --- | --- |
| 1 | Sumer and Akkad | spreadsheet-crosschecked |
| 2 | Sumerian Successor | spreadsheet-crosschecked |
| 3 | Amorite Highlanders | spreadsheet-crosschecked |
| 4 | Elamite | spreadsheet-crosschecked |
| 5 | Old Assyrian and Babylonian | spreadsheet-crosschecked |
| 6 | Kassite Babylonian | spreadsheet-crosschecked |
| 7 | Assyrian | spreadsheet-crosschecked |
| 8 | Neo-Babylonian | spreadsheet-crosschecked |
| 9 | Assyrian Empire and Sargonid | spreadsheet-crosschecked |
| 10 | Old and Middle Kingdom Egyptian | spreadsheet-crosschecked |
| 11 | Nubian | spreadsheet-crosschecked |
| 12 | Libyan | spreadsheet-crosschecked |
| 13 | Hyksos | spreadsheet-crosschecked |
| 14 | New Kingdom Egyptian | spreadsheet-crosschecked |
| 15 | Libyan Egyptian | spreadsheet-crosschecked |
| 16 | Kushite Egyptian | spreadsheet-crosschecked |
| 17 | Ancient Bedouin | spreadsheet-crosschecked |
| 18 | Syrian City States | spreadsheet-crosschecked |
| 19 | Oman and Gulf States | spreadsheet-crosschecked |
| 20 | Hittite | spreadsheet-crosschecked |
| 21 | Hurri-Mitanni | spreadsheet-crosschecked |
| 22 | Syria, Canaan and Ugarit | spreadsheet-crosschecked |
| 23 | Ancient Hebrew | spreadsheet-crosschecked |
| 24 | Sea Peoples | spreadsheet-crosschecked |
| 25 | Philistine | spreadsheet-crosschecked |

Open verification:
- Add printed-page references for these index rows during the first page-by-page army-list extraction pass.
- Check whether any of these names are shortened or normalized differently in the printed PDF or errata.

## Early Printed Index Cross-Check - Lists 1-10

Source: `ArmyLists1-82.pdf` p.4 index page via `merged.pdf p.4 OCR helper`; `ArmyLists1-82.pdf` p.7-12 page-map cross-check; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Applies to: early page anchors, list-index routing, first page-by-page extraction pass

Project wording:
- The earliest reliable printed-page anchor for `SOCR-03` comes from the army-list index page rather than from direct OCR of every early list body.
- The printed index on `ArmyLists1-82.pdf` page `4` shows early list entries with internal printed page numbers `92` through `97`.
- Combined with the already verified corpus page map and direct OCR spot checks on early list pages, this yields a conservative early mapping where printed pages `92-97` correspond to `ArmyLists1-82.pdf` pages `7-12` for the first ten lists.
- This mapping is currently suitable for corpus navigation and source anchoring, but not yet for full troop-table transcription.

| List | Army name | Printed index page | ArmyLists1-82.pdf page | Evidence status |
| --- | --- | --- | --- | --- |
| 1 | Sumer and Akkad | 92 | 7 | ocr-assisted, spreadsheet-crosschecked |
| 2 | Sumerian Successor | 92 | 7 | ocr-assisted, spreadsheet-crosschecked |
| 3 | Amorite Highlanders | 93 | 8 | ocr-assisted, spreadsheet-crosschecked |
| 4 | Elamite | 93 | 8 | ocr-assisted, spreadsheet-crosschecked |
| 5 | Old Assyrian and Babylonian | 94 | 9 | ocr-assisted, spreadsheet-crosschecked |
| 6 | Kassite Babylonian | 94 | 9 | ocr-assisted, spreadsheet-crosschecked |
| 7 | Assyrian | 95 | 10 | ocr-assisted, spreadsheet-crosschecked |
| 8 | Neo-Babylonian | 95 | 10 | ocr-assisted, spreadsheet-crosschecked |
| 9 | Assyrian Empire and Sargonid | 96 | 11 | ocr-assisted, spreadsheet-crosschecked |
| 10 | Old and Middle Kingdom Egyptian | 97 | 12 | ocr-assisted, spreadsheet-crosschecked |

Open verification:
- Confirm that the inferred `printed page - 85 = ArmyLists1-82.pdf page` relationship continues to hold outside this early slice before using it as a wider corpus rule.
- Directly inspect list bodies for lists `2-9` before adding structured troop rows, because current OCR snippets show continuation pages more reliably than fresh headers.
- Check whether any of the early lists spill across multiple pages in ways that need explicit `starts on` versus `continues on` markers.
- No direct errata hits were found yet for the exact list names `1-10`, but this absence still needs a later list-by-list errata overlay pass.

## Printed Index Cross-Check - Lists 11-25

Source: `ArmyLists1-82.pdf` p.4 index page via `merged.pdf p.4 OCR helper`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Applies to: page anchors, mid-early corpus routing, later page-by-page extraction

Project wording:
- The printed index on `ArmyLists1-82.pdf` page `4` also gives a conservative next routing layer for lists `11-25`.
- OCR is weaker in this slice than for lists `1-10`, but the category order and list-name sequence remain consistent enough to anchor later extraction passes.
- These anchors are suitable for navigation and section planning, not yet for troop-table transcription unless a later page-level OCR pass confirms the local header block.

| List | Army name | Printed index page | Evidence status |
| --- | --- | --- | --- |
| 11 | Nubian | 97 | ocr-assisted, spreadsheet-crosschecked |
| 12 | Libyan | 97 | ocr-assisted, spreadsheet-crosschecked |
| 13 | Hyksos | 98 | ocr-assisted, spreadsheet-crosschecked |
| 14 | New Kingdom Egyptian | 98 | ocr-assisted, spreadsheet-crosschecked |
| 15 | Libyan Egyptian | 99 | ocr-assisted, spreadsheet-crosschecked |
| 16 | Kushite Egyptian | 99 | ocr-assisted, spreadsheet-crosschecked |
| 17 | Ancient Bedouin | 100 | ocr-assisted, spreadsheet-crosschecked |
| 18 | Syrian City States | 100 | ocr-assisted, spreadsheet-crosschecked |
| 19 | Oman and Gulf States | 100 | ocr-assisted, spreadsheet-crosschecked |
| 20 | Hittite | 101 | ocr-assisted, spreadsheet-crosschecked |
| 21 | Hurri-Mitanni | 101 | ocr-assisted, spreadsheet-crosschecked |
| 22 | Syria, Canaan and Ugarit | 102 | ocr-assisted, spreadsheet-crosschecked |
| 23 | Ancient Hebrew | 102 | ocr-assisted, spreadsheet-crosschecked |
| 24 | Sea Peoples | 103 | ocr-assisted, spreadsheet-crosschecked |
| 25 | Philistine | 103? | ocr-assisted, spreadsheet-crosschecked |

Open verification:
- Recheck the printed index visually for `List 25 - Philistine`, because the OCR line breaks near the `24/25/26` block are less stable than the earlier sections.
- Confirm the corresponding `ArmyLists1-82.pdf` page offsets before extending the `printed page - 85` mapping beyond the `1-10` slice.
- Use direct page OCR or visual review before promoting any of these anchors into body-level troop transcription beyond Lists `11` and `12`.

## Army Lists Corpus

The full source-order corpus will be filled by `SOURCE_OCR_todo.md` cards `SOCR-00` through `SOCR-04`.

Current routing note: use `docs/source/Ancient_Period.md` for the canonical scan-first Ancient lists `1-37`, and `docs/source/Classic_Period.md` for the canonical scan-first Classical lists `38-82`.

### List 1 - Sumer and Akkad

Source: `ArmyLists1-82.pdf` p.7; `merged.pdf` p.7 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `3000 - 2004 BC`
Region / classification: `Ancient Period`, `Sumer & Babylon`
Command value: `+4`
Terrain: `Plain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and named strategist candidates `King Agga (2700 BC)` and `Sargon of Akkad (2334-2279 BC)`.
- The introductory historical paragraph is readable enough to confirm list identity, but troop-table structure drops into noisy OCR immediately after the first rows.

Open verification:
- Separate the page `7` opening rows from any continuation rows before normalizing troop entries.
- Confirm whether the first troop line should be transcribed as `Five-wheeled battle cars` with `Heavy chariot` classification and whether the visible `24` belongs to unit count, date gating, or OCR drift.
- Check whether strategist candidates impose any list-building or command effects beyond historical labeling.

### List 2 - Sumerian Successor

Source: `ArmyLists1-82.pdf` p.7; `merged.pdf` p.7 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `2028 - 1460 BC`
Region / classification: `Ancient Period`, `Sumer & Babylon`
Command value: `+4`
Terrain: `Plain`

Notes and restrictions:
- The lower part of `merged.pdf` page `7` clearly exposes the new list header, date range, terrain, and command value after the close of List `1`.
- The first visible troop lines include `4-wheeled battle cars`, `Chariots with 2 horses`, and `Scouts on equids`, but the page cut happens before the row structure is stable.

Open verification:
- Separate the first rows of List `2` from the closing ally/note block of List `1` before normalizing troop entries.
- Confirm whether `Upgrade to elite +2` belongs only to `Chariots with 2 horses` or to a wider grouped option block.

### List 3 - Amorite Highlanders

Source: `ArmyLists1-82.pdf` p.8; `merged.pdf` p.8 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `3000 - 1000 BC`
Region / classification: `Ancient Period`
Command value: `+3`
Terrain: `Mountain, add Plain from 2193 to 2112 BC`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain line, and command value on `merged.pdf` page `8`.
- The body also shows visible date-gated and event-gated notes such as `After 1800`, `Guti, in The Great Revolt circa 2250 BC`, and `Guti, between 2193 and 2112 BC`, which indicates this list will need careful conditional-row handling.

Open verification:
- Confirm whether `add Plain from 2193 to 2112 BC` is terrain expansion for the whole list or only for a historical sub-period.
- Keep `Guti` and allied-subject blocks attached to their date windows during later troop normalization.

### List 4 - Elamite

Source: `ArmyLists1-82.pdf` p.8; `merged.pdf` p.8 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: spreadsheet-crosschecked, needs-source-check
Date range: needs-source-check
Region / classification: needs-source-check
Command value: needs-source-check
Terrain: needs-source-check

Notes and restrictions:
- Identity and page anchor are reliable from the printed index and spreadsheet, but the available OCR slice for page `8` is dominated by the end of List `2` and the start of List `3`.
- `Elamite mercenaries` and `Elamite allies` are visible in the surrounding OCR, but that is not enough yet to isolate the List `4` header block safely.

Open verification:
- Re-read the full `ArmyLists1-82.pdf` page `8` visual layout before assigning header fields or troop rows to List `4`.
- Do not infer command, terrain, or date range from adjacent ally references.

### List 5 - Old Assyrian and Babylonian

Source: `ArmyLists1-82.pdf` p.9; `merged.pdf` p.9 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1900 - 1595 BC`
Region / classification: `Ancient Period`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- The List `5` header appears clearly in the lower half of `merged.pdf` page `9`.
- The opening troop rows show `Chariots with 2 horses`, `Light cavalry bow mediocre`, `Warriors`, and `Sabum Qallatum`, but the row boundaries are still noisy enough that structured normalization should stay conservative.

Open verification:
- Confirm whether the visible `Upgrade to elite +2` attaches only to the chariot row.
- Check whether `Warriors` contains multiple alternative troop lines or a single grouped row with nested options.

### List 6 - Kassite Babylonian

Source: `ArmyLists1-82.pdf` p.9; `merged.pdf` p.9 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: spreadsheet-crosschecked, needs-source-check
Date range: needs-source-check
Region / classification: needs-source-check
Command value: needs-source-check
Terrain: needs-source-check

Notes and restrictions:
- Identity and page anchor are reliable, but the currently extracted OCR for page `9` captures the end of earlier rows and the clean start of List `5`, not a separate List `6` header.
- Visible late-page lines mention replacement of battle cars by chariots and later allied options, which may belong to List `6`, but that association is not yet safe.

Open verification:
- Re-inspect page `9` visually or with a tighter OCR crop before assigning any late-page conditional lines to List `6`.
- Do not normalize `From 1800 BC` and later-option blocks into List `6` until the page break between Lists `5` and `6` is explicit.

### List 7 - Assyrian

Source: `ArmyLists1-82.pdf` p.10; `merged.pdf` p.10 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1365 - 745 BC`
Region / classification: `Ancient Period`
Command value: `+5`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and named strategist block on `merged.pdf` page `10`.
- The first troop lines show strong structure for `Chariots with 2 horses`, `Chariots with 3 horses (after 890 BC)`, `Pethalle cavalry (after 890 BC)`, `Asharittu warriors`, and `Hupshu warriors`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite +2`; shared elite cap may apply | ? | ? | 9 | OCR clearly shows the row start and upgrades, but not the final unit bounds in a stable column alignment. | needs-source-check |
| Chariots with 3 horses (after 890 BC) | Heavy chariot impact | ordinary | `after 890 BC`; `max 12`; `upgrade to elite +2`; may share global elite cap | ? | 12 | 11 | The date gate and `max 12` are readable, but the exact min column still needs page-image confirmation. | needs-source-check |
| Pethalle cavalry (after 890 BC) | Medium cavalry bow | ordinary | `after 890 BC`; `downgrade to mediocre -2` | 0 | 4 | 9 | One of the clearest gated cavalry rows on the page. | needs-source-check |
| Asharittu warriors | Medium swordsmen | elite | impact; `add support +1` | ? | ? | 9 | OCR structure is strong enough to preserve as a grouped elite impact row. | needs-source-check |
| Hupshu warriors | Medium swordsmen | ordinary | support; `mixed formation option` visible | ? | ? | 7 | The mixed-formation note clearly belongs near this block, but exact row attachment needs confirmation. | needs-source-check |
| Bowmen | Bowmen | mediocre | `Light infantry bow` appears as adjacent linked option/sub-row | ? | ? | 5 | Preserve this as a visible shooting row without overcommitting the linked light-infantry structure. | needs-source-check |
| Arameans | Javelinmen | mediocre | adjacent `Light infantry javelin` option visible | ? | ? | 5 | OCR shows the label and main troop type, but linked counts/options need a page-image check. | needs-source-check |

Open verification:
- Preserve the `after 890 BC` gating as a structural rule rather than flattening it into unconditional troop rows.
- Confirm whether `Upgrade to elite (max 4 in total)` is shared across both chariot families or only one of them.
- Confirm whether `Bowmen` and `Arameans` each own a linked light-infantry sub-row or whether the OCR is collapsing separate lines.

### List 8 - Neo-Babylonian

Source: `ArmyLists1-82.pdf` p.10; `merged.pdf` p.10 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: spreadsheet-crosschecked, needs-source-check
Date range: needs-source-check
Region / classification: needs-source-check
Command value: needs-source-check
Terrain: needs-source-check

Notes and restrictions:
- Identity and page anchor are secure from the index layer, but the current page `10` OCR is split between the close of an earlier list and the strong start of List `7`.
- A noisy line referencing `Neo-Babylonian allies (List #8 Neo-Babylonian)` appears on page `9`, but this is ally evidence only, not a safe List `8` header.

Open verification:
- Re-extract page `10` with a later starting slice or visual crop to isolate the actual List `8` header block.
- Keep all current page-10 material out of List `8` troop normalization until that header is confirmed.

### List 9 - Assyrian Empire and Sargonid

Source: `ArmyLists1-82.pdf` p.11; `merged.pdf` p.11 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `745 - 609 BC`
Region / classification: needs-source-check
Command value: `+6`
Terrain: `Mountain`

Notes and restrictions:
- The lower half of `merged.pdf` page `11` clearly exposes the list name, date range, terrain, command value, and strategist block for the Sargonid army.
- The first visible rows show `Chariots with 4 horses`, `Horsemen`, `Cimmerians`, `Scouts on camels`, and `Foot guardsmen`, which makes this another good candidate for later cautious row normalization.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 4 horses | Heavy chariot impact | ordinary | `upgrade to elite +2` | 2 | 4 | 11 | The first row on page `11` is one of the clearest early Sargonid rows. | needs-source-check |
| Horsemen | Medium cavalry bow / Heavy cavalry bow | ordinary | heavy variant `max 4`; `upgrade to elite` visible nearby | 2 | 8 | 9 / 11 | OCR strongly suggests a dual-profile horsemen block with one heavier capped variant. | needs-source-check |
| Cimmerians | Light cavalry bow | ordinary | ? | 0 | 2 | 6 | The entry label and light cavalry type are readable, but adjacent punctuation is noisy. | needs-source-check |
| Scouts on camels | Light camelry bow | mediocre | ? | 0 | 1 | 5 | The unit label and quality are readable enough to retain conservatively. | needs-source-check |
| Foot guardsmen | Medium swordsmen / Heavy swordsmen | elite | `add armour +2` visible on heavy variant block | 0 | 2 | 8 / 10 | OCR suggests another dual-profile guardsmen row before later mercenary and levy lines. | needs-source-check |

Open verification:
- Confirm whether the blurred leading characters before `5- 609 BC` are just OCR loss of `745 - 609 BC` rather than a different date range.
- Recheck whether the terrain line is only `Mountain` or whether an earlier cropped word is missing from the OCR.
- Confirm whether the horsemen block should be normalized as one entry with two profiles or as separate medium and heavy cavalry rows.

### List 10 - Old and Middle Kingdom Egyptian

Source: `ArmyLists1-82.pdf` p.12; `merged.pdf` p.12 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `3000 - 1550 BC`
Region / classification: `Ancient Egypt`
Command value: `+4`
Terrain: `Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the introductory period split between `Old Kingdom (3000 to 2260 BC)` and `Middle Kingdom (2260 to 1550 BC)`.
- The page also shows the start of troop content including `Guardsmen and Sherden`, `From 1640 BC`, `Warriors`, `Archers`, and `Conscripts`, but not yet with enough confidence to normalize the full rows cleanly.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Guardsmen and Sherden | Medium swordsmen / Heavy swordsmen | elite | `2HW`; dual-profile OCR block | ? | 4 | `9 / 11` | OCR suggests one guarded row with two weapon-weight variants before the visible `0-4` limit. | needs-source-check |
| From 1640 BC | Light chariot bow | elite | date-gated | ? | ? | ? | The OCR clearly shows a date-gated chariot line, but the count and cost are not isolated yet. | needs-source-check |
| Warriors | Medium swordsmen | ordinary | impact | ? | ? | 7 | The `Warriors` row is one of the clearest early normalized lines on the page. | needs-source-check |
| Archers | Bowmen | ordinary | `downgrade to mediocre -2` | 4 | 12 | 7 | This row is readable enough to preserve as a first structured transcription candidate. | needs-source-check |
| Conscripts | Medium swordsmen | mediocre | ? | ? | ? | ? | Only the row start is reliable so far; later values need page-image confirmation. | needs-source-check |

Open verification:
- Confirm whether `From 1640 BC` gates only `Light chariot bow elite` or a larger sub-block of troop options.
- Separate troop-row labels from quality and weapon tags where OCR blends them, especially `Medium swordsmen 2HW elite` and `Heavy swordsmen 2HW elite`.
- Check whether the visible period split implies sub-list constraints or only historical description.
- Confirm whether `Nubians`, `Libyans and Egyptians`, `Bedouins`, and `Pharaoh in litter` belong to List `10` proper or begin a trailing transition toward List `11` on the same page.

### List 11 - Nubian

Source: `ArmyLists1-82.pdf` p.12; `merged.pdf` p.12 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `3000 - 593 BC`
Region / classification: `Ancient Egypt`
Command value: `+2`
Terrain: `Plain, Desert`

Notes and restrictions:
- The lower half of `merged.pdf` page `12` clearly exposes the list header, date range, terrain, and command value for List `11`.
- The first visible troop labels include `Warriors with bow`, `Fanatic warriors`, and `Javelinmen`, which is enough to anchor later detailed extraction.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warriors with bow | Bowmen / Light infantry bow | ordinary | `upgrade to elite (max 4)`; `downgrade to mediocre` visible in same OCR block | ? | ? | ? | OCR clearly shows a two-profile bow block, but the exact point and unit columns are not stable enough yet. | needs-source-check |
| Fanatic warriors | Medium swordsmen | ordinary | impetuous; `upgrade to elite` visible | ? | ? | ? | The row label and main type are readable, but the cost and bounds are not isolated. | needs-source-check |
| Javelinmen | Light infantry javelin | ordinary | ? | ? | ? | ? | This line appears as the third readable troop family before the page transitions into List `12`. | needs-source-check |

Open verification:
- Confirm whether the page `12` tail still belongs fully to List `11` before later rows start List `12`.
- Separate `Upgrade to elite`, `Downgrade to mediocre`, and `Light infantry bow` phrases into the correct troop rows before any structured normalization.
- Confirm whether the `Warriors with bow` block should be one row with two profiles or two separate troop entries.

### List 12 - Libyan

Source: `ArmyLists1-82.pdf` p.12; `merged.pdf` p.12 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `3000 BC - 70 AD`
Region / classification: `Ancient Egypt`
Command value: `+2`
Terrain: `Desert`

Notes and restrictions:
- OCR clearly exposes the list header and the first sequence of time-gated notes such as `From 1250 BC`, `From 1208 to 651 BC`, and `From 650 BC`.
- The first visible troop labels include `Libyan warriors`, `Bowmen`, `Light infantry javelin`, `Light infantry bow`, and later chariot and replacement blocks.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Libyan warriors | Javelinmen / Bowmen | ordinary | both visible with `downgrade to mediocre -2` options | ? | ? | ? | OCR suggests a shared opening warrior block with at least two missile/melee profiles before the skirmisher rows. | needs-source-check |
| Light infantry javelin | Light infantry javelin | ordinary | ? | ? | ? | 4 | One of the clearest isolated troop lines on the page. | needs-source-check |
| Light infantry bow | Light infantry bow | ordinary | ? | ? | ? | 4 | Visible directly after the javelin line, but row attachment to the Libyan warrior block still needs confirmation. | needs-source-check |
| From 1250 BC | Light chariot bow | ordinary | date-gated; `upgrade to elite +2` | ? | ? | 9 | The date-gated chariot replacement block is clear enough to preserve conservatively. | needs-source-check |
| From 1208 to 651 BC | Medium swordsmen | ordinary | impetuous; replacement block; `upgrade to elite (max 4) +2` | ? | ? | 6 | OCR clearly shows this as a time-gated replacement to some warrior entries. | needs-source-check |
| From 650 BC | Light chariot javelin | ordinary | replacement block; `upgrade to elite (max 4)` | ? | ? | 8 | The later chariot replacement is readable, but the trailing value block is noisy. | needs-source-check |

Open verification:
- Keep the three visible date-gated replacement blocks attached to their exact historical windows during later normalization.
- Confirm whether the trailing `Garamantes after 200 BC` line is part of List `12` or the opening of a later row block continuing off-page.
- Confirm whether the opening `Libyan warriors` block should be split into separate `Javelinmen` and `Bowmen` rows or kept as one grouped entry with two profiles.

### List 13 - Hyksos

Source: `ArmyLists1-82.pdf` p.13; `merged.pdf` p.13 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1650 - 1546 BC`
Region / classification: `Ancient Egypt`
Command value: `+4`
Terrain: `Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and introductory paragraph on `merged.pdf` page `13`.
- The opening troop block is readable enough to show `Chariots with 2 horses`, `Light cavalry bow mediocre`, `Warriors`, `Canaanite and Amorite warriors`, and Egyptian ally references.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4)` | 2 | 8 | 9 | The opening chariot row is readable enough to preserve conservatively. | needs-source-check |
| Light cavalry bow | Light cavalry bow | mediocre | ? | 0 | 1 | 4 | This row appears clearly below the chariot block. | needs-source-check |
| Warriors | Medium swordsmen | ordinary | impact | ? | 12 | ? | OCR strongly suggests a core impact-warrior block, but the points column is unstable. | needs-source-check |
| Canaanite and Amorite warriors | Medium swordsmen / Javelinmen / Light infantry javelin | ordinary | multi-profile OCR block | 0 | 8 | `6 / 7 / 4` | This is visible as a grouped mixed troop family and should remain grouped until the page image is checked. | needs-source-check |

Open verification:
- Confirm the exact min/max and upgrade columns for the opening chariot block before any structured normalization.
- Keep the Egyptian ally note and `Egyptian light chariot` wording attached to the correct ally or troop block.
- Confirm whether the `Warriors` and `Canaanite and Amorite warriors` lines are separate blocks or part of one wider grouped infantry family.

### List 14 - New Kingdom Egyptian

Source: `ArmyLists1-82.pdf` p.13; `merged.pdf` p.13 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1550 - 1070 BC`
Region / classification: `Ancient Egypt`
Command value: `+5`
Terrain: `Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and strategist references including `Thutmosis III` and `Ramesses III`.
- The available OCR slice stops in the historical paragraph, so this is a header-level starter only for now.

Open verification:
- Re-read the lower half of page `13` or the start of page `14` before assigning any troop rows to List `14`.
- Confirm the full strategist line, because the OCR splits the names and date ranges across several lines.

### List 15 - Libyan Egyptian

Source: `ArmyLists1-82.pdf` p.14; `merged.pdf` p.14 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `945 - 700 BC`
Region / classification: `Ancient Egypt`
Command value: `+3`
Terrain: `Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening troop families on `merged.pdf` page `14`.
- Visible troop labels include `Chariots with 2 horses`, `Medium cavalry mediocre`, `Light cavalry bow mediocre`, `Meshwesh Libyan warriors`, `Sherden guardsmen`, `Egyptian guardsmen`, `Egyptian warriors`, `Egyptian archers`, `Libu warriors`, and `Bedouins and Palestinians`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4) +2` | 2 | 8 | ? | The row structure is readable, but the points column is partially blurred by OCR. | needs-source-check |
| Medium cavalry | Medium cavalry | mediocre | ? | 0 | 3 | 5 | One of the clearer cavalry lines on the page. | needs-source-check |
| Light cavalry bow | Light cavalry bow | mediocre | ? | 0 | 2 | 4 | Readable enough to retain as a separate skirmishing cavalry row. | needs-source-check |
| Meshwesh Libyan warriors | Medium swordsmen / Heavy swordsmen | impetuous | `upgrade to elite (all or none) +2` | 4 | 8 | `6 / 8` | OCR suggests a dual-profile impetuous warrior block. | needs-source-check |
| Bedouins and Palestinians | Javelinmen / Light infantry javelin | mediocre / ordinary | ? | 0 | 4 | `5 / 4` | Preserve this as a grouped mixed light-troop family until page-image confirmation. | needs-source-check |

Open verification:
- Confirm whether `Upgrade to elite (all or none)` applies only to the `Meshwesh Libyan warriors` block.
- Separate the Egyptian and Libyan troop families carefully, because OCR compression makes several adjacent rows look contiguous.
- Confirm whether the Sherden, Egyptian guardsmen, Egyptian warriors, and Egyptian archers rows should be normalized as separate Egyptian contingent entries or as one clustered sub-block.

### List 16 - Kushite Egyptian

Source: `ArmyLists1-82.pdf` p.14; `merged.pdf` p.14 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `850 - 660 BC`
Region / classification: `Ancient Egypt`
Command value: `+4`
Terrain: `Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the beginning of the first troop block on `merged.pdf` page `14`.
- The first readable troop lines include `Chariots with 2 or 4 horses`, `Light chariot armour bow`, `Heavy chariot impetuous`, and `Kushite horsemen` with medium/heavy cavalry variants.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 or 4 horses | Light chariot armour bow / Heavy chariot impetuous | ordinary | `upgrade to elite +2` visible for the combined block | ? | ? | `11 / 10` | OCR indicates a two-profile chariot family, but exact count columns still need confirmation. | needs-source-check |
| Kushite horsemen | Medium cavalry / Heavy cavalry | ordinary | heavy variant `max 4` visible | ? | 4 | 9 | The cavalry family is clear enough to preserve as a grouped entry. | needs-source-check |

Open verification:
- Confirm whether `Light chariot armour bow` is the correct transcription or an OCR blend of armour and bow traits.
- Re-read the lower page block before assigning exact min/max values to the cavalry variants.
- Confirm whether the `Kushite horsemen` family should stay grouped or split into separate medium and heavy cavalry rows.

### List 17 - Ancient Bedouin

Source: `ArmyLists1-82.pdf` p.15; `merged.pdf` p.15 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `? - 300 BC`
Region / classification: `Middle East`
Command value: `+2`
Terrain: `Desert, Steppe`

Notes and restrictions:
- OCR clearly exposes the list identity as `Ancient Bedouin` on `merged.pdf` page `15`, but the opening date text is partially lost at the left edge.
- The page shows readable troop families such as warriors on foot, camelry variants, bowmen protected by camels, and several time-bounded ally references.
- The list also contains a clear note that bowmen protected by kneeling camels have an effect equivalent to stakes.

Open verification:
- Re-read the left edge of the header to recover the full starting date and clean command-line transcription.
- Preserve the camel-protection note as a rules-bearing list note rather than flattening it into a troop ability prematurely.

### List 18 - Syrian City States

Source: `ArmyLists1-82.pdf` p.15; `merged.pdf` p.15 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `2800 - 2200 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Plain, Mountain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening troop block on `merged.pdf` page `15`.
- Visible troop labels include `4-wheeled battle cars`, `Heavy chariot`, `Light cavalry javelin mediocre`, `Guardsmen with axes`, `Militia`, `Bowmen mediocre`, `Javelinmen`, `Light infantry sling`, `Light infantry bow`, and `Light infantry javelin`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4-wheeled battle cars | Heavy chariot | ordinary | ? | 0 | 2 | 9 | The opening chariot row is one of the clearest Syrian City States lines. | needs-source-check |
| Light cavalry javelin | Light cavalry javelin | mediocre | ? | 0 | 1 | 4 | Readable as a separate mounted skirmisher row beside the battle cars. | needs-source-check |
| Guardsmen with axes | Medium swordsmen | elite | impact | 0 | 2 | 7 | The row label and main type are readable, though punctuation is noisy. | needs-source-check |
| Militia | Medium spearmen / Heavy spearmen | mediocre | `add pavise +1`; `upgrade to ordinary (max 1) +2` | 4 | 8 | `5 / 6` | OCR shows a dual-profile militia block with a shared pavise/quality option. | needs-source-check |
| Bowmen | Bowmen | mediocre | `upgrade to ordinary (max 4) +2` | 4 | 12 | 5 | This is a clear ranged row in the opening block. | needs-source-check |
| Javelinmen | Javelinmen / Light infantry javelin | ordinary | `downgrade to mediocre -2`; light-infantry cap visible | 2 | 12 | `7 / 4` | Preserve as a grouped mixed javelin family until a page-image pass confirms the split. | needs-source-check |

Open verification:
- Confirm whether `Upgrade to ordinary` belongs to the militia and bowmen sub-blocks exactly as the OCR currently suggests.
- Re-check the `Javelinmen` max value because the OCR line is noisy in the units column.
- Confirm whether `Light infantry sling`, `Light infantry bow`, and `Light infantry javelin` are independent rows or nested under the nearby missile troop families.

### List 19 - Oman and Gulf States

Source: `ArmyLists1-82.pdf` p.15 or p.16 via printed index anchor `100`; `merged.pdf` nearby OCR pages `15-16`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: spreadsheet-crosschecked, needs-source-check
Date range: needs-source-check
Region / classification: `Middle East`
Command value: needs-source-check
Terrain: needs-source-check

Notes and restrictions:
- The printed index and spreadsheet both place List `19 - Oman and Gulf States` in the same early Middle East block as Lists `17` and `18`.
- The current OCR slices for pages `15-16` do not yet isolate the List `19` header cleanly enough to assign header fields or troop rows without guesswork.

Open verification:
- Re-extract the relevant page region around the end of page `15` and start of page `16` before assigning any body-level data to List `19`.
- Do not infer List `19` header values from adjacent Bedouin or Syrian City States material.

### List 20 - Hittite

Source: `ArmyLists1-82.pdf` p.16; `merged.pdf` p.16 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1680 - 1180 BC`
Region / classification: `Middle East`
Command value: `+5`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and strategist references on `merged.pdf` page `16`.
- The opening troop block shows pre-1380 and post-1380 structure, including Hittite chariots, scouts, Gasgans, Anatolians, and Mitanni/Syro-Canaanite/Ugarit linked material.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hittite chariots (before 1380 BC) | Light chariot javelin / Light chariot bow | ordinary | javelin variant `max 1/2`; `add armour`; `upgrade to elite (max 4 in total)` | ? | ? | 8 / ? | OCR clearly shows a two-profile pre-1380 chariot family, but one points cell remains unstable. | needs-source-check |
| Scouts | Light cavalry bow | mediocre | ? | ? | ? | ? | The troop family label is clear, but the adjacent points/units columns are distorted. | needs-source-check |
| Hittite Empire from 1380 BC | Heavy chariot impact | ordinary | replacement block; `upgrade to elite (max 4 in total)` | ? | ? | ? | Preserve this as the main post-1380 replacement/gating anchor. | needs-source-check |
| Syro-Canaanite chariots | Light chariot javelin / Light chariot bow | ordinary | javelin variant `max 12`; `add armour` on bow variant visible | ? | 12 | `8 / 9` | OCR clearly suggests a two-profile vassal chariot family. | needs-source-check |
| Ugarit chariots | Heavy chariot impetuous | ordinary | `max 2` | 0 | 2 | ? | The row label and cap are readable, but the points cell is not isolated. | needs-source-check |
| Gasgans | Medium swordsmen | impetuous | ? | ? | ? | 6 | One of the clearest infantry labels in the Hittite block. | needs-source-check |
| Anatolians | Javelinmen | ordinary | ? | ? | ? | ? | The family label and troop type are readable, but the row does not fully stabilize in OCR. | needs-source-check |

Options / replacements:
- `Hittite Empire from 1380 BC` replaces some early Hittite chariots with `Heavy chariot impact` and introduces later linked chariot families.

Allies:
- `Mitanni allies (List #21 Hurri-Mitanni)` are explicitly visible inside the post-`1380 BC` block.

Notes and restrictions:
- The OCR shows an early and late historical split inside the list rather than one flat troop table.

Open verification:
- Confirm the exact points and min/max columns for the pre-1380 Hittite chariot family, especially the dual light-chariot profiles.
- Keep the `from 1380 BC` structure as a rules-bearing phase gate rather than flattening it into unconditional troop options.
- Confirm whether `Mitanni allies` belongs as a list note, an ally option, or a condition attached only to the empire-era block.

### List 21 - Hurri-Mitanni

Source: `ArmyLists1-82.pdf` p.16; `merged.pdf` p.16 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1600 - 1250 BC`
Region / classification: `Middle East`
Command value: `+4`
Terrain: `Plain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and historical paragraph on `merged.pdf` page `16`.
- The opening troop rows are partially readable on page `16` and continue on page `17`, with visible families including `Chariots with 2 horses`, `Shukitulili`, `Bedouins`, `Levy`, and later Ugarit-related replacement material.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour`; `upgrade to elite (max 8)` | ? | ? | 9 | The opening chariot row is readable at the page boundary and should be preserved. | needs-source-check |
| Light cavalry bow | Light cavalry bow | mediocre | ? | ? | ? | 4 | Visible directly below the chariot block on page `16`. | needs-source-check |
| Shukitulili | Medium swordsmen | ordinary | `add support` visible | ? | ? | 6 | The name and type are clear enough for a conservative grouped row. | needs-source-check |
| Bedouins | Javelinmen / Light infantry javelin / Light infantry bow / Light infantry sling | ordinary | multi-profile light-troop family | `2 / 0 / 0 / ?` | `6 / 4 / ? / ?` | `7 / 4 / 4 / ?` | The block spans the page break and should remain grouped until the full image is checked. | needs-source-check |
| Levy | Levy | mediocre | replacement-visible block nearby | 0 | 2 | 3 | The Levy line is readable near the page-break continuation. | needs-source-check |

Options / replacements:
- `Ugarit after 1275 BC` and later `replace some chariots with 2 horses` are visible as a structured historical replacement block across the page break.
- A later visible block also shows replacement of `Royal Guardsmen`, but the OCR is still too noisy to assign the exact replacement family safely.

Allies:
- `Bedouin allies (List #17 Ancient Bedouin)`.
- `Hittite allies (List #20 Hittite)` after `1350`.
- `Canaanite allies (List #22 Syria, Canaan and Ugarit)` before `1350`.

Open verification:
- Reconstruct the full page-break continuation before splitting `Bedouins` and later mixed-formation/Ugarit replacement lines into separate entries.
- Confirm whether `Shukitulili` and the nearby support note belong to a single row or a wider infantry block.

### List 22 - Syria, Canaan and Ugarit

Source: `ArmyLists1-82.pdf` p.17; `merged.pdf` p.17 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1755 - 1100 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and opening troop block on `merged.pdf` page `17`.
- Visible troop families include `chariots with 2 horses`, `light cavalry bow mediocre`, `guardsmen`, `mercenaries`, `warriors`, `javelinmen`, and `archers`, plus ally notes to Egypt and Mitanni.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 6 in total) +2` | 4 | 16 | 9 | The opening chariot block is one of the clearest rows in the page-17 OCR. | needs-source-check |
| Light cavalry bow | Light cavalry bow | mediocre | ? | 0 | 1 | 4 | Readable enough to preserve as a separate mounted row. | needs-source-check |
| Guardsmen | Medium swordsmen / Bowmen | elite | impact / pavise dual-profile block | 0 | 2 | `9 / 10` | OCR suggests a guardsmen family with melee and pavise-bow variants. | needs-source-check |
| Mercenaries | Medium swordsmen | impetuous | ? | 0 | 4 | 6 | The mercenary line is readable, though the label is partly degraded at the left edge. | needs-source-check |
| Warriors | Medium swordsmen | ordinary | ? | 0 | 4 | 6 | A clear core infantry row in the opening block. | needs-source-check |
| Javelinmen | Javelinmen / Light infantry javelin | ordinary | `downgrade to mediocre -2`; light-infantry cap visible | 2 | 12 | `7 / 4` | Preserve as a grouped javelin family until image confirmation. | needs-source-check |
| Archers | Light infantry bow | ordinary | `downgrade to mediocre -2` | 2 | 6 | 4 | OCR is noisy but stable enough to preserve as a cautious ranged entry. | needs-source-check |

Allies:
- `Egyptian allies (List #14 New Kingdom Egyptian)`.
- `Mitanni allies (List #21 Hurri-Mitanni)` before `1340 BC`.

Notes and restrictions:
- A maximum of `6` light and or heavy chariots can be upgraded to elite.

Open verification:
- Confirm the left-edge crop on the header to ensure the opening year is exactly `1755` and not an OCR blend.
- Delay full troop normalization until the noisy left-edge labels in the body block are checked against the page image.
- Confirm whether the guardsmen dual-profile block should be normalized as one entry or split into melee and pavise-bow rows.

### List 23 - Ancient Hebrew

Source: `ArmyLists1-82.pdf` p.17; `merged.pdf` p.17-18 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1250 - 587 BC`
Region / classification: `Middle East`
Command value: `+3`, `+4 after 1000 BC`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, and split command value on `merged.pdf` page `17`.
- The opening troop block continues onto page `18` and visibly includes `Gibborim warriors`, `Simeonites/Ephraimites`, `Jewish warriors`, `Cavalry (from 800 BC)`, `Bedouins`, `Philistine mercenaries`, and `Ark of the Covenant` as a `Sacred camp`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses (1000 to 800 BC) | Light chariot bow | ordinary | date-gated | ? | ? | ? | The opening chariot line is visible at the page boundary but its columns are incomplete. | needs-source-check |
| Gibborim warriors | Medium swordsmen | elite | `add armour +2` | ? | ? | 8 | One of the clearest named infantry rows on page `18`. | needs-source-check |
| Simeonites, Ephraimites (before 1000) | Medium swordsmen | impetuous | date-gated | ? | ? | ? | Preserve the subgroup/date gate even though points and bounds are unstable. | needs-source-check |
| Jewish warriors | Medium swordsmen / Javelinmen | ordinary | grouped infantry family | 4 | 24 | `6 / 7` | OCR suggests a two-profile core warrior block. | needs-source-check |
| Cavalry (from 800 BC) | Light cavalry javelin / Medium cavalry | ordinary | date-gated | 0 | 2 | `6 / 7` | The cavalry gate is clear and should be retained structurally. | needs-source-check |
| Bedouins | Light camelry bow / Medium camelry bow | mediocre | ? | 0 | 2 | ? | OCR shows a two-profile camelry block, but one points value is unclear. | needs-source-check |
| Philistine mercenaries | Medium spearmen / Heavy spearmen / Bowmen mediocre / Light infantry bow | mixed | grouped mercenary family | 0 | 2 | ? | The row family spans several adjacent lines and should remain grouped pending page-image review. | needs-source-check |
| Ark of the Covenant | Sacred camp | special | ? | 0 | 1 | ? | This is clearly a rules-bearing camp entry and should stay explicit. | needs-source-check |

Allies:
- All visible allies are from `800 BC`.
- `Egyptian allies (List #15 Libyan Egyptian)`.
- `Egyptian allies (List #16 Kushite Egyptian)`.
- `Philistine allies (List #25 Philistine)`.
- `Aramean allies (List #26 Aramaean and Neo-Hittite)`.
- `Phoenician allies (List #32 Phoenicians of Cyprus)`.
- `Egyptian allies (List #57 Saitic Egyptian)`.

Open verification:
- Reconstruct the full cross-page troop table before normalizing rows, because the header is clear but the family boundaries straddle two OCR pages.
- Preserve the `+3 or +4 after 1000 BC` command split as a date-gated list rule rather than flattening it.
- Confirm whether `Philistine mercenaries` is a single grouped contingent or several separate rows with shared unit bounds.

### List 24 - Sea Peoples

Source: `ArmyLists1-82.pdf` p.18; `merged.pdf` p.18 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1208 - 1101 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Plain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and opening troop block on `merged.pdf` page `18`.
- Visible troop labels include `Warriors on chariots`, `Retinue warriors`, `Common warriors`, `Javelinmen`, `Women and children`, and a note that light chariot javelin dismount as medium swordsmen impetuous.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warriors on chariots | Light chariot javelin | ordinary | `upgrade to elite` | ? | ? | 8 | The opening chariot-warrior row is readable enough to retain conservatively. | needs-source-check |
| Retinue warriors | Medium swordsmen / Heavy swordsmen | elite | impetuous dual-profile block | ? | ? | `8 / 10` | OCR shows both medium and heavy elite impetuous variants in the same family. | needs-source-check |
| Common warriors | Medium swordsmen | impetuous | ? | ? | ? | ? | The core common-warrior row is visible but not column-stable. | needs-source-check |
| Javelinmen | Light infantry javelin | ordinary | ? | ? | ? | `7 / 4` | OCR suggests a paired javelin/skirmisher block. | needs-source-check |
| Women and children | Levy | mediocre | ? | ? | ? | ? | Preserve this as a distinct camp-followers levy row. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | ? | ? | 6 | The fortified camp line is visible enough to preserve separately. | needs-source-check |

Allies:
- `Libyan allies (List #12 Libyan)`.

Notes and restrictions:
- `Light chariot javelin` dismount as `medium swordsmen impetuous`.

Open verification:
- Confirm whether `Retinue warriors` should be normalized as a dual heavy/medium impetuous elite block or split into separate rows.
- Preserve the dismount note as a rules-bearing list note tied specifically to the light chariot javelin entry.
- Confirm whether the visible `Javelinmen` and `Light infantry javelin` lines are one grouped family or two separate entries.

### List 25 - Philistine

Source: `ArmyLists1-82.pdf` p.18; `merged.pdf` p.18 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1100 - 600 BC`
Region / classification: `Middle East`
Command value: `+4`
Terrain: `Plain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the first troop lines on `merged.pdf` page `18`.
- The visible opening rows include `Chariots with 2 horses`, `Elite warriors`, and `Warriors`, with the chariot block showing `add armour` and `upgrade to elite (max 4)`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4) +2` | 2 | 10 | 9 | The opening Philistine chariot block is one of the clearest rows at the page bottom. | needs-source-check |
| Elite warriors | Heavy spearmen | elite | `add armour` visible nearby | ? | ? | 10 | OCR clearly preserves the row identity and elite heavy-spear type. | needs-source-check |
| Warriors | Medium spearmen | ordinary | ? | ? | ? | ? | The row start is readable, but the continuation falls below the current OCR slice. | needs-source-check |

Open verification:
- Re-read the continuation below the visible page slice before normalizing the Philistine infantry families.
- Confirm whether the visible `0-4` near `Elite warriors` belongs to armour, units, or a later adjacent column before preserving it structurally.

## Classical Starter Layer - Lists 38-58

Source: `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; `merged.pdf` p.24-25 OCR helper for Lists `38-40`; `merged.pdf` p.4 index OCR helper for early Classical index anchors
Status: spreadsheet-crosschecked, mixed OCR support
Applies to: first Classical-period routing layer after the Ancient starter block

Project wording:
- The corpus now has a first conservative starter layer for Lists `38-58`.
- Lists `38-40` already have direct OCR-backed header blocks.
- Lists `41-58` are currently present as name-anchored starters from spreadsheet and index support, pending the next local OCR pass.
- Use `docs/source/Classic_Period.md` as the canonical scan-first working source for Classical lists `38-82`; this starter layer remains only as broad all-period routing context.

| List | Army name | Evidence status |
| --- | --- | --- |
| 38 | Early Macedonian | ocr-assisted, spreadsheet-crosschecked |
| 39 | Alexandrian Macedonian | ocr-assisted, spreadsheet-crosschecked |
| 40 | Alexander the Great | ocr-assisted, spreadsheet-crosschecked |
| 41 | Early Successors | spreadsheet-crosschecked, needs-source-check |
| 42 | Seleucid | spreadsheet-crosschecked, needs-source-check |
| 43 | Ptolemaic | spreadsheet-crosschecked, needs-source-check |
| 44 | Pyrrhic | spreadsheet-crosschecked, needs-source-check |
| 45 | Later Macedonian | spreadsheet-crosschecked, needs-source-check |
| 46 | Graeco-Bactrian and Graeco-Indian | spreadsheet-crosschecked, needs-source-check |
| 47 | Italic Tribes | spreadsheet-crosschecked, needs-source-check |
| 48 | Etruscan | spreadsheet-crosschecked, needs-source-check |
| 49 | Tullian Roman | spreadsheet-crosschecked, needs-source-check |
| 50 | Syracusan | spreadsheet-crosschecked, needs-source-check |
| 51 | Campanian, Lucanian, Apulian and Bruttian | spreadsheet-crosschecked, needs-source-check |
| 52 | Camillan Roman | spreadsheet-crosschecked, needs-source-check |
| 53 | Republican Roman | spreadsheet-crosschecked, needs-source-check |
| 54 | Early Carthaginian | spreadsheet-crosschecked, needs-source-check |
| 55 | Carthaginian | spreadsheet-crosschecked, needs-source-check |
| 56 | Numidian | spreadsheet-crosschecked, needs-source-check |
| 57 | Saitic Egyptian | spreadsheet-crosschecked, needs-source-check |
| 58 | Kyrenean Greek | spreadsheet-crosschecked, needs-source-check |

Open verification:
- Add direct printed-page references for Lists `41-58` during the next Classical OCR pass instead of assuming pagination from the early index snippet.
- Upgrade each spreadsheet-only starter to a body-level header entry only after its local page header is read from OCR or the original page image.
- Re-audit Lists `38-58` in printed page order before trusting any interleaved troop rows, especially where one list tails into another on the same page.

### List 26 - Aramaean and Neo-Hittite

Source: `ArmyLists1-82.pdf` p.19; `merged.pdf` p.19 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: needs-source-check
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Mountain`

Notes and restrictions:
- OCR clearly exposes the list identity on `merged.pdf` page `19`, but the opening year digits are cropped and only the closing `710 BC` is reliable from the current slice.
- The page shows readable troop families including chariots with `2 horses`, camelry bow variants, elite spearmen, allied Hebrew/Phoenician references, and a later switch to heavier chariots and proto-cavalry.

Open verification:
- Recover the missing left-edge year digits before promoting the date range into a verified header field.
- Keep the post-`890 BC` heavier-chariot and proto-cavalry block attached to its proper date gate.

### List 27 - Urartu

Source: `ArmyLists1-82.pdf` p.19; `merged.pdf` p.19 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `860 - 590 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and introductory paragraph on `merged.pdf` page `19`.
- The opening troop block includes chariots with `2` or later `4` horses, proto-cavalry, Cimmerians, royal/provincial infantry, archers, provincial levy, and Mananean highlanders.

Open verification:
- Confirm the opening year digits directly against the page image, because the OCR may have lost the leading `8`.
- Preserve the `From 780 BC` chariot upgrade as a structural date gate during later normalization.

### List 28 - Medes

Source: `ArmyLists1-82.pdf` p.20; `merged.pdf` p.20 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `835 - 550 BC`
Region / classification: `Middle East`
Command value: `+3`, `+4 from 626 BC`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, split command value, and full opening troop block on `merged.pdf` page `20`.
- The first readable families include `Horsemen`, `Light cavalry bow`, heavy/medium spearmen, `Bowmen`, `Armenians and hillmen`, and `Levy`, plus Babylonian/Assyrian/Scythian ally notes.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Horsemen | Medium cavalry bow / Heavy cavalry bow | ordinary | heavy variant `max 6`; `upgrade to elite (max 6) +2` | ? | 6 | `9 / 11` | OCR clearly shows a dual-profile horsemen block. | needs-source-check |
| Light cavalry bow | Light cavalry bow | ordinary | ? | 0 | 6 | 6 | One of the clearest independent cavalry lines on the page. | needs-source-check |
| Heavy spearmen / Medium spearmen | Heavy spearmen / Medium spearmen | mediocre / ordinary | `add support +1` visible on the infantry block | 2 | 8 | `6 / ?` | Preserve the infantry spear family as grouped until the points column is rechecked. | needs-source-check |
| Bowmen | Bowmen | ordinary | `downgrade to mediocre -2` | ? | ? | 7 | Readable enough to preserve as a distinct missile row. | needs-source-check |
| Armenians and hillmen | Javelinmen / Light infantry javelin / Light infantry bow | ordinary | `downgrade to mediocre -2` on javelinmen | 0 | 4 | `7 / 4 / 4` | OCR suggests a grouped hillmen family with both formed and light variants. | needs-source-check |
| Levy | Levy | ordinary | ? | 0 | 2 | 3 | The levy row is clearly visible at the end of the opening block. | needs-source-check |

Options / replacements:
- `Horsemen` can be fielded as `Medium cavalry bow` or `Heavy cavalry bow`, with the heavy profile capped at `max 6`.

Notes and restrictions:
- The opening spear block reads as a combined `Heavy spearmen mediocre` and `Medium spearmen` family with `add support +1`, not yet as two fully independent OCR-stable rows.

Allies:
- `Babylonian allies (List #8 Neo-Babylonian)` from `626 BC`.
- `Assyrian allies (List #9 Assyrian Empire and Sargonid)` from `733 to 669 BC`.
- `Scythian allies (List #76 Scythian)`.

Open verification:
- Preserve the `+3 or +4 from 626 BC` command split as a date-gated header rule.
- Keep the three ally windows attached to their exact historical timing during later normalization.
- Confirm whether the heavy/medium spearmen line should be one grouped block or two separate rows.

### List 29 - Phrygian

Source: `ArmyLists1-82.pdf` p.20; `merged.pdf` p.20 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `800 - 696 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the start of the troop table on `merged.pdf` page `20`.
- The visible troop families include chariots, medium cavalry, light cavalry javelin, medium swordsmen, medium spearmen, bowmen, and light infantry variants.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot javelin / Heavy chariot impact | ordinary | `upgrade to elite (max 4)` | 0 | 6 | ? | OCR clearly exposes the dual-profile chariot row, but the points cells are not isolated in the current slice. | needs-source-check |
| Medium cavalry | Medium cavalry | ordinary | `downgrade to mediocre` | ? | ? | ? | The row label and downgrade note are readable, but units and points are not stable. | needs-source-check |
| Light cavalry javelin | Light cavalry javelin | ordinary | ? | ? | ? | ? | Visible as a separate cavalry line after the medium cavalry row. | needs-source-check |
| Core infantry block | Medium swordsmen / Medium spearmen / Bowmen | ordinary | grouped body block | ? | ? | ? | The page shows the three labels clearly, but OCR does not preserve row boundaries cleanly enough to split them yet. | needs-source-check |
| Light infantry variants | Light infantry bow / Light infantry javelin / Light infantry sling | ordinary | grouped light-infantry tail block | ? | ? | ? | Preserve as a grouped tail family until the page image is checked. | needs-source-check |

Allies:
- `Urartu allies (List #27 Urartu)`.
- `Scythian allies (List #76 Scythian)`.

Open verification:
- Re-read the body block directly against the page image before normalizing troop rows, because the column alignment becomes noisy just after the header.
- Keep the Urartu and Scythian ally notes as explicit list notes rather than flattening them into troop content.

### List 30 - Mycenaean

Source: `ArmyLists1-82.pdf` p.20-21; `merged.pdf` p.20-21 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1600 - 1150 BC`
Region / classification: `Early Europe`
Command value: `+3`
Terrain: `Plain`

Notes and restrictions:
- OCR clearly exposes the list header on `merged.pdf` page `20`, and the troop block continues onto `merged.pdf` page `21`.
- Printed-page flow calibrated with user review: `List 30` begins at the bottom right of printed page `105`, then continues at the top left of printed page `106` until the start of `List 31`.
- Visible structure includes pre-`1250 BC` Dendra-armour chariots, later Trojan War and Achaean sub-blocks, named Myrmidons, Pylian chariots and spearmen, and commander-linked Nestor/Achilles notes.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with Dendra armour and long spear (before 1250 BC) | Light chariot armour impact | ordinary | pre-`1250 BC`; `upgrade to elite (max 4 in total)` | ? | 4 | ? | OCR clearly exposes the pre-1250 chariot family, but the points cell is unstable. | needs-source-check |
| Mycenaean chariots | Light chariot javelin | ordinary | `upgrade to elite (max 4 in total)` | ? | ? | ? | The base chariot family is readable on page `20`. | needs-source-check |
| Medium spearmen / Heavy spearmen | Medium spearmen / Heavy spearmen | ordinary | `add pavise` visible nearby | ? | ? | ? | The core spear block is visible but the columns are mixed by OCR. | needs-source-check |
| Myrmidons | Medium swordsmen impact elite / Heavy swordsmen impact elite / Light infantry javelin / Light infantry bow | elite / ordinary | named sub-group; commander-linked Achilles note | 0 | 2 / 4 | `9 / 11 / 4 / 4` | OCR shows a cross-page heroic sub-group that should stay grouped until image review. | needs-source-check |
| Pylian chariots and spearmen | Light chariot armour impact / Heavy spearmen support | ordinary | named sub-group; commander-linked Nestor note | 0 | 1 / 4 | `10 / ?` | Preserve this as a named late-phase sub-group rather than flattening it. | needs-source-check |

Options / replacements:
- Before `1250 BC`, use `chariots with Dendra armour and long spear` as the distinct early chariot family.
- After `1250 BC`, the OCR shows named `Trojan War - Achaean` and `Trojan` sub-block structure that still needs page-image confirmation before row-splitting.

Notes and restrictions:
- One commander can be included in a `Myrmidon` unit to represent `Achilles` and or in a chariot to represent `Nestor`.
- `Pylian` chariots and spearmen must be commanded by `Nestor` and `Myrmidons` by `Achilles`.
- Chariots dismount as `medium spearmen with armour` if the chariot has armour.

Open verification:
- Preserve the pre-/post-`1250 BC` structure and named-commander constraints as list notes during later normalization.
- Reconstruct the printed-page `105 -> 106` continuation using the calibrated flow `bottom right -> top left` before splitting the named hero sub-groups into separate entries.
- Confirm whether the base spear family and the named Pylian/Myrmidon sub-groups overlap or replace each other under specific date windows.

### List 31 - Geometric Greek

Source: `ArmyLists1-82.pdf` p.21 and printed index `106`; `merged.pdf` p.21 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: needs-source-check
Region / classification: `Early Europe`
Command value: `+2`
Terrain: needs-source-check

Notes and restrictions:
- OCR on page `21` clearly exposes the list identity as `Geometric Greek`, but the leading year digits are degraded and the terrain line is partially cropped.
- A direct page-`21` extraction is now available locally, but the body text must be read with printed-page flow rather than raw OCR order: `List 31` begins at the bottom left of printed page `106`, then continues in the upper right of the same printed page until the start of `List 32`.
- The current starter rows keep only the OCR-stable body labels that fit that calibrated flow before the `List 32` header: `Warriors`, `Medium swordsmen`, `Medium spearmen`, `Bowmen`, `Light infantry bow`, `Light infantry javelin`, and `Light infantry sling`.
- The extracted header still only stabilizes the closing year `650 BC`, `Command +2`, and a cropped terrain line that reads like `Plain, Mountain` but still needs page-image confirmation.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warriors | Medium swordsmen / Medium spearmen | ordinary | grouped core-warrior block | 6 | 16 | `6 / 7` | Preserved as a conservative synthesis of the bottom-left and upper-right pre-`List 32` continuation on printed page `106`; exact row splitting still needs the page image. | needs-source-check |
| Bowmen | Bowmen | ordinary | ? | 2 | 6 | 7 | Preserved only because the bowmen line appears stable within the calibrated `List 31` flow before `List 32` begins. | needs-source-check |
| Light infantry variants | Light infantry bow / Light infantry javelin / Light infantry sling | ordinary | grouped light-infantry tail block | 0 | 3 | 4 | Kept grouped as the stable light-infantry tail visible within the calibrated `List 31` segment; do not extend this beyond the start of `List 32` without page-image proof. | needs-source-check |

Open verification:
- Recover the missing year digits and terrain text from the page image before assigning structured body data.
- Reconstruct `List 31` in the calibrated printed-page order `bottom left page 106 -> upper right page 106` before binding its troop rows more aggressively.
- Stop the `List 31` body at the actual start of `List 32`; do not pull later right-column material back into `List 31` just because OCR line ordering is unstable.
- Confirm whether the `Warriors` block is one grouped row with alternative profiles or several separate rows with shared unit bounds.

### List 32 - Phoenicians of Cyprus

Source: `ArmyLists1-82.pdf` p.21; `merged.pdf` p.21 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1000 - 330 BC`
Region / classification: `Early Europe`
Command value: `+3`
Terrain: `Plain, Forest`

Notes and restrictions:
- OCR clearly exposes the list header and key header fields on `merged.pdf` page `21`.
- A direct page-`21` extraction is now available locally; it confirms the opening prose, early chariot block, later `after 350 BC` artillery hook, and the `from 800 to 550 BC` Sardinian/Spanish mercenary block.
- Printed-page flow calibrated with user review: `List 32` begins relatively high in the upper right of printed page `106`, then continues to the top left at the start of printed page `107`.
- A targeted top-left check on printed page `107` confirms that the continuation still belongs to `List 32` before the `List 33 - Celts` header begins.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4) +2` | 2 | 4 | 9 | The opening chariot row is one of the clearest page-21 Phoenician entries. | needs-source-check |
| Medium cavalry | Medium cavalry | ordinary | `downgrade to mediocre -2` | 0 | 3 | 7 | The cavalry row is readable in the same body slice, but still needs page-image confirmation. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | `after 350 BC` | 0 | 2 | 10 | The date-gated artillery line is legible enough to preserve explicitly. | needs-source-check |
| Sardinian and Spanish mercenaries | Medium swordsmen / Medium swordsmen impetuous / Medium cavalry | ordinary | `from 800 to 550 BC`; mixed mercenary block | 0 | `4 / ? / 2` | `6 / ? / ?` | OCR clearly exposes the historical mercenary block, but its internal row split remains unstable. | needs-source-check |
| Greek mercenaries from Egypt | Heavy spearmen | ordinary | `353 BC`; `upgrade to elite (max 1) +2` | ? | ? | ? | The top-left continuation on printed page `107` still belongs to `List 32` and exposes this Greek-mercenary hoplite hook before the `List 33` header. | needs-source-check |

Options / replacements:
- `After 900 BC`, `replace all chariots with 2 horses` by `Heavy chariot impact`, with `upgrade to elite (max 4) +2` still visible in the same block.

Notes and restrictions:
- The opening historical note is readable enough to preserve that Phoenician settlement on Cyprus begins circa `1000 BC`, followed by Assyrian, Egyptian, Persian, and finally Alexandrian control.

Open verification:
- Reconstruct `List 32` using the calibrated flow `upper right page 106 -> top left page 107` before assigning more troop rows, so Phoenician lines are not mixed with the Mycenaean tail or the next-page continuation.
- Keep the top-left printed-page `107` material under `List 32` only until the explicit `List 33 - Celts` header; do not truncate the continuation too early.
- Confirm whether the post-`900 BC` chariot replacement and the `from 800 to 550 BC` mercenary block attach to the same main list layer or to separate historical sub-windows.
- Confirm the exact bounds and points for `Greek mercenaries from Egypt in 353 BC`, plus whether the nearby Greek-allies note belongs to the same continuation block.

### List 33 - Celts

Source: `ArmyLists1-82.pdf` p.22; `merged.pdf` p.22 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1300 - 400 BC`
Region / classification: `Early Europe`
Command value: `+2`
Terrain: `Plain, Mountain, Forest`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and a short historical paragraph on `merged.pdf` page `22`.
- Printed-page flow calibrated with user review: `List 33` begins fairly high in the left column of printed page `107` and runs only until `EARLY ASIA`, after which `List 34` begins at the bottom left of the same printed page.
- The historical note clearly preserves the bronze-to-iron transition, with bronze weapon use around `1300 BC` and iron-working becoming visible around `900 BC`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Celtic warriors | Medium swordsmen impetuous | ordinary | ? | ? | ? | 6 | The core warrior row is one of the clearest labels in the Celt block. | needs-source-check |
| Women and children | Levy mediocre | mediocre | ? | ? | ? | ? | The camp-followers row is visible at the end of the Celt block. | needs-source-check |

Open verification:
- Confirm whether any apparent `Guardsmen`, `Bowmen`, or `Hill tribesmen` material on this spread really belongs to `List 33` rather than to the adjacent Indian lists.
- Recover the exact bounds for `Celtic warriors` and `Women and children` from the page image.

### List 34 - Indus Valley

Source: `ArmyLists1-82.pdf` p.22; `merged.pdf` p.22 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `2700 - 1500 BC`
Region / classification: `Early Asia`, `Indian`
Command value: `+3`
Terrain: `Plain, Forest`

Notes and restrictions:
- OCR now clearly exposes the list header, date range, terrain, command value, and the start of the historical paragraph on `merged.pdf` page `22`.
- The historical note also clearly preserves the `Melukhan` reference, Sumerian and Akkadian contact, and the Harappan decline circa `1500 BC`.
- Printed-page flow recalibrated by page check and user review: `List 34` begins at the bottom left of printed page `107`, but on that spread this left-column segment is effectively just the header jump; the troop list and the rest of the header continue in the upper right of printed page `107`. `List 36` does not begin on printed page `107`; printed page `108` starts directly with `List 36` in the left column.
- User-calibrated visual grouping for the upper-right continuation shows distinct table blocks for `Elephant`, `Guardsmen`, a core `Medium swordsmen / Medium spearmen` block with a downgrade note, `Bowmen` with downgrade, `Hill tribesmen` with `Javelinmen` plus `Light infantry javelin`, and a separate `Light infantry sling / Light infantry bow` tail.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Elephant | Elephant | ordinary | ? | ? | ? | ? | User-calibrated as part of the upper-right `List 34` continuation on printed page `107`. | needs-source-check |
| Guardsmen | Medium swordsmen `2HW` elite / Medium spearmen elite | elite | grouped elite block | ? | ? | ? | The user confirmed this as a real visual block in the upper-right `List 34` continuation. | needs-source-check |
| Core infantry block | Medium swordsmen / Medium spearmen | ordinary | downgrade note visible on the block | ? | ? | ? | Preserve as one grouped body block until the page image confirms exact row separation and downgrade ownership. | needs-source-check |
| Bowmen | Bowmen | ordinary | `downgrade to mediocre -2` | ? | ? | ? | The bowmen block is visually distinct in the calibrated `List 34` continuation. | needs-source-check |
| Hill tribesmen | Javelinmen / Light infantry javelin | ordinary | javelinmen `downgrade to mediocre -2` | ? | ? | ? | Preserve as one grouped hill-tribesmen block until the original page confirms exact caps and points. | needs-source-check |
| Light infantry tail | Light infantry sling / Light infantry bow | ordinary | grouped light tail | ? | ? | ? | The user identified this as a separate tail block rather than part of the hill-tribesmen row. | needs-source-check |

Open verification:
- Reconstruct the printed-page `107` flow `bottom left header jump -> upper right continuation` before assigning structured troop rows.
- Separate the top-right printed-page `107` continuation of `List 34` from the mid-right `List 35` block before assigning structured troop rows.
- Do not attach the visible `after 700 BC` ally hook or nearby hoplite/elephant lines to this list; that mixed slice is chronologically incompatible with `2700 - 1500 BC` and needs column-level confirmation first.
- Confirm the exact min/max/points cells for the `Elephant`, `Guardsmen`, core infantry, bowmen, hill-tribesmen, and light-tail blocks.

### List 35 - Vedic India

Source: `ArmyLists1-82.pdf` p.22; `merged.pdf` p.22 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1500 - 500 BC`
Region / classification: `Early Asia`, `Indian`
Command value: `+3`
Terrain: `Plain, Forest`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and opening historical note on `merged.pdf` page `22`.
- Printed-page flow calibrated with user review: `List 35` begins in the middle of the right column on printed page `107` and ends at the bottom of the same printed page.
- The historical note clearly preserves that the Aryans first occupied `Punjab` before spreading across northern India.
- User calibration confirms that no additional starter rows from this spread should currently be carried over beyond the rows already kept below.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `upgrade to elite (max 6) +2`; dismount note visible | 4 | 12 | 9 | The chariot row is one of the clearest lines in the Vedic block. | needs-source-check |
| War elephants | Elephant | ordinary | ? | ? | ? | ? | The row label is visible, but the points and unit bounds are degraded. | needs-source-check |
| Archers | Bowmen | ordinary | `downgrade to mediocre -2` | ? | ? | ? | The archery row is readable enough to preserve cautiously. | needs-source-check |
| Warriors with two-handed sword | Medium swordsmen `2HW` | ordinary | ? | ? | ? | ? | This row is visible in the lower Vedic block. | needs-source-check |
| Light infantry bow | Light infantry bow | ordinary | ? | ? | ? | 4 | User calibration indicates this exists as its own row and should not be collapsed into a generic `Light infantry support` entry. | needs-source-check |
| Light infantry sling | Light infantry sling | ordinary | ? | ? | ? | 4 | User calibration indicates this exists as its own row and should not be collapsed into a generic `Light infantry support` entry. | needs-source-check |
| Levy | Levy | ordinary | ? | ? | ? | 3 | The levy row is visible at the end of the extracted block. | needs-source-check |

Notes and restrictions:
- OCR clearly exposes that war chariots were the favored weapon in the early Vedic historical note.
- The currently trusted dismount note belongs to `Chariots with 2 horses / Light chariot bow`, not to a separate `Mounted nobles` row.
- Do not preserve a generic `Light infantry support` grouping here; the calibrated reading is that `Light infantry bow` and `Light infantry sling` are separate rows.

Open verification:
- Reconstruct the right-column `List 35` block in printed-page order before assigning precise points and unit bounds to `War elephants`, `Archers`, the `2HW` warriors, and the two light-infantry rows.
- Confirm whether any visible `Mounted nobles`, `Nobles on foot`, or `Scouts` material on this spread actually belongs to `List 35` or to adjacent interleaved content.
- Confirm the exact wording of the `Chariots with 2 horses` dismount note on the page image.

### List 36 - Erlitou Shang Chinese

Source: `ArmyLists1-82.pdf` p.23; `merged.pdf` p.23 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: needs-source-check
Region / classification: `Far East`, `Chinese`
Command value: `+3`
Terrain: needs-source-check

Notes and restrictions:
- A direct page-`23` extraction is now available locally and clearly exposes the list identity, command value, the closing year `1045 BC`, and a cropped terrain line that reads like `Plain, Forest` but still needs page-image confirmation.
- Printed-page flow calibrated by page check and user review: printed page `108` starts directly with `List 36` in the left column, while the right column on the same printed page is `List 37`.
- The body extraction shows an early pre-`1300 BC` block, a later `Shang Dynasties, from 1300 BC` block, and visible ally references to barbarian contingents and later Zhou allies.
- Preserve the list as a two-stage structure: an early `before 1300 BC` block and a later `Shang Dynasties, from 1300 BC` block with `replace all nobles` visible above the later chariot family.
- The visible `Zhou allies (List #37 Zhou and Spring and Autumn Chinese) from 1100 BC` line should stay attached to the later Shang structure until the page image proves it applies more broadly.
- User calibration narrows the safe opening labels on printed page `108`: early block `Nobles before 1300 BC`, `Warriors with dagger-axe`, `Warriors with bow`, `Militia with dagger-axe`, `Militia with bow`, and `Levy`; later `Shang Dynasties from 1300 BC` block with `replace all nobles`, `Royal guardsmen with long spear`, `Warriors with long spears`, and barbarian allies (`Jung`, `Di`, `Rong`) containing `Warriors`, `Bowmen mediocre`, and `Light infantry bow`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nobles before 1300 BC | needs-source-check | needs-source-check | `before 1300 BC` | ? | ? | ? | Safe row label from user calibration; exact troop type and values still need page-image confirmation. | needs-source-check |
| Warriors with dagger-axe | needs-source-check | needs-source-check | `before 1300 BC` | ? | ? | ? | User-calibrated as part of the early opening block on printed page `108`. | needs-source-check |
| Warriors with bow | needs-source-check | needs-source-check | `before 1300 BC` | ? | ? | ? | User-calibrated as part of the early opening block on printed page `108`. | needs-source-check |
| Militia with dagger-axe | needs-source-check | needs-source-check | `before 1300 BC` | ? | ? | ? | User-calibrated as part of the early opening block on printed page `108`. | needs-source-check |
| Militia with bow | needs-source-check | needs-source-check | `before 1300 BC` | ? | ? | ? | User-calibrated as part of the early opening block on printed page `108`. | needs-source-check |
| Levy | needs-source-check | needs-source-check | `before 1300 BC` | ? | ? | ? | User-calibrated as the last safe row in the early opening block. | needs-source-check |
| Shang Dynasties from 1300 BC nobles | needs-source-check | needs-source-check | `from 1300 BC`; `replace all nobles` | ? | ? | ? | Later noble replacement block confirmed by user calibration, but exact type/value cells still need the page image. | needs-source-check |
| Royal guardsmen with long spear | needs-source-check | needs-source-check | `from 1300 BC` | ? | ? | ? | The user clarified the row label as `Royal guardsmen`, not a generic guardsmen block. | needs-source-check |
| Warriors with long spears | needs-source-check | needs-source-check | `from 1300 BC` | ? | ? | ? | Replaces the earlier speculative `Emperors with long spears` reading. | needs-source-check |
| Barbarian allies (Jung, Di, Rong) | Warriors / Bowmen mediocre / Light infantry bow | mixed | `from 1300 BC`; grouped ally block | ? | ? | ? | User calibration confirms the ally block composition more narrowly than the earlier OCR synthesis. | needs-source-check |

Allies:
- `Barbarian allies (see list above)`.
- `Zhou allies (List #37 Zhou and Spring and Autumn Chinese)` from `1100 BC`.

Open verification:
- Recover the missing leading date digits and confirm the cropped terrain text from the page image before promoting the header fields further.
- Reconstruct the body rows before promoting troop types, bounds, and points for the user-calibrated early and late blocks.
- Confirm which exact troop types and numeric cells belong to `Nobles before 1300 BC`, `Royal guardsmen with long spear`, `Warriors with long spears`, and the barbarian ally block.

### List 37 - Zhou and Spring and Autumn Chinese

Source: `ArmyLists1-82.pdf` p.23; `merged.pdf` p.23 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1100 - 480 BC`
Region / classification: `Far East`, `Chinese`
Command value: `+4`
Terrain: `Plain, Forest`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, strategist block, and the opening historical paragraph on `merged.pdf` page `23`.
- User-calibrated page ownership is narrower: `List 37` is the complete right column on printed page `108`, while the left column belongs to `List 36`.
- The visible opening troop block includes pre-`770 BC` chariots, `Tiger guards`, `Warriors with dagger-axe`, `Bowmen`, and the start of a `Warriors with long spears` row.
- The lower page-`23` slice shows that the `From 770 BC - Spring and Autumn` restructuring is not just a note header; it carries its own later troop content such as `Tribal auxiliaries` and should stay modeled as a real sub-period layer.
- User calibration confirms the right-column block order as: `Chariots with 4 horses`; `Tiger guards`; `Warriors with dagger-axe`; `Bowmen`; `Warriors with long spears`; `Light infantry bow`; `Levy`; then the later `From 770 BC` replacement layer with `replace all chariots with 4 horses`, `replace all warriors with dagger-axe`, and `Tribal auxiliaries`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 4 horses (before 770 BC) | Light chariot bow / Heavy chariot impetuous | ordinary | light profile `max 4`; `upgrade to elite (max 4) +2` | 2 | 8 | `9 / 10` | The opening chariot block is one of the clearest page-23 rows. | needs-source-check |
| Tiger guards (before 770 BC) | Medium swordsmen impact elite | elite | ? | 0 | 2 | 9 | The row identity and points are readable, but the unit bound should still be checked against the page image. | needs-source-check |
| Warriors with dagger-axe | Medium swordsmen | ordinary | `add support +1` | 4 | 16 | 6 | OCR keeps the core warrior row stable enough to preserve. | needs-source-check |
| Bowmen | Bowmen | ordinary | `downgrade to mediocre -2` | 2 | 8 | 7 | The row is readable and locally stable. | needs-source-check |
| Warriors with long spears | Medium spearmen | ordinary | `add support +1` | 0 | 4 | 7 | User calibration confirms this row belongs in `List 37`; unlike the similarly named row in `List 36`, this one carries the support option. | needs-source-check |
| Light infantry bow | Light infantry bow | ordinary | `from 770 BC - Spring and Autumn` | 0 | 6 | 4 | The lower body block is now readable enough to separate this tail row, and it appears inside the later Spring and Autumn layer. | needs-source-check |
| Levy | Levy | ordinary | `from 770 BC - Spring and Autumn` | 0 | 4 | 3 | The levy row appears at the end of the visible lower block and should stay attached to the later Spring and Autumn structure. | needs-source-check |
| Tribal auxiliaries | Medium swordsmen impetuous | ordinary | `from 770 BC - Spring and Autumn` | 0 | 4 | 6 | The later-period auxiliary row is visible in the lower page-23 block and should stay tied to the Spring and Autumn structure. | needs-source-check |

Notes and restrictions:
- Strategists visible in the header are `Duke Wen (Jin 632 BC)` and `Sun Tzu (Wu 564-470 BC)`.
- Preserve the pre-`770 BC` troop hooks as date-gated list structure rather than flattening them into unconditional rows.

Options / replacements:
- `From 770 BC - Spring and Autumn`, replace all `chariots with 4 horses` by `Heavy chariot impetuous` `10`, `4-12`, with `upgrade to elite (max 4) +2`.
- `From 770 BC - Spring and Autumn`, replace all `warriors with dagger-axe` by `Medium swordsmen polearm` `7`, `4-12`, with `add support +1`.

Allies:
- `Barbarian allies (same list as for Erlitou Shang Chinese)` before `770 BC`.
- `Shang allies (List #36 Erlitou Shang Chinese)` before `1045 BC`.

Open verification:
- Reconstruct the full right-column printed-page `108` block before promoting exact numeric cells for the later `From 770 BC` replacement layer.
- Confirm whether the `Tiger guards` unit bound is exactly `0-2` or another cropped value.
- Confirm whether `Light infantry bow` and `Levy` are unconditional right-column rows or only part of the later `From 770 BC` layer.

### List 38 - Early Macedonian

Source: `merged.pdf` p.24 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; printed index `109`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `650 - 355 BC`
Region / classification: `Classical Period`, `Macedonian`
Command value: `+3`, `+4 after 413 BC`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, terrain, split command value, and the first troop block on `merged.pdf` page `24`.
- User-calibrated page ownership is narrower: `List 38` is the complete left column on printed page `109`, and it should not inherit any rows from `List 37` on the previous printed page.
- Visible troop families include `Companions`, `Companions (after 413)`, `Scouts`, `Warriors and peltasts`, `Macedonian hoplites`, `Phalangites`, `Greek mercenary hoplites`, `Illyrian mercenaries`, and several light-infantry lines.
- User calibration currently supports keeping all preserved `List 38` rows, provided the `before`/`after` date gates and upgrade/downgrade notes remain attached to the right rows.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Companions | Heavy cavalry | ordinary | `upgrade to elite (max 2)` | ? | 4 | 9 | The units column is noisy, but the row identity and upgrade are clear. | needs-source-check |
| Companions (after 413 BC) | Heavy cavalry impact | ordinary | date-gated; `upgrade to elite (max 2)` | ? | ? | 10 | Preserve the late Companions as a separate gated row. | needs-source-check |
| Scouts | Light cavalry javelin | ordinary | ? | ? | ? | ? | OCR clearly exposes the family label and type, but not stable points/units. | needs-source-check |
| Warriors and peltasts | Medium swordsmen / Javelinmen | ordinary | `downgrade to mediocre (max 2) -2` on javelinmen | 6 | 24 | `6 / 7` | Preserve as a grouped mixed infantry line. | needs-source-check |
| Macedonian hoplites / Phalangites | Heavy spearmen / Pikemen | ordinary | `after 480 BC` / `after 370 BC` gates | ? | ? | ? | The OCR shows a two-stage spear-to-pike transition that should remain grouped for now. | needs-source-check |
| Greek mercenary hoplites | Heavy spearmen | ordinary | `add armour (before 460 BC) +2`; `downgrade to mediocre -2` | ? | ? | 8 | The row is readable enough to retain structurally. | needs-source-check |
| Illyrian mercenaries | Medium swordsmen | ordinary | `upgrade to elite +2` | 0 | 2 | 6 | The row is readable in the lower half of the page-24 block. | needs-source-check |
| Light infantry javelin | Light infantry javelin | ordinary | ? | 0 | 4 | 4 | One of the clearest tail rows in the Early Macedonian block. | needs-source-check |
| Light infantry bow | Light infantry bow | ordinary | ? | 0 | 2 | 4 | OCR clearly exposes the troop type and unit cap. | needs-source-check |

Options / replacements:
- `Companions` switch to the `Heavy cavalry impact` profile after `413 BC`.
- `Macedonian hoplites` appear after `480 BC`, and `Phalangites` appear after `370 BC` as a later stage in the same core infantry progression.
- `Greek mercenary hoplites` can `add armour` before `460 BC`.

Allies:
- `Spartan in 424` or `Thessalian in 392` allies (`List #60 Classical Greek`).

Open verification:
- Preserve the `after 413 BC`, `after 480 BC`, and `after 370 BC` date gates as structural list notes during later normalization.
- Confirm the OCR-distorted unit bounds in the Companions block before adding troop rows.
- Confirm whether `Macedonian hoplites` and `Phalangites` are parallel options or a direct historical replacement line.
- Reconstruct printed page `109` in page order before promoting any lower-page troop tails that might be vulnerable to OCR drift.

### List 39 - Alexandrian Macedonian

Source: `merged.pdf` p.24-25 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; printed index `109`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `355 - 330 BC`
Region / classification: `Classical Period`, `Macedonian`
Command value: `+5`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, strategist block, and the opening troop table on `merged.pdf` page `24`, with continuation on page `25`.
- Ownership check across the handoff confirms that `List 39` remains self-contained through its continuation and ends before `List 40` begins; `List 40` should not inherit any page-tail rows from `List 39`.
- Visible troop families include `Companions`, `Greek and Thessalian cavalry`, `Prodromoi`, `Macedonian phalangites`, `Hypaspists`, `Greek hoplites`, `Thracian peltasts`, `Agrianian or Thracian javelinmen`, artillery, and fortified camp.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Companions | Heavy cavalry impact | elite | ? | 2 | 4 | 12 | The opening elite cavalry row is one of the clearest in the page-24 block. | needs-source-check |
| Greek and Thessalian cavalry | Medium cavalry / Heavy cavalry | ordinary | heavy variant `max 2` | 0 | 4 | `7 / 9` | OCR clearly suggests a dual-profile cavalry family. | needs-source-check |
| Prodromoi | Light cavalry impact | ordinary | ? | 0 | 2 | ? | The name is OCR-degraded, but the row identity is still localizable. | needs-source-check |
| Thracians and Paionians | Light cavalry javelin | ordinary | ? | ? | ? | ? | The row sits between `Prodromoi` and `Macedonian phalangites` in the strongest OCR slice. | needs-source-check |
| Macedonian phalangites | Pikemen | ordinary | ? | 2 | 8 | 11 | One of the strongest infantry rows in the list. | needs-source-check |
| Hypaspists | Pikemen elite / Heavy spearmen elite / Medium spearmen elite | elite | tri-profile block | ? | ? | `13 / 10 / 9` | Preserve as one grouped elite family until the page break is reconstructed. | needs-source-check |
| Greek hoplites | Heavy spearmen | ordinary | ? | ? | ? | ? | The row start is visible before the page break. | needs-source-check |

Options / replacements:
- `Replace some Macedonian phalangites` by `Medium spearmen` appears explicitly in the page-24 OCR block and should remain a separate replacement note.

Allies:
- `Thessalian allies (List #60 Classical Greek)`.

Notes and restrictions:
- The commander in chief can be included in a unit of `Hypaspists` only if `Philip II`.

Open verification:
- Reconstruct the page break between `merged.pdf` pages `24` and `25` before normalizing the full troop table.
- Preserve the Philip-II-only Hypaspist commander note as a list note rather than flattening it into troop stats.
- Confirm whether `Prodromoi` should be transcribed as a proper name row or an OCR split of another cavalry family label.
- Recover the exact visual flow of the `List 39` continuation before promoting lower-block rows that may sit near the handoff to `List 40`.

### List 40 - Alexander the Great

Source: `merged.pdf` p.25 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; printed index `110`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `330 - 320 BC`
Region / classification: `Classical Period`, `Macedonian`
Command value: `+6`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, command value, strategist note, and a broad opening troop block on `merged.pdf` page `25`.
- Ownership check across the handoff confirms that `List 40` begins as a clean new page-top block after the end of `List 39`; it should not inherit any tail rows or notes from the previous list.
- Visible troop families include `Companions`, `Greek cavalry`, `Scythians/Bactrians`, `Hippakontistai`, `Macedonian phalangites`, `Hypaspists`, `Greek hoplites`, `Thracian peltasts`, `Greek peltasts`, `Agrianian or Thracian javelinmen`, elephants, artillery, and fortified camp.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Companions | Heavy cavalry impact | elite | ? | 2 | 4 | ? | The row identity and unit bounds are clear, but the points cell is OCR-distorted. | needs-source-check |
| Greek cavalry | Medium cavalry / Heavy cavalry | ordinary | ? | 0 | 1 | `7 / 9` | The cavalry family is readable enough to preserve structurally. | needs-source-check |
| Scythians, Scythians or Bactrians | Light cavalry bow | ordinary | `upgrade to elite (max 1, Bactrian) +1` | 1 | 3 | 6 | OCR is noisy on the label, but the family and gating are visible. | needs-source-check |
| Hippakontistai | Light cavalry javelin | ordinary | ? | ? | ? | ? | The row label and troop type are visible, but columns need recheck. | needs-source-check |
| Macedonian phalangites | Pikemen / Medium spearmen | ordinary | replacement option visible | 2 | 6 | `11 / 7` | OCR clearly shows a phalangite core plus a replacement medium-spear option. | needs-source-check |
| Hypaspists | Pikemen elite / Heavy spearmen elite / Medium spearmen elite | elite | grouped elite family | 1 | 2 | `13 / 10 / 9` | Preserve as one grouped elite row until the full image is checked. | needs-source-check |
| Elephant | Elephant | ordinary | ? | 0 | 2 | 13 | One of the clearest late-block special rows on the page. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | ? | 0 | 1 | 10 | Visible as an independent support row. | needs-source-check |
| Greek hoplites | Heavy spearmen | ordinary | ? | 0 | 2 | 8 | The lower page-25 block makes this row readable enough to preserve separately. | needs-source-check |
| Thracian peltasts | Medium swordsmen / Medium swordsmen `2HW` / Javelinmen | ordinary | grouped mixed-infantry row | 0 | 3 | `6 / ? / 7` | OCR shows a mixed peltast block that should stay grouped until image review. | needs-source-check |
| Agrianian or Thracian javelinmen | Light infantry javelin / Light infantry bow / Light infantry sling | ordinary | `upgrade to elite +1`; bow `max 2 if Cretan` | 2 | 4 | `4 / 4 / 4` | The light infantry block is one of the clearest lower-page groups and should remain linked to its elite/Cretan notes. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | 0 | 1 | 6 | The fortified camp row is visible at the end of the block. | needs-source-check |

Options / replacements:
- `Replace some Macedonian phalangites` by `medium spearmen` is visible as a structured replacement line and should remain explicit during later normalization.

Open verification:
- Confirm the OCR-distorted points/units cells at the top of the Companions block before adding a normalized troop table.
- Keep the mixed Greek/Asiatic cavalry families separated from each other during later normalization.
- Confirm the exact label on the Scythian/Bactrian cavalry family, because the OCR currently duplicates part of the ethnonym.
- Reconstruct the page-top block in printed-page order before promoting any lower support rows that might be vulnerable to OCR drift.

## Late Classical Starter Layer - Lists 59-82

Source: `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: spreadsheet-crosschecked, needs-source-check
Applies to: first coverage pass over the remaining list-book tail after the early Classical starter layer

Project wording:
- The corpus now has a first conservative starter layer through List `82`.
- Lists `59-82` are currently workbook-name anchored only; no local header OCR has been assigned to them in this pass.
- This closes the first full-list coverage pass without overclaiming unread headers or troop tables.
- Use `docs/source/Classic_Period.md` as the canonical scan-first working source for Classical lists `38-82`; this late-Classical starter layer is retained only as legacy routing context inside the broad all-period corpus.

| List | Army name | Evidence status |
| --- | --- | --- |
| 59 | Meroitic Kushite | spreadsheet-crosschecked, needs-source-check |
| 60 | Classical Greek | spreadsheet-crosschecked, needs-source-check |
| 61 | Hellenistic Greek | spreadsheet-crosschecked, needs-source-check |
| 62 | Illyrian | spreadsheet-crosschecked, needs-source-check |
| 63 | Thracian | spreadsheet-crosschecked, needs-source-check |
| 64 | Achaemenid Persian | spreadsheet-crosschecked, needs-source-check |
| 65 | Lydian | spreadsheet-crosschecked, needs-source-check |
| 66 | Lycian | spreadsheet-crosschecked, needs-source-check |
| 67 | Bithynian | spreadsheet-crosschecked, needs-source-check |
| 68 | Later Achaemenid Persian | spreadsheet-crosschecked, needs-source-check |
| 69 | Cappadocian | spreadsheet-crosschecked, needs-source-check |
| 70 | Bosporan Kingdom | spreadsheet-crosschecked, needs-source-check |
| 71 | Armenian | spreadsheet-crosschecked, needs-source-check |
| 72 | Galatian | spreadsheet-crosschecked, needs-source-check |
| 73 | Pergamon | spreadsheet-crosschecked, needs-source-check |
| 74 | Aramaean | spreadsheet-crosschecked, needs-source-check |
| 75 | Early Arab | spreadsheet-crosschecked, needs-source-check |
| 76 | Scythian | spreadsheet-crosschecked, needs-source-check |
| 77 | Sarmatian | spreadsheet-crosschecked, needs-source-check |
| 78 | Vietnamese | spreadsheet-crosschecked, needs-source-check |
| 79 | Classical Indian | spreadsheet-crosschecked, needs-source-check |
| 80 | Warring States | spreadsheet-crosschecked, needs-source-check |
| 81 | Qiang and Di | spreadsheet-crosschecked, needs-source-check |
| 82 | Yayoi Japanese | spreadsheet-crosschecked, needs-source-check |

Open verification:
- Add direct page and header anchors for Lists `59-82` during the next OCR pass rather than extrapolating dates, terrain, or command values from army names.
- Prioritize Lists `60`, `64`, `76`, and `79` early, because they are likely to become planning anchors for later army-builder and scenario work.
- Re-audit Lists `59-82` sequentially with the calibrated rules from `68`, `75`, and `76/77`, especially where page tails, bold headers, or `replace` blocks were normalized before the column-as-page rule was fully established.

### List 41 - Early Successors

Source: `ArmyLists1-82.pdf` p.26; `merged.pdf` p.26 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: needs-source-check
Region / classification: `Classical Period`, `Successor`
Command value: needs-source-check
Terrain: needs-source-check

Notes and restrictions:
- A direct page-`26` extraction is now available locally, but the page is a dense multi-column successor block with overlapping sub-commands and named-ruler variants.
- The strongest readable structures are Macedonian and Asiatic successor options, named ruler blocks such as `Cassander`, `Ptolemy Keraunos`, `Antigonus the One-Eyed`, `Polyperchon`, `Demetrius`, and `Lysimachus`, plus ally hooks to `Hellenistic Greek` and `Thracian` lists.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greek and Macedonian phalangites | Pikemen / Heavy spearmen | ordinary | grouped successor phalanx core | ? | ? | `11 / 8` | The phalanx block is one of the clearest recurring rows on page `26`, but still overlaps adjacent successor variants. | needs-source-check |
| Hypaspists | Pikemen elite | elite | ? | ? | ? | 13 | The row label and troop type are readable in the upper block. | needs-source-check |
| Elephant | Elephant | ordinary | ? | 0 | 1 | 13 | One of the clearest support rows in the shared successor block. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | ? | 0 | 1 | 10 | Visible as a separate support line in the same block. | needs-source-check |

Options / replacements:
- `Replace some Greek peltasts` by `thureophoroi` appears explicitly in the page-`26` extraction.
- `Replace Greek and Macedonian phalangites` by `Persians (pantodapoi)` appears in one Asiatic successor sub-block.
- `Replace all Greek and Macedonian phalangites` and `replace all elephants` appear in a later successor sub-block and should remain grouped to their named-ruler context until page-image confirmation.

Allies:
- `Spartan or Argive allies (List #61 Hellenistic Greek)` in `272 BC`.
- `Aetolian allies (List #61 Hellenistic Greek)`.
- `Odryssian allies (List #63 Thracian)`.

Open verification:
- Reconstruct the visual grouping of the named-ruler sub-blocks before splitting this page into normalized troop rows.
- Confirm which replacement lines belong only to specific commanders or successor variants.
- Confirm the exact date range, terrain, and command header from the page image before promoting those fields.

### List 42 - Seleucid

Source: `ArmyLists1-82.pdf` p.27; `merged.pdf` p.27 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `320 - 64 BC`
Region / classification: `Classical Period`, `Successor`
Command value: `+4`
Terrain: `Plain, Mountain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, strategist block, and the opening historical note on `merged.pdf` page `27`.
- The page is still column-dense, but several major troop families and date-gated sub-period hooks are readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Companions or Agema | Heavy cavalry impact elite / Cataphract elite | elite | `replace Coppa and Agena`; `from 280 BC` block | 0 | 2 | `14 / 12` | The opening elite cavalry block is readable, but the label remains OCR-noisy. | needs-source-check |
| Xystophoroi | Heavy cavalry impact / Cataphract | ordinary | `replace all Xystophoroi` visible in the same block | 1 | 4 | 10 | OCR keeps the row family stable enough to preserve. | needs-source-check |
| Elephant | Elephant / Elephant armour | ordinary | `until 205 BC` and later date-gated variants visible | 0 | `3 / 2` | `12 / 16` | The elephant block is one of the strongest lines on the page. | needs-source-check |
| Galatian horsemen | Medium cavalry elite / Heavy cavalry elite | elite | `after 245 BC` | 0 | 1 | `9 / 11` | The date-gated cavalry row is readable enough to preserve explicitly. | needs-source-check |
| Galatian infantry | Heavy swordsmen impetuous | ordinary | `upgrade to elite +2`; `after 245 BC` | 0 | 2 | 8 | This line is one of the clearer later-period rows. | needs-source-check |
| City militia | Light camelry bow mediocre / Medium cavalry mediocre / Medium camelry bow mediocre / Medium spearmen mediocre / Heavy spearmen mediocre | mediocre | grouped city-militia family | ? | ? | `5 / 5 / 8 / 5 / 6` | OCR keeps the family together, but internal row boundaries need page-image confirmation. | needs-source-check |
| Silver shields / Argyraspids | Pikemen elite | elite | `replace all Argyraspids`; `max 1` note visible nearby | 2 | 6 | 13 | The elite pike block is readable, but the replacement wording needs a visual check. | needs-source-check |
| Imitation legionaries | Heavy swordsmen impact | ordinary | `max 2`; `from 145 to 125 BC` later-period hook nearby | 1 | 3 | 9 | Preserve as a later-period Romanizing infantry note pending page-image confirmation. | needs-source-check |

Allies:
- `Aetolian allies (List #61 Hellenistic Greek)` from `191 to 190 BC`.
- `Elymaien allies (List #102 Parthian)` after `167 BC - Later period`.
- `Jewish allies (List #103 Judaean Jewish)` after `167 BC - Later period`.

Open verification:
- Confirm the exact cavalry labels in the opening `Companions or Agema` / `Xystophoroi` block, because OCR degrades several proper names.
- Reconstruct the later-period blocks before splitting `City militia`, `Silver shields`, and `Imitation legionaries` into more normalized rows.
- Keep all `from 280 BC`, `until 205 BC`, `after 245 BC`, `after 167 BC`, and `from 145 to 125 BC` hooks attached to their specific sub-period rows during later normalization.

### List 43 - Ptolemaic

Source: `ArmyLists1-82.pdf` p.28; `merged.pdf` p.28 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `320 - 30 BC`
Region / classification: `Classical Period`, `Successor`
Command value: `+4`
Terrain: `Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and opening historical paragraph on `merged.pdf` page `28`.
- The page is still multi-column and begins to interleave `Pyrrhic` in the lower half, so grouped rows should remain grouped where the visual binding is unstable.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Xystophoroi | Heavy cavalry impact | ordinary | `upgrade to elite (max 1) +2` | ? | ? | 10 | The opening cavalry row is one of the clearest on the page. | needs-source-check |
| Greeks, Nubians or Galatians | Medium cavalry / Heavy cavalry | ordinary | `upgrade to elite (if Galatian) +2` | ? | ? | 9 | Preserve as a grouped cavalry family until the page image is checked. | needs-source-check |
| Egyptian phalangites | Pikemen mediocre | mediocre | ? | ? | ? | ? | The row label and troop type are clear, but the unit bounds are not. | needs-source-check |
| Thureophoroi or Thorakitai | Medium spearmen | ordinary | `add armour (max 2)` | ? | ? | 7 | A readable mid-page infantry line. | needs-source-check |
| Galatian infantry | Heavy swordsmen impetuous | ordinary | `upgrade to elite` | ? | ? | 8 | One of the clearest infantry rows in the same block. | needs-source-check |
| African elephants | Elephant mediocre | mediocre | ? | ? | ? | ? | The elephant row is visible, but units and points remain unstable. | needs-source-check |
| Imitation legionaries | Heavy swordsmen impact | ordinary | `after 167 BC` | ? | ? | ? | Preserve as a later-period infantry hook. | needs-source-check |
| Phalangites | Pikemen | ordinary | `from 54 BC - Later period`; `downgrade to mediocre -3` | ? | ? | 11 | The later-period pike row is readable enough to preserve structurally. | needs-source-check |
| Veteran legionaries | Heavy swordsmen armour impact | ordinary | `upgrade to elite +2` | ? | ? | 11 | The late-period Romanizing infantry row is locally stable. | needs-source-check |

Notes and restrictions:
- The lower body also clearly shows `Nubians or Tarentines`, `Bedouins`, `Pirates and bandits`, `Rioting mob`, and `Thracian` contingent labels, but their row boundaries should remain unresolved until the page image is checked.

Open verification:
- Reconstruct the lower multi-column block before splitting the irregular auxiliary and mob rows into normalized entries.
- Keep the `after 167 BC` and `from 54 BC - Later period` hooks attached to their specific Ptolemaic sub-period rows.

### List 44 - Pyrrhic

Source: `ArmyLists1-82.pdf` p.28; `merged.pdf` p.28 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `306 - 272 BC`
Region / classification: `Classical Period`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, strategist note, and the opening historical paragraph on `merged.pdf` page `28`.
- The body is interleaved with the tail of `Ptolemaic`, but the core Pyrrhic phalanx and cavalry hooks are readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Macedonian phalangites (before 274 BC) | Pikemen | ordinary | `upgrade to elite (max 2) +2` | 2 | 6 | 11 | The pre-274 phalanx row is one of the clearest Pyrrhic lines. | needs-source-check |
| Greek hoplites and peltasts | Heavy spearmen / Javelinmen | ordinary | heavy-spearmen profile `max 2` | ? | ? | 8 | Preserve as a grouped infantry family until the page image is checked. | needs-source-check |
| Asiatic elephants | Elephant | ordinary | ? | ? | ? | ? | The elephant row is visible in the upper Pyrrhic block. | needs-source-check |
| Xystophoroi (until 274 BC) | Heavy cavalry impact elite | elite | ? | ? | ? | ? | The row label is visible, but units and points remain blurred. | needs-source-check |
| Greek horsemen | Medium cavalry / Heavy cavalry | ordinary | ? | ? | ? | `7 / 9` | The cavalry family is readable in the same block. | needs-source-check |
| Macedonian phalangites (from 274 to 275 BC OCR needs check) | Pikemen | ordinary | `upgrade to elite (max 2) +2` | ? | ? | 11 | The OCR year range is degraded and needs direct page confirmation. | needs-source-check |
| Aetolians, Paionians or Thracians | Light cavalry javelin | ordinary | ? | ? | ? | ? | Preserve as a grouped allied-cavalry hook until layout confirmation. | needs-source-check |

Notes and restrictions:
- Strategist visible in the header is `Pyrrhus (280-272 BC)`.
- The OCR shows a second Macedonian phalangite block with a degraded year range after the pre-`274 BC` block; preserve it as a date-gated structural note until the page image is checked.

Open verification:
- Confirm the exact second year hook on the later Macedonian phalangite block, because the OCR currently reads `Fom 274 to 55 BC`.
- Reconstruct the full Pyrrhic troop table before splitting the interleaved cavalry and infantry tail rows.

### List 45 - Later Macedonian

Source: `ArmyLists1-82.pdf` p.29; `merged.pdf` p.29 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `260 - 168 BC`
Region / classification: `Classical Period`, `Macedonian`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, strategist block, and the opening historical paragraph on `merged.pdf` page `29`.
- The page is still heavily interleaved with the tail of `Pyrrhic`, so only the clearest Later Macedonian rows should be normalized at this stage.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Macedonians, Greeks, Thessalians, Galatians or Thracians | Medium cavalry / Heavy cavalry | ordinary | `upgrade to elite (max 3) +2` | ? | ? | `7 / 9` | The cavalry family is readable enough to preserve as a grouped elite-cap row. | needs-source-check |
| Agema | Pikemen elite | elite | ? | ? | ? | ? | The row label is OCR-degraded but the elite pike identity is locally visible. | needs-source-check |
| Macedonian phalangites | Pikemen | ordinary | ? | 2 | 6 | 11 | One of the clearest core rows in the Later Macedonian block. | needs-source-check |
| Thureophoroi or Thorakitai | Medium spearmen | ordinary | `add armour (max 2) +2` | 2 | 4 | 7 | The mid-page infantry row is readable enough to preserve cautiously. | needs-source-check |
| Illyrians | Light cavalry javelin | ordinary | ? | ? | ? | ? | The row label and troop type are visible, but columns are unstable. | needs-source-check |
| Thracians or Illyrians | Medium swordsmen / Medium swordsmen `2HW` / Medium spearmen / Javelinmen | ordinary | grouped auxiliary block | 0 | 4 | `6 / 7 / 7 / 7` | The auxiliary family is legible enough to keep grouped, but the full row binding still needs a page-image check. | needs-source-check |
| Galatians | Heavy swordsmen impetuous | ordinary | `upgrade to elite +2` | 0 | 2 | 8 | One of the clearer later infantry rows on the page. | needs-source-check |
| Light infantry support | Light infantry javelin / Light infantry bow | ordinary | `upgrade to elite (if Agrianian) +1`; `upgrade to elite (if Cretan) +1` | ? | ? | 4 | The tail light-infantry lines are readable, but should remain grouped until the page image is checked. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | ? | 0 | 1 | 10 | The support row is readable and locally stable. | needs-source-check |

Notes and restrictions:
- Strategist visible in the header is `Philip V (221-179 BC)`.
- The visible historical paragraph also references `Perseus` and the Macedonian defeat at `Pydna in 168 BC`.

Open verification:
- Reconstruct the page columns before assigning exact unit bounds to `Agema`, `Illyrians`, and the grouped auxiliary block.
- Confirm whether any visible ally/date notes near the bottom of the page belong to `Later Macedonian` or remain part of the interleaved `Pyrrhic` tail.

### List 46 - Graeco-Bactrian and Graeco-Indian

Source: `ArmyLists1-82.pdf` p.30; `merged.pdf` p.30 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `250 - 55 BC`
Region / classification: `Classical Period`, `Hellenistic East`
Command value: `+4`
Terrain: `Graeco-Indian: Plain, Mountain, Forest`; `Graeco-Bactrian: Plain, Desert, Steppe`

Notes and restrictions:
- OCR clearly exposes the combined list header, date range, split terrain line, command value, and opening historical paragraph on `merged.pdf` page `30`.
- The page explicitly divides the list into `Graeco-Bactrian` and `Graeco-Indian` sections and states that the player must choose one of the two options.
- A further note states that in a `Graeco-Indian` army, at least half of the units, other than allied units, must be Indian units.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greek horsemen | Heavy cavalry | ordinary | `upgrade to elite +2` | ? | ? | 9 | The opening cavalry row is one of the clearest shared entries on the page. | needs-source-check |
| Greek phalangites | Pikemen | ordinary | ? | 1 | 4 | 11 | One of the strongest core infantry rows in the shared block. | needs-source-check |
| Cretan archers | Light infantry bow elite | elite | ? | ? | ? | ? | The row label is clear, but unit bounds remain degraded. | needs-source-check |
| Colonists and peltasts | Javelinmen / Light infantry javelin | ordinary | grouped mixed infantry block | 0 | 2 | `7 / 4` | The shared supporting infantry block is readable enough to preserve grouped. | needs-source-check |
| Indian spearmen | Medium spearmen | ordinary | `downgrade to mediocre -2` | 0 | 4 | 7 | This Indian contingent row is one of the clearest mid-page lines. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | 0 | 1 | 6 | The support row is clearly visible at the end of the shared block. | needs-source-check |
| Indian horsemen | Medium cavalry | ordinary | `downgrade to mediocre -2` | ? | ? | 7 | Preserve as part of the Graeco-Indian-specific block. | needs-source-check |
| Indian horsemen skirmishers | Light cavalry javelin | ordinary | ? | ? | ? | ? | The row label is OCR-noisy but the Indian light-cavalry family is visible. | needs-source-check |
| Indian elephants | Elephant elite | elite | ? | ? | ? | ? | The Indian elephant row is clearly visible in the Graeco-Indian section. | needs-source-check |
| Indian warriors | Medium swordsmen | ordinary | `downgrade to mediocre -2` | ? | ? | 6 | The row is readable enough to preserve structurally. | needs-source-check |
| Indian archers | Bowmen | ordinary | `downgrade to mediocre -2`; `replace some Indian archers by mixed units` | ? | ? | 7 | The archer block and its replacement note are visible enough to keep explicit. | needs-source-check |
| Arachosians and Paropamisadae | Light cavalry javelin | ordinary | ? | ? | ? | ? | The regional cavalry contingent is readable but still needs page-image confirmation. | needs-source-check |
| Scythians | Light cavalry bow | ordinary | ? | ? | ? | ? | The ally-style mounted contingent is visible in the shared block. | needs-source-check |
| Xystophoroi | Heavy cavalry impact | ordinary | `upgrade to elite +2` | 0 | 2 | 10 | One of the clearest Graeco-Bactrian-specific cavalry rows. | needs-source-check |
| Tranian lancers | Heavy cavalry impetuous / Cataphract | ordinary | `after 210 BC`; `upgrade to elite (max 2) +2` | ? | ? | `9 / 12` | Preserve as a date-gated Graeco-Bactrian cavalry family until the page image is checked. | needs-source-check |
| Bactrians | Light cavalry bow | ordinary | `upgrade to elite +1` | 2 | 6 | 6 | A locally stable Graeco-Bactrian mounted row. | needs-source-check |
| Elephant | Elephant | ordinary | ? | 0 | 2 | 13 | The Graeco-Bactrian elephant row is clear enough to preserve. | needs-source-check |

Options / replacements:
- `Replace some Indian archers` by mixed units is visible in the Graeco-Indian section and should remain explicit until the page image confirms the exact replacement family.

Allies:
- `Saka allies (List #76 Scythian)` for `Graeco-Bactrian`.
- `Indian allies (List #79 Classical Indian)` for `Graeco-Indian`.
- `Kushan allies (List #107 Kushan)` for `Graeco-Indian`.

Open verification:
- Reconstruct the page columns before splitting the shared block from the `Graeco-Bactrian` and `Graeco-Indian` sub-sections more aggressively.
- Confirm the exact label on `Indian horsemen skirmishers` and the mixed-unit replacement attached to `Indian archers`.
- Keep the split terrain line and the `choose one of the two options` note attached to the list header during later normalization.

### List 47 - Italic Tribes

Source: `ArmyLists1-82.pdf` p.31; `merged.pdf` p.31 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: needs-source-check
Region / classification: `Classical Period`, `Italy`
Command value: `+3`
Terrain: needs-source-check

Notes and restrictions:
- OCR clearly exposes the list identity as `Italic Tribes`, a closing year of `290 BC`, and `Command +3`, but the opening year and terrain line are cropped in the page-31 slice.
- The body is interleaved with `Etruscan`, so only the clearest Italic core families should be preserved at this stage.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Horsemen | Medium cavalry / Heavy cavalry | ordinary | heavy profile `max 2` | 1 | 4 | `7 / 9` | The horsemen row is one of the clearest Italic lines in the page-31 slice. | needs-source-check |
| Warriors | Medium swordsmen / Medium swordsmen impetuous | ordinary | `upgrade to elite (max 4) +2`; `downgrade to mediocre -2` visible nearby | 8 | 24 | 6 | Preserve as a grouped core-warrior family until the page image is checked. | needs-source-check |
| Javelinmen | Javelinmen / Light infantry javelin | ordinary | `downgrade to mediocre -2` on one visible row | 0 | 6 | `7 / 4` | The skirmisher block is readable enough to preserve grouped. | needs-source-check |
| Tribal levies / slingers | Light infantry sling / Levy | ordinary | grouped tail block | 0 | `2 / 6` | `4 / ?` | The lower part of the Italic slice is still column-noisy and should remain grouped. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | 0 | 1 | 6 | The support row is visible at the end of the Italic block. | needs-source-check |

Allies:
- `Etruscan allies (List #48 Etruscan)` before `338 BC`.

Open verification:
- Recover the missing opening year digits and terrain line from the page image.
- Reconstruct the page columns before splitting the grouped warrior and skirmisher families more aggressively.

### List 48 - Etruscan

Source: `ArmyLists1-82.pdf` p.31; `merged.pdf` p.31 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `600 - 280 BC`
Region / classification: `Classical Period`, `Italy`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and opening historical paragraph on `merged.pdf` page `31`.
- The body is interleaved with `Italic Tribes`, but several hoplite and nobles rows are readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nobles before 500 BC | Light chariot | ordinary | `add armour +2` | ? | ? | 9 | The pre-500 noble row is one of the clearest lines in the Etruscan slice. | needs-source-check |
| Nobles after 500 BC | Medium cavalry / Heavy cavalry | ordinary | ? | ? | ? | `7 / 9` | Preserve as a grouped cavalry family until the page image is checked. | needs-source-check |
| Guardsmen | Heavy spearmen armour elite / Heavy swordsmen armour `2HW` elite | elite | grouped elite block | 0 | 2 | `12 / 13` | The guardsmen family is locally stable enough to preserve grouped. | needs-source-check |
| Hoplites of 1st class | Heavy spearmen | ordinary | `add armour (all or not) +2` | 2 | 6 | 8 | One of the clearest hoplite rows in the page-31 slice. | needs-source-check |
| Hoplites of 2nd and 3rd classes | Heavy spearmen | ordinary | `downgrade to mediocre -2` | 6 | 18 | 8 | The grouped lower-class hoplite row is readable enough to preserve. | needs-source-check |
| Re-equipped 2nd and 3rd classes | Heavy swordsmen impact | ordinary | `from 330 BC`; `downgrade to mediocre -2` | ? | ? | 9 | Preserve as a date-gated re-equipment hook tied to the lower-class hoplite block. | needs-source-check |
| Javelinmen / light infantry support | Javelinmen / Light infantry javelin / Light infantry sling / Light infantry bow | ordinary | grouped support block | 2 | 6 | `7 / 4 / 4 / 4` | The tail support families are visible but still somewhat column-interleaved. | needs-source-check |
| Levy | Levy | ordinary | ? | 0 | 2 | 3 | The levy row is visible near the end of the slice. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | 0 | 1 | 6 | The support row is clearly visible. | needs-source-check |

Allies:
- `Latin allies`.
- `Roman or Hernician allies (List #47 Italic Tribes)`.
- `Campanian or Apulian allies (List #51 Campanian, Lucanian, Apulian and Bruttian)`.
- `Roman allies (List #52 Camillan Roman)`.
- `Gallic allies (List #89 Gallic)`.

Options / replacements:
- `From 330 BC`, re-equip some `2nd and 3rd classes` with `pilum` and preserve that as a date-gated structural note until the page image confirms the exact row binding.

Open verification:
- Confirm the exact opening year and terrain/cropped labels that still drift between the interleaved columns.
- Reconstruct the mixed Italic/Etruscan page columns before splitting the grouped support rows and ally notes more aggressively.

### List 49 - Tullian Roman

Source: `ArmyLists1-82.pdf` p.32; `merged.pdf` p.32 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `578 - 400 BC`
Region / classification: `Classical Period`, `Roman`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `32`.
- The page is interleaved with `Syracusan`, so only the clearest Roman class-system rows should be preserved at this stage.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Equites | Medium cavalry / Heavy cavalry | ordinary | heavy profile `max 2` | 2 | 4 | `7 / 9` | The cavalry row is one of the clearest Tullian Roman entries on the page. | needs-source-check |
| 1st Class | Heavy spearmen armour | ordinary | `upgrade to elite` | ? | ? | ? | The row label and troop type are clear, but units and points are blurred by the interleaved Syracusan column. | needs-source-check |
| 2nd and 3rd Class | Heavy spearmen | ordinary | `add armour (all or none)` | 4 | 16 | 8 | This is the clearest formed-infantry line in the Roman class block. | needs-source-check |
| 4th Class | Javelinmen / Light infantry javelin | ordinary | grouped skirmisher class | 2 | 6 | `7 / 4` | Preserve as a grouped row until the page image confirms the exact split. | needs-source-check |
| 5th Class | Light infantry javelin / Light infantry sling | ordinary | sling `max 2` | ? | ? | 4 | The final light class is visible, but exact caps still need confirmation. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | ? | ? | 6 | The support row is visible at the end of the Roman block. | needs-source-check |
| Latin allies contingent | Horsemen / Heavy spearmen | ordinary | heavy spearmen `downgrade to mediocre -2` visible nearby | ? | ? | `7 / 9 / 8` | Preserve as a grouped ally contingent until the page columns are checked directly. | needs-source-check |

Allies:
- `Hernician allies (List #47 Italic Tribes)`.
- `Latin allies (see list above)`.

Open verification:
- Reconstruct the mixed Roman/Syracusan columns before splitting `1st Class` and the `Latin allies` contingent more aggressively.
- Confirm whether `Fortified camp 6` belongs fully to the Roman block or sits on the column boundary with Syracusan content.

### List 50 - Syracusan

Source: `ArmyLists1-82.pdf` p.32; `merged.pdf` p.32 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `481 - 210 BC`
Region / classification: `Classical Period`, `Greek Sicily`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, strategist block, and the opening historical paragraph on `merged.pdf` page `32`.
- The page is still interleaved with `Tullian Roman`, but several mercenary, hoplite, and allied blocks are readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greek and Campanian horsemen | Medium cavalry / Heavy cavalry | ordinary | heavy profile `max 4` | ? | ? | 9 | The mounted block is readable enough to preserve grouped. | needs-source-check |
| Tarentines | Light cavalry javelin | ordinary | ? | ? | ? | ? | The row label is clear, but the unit bounds remain blurred. | needs-source-check |
| Guard mercenaries / Mercenary hoplites | Heavy spearmen elite / Heavy spearmen | elite / ordinary | grouped mercenary core | ? | ? | 8 | Preserve as a grouped mercenary hoplite family until the page image is checked. | needs-source-check |
| Syracusan hoplites | Heavy spearmen mediocre | mediocre | ? | ? | ? | ? | The row is visible in the central Syracusan block. | needs-source-check |
| Gallic mercenaries | Medium swordsmen impetuous / Heavy swordsmen impetuous | ordinary | grouped Gallic mercenary family | ? | ? | `6 / 8` | One of the clearer mercenary rows on the page. | needs-source-check |
| Spanish scutarii | Medium swordsmen impetuous | ordinary | ? | ? | ? | ? | The row label is visible but the bounds remain blurred. | needs-source-check |
| Ligurians, Sardinians and Samnites | Medium swordsmen / Javelinmen | ordinary | grouped allied infantry family | ? | ? | `6 / 7` | Preserve as a grouped allied infantry block until the columns are checked directly. | needs-source-check |
| Mercenary peltasts / Thureophoroi | Javelinmen / Medium spearmen | ordinary | `before 275 BC` / `from 275 BC` | ? | ? | ? | The date-gated peltast-to-thureophoroi change is clearly visible. | needs-source-check |
| Balearic slingers | Light infantry sling elite | elite | ? | ? | ? | ? | The elite slinger row is readable enough to preserve. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | ? | ? | ? | 10 | The support row is clearly visible. | needs-source-check |
| Rowers dressed as hoplites | Levy | ordinary | ? | 0 | 2 | 3 | The levy row is visible at the end of the Syracusan slice. | needs-source-check |

Allies:
- `Libyan allies (List #12 Libyan)` for `Agathocles in Africa (310 to 307 BC)`.
- `Numidian allies (List #56 Numidian)` for `Agathocles in Africa (310 to 307 BC)`.
- `Greek allies (List #58 Kyrenean Greek)` for `Agathocles in Africa (310 to 307 BC)`.
- `Latin allies (see list above)`.
- `Samnite, Sabine or Umbrian allies (List #47 Italic Tribes)`.
- `Roman allies (List #49 Tullian Roman)`.
- `Greeks in Italy allies (List #60 Classical Greek)`.
- `Gallic allies (List #89 Gallic)`.

Notes and restrictions:
- Strategists visible in the header are `Timoleon (341-337 BC)` and `Agathocles (289 BC)`.
- `Agathocles in Africa (310 to 307 BC)` is a clear date-gated sub-period hook and should remain explicit during later normalization.

Open verification:
- Reconstruct the mixed Roman/Syracusan page columns before splitting the mercenary and allied infantry families more aggressively.
- Confirm exact points and unit bounds for `Tarentines`, `Syracusan hoplites`, and the `Mercenary peltasts / Thureophoroi` transition block.

### List 51 - Campanian, Lucanian, Apulian and Bruttian

Source: `ArmyLists1-82.pdf` p.33; `merged.pdf` p.33 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `420 - 203 BC`
Region / classification: `Classical Period`, `Italy`
Command value: `+3`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and opening historical paragraph on `merged.pdf` page `33`.
- The page is still interleaved with `Camillan Roman`, so only the clearest horsemen, warrior, and hoplite-transition blocks should be preserved at this stage.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Horsemen | Medium cavalry / Heavy cavalry | ordinary | heavy profile `max 4` | 2 | 6 | `7 / 9` | The mounted block is one of the clearest page-33 lines. | needs-source-check |
| Warriors | Medium swordsmen | ordinary | `upgrade to elite (max 6) +2` | 6 | 24 | 6 | The core warrior row is readable and locally stable. | needs-source-check |
| Javelinmen | Light infantry javelin | ordinary | ? | ? | ? | ? | The skirmisher row is visible but still somewhat column-noisy. | needs-source-check |
| Campanian hoplites | Heavy spearmen | ordinary | ? | 2 | 8 | 8 | The hoplite line is readable enough to preserve cautiously. | needs-source-check |
| From 337 BC replacement block | Medium swordsmen / Heavy swordsmen impact | ordinary | `from 337 BC`; `replace all warriors` or `replace some warriors` visible in the same block | 4 | 16 | `6 / 9` | Preserve as a date-gated restructuring block until the page image confirms exact row attachment. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | 0 | 1 | 6 | The support row is clearly visible near the end of the block. | needs-source-check |

Allies:
- `Samnite allies (List #47 Italic Tribes)`.
- `Roman allies (List #52 Camillan Roman)`.
- `Lucanian allies (List #51 Campanian, Lucanian, Apulian and Bruttian)` in the sub-list notes.
- `Bruttian allies (List #51 Campanian, Lucanian, Apulian and Bruttian)` in the sub-list notes.
- `Carthaginian allies (List #55 Carthaginian)` after `265 BC` and in `215 BC` are visible in the upper interleaved block and should remain source-linked notes until the page image is checked.

Notes and restrictions:
- The OCR shows sub-list handling for `Apulian`, `Bruttian`, and `Lucanian`, each with horsemen replacement or ally notes that should stay grouped to their local sub-blocks until the page columns are checked directly.

Open verification:
- Reconstruct the mixed Campanian/Camillan columns before splitting the sub-list-specific `Apulian`, `Bruttian`, and `Lucanian` notes into normalized rows.
- Confirm exact unit bounds for `Javelinmen` and the `from 337 BC` replacement block.

### List 52 - Camillan Roman

Source: `ArmyLists1-82.pdf` p.33; `merged.pdf` p.33 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `400 - 275 BC`
Region / classification: `Classical Period`, `Roman`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and opening historical paragraph on `merged.pdf` page `33`.
- The page is interleaved with `Campanian, Lucanian, Apulian and Bruttian`, but the Roman legion-layer rows are readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Equites | Medium cavalry / Heavy cavalry | ordinary | heavy profile `max 2` | 1 | 4 | `7 / 9` | The cavalry row is one of the clearest Camillan Roman entries. | needs-source-check |
| Triarii (see notes) | Heavy spearmen armour elite | elite | ? | 0 | 4 | ? | The triarii block is readable, but the points cell is still blurred. | needs-source-check |
| Hastati | Heavy swordsmen impact | ordinary | `add armour (all or none) +2` | 4 | 8 | ? | The core hastati row is readable enough to preserve structurally. | needs-source-check |
| Principes | Heavy spearmen | ordinary | `add armour (all or none) +2` | 4 | 8 | 8 | One of the clearest legion rows on the page. | needs-source-check |
| Leves | Light infantry javelin | ordinary | ? | 2 | 8 | 4 | The light infantry row is readable and locally stable. | needs-source-check |
| Accensi | Heavy spearmen mediocre | mediocre | ? | 0 | 2 | 6 | The row is visible as a lower-line supporting class. | needs-source-check |
| Rorarii | Light infantry javelin | ordinary | ? | ? | ? | ? | The row label is visible, but the exact bounds are still column-noisy. | needs-source-check |
| From 275 BC later legions | Heavy spearmen armour / Heavy swordsmen impact mediocre / Heavy spearmen mediocre | mixed | `from 275 BC`; `newly recruited legions`; several `replace some Hastati/Principes/Triarii` hooks | ? | ? | `9 / 7 / 6 / 10` | Preserve as one later-legion restructuring block until the page image confirms the exact row attachments. | needs-source-check |

Notes and restrictions:
- The opening historical note clearly states that the legion fought in four lines: `Leves`, `Hastati`, `Principes`, and `Triarii`.
- `Triarii (see notes)` should remain explicit because the row label itself points to a special structural note.

Open verification:
- Reconstruct the mixed Campanian/Camillan page columns before splitting the later-legion replacement block into normalized rows.
- Confirm exact points for `Triarii` and `Hastati`, which remain partially blurred in the OCR slice.

### List 53 - Republican Roman

Source: `ArmyLists1-82.pdf` p.34; `merged.pdf` p.34 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `275 - 105 BC`
Region / classification: `Classical Period`, `Roman`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, strategist block, and the opening historical paragraph on `merged.pdf` page `34`.
- The page preserves both the standard legion structure and a later `newly recruited legions` restructuring block, plus the anti-elephant and flaming-pig notes against Pyrrhus.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Equites | Medium cavalry / Heavy cavalry | ordinary | heavy profile `max 2` | 0 | 4 | `7 / 9` | The cavalry row is readable and locally stable. | needs-source-check |
| Hastati and Principes | Heavy swordsmen impact | ordinary | `add armour (all, % or none) +2`; `upgrade to elite (max 4) +2` | 8 | 16 | 9 | The shared manipular core is one of the clearest page-34 rows. | needs-source-check |
| Triarii | Heavy spearmen armour elite | elite | `maximum of one Triarii for each 4 Hastati and/or Principes` | ? | ? | ? | Preserve the row explicitly because the page attaches a structural quota note to it. | needs-source-check |
| Velites | Light infantry javelin | ordinary | `upgrade to elite (max 4) +1` | 2 | 8 | 4 | The row is clearly visible in the upper and lower body blocks. | needs-source-check |
| Latin auxiliaries | Medium swordsmen elite / Medium swordsmen / Javelinmen / Light infantry javelin / Light infantry sling | mixed | grouped ally contingent | ? | ? | ? | The Latin auxiliary block is visible above the main header and should remain grouped until the page image is checked. | needs-source-check |
| Newly recruited legions | Heavy swordsmen impact mediocre / Heavy spearmen armour / Light infantry javelin | mixed | `replace some Hastati and Principes`; `replace some Triarii`; `replace some Velites` | ? | ? | `7 / 10 / ?` | Preserve as a later restructuring block instead of flattening the substitutions. | needs-source-check |
| Anti-elephant carts | War wagon with blades | special | `from 279 BC` | ? | ? | ? | The anti-elephant countermeasure row is clearly visible and rules-bearing. | needs-source-check |
| Flamed pigs | Scythed chariot | special | `see notes`; `from 279 BC` | ? | ? | ? | Preserve as a special anti-elephant note rather than over-normalizing it. | needs-source-check |
| Auxiliary troops | Light cavalry javelin / Medium swordsmen elite / Medium swordsmen / Javelinmen / Elephant mediocre / Light infantry bow elite / Light infantry sling | mixed | grouped auxiliary block; `only from 202 BC` on the elephant line | ? | ? | `8 / 6 / 7 / ? / 4 / 4` | The right-column auxiliary families are readable but still need page-image confirmation before being split further. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | ? | 0 | 1 | 10 | The support row is clearly visible. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | 0 | 1 | 6 | The support row is readable and locally stable. | needs-source-check |

Allies:
- `Numidian allies (List #56 Numidian)`.
- `Aetolian allies (List #61 Hellenistic Greek)`.
- `Pergamene allies (List #73 Pergamon)`.
- `Iberian allies (List #90 Ancient Spanish)`.
- `Samnite allies (List #47 Italic Tribes)` in `340 BC`.

Notes and restrictions:
- Strategists visible in the header are `Scipio Africanus (210-202 BC)` and `Marius (107-105 BC)`.
- A historical legion is stated to be organized with `4` units of `Hastati-Principes`, `2` units of `Velites`, and `1` unit of `Triarii`.
- Against `Pyrrhus`, the Romans used anti-elephant carts with blades and hooks, and `flaming pigs` are counted as mediocre quality except against elephants, who fight with zero combat factor against them.

Open verification:
- Reconstruct the right-column auxiliary block before splitting the grouped horsemen, infantry, elephant, and missile lines more aggressively.
- Confirm the exact points and bounds for `Triarii`, `Anti-elephant carts`, and `Flamed pigs`, which remain partly blurred in the OCR slice.

### List 54 - Early Carthaginian

Source: `ArmyLists1-82.pdf` p.35; `merged.pdf` p.35 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `568 - 275 BC`
Region / classification: `Classical Period`, `Carthage and Africa`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical context on `merged.pdf` page `35`, but the page is strongly interleaved with the later `Carthaginian` list.
- The most reliable early-list structures are the early chariot/noble-heavy core, the date-gated campanian/mercenary additions, and the visible early ally hooks.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Beginning chariots | Heavy chariot impact | ordinary | `upgrade to elite +2` | 0 | 4 | ? | The early chariot row is clearly visible but points remain degraded in the OCR. | needs-source-check |
| Horsemen | Medium cavalry | ordinary | `downgrade to mediocre -2` | 0 | 2 | 7 | One of the clearest mounted rows in the early Carthaginian block. | needs-source-check |
| Campanians (after 410 BC) | Medium cavalry / Heavy cavalry | ordinary | heavy profile `max 2` | 0 | 4 | `7 / ?` | Preserve as a date-gated mercenary cavalry family. | needs-source-check |
| Spearmen armour elite | Heavy spearmen armour elite | elite | ? | ? | ? | 12 | A locally stable elite infantry line in the left column. | needs-source-check |
| Spearmen | Heavy spearmen | ordinary | `downgrade to mediocre -2` | 2 | 6 | 8 | The core spearmen row is readable enough to preserve. | needs-source-check |
| Mercenaries (after 410 BC) | Medium swordsmen impact / Medium swordsmen impetuous / Heavy swordsmen impetuous | ordinary | grouped later mercenary family | 0 | `4 / 6 / 2` | `7 / 6 / 8` | OCR keeps these later mercenaries together, but the row boundaries still need the page image. | needs-source-check |
| Moors and Spanish | Light infantry javelin | ordinary | `upgrade to elite +1` | 2 | 4 | 4 | One of the clearer light-infantry support rows in the early block. | needs-source-check |
| Balearic slingers | Light infantry sling elite | elite | ? | 0 | 2 | ? | The elite slinger row is visible but still partially blurred. | needs-source-check |

Allies:
- `Libyan allies (List #12 Libyan)` before `500 BC`.
- `Numidian allies (List #56 Numidian)` after `310 BC`.
- `Sicilian allies (List #60 Classical Greek)`.

Notes and restrictions:
- The visible `Only one commander can be included in the Sacred Band unit` note should remain attached to the early Carthaginian elite core until the page image confirms the exact row binding.

Open verification:
- Reconstruct the interleaved early/late Carthaginian columns before splitting the early elite and mercenary families more aggressively.
- Confirm the exact points and bounds for the beginning chariots and the Sacred Band-linked elite infantry row.

### List 55 - Carthaginian

Source: `ArmyLists1-82.pdf` p.35; `merged.pdf` p.35 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `275 - 146 BC`
Region / classification: `Classical Period`, `Carthage and Africa`
Command value: `+5`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, strategist block, and the opening Punic Wars historical paragraph on `merged.pdf` page `35`.
- The page is multi-column and still partly interleaved with `Early Carthaginian`, but several key cavalry, African infantry, warrior, and support blocks are readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Punic, Gallic or Spanish cavalry | Medium cavalry / Heavy cavalry | ordinary | heavy profile `max 2`; `upgrade to elite +2` | 0 | 6 | `7 / 9` | The opening cavalry family is one of the clearest page-35 rows. | needs-source-check |
| Numidians or Spanish | Light cavalry javelin | ordinary | `upgrade to elite (max 2)` | 2 | 6 | 6 | A locally stable skirmisher-cavalry row. | needs-source-check |
| Elephant mediocre | Elephant mediocre | mediocre | ? | 0 | 3 | 10 | The Punic-wars elephant row is readable and distinct from the earlier elite-elephant material. | needs-source-check |
| African spearmen | Heavy spearmen | ordinary | ? | 2 | 4 | 8 | One of the clearest formed infantry rows in the right column. | needs-source-check |
| Heavy spearmen / African warriors | Heavy spearmen / Medium swordsmen impetuous | ordinary | grouped infantry block | 0 | `4 / 3` | `? / 6` | Preserve as a grouped infantry family until the columns are checked directly. | needs-source-check |
| Gallic warriors | Medium swordsmen impetuous / Heavy swordsmen impetuous | ordinary | `except in Spain` visible on the row | 0 | 6 | `6 / 8` | The Gallic warrior family is readable enough to preserve grouped. | needs-source-check |
| Ligurians | Medium swordsmen / Javelinmen | ordinary | grouped Ligurian block | 0 | 3 | `6 / 7` | The line is clear enough to keep, but row boundaries still need visual confirmation. | needs-source-check |
| Militia (only in Africa) | Medium spearmen mediocre | mediocre | `only in Africa` | 0 | 6 | 5 | A clear rules-bearing territorial restriction. | needs-source-check |
| Balearic slingers | Light infantry sling elite | elite | ? | 0 | 4 | 5 | One of the clearest missile rows in the page-35 block. | needs-source-check |
| Numidians, Libyans or Spanish | Light infantry javelin | ordinary | `upgrade to elite +1` | 2 | 6 | 4 | The grouped light-infantry row is readable enough to preserve. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | ? | 0 | 1 | 10 | The support row is clearly visible. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | 0 | 1 | 6 | The support row is readable and locally stable. | needs-source-check |

Notes and restrictions:
- Strategist visible in the header is `Hannibal (221-202 BC)`.
- The page clearly frames this list as the Punic Wars Carthaginian army and links it to the rivalry with Rome over Mediterranean control.

Open verification:
- Reconstruct the multi-column Early-Carthaginian/Carthaginian page before splitting the grouped warrior and infantry families more aggressively.
- Confirm the exact row bindings around the African infantry, Gallic warriors, and Ligurian blocks, which still overlap adjacent column text.

### List 56 - Numidian

Source: `ArmyLists1-82.pdf` p.36; `merged.pdf` p.36 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `310 BC - 25 AD`
Region / classification: `Classical Period`, `Carthage and Africa`
Command value: `+3`, `+4 with Labienus in 46 BC`
Terrain: `Plain, Mountain, Steppe`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, split command value, and the opening historical paragraph on `merged.pdf` page `36`.
- The page is column-dense and includes several date-gated sub-period hooks for Spain, Hannibal in Italy, Hannibal in Africa, Juba I, Bogud, Labienus, and Juba II.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Numidian nobles | Medium cavalry javelin | ordinary | `upgrade to elite (max 4) +2` | 0 | 8 | 8 | The core noble cavalry row is one of the clearest on the page. | needs-source-check |
| African spearmen replacement | Heavy spearmen armour elite | elite | `replace all African spearmen` | 2 | 4 | ? | The replacement hook is clearly visible, but the points cell still needs confirmation. | needs-source-check |
| Light cavalry | Light cavalry javelin | ordinary | ? | ? | ? | ? | The basic Numidian light-cavalry line is visible and should remain separate from the noble row. | needs-source-check |
| Javelinmen | Javelinmen | ordinary | ? | 2 | 16 | 7 | One of the clearest infantry-support rows in the main block. | needs-source-check |
| Campanians and Italians | Heavy swordsmen impact | ordinary | `add armour (all or none) +2` | ? | ? | 9 | The allied infantry block is readable enough to preserve as a local Numidian sub-period hook. | needs-source-check |
| Elephant mediocre | Elephant mediocre | mediocre | ? | 0 | 2 | 10 | The elephant row is distinct and clearly tied to the Hannibal-era material. | needs-source-check |
| Light infantry bow / sling | Light infantry bow / Light infantry sling | ordinary | grouped missile tail | 0 | 2 | 4 | The tail missile rows are readable enough to preserve grouped. | needs-source-check |
| Bruttian veterans | Roman-style trained infantry | elite / ordinary | `before 55 BC` | ? | ? | `8 / ?` | Preserve as a date-gated infantry block until the page image confirms exact row attachment. | needs-source-check |
| Moors | Light infantry bow | ordinary | ? | ? | ? | ? | The row label is visible but the bounds remain blurred. | needs-source-check |
| Imitation legionaries | Heavy swordsmen impact | ordinary | `from 55 BC - Later period`; `downgrade to mediocre -2` | 2 | 8 | 9 | The later-period Romanizing infantry row is readable enough to preserve structurally. | needs-source-check |
| Gallic and Spanish guardsmen | Medium cavalry elite | elite | `Juba I from 55 to 46 BC` | ? | ? | ? | Preserve as a date-gated elite mounted block. | needs-source-check |
| Gallic and German horsemen | Medium cavalry | ordinary | `Labienus army at Ruspina in 46 BC`; `upgrade to elite +2` | 4 | 8 | 7 | The later mounted row is one of the clearest end-of-page entries. | needs-source-check |

Allies:
- `Iberian allies (List #90 Ancient Spanish)` from `235 to 201 BC in Spain and Africa`.
- `Bruttian, Lucanian, Apulian or Campanian allies (List #51 Campanian, Lucanian, Apulian and Bruttian)` for `Hannibal in Italy from 216 to 203 BC`.
- `Numidian allies (List #56 Numidian)` until `200 BC`.
- `Roman allies (List #85 Early Imperial Roman)` for `Juba II from 3 to 6 AD`.

Notes and restrictions:
- `Only one Elephant. No artillery, no impetuous Scutarii, no Numidian or Iberian allies.` is a clear Hannibal-in-Italy restriction block and should remain explicit.
- `Only one commander can be included in a mercenary hoplite unit before 235 BC.` remains a visible early-period note on the page.
- `Bogud in 47 BC` and `Labienus army at Ruspina in 46 BC` are distinct late-period hooks that should remain source-linked until the page image is checked.

Open verification:
- Reconstruct the dense sub-period columns before splitting the Spain/Africa, Hannibal-in-Italy, Hannibal-in-Africa, Juba, Bogud, Labienus, and Juba II rows more aggressively.
- Confirm the exact points and unit bounds for `African spearmen replacement`, `Bruttian veterans`, `Gallic and Spanish guardsmen`, and the early mercenary-hoplite note.

### List 57 - Saitic Egyptian

Source: `ArmyLists1-82.pdf` p.37; `merged.pdf` p.37 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `660 - 335 BC`
Region / classification: `Classical Period`, `Egyptian`
Command value: `+4`
Terrain: `Plain, Desert Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `37`.
- The page is interleaved with `List 58 - Kyrenean Greek`, but the Saitic side still preserves several clear Egyptian core rows plus visible Syrian, Libyan, and Greek ally hooks.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Horsemen | Medium cavalry mediocre | mediocre | ? | 2 | 6 | 5 | One of the clearest Saitic mounted rows in the left column. | needs-source-check |
| Egyptian guardsmen | Medium swordsmen elite | elite | ? | 0 | 2 | 9 | The guardsmen row label and elite sword profile are readable, but should still be checked against the page image. | needs-source-check |
| Egyptian Merifat | Heavy spearmen mediocre | mediocre | ? | 4 | 16 | 6 | The main formed-infantry row is readable and locally stable. | needs-source-check |
| Greek mercenaries | Heavy spearmen | ordinary | `add armour (before 460 BC) +2`; `upgrade to elite (max 1) +2` | 0 | 6 | 8 | The mercenary hoplite block is one of the clearest Saitic rows. | needs-source-check |
| Light infantry bow | Light infantry bow | ordinary | ? | 0 | 4 | 4 | The light-bow tail row is visible near the end of the Saitic block. | needs-source-check |

Allies:
- `Syrian allies (List #9 Assyrian Empire and Babylonid)` before `650 BC`.
- `Libyan allies (List #12 Libyan)` after `360 BC`.
- `Greek allies (List #58 Kyrenean Greek)` after `570 BC`.

Notes and restrictions:
- `Only 26th dynasty (664 - 525 BC)` is visible as a period restriction block on the page and should remain explicit until the image confirms its exact attachment.
- The page also shows `Libyan chariots` and `Carthaginian allies in 322 BC`, but those lines remain too interleaved with the Kyrenean side to normalize further yet.

Open verification:
- Reconstruct the mixed Saitic/Kyrenean columns before splitting the `Libyan chariots`, `Egyptian archers`, `Greek cavalry`, and later tail rows more aggressively.
- Confirm the exact troop type for `Egyptian guardsmen` and the exact binding of the `Only 26th dynasty (664 - 525 BC)` restriction.

### List 58 - Kyrenean Greek

Source: `ArmyLists1-82.pdf` p.37; `merged.pdf` p.37 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `630 - 96 BC`
Region / classification: `Classical Period`, `Greek`
Command value: `+3`
Terrain: `Plain, Desert Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `37`.
- The page is interleaved with `List 57 - Saitic Egyptian`, but the Kyrenean side still preserves several clear hoplite, peltast, cavalry, and later Macedonian-garrison hooks.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Horsemen | Medium cavalry | ordinary | `downgrade to mediocre -2` | 0 | 2 | 7 | The opening mounted row is one of the clearest entries in the Kyrenean column. | needs-source-check |
| Hoplites and mercenaries | Heavy spearmen | ordinary | `downgrade to mediocre (max 8) -2`; `add armour (before 460 BC) +2` | 8 | 16 | 8 | The main formed-infantry row is readable enough to preserve with its two visible modifiers. | needs-source-check |
| Greek peltasts | Javelinmen | ordinary | ? | 0 | ? | ? | The row label and troop type are clear, but the unit bounds remain blurred by column noise. | needs-source-check |
| Libyans | Light infantry javelin / Light infantry bow / Light infantry sling | ordinary | grouped Libyan light-infantry family | 2 | 6 | `? / 4 / ?` | The Libyan tail rows are readable enough to preserve grouped, but still need a page-image check. | needs-source-check |
| Greek cavalry | Medium cavalry / Heavy cavalry | ordinary | grouped cavalry family | 0 | 1 | `7 / 9` | The cavalry tail is visible below the main infantry block. | needs-source-check |
| Macedonian garrison | Pikemen / Thureophoroi | ordinary | `after 321 BC` | ? | ? | ? | The later-period Macedonian occupation block is clearly signposted and should stay grouped for now. | needs-source-check |
| Cretan archers | Light infantry bow elite | elite | ? | 0 | 2 | 5 | One of the clearest late support rows in the Kyrenean column. | needs-source-check |

Allies:
- `Carthaginian allies (List #54 Early Carthaginian)` in `322 BC`.

Notes and restrictions:
- `After 321 BC`, `replace all horsemen` by `Heavy cavalry impact 10 all`, with `upgrade to elite +2`, remains visible as a later-period restructuring hook and should stay explicit.
- The page mixes several Libyan and Macedonian-garrison rows into the Kyrenean tail, so those entries should remain grouped until the image confirms exact bounds.

Open verification:
- Reconstruct the mixed Saitic/Kyrenean columns before splitting the `Libyan chariots`, `Greek cavalry`, and `Macedonian garrison` tail rows more aggressively.
- Confirm the exact points and bounds for `Greek peltasts`, the Libyan light-infantry family, and the `After 321 BC` cavalry replacement note.

### List 59 - Meroitic Kushite

Source: `ArmyLists1-82.pdf` p.38; `merged.pdf` p.38 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `590 BC - 350 AD`
Region / classification: `Greece and Danube`, `Kushite`
Command value: `+3`
Terrain: `Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `38`.
- The lower part of the page begins to interleave with `List 60 - Classical Greek`, but the Kushite side still preserves several stable mounted, elephant, camelry, archer, and tribal infantry rows.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Meroitic horsemen | Medium cavalry / Heavy cavalry | ordinary | `upgrade to elite (max 3)` | ? | ? | `7 / 9` | The opening mounted family is one of the clearest row groups on the page. | needs-source-check |
| Light cavalry javelin | Light cavalry javelin | ordinary | `only from 300 BC` | 0 | 2 | 6 | The date-gated light-cavalry row is distinct and locally stable. | needs-source-check |
| Elephant mediocre | Elephant mediocre | mediocre | `only from 300 BC` | ? | ? | ? | The elephant row is visible immediately under the same date hook, but its bounds remain blurred. | needs-source-check |
| Medium camelry / camelry bow | Medium camelry / Medium camelry bow mediocre | mixed | grouped camelry family | ? | ? | ? | Preserve as a grouped family until the page image confirms the exact split. | needs-source-check |
| Meroitic archers | Archer | ordinary | `upgrade to elite (max 4)` | 4 | 12 | ? | The row label, elite option, and `4-12` bound are readable, but the points cell remains unstable. | needs-source-check |
| Tribal spearmen | Heavy spearmen mediocre / Medium spearmen | mixed | grouped tribal spearmen family | 4 | 24 | `6 / 7` | The paired spear rows are clear enough to preserve grouped. | needs-source-check |
| Tribal swordsmen or axemen | Medium swordsmen / Heavy swordsmen mediocre | mixed | grouped tribal swordsmen family | ? | ? | `6 / ?` | The row family is readable, but the heavy-swordsmen points and bounds still need a page check. | needs-source-check |
| Light infantry bow | Light infantry bow | ordinary | ? | 0 | 4 | 4 | The tail missile row is clear and distinct. | needs-source-check |

Allies:
- `Blemmye allies (List #112 Blemmyes and Nobatae)` after `300 BC`.

Notes and restrictions:
- `Only from 300 BC` visibly governs the later `Light cavalry javelin` and elephant material and should remain explicit until the page image confirms the full block.
- The lower tail is already contaminated by the opening `Classical Greek` header and notes, so later Kushite rows should stay grouped rather than over-split.

Open verification:
- Confirm the exact unit bounds for the mounted family, elephants, and camelry rows in the upper body block.
- Confirm the exact points cell for `Meroitic archers` and the heavy-swordsmen half of `Tribal swordsmen or axemen`.

### List 60 - Classical Greek

Source: `ArmyLists1-82.pdf` p.38; `merged.pdf` p.38 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `650 - 275 BC`
Region / classification: `Greece and Danube`, `Greek`
Command value: `+3`, `+4 if Spartan or Theban`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, split command value, strategists, and the opening historical paragraph on `merged.pdf` page `38`.
- The visible strategists are `Brasidas (Spartan 431-422 BC)` and `Epaminondas (Theban 371-362 BC)`.
- The page tail is cropped and interleaved, but the main hoplite, horsemen, peltast, and city-specific replacement hooks are still readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hoplites | Heavy spearmen | ordinary | `add armour (before 460 BC)`; `upgrade to elite (max 2 or 8 if Spartan)` | ? | ? | ? | The core hoplite row is the clearest troop family in the Classical Greek block. | needs-source-check |
| Horsemen | Medium cavalry / Heavy cavalry | ordinary | `downgrade to mediocre` | ? | ? | ? | The mounted family is readable as a grouped row, but the exact points and bounds still need page confirmation. | needs-source-check |
| Thracians | Medium swordsmen / Medium swordsmen 2HW | ordinary | grouped Thracian infantry family | ? | ? | ? | The Thracian pair is visible and should remain grouped until the page image confirms the split. | needs-source-check |
| Peltasts | Javelinmen | ordinary | ? | ? | ? | ? | The core peltast row is clearly named, but the numeric cells are not stable yet. | needs-source-check |
| Light infantry javelin / sling / bow | Light infantry javelin / Light infantry sling / Light infantry bow | ordinary | `upgrade to elite (max 2) if Cretan` | ? | ? | ? | The light-infantry tail is readable enough to preserve grouped under the visible Cretan upgrade note. | needs-source-check |
| Paphlagonians and Thracians | Light cavalry javelin / Light cavalry bow | ordinary | grouped northern light-cavalry family | ? | ? | ? | The grouped mounted tail appears more than once in the city-specific sub-blocks and should stay grouped for now. | needs-source-check |
| Sacred Band | Heavy spearmen elite | elite | `Theban`; `add armour (before 460 BC)` | ? | ? | ? | The Theban elite block is visible at the end of the page and should remain explicit. | needs-source-check |
| Brasidas expedition infantry | Javelinmen / Light infantry javelin / Medium spearmen elite | mixed | `from 431 to 422 BC with Brasidas`; `replace some hoplites` | ? | ? | ? | The Brasidas-specific replacement block is visible, but still too interleaved to split further. | needs-source-check |
| Gallic and Spanish mercenaries from Syracuse | Medium swordsmen impetuous / Heavy swordsmen impetuous | ordinary | `from 369 to 368 BC` | ? | ? | ? | Preserve as a dated mercenary block until the page image confirms the exact row bounds. | needs-source-check |

Notes and restrictions:
- `Spartan` visibly replaces all horsemen with mediocre mounted equivalents; keep that city-specific restructuring explicit until the page image confirms its exact bounds.
- `Theban` visibly replaces all horsemen with a better mounted block and adds the `Sacred Band` elite infantry row.
- The OCR tail is truncated, so numeric cells for most Classical Greek rows should remain unresolved rather than guessed.

Open verification:
- Confirm the exact points, minima, and maxima for the core `Hoplites`, `Horsemen`, `Peltasts`, and `Sacred Band` rows from the page image.
- Reconstruct the Spartan, Brasidas, Syracuse, and Theban sub-blocks before splitting the grouped replacement and mercenary rows more aggressively.

### List 61 - Hellenistic Greek

Source: `ArmyLists1-82.pdf` p.39; `merged.pdf` p.39 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `275 - 146 BC`
Region / classification: `Greece and Danube`, `Greek`
Command value: `+3`, `+4 if Spartan`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, split command value, strategist, and the opening historical summary on `merged.pdf` page `39`.
- The visible strategist is `Philopoemen (Achaean League 222-183 BC)`.
- The page explains that from `275 BC` hoplites were gradually replaced either by phalanxes in the Macedonian style or by `thureophoroi`, and that Greece became a Roman province in `146 BC`.
- This OCR slice also shows ally notes for `Greek allies (List #60 Classical Greek) with a different origin than the commander in chief` and `Roman allies (List #53 Republican Roman) for the city of Elis in 207 BC`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Horsemen | Medium cavalry / Heavy cavalry | ordinary | grouped mounted family | 1 | 3 | `7 / 9` | The opening mounted row is readable enough to preserve, but still sits inside a dense page transition. | needs-source-check |
| Tarentines or Aetolians | Light cavalry javelin | ordinary | ? | 0 | 3 | 6 | One of the clearest light-cavalry support rows in the Hellenistic block. | needs-source-check |
| Thureophoroi | Medium spearmen / Javelinmen | ordinary | grouped thureophoroi block | 6 | 24 | `? / 7` | The row is clear enough to preserve as a grouped replacement-era infantry family. | needs-source-check |
| Hoplites | Heavy spearmen | ordinary | ? | 0 | 4 | 8 | A reduced residual hoplite row remains visible after the transition to phalanxes and thureophoroi. | needs-source-check |
| Light infantry bow / sling / javelin | Light infantry bow / Light infantry sling / Light infantry javelin | ordinary | grouped light-infantry tail | ? | ? | `4 / ? / 4` | The missile tail is readable enough to keep grouped. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | ? | 0 | 1 | 10 | The support row is locally stable in the page-39 body. | needs-source-check |
| Achaean League phalanx block | Heavy cavalry impact / Pikemen / Medium spearmen armour | mixed | `Achaean League`; `replace some horsemen`; `replace some thureophoroi` | ? | ? | `? / ? / 9` | Preserve the Achaean restructure as a grouped block until the page image confirms exact bounds. | needs-source-check |
| Thracian horsemen | Light cavalry javelin | ordinary | ? | 0 | 3 | ? | The attached Thracian mounted support row is readable, but still needs points confirmation. | needs-source-check |
| Illyrians or Thracians | Medium swordsmen / Medium swordsmen 2HW / Medium spearmen | ordinary | grouped allied infantry block | 0 | 2 | `6 / ? / 7` | The allied infantry tail is visible enough to preserve grouped. | needs-source-check |
| Freed slaves | Pikemen mediocre | mediocre | `only in 146 BC` | 0 | 4 | 8 | One of the clearest late emergency rows on the page. | needs-source-check |
| Aetolian restructuring | Light cavalry javelin / Javelinmen | ordinary | `Aetolian`; `replace all horsemen`; `replace at least half thureophoroi` | ? | ? | `? / 7` | The Aetolian sub-block is visible enough to preserve as a grouped replacement note. | needs-source-check |

Open verification:
- Confirm the exact points, minima, and maxima for the core `Horsemen`, `Thureophoroi`, `Hoplites`, and `Achaean League` replacement rows.
- Confirm the exact attachment of the `Greek allies` and `Roman allies for Elis in 207 BC` notes to the Hellenistic Greek body.
- Reconstruct the Spartan, Achaean League, and Aetolian sub-blocks before splitting the grouped replacement rows more aggressively.

### List 62 - Illyrian

Source: `ArmyLists1-82.pdf` p.40; `merged.pdf` p.40 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `500 BC - 10 AD`
Region / classification: `Greece and Danube`, `Illyrian`
Command value: `+3`
Terrain: `Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, strategist, and the opening historical paragraph on `merged.pdf` page `40`.
- The visible strategist is `Bardylis (393-358 BC)`.
- The first body rows on this page show a mounted opening with `Horsemen` as `Light cavalry javelin 6 0-6` and a `Medium cavalry javelin (max 3)` upgrade line, but the rest of the Illyrian body is immediately overrun by the next-page `Thracian` header.
- Targeted OCR re-checks on pages `40-41` do not show a clean Illyrian continuation, only likely bleed-through fragments such as `Illyrian hoplites (before 150 BC)` and `Paionian allies`, so those should remain verification hints rather than structured rows for now.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Horsemen | Light cavalry javelin / Medium cavalry javelin | ordinary | `medium profile max 3` | 0 | 6 | `6 / ?` | The opening mounted row is the only clearly separable Illyrian troop family on page 40 before the Thracian header begins. | needs-source-check |

Open verification:
- Find the true Illyrian continuation anchor before assigning additional troop entries; the current `p.41` follow-up is Thracian continuation, not Illyrian body.
- Confirm the exact points cell for the `Medium cavalry javelin (max 3)` upgrade line.
- Confirm whether the visible `Illyrian hoplites (before 150 BC)` and `Paionian allies` fragments belong to the Illyrian list body or are only cross-column OCR bleed.

### List 63 - Thracian

Source: `ArmyLists1-82.pdf` p.40; `merged.pdf` p.40 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `700 BC - 45 AD`
Region / classification: `Greece and Danube`, `Thracian`
Command value: `+3`
Terrain: `Mountain, Forest for Thracian hill tribes`; `Plain, Forest for Thracian lowland tribes and Getae`

Notes and restrictions:
- OCR clearly exposes the list header, date range, split terrain guidance, command value, and the opening historical paragraph on `merged.pdf` page `40`.
- The text explicitly distinguishes plains tribes with numerous horsemen, mountain tribes with fierce infantry, and the `Getae` north of the Danube with many horse archers.
- The visible historical block also preserves the `Odrysian Kingdom` note and the later Macedonian and Roman domination sequence.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warriors | Medium swordsmen / Medium spearmen | ordinary | `upgrade to elite (max 6)`; spearmen profile `max 6` | 8 | 24 | `6 / 7` | The opening warrior family is one of the clearest rows in the Thracian block. | needs-source-check |
| Nobles | Heavy cavalry | ordinary | `upgrade to elite` | ? | ? | 9 | The nobles row is readable, but the exact bounds for the elite option still need confirmation. | needs-source-check |
| Javelinmen | Light infantry javelin | ordinary | ? | ? | ? | 4 | The light-javelin row is clearly present in the early body. | needs-source-check |
| Romphaia warriors | Medium swordsmen 2HW | ordinary | `after 350 BC, with romphaia` | ? | ? | ? | The post-350 two-handed variant is explicitly visible as a later replacement hook. | needs-source-check |
| Light infantry bow / sling | Light infantry bow / Light infantry sling | ordinary | grouped missile tail | ? | ? | 4 | The missile tail is readable enough to preserve grouped. | needs-source-check |
| Paionian allies | Light cavalry javelin / Warriors / Javelinmen | ordinary | grouped ally block | 0 | 4 | `6 / ? / 4` | The Paionian support block is visible enough to preserve grouped rather than over-split. | needs-source-check |
| Thracian hill tribes | Light infantry bow / Light infantry sling | ordinary | hill-tribe tail block | ? | ? | 4 | The hill-tribe missile rows are readable, but still need exact bounds. | needs-source-check |
| Thracian lowland tribes | Medium cavalry / Light cavalry bow / Light cavalry javelin | ordinary | grouped lowland mounted family | ? | ? | `7 / ? / 6` | The lowland mounted family is visible at the end of the page and should stay grouped for now. | needs-source-check |
| Getae | Medium cavalry bow / Light cavalry bow / Light cavalry javelin | ordinary | grouped Getae mounted family | 0 | `4 / 8 / 4` | The page-41 continuation makes the Getae horse-archer-heavy branch readable enough to preserve grouped. | needs-source-check |
| Greek mercenaries | Heavy spearmen | ordinary | `if no Greek allies`; `from 400 to 357 BC` | 0 | 2 | 8 | The page-41 continuation exposes this conditional infantry support row clearly enough to preserve. | needs-source-check |
| Odrysian client of Rome | Horsemen equipped as Romans / imitation legionaries | mixed | `25 BC to 46 AD`; `replace some warriors` | 0 | `2 / 6` | `9 / 7 / 9` | Preserve the late Romanizing branch as a grouped replacement block until the page image confirms exact unit bindings. | needs-source-check |
| Bastarnae allies | Cavalry / Warriors | ordinary | `for Getae in 62-60 BC`; warrior `upgrade to elite (max 4) +2` visible | 0 | `2 / 4` | `? / 6` | The page-41 continuation is clear enough to preserve the dated Bastarnae ally block grouped. | needs-source-check |

Allies:
- `Paionian allies (see list above)`.
- `Syracusan allies (List #50 Syracusan)` in `385 BC`.
- `Bastarnae allies (see list below)` from `62 to 60 BC` for `Getae`.
- `Greek mercenaries if no Greek allies` from `400 to 357 BC`.
- `Thracian lowland tribe allies (List #63 Thracian)` for hill tribes.
- `Thracian hill tribe allies (List #63 Thracian)` for lowland tribes.
- `Roman allies (List #85 Early Imperial Roman)` for `Odrysian client of Rome (25 BC to 46 AD)`.

Notes and restrictions:
- `After 350 BC, replace warriors with romphaia (all the same type)` is a visible restructuring block and should stay explicit.
- `Choose one option: hill tribes, lowland tribes, Getae, Odrysian Kingdom or Odrysian client of Rome.` is now visible in the page-41 continuation and should remain explicit as the top-level branch selector.
- The page shows separate hill-tribe and lowland-tribe sub-branches; keep their troop tails grouped until the page image confirms exact row boundaries.

Open verification:
- Confirm the exact points and bounds for `Nobles`, the `romphaia` replacement row, and the hill/lowland sub-branch tails.
- Reconstruct the Paionian, Getae, Odrysian-client, hill-tribe, and lowland-tribe blocks before splitting their grouped support rows more aggressively.

### List 64 - Achaemenid Persian

Source: `ArmyLists1-82.pdf` p.41; `merged.pdf` p.41 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `550 - 420 BC`
Region / classification: `Asia Minor`, `Persian`
Command value: `+5`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `41`.
- The visible history block still preserves Cyrus, Darius, Xerxes, Marathon, Thermopylae, Salamis, and Plataea as the main narrative anchors for the empire.
- The troop body becomes denser toward the lower half of the page, but several core mounted and mixed-unit Persian families are still readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Persian Guardsmen | Heavy cavalry bow elite | elite | ? | ? | ? | ? | The header row for the elite mounted guard family is clearly visible, but the numeric cells remain unstable. | needs-source-check |
| Persians and Medes | Medium cavalry bow / Heavy cavalry bow | ordinary | heavy profile `max 4`; `downgrade to mediocre -2` | 4 | 8 | 9 | The core Persian mounted family is one of the clearest rows in the upper body. | needs-source-check |
| Arachosians and Paropamisadae | Light cavalry javelin | ordinary | ? | ? | ? | ? | The eastern auxiliary row is visible, but still needs its bounds confirmed. | needs-source-check |
| Scythians and Bactrians | Light cavalry bow | ordinary | `upgrade to elite (max 2 if Bactrian) +1` | 0 | 6 | 6 | One of the clearest auxiliary mounted rows on the page. | needs-source-check |
| Bedouins | Light camelry bow mediocre / Medium camelry bow mediocre | mediocre | grouped camelry family | ? | ? | 5 | The camelry block is readable enough to preserve grouped. | needs-source-check |
| Immortals, mixed units | Medium swordsmen elite / Bowmen elite | elite | mixed unit family | 0 | 4 | 10 | The elite mixed infantry block is clearly signposted in the lower body. | needs-source-check |
| Sparabara, mixed units | Medium swordsmen / Bowmen | ordinary | mixed unit family | 2 | 8 | 8 | The main sparabara block is visible and locally stable. | needs-source-check |
| Assyrians and Chaldeans | Medium spearmen mediocre / Heavy spearmen mediocre | mediocre | heavy profile `add support +1` | 0 | 2 | `5 / 6` | The Mesopotamian infantry tail is readable enough to preserve grouped. | needs-source-check |
| Lydian or Ionian hoplites | Heavy spearmen mediocre | mediocre | `add armour (all or none) +2` | 0 | 2 | ? | The western hoplite row is readable in the page-42 pre-Lydian tail. | needs-source-check |
| Armenians or Thracians | Medium swordsmen / Javelinmen | ordinary | grouped auxiliary infantry family | 0 | 2 | ? | The row is visible, but the exact points cells are unstable in the page transition. | needs-source-check |
| Parthians / Scythians / Arabs | Bowmen / Light infantry bow | ordinary | grouped eastern missile family | ? | ? | ? | Preserve the page-42 eastern missile auxiliaries grouped rather than forcing row breaks. | needs-source-check |
| Mysians / Lydians / Libyans / Colchians | Javelinmen / Light infantry javelin | ordinary | grouped western and peripheral skirmisher family | 0 | 4 | 4 | The tail skirmisher rows are readable enough to preserve grouped. | needs-source-check |
| Egyptian or Phoenician marines | Medium swordsmen | ordinary | `after 525 BC` | ? | ? | ? | The page-42 continuation makes the later marine hook visible, but not its full numeric cells. | needs-source-check |

Allies:
- `Greek allies (see list above)`.
- `Medes allies (List #28 Medes)` in `550 BC`.
- `Saka allies (List #76 Scythian)` in `530 BC`.

Notes and restrictions:
- The current OCR slice strongly favors the mounted and mixed-unit core; later tail rows and some numeric cells should remain unresolved until the page image is checked.
- `After 525 BC` is visible as a late-period marine hook and should remain explicit.

Open verification:
- Confirm the exact points, minima, and maxima for `Persian Guardsmen`, `Arachosians and Paropamisadae`, and the `Bedouins` camelry family.
- Confirm the exact points and row boundaries for `Lydian or Ionian hoplites`, `Armenians or Thracians`, and `Egyptian or Phoenician marines` in the page-42 transition.
- Reconstruct the lower page tail before splitting the `Immortals`, `Sparabara`, `Assyrians and Chaldeans`, and western auxiliary families more aggressively.

### List 65 - Lydian

Source: `ArmyLists1-82.pdf` p.42; `merged.pdf` p.42 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `687 - 546 BC`
Region / classification: `Asia Minor`, `Lydian`
Command value: `+3`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `42`.
- The visible history block still preserves the rise of Lydia after Cimmerian invasions, the reign of `Croesus`, and the Persian conquest by `Cyrus` in `546 BC`.
- The page is column-dense, but several core mounted, chariot, and infantry families are readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lydian nobles (all the same type) | Heavy cavalry impetuous / Heavy cavalry impact | ordinary | impetuous profile `downgrade to mediocre`; impact profile `upgrade to elite (max 4) +2` | ? | ? | `9 / 10` | The noble mounted family is one of the clearest rows in the page-42 body. | needs-source-check |
| Lydian chariots | Light chariot | ordinary | `downgrade to mediocre` | 0 | 2 | 7 | The local Lydian chariot row is distinct and readable. | needs-source-check |
| Babylonian chariots with 4 horses | Heavy chariot impact | ordinary | `before 484 BC`; `upgrade to elite +2` | 0 | 2 | 11 | The early heavy-chariot row is clearly visible with its date gate. | needs-source-check |
| Phrygians or Paphlagonians | Light cavalry javelin | ordinary | ? | ? | ? | ? | The supporting light-cavalry row is readable, but the numeric cells remain unstable in the mixed columns. | needs-source-check |
| Scythians | Light cavalry bow | ordinary | ? | ? | ? | ? | The Scythian mounted support row is visible in the same body cluster. | needs-source-check |
| Lydian spearmen | Heavy spearmen mediocre / Medium spearmen | mixed | `from 465 to 449 BC replace some Sparabara with Lydian spearmen` | 4 | 12 | `6 / 7` | The spear block is one of the clearest infantry families on the page. | needs-source-check |
| Crescent shield archers | Bowmen pavise | ordinary | `from 465 to 449 BC`; `0-4` visible | 0 | 4 | ? | The named archer row is readable enough to preserve, but the points cell still needs confirmation. | needs-source-check |
| Karian or Ionian mercenaries | Heavy spearmen | ordinary | `add armour (all or none) +2` | 0 | 4 | 8 | The mercenary hoplite row is locally stable. | needs-source-check |
| Takabara peltasts | Medium swordsmen / Javelinmen / Light infantry javelin | ordinary | `after 449 BC replace some Sparabara with`; `add support +1` visible on one row | 2 | 4 | `? / ? / 4` | Preserve the later peltast restructuring as a grouped infantry block until the page image confirms exact row splits. | needs-source-check |
| Bithynians or Thracians | Medium swordsmen | ordinary | ? | 0 | 2 | 6 | The late auxiliary infantry row is readable enough to preserve. | needs-source-check |

Allies:
- `Greek allies (only in 479 BC)`.
- `Asiatic Greek allies (List #60 Classical Greek)`.

Notes and restrictions:
- `After 449 BC`, `replace some Sparabara with Takabara peltasts` is visible and should remain explicit as a later restructuring hook.
- The lower page tail already overlaps the ally block and late auxiliaries, so several numeric cells should remain unresolved rather than guessed.

Open verification:
- Confirm the exact points and bounds for `Phrygians or Paphlagonians`, `Scythians`, and `Crescent shield archers`.
- Reconstruct the mid-page `465-449 BC` and `after 449 BC` restructuring blocks before splitting the grouped `Takabara peltasts` family more aggressively.

### List 66 - Lycian

Source: `ArmyLists1-82.pdf` p.43; `merged.pdf` p.43 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `546 - 300 BC`
Region / classification: `Asia Minor`, `Lycian`
Command value: `+3`
Terrain: `Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `43`.
- The visible history block preserves Lycia as a small south-Anatolian state, its subjection to Persia under `Cyrus the Great`, service in `Xerxes`' Greek campaign, and later subjugation by the Seleucids.
- The body is dense but still preserves several clear Lycian noble, chariot, warrior, and mercenary families.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Noble chariots | Light chariot | ordinary | `before 500 BC`; `max 4`; `upgrade to elite (max 4) +2` | ? | ? | 7 | The early noble-chariot row is one of the clearest lines in the page-43 body. | needs-source-check |
| Noble horsemen | Medium cavalry / Heavy cavalry | ordinary | heavy profile `max 2`; `upgrade to elite +1 / +2` | 2 | 6 | `? / 9` | The mounted noble family is readable enough to preserve grouped, but one points cell is still unstable. | needs-source-check |
| Light cavalry javelin | Light cavalry javelin | ordinary | ? | 0 | 2 | 6 | A clear supporting mounted row in the main Lycian block. | needs-source-check |
| Warriors | Medium swordsmen | ordinary | ? | 6 | 24 | 6 | The core warrior line is stable in the OCR slice. | needs-source-check |
| Warriors with drepanon | Medium swordsmen 2HW | ordinary | `after 265 BC`; `replace some warriors by` | 0 | ? | 7 | The later two-handed variant is visible as a restructuring hook, but its bounds still need confirmation. | needs-source-check |
| Hoplites replacement | Heavy spearmen mediocre / Medium spearmen | mixed | `replace some warriors with hoplites` | 0 | 8 | `6 / ?` | The page shows a hoplite-era replacement block, but row splitting remains unstable. | needs-source-check |
| Mercenary hoplites | Heavy spearmen | ordinary | `add armour (all or none) +2` | 0 | 4 | 8 | One of the clearest mercenary lines on the page. | needs-source-check |
| Mercenary peltasts | Javelinmen | ordinary | ? | 0 | 2 | 7 | The peltast support row is readable and locally stable. | needs-source-check |
| Javelinmen / light infantry javelin / sling | Javelinmen / Light infantry javelin / Light infantry sling | ordinary | grouped skirmisher tail | 0 | `6 / 4 / 2` | The lower missile tail is readable enough to preserve grouped. | needs-source-check |
| Galatians | Heavy swordsmen impetuous | ordinary | `in 278 BC`; `upgrade to elite +2` | 0 | 2 | 8 | The Galatian intervention row is clearly visible. | needs-source-check |

Allies:
- `Asiatic Greek allies (List #60 Classical Greek or #61 Hellenistic Greek)` from `280 to 253 BC`.
- `Galatian allies (List #72 Galatian)` in `278 BC`.

Notes and restrictions:
- `After 265 BC`, `replace some warriors by thureophoroi 7 4-16` is visible, but the exact row break is not yet stable enough to normalize separately.
- The central body overlaps later Bithynian and Persian headers, so grouped handling is still preferable for the hoplite/thureophoroi transition rows.

Open verification:
- Confirm the exact points and bounds for `Noble horsemen`, the hoplite replacement block, and the visible `thureophoroi 7 4-16` transition.
- Reconstruct the mid-page `278 BC` and `after 265 BC` restructuring rows before splitting the grouped replacement families more aggressively.

### List 67 - Bithynian

Source: `ArmyLists1-82.pdf` p.43; `merged.pdf` p.43 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `327 - 74 BC`
Region / classification: `Asia Minor`, `Bithynian`
Command value: `+4`
Terrain: `Forest, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `43`.
- The visible history block preserves the Thracian origin of the Bithynians, their subjection to Lydia and then Persia, their restored independence under `Nicomedes I (278-243 BC)`, and the bequest of the kingdom to Rome in `74 BC`.
- The current OCR slice also hints at an opening mounted core with `Bithynian cavalry`, `Bithynians and Paphlagonians`, and `Persian cavalry (before 335 BC)`, but the row boundaries are still too unstable to normalize safely.

Open verification:
- Capture the next page(s) of the Bithynian list before assigning troop entries.
- Confirm whether the visible `Bithynian cavalry`, `Bithynians and Paphlagonians`, and `Persian cavalry (before 335 BC)` fragments belong wholly to the Bithynian body.

### List 68 - Later Achaemenid Persian

Source: `ArmyLists1-82.pdf` p.43; `merged.pdf` p.43 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `420 - 329 BC`
Region / classification: `Asia Minor`, `Persian`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `43`.
- The visible history block explains this as the late Achaemenid army after `Immortals` and `Sparabara` had ceased to be the backbone, when mounted archery was declining among Persian cavalry and Greek mercenaries were in heavy demand.
- The same paragraph preserves the late-imperial narrative through `Alexander`'s invasion in `334 BC`, the defeats at `Granicus`, `Issus`, and `Gaugamela`, the capture of `Babylon` in `331 BC`, and the fall of `Darius III`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Elephant | Elephant | ordinary | `Darius III at Gaugameles in 331 BC` | 0 | 1 | 13 | This elephant belongs to the `Darius III at Gaugameles in 331 BC` bold block. | needs-source-check |
| Guard cavalry | Heavy cavalry elite | elite | `Darius III at Gaugameles in 331 BC`; `add impact in 331 BC`; `compulsory only if Darius III is the general in 331 BC` | 0 | 1 | 12 | Outside the Darius-III-in-331 case this remains a normal `0-1` choice, not a compulsory global list row. | needs-source-check |
| Persian, Median, Indian, Armenian and Cappadocian horsemen | Medium cavalry / Heavy cavalry | ordinary | `downgrade to mediocre -2` | 4 | 16 | `7 / 9` | User-corrected points and `4-16` bound; the downgrade applies against the chosen mounted profile. | needs-source-check |
| Other horsemen with bow | Medium cavalry bow / Heavy cavalry bow | ordinary | `downgrade to mediocre -2` | 0 | 4 | `9 / 11` | User-corrected points; keep the grouped bow-cavalry family. | needs-source-check |
| Paphlagonians | Light cavalry javelin | ordinary | ? | 2 | 4 | 6 | This row sits between `Other horsemen with bow` and `Bactrians`. | needs-source-check |
| Bactrians | Light cavalry bow elite | elite | ? | 0 | 2 | 7 | User-corrected points. | needs-source-check |
| Scythians and Parthians | Light cavalry bow | ordinary | ? | 0 | 4 | 6 | User-corrected points. | needs-source-check |
| Guard on foot (Apple Bearer) | Heavy swordsmen elite / Bowmen elite | elite | `Darius III at Gaugameles in 331 BC`; `compulsory only if Darius III is the general in 331 BC` | 0 | 1 | 12 | Outside the Darius-III-in-331 case this is a normal `0-1` choice. | needs-source-check |
| Greek or Ionian mercenaries | Heavy spearmen | ordinary | `downgrade to mediocre -2`; `Darius III at Gaugameles in 331 BC max 2`; `only one commander can be included in a unit` | 0 | 6 | 8 | The mercenary cap belongs only to the Darius-III-in-331 section, not to the whole list. | needs-source-check |
| Persian peltasts - Takabara | Medium swordsmen | ordinary | `add support +1` | 0 | 6 | 6 | User-corrected points, modifier, and bounds. | needs-source-check |
| Babylonian and Mardian archers | Bowmen mediocre | mediocre | ? | 0 | 6 | 5 | User-corrected points and bounds. | needs-source-check |
| Hill tribesmen | Javelinmen / Light infantry javelin | ordinary | grouped hill-tribes block | 0 | 4 | `7 / 4` | User clarified that only these two rows belong to the hill-tribes block. | needs-source-check |
| Light infantry bow / sling | Light infantry bow / Light infantry sling | ordinary | separate light-infantry block | 0 | 4 | 4 | User clarified this is a separate color-bounded block from the hill-tribes javelin rows. | needs-source-check |
| Scythed chariot | Scythed chariot | ordinary | ? | 0 | 2 | 3 | User-corrected points. | needs-source-check |
| Levy | Levy | ordinary | ? | 0 | 4 | 3 | This row sits between `Scythed chariot` and the `Before 332 BC` block. | needs-source-check |
| Fortifications | Fortifications | special | ? | 0 | 6 | 1 | This row sits between `Scythed chariot` and the `Before 332 BC` block. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | ? | 0 | 1 | 10 | This row sits between `Scythed chariot` and the `Before 332 BC` block. | needs-source-check |
| Cardaces, Carians and Egyptians | Heavy spearmen mediocre | mediocre | `before 332 BC` | 0 | 6 | 6 | User-guided section binding indicates this infantry row belongs to the `Before 332 BC` bold block along with the following Chalybes and Thracians rows. | needs-source-check |
| Chalybes | Medium spearmen | ordinary | `before 332 BC` | 0 | 2 | 7 | User-corrected points and bounds. | needs-source-check |
| Thracians | Medium swordsmen / Medium swordsmen 2HW / Javelinmen | ordinary | `before 332 BC`; grouped `0-2 total` | 0 | 2 | `6 / 7 / 7` | User clarified there is no `Light infantry bow` here and the `0-2` cap applies across the grouped Thracian choices. | needs-source-check |

Allies:
- `Saka allies (List #76 Scythian)`.
- `Lycian allies (List #66 Lycian)` before `332 BC`.

Notes and restrictions:
- Bold subsection headers on the printed list scope the following rows until the next bold subsection header; this should govern the `Darius III at Gaugameles in 331 BC`, `Bessos in 329 BC`, and `Before 332 BC` bindings.
- `Darius III at Gaugameles in 331 BC` governs the `Elephant 13 0-1` row plus the guards and `Maximum 2 Greek or Ionian mercenaries`, but the guard rows are compulsory only when `Darius III` is actually the general in `331 BC`; otherwise they remain normal `0-1` choices.
- `Bessos in 329 BC` governs only the visible `Saka allies` note and the restriction `No Greek or Ionian mercenaries or scythed chariot`.
- `Before 332 BC` governs `Lycian allies`, `Cardaces, Carians and Egyptians`, `Chalybes`, and the following grouped `Thracians` rows.
- The lower page tail already overlaps the start of `69 - Cappadocian`, so later infantry rows and some points cells should stay unresolved rather than guessed.

Open verification:
- Confirm the remaining exact points, minima, and maxima for the rows still unresolved after user calibration.
- Reconstruct the lower page tail before splitting the `Takabara`, `Babylonian and Mardian archers`, and hill-tribes blocks more aggressively.

### List 69 - Cappadocian

Source: `ArmyLists1-82.pdf` p.44; `merged.pdf` p.44 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `330 BC - 17 AD`
Region / classification: `Asia Minor`, `Cappadocian`
Command value: `+3`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `44`.
- The visible history block preserves Cappadocia as a former Persian region, the independence of `Ariarathes I`, the intervention of `Perdiccas`, the restoration under `Ariarathes II`, the later Roman alliance, and annexation as a Roman province in `17 AD`.
- The page already shows a readable opening body with `Noble horsemen`, `Other horsemen`, `Warriors`, `Archers`, `Levy`, `Fortifications`, and an `Ariarathes I from 330 to 322 BC` mercenary-hoplite hook, but the mid-page rows are still too interleaved to normalize aggressively.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Noble horsemen | Heavy cavalry | ordinary | `upgrade to elite +2` | 0 | 4 | ? | The opening noble-mounted row is visible and locally stable, but the points cell still needs confirmation. | needs-source-check |
| Other horsemen | Medium cavalry / Light cavalry javelin | ordinary | grouped mounted family | ? | ? | `? / 6` | The supporting mounted block is readable enough to preserve grouped. | needs-source-check |
| Warriors | Medium swordsmen | ordinary | ? | ? | ? | ? | The core warrior row is visible, but the numeric cells are not stable yet. | needs-source-check |
| Archers | Bowmen | ordinary | `downgrade to mediocre -2` | 2 | 6 | ? | The archery row is readable in the lower body cluster. | needs-source-check |
| Levy | Levy | ordinary | ? | 0 | 4 | ? | The levy line is clearly visible near the support tail. | needs-source-check |
| Fortifications | Fortifications | special | ? | 0 | 6 | ? | The fortification support row is distinct. | needs-source-check |
| Mercenary hoplites | Heavy spearmen | ordinary | `Ariarathes I from 330 to 322 BC` | ? | ? | ? | The dated mercenary hook is clear enough to preserve, but its exact bounds remain unstable. | needs-source-check |
| Greek mercenaries | Heavy spearmen / Medium spearmen | ordinary | `Ariarathes II and successors from 255 BC`; `mercenary thureophoroi 7 0-2` visible | 0 | 2 | ? | The page-45 continuation makes the later Greek mercenary block readable enough to preserve grouped. | needs-source-check |
| Galatian mercenaries | Medium swordsmen impetuous / Heavy swordsmen impact | ordinary | `upgrade to elite +2` | 0 | 2 | `8 / 9` | The Galatian mercenary block is clearly visible in the continuation. | needs-source-check |
| Armenian allies | Armenian allies | allied contingent | `only for Ariarathes II from 300 to 255 BC` | ? | ? | ? | The ally hook is explicit and should remain separate from the main troop rows. | needs-source-check |
| Romanizing infantry | Medium swordsmen impact | ordinary | `after 41 AD`; `Roman allies (List #85 Early Imperial Roman)`; `replace all Greek militia` | 2 | 4 | 7 | The late Roman-aligned replacement row is readable enough to preserve structurally. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | ? | 0 | 1 | 10 | The support row is clear in the page-45 tail. | needs-source-check |

Allies:
- `Pergamene allies (List #73 Pergamon)` in `180-129 BC`.
- `Armenian allies (List #71 Armenian)` only for `Ariarathes II from 300 to 255 BC`.
- `Roman allies (List #85 Early Imperial Roman)` after `41 AD`.
- `Alan allies (List #108 Alan)` after `41 AD`.
- `Sarmatian allies (List #77 Sarmatian)` from `145 BC to 45 AD`.

Notes and restrictions:
- `Ariarathes II and successors from 255 BC` is now visible as a real restructuring boundary in the page-45 continuation.
- `After 41 AD`, `replace all Greek militia` by `Medium swordsmen impact 7 2-4` is readable and should remain explicit as a late Romanized hook.

Open verification:
- Confirm the exact points and bounds for `Noble horsemen`, `Other horsemen`, `Warriors`, `Archers`, `Levy`, `Fortifications`, and the later `Greek mercenaries` block.
- Reconstruct the Ariarathes-I, Ariarathes-II, and `after 41 AD` sub-blocks before splitting grouped mercenary and Romanizing rows more aggressively.

### List 70 - Bosporan Kingdom

Source: `ArmyLists1-82.pdf` p.45; `merged.pdf` p.45 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `310 BC - 375 AD`
Region / classification: `Black Sea`, `Bosporan`
Command value: `+2`, `+3 after 41 AD`
Terrain: `Plain, Steppe`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, split command value, and the opening historical paragraph on `merged.pdf` page `45`.
- The visible history block preserves the Bosporan kingdom as a Hellenized Greek polity around the Strait of Kerch with a largely Scythian and Sarmatian population, its transfer to `Mithridates VII` around `115 BC`, later Roman sphere status, and conquest by the Huns in `375 AD`.
- The page already shows a readable opening body with `Horsemen with spear`, `Horse archers`, `Greek militia`, `Sindi and Maeotians`, `Fortified camp`, and early mercenary hooks, but the interleaving with `71 - Armenian` is too dense to normalize the full body safely yet.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Horsemen with spear | Medium cavalry impetuous / Heavy cavalry impetuous | ordinary | `upgrade to elite (max 4) +2` | 4 | 12 | `7 / 9` | The opening mounted family is one of the clearest Bosporan rows on the page. | needs-source-check |
| Horse archers | Light cavalry bow / Medium cavalry bow | ordinary | medium profile `max 4` | 2 | 12 | `6 / 9` | The mounted-archer core is readable enough to preserve grouped. | needs-source-check |
| Greek militia | Medium spearmen | ordinary | ? | 2 | 4 | 7 | The militia row is locally stable. | needs-source-check |
| Sindi and Maeotians | Javelinmen / Light infantry javelin / Light infantry sling | ordinary | grouped tribal infantry tail | 0 | 4 | `7 / 4 / ?` | The named tribal tail rows are readable enough to preserve grouped. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | 0 | 1 | 6 | The support row is clearly visible. | needs-source-check |

Notes and restrictions:
- `Before 10 AD`, `Scythian allies (List #76 Scythian)` and `Thracian or Celtic mercenaries` are visible as early-period hooks, but their exact row bindings still need a page check.
- The body continues into the Armenian header block, so later Bosporan rows should remain unresolved until the next page anchor is checked.

Open verification:
- Confirm the exact points and bounds for `Horsemen with spear`, `Horse archers`, and the `Sindi and Maeotians` grouped tail.
- Capture the next page(s) before normalizing the `before 10 AD` ally and mercenary hooks into structured rows.

### List 71 - Armenian

Source: `ArmyLists1-82.pdf` pp.45-46; `merged.pdf` pp.45-46 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `300 BC - 428 AD`
Region / classification: `Black Sea`, `Armenian`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, strategist, and the opening historical paragraph across `merged.pdf` pages `45-46`.
- The visible strategist is `Tigranes the Great (95-55 BC)`.
- The history block preserves the Armenian high point under Tigranes, Roman victory under `Pompey`, the adoption of Christianity in `301 AD`, and final division between Byzantines and Persians in `428 AD`.
- The troop body is split across the page break, but the noble, horse-archer, infantry, and late-period ally hooks are readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nobles (before 204 BC) | Heavy cavalry | ordinary | `upgrade to elite (max 4) +2` | ? | ? | ? | The early noble row is visible, but the points cell is unstable in the page-45 header cluster. | needs-source-check |
| Nobles (from 204 BC to 244 AD) | Cataphract | ordinary | `upgrade to elite (max 4) +2` | 2 | 8 | 12 | The cataphract era noble row is one of the clearest Armenian lines. | needs-source-check |
| Nobles (from 244 AD) | Heavy cavalry impetuous | ordinary | `upgrade to elite (max 4) +2` | ? | ? | 9 | The later noble row is readable enough to preserve structurally. | needs-source-check |
| Horse archers | Light cavalry bow / Medium cavalry bow | ordinary | medium profile `max 4` | 4 | 12 | `6 / 9` | The mounted-archer family is clearly visible across the page break. | needs-source-check |
| Javelinmen | Javelinmen | ordinary | ? | 0 | 8 | 7 | The core javelin row is locally stable. | needs-source-check |
| Bowmen | Bowmen | ordinary | `downgrade to mediocre -2` | 2 | 6 | 7 | The archer row is readable in the page-45 body cluster. | needs-source-check |
| Light infantry bow / sling | Light infantry bow / Light infantry sling | ordinary | grouped missile tail | 0 | 4 | 4 | The missile tail is readable enough to preserve grouped. | needs-source-check |
| Georgians or Albanians | Heavy cavalry impetuous / Javelinmen / Bowmen | mixed | grouped allied contingent family | 0 | `2 / 8 / 7` | The named Caucasian contingent is readable enough to preserve grouped until the page image confirms exact row splits. | needs-source-check |
| Greek thureophoroi or hoplites | Medium spearmen / Heavy spearmen | ordinary | ? | ? | ? | `7 / 8` | The Greek infantry support row is one of the clearer page-46 lines. | needs-source-check |
| Imitation legionaries | Heavy swordsmen impact | ordinary | `downgrade to mediocre -2` | 0 | 2 | 9 | The Romanizing infantry row is clearly visible in the Tigranes-era continuation. | needs-source-check |
| Seleucid phalangites | Pikemen mediocre | mediocre | ? | ? | ? | ? | The late Hellenistic imitation block is visible but still needs exact bounds. | needs-source-check |
| Levy | Levy | ordinary | ? | 0 | 2 | 3 | The support levy row is distinct in the page-46 continuation. | needs-source-check |

Allies:
- `Arab nomad allies (List #75 Early Arab)` with `Tigranes the Great from 89 to 69 BC`.
- `Atropatene allies (List #102 Parthian)` with `Tigranes the Great from 89 to 69 BC`.
- `Alan allies (List #108 Alans)` from `226 to 228 AD`.
- `Roman allies (List #86 Middle Imperial Roman)` from `226 to 228 AD`.
- `Parthian allies (List #102 Parthian)` from `226 to 228 AD`.

Notes and restrictions:
- `With Tigranes the Great from 89 to 69 BC` is visible as a real sub-period hook and should remain explicit.
- `Following allies are from 226 to 228 AD` is a clear late-period allied package and should remain explicit.
- The Armenian body continues beyond the current slice, so some infantry and auxiliary tails should stay grouped rather than over-split.

Open verification:
- Confirm the exact points and bounds for the three `Nobles` phases, `Georgians or Albanians`, and `Greek thureophoroi or hoplites`.
- Reconstruct the Tigranes-era and `226-228 AD` sub-blocks before splitting grouped ally and auxiliary families more aggressively.

### List 72 - Galatian

Source: `ArmyLists1-82.pdf` p.46; `merged.pdf` p.46 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `280 - 25 BC`
Region / classification: `Asia Minor`, `Galatian`
Command value: `+2`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `46`.
- The visible history block preserves the Galatian settlement after the Celtic expedition of `280 BC`, their service as mercenaries, war against Pergamon, Mithridates, and Rome, and annexation as a Roman province in `25 BC`.
- The page provides a readable core of chariot, cavalry, warrior, and dated ally hooks, even though some lower-tail rows remain noisy.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot javelin | ordinary | `before 62 BC`; `max 4`; `upgrade to elite +2` | ? | ? | 8 | The early light-chariot row is one of the clearest lines in the Galatian body. | needs-source-check |
| Galatian horsemen | Medium cavalry / Heavy cavalry | ordinary | heavy profile `max 2`; `upgrade to elite +2` | 2 | 8 | `7 / 9` | The mounted family is readable enough to preserve grouped. | needs-source-check |
| Scouts | Light cavalry javelin | ordinary | ? | ? | ? | ? | The scout row is visible, but its numeric cells still need confirmation. | needs-source-check |
| Warriors before 62 BC | Heavy swordsmen impetuous | ordinary | `upgrade to elite (all, 2 or none) +2` | 8 | 24 | 8 | The early warrior row is locally stable and clearly date-gated. | needs-source-check |
| Warriors from 62 BC | Heavy swordsmen impetuous / Heavy swordsmen impact / Light infantry javelin | mixed | impact profile `max 8` | ? | ? | `8 / ? / 4` | The later warrior block is readable enough to preserve grouped, but still needs exact bounds. | needs-source-check |
| Paionian allies contingent | Light cavalry javelin / Javelinmen / Light infantry javelin / Light infantry bow / Light infantry sling | ordinary | `Paionian allies in 279 BC` | ? | ? | `6 / 7 / 4 / ? / ?` | The Paionian package is visible as a dated allied contingent and should stay grouped. | needs-source-check |
| Greek horsemen | Medium cavalry / Heavy cavalry | ordinary | `Greece invasion in 279 BC` | ? | ? | `7 / 9` | The expedition-specific Greek mounted support is clearly visible. | needs-source-check |
| Thracians | Medium swordsmen / Medium swordsmen 2HW / Javelinmen | ordinary | `Kingdom of Tylis from 279 to 212 BC`; `Thracian allies (List #63 Thracian)` | ? | ? | `6 / ? / ?` | The Thracian support block is readable enough to preserve grouped. | needs-source-check |
| Kappadokian contingent | Medium swordsmen / Javelinmen | ordinary | `against Romans in 189 BC` | ? | ? | `6 / 7` | The Roman-war contingent is visible as a dated support block. | needs-source-check |

Notes and restrictions:
- `Light chariots and Galatian cavalry dismount` into `medium swordsmen impetuous with armour` is visible as a rules-bearing note and should remain explicit.
- The page distinguishes `before 62 BC` and `from 62 BC` warrior structures; keep that split explicit instead of flattening them.

Allies:
- `Paionian allies (see list below)` for the `Greece invasion in 279 BC`.
- `Thracian allies (List #63 Thracian)` for the `Kingdom of Tylis from 279 to 212 BC`.

Open verification:
- Confirm the exact points, minima, and maxima for `Scouts`, the `from 62 BC` warrior block, `Greek horsemen`, and the `Kappadokian` contingent.
- Reconstruct the `279 BC`, `Tylis`, `189 BC`, and dismount-note sub-blocks before splitting grouped support rows more aggressively.

### List 73 - Pergamon

Source: `ArmyLists1-82.pdf` p.47; `merged.pdf` p.47 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `262 - 133 BC`
Region / classification: `East and Steppes`, `Pergamene`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `47`.
- The visible history block preserves Pergamon's independence, alliance with Rome against `Philip V`, expansion across Asia Minor, the apogee under `Eumenes II (197-159)`, the absorption of former Seleucid troops after `Magnesia in 190 BC`, and the bequest to Rome by `Attalus III` in `133 BC`.
- The upper page-47 body is readable enough for a cautious starter layer, while the lower half already interleaves with `74 - Aramaean`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Xystophoroi | Heavy cavalry impact | ordinary | `upgrade to elite (max 2) +3` | 1 | 4 | 10 | The elite shock-cavalry row is one of the clearest Pergamene lines on the page. | needs-source-check |
| Pergamene horsemen | Medium cavalry / Heavy cavalry / Light cavalry javelin | ordinary | `upgrade to elite +2` | 0 | `2 / ? / 3` | `7 / 9 / 6` | The mounted family is readable enough to preserve grouped. | needs-source-check |
| Thureophoroi and spearmen | Medium spearmen / Heavy spearmen | ordinary | ? | 4 | 12 | `7 / 8` | The core formed-infantry block is locally stable. | needs-source-check |
| Galatians | Heavy swordsmen impetuous | ordinary | `upgrade to elite +2` | 0 | 2 | 8 | The Galatian support row is clear and distinct. | needs-source-check |
| City militia | Medium spearmen mediocre | mediocre | ? | 0 | 4 | 5 | The militia row is readable in the middle body. | needs-source-check |
| Mysians and peltasts | Javelinmen / Light infantry javelin | ordinary | grouped infantry and skirmisher family | 2 | 8 | `7 / 4` | The row family is readable enough to preserve grouped. | needs-source-check |
| Cretan archers | Light infantry bow elite | elite | ? | 0 | 4 | 5 | The archer row is distinct and locally stable. | needs-source-check |
| Rhodian slingers | Light infantry sling | ordinary | ? | 0 | 2 | 4 | The slinger support row is clearly visible. | needs-source-check |
| Heavy artillery | Heavy artillery | ordinary | ? | 0 | 2 | 10 | The support row is readable and stable. | needs-source-check |
| Fortified camp | Fortified camp | special | ? | 0 | 1 | 6 | The support row is clearly visible. | needs-source-check |
| Former Seleucids | Cataphract / Heavy cavalry impact / Pike | mixed | `after 190 BC`; `replace all horsemen`; `0-2` visible on some rows | ? | ? | `12 / 10 / 11` | Preserve the Magnesia-era Seleucid import block grouped until the page image confirms exact row boundaries. | needs-source-check |
| Thracians | Light cavalry javelin | ordinary | ? | 0 | 1 | 6 | The late support row is visible, but should stay isolated from the interleaved lower page. | needs-source-check |

Allies:
- `Cappadocian allies (List #69 Cappadocian)` after `190 BC`.
- `Greek allies (List #61 Hellenistic Greek)` only in `218 BC`.
- `Galatian allies (List #72 Galatian)` in `218 BC`.

Notes and restrictions:
- `After 190 BC`, former Seleucid troops visibly join the list and should remain modeled as a distinct restructuring hook.
- The lower tail already mixes with `74 - Aramaean`, so the Seleucid-import block should remain grouped rather than over-split.

Open verification:
- Confirm the exact points and bounds for `Pergamene horsemen`, `Mysians and peltasts`, the `Former Seleucids` grouped block, and the isolated `Thracians` row.
- Reconstruct the `after 190 BC` and `218 BC` sub-blocks before splitting grouped replacement and ally rows more aggressively.

### List 74 - Aramaean

Source: `ArmyLists1-82.pdf` p.47; `merged.pdf` p.47 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `312 BC - 240 AD`
Region / classification: `East and Steppes`, `Aramaean`
Command value: `+3`, `+4 for Nabataea or Emesa`
Terrain: `Plain, Desert`; `add Mountain for Nabataea`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain guidance, split command value, and the opening historical paragraph on `merged.pdf` page `47`.
- The visible history block frames this list around Aramaean cities of Syria and Mesopotamia such as `Hatra`, `Edessa`, `Emesa`, `Characene`, `Nabataea`, and `Adiabene`, with strong Parthian influence and Roman pressure under `Trajan`.
- The upper Aramaean body is readable enough for a cautious starter layer, while the lower half already thickens into city-specific and camel-cataphract tail material.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Horsemen (all the same type) | Heavy cavalry bow / Cataphract | ordinary | `upgrade to elite (max 2) +2` | 1 | 4 | `11 / 12` | The noble mounted family is one of the clearest Aramaean rows on the page. | needs-source-check |
| Horse archers | Light cavalry bow / Medium cavalry bow | ordinary | medium profile `max 4` | 2 | 12 | `6 / 9` | The mounted-archer core is readable enough to preserve grouped. | needs-source-check |
| Bedouins | Light camelry bow mediocre / Medium camelry bow mediocre | mediocre | grouped camelry family | 0 | 2 | `5 / 8` | The Bedouin camelry family is clearly visible and locally stable. | needs-source-check |
| Archers | Bowmen | ordinary | `downgrade to mediocre -2` | 4 | 16 | 7 | The core archer row is one of the clearest infantry lines. | needs-source-check |
| Warriors with sword | Medium swordsmen / Heavy swordsmen | ordinary | grouped sword-warrior family | 0 | 4 | `6 / 8` | The sword-warrior row is readable enough to preserve grouped. | needs-source-check |
| Warriors with javelin | Javelinmen / Light infantry javelin / Light infantry bow / Light infantry sling | ordinary | grouped javelin-warrior family | 2 | 6 | `7 / 4 / 4 / 4` | The skirmishing warrior family is stable enough to preserve grouped. | needs-source-check |
| Stampeding cattle | Scythed chariot | special | ? | 0 | 1 | 3 | The special stampeding-cattle row is distinct and readable. | needs-source-check |
| Fortifications | Fortifications | special | ? | 0 | 6 | 1 | The support row is clear, though the points cell should still be checked against the page image. | needs-source-check |

Notes and restrictions:
- `Nabataea from 312 BC to 106 AD` and `Hatra from 116 BC to 225 AD` are visible as city-specific sub-period hooks and should remain explicit.
- The lower tail already introduces `Cataphracts on camels`, `Roman auxiliaries`, and `Only from 100 AD` material, but those rows should wait for the next page anchor before they are split out.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Emesa horsemen replacement | Cataphract | ordinary | `Emesa from 51 BC to 72 AD`; `replace all horsemen`; `upgrade to elite +2` | 2 | 4 | 12 | The Emesa-specific mounted replacement block is clear in the page-48 continuation. | needs-source-check |
| Guardsmen | Medium swordsmen impact elite | elite | `Emesa from 51 BC to 72 AD` | ? | ? | ? | The elite guardsmen row is readable, but its numeric cells remain unstable. | needs-source-check |

Allies:
- `Arab nomad allies (List #75 Early Arab)` only if `Characene`.
- `Parthian allies (List #102 Parthian)` except for `Nabataea` and `Emesa`.

Open verification:
- Confirm the exact points and bounds for `Horsemen (all the same type)`, `Bedouins`, `Stampeding cattle`, and `Fortifications`.
- Confirm the exact points and bounds for the `Emesa` replacement block and `Guardsmen`.
- Reconstruct the `Nabataea`, `Hatra`, `Emesa`, and `Only from 100 AD` sub-blocks before splitting the lower camel-cataphract and Roman-auxiliary material more aggressively.

### List 75 - Early Arab

Source: `ArmyLists1-82.pdf` p.48; `merged.pdf` p.48 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `312 BC - 630 AD`
Region / classification: `East and Steppes`, `Arab`
Command value: `+2`
Terrain: `Plain, Steppe`; `Steppe, Desert for Ghassanid and Kindah`; `Plain, Steppe, Desert for Lakhmid`

Notes and restrictions:
- OCR clearly exposes the list header, date range, split terrain guidance, command value, and the opening historical paragraph on `merged.pdf` page `48`.
- The visible history block covers the Arabian cities and nomadic tribes before Islam, especially `Mecca`, `Medina`, `Oman`, the Yemenite kingdom, and the `Ghassanid`, `Lakhmid`, and `Kindah` tribal groupings.
- The upper and middle body are readable enough for a cautious starter layer, while the lower tail already begins to overlap the `76 - Scythian` header.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tribal leaders | Medium cavalry | ordinary | `upgrade to elite +2` | 0 | 3 | 7 | The leader row is one of the clearest mounted entries on the page. | needs-source-check |
| Horsemen | Light cavalry javelin | ordinary | ? | 0 | 6 | 6 | The core horsemen row is readable and locally stable. | needs-source-check |
| Scouts on camels | Light camelry bow mediocre | mediocre | ? | 0 | 2 | 5 | User-corrected points and bounds. | needs-source-check |
| Warriors | Medium swordsmen / Heavy swordsmen mediocre / Heavy swordsmen | mixed | `add support +1` available to all warrior choices; heavy profile `max 6` | 6 | 24 | `6 / 6 / 8` | User clarified that support is available across the warrior family and that only `Heavy swordsmen` are capped at `max 6`. | needs-source-check |
| Bowmen / light infantry bow | Bowmen / Light infantry bow | ordinary | choice block | 0 | 4 | `7 / 4` | User clarified this is a shared `0-4` choice block rather than a single row. | needs-source-check |
| Javelinmen / light infantry javelin | Javelinmen / Light infantry javelin | ordinary | choice block | 0 | 4 | `7 / 4` | User clarified this is a shared `0-4` choice block rather than a single row. | needs-source-check |
| Light infantry sling | Light infantry sling | ordinary | ? | 0 | 2 | 4 | This row sits before `Women and children` and before the `Bedouin tribes` block. | needs-source-check |
| Women and children | Levy mediocre | mediocre | ? | 0 | 1 | 2 | User-corrected points, bounds, and ordering. | needs-source-check |
| Sassanid cavalry | Heavy cavalry bow | ordinary | `Yemen or Oman, from 530 AD` | 0 | 2 | 11 | User clarified this row sits before the `Bedouin tribes` block. | needs-source-check |
| Bedouin tribes | Light cavalry javelin / Medium cavalry | ordinary | `replace all warriors` applies to all warrior choices and keeps the replaced warrior min/max profile | 6 | 24 | `6 / 7` | User clarified this is its own block and that `replace all warriors` here keeps the inherited min/max from the replaced warrior block. | needs-source-check |
| Nomad warriors on camels | Medium camelry / Medium camelry bow mediocre | mixed | `Bedouin tribes` block | 0 | 12 | `8 / 8` | User clarified both camel-warrior choices cost `8` and belong inside the `Bedouin tribes` block. | needs-source-check |
| Al Shahba cavalry | Heavy cavalry bow | ordinary | `Bedouin tribes` block; `only for Lakhmids from 400 AD` | 0 | 2 | 11 | User clarified this also belongs to the `Bedouin tribes` block. | needs-source-check |

Allies:
- `Sassanid allies (List #109 Sassanid Persian)` for `Lakhmids from 240 to 602 AD` and for `Oman or Yemen from 530 AD`.
- `Byzantine allies (List #125 Maurikian Byzantine)` for `Ghassanids in 586 AD`.

Notes and restrictions:
- `Allies taken from this list can be Bedouin tribes.` is a visible rules-bearing note and should remain explicit.
- The page distinguishes several named Arab sub-groups by terrain and ally package; keep those sub-period hooks explicit instead of flattening them.
- `Bedouin tribes` is a real section block. Within that block, `replace all warriors` applies to the replacement package rather than to a single row only.
- `Ghassanid`, `Kindah`, `Lakhmid`, and `Yemen/Oman` act here as terrain/allies headers plus the two explicit troop hooks already shown (`Sassanid cavalry`, `Al Shahba cavalry`), and do not bind any further troop blocks.

Open verification:
- Confirm only whether any later page note modifies the inherited `6-24` warrior min/max for the `Bedouin tribes` replacement package.
- Reconstruct only any later ally or terrain notes for `Lakhmid`, `Ghassanid`, `Kindah`, and `Yemen or Oman from 530 AD`; no additional troop-block binding is expected beyond the explicit mounted hooks already captured.

### List 76 - Scythian

Source: `ArmyLists1-82.pdf` pp.48-49; `merged.pdf` pp.48-49 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `750 BC - 50 AD`
Region / classification: `East and Steppes`, `Scythian`
Command value: `+3`
Terrain: `Steppe`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph across `merged.pdf` pages `48-49`.
- The visible history block preserves the wide Scythian steppe span from Ukraine to the Altai, includes `Cimmerians`, `Saka`, `Massagetae`, and the `Hu`, and notes western defeat by Alexander, Sarmatian subjugation, eastern settlement in Bactria and northern India, and the `Returned Seleucid pikemen (129 BC)` episode.
- The body is split across the page break, but the nobles, horse-archer core, militia, and later Indian and Alan hooks are readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Scythian nobles before 300 BC | Heavy cavalry bow | ordinary | `upgrade to elite +2` | ? | ? | 11 | The early noble row is clear in the page-48 header block. | needs-source-check |
| Scythian nobles from 300 BC | Heavy cavalry impetuous / Cataphract | ordinary | `from 300 BC`; `replace all nobles`; `upgrade to elite +2` | 0 | 4 | `9 / 12` | The page-49 continuation shows `from 300 BC` as a visible subsection header governing the noble replacement. | needs-source-check |
| Horse archers | Light cavalry bow / Light cavalry bow elite / Medium cavalry bow | ordinary / elite | light elite profile `max 12`; medium profile `max 12` | 6 | 18 | `6 / 7 / 9` | The mounted-archer family is the clearest sustained Scythian row on the two-page spread. | needs-source-check |
| Tribal militia | Medium swordsmen mediocre / Javelinmen mediocre / Bowmen / Light infantry bow | mixed | bowmen `downgrade to mediocre -2` | ? | ? | `4 / 3 / 7 / 4` | The militia family is readable enough to preserve grouped. | needs-source-check |
| Returned Seleucid pikemen | Pikemen mediocre | mediocre | `129 BC` | ? | ? | ? | The special returned-pikemen hook is explicitly visible in the page-49 continuation. | needs-source-check |
| Bosporans and warriors | Medium spearmen / Medium swordsmen / Bowmen / Light infantry bow | ordinary | grouped settled-support family | 2 | 6 | `7 / 6 / 7 / 4` | The settled support block is readable enough to preserve grouped rather than forcing row breaks. | needs-source-check |
| Elephant | Elephant | ordinary | ? | 0 | 1 | 13 | The elephant row is distinct in the page-49 continuation. | needs-source-check |
| Other horsemen with long spear | Medium cavalry impetuous / Heavy cavalry impetuous | ordinary | `downgrade to mediocre -2` | 0 | 6 | `7 / ?` | The long-spear mounted family is visible, but one points cell remains unstable. | needs-source-check |

Allies:
- `Indian allies (see list below)` from `300 BC`.
- `Scythian allies (List #76 Scythian)`.
- `Asiatic Greek (List #60 Classical Greek)` or `Thracian plains tribes allies (List #63 Thracian)` for `European Scythians in 313 BC`.
- `Thracian plains tribes allies (List #63 Thracian)` for `Cimmerians from 680 to 675 BC`.
- `Roxolani allies (List #77 Sarmatian)` for `European Scythians in 108-106 BC`.
- `Herul allies (List #96 Gepid, Herul, Taifali and Sciri)` in `358 AD`.
- `Quadi allies (List #97 Franks, Alemanni, Burgundi, Suevi)` after `250 AD`.
- `Alan allies (List #108 Alan)` after `100 AD`.

Notes and restrictions:
- The earlier draft over-bound part of the page-49 upper-right block to Scythian. With the corrected reading order, each column must be treated as its own page and followed top-to-bottom before moving to the next column in printed-page order.
- `Returned Seleucid pikemen (129 BC)` is visible as a rules-bearing event hook and should remain explicit.
- The page break mixes several regional and late-era ally notes into the Scythian tail; keep those packages explicit but grouped until the page image confirms exact row attachment.

Open verification:
- Confirm the exact points, minima, and maxima for the later `nobles from 300 BC`, `Returned Seleucid pikemen`, and `Other horsemen with long spear` rows.
- Reconstruct the Scythian/Sarmatian handoff across the page-49 column break using printed-page column order rather than raw OCR top ordering.

### List 77 - Sarmatian

Source: `ArmyLists1-82.pdf` p.49; `merged.pdf` p.49 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `310 BC - 375 AD`
Region / classification: `Classical Asia`, `Sarmatian`
Command value: `+2`
Terrain: `Steppe`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the opening historical paragraph on `merged.pdf` page `49`.
- The visible history block preserves the westward movement from lands between the Don and Urals, replacement of the Scythians in Ukraine, later domination of the steppes, subdivision into `Lazyges`, `Roxolani`, `Aorsi`, and `Siraces`, and eventual defeat by Goths and Huns.
- The page also exposes an upper-right continuation block that was previously mis-bound to `List 76 - Scythian`; with the corrected column-as-page reading order, that upper-right package belongs to Sarmatian and must be reconstructed here rather than under Scythian.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sarmatian horsemen | Medium cavalry impetuous / Heavy cavalry impetuous | ordinary | `upgrade to elite (max 6) +2` | 6 | 24 | `7 / 9` | The opening mounted family is the clearest Sarmatian row on the page. | needs-source-check |
| Horse archers | Light cavalry bow | ordinary | ? | 0 | 6 | 6 | The mounted-archer row is visible and locally stable. | needs-source-check |

Open verification:
- Reconstruct the page-49 upper-right continuation block for Sarmatian, including the previously mis-bound `Until 100 AD`, `Peasants`, and `Fortified camp` rows.
- Confirm whether any of the lower rows near the `Vietnamese` header still belong to Sarmatian rather than to the next list.

### List 78 - Vietnamese

Source: `ArmyLists1-82.pdf` pp.49-50; `merged.pdf` pp.49-50 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `700 BC - 111 BC`
Region / classification: `Classical Asia`, `Vietnamese`
Command value: `+2`, `+3 for Nam Viet`
Terrain: `Plain, Forest`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, split command value, and the opening historical paragraph across `merged.pdf` pages `49-50`.
- The visible history block covers `Van Lang`, `Au Lac`, and the later `Nam Viet Kingdom (206-111 BC)`, followed by Han conquest in `111 BC`.
- The body is split across the page break, but the warrior core, bow/crossbow lines, early chariots, and Nam Viet Qin-style reforms are readable enough for a cautious starter layer.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warriors (all the same type) | Medium swordsmen / Medium swordsmen impetuous | ordinary | `upgrade to elite (max 4) +2` | 4 | 4 | 6 | The opening warrior family is readable across the page break, though the exact bounds should still be checked. | needs-source-check |
| Bowmen | Bowmen | ordinary | ? | ? | ? | 7 | The bowmen row is clear in the page-49 lower body. | needs-source-check |
| Crossbowmen | Crossbowmen | ordinary | `after 300 BC`; `downgrade to mediocre -2` | 2 | 12 | 7 | The crossbow row is one of the clearest dated Vietnamese lines. | needs-source-check |
| Light infantry bow | Light infantry bow | ordinary | ? | 0 | 6 | 4 | The light-bow tail is visible and locally stable. | needs-source-check |
| Nam Viet Qin-style troops | Medium swordsmen polearm / Heavy swordsmen polearm | ordinary | `Nam Viet Kingdom (206-111 BC)`; `add support +1` | ? | ? | `7 / 9` | The Qin-style infantry reform block is readable enough to preserve grouped. | needs-source-check |
| 4 horse chariots | Heavy chariot impact | ordinary | `upgrade to elite +2` | 2 | 4 | 11 | The heavy chariot row is clear in the page-50 body. | needs-source-check |
| Horsemen | Heavy cavalry / Medium cavalry crossbow | ordinary | ? | 0 | 4 | `9 / ?` | The mounted body is visible, but the crossbow-cavalry points cell still needs confirmation. | needs-source-check |
| Horse archers | Light cavalry bow | ordinary | ? | ? | ? | 6 | The horse-archer row is visible in the lower page-50 body. | needs-source-check |
| Guards | Crossbowmen pavise | ordinary | `upgrade to elite` | ? | ? | 8 | The guards row is readable enough to preserve structurally. | needs-source-check |
| Stampeding cattle | Scythed chariot | special | ? | ? | ? | ? | The special row is visible beside the Nam Viet reform block, but still needs exact bounds. | needs-source-check |
| Levy | Levy | ordinary | ? | 0 | 4 | 3 | The levy line is clearly visible near the support tail. | needs-source-check |
| Divine palanquin | Divine palanquin | special | `before 320 BC` | ? | ? | ? | The dated command/support row is visible enough to preserve as a note-bearing entry. | needs-source-check |
| Sacred camp | Fortified camp | special | ? | ? | ? | 6 | The sacred-camp support line is visible in the page-50 body. | needs-source-check |

Notes and restrictions:
- `Nam Viet Kingdom (206-111 BC)` is visible as a real reform layer and should remain explicit.
- `Troops trained in Qin Chinese style` and the dated `before 320 BC` / `from 320 to 550 AD` notes are partially interleaved with the next list and should remain cautious until the page image is checked.
- `Stampeding cattle` is accompanied by the note that `Rathamasaula were scythed and bladed man-pushed carts used against elephants`; keep that note explicit once the Indian slice is expanded further.

Open verification:
- Confirm the exact bounds and minima/maxima for the opening warrior row, `Horsemen`, `Horse archers`, `Stampeding cattle`, `Divine palanquin`, and `Sacred camp`.
- Reconstruct the `Nam Viet Kingdom` reform block and separate Vietnamese rows cleanly from the first `Classical Indian` lines on the same page.

### List 79 - Classical Indian

Source: `ArmyLists1-82.pdf` p.50; `merged.pdf` p.50 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `500 BC - 550 AD`
Region / classification: `Classical Asia`, `Indian`
Command value: `+2`, `+3 if Mauryas or Guptas`
Terrain: `Plain, Forest`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, split command value, and the opening historical paragraph on `merged.pdf` page `50`.
- The visible history block preserves the central role of the `Maurya Empire` from `323 to 180 BC` and the `Gupta Empire` from `320 to 550 AD`, presented as a golden age in India.
- The upper and middle body are readable enough for a cautious starter layer, while the lower part already interleaves with `80 - Warring States`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| War elephants with escorts | Elephant elite | elite | `replace some elephants with Rathamasaula (before Mauryas)` | 2 | 6 | 16 | The elite elephant row is one of the clearest Indian lines on the page. | needs-source-check |
| Rathamasaula | War wagon with blades | special | `before Mauryas` | ? | ? | 8 | The special anti-elephant cart row is readable enough to preserve structurally. | needs-source-check |
| Nobles | Light chariot bow / Heavy chariot impetuous | ordinary | `upgrade to elite +2` | 0 | 4 | `9 / 10` | The noble chariot family is readable enough to preserve grouped. | needs-source-check |
| Horsemen | Medium cavalry | ordinary | `downgrade to mediocre -2` | 1 | 4 | 7 | The mounted core row is locally stable. | needs-source-check |
| Horse archers | Light cavalry bow | ordinary | `after Mauryas` | ? | ? | ? | The dated mounted-archer row is clearly visible, but its bounds still need confirmation. | needs-source-check |
| Guardsmen | Medium swordsmen 2HW elite | elite | `from Mauryas` | ? | ? | ? | The Mauryan guards row is visible and structurally clear. | needs-source-check |
| Indian archers | Bowmen / Medium swordsmen + Bowmen mixed units | ordinary | `downgrade to mediocre (max 14) -2` on mixed units | ? | ? | `7 / 8` | Preserve the archer family and mixed-unit variant grouped until the page image confirms exact row breaks. | needs-source-check |
| Indian warriors | Medium swordsmen | ordinary | `downgrade to mediocre -2` | 0 | 6 | 6 | The warrior row is readable in the lower body cluster. | needs-source-check |
| Light infantry bow / javelin | Light infantry bow / Light infantry javelin | ordinary | javelin profile `max 2` | ? | ? | 4 | The light-foot tail is visible and stable enough to preserve grouped. | needs-source-check |

Notes and restrictions:
- `Rathamasaula were scythed and bladed man-pushed carts used against elephants.` is visible as a rules note and should remain explicit.
- `Before Mauryas`, `after Mauryas`, and `from Mauryas` are real period hooks and should remain explicit instead of flattening the list.
- The lower body already overlaps the first `Warring States` rows, so later crossbow and guard material should remain unresolved until the next page anchor is checked.

Open verification:
- Confirm the exact bounds and minima/maxima for `Rathamasaula`, `Horse archers`, `Guardsmen`, and the grouped `Indian archers` family.
- Reconstruct the Maurya and Gupta sub-period rows before splitting the lower body and separating it from the `Warring States` header block.
