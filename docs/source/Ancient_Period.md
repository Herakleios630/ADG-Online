# Ancient Period Army Lists

This file is the single working reference for all Ancient-period army lists in the project. It is intended to be readable on its own by humans and useful as the canonical AI-facing army-list corpus for Ancient lists `1-37`.

Scope:
- Covers exactly Ancient lists `1-37`.
- Keeps each army in one place with header data, readable army-list rows, options, allies, and unresolved edge cases.
- Preserves date gates, replacements, commander notes, ally restrictions, and calibrated continuation rules directly inside the affected list instead of scattering them across separate files.

How to read this file:
- Header fields such as date range, terrain, command value, and region are the current working canonical values for the list.
- `Troop entries` are the human-readable army-list body. When a row is still textually uncertain, it is kept as one conservative grouped row instead of being over-split.
- Row `Status` uses `scan-confirmed` where the color scan is visually clear enough to stand on its own, and `needs-source-check` where wording or block ownership is still intentionally conservative.
- `Options / replacements` records explicit historical switches like `from ...`, `after ...`, and `replace all ...`.
- `Allies` records usable ally hooks and date windows.
- `Notes and restrictions` keeps rules-bearing notes, commander restrictions, dismount rules, or scope clarifications that matter for later implementation.
- `Open verification` is an editorial backlog only. It marks the remaining uncertainties, but the list entry above it is still the best current standalone reference.

Ancient Period overview:
- `Lists 1-9`: Mesopotamia and early Near Eastern empires.
- `Lists 10-16`: Egyptian and Nile-adjacent lists.
- `Lists 17-23`: Early Middle Eastern and Levantine lists.
- `Lists 24-33`: Anatolian, Aegean, and steppe-adjacent lists.
- `Lists 34-37`: Early Indian and Chinese lists.
- When the exact row split is still unstable, grouped rows are preferred over invented precision.
- In `Abilities`, use `-` when no additional visible upgrade, downgrade, replacement, or special rule is attached to the row. Use `?` only for genuine unresolved uncertainty.
- Detailed provenance should stay out of the main reading flow whenever possible. The body of this document should read like a usable army-list reference first and an extraction log only second.
- Re-run the most continuation-heavy lists against the new scan image pages before promoting grouped rows into fully split troop tables.
- Continue reducing `needs-source-check` rows where the new scan gives enough visual certainty to do so without guesswork.

### List 1 - Sumer and Akkad

Source: `Ancient_Period.pdf` page `1`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; `merged.pdf` OCR helper
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `3000 - 2004 BC`
Region / classification: `Ancient Period`, `Sumer & Babylon`
Command value: `+4`
Terrain: `Plain`
Strategists: `King Agga (2700 BC)`; `Sargon of Akkad (2334-2279 BC)`

Notes and restrictions:
- The dedicated Ancient-period scan exposes both the left-column opening table and the right-column continuation on printed page `92`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4-wheeled battle cars | Heavy chariot | ordinary | starred row | 2 | 4 | 9 | Opening chariot row in the lower-left table. | scan-confirmed |
| Scouts on equids | Light cavalry bow | mediocre | - | 0 | 1 | 4 | Separate scout row immediately below the chariot block. | scan-confirmed |
| Royal guardsmen | Medium swordsmen `2HW` elite / Bowmen pavise elite | elite | starred row; shared `0-2` pool across both profiles | 0 | 2 | `9 / 10` | One white guard block with a shared units column. | scan-confirmed |
| Warriors and militia | Medium spearmen mediocre / Heavy spearmen mediocre | mediocre | `add pavise +1`; `upgrade to ordinary (max 1/2) +2` | 8 | 24 | `5 / 6` | Large beige core block with one visible `8-24` pool. | scan-confirmed |
| Militia | Bowmen mediocre / Light infantry bow | mediocre / ordinary | grouped local missile block | 2 | 6 | `5 / 4` | Separate white militia missile block below the core warriors. | scan-confirmed |
| Zagros hillmen | Javelinmen / Light infantry javelin | ordinary | javelinmen `downgrade to mediocre -2`; shared local `0-4` block | 0 | 4 | `7 / 4` | Beige local hillmen block at the foot of the left-column table. | scan-confirmed |
| Amorite mercenaries | Medium swordsmen | ordinary | - | 0 | 4 | 6 | Visible in the right-column continuation. | scan-confirmed |
| Shepherds | Light infantry sling | ordinary | - | 0 | 4 | 4 | Continuation row in the upper-right table. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 4 | 3 | Visible in the continuation block before fortifications. | scan-confirmed |
| Fortifications | Fortifications | special | - | 0 | 6 | 1 | Separate pre-camp support line. | scan-confirmed |
| Fortified camp | Fortified camp | special | - | 0 | 1 | 6 | Final camp row in the continuation block. | scan-confirmed |

Allies:
- `Zagros allies (List #3 Amorite Highlanders)`.
- `Elamite allies (List #4 Elamite)`.
- `Bedouin allies (List #17 Ancient Bedouin)`.
- `Syrian allies (List #18 Syrian City States)`.
- `Indian allies (List #34 Indus Valley)`.

Notes and restrictions:
- Heavy chariots dismount as `medium swordsmen impact` with no armour.

### List 2 - Sumerian Successor

Source: `Ancient_Period.pdf` pages `1-2`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; `merged.pdf` OCR helper
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `2028 - 1460 BC`
Region / classification: `Ancient Period`, `Sumer & Babylon`
Command value: `+4`
Terrain: `Plain`

Notes and restrictions:
- The opening white battle-car block shares one combined `0-2` units pool across `4-wheeled battle cars` and `Chariots with 2 horses`.
- `Zagros hillmen` applies only to the local white `Javelinmen + Light infantry javelin` block; the following `Light infantry javelin`, `Light infantry bow`, and `Light infantry sling` rows are separate tail rows.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4-wheeled battle cars | Heavy chariot | ordinary | shared choice pool with `Chariots with 2 horses` | 0 | 2 | 9 | Shares the opening white block with the adjacent two-horse chariot row. | scan-confirmed |
| Chariots with 2 horses | Light chariot bow | ordinary | `upgrade to elite +2`; shared choice pool with `4-wheeled battle cars` | 0 | 2 | 9 | The page shows one combined `0-2` units column for the two chariot profiles. | scan-confirmed |
| Scouts on equids | Light cavalry bow | mediocre | - | 0 | 1 | 4 | Separate scout row below the battle-car block. | scan-confirmed |
| Royal guardsmen | Medium swordsmen `2HW` elite / Heavy spearmen elite | elite | starred row; shared `0-2` pool across both profiles | 0 | 2 | `9 / 10` | One white guard block in the lower-right page table. | scan-confirmed |
| Warriors and militia | Medium spearmen mediocre / Heavy spearmen mediocre | mediocre | `add pavise +1`; `upgrade to ordinary (max 1/2) +2` | 8 | 24 | `5 / 6` | Large beige core block with one visible `8-24` units pool. | scan-confirmed |
| Elamite mercenaries | Bowmen | ordinary | `downgrade to mediocre -2` | 0 | 6 | 7 | Visible in the continuation block on the following page. | scan-confirmed |
| Amorite mercenaries | Medium swordsmen | ordinary | - | 0 | 4 | 6 | Separate mercenary row in the continuation. | scan-confirmed |
| Zagros hillmen | Javelinmen / Light infantry javelin | ordinary | javelinmen `downgrade to mediocre -2`; shared `0-2` pool across the local white block | 0 | 2 | `7 / 4` | Local white block only; later light-infantry tail rows are separate. | scan-confirmed |
| Light infantry javelin | Light infantry javelin | ordinary | - | 1 | 3 | 4 | Separate beige tail row after the `Zagros hillmen` block. | scan-confirmed |
| Light infantry bow | Light infantry bow | ordinary | - | 1 | 3 | 4 | Separate tail row after `Light infantry javelin`. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 1 | 3 | 4 | Separate tail row after `Light infantry bow`. | scan-confirmed |

Allies:
- `Elamite allies (List #4 Elamite)`.
- `Assyrian allies (List #5 Old Assyrian and Babylonian)`.
- `Bedouin allies (List #17 Ancient Bedouin)`.

Notes and restrictions:
- Heavy chariots dismount as `medium swordsmen impact` with no armour.

### List 3 - Amorite Highlanders

Source: `Ancient_Period.pdf` page `2`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; `merged.pdf` OCR helper
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `3000 - 1000 BC`
Region / classification: `Ancient Period`
Command value: `+3`
Terrain: `Mountain, add Plain from 2193 to 2112 BC`

Notes and restrictions:
- The header-level `add Plain from 2193 to 2112 BC` belongs to the matching `Guti, between 2193 and 2112 BC` historical form.
- `Guti, in The Great Revolt circa 2250 BC` and `Guti, between 2193 and 2112 BC` are separate historical blocks, not alternate labels for one combined module.
- After `1800 BC`, the local white guard block expands into a shared `0-4` pool in which `Guardsmen` and `Chariots with 2 horses` are chosen from the same units cap.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Guardsmen | Medium swordsmen `2HW` elite / Bowmen elite | elite | bowmen `max 2`; shared `0-4` pool across the guard block; after `1800 BC` the local pool also includes `Chariots with 2 horses` | 0 | 4 | `9 / 10` | Post-`1800 BC` chariots expand this same local white block. | scan-confirmed |
| Chariots with 2 horses (after 1800 BC) | Light chariot bow elite | elite | `after 1800 BC`; `max 2`; shared `0-4` pool with `Guardsmen` | 0 | 4 | 11 | Date-gated addition to the local white guard block. | scan-confirmed |
| Warriors | Medium swordsmen | ordinary | `downgrade to mediocre (max 8) -2` | 6 | 16 | 6 | Core warrior row. | scan-confirmed |
| Hill tribesmen | Javelinmen | ordinary | `downgrade to mediocre (max 6) -2` | 0 | 12 | 7 | Opening hill-tribesmen row. | scan-confirmed |
| Hill tribesmen | Bowmen | ordinary | `downgrade to mediocre -2` | 0 | 8 | 7 | Right-column continuation row. | scan-confirmed |
| Hill tribesmen | Light infantry javelin | ordinary | - | 2 | 8 | 4 | Separate continuation row in the same family. | scan-confirmed |
| Hill tribesmen | Light infantry sling | ordinary | - | 0 | 6 | 4 | Separate continuation row below `Light infantry javelin`. | scan-confirmed |
| Hill tribesmen | Light infantry bow | ordinary | - | 0 | 4 | 4 | Final continuation row before the `Gasgans` block. | scan-confirmed |
| Gasgans - replace all guardsmen | Medium swordsmen impetuous elite | elite | `replace all guardsmen`; starred replacement row | 0 | 4 | 8 | Gasgan replacement block before the Guti notes. | scan-confirmed |
| Gasgans - after 1700 replace all chariots | Light chariot javelin elite | elite | `after 1700`; `replace all chariots`; `max 2` | 0 | 4 | 10 | Shares the Gasgan replacement block and its visible `0-4` units column. | scan-confirmed |
| Gasgans - replace all warriors | Medium swordsmen impetuous | ordinary | `replace all warriors` | all | all | 6 | Separate beige replacement row with `All` in the units column. | scan-confirmed |
| Makkan mercenaries (Guti, Great Revolt circa 2250 BC) | Medium swordsmen impetuous | ordinary | - | 0 | 4 | 6 | Mercenary row under the `Guti, in The Great Revolt circa 2250 BC` block. | scan-confirmed |
| Melukhkan mercenaries (Guti, Great Revolt circa 2250 BC) | Medium spearmen / Bowmen | ordinary | grouped mercenary row | 0 | 4 | 7 | One visible mercenary block with both troop profiles and one `0-4` units column. | scan-confirmed |
| Sumerian and Akkadian subjects (Guti, between 2193 and 2112 BC) | Medium spearmen mediocre / Heavy spearmen mediocre | mediocre | `Guti, between 2193 and 2112 BC`; `add pavise +1`; `upgrade to ordinary (max 1/2) +2` | 2 | 8 | `5 / 6` | This date-matched `Guti` form is the same window that adds `Plain` terrain. | scan-confirmed |

Options / replacements:
- `Guti, in The Great Revolt circa 2250 BC` is a separate historical block and should not be merged with the `2193 to 2112 BC` `Guti` form.
- The visible `replace all guardsmen`, `after 1700 replace all chariots`, and `replace all warriors` lines belong to the `Gasgans` block.

Allies:
- `Elamite allies (List #4 Elamite)` for `Guti, in The Great Revolt circa 2250 BC`.
- `Syrian allies (List #18 Syrian City States)` for `Guti, in The Great Revolt circa 2250 BC`.
- `Sumerian allies (List #1 Sumer and Akkad)` for `Guti, between 2193 and 2112 BC`.

Notes and restrictions:
- `Makkan` and `Melukhkan` mercenary lines belong only to `Guti, in The Great Revolt circa 2250 BC`.
- Light chariot javelin dismounts as `medium swordsmen impetuous`.

### List 4 - Elamite

Source: `Ancient_Period.pdf` pages `2-3`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; `merged.pdf` OCR helper
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `3000 - 539 BC`
Region / classification: `Ancient Period`
Command value: `+3`
Terrain: `Plain, Mountain`

Notes and restrictions:
- The dedicated Ancient-period scan now recovers the full header block and a substantial part of the troop table across the page turn into the next page.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4-wheeled battle cars | Heavy chariot | ordinary | `before 800 BC` | 0 | 4 | 9 | The early battle-car row is clearly visible just below the header. | scan-confirmed |
| Scouts on equids | Light cavalry bow | mediocre | `before 800 BC` | 0 | 1 | 4 | The early scout row is readable in the same opening block. | scan-confirmed |
| Guardsmen | Medium swordsmen impact elite / Bowmen pavise elite | elite | shared `0-2` pool across both profiles | 0 | 2 | `9 / 10` | The next page shows one elite guard block with one shared units column for both profiles. | scan-confirmed |
| Militia (2500 to 1800 BC) | Medium spearmen / Heavy spearmen | ordinary | local white block; `downgrade to mediocre -2` on both profiles | 0 | 4 | `7 / 8` | The italic label is a historical designation only; it scopes to the white block with `Medium spearmen`, `Heavy spearmen`, and the shared downgrade option. | scan-confirmed |
| Bowmen | Bowmen | ordinary | `downgrade to mediocre -2`; `Light infantry bow (max 6)` visible nearby | 8 | 24 | 7 | One of the clearest body rows in the continuation table. | scan-confirmed |
| Hill tribesmen | Javelinmen / Light infantry javelin | ordinary | local white block; javelinmen `downgrade to mediocre -2`; shared `0-4` pool across the white block | 0 | 4 | `7 / 4` | The italic label is only a historical designation. The white block contains `Javelinmen` plus `Light infantry javelin`; do not let the italic text absorb the beige row below. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | separate beige block | 0 | 4 | 4 | The page image shows this as its own beige row below the white `Hill tribesmen` block. | scan-confirmed |
| Chariots with 2 horses (from 1800 BC) | Light chariot bow | ordinary | replaces battle cars; `upgrade to elite (max 2) +2` | 2 | 6 | 9 | Explicit historical replacement line visible in the continuation block. | scan-confirmed |
| Chariots with 2 horses (from 800 BC) | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4) +2` | 4 | 12 | 9 | Later chariot row appears after the Babylonian-allies note. | scan-confirmed |
| Proto cavalry | Medium cavalry bow | ordinary | `downgrade to mediocre -2` | 2 | 6 | 9 | Clearly readable in the later phase of the list. | scan-confirmed |
| Light cavalry bow | Light cavalry bow | ordinary | - | 0 | 2 | 6 | Separate later cavalry tail row. | scan-confirmed |
| Archers with light spear and pavise | Mixed unit (`1/2` medium swordsmen, `1/2` bowmen) | mixed | true `mixed units` notation, printed in italics | 0 | 4 | 8 | The formed `Archers with light spear and pavise` row is a true mixed formed unit. | scan-confirmed |
| Light infantry bow | Light infantry bow | ordinary | - | 0 | 6 | 4 | Separate light-infantry tail row after the mixed-unit entry. | scan-confirmed |

Options / replacements:
- From `1800 BC`, replace all `battle cars` with `chariots with 2 horses`.

Allies:
- `Zagros allies (List #3 Amorite Highlanders)` before `800 BC`.
- `Bedouin allies (List #17 Ancient Bedouin)` before `800 BC`.
- `Indian allies (List #34 Indus Valley)` before `800 BC`.
- `Babylonian allies (List #8 Neo-Babylonian)` from `800 BC`.

Notes and restrictions:
- Heavy chariots dismount as `medium swordsmen impact` with no armour.


### List 5 - Old Assyrian and Babylonian

Source: `Ancient_Period.pdf` page `3`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; `merged.pdf` OCR helper
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1900 - 1595 BC`
Region / classification: `Ancient Period`
Command value: `+4`
Terrain: `Plain, Mountain`

Notes and restrictions:
- The List `5` header appears clearly in the lower half of `merged.pdf` page `9`.
- Browser inspection of the rendered scan confirms the local color ownership: `Bowmen` is a beige standalone row, the adjacent `Medium swordsmen mediocre` line is a separate white standalone row, and the two `Sabum Qallatum` entries are distinct beige blocks.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `upgrade to elite +2` | 0 | 2 | 9 | The opening chariot row is one of the clearest entries in the List `5` block. | scan-confirmed |
| Light cavalry bow | Light cavalry bow | mediocre | - | 0 | 1 | 4 | The mounted scout row is cleanly visible directly below the chariots. | scan-confirmed |
| Warriors | Medium swordsmen impact | ordinary | - | 6 | 16 | 7 | The core warrior row is stable enough to preserve directly. | scan-confirmed |
| Bowmen | Bowmen | ordinary | - | 0 | 4 | 7 | The page image makes this a separate standalone row between `Warriors` and the `Sabum Qallatum` blocks. | scan-confirmed |
| Medium swordsmen | Medium swordsmen | mediocre | separate white standalone row | 0 | 4 | 4 | OCR plus browser inspection confirm this is its own white row between beige `Bowmen` and the first beige `Sabum Qallatum` block. | scan-confirmed |
| Sabum Qallatum (javelin block) | Javelinmen / Light infantry javelin | ordinary | shared local `2-8` pool across the `Sabum Qallatum` javelin block | 2 | 8 | `7 / 4` | The page image clearly shows this as the first of two separate `Sabum Qallatum` blocks. | scan-confirmed |
| Sabum Qallatum (light block) | Light infantry sling / Light infantry bow | ordinary | `Light infantry bow (max 2)`; shared local `0-6` pool across the `Sabum Qallatum` light block | 0 | 6 | 4 | The second `Sabum Qallatum` block is visually separate from the javelin block and carries its own `0-6` units column. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 4 | 3 | Visible near the end of the list before the camp entry. | scan-confirmed |
| Fortified camp | Fortified camp | special | - | 0 | 1 | 6 | Clearly readable at the end of the visible page slice. | scan-confirmed |

Allies:
- `Sumerian allies (List #1 Sumer and Akkad)`.
- `Zagros allies (List #3 Amorite Highlanders)`.
- `Elamite allies (List #4 Elamite)`.
- `Bedouin allies (List #17 Ancient Bedouin)`.


### List 6 - Kassite Babylonian

Source: `Ancient_Period.pdf` pages `3-4`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; `merged.pdf` OCR helper
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1595 - 750 BC`
Region / classification: `Ancient Period`
Command value: `+4`
Terrain: `Plain`

Notes and restrictions:
- The dedicated Ancient-period scan now clearly exposes the list header and strategist line.
- The visible strategist is `Nebuchadnezzar I (1124-1103 BC)`.
- The next dedicated scan page now exposes the first body block clearly enough to recover a conservative starter troop table, including the later `from 890 BC` replacement block.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4) +2` | 4 | 10 | 9 | The opening chariot row is one of the clearest entries in the List `6` body block. | scan-confirmed |
| Light cavalry bow | Light cavalry bow | mediocre | - | 0 | 1 | 4 | Visible directly under the opening chariot row. | scan-confirmed |
| Militia | Medium swordsmen | ordinary | `add support +1` | 4 | 12 | 6 | The main militia row is stable enough to preserve directly. | scan-confirmed |
| Bowmen | Bowmen / Light infantry bow | mediocre / ordinary | grouped local missile block with shared visible `0-6` units column | 0 | 6 | `5 / 4` | The page image shows the `Bowmen mediocre` and `Light infantry bow` lines in one local block with a shared `0-6` units column. | scan-confirmed |
| Arameans and hillmen | Javelinmen / Light infantry javelin | ordinary | javelinmen `downgrade to mediocre -2`; shared local `0-8` block | 0 | 8 | `7 / 4` | Browser-backed color ownership confirms `Javelinmen` plus `Light infantry javelin` form one local block with the visible `0-8` units column. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 4 | 4 | Browser-backed color ownership shows this is a new separate row below the `Arameans and hillmen` block. | scan-confirmed |
| Chariots with 4 horses (from 890 BC) | Heavy chariot impact | ordinary | `from 890 BC`; replaces some `Chariots with 2 horses`; `upgrade to elite +2` | 0 | 4 | 11 | The page explicitly shows this as a date-gated replacement block, not a free-standing parallel family. | scan-confirmed |
| Proto cavalry (from 890 BC) | Medium cavalry bow | ordinary | `from 890 BC`; `downgrade to mediocre -2` | 0 | 4 | 9 | Visible directly below the later heavy-chariot replacement row. | scan-confirmed |
| Fortifications | Fortifications | special | - | 0 | 6 | 1 | Clear pre-camp support line near the end of the visible table. | scan-confirmed |
| Fortified camp | Fortified camp | special | - | 0 | 1 | 6 | Readable at the foot of the visible slice. | scan-confirmed |

Options / replacements:
- From `890 BC`, replace some `Chariots with 2 horses` with `Chariots with 4 horses`.

Allies:
- `Assyrian allies (List #7 Assyrian)` from `890 BC`.
- `Bedouin allies (List #17 Ancient Bedouin)` from `890 BC`.
- `Aramean allies (List #26 Aramaean and Neo-Hittite)`.

Notes and restrictions:
- A maximum of `4` chariots in total can be upgraded to elite.
- `From 890 BC` is a real replacement layer: the heavier chariots and proto-cavalry are dated additions, not unconditional parallel base rows.

### List 7 - Assyrian

Source: `Ancient_Period.pdf` pages `4-5`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; `merged.pdf` OCR helper
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1365 - 745 BC`
Region / classification: `Ancient Period`
Command value: `+5`
Terrain: `Plain, Mountain`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and named strategist block on `merged.pdf` page `10`.
- The first troop lines show strong structure for `Chariots with 2 horses`, `Chariots with 3 horses (after 890 BC)`, `Pethalle cavalry (after 890 BC)`, `Asharittu warriors`, and `Hupshu warriors`.
- The page image now makes the opening chariot block more precise: `Chariots with 2 horses` and `Chariots with 3 horses (after 890 BC)` sit in one shared opening block, with the shared units column attached to the whole block and the heavier chariot line limited by `max 1/2`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4 in total) +2`; shared opening pool with `Chariots with 3 horses (after 890 BC)` | 4 | 12 | 9 | The page image shows the shared units column attached to the whole opening chariot block rather than to only one row. | scan-confirmed |
| Chariots with 3 horses (after 890 BC) | Heavy chariot impact | ordinary | `after 890 BC`; `max 1/2`; `upgrade to elite (max 4 in total) +2`; shared opening pool with `Chariots with 2 horses` | 4 | 12 | 11 | Preserve this as the heavier date-gated profile inside the same opening chariot block, not as a separate independent cap. | scan-confirmed |
| Light cavalry bow | Light cavalry bow | mediocre | - | 0 | 1 | 4 | The page image shows a separate local light-cavalry row between the opening chariot block and `Pethalle cavalry`. | scan-confirmed |
| Pethalle cavalry (after 890 BC) | Medium cavalry bow | ordinary | `after 890 BC`; `downgrade to mediocre -2` | 0 | 4 | 9 | One of the clearest gated cavalry rows on the page. | scan-confirmed |
| Asharittu warriors | Medium swordsmen impact | elite | `add support +1` | 2 | 6 | 9 | The visible units column stabilizes this block enough to preserve directly. | scan-confirmed |
| Hupshu warriors | Medium swordsmen support | ordinary | `mixed formation option 8`; `1/2 medium swordsmen`; `1/2 bowmen` | 0 | 12 | 7 | The mixed-formation note is visible in the same block and should stay attached here. | scan-confirmed |
| Bowmen | Bowmen / Light infantry bow | mediocre / ordinary | grouped local missile block with shared visible `0-6` units column | 0 | 6 | `5 / 4` | The page image shows this local bow block with one visible `0-6` units column. | scan-confirmed |
| Arameans | Javelinmen mediocre / Light infantry javelin | mediocre / ordinary | shared local white `0-2` block | 0 | 2 | `5 / 4` | The page image shows the named Arameans block as the white javelin section only. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 2 | 4 | Separate beige row below the white Arameans block. | scan-confirmed |
| Camels disguised as elephants with Sammuranat (810 to 806 BC) | Camelry | mediocre | `810 to 806 BC` | 0 | 2 | 6 | The special Sammuranat camel block is visible enough to preserve explicitly. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 2 | 3 | The levy row is clear near the end of the visible table. | scan-confirmed |
| Fortified camp | Fortified camp | special | - | 0 | 1 | 6 | Clearly visible at the table foot. | scan-confirmed |


### List 8 - Neo-Babylonian

Source: `Ancient_Period.pdf` pages `4-5`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; `merged.pdf` OCR helper
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `750 - 482 BC`
Region / classification: `Ancient Period`
Command value: `+5`
Terrain: `Plain`

Notes and restrictions:
- Identity and page anchor are secure from the index layer, but the current page `10` OCR is split between the close of an earlier list and the strong start of List `7`.
- A noisy line referencing `Neo-Babylonian allies (List #8 Neo-Babylonian)` appears on page `9`, but this is ally evidence only, not a safe List `8` header.
- The dedicated Ancient-period scan now secures the List `8` header block directly: `750 - 482 BC`, `Plain`, `Command +5`, and strategist `Nebuchadnezzar II (604-552 BC)` are all visible before the body continues onto the next page.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 4 horses | Heavy chariot impact | ordinary | `upgrade to elite +2` | 2 | 4 | 11 | The opening heavy-chariot row is one of the clearest lines in the List `8` body block. | scan-confirmed |
| Guard horsemen | Heavy cavalry bow | ordinary | - | 0 | 2 | 11 | The cavalry label is slightly noisy in OCR, but the row identity and heavy mounted profile are stable enough to preserve conservatively. | scan-confirmed |
| Chaldeans and Arameans (mounted block) | Medium cavalry bow / Light cavalry bow | ordinary | shared local `2-6` mounted block | 2 | 6 | `9 / 6` | OCR plus page image confirm one local mounted block with `Medium cavalry bow` and `Light cavalry bow` under a shared visible `2-6` units column. | scan-confirmed |
| Arab levies | Medium camelry / Medium camelry bow | ordinary / mediocre | shared local `0-6` camel block | 0 | 6 | `8 / 6` | OCR plus page image confirm the Arab levies label owns one local camel block with `Medium camelry` and `Medium camelry bow mediocre` under a shared `0-6` units column. | scan-confirmed |
| Foot guardsmen | Heavy swordsmen | elite | `add armour +2` | 0 | 2 | 10 | The elite foot-guard row is locally stable in the page body. | scan-confirmed |
| Greek mercenaries | Heavy spearmen | ordinary | `add armour +2` | 0 | 2 | 8 | The mercenary hoplite row is readable enough to preserve directly. | scan-confirmed |
| Chaldeans and Arameans (infantry block) | Bowmen / mixed units | ordinary | bowmen `downgrade to mediocre -2`; `upgrade to mixed units (max 6)`; mixed units are true `1/2 Medium swordsmen` and `1/2 Bowmen` | 4 | 16 | `7 / 8` | OCR plus page image confirm this is one local infantry block: base `Bowmen` under the shared `4-16` units column, with up to `6` upgraded to mixed units rather than a quantity split. | scan-confirmed |
| Light infantry tail | Light infantry bow / Light infantry sling | ordinary | shared local white `0-4` tail block | 0 | 4 | 4 | The page image shows `Light infantry bow` and `Light infantry sling` in one white local block with one visible `0-4` units column immediately below the `Chaldeans and Arameans` infantry block. | scan-confirmed |
| Chaldeans | Javelinmen / Light infantry javelin | ordinary | shared local `0-2` javelin block | 0 | 2 | `7 / 4` | OCR plus page image confirm one local `Chaldeans` block with `Javelinmen` and `Light infantry javelin` under the shared visible `0-2` units column. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 2 | 3 | The levy row is readable at the end of the visible slice. | scan-confirmed |
| Fortifications | Fortifications | special | - | 0 | 6 | 1 | Visible just above the note block. | scan-confirmed |

Allies:
- `Elamite allies (List #4 Elamite)`.
- `Bedouin allies (List #17 Ancient Bedouin)`.
- `Medes allies (List #28 Medes)`.


### List 9 - Assyrian Empire and Sargonid

Source: `Ancient_Period.pdf` page `6`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; `merged.pdf` OCR helper
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `745 - 609 BC`
Region / classification: `Ancient Period`
Command value: `+6`
Terrain: `Plain, Mountain`

Notes and restrictions:
- The lower half of `merged.pdf` page `11` clearly exposes the list name, date range, terrain, command value, and strategist block for the Sargonid army.
- The rendered page image now confirms the terrain as `Plain, Mountain` and makes the middle and lower troop blocks much more legible than the earlier OCR-only pass.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 4 horses | Heavy chariot impact | ordinary | `upgrade to elite +2` | 2 | 4 | 11 | The first row on page `11` is one of the clearest early Sargonid rows. | scan-confirmed |
| Horsemen | Medium cavalry bow / Heavy cavalry bow | ordinary | heavy variant `max 4`; `upgrade to elite (max 2) +2`; shared visible `2-8` horsemen block | 2 | 8 | `9 / 11` | The page image shows one local horsemen block with a shared `2-8` units column across the medium and heavy cavalry profiles. | scan-confirmed |
| Cimmerians | Light cavalry bow | ordinary | - | 0 | 2 | 6 | The page image resolves this as a clean standalone row below the horsemen block. | scan-confirmed |
| Scouts on camels | Light camelry bow | mediocre | - | 0 | 1 | 5 | The unit label, quality, and local `0-1` units column are now visible in the page image. | scan-confirmed |
| Foot guardsmen | Medium swordsmen elite / Heavy swordsmen elite | elite | heavy variant `add armour +2`; `add support +1` visible in the same local elite foot block | 0 | 2 | `8 / 10` | The page image shows one local elite foot block with medium and heavy swordsmen profiles under the shared `0-2` units column. | scan-confirmed |
| Line infantry | Medium swordsmen / Heavy swordsmen / mixed units | ordinary | `add support +1`; the whole local color block is one shared `2-8` choice set, including `1/2 Medium swordsmen + 1/2 Bowmen` and `1/2 Heavy swordsmen + 1/2 Bowmen` mixed-unit options | 2 | 8 | `6 / 8 / 8 / 10` | User calibration confirms that all rows inside this same color block are alternative ways to fill the shared `2-8` slots. | scan-confirmed |
| Poor infantry | Medium swordsmen mediocre / Heavy swordsmen mediocre | mediocre | `add support +1` | 0 | 4 | `4 / 6` | The poor-infantry block is clearly readable below the line-infantry section. | scan-confirmed |
| Egyptians and Kushites | Bowmen | ordinary | `downgrade to mediocre -2`; local bowmen block only | 0 | 2 | 7 | User calibration confirms the label belongs only to the bowmen row; the following light-infantry rows are separate color blocks. | scan-confirmed |
| Light infantry bow / Light infantry sling | Light infantry bow / Light infantry sling | ordinary | shared beige `0-4` block | 0 | 4 | 4 | With no color break between them, these remain one shared beige light-infantry block. | scan-confirmed |
| Javelinmen | Javelinmen / Light infantry javelin | ordinary | visible local `0-2` block | 0 | 2 | `7 / 4` | The lower block shows `Javelinmen` with `Light infantry javelin` directly below in one local section. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 2 | 3 | The levy row is readable at the end of the visible slice. | scan-confirmed |
| Fortifications | Fortifications | special | - | 0 | 6 | 1 | The fortifications row is visible just above the camp row. | scan-confirmed |
| Fortified camp | Fortified camp | special | - | 0 | 1 | 6 | The final camp row is visible at the foot of the table. | scan-confirmed |

### List 10 - Old and Middle Kingdom Egyptian

Source: `ArmyLists1-82.pdf` p.12; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.12 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `3000 - 1550 BC`
Region / classification: `Ancient Egypt`
Command value: `+4`
Terrain: `Plain, Desert`

Notes and restrictions:
- OCR clearly exposes the list header, date range, terrain, command value, and the introductory period split between `Old Kingdom (3000 to 2260 BC)` and `Middle Kingdom (2260 to 1550 BC)`.
- The rendered page image now exposes most of the visible troop table clearly enough to normalize the first full visible slice conservatively.
- The period split is historical description only; it does not currently imply extra sub-list restrictions beyond the explicit `from 1640 BC` troop line.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Guardsmen and Sherden | Medium swordsmen `2HW` elite / Heavy swordsmen `2HW` elite | elite | visible opening elite block | 0 | 4 | `9 / 11` | The page image confirms the two `2HW` elite profiles and the visible `0-4` units column. | scan-confirmed |
| Light chariot bow (from 1640 BC) | Light chariot bow | elite | `from 1640 BC`; shared opening white `0-4` block with `Guardsmen and Sherden` | 0 | 4 | 11 | User calibration confirms this row belongs to the same white block and shares the visible `0-4` units column with `Guardsmen and Sherden`. | scan-confirmed |
| Warriors | Medium swordsmen impact | ordinary | - | 4 | 12 | 7 | The `Warriors` row is cleanly readable in the visible troop table. | scan-confirmed |
| Archers | Bowmen | ordinary | `downgrade to mediocre -2` | 4 | 12 | 7 | This row is readable enough to preserve as a first structured transcription candidate. | scan-confirmed |
| Conscripts | Medium swordsmen | mediocre | - | 0 | 8 | 4 | The page image makes this row and its `0-8` units column readable. | scan-confirmed |
| Nubians | Bowmen / Light infantry bow | ordinary | bowmen `upgrade to elite (max 2) +2`; local `0-4` block | 0 | 4 | `7 / 4` | The visible right-hand column shows one local `Nubians` block with formed bowmen and `Light infantry bow`. | scan-confirmed |
| Libyans and Egyptians | Javelinmen / Light infantry javelin | ordinary | local `0-4` block | 0 | 4 | `7 / 4` | The page image shows a distinct local block for `Libyans and Egyptians` below the `Nubians` block. | scan-confirmed |
| Bedouins | Light infantry sling | ordinary | - | 0 | 2 | 4 | The `Bedouins` tail row is visible below `Libyans and Egyptians`. | scan-confirmed |
| Pharaoh in litter | Pharaoh in litter | special | independent special camp form | 0 | 1 | 2 | User calibration confirms this is its own row and a special camp form. | scan-confirmed |


### List 11 - Nubian

Source: `ArmyLists1-82.pdf` p.12; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.12 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
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
| Warriors with bow | Bowmen / Light infantry bow | ordinary | bowmen `upgrade to elite (max 4) +2`; shared white `8-32` bow block | 8 | 32 | `7 / 4` | User calibration confirms `Light infantry bow` belongs to the same white `8-32` block as the formed bowmen row. | scan-confirmed |
| Fanatic warriors | Medium swordsmen impetuous | ordinary | `upgrade to elite +2` | 0 | 6 | 6 | The row label, impetuous trait, points, and units are all visible in the page image. | scan-confirmed |
| Javelinmen | Javelinmen / Light infantry javelin | ordinary | shared white `0-6` javelin block | 0 | 6 | `7 / 4` | User calibration confirms `Light infantry javelin` belongs to the same white `0-6` block as `Javelinmen`. | scan-confirmed |

### List 12 - Libyan

Source: `ArmyLists1-82.pdf` p.12; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.12 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `3000 BC - 70 AD`
Region / classification: `Ancient Egypt`
Command value: `+2`
Terrain: `Desert`

Notes and restrictions:
- OCR clearly exposes the list header and the first sequence of time-gated notes such as `From 1250 BC`, `From 1208 to 651 BC`, and `From 650 BC`.
- The rendered page image now makes the opening warrior block and all visible date-gated replacement rows legible enough for a conservative table.
- Keep the three visible date-gated replacement blocks attached to their exact historical windows during later normalization.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Libyan warriors | Javelinmen | ordinary | `downgrade to mediocre -2`; separate white `8-32` block | 8 | 32 | 7 | User calibration confirms this is its own white block, separate from the following bowmen block. | scan-confirmed |
| Bowmen | Bowmen | ordinary | `downgrade to mediocre -2`; separate beige block | 0 | 4 | 7 | User calibration confirms the bowmen row is a separate beige block after `Libyan warriors`. | scan-confirmed |
| Light infantry javelin | Light infantry javelin | ordinary | separate white `2-12` block | 2 | 12 | 4 | User calibration confirms this is its own white block, not grouped with `Light infantry bow`. | scan-confirmed |
| Light infantry bow | Light infantry bow | ordinary | separate beige `0-4` block | 0 | 4 | 4 | User calibration confirms this is a separate beige row after the white `Light infantry javelin` block. | scan-confirmed |
| Chariots with 2 horses (from 1250 BC) | Light chariot bow | ordinary | `from 1250 BC`; `upgrade to elite +2` | 0 | 4 | 9 | The date-gated chariot row is clearly visible with its own `0-4` units column. | scan-confirmed |
| Medium swordsmen impetuous (from 1208 to 651 BC) | Medium swordsmen impetuous | ordinary | `from 1208 to 651 BC`; replaces some warriors; `upgrade to elite (max 4) +2` | 4 | 12 | 6 | The page image shows this replacement block with a visible `4-12` units column. | scan-confirmed |
| Light chariot javelin (from 650 BC) | Light chariot javelin | ordinary | `from 650 BC`; replaces all chariots; `upgrade to elite (max 4) +2` | 2 | 8 | 8 | The later replacement row is visible with a `2-8` units column. | scan-confirmed |
| Garamantes (after 200 BC) | Light cavalry javelin | ordinary | `after 200 BC`; replace all chariots | all | all | 6 | User calibration confirms this is the final one-row historical replacement block before the end-of-list notes. | scan-confirmed |

### List 13 - Hyksos

Source: `ArmyLists1-82.pdf` p.13; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.13 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1650 - 1546 BC`
Region / classification: `Ancient Egypt`
Command value: `+4`
Terrain: `Plain, Desert`

Notes and restrictions:
- The primary color scan on printed page `98` is now the controlling source for this list and makes the beige/white block structure readable enough for a stronger starter table.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4)` | 2 | 8 | 9 | The opening chariot row is readable enough to preserve conservatively. | scan-confirmed |
| Light cavalry bow | Light cavalry bow | mediocre | - | 0 | 1 | 4 | This is a separate beige row directly below the opening chariot block. | scan-confirmed |
| Warriors | Medium swordsmen impact | ordinary | - | 4 | 12 | 7 | The white warrior block is clearly readable in the primary scan. | scan-confirmed |
| Bowmen | Bowmen | ordinary | - | 0 | 2 | 7 | This is a separate beige row after `Warriors`. | scan-confirmed |
| Canaanite and Amorite warriors | Medium swordsmen / Javelinmen | ordinary | shared white `0-8` block | 0 | 8 | `6 / 7` | User calibration confirms `Medium swordsmen` and `Javelinmen` are the shared white block here. | scan-confirmed |
| Libyan light infantry javelin | Light infantry javelin | ordinary | separate beige row below the white Canaanite/Amorite block | 0 | 4 | 4 | User calibration confirms this is a new beige block, not part of the white block above. | scan-confirmed |
| Ianu and Libyan skirmishers | Light infantry bow / Light infantry sling | ordinary | shared white `0-4` block | 0 | 4 | 4 | User calibration confirms this is one shared white tail block. | scan-confirmed |
| Egyptian levies | Levy | ordinary | - | 0 | 2 | 3 | This is the final visible troop row before the note and ally line. | scan-confirmed |

Allies:
- `Egyptian allies (List #10 Old and Middle Kingdom Egyptian)`.

Notes and restrictions:
- The `Egyptian light chariot` text below the table is an illustration caption, not part of the army-list rules text.

### List 14 - New Kingdom Egyptian

Source: `ArmyLists1-82.pdf` p.13; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.13 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `1550 - 1070 BC`
Region / classification: `Ancient Egypt`
Command value: `+5`
Terrain: `Plain, Desert`

Notes and restrictions:
- The primary color scan on printed page `98` now exposes the first full visible troop table for this list and is the controlling source for the reconstruction below.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 6) +2` | 4 | 12 | 9 | The opening chariot row is clearly readable in the primary scan. | scan-confirmed |
| Light cavalry bow | Light cavalry bow | mediocre | - | 0 | 1 | 4 | Separate beige row below the chariots. | scan-confirmed |
| Egyptian guardsmen | Heavy swordsmen `2HW` elite / Sherden guardsmen `Heavy swordsmen impact elite` | elite | shared white `0-2` elite block | 0 | 2 | `11 / 11` | User calibration confirms both guardsmen rows belong to the same white block. | scan-confirmed |
| Warriors | Medium swordsmen impact / Medium spearmen | ordinary | shared white `2-8` core block | 2 | 8 | 7 | User calibration confirms this is one shared white block rather than two separate row caps. | scan-confirmed |
| Warriors with two handed axes | Medium swordsmen `2HW` | ordinary | - | 0 | 2 | 7 | Distinct row immediately below the core warrior block. | scan-confirmed |
| Sherden warriors | Medium swordsmen impetuous | ordinary | - | 0 | 6 | 6 | Separate row in the next white block. | scan-confirmed |
| Libyan warriors | Medium swordsmen impetuous | ordinary | - | 0 | 4 | 6 | Separate row directly below `Sherden warriors`. | scan-confirmed |
| Egyptian archers | Bowmen | ordinary | `downgrade to mediocre -2` | 2 | 8 | 7 | This is a beige bowmen block with its own downgrade note. | scan-confirmed |
| Syro-Canaanites | Javelinmen / Light infantry javelin | ordinary | shared white `0-4` block | 0 | 4 | `7 / 4` | User calibration confirms this is one white block. | scan-confirmed |
| Light infantry bow | Light infantry bow | ordinary | separate beige `0-4` block | 0 | 4 | 4 | User calibration confirms this is a new beige block below `Syro-Canaanites`. | scan-confirmed |
| Fortified camp | Fortified camp | special | - | 0 | 1 | 6 | The final camp row is visible at the foot of the table. | scan-confirmed |

Allies:
- `Sea Peoples allies (List #24 Sea Peoples)` from `1176 to 1143 BC`.

Notes and restrictions:
- `Strategists: Thutmosis III (1479-1425 BC), Ramesses III (1184-1153 BC)`.

### List 15 - Libyan Egyptian

Source: `ArmyLists1-82.pdf` p.14; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.14 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: ocr-assisted, spreadsheet-crosschecked
Date range: `945 - 700 BC`
Region / classification: `Ancient Egypt`
Command value: `+3`
Terrain: `Plain, Desert`

Notes and restrictions:
- The primary color scan on printed page `99` now exposes the opening and middle table blocks clearly enough to replace most of the earlier OCR-only starter rows.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4) +2` | 2 | 8 | 9 | The primary scan makes the points and units columns readable here. | scan-confirmed |
| Medium cavalry | Medium cavalry | mediocre | - | 0 | 3 | 5 | Distinct white cavalry row. | scan-confirmed |
| Light cavalry bow | Light cavalry bow | mediocre | - | 0 | 2 | 4 | Distinct beige cavalry row after `Medium cavalry`. | scan-confirmed |
| Meshwesh Libyan warriors | Medium swordsmen impetuous / Heavy swordsmen impetuous | ordinary | `upgrade to elite (all or none) +2`; shared `4-8` block | 4 | 8 | `6 / 8` | The scan shows one named white block with medium and heavy impetuous variants. | scan-confirmed |
| Sherden guardsmen / Egyptian guardsmen | Heavy swordsmen `2HW` elite / Heavy spearmen elite | elite | shared white `0-2` elite block | 0 | 2 | `11 / 10` | User calibration confirms these belong to the same white elite block. | scan-confirmed |
| Egyptian warriors | Medium swordsmen mediocre | mediocre | separate white `1-4` row | 1 | 4 | 4 | User calibration confirms this is its own white row. | scan-confirmed |
| Egyptian archers | Bowmen mediocre | mediocre | separate beige `1-4` row | 1 | 4 | 5 | User calibration confirms this is the following beige row. | scan-confirmed |
| Libu warriors | Medium swordsmen impetuous | ordinary | - | 0 | 4 | 6 | Visible as its own white row. | scan-confirmed |
| Bedouins and Palestinians | Javelinmen mediocre / Light infantry javelin | mediocre / ordinary | shared local `0-4` block | 0 | 4 | `5 / 4` | The primary scan shows this as one local mixed light-troop block. | scan-confirmed |
| Nubians and Libyans | Light infantry bow | ordinary | - | 0 | 4 | 4 | User calibration confirms this label covers only this one row. | scan-confirmed |


### List 16 - Kushite Egyptian

Source: `ArmyLists1-82.pdf` p.14; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.14 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `850 - 660 BC`
Region / classification: `Ancient Egypt`
Command value: `+4`
Terrain: `Plain, Desert`

Notes and restrictions:
- The primary color scan on printed page `99` exposes the full visible Kushite table and its local note block clearly enough to replace the earlier OCR-only starter rows.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 or 4 horses | Light chariot armour bow / Heavy chariot impetuous | ordinary | `upgrade to elite +2`; shared opening block | 2 | 4 | `11 / 10` | The color scan makes the shared chariot block readable. | scan-confirmed |
| Kushite horsemen | Medium cavalry / Heavy cavalry | ordinary | heavy cavalry `max 4`; shared white `2-8` block | 2 | 8 | `7 / 9` | Both cavalry rows sit inside one named block. | scan-confirmed |
| Kushite scouts | Light cavalry javelin | ordinary | - | 0 | 2 | 6 | Separate white row below the horsemen block. | scan-confirmed |
| Kushite Bowmen | Bowmen | ordinary | - | 4 | 12 | 7 | Distinct beige bowmen row. | scan-confirmed |
| Kushite warriors | Medium swordsmen | ordinary | - | 0 | 4 | 6 | Separate white infantry row. | scan-confirmed |
| Libyan warriors | Javelinmen / Light infantry javelin | ordinary | shared beige `0-4` block | 0 | 4 | `7 / 4` | The named block owns both the javelinmen and light infantry javelin rows. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 4 | 4 | Separate white row after the Libyan warriors block. | scan-confirmed |
| Light infantry bow | Light infantry bow | ordinary | - | 0 | 4 | 4 | Final beige light infantry row before the Egyptian contingent block. | scan-confirmed |
| Egyptian troops (730 to 660 BC) | Light chariot armour bow / Heavy chariot impact | ordinary | shared contingent block | 0 | 4 | 11 | The scan shows one shared `0-4` block for both Egyptian chariot profiles. | scan-confirmed |
| Egyptian troops (730 to 660 BC) | Medium cavalry mediocre | mediocre | - | 0 | 2 | 5 | Separate white contingent row. | scan-confirmed |
| Egyptian troops (730 to 660 BC) | Medium swordsmen mediocre | mediocre | - | 1 | 4 | 4 | Separate beige contingent row. | scan-confirmed |
| Egyptian troops (730 to 660 BC) | Bowmen mediocre | mediocre | - | 1 | 2 | 5 | Final visible contingent row. | scan-confirmed |

Allies:
- `Egyptian allies (List #15 Libyan Egyptian)` before `730 BC`.

Options / replacements:
- `Egyptian troops (730 to 660 BC)` are a dated contingent block within the list rather than part of the base Kushite rows.

Notes and restrictions:
- `Egyptian troops` must all be in the same corps under the command of an Egyptian commander.
- Only one commander can be included in a `Kushite horsemen` unit.


### List 17 - Ancient Bedouin

Source: `ArmyLists1-82.pdf` p.15; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.15 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `3000 - 300 BC`
Region / classification: `Middle East`
Command value: `+2`
Terrain: `Desert, Steppe`

Notes and restrictions:
- The primary color scan on printed page `100` exposes the full Ancient Bedouin table and note block clearly enough to reconstruct the visible structure scan-first.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warriors on foot | Javelinmen / Medium swordsmen (`from 2500 BC`) | ordinary | `downgrade to mediocre (max 8) -2`; shared white `8-32` block | 8 | 32 | `7 / 6` | The scan shows the original foot warriors and the later medium-swordsmen variant inside one shared core block. | scan-confirmed |
| Warriors with swords | Medium swordsmen impetuous | ordinary | - | 0 | 4 | 6 | Separate beige row. | scan-confirmed |
| Light infantry javelin | Light infantry javelin | ordinary | - | 0 | 8 | 4 | Distinct white row below `Warriors with swords`. | scan-confirmed |
| Bowmen | Bowmen / Light infantry bow | ordinary | `downgrade to mediocre -2` on the bowmen row; shared beige `0-6` block | 0 | 6 | `7 / 4` | The scan shows one local missile block with a shared units column. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 4 | 4 | Final pre-1000 BC white row. | scan-confirmed |
| Replace some warriors on foot by warriors on camels | Medium camelry / Medium camelry bow mediocre | ordinary / mediocre | `After 1000 BC` replacement block | 4 | 16 | 8 | The dated block introduces camel-mounted replacements with one shared units column. | scan-confirmed |
| Scouts on camels | Light camelry bow mediocre | mediocre | - | 0 | 4 | 5 | Separate beige camel-scout row. | scan-confirmed |
| Bowmen with tethered camels | Bowmen | ordinary | `downgrade to mediocre -2`; `add stakes +1` | 0 | 6 | 7 | Separate white row in the post-1000 BC section. | scan-confirmed |

Options / replacements:
- `After 1000 BC`, replace some `Warriors on foot` by `warriors on camels`.

Allies:
- `Mesopotamian allies (List #1 Sumer and Akkad)` before `2000 BC`.
- `Assyrian allies (List #9 Assyrian Empire and Sargonid)` from `681 to 669 BC`.
- `Syrian allies (List #18 Syrian City States)` before `2200 BC`.

Notes and restrictions:
- Bowmen were sometimes protected from enemy cavalry by kneeling camels. The effect is equivalent to `stakes`.


### List 18 - Syrian City States

Source: `ArmyLists1-82.pdf` p.15; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.15 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `2800 - 2200 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Plain, Mountain, Desert`

Notes and restrictions:
- The primary color scan on printed page `100` exposes the visible Syrian City States table and note block clearly enough to replace the earlier OCR-first starter rows.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4-wheeled battle cars | Heavy chariot | ordinary | - | 0 | 2 | 9 | The opening chariot row is one of the clearest Syrian City States lines. | scan-confirmed |
| Light cavalry javelin | Light cavalry javelin | mediocre | - | 0 | 1 | 4 | Readable as a separate mounted skirmisher row beside the battle cars. | scan-confirmed |
| Guardsmen with axes | Medium swordsmen impact | ordinary | - | 0 | 2 | 7 | The color scan shows a single named row with no separate quality adjective. | scan-confirmed |
| Militia | Medium spearmen / Heavy spearmen | mediocre | `add pavise +1`; `upgrade to ordinary (max 1/2) +2`; shared beige `4-8` block | 4 | 8 | `5 / 6` | The scan shows both militia profiles inside one shared block. | scan-confirmed |
| Bowmen | Bowmen | mediocre | `upgrade to ordinary (max 4) +2` | 4 | 12 | 5 | This is a clear ranged row in the opening block. | scan-confirmed |
| Javelinmen | Javelinmen | ordinary | `downgrade to mediocre -2` | 2 | 12 | 7 | The beige javelinmen row has its own units column and downgrade option. | scan-confirmed |
| Light infantry sling / Light infantry bow | Light infantry sling / Light infantry bow | ordinary | shared white `0-8` block | 0 | 8 | 4 | The scan shows sling and bow together in one shared light-infantry block. | scan-confirmed |
| Light infantry javelin | Light infantry javelin | ordinary | - | 0 | 4 | 4 | Separate beige tail row. | scan-confirmed |

Allies:
- `Sumerian allies (List #1 Sumer and Akkad)`.
- `Bedouin allies (List #17 Ancient Bedouin)`.

Notes and restrictions:
- Heavy chariots dismount as `medium swordsmen impact` with no armour.


### List 19 - Oman and Gulf States

Source: `ArmyLists1-82.pdf` p.15 or p.16 via printed index anchor `100`; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` nearby OCR pages `15-16`; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: scan-first, spreadsheet-crosschecked
Date range: `2800 - 312 BC`
Region / classification: `Middle East`
Command value: `+2`
Terrain: `Plain, Desert`

Notes and restrictions:
- The primary color scan on printed pages `100-101` exposes the header, the main troop table, the `Makkan after 1300 BC` module, and the later `From 1000 BC` additions clearly enough for a scan-first reconstruction.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warriors | Medium swordsmen / Javelinmen | ordinary | `downgrade to mediocre (max 8) -2`; shared opening `6-24` block | 6 | 24 | `6 / 7` | The first visible Oman block shares one units column across formed warriors and javelinmen. | scan-confirmed |
| Warriors with sword | Medium swordsmen impetuous | ordinary | - | 0 | 8 | 6 | Separate beige row on printed page `101`. | scan-confirmed |
| Light cavalry javelin | Light cavalry javelin | mediocre | - | 0 | 1 | 4 | Separate white mounted row. | scan-confirmed |
| Light infantry javelin | Light infantry javelin | ordinary | `upgrade to elite +1` | 2 | 6 | 4 | Separate beige row with its own upgrade line. | scan-confirmed |
| Light infantry bow | Light infantry bow | ordinary | - | 0 | 6 | 4 | Separate white tail row before the Makkan header. | scan-confirmed |
| Makkan after 1300 BC | Medium swordsmen impetuous | ordinary | `replace all warriors`; `upgrade to elite (max 2) +2` | all | all | 6 | This bold dated module replaces the base `Warriors` block rather than creating a new slot. | scan-confirmed |
| Makkan after 1300 BC | Bowmen | mediocre | - | 2 | 12 | 5 | Separate beige row within the Makkan module. | scan-confirmed |
| Horsemen | Medium cavalry | mediocre | `From 1000 BC` addition | 0 | 3 | 5 | Distinct later beige row. | scan-confirmed |
| Warriors on camels | Medium camelry / Medium camelry bow | ordinary / mediocre | shared white `0-8` block; `From 1000 BC` addition | 0 | 8 | 8 | The scan shows both camel warrior profiles inside one shared block. | scan-confirmed |
| Light camelry bow | Light camelry bow | mediocre | `From 1000 BC` addition | 0 | 2 | 5 | Separate beige tail row. | scan-confirmed |

Options / replacements:
- `Makkan after 1300 BC` replaces all base `Warriors` with `Medium swordsmen impetuous`.
- `From 1000 BC`, the list adds `Horsemen`, camel warriors, and `Bedouin allies`.

Allies:
- `Bedouin allies (List #17 Ancient Bedouin)` from `1000 BC`.
- `Babylonian allies (List #6 Kassite Babylonian)` before `1000 BC` and not with the `Makkan` option.


### List 20 - Hittite

Source: `ArmyLists1-82.pdf` p.16; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.16 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `1680 - 1180 BC`
Region / classification: `Middle East`
Command value: `+5`
Terrain: `Plain, Mountain`

Notes and restrictions:
- The primary color scan on printed page `101` exposes both the pre-`1380 BC` base table and the `Hittite Empire from 1380 BC` replacement block clearly enough for a scan-first reconstruction.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hittite chariots (before 1380 BC) | Light chariot javelin / Light chariot bow | ordinary | javelin variant `max 1/2`; `add armour +2`; `upgrade to elite (max 4 in total) +2`; shared `2-8` block | 2 | 8 | `8 / 9` | The scan makes the full opening chariot block readable. | scan-confirmed |
| Scouts | Light cavalry bow | mediocre | - | 0 | 1 | 4 | Separate beige scout row. | scan-confirmed |
| Guardsmen | Medium swordsmen elite / Medium spearmen elite | elite | shared white `0-2` block | 0 | 2 | `8 / 9` | The elite guard block has one shared units column across both profiles. | scan-confirmed |
| Hittites warriors | Medium swordsmen / Medium spearmen | ordinary | shared beige `4-16` block | 4 | 16 | `6 / 7` | The scan shows one core infantry block with two formed profiles. | scan-confirmed |
| Syro-Canaanites and Bedouins | Javelinmen mediocre / Light infantry javelin | mediocre / ordinary | shared white `2-6` block | 2 | 6 | `5 / 4` | One named local block spanning formed and light javelin profiles. | scan-confirmed |
| Bowmen mediocre / Light infantry bow | Bowmen mediocre / Light infantry bow | mediocre / ordinary | shared beige `0-4` block | 0 | 4 | `5 / 4` | One mixed missile block with a shared units column. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 2 | 4 | Separate white tail row. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 2 | 3 | Separate beige tail row. | scan-confirmed |
| Hittite Empire from 1380 BC | Heavy chariot impact | ordinary | `replace some Hittite chariots`; `upgrade to elite (max 4 in total) +2` | 0 | 8 | 11 | The dated empire block is a rules-bearing replacement layer, not a flat extra troop row. | scan-confirmed |
| Hittite Empire from 1380 BC | Syro-Canaanite chariots | ordinary | `Light chariot javelin (max 1/2) 8`; `Light chariot bow 9`; `add armour +2`; shared `0-6` block | 0 | 6 | `8 / 9` | The scan shows this as one named chariot block inside the empire section. | scan-confirmed |
| Hittite Empire from 1380 BC | Ugarit chariots | ordinary | `Heavy chariot impetuous (max 2)` | 0 | 6 | 10 | Printed inside the same white empire chariot area as the Syro-Canaanite chariots. | scan-confirmed |
| Gasgans | Medium swordsmen impetuous | ordinary | - | 0 | 4 | 6 | Separate beige row after the empire chariot block. | scan-confirmed |
| Anatolians | Javelinmen | ordinary | - | 0 | 2 | 7 | Final visible white row. | scan-confirmed |

Options / replacements:
- `Hittite Empire from 1380 BC` replaces some early Hittite chariots with `Heavy chariot impact` and introduces later linked chariot families.

Allies:
- `Mitanni allies (List #21 Hurri-Mitanni)` are explicitly visible inside the post-`1380 BC` block.

Notes and restrictions:
- `Strategists: Mursili I (1620-1590 BC), Suppiluliuma (1380-1336 BC)`.


### List 21 - Hurri-Mitanni

Source: `ArmyLists1-82.pdf` p.16; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.16 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `1600 - 1250 BC`
Region / classification: `Middle East`
Command value: `+4`
Terrain: `Plain`

Notes and restrictions:
- The primary color scan on printed pages `101-102` exposes the opening Hurri-Mitanni table and its left-column continuation clearly enough for a scan-first reconstruction.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 8) +2` | 6 | 16 | 9 | The opening chariot block is clear in the primary scan. | scan-confirmed |
| Light cavalry bow | Light cavalry bow | mediocre | - | 0 | 1 | 4 | Separate beige row below the chariots. | scan-confirmed |
| Shukituhli | Medium swordsmen | ordinary | `add support +1` | 2 | 6 | 6 | Separate white named row. | scan-confirmed |
| Aveluti qashati | Bowmen / Light infantry bow | ordinary | shared beige `2-6` block | 2 | 6 | `7 / 4` | The continuation on printed page `102` shows both profiles in one local block. | scan-confirmed |
| Alik ilki in mixed formation | `1/2` Medium swordsmen, `1/2` Bowmen | ordinary | `replace some Shukituhli and Aveluti qashati` | 0 | 6 | 8 | The scan explicitly shows a mixed-unit replacement block, not two alternative rows. | scan-confirmed |
| Javelinmen mediocre / Light infantry javelin | Javelinmen mediocre / Light infantry javelin | mediocre / ordinary | shared beige `0-4` block | 0 | 4 | `5 / 4` | The continuation shows one shared javelin block. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 2 | 4 | Separate white tail row. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 2 | 3 | Final beige tail row before the note block. | scan-confirmed |

Options / replacements:
- `Alik ilki in mixed formation` replaces some `Shukituhli` and `Aveluti qashati`.

Allies:
- `Bedouin allies (List #17 Ancient Bedouin)`.
- `Hittite allies (List #20 Hittite)` after `1350`.
- `Canaanite allies (List #22 Syria, Canaan and Ugarit)` before `1350`.


### List 22 - Syria, Canaan and Ugarit

Source: `ArmyLists1-82.pdf` p.17; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.17 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `1595 - 1100 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Plain, Desert`

Notes and restrictions:
- The primary color scan on printed page `102` exposes the full visible Syria, Canaan and Ugarit table clearly enough to replace the earlier OCR-first draft.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 6 in total) +2` | 4 | 16 | 9 | The opening chariot block is clear in the primary scan. | scan-confirmed |
| Light cavalry bow | Light cavalry bow | mediocre | - | 0 | 1 | 4 | Separate beige mounted row. | scan-confirmed |
| Royal guardsmen | Medium swordsmen impact elite / Bowmen pavise elite | elite | shared white `0-2` block | 0 | 2 | `9 / 10` | The scan shows a true dual-profile guard block. | scan-confirmed |
| Sherden and other mercenaries | Medium swordsmen impetuous | ordinary | - | 0 | 4 | 6 | Separate beige mercenary row. | scan-confirmed |
| Hupshu warriors | Medium swordsmen | ordinary | - | 0 | 4 | 6 | Separate white core infantry row. | scan-confirmed |
| Apiru javelinmen | Javelinmen / Light infantry javelin | ordinary | `downgrade to mediocre -2` on the javelinmen row; light infantry javelin `max 6`; shared beige `2-12` block | 2 | 12 | `7 / 4` | The beige block holds both the formed and light javelin profiles. | scan-confirmed |
| Hupshu archers | Bowmen / Light infantry bow | ordinary | `downgrade to mediocre -2` on the bowmen row; shared white `2-6` block | 2 | 6 | `7 / 4` | The white archer block includes both formed and light bow profiles. | scan-confirmed |

Allies:
- `Egyptian allies (List #14 New Kingdom Egyptian)`.
- `Mitanni allies (List #21 Hurri-Mitanni)` before `1340 BC`.

Notes and restrictions:
- A maximum of `6` light and or heavy chariots can be upgraded to elite.


### List 23 - Ancient Hebrew

Source: `ArmyLists1-82.pdf` p.17; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.17-18 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `1250 - 587 BC`
Region / classification: `Middle East`
Command value: `+3`, `+4 after 1000 BC`
Terrain: `Plain, Mountain`

Notes and restrictions:
- The primary color scan on printed pages `102-103` exposes the full visible Ancient Hebrew table clearly enough to replace the earlier cross-page OCR placeholders.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses / Chariots with 4 horses | Light chariot bow / Heavy chariot impact | ordinary | `1000 to 800` uses `Chariots with 2 horses`; `After 800` uses `Chariots with 4 horses`; mutually exclusive by date; `add armour +2` on the light chariot row; `upgrade to elite (max 4) +2`; shared dated `0-8` chariot block | 0 | 8 | `9 / 11` | The scan shows one opening chariot block with two dated profiles sharing the same slot. | scan-confirmed |
| Gibborim warriors | Medium swordsmen elite | elite | `add armour +2` | 0 | 2 | 8 | Separate beige elite row. | scan-confirmed |
| Simeonites, Ephraimites (before 1000) | Medium swordsmen impetuous | ordinary | dated row | 2 | 6 | 6 | Separate white dated row. | scan-confirmed |
| Jewish warriors | Medium swordsmen / Javelinmen | ordinary | shared beige `4-24` block | 4 | 24 | `6 / 7` | The main warrior block shares one units column across formed and javelin profiles. | scan-confirmed |
| Cavalry (from 800 BC) | Light cavalry javelin / Medium cavalry | ordinary | dated shared white `0-2` block | 0 | 2 | `6 / 7` | The scan shows both cavalry profiles in one dated block. | scan-confirmed |
| Bedouins | Light camelry bow mediocre / Medium camelry bow mediocre | mediocre | shared beige `0-2` block | 0 | 2 | `5 / 8` | The Bedouin block contains both camel profiles. | scan-confirmed |
| Philistine mercenaries | Medium spearmen / Heavy spearmen | ordinary | shared white `0-2` block | 0 | 2 | `7 / 8` | The mercenary block is a formed-infantry contingent rather than a single mixed super-row. | scan-confirmed |
| Bowmen mediocre / Light infantry bow | Bowmen mediocre / Light infantry bow | mediocre / ordinary | shared beige `2-6` block | 2 | 6 | `5 / 4` | The missile block sits immediately below the Philistine mercenaries block. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 2 | 4 | 4 | Separate white tail row. | scan-confirmed |
| Ark of the Covenant | Sacred camp | special | - | 0 | 1 | 2 | Separate beige sacred-camp row. | scan-confirmed |

Allies:
- All visible allies are from `800 BC`.
- `Egyptian allies (List #15 Libyan Egyptian)`.
- `Egyptian allies (List #16 Kushite Egyptian)`.
- `Philistine allies (List #25 Philistine)`.
- `Aramean allies (List #26 Aramaean and Neo-Hittite)`.
- `Phoenician allies (List #32 Phoenicians of Cyprus)`.
- `Egyptian allies (List #57 Saitic Egyptian)`.

Notes and restrictions:
- `+3` before `1000 BC` and `+4` after `1000 BC` is a real date-gated command rule.

### List 24 - Sea Peoples

Source: `ArmyLists1-82.pdf` p.18; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.18 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `1208 - 1101 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Plain`

Notes and restrictions:
- The primary color scan on printed page `103` exposes the full visible Sea Peoples table and note block clearly enough to replace the earlier OCR-first placeholder rows.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warriors on chariots | Light chariot javelin | ordinary | `upgrade to elite +2` | 0 | 4 | 8 | Clear opening row on the left column. | scan-confirmed |
| Retinue warriors | Medium swordsmen impetuous elite / Heavy swordsmen impetuous elite | elite | shared white `0-6` block | 0 | 6 | `8 / 10` | The scan shows a dual-profile elite retinue block with one shared units column. | scan-confirmed |
| Common warriors | Medium swordsmen impetuous | ordinary | - | 6 | 24 | 6 | Separate beige core infantry row. | scan-confirmed |
| Javelinmen | Javelinmen / Light infantry javelin | ordinary | shared beige `0-6` block | 0 | 6 | `7 / 4` | The continuation on the right column shows both javelin profiles sharing one pool. | scan-confirmed |
| Women and children | Levy mediocre | mediocre | - | 0 | 4 | 2 | Separate white levy row. | scan-confirmed |
| Fortified camp | Fortified camp | special | - | 0 | 1 | 6 | Final beige support row. | scan-confirmed |

Allies:
- `Libyan allies (List #12 Libyan)`.

Notes and restrictions:
- `Light chariot javelin` dismount as `medium swordsmen impetuous`.


### List 25 - Philistine

Source: `ArmyLists1-82.pdf` p.18; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.18 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `1100 - 600 BC`
Region / classification: `Middle East`
Command value: `+4`
Terrain: `Plain`

Notes and restrictions:
- The primary color scan on printed page `103` exposes nearly the full visible Philistine table, including the dated `From 800 BC` block and the local note block.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4) +2` | 2 | 10 | 9 | The opening Philistine chariot block is one of the clearest rows at the page bottom. | scan-confirmed |
| Elite warriors | Heavy spearmen elite | elite | `add armour +2` | 0 | 4 | 10 | Separate beige elite block. | scan-confirmed |
| Warriors | Medium spearmen | ordinary | - | 4 | 12 | 7 | White warrior block. | scan-confirmed |
| Javelinmen mediocre / Light infantry javelin | Javelinmen mediocre / Light infantry javelin | mediocre / ordinary | `upgrade to ordinary (max 4) +2` on the javelinmen row; shared beige `2-8` block | 2 | 8 | `5 / 4` | Beige light-troop block following the separate warriors row. | scan-confirmed |
| Gibborim mercenaries | Medium swordsmen elite | elite | `add armour +2` | 0 | 2 | 8 | Clear separate white mercenary block. | scan-confirmed |
| Bowmen | Bowmen / Light infantry bow | ordinary | shared beige `0-4` block | 0 | 4 | `7 / 4` | The scan shows one local missile block with a shared units column. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 2 | 4 | Separate white tail row. | scan-confirmed |
| Light cavalry javelin / Medium cavalry | Light cavalry javelin / Medium cavalry | ordinary | `From 800 BC`; shared `0-2` block | 0 | 2 | `6 / 7` | The dated block adds both cavalry profiles in one shared slot. | scan-confirmed |

Options / replacements:
- `From 800 BC`, add `Egyptian allies (List #15 Libyan Egyptian)`, `Egyptian allies (List #16 Kushite Egyptian)`, and the dated cavalry block.

Allies:
- `Canaanite allies (List #22 Syria, Canaan & Ugarit)`.
- `Aramean allies (List #26 Aramaean & Neo-Hittite)`.
- `Phoenician allies (List #32 Phoenicians of Cyprus)`.


### List 26 - Aramaean and Neo-Hittite

Source: `ArmyLists1-82.pdf` p.19; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.19 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `1100 - 710 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Plain, Mountain`

Notes and restrictions:
- The primary color scan on printed page `104` exposes the full visible Aramaean and Neo-Hittite table and the dated `After 890 BC` module clearly enough to replace the earlier OCR-first placeholder block.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4 in total) +2` | 4 | 12 | 9 | The opening chariot block is clear in the primary scan. | scan-confirmed |
| Bedouins | Light camelry bow mediocre / Medium camelry bow mediocre | mediocre | shared white `0-2` block | 0 | 2 | `5 / 8` | The scan shows both camel profiles in one named block. | scan-confirmed |
| Guardsmen | Medium spearmen elite / Heavy spearmen elite | elite | shared beige `0-2` block | 0 | 2 | `9 / 10` | The elite spear guard block has one shared units column. | scan-confirmed |
| Aramaean spearmen | Javelinmen / Medium spearmen | ordinary | medium-spearmen profile `max 4`; shared white `2-16` block | 2 | 16 | 7 | The named block contains both the formed and javelin profiles. | scan-confirmed |
| Bowmen mediocre | Bowmen mediocre | mediocre | - | 2 | 6 | 5 | Separate beige bowmen row. | scan-confirmed |
| Light infantry bow / Light infantry sling | Light infantry bow / Light infantry sling | ordinary | shared white `0-6` block | 0 | 6 | 4 | The light infantry tail sits in one shared white block. | scan-confirmed |
| Chariots with 3 horses | Heavy chariot impact | ordinary | `After 890 BC`; `replace some chariots with 2 horses`; `upgrade to elite (max 4 in total) +2` | 2 | 6 | 11 | The dated module introduces the heavier chariot replacement. | scan-confirmed |
| Proto cavalry | Medium cavalry bow | ordinary | `After 890 BC`; `downgrade to mediocre -2` | 0 | 2 | 9 | Separate dated cavalry row. | scan-confirmed |

Options / replacements:
- `After 890 BC`, `Hebrew allies (List #23 Ancient Hebrew)` and `Phoenician allies (List #32 Phoenicians of Cyprus)` become available.
- `After 890 BC`, replace some `Chariots with 2 horses` with `Chariots with 3 horses`.

Allies:
- `Hebrew allies (List #23 Ancient Hebrew)` after `890 BC`.
- `Phoenician allies (List #32 Phoenicians of Cyprus)` after `890 BC`.


### List 27 - Urartu

Source: `ArmyLists1-82.pdf` p.19; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.19 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `900 - 590 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Mountain`

Notes and restrictions:
- The primary color scan on printed page `104` exposes the full visible Urartu table, including the dated `From 780 BC` and `From 750 BC` modules, clearly enough for a scan-first reconstruction.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 2) +2` | 0 | 4 | 9 | Base chariot row before the dated heavier-chariot addition. | scan-confirmed |
| Chariots with 4 horses | Heavy chariot impact | ordinary | `From 780 BC`; `upgrade to elite +2` | 0 | 4 | 11 | The scan shows this as the later heavy-chariot row in the opening chariot area. | scan-confirmed |
| Proto cavalry | Medium cavalry bow | ordinary | `downgrade to mediocre -2` | 2 | 6 | 9 | Separate cavalry row before the later replacement block. | scan-confirmed |
| Cimmerians | Light cavalry bow | ordinary | - | 0 | 2 | 6 | Separate light cavalry row. | scan-confirmed |
| Royal and provincial infantry | Medium swordsmen | ordinary | - | 4 | 16 | 6 | Core infantry row. | scan-confirmed |
| Archers | Bowmen | ordinary | `downgrade to mediocre -2` | 2 | 8 | 7 | Separate bowmen row before the shield-bearer replacement line. | scan-confirmed |
| Archers with shield bearers | `1/2` Medium swordsmen, `1/2` Bowmen | ordinary | `replace some archers` | 0 | 4 | 8 | The scan shows an explicit mixed-unit replacement block. | scan-confirmed |
| Provincial levy | Medium swordsmen mediocre / Light infantry bow | mediocre / ordinary | shared local block | 0 | 4 | 4 | The scan shows a combined provincial-levy area with formed and light profiles. | scan-confirmed |
| Mananean highlanders | Javelinmen / Light infantry javelin | ordinary | shared local block | 0 | 4 | `7 / 4` | The highlander block follows as a distinct local group. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 2 | 3 | Separate tail row. | scan-confirmed |
| Fortified camp | Fortified camp | special | - | 0 | 1 | 6 | Final support row. | scan-confirmed |
| Medium cavalry bow / Heavy cavalry bow | Medium cavalry bow / Heavy cavalry bow | ordinary | `From 750 BC`; `replace all proto cavalry`; heavy profile `max 4` | 2 | 8 | `9 / 11` | The later cavalry block replaces the earlier proto cavalry row. | scan-confirmed |
| Qurbuti guardsmen | Medium swordsmen elite / Heavy swordsmen elite | elite | `add armour +2`; `add support +1`; shared white `0-2` block | 0 | 2 | `8 / 10` | The dated guard block is clearly visible at the foot of the list. | scan-confirmed |

Options / replacements:
- `From 780 BC`, `Chariots with 4 horses` become available.
- `From 750 BC`, replace all `Proto cavalry` with the later `Medium cavalry bow / Heavy cavalry bow` block.

Allies:
- `Aramean allies (List #26 Aramaean & Neo-Hittite)` from `780 to 750 BC`.
- `Median allies (List #28 Medes)` after `750 BC`.
- `Scythian allies (List #76 Scythian)` after `780 BC`.

Notes and restrictions:
- The early and later chariot rows are separate white/beige dated entries, not one unresolved blended slot.

### List 28 - Medes

Source: `ArmyLists1-82.pdf` p.20; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.20 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `835 - 550 BC`
Region / classification: `Middle East`
Command value: `+3`, `+4 from 626 BC`
Terrain: `Plain, Mountain`

Notes and restrictions:
- The primary color scan on printed page `105` exposes the full visible Mede table and note block clearly enough to replace the earlier OCR-first draft.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Horsemen | Medium cavalry bow / Heavy cavalry bow | ordinary | heavy profile `max 6`; `upgrade to elite (max 6) +2`; shared `4-16` block | 4 | 16 | `9 / 11` | The scan shows both cavalry profiles in one opening block. | scan-confirmed |
| Light cavalry bow | Light cavalry bow | ordinary | - | 0 | 6 | 6 | Separate beige cavalry row. | scan-confirmed |
| Heavy spearmen / Medium spearmen | Heavy spearmen mediocre / Medium spearmen | mediocre / ordinary | `add support +1`; shared white `2-8` block | 2 | 8 | `6 / 7` | The spear block is clearly one shared local pool. | scan-confirmed |
| Bowmen | Bowmen | ordinary | `downgrade to mediocre -2` | 0 | 6 | 7 | Separate beige bowmen row. | scan-confirmed |
| Armenians and hillmen | Javelinmen / Light infantry javelin | ordinary | `downgrade to mediocre -2` on the javelinmen row; shared white `0-6` block | 0 | 6 | `7 / 4` | The named hillmen block holds formed and light javelin profiles in one pool. | scan-confirmed |
| Light infantry bow | Light infantry bow | ordinary | - | 0 | 4 | 4 | Separate beige tail row. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 2 | 3 | Final tail row. | scan-confirmed |

Options / replacements:
- `Horsemen` can be fielded as `Medium cavalry bow` or `Heavy cavalry bow`, with the heavy profile capped at `max 6`.

Allies:
- `Babylonian allies (List #8 Neo-Babylonian)` from `626 BC`.
- `Assyrian allies (List #9 Assyrian Empire and Sargonid)` from `733 to 669 BC`.
- `Scythian allies (List #76 Scythian)`.

Notes and restrictions:
- `+3` normally and `+4 from 626 BC` is a real date-gated header rule.
- Keep the three ally windows attached to their exact historical timing during later normalization.

### List 29 - Phrygian

Source: `ArmyLists1-82.pdf` p.20; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.20 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `800 - 696 BC`
Region / classification: `Middle East`
Command value: `+3`
Terrain: `Plain, Mountain`

Notes and restrictions:
- The primary color scan on printed page `105` exposes the full visible Phrygian table and note block clearly enough to replace the earlier OCR-first placeholder rows.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot javelin / Heavy chariot impact | ordinary | `upgrade to elite (max 4) +2`; shared white `0-6` block | 0 | 6 | `8 / 11` | The opening chariot block clearly contains both profiles. | scan-confirmed |
| Medium cavalry | Medium cavalry | ordinary | `downgrade to mediocre -2` | 2 | 6 | 7 | Separate beige cavalry row. | scan-confirmed |
| Light cavalry javelin | Light cavalry javelin | ordinary | - | 0 | 2 | 6 | Separate white cavalry row. | scan-confirmed |
| Core infantry block | Medium swordsmen / Medium spearmen | ordinary | shared beige `6-24` block | 6 | 24 | `6 / 7` | The main Phrygian infantry block shares one units column across both formed profiles. | scan-confirmed |
| Bowmen / Light infantry bow | Bowmen / Light infantry bow | ordinary | shared white `0-4` block | 0 | 4 | `7 / 4` | The missile block shares one units column. | scan-confirmed |
| Light infantry javelin | Light infantry javelin | ordinary | - | 0 | 4 | 4 | Separate beige tail row. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 4 | 4 | Separate white tail row. | scan-confirmed |

Allies:
- `Urartu allies (List #27 Urartu)`.
- `Scythian allies (List #76 Scythian)`.

Notes and restrictions:
- Keep the Urartu and Scythian ally hooks as explicit list notes rather than flattening them into troop content.

### List 30 - Mycenaean

Source: `ArmyLists1-82.pdf` p.20-21; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.20-21 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `1600 - 1150 BC`
Region / classification: `Early Europe`
Command value: `+3`
Terrain: `Plain`

Notes and restrictions:
- The primary color scans on printed pages `105-106` expose the visible Mycenaean table and the later Trojan War sub-modules clearly enough for a scan-first reconstruction.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with Dendra armour and long spear (before 1250 BC) | Light chariot armour impact | ordinary | `max 4`; `upgrade to elite (max 4 in total) +2` | 2 | 12 | 10 | The early chariot row is clearly visible on printed page `105`. | scan-confirmed |
| Mycenaean chariots | Light chariot javelin | ordinary | `upgrade to elite (max 4 in total) +2` | 2 | 12 | 8 | The base chariot family follows directly after the early Dendra row. | scan-confirmed |
| Medium spearmen / Heavy spearmen | Medium spearmen / Heavy spearmen | ordinary | `add pavise +1`; shared white `6-16` block | 6 | 16 | `7 / 8` | The core spear block shares one units column. | scan-confirmed |
| Light infantry javelin | Light infantry javelin | ordinary | - | 0 | 6 | 4 | Separate white support row. | scan-confirmed |
| Bowmen / Light infantry bow | Bowmen / Light infantry bow | ordinary | shared beige `0-6` block | 0 | 6 | `7 / 4` | The missile block shares one units column. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 2 | 4 | Separate white tail row. | scan-confirmed |
| Fortified camp | Fortified camp | special | - | 0 | 1 | 6 | Final support row. | scan-confirmed |
| Achilles' Myrmidons | Medium swordsmen impact elite / Heavy swordsmen impact elite | elite | `After 1250 BC, Trojan War - Achaean`; `add armour +2`; shared `0-2` block | 0 | 2 | `9 / 11` | The named heroic contingent is clearly visible on printed page `106`. | scan-confirmed |
| Nestor's Pylian chariots | Light chariot armour impact | ordinary | `After 1250 BC, Trojan War - Achaean`; `upgrade to elite +2` | 0 | 1 | 10 | Separate named chariot contingent. | scan-confirmed |
| Nestor's Pylian spearmen | Heavy spearmen support | ordinary | `After 1250 BC, Trojan War - Achaean`; `add pavise +1` | 0 | 4 | 9 | Separate named infantry contingent. | scan-confirmed |
| Sarpedon's Lukka warriors | Medium swordsmen impact | ordinary | `After 1250 BC, Trojan War - Trojan` | 0 | 2 | 7 | Separate Trojan-period named contingent. | scan-confirmed |
| Thracian mercenaries | Javelinmen | ordinary | `After 1250 BC, Trojan War - Trojan` | 0 | 3 | 7 | Separate Trojan-period mercenary row. | scan-confirmed |

Options / replacements:
- Before `1250 BC`, use `chariots with Dendra armour and long spear` as the distinct early chariot family.
- After `1250 BC`, the list gains distinct `Trojan War - Achaean` and `Trojan War - Trojan` named sub-blocks.

Notes and restrictions:
- One commander can be included in a `Myrmidon` unit to represent `Achilles` and or in a chariot to represent `Nestor`.
- `Pylian` chariots and spearmen must be commanded by `Nestor` and `Myrmidons` by `Achilles`.
- Chariots dismount as `medium spearmen with armour` if the chariot has armour.
- After `1250 BC`, the named `Trojan War - Achaean` and `Trojan War - Trojan` sub-groups are additive contingent blocks; the printed page shows no `replace` wording against the base spear family.

### List 31 - Geometric Greek

Source: `ArmyLists1-82.pdf` p.21 and printed index `106`; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.21 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: scan-first, spreadsheet-crosschecked
Date range: `1150 - 650 BC`
Region / classification: `Early Europe`
Command value: `+2`
Terrain: `Plain, Mountain`

Notes and restrictions:
- The primary color scan on printed page `106` exposes the full Geometric Greek table and the dated `Before 900 BC` and `After 725 BC` hooks clearly enough to replace the OCR-first starter rows.
- The list ends cleanly before the `List 32` header on the same page; no later right-column material belongs back in `List 31`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Light chariots | Light chariot javelin | ordinary | `upgrade to elite +2` | 0 | 2 | 8 | Separate opening chariot row. | scan-confirmed |
| Cavalry from 900 BC | Medium cavalry | ordinary | `downgrade to mediocre -2` | 0 | 4 | 7 | Dated cavalry addition. | scan-confirmed |
| Warriors | Medium swordsmen | ordinary | `add support (max 6) +1` | 6 | 24 | 6 | Core infantry row. | scan-confirmed |
| Warriors (before 900 BC) | Medium swordsmen impetuous | ordinary | `Before 900 BC, replace up to half warriors` | 0 | 12 | 6 | Dated replacement row. | scan-confirmed |
| Javelinmen / Light infantry javelin | Javelinmen / Light infantry javelin | ordinary | shared white `2-6` block | 2 | 6 | `7 / 4` | The javelin block shares one units column. | scan-confirmed |
| Light infantry bow / Light infantry sling | Light infantry bow / Light infantry sling | ordinary | shared beige `0-4` block | 0 | 4 | 4 | The light-infantry tail is one shared block. | scan-confirmed |
| Warriors after 725 BC | Heavy spearmen mediocre | mediocre | `After 725 BC, replace some warriors` | 0 | 24 | 6 | Dated later replacement row. | scan-confirmed |

### List 32 - Phoenicians of Cyprus

Source: `ArmyLists1-82.pdf` p.21; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.21 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`; no direct exact-name hit yet in `Errata_ADG_V4_English.pdf`
Status: scan-first, spreadsheet-crosschecked
Date range: `1000 - 330 BC`
Region / classification: `Early Europe`
Command value: `+3`
Terrain: `Plain, Forest`

Notes and restrictions:
- The primary color scans on printed pages `106-107` expose the full visible Cyprus table and the dated replacement blocks clearly enough to replace the earlier OCR-first draft.
- `After 900 BC` and the later `From 800 to 550 BC` mercenary block can both apply; the latter is a narrower later window inside the broader post-`900 BC` phase.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `add armour +2`; `upgrade to elite (max 4) +2` | 2 | 6 | 9 | The opening chariot row is clear in the primary scan. | scan-confirmed |
| Warriors | Medium swordsmen / Medium spearmen | ordinary | shared white `6-16` block | 6 | 16 | `6 / 7` | The main warrior block shares one units column across both formed profiles. | scan-confirmed |
| Bowmen / Light infantry bow | Bowmen / Light infantry bow | ordinary | shared beige `2-6` block | 2 | 6 | `7 / 4` | The missile block is clearly shared. | scan-confirmed |
| Light infantry javelin | Light infantry javelin | ordinary | - | 0 | 3 | 4 | Separate white tail row. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 3 | 4 | Separate beige tail row. | scan-confirmed |
| Heavy artillery | Heavy artillery | ordinary | `After 350 BC` | 0 | 2 | 10 | Dated later artillery row. | scan-confirmed |
| Heavy chariot impact | Heavy chariot impact | ordinary | `After 900 BC`; `replace all chariots with 2 horses`; `upgrade to elite (max 4) +2` | all | all | 11 | The dated chariot replacement clearly uses `All`. | scan-confirmed |
| Medium cavalry | Medium cavalry | ordinary | `After 900 BC`; `downgrade to mediocre -2` | 0 | 3 | 7 | Later cavalry row. | scan-confirmed |
| Sardinian and Spanish mercenaries | Medium swordsmen / Medium swordsmen impetuous | ordinary | `From 800 to 550 BC`; shared `0-4` block | 0 | 4 | 6 | The mercenary sword profiles share one local block. | scan-confirmed |
| Spanish cavalry | Medium cavalry | ordinary | `From 800 to 550 BC` | 0 | 2 | 7 | Separate dated cavalry row. | scan-confirmed |
| Warriors after 680 BC | Heavy spearmen mediocre | mediocre | `After 680 BC, replace some warriors` | 0 | 16 | 6 | Later dated warrior replacement row. | scan-confirmed |
| Greek mercenaries from Egypt | Heavy spearmen | ordinary | `in 353 BC`; `upgrade to elite (max 1) +2` | 2 | 4 | 8 | The continuation on printed page `107` is clear enough to preserve directly. | scan-confirmed |

Options / replacements:
- `After 900 BC`, `replace all chariots with 2 horses` by `Heavy chariot impact`, with `upgrade to elite (max 4) +2` still visible in the same block.

Notes and restrictions:
- The opening historical note is readable enough to preserve that Phoenician settlement on Cyprus begins circa `1000 BC`, followed by Assyrian, Egyptian, Persian, and finally Alexandrian control.

Allies:
- `Asiatic Greek allies (List #60 Classical Greek)` after `700 BC`.

### List 33 - Celts

Source: `ArmyLists1-82.pdf` p.22; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.22 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: scan-first, spreadsheet-crosschecked
Date range: `1300 - 400 BC`
Region / classification: `Early Europe`
Command value: `+2`
Terrain: `Plain, Mountain, Forest`

Notes and restrictions:
- The primary color scan on printed page `107` exposes the full visible Celt table and note block clearly enough to replace the earlier OCR-first starter rows.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mounted nobles / Nobles on foot | Light chariot javelin / Medium swordsmen impetuous | ordinary | `upgrade to elite +2`; shared white `0-6` block | 0 | 6 | `8 / 6` | The opening noble block shares one units column across mounted and foot profiles. | scan-confirmed |
| Scouts | Light cavalry javelin | ordinary | - | 0 | 2 | 6 | Separate beige scout row. | scan-confirmed |
| Celtic warriors | Medium swordsmen impetuous | ordinary | - | 6 | 24 | 6 | Core warrior row. | scan-confirmed |
| Light infantry bow / Light infantry sling | Light infantry bow / Light infantry sling | ordinary | shared beige `2-6` block | 2 | 6 | 4 | The light infantry tail is one shared block. | scan-confirmed |
| Women and children | Levy mediocre | mediocre | - | 0 | 2 | 2 | Final camp-followers row. | scan-confirmed |

Notes and restrictions:
- `Light chariot javelin` dismount as `medium swordsmen impetuous`.

### List 34 - Indus Valley

Source: `ArmyLists1-82.pdf` p.22; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.22 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: scan-first, spreadsheet-crosschecked
Date range: `2700 - 1500 BC`
Region / classification: `Early Asia`, `Indian`
Command value: `+3`
Terrain: `Plain, Forest`

Notes and restrictions:
- The primary color scan on printed page `107` exposes the full visible Indus Valley table clearly enough to replace the earlier OCR-first grouped placeholders.
- The visible `after 700 BC` ally note and the nearby Greek mercenary/hoplite material belong to the preceding Cyprus continuation on the page, not to `List 34`.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Elephant | Elephant | ordinary | - | 0 | 1 | 13 | Separate opening row. | scan-confirmed |
| Guardsmen | Medium swordsmen `2HW` elite / Medium spearmen elite | elite | shared beige `0-4` block | 0 | 4 | 9 | The scan shows one elite guard block with a shared units column. | scan-confirmed |
| Core infantry block | Medium swordsmen / Medium spearmen | ordinary | `downgrade to mediocre -2`; shared white `4-12` block | 4 | 12 | `6 / 7` | The main infantry block clearly shares one units column. | scan-confirmed |
| Bowmen | Bowmen | ordinary | `downgrade to mediocre -2` | 4 | 12 | 7 | Separate beige bowmen row. | scan-confirmed |
| Hill tribesmen | Javelinmen / Light infantry javelin | ordinary | javelinmen `downgrade to mediocre -2`; shared white `0-4` block | 0 | 4 | `7 / 4` | The hill tribesmen block holds formed and light javelin profiles. | scan-confirmed |
| Light infantry sling / Light infantry bow | Light infantry sling / Light infantry bow | ordinary | shared beige `0-8` block | 0 | 8 | 4 | Separate tail block. | scan-confirmed |

### List 35 - Vedic India

Source: `ArmyLists1-82.pdf` p.22; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.22 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: scan-first, spreadsheet-crosschecked
Date range: `1500 - 500 BC`
Region / classification: `Early Asia`, `Indian`
Command value: `+3`
Terrain: `Plain, Forest`

Notes and restrictions:
- The primary color scan on printed page `107` exposes the full visible Vedic Indian table and note block clearly enough to replace the earlier OCR-first grouped placeholders.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 2 horses | Light chariot bow | ordinary | `upgrade to elite (max 6) +2` | 4 | 12 | 9 | The opening chariot row is clear in the primary scan. | scan-confirmed |
| War elephants | Elephant | ordinary | - | 0 | 2 | 13 | Separate elephant row. | scan-confirmed |
| Archers | Bowmen | ordinary | `downgrade to mediocre -2` | 4 | 16 | 7 | Separate bowmen row. | scan-confirmed |
| Warriors with two-handed sword | Medium swordsmen `2HW` | ordinary | - | 0 | 6 | 7 | Separate infantry row. | scan-confirmed |
| Light infantry bow | Light infantry bow | ordinary | - | 0 | 4 | 4 | Separate light infantry bow row. | scan-confirmed |
| Light infantry sling | Light infantry sling | ordinary | - | 0 | 2 | 4 | Separate light infantry sling row. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 4 | 3 | Final levy row. | scan-confirmed |

Notes and restrictions:
- OCR clearly exposes that war chariots were the favored weapon in the early Vedic historical note.
- The currently trusted dismount note belongs to `Chariots with 2 horses / Light chariot bow`, not to a separate `Mounted nobles` row.
- Do not preserve a generic `Light infantry support` grouping here; the calibrated reading is that `Light infantry bow` and `Light infantry sling` are separate rows.
- Chariots dismount as `medium swordsmen 2HW` as Vedic era nobles fought with heavy two-handed swords.


### List 36 - Erlitou Shang Chinese

Source: `ArmyLists1-82.pdf` p.23; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.23 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: scan-first, spreadsheet-crosschecked
Date range: `1700 - 1045 BC`
Region / classification: `Far East`, `Chinese`
Command value: `+3`
Terrain: `Plain, Forest`

Notes and restrictions:
- The primary color scan on printed page `108` exposes the full Erlitou Shang table and the later `Shang Dynasties, from 1300 BC` module clearly enough to replace the earlier OCR-first placeholders.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nobles before 1300 BC | Medium swordsmen bow elite | elite | `before 1300 BC` | 2 | 4 | 11 | The early noble row is clear in the primary scan. | scan-confirmed |
| Warriors with dagger-axe | Medium swordsmen | ordinary | `before 1300 BC` | 4 | 12 | 6 | Early formed infantry row. | scan-confirmed |
| Warriors with bow | Bowmen | ordinary | `before 1300 BC` | 4 | 12 | 7 | Early missile infantry row. | scan-confirmed |
| Militia with dagger-axe | Medium swordsmen mediocre | mediocre | `before 1300 BC` | 0 | 6 | 4 | Early militia row. | scan-confirmed |
| Militia with bow | Bowmen mediocre / Light infantry bow | mediocre / ordinary | `before 1300 BC`; shared white `0-6` block | 0 | 6 | `5 / 4` | The militia bow block shares one units column across formed and light profiles. | scan-confirmed |
| Levy | Levy | ordinary | `before 1300 BC` | 0 | 4 | 3 | Final early-period levy row. | scan-confirmed |
| Shang Dynasties from 1300 BC nobles | Light chariot bow elite | elite | `from 1300 BC`; `replace all nobles` | all | all | 11 | The later dynasty block replaces the earlier nobles row. | scan-confirmed |
| Royal guardsmen with long spear | Medium spearmen elite | elite | `from 1300 BC` | 0 | 2 | 9 | Separate later guard row. | scan-confirmed |
| Warriors with long spears | Medium spearmen | ordinary | `from 1300 BC` | 0 | 4 | 7 | Separate later spear row. | scan-confirmed |
| Barbarian allies (Jung, Di, Rong) | Medium swordsmen impetuous | ordinary | `from 1300 BC`; `upgrade to elite (max 1) +2` | 4 | 8 | 6 | Separate allied warrior row inside the barbarian module. | scan-confirmed |
| Barbarian allies (Jung, Di, Rong) | Bowmen mediocre / Light infantry bow | mediocre / ordinary | `from 1300 BC`; shared `0-4` block | 0 | 4 | `5 / 4` | The later ally module includes one shared missile block. | scan-confirmed |

Allies:
- `Barbarian allies (see list above)`.
- `Zhou allies (List #37 Zhou and Spring and Autumn Chinese)` from `1100 BC`.

Notes and restrictions:
- `Barbarian allies (Jung, Di, Rong)` are close allied contingents inside the list and should not require an allied general; allies listed separately in notes do.

### List 37 - Zhou and Spring and Autumn Chinese

Source: `ArmyLists1-82.pdf` p.23; `Ancient_Period.pdf` primary scan anchor; `merged.pdf` p.23 OCR helper; `Army_list_spreadsheet_V4 (1).xlsx` sheet `Armies V4`
Status: scan-first, spreadsheet-crosschecked
Date range: `1100 - 480 BC`
Region / classification: `Far East`, `Chinese`
Command value: `+4`
Terrain: `Plain, Forest`

Notes and restrictions:
- The primary color scan on printed page `108` exposes the full visible Zhou table and the `From 770 BC - Spring and Autumn` replacement module clearly enough to replace the earlier OCR-first placeholder rows.

Troop entries:
| Entry | Type | Quality | Abilities | Min | Max | Points | Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chariots with 4 horses (before 770 BC) | Light chariot bow / Heavy chariot impetuous | ordinary | light profile `max 4`; `upgrade to elite (max 4) +2`; shared `2-8` block | 2 | 8 | `9 / 10` | The opening chariot block is clear in the primary scan. | scan-confirmed |
| Tiger guards (before 770 BC) | Medium swordsmen impact elite | elite | - | 0 | 2 | 9 | Separate elite guard row. | scan-confirmed |
| Warriors with dagger-axe | Medium swordsmen | ordinary | `add support +1` | 4 | 16 | 6 | OCR keeps the core warrior row stable enough to preserve. | scan-confirmed |
| Bowmen | Bowmen | ordinary | `downgrade to mediocre -2` | 2 | 8 | 7 | The row is readable and locally stable. | scan-confirmed |
| Warriors with long spears | Medium spearmen | ordinary | `add support +1` | 0 | 4 | 7 | User calibration confirms this row belongs in `List 37`; unlike the similarly named row in `List 36`, this one carries the support option. | scan-confirmed |
| Light infantry bow | Light infantry bow | ordinary | - | 0 | 6 | 4 | Separate pre-770 tail row. | scan-confirmed |
| Levy | Levy | ordinary | - | 0 | 4 | 3 | Separate pre-770 levy row. | scan-confirmed |
| Heavy chariot impetuous | Heavy chariot impetuous | ordinary | `From 770 BC - Spring and Autumn`; `replace all chariots with 4 horses`; `upgrade to elite (max 4) +2` | 4 | 12 | 10 | Later-period chariot replacement row. | scan-confirmed |
| Medium swordsmen polearm | Medium swordsmen polearm | ordinary | `From 770 BC - Spring and Autumn`; `replace all warriors with dagger-axe`; `add support +1` | 4 | 12 | 7 | Later-period polearm replacement row. | scan-confirmed |
| Tribal auxiliaries | Medium swordsmen impetuous | ordinary | `From 770 BC - Spring and Autumn` | 0 | 4 | 7 | Later-period auxiliary row. | scan-confirmed |

Notes and restrictions:
- Strategists visible in the header are `Duke Wen (Jin 632 BC)` and `Sun Tzu (Wu 564-470 BC)`.
- Preserve the pre-`770 BC` troop hooks as date-gated list structure rather than flattening them into unconditional rows.
- `From 770 BC - Spring and Autumn` replaces only the explicitly named troop rows and adds `Tribal auxiliaries`; `Light infantry bow` and `Levy` remain available.

Options / replacements:
- `From 770 BC - Spring and Autumn`, replace all `chariots with 4 horses` by `Heavy chariot impetuous` `10`, `4-12`, with `upgrade to elite (max 4) +2`.
- `From 770 BC - Spring and Autumn`, replace all `warriors with dagger-axe` by `Medium swordsmen polearm` `7`, `4-12`, with `add support +1`.

Allies:
- `Barbarian allies (same list as for Erlitou Shang Chinese)` before `770 BC`.
- `Shang allies (List #36 Erlitou Shang Chinese)` before `1045 BC`.
