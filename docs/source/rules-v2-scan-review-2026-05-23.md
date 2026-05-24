# Rules V2 Scan Review - 2026-05-23

Status: usable for Rules-v2 extraction; no immediate rescan request.

Primary source: `docs/source/new scan/Rules_Color_300DPI.pdf`

Review artifacts:

- Metrics: `docs/source/new scan/rules_color_review/scan_metrics.json`
- Summary: `docs/source/new scan/rules_color_review/scan_summary.txt`
- Contact sheets: `docs/source/new scan/rules_color_review/contact_1.png` through `contact_4.png`
- Targeted page renders: `docs/source/new scan/rules_color_review/single_pages/`

## Scan Metrics

- PDF pages: `86`
- Pages with embedded page images: `86`
- Embedded page-image profile: `2481 x 3506` px, matching the expected 300-DPI A4 scan quality.
- Pages with extracted text layer: `83`
- Page with no useful text layer: `86`, which is the back cover and not a rules-content blocker.
- Low-contrast metric pages: `2`, `12`, `13`, `14`, `18`.
- Visual review result for low-contrast pages: readable in targeted renders.

## Visual Verdict

The scan is good enough for source extraction. Normal text, two-column pages, yellow tables, yellow example boxes, black-background example panels, battlefield diagrams, captions, and reference-sheet pages are readable in contact sheets and targeted 180-DPI single-page renders.

The key extraction risk is not scan quality. The risk is source handling: OCR stream order, page-column order, and missed visual examples. `RULES_V2_todo.md` therefore requires full left-column then full right-column reading, all visual example extraction, and a separate example-completeness QA card.

Full-page renders in the review folder are not final rule examples. They exist for scan QA and inventory checks only. Final example assets must be focused, individual crops that can be embedded directly in `Rules_v2.md` and survive later Markdown-to-PDF export.

## Rule-Bearing Visual Assets To Treat As Source

- Yellow `Examples:` boxes and other yellow explanatory boxes.
- Yellow rule and reference tables.
- Black-background battlefield example panels.
- Movement, ZOC, charge, evade, conformation, shooting, melee, rout/pursuit, terrain, setup, flank-march, camp, and budget diagrams.
- Captions, labels, arrows, and legends directly attached to those examples.

## Follow-Up Requirement

The extraction pass, example inventory, first digest, source-lock wave, and first recalibration slice are now far enough along that `docs/source/Rules_v2.md` can serve as the working default source layer for hardened P7A2/P7B/P8/P9/P10/P11 planning.

Remaining gate:

- manual acceptance still decides whether the Rules-v2 corpus is treated as fully accepted project-wide rather than as a technically clean working default;
- unresolved questions must stay explicit in `docs/rules/open-verification.md` rather than being treated as closed by corpus completeness alone.