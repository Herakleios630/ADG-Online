# Placement Catalog V1

Status: Draft for approval (Lead / Phase Steward).

Purpose: Define a deterministic, reusable placement catalog so agents can place units quickly and precisely for scenario construction. This V1 catalog is also the future base for UI snap behavior, but V1 itself is agent-only.

## Scope

In scope (V1):

- Single unit placement against one anchor unit.
- Simple contacts only.
- Optional second reference for specific support aliases: front enemy of the anchor unit, only when exactly one such enemy exists.
- Deterministic, geometry-first placement patterns.
- Normalized intent language for prompts.
- Clear placement result status.

Out of scope (V1):

- Group placement and group conformation (deferred to post-P16 scope).
- Player-facing snap UX implementation.
- Automatic intent guessing from ambiguous free text.

## Terms

- Anker-Einheit / Anchor Unit: the reference target unit.
- Front-Gegner der Anker-Einheit / Anchor Front Enemy: the enemy unit currently in front contact with the anchor unit (used only as an alias reference for simple-support flank patterns).
- Einheit / Unit: the unit to place.
- Side labels (bilingual aliases): `front|vorderseite`, `left|links`, `right|rechts`, `rear|ruecken`.
- Corner labels: `FL`, `FR`, `RL`, `RR`.
- Contact pattern: a named geometric constraint set.

## Geometry Contract

Each unit must expose:

- Pose: center `xUd`, `yUd`, `rotationRadians`.
- Dimensions: `widthUd`, `depthUd`.
- Derived side segments: `front`, `left`, `right`, `rear`.
- Derived corners: `FL`, `FR`, `RL`, `RR`.

All contact checks are performed on derived edges/corners with epsilon tolerance.

Parallel rule (hard invariant):

- If a pattern says one side touches another side (example: `front` touches `left`), the two touching edges are treated as parallel line contacts.
- Corner constraints then define the shift along that parallel alignment.
- Angled or skewed contacts are not accepted for side-to-side touch in V1.

## Normalized Intent Language

Primary canonical sentence (German):

- `Stelle Einheit <UNIT_ID> als <PATTERN_NAME> an Anker-Einheit <ANCHOR_ID>.`

Primary canonical sentence (English):

- `Place Unit <UNIT_ID> as <PATTERN_NAME> at Anchor Unit <ANCHOR_ID>.`

Canonical examples:

- `Stelle Einheit A als linken Flankenangriff an Anker-Einheit B.`
- `Stelle Einheit A als rechten Flankenangriff an Anker-Einheit B.`
- `Stelle Einheit A als simple support links an Anker-Einheit B.`
- `Stelle Einheit A als simple support rechts an Anker-Einheit B.`
- `Stelle Einheit A als Rueckenangriff an Anker-Einheit B.`
- `Stelle Einheit A als vollen Frontkontakt an Anker-Einheit B.`
- `Stelle Einheit A als Frontkontakt links versetzt an Anker-Einheit B.`
- `Stelle Einheit A als Frontkontakt rechts versetzt an Anker-Einheit B.`
- `Stelle Einheit A als simple support Flanke links an Anker-Einheit B.`
- `Stelle Einheit A als simple support Flanke rechts an Anker-Einheit B.`
- `Stelle Einheit A als support am Front-Gegner links an Anker-Einheit B.`
- `Stelle Einheit A als support am Front-Gegner rechts an Anker-Einheit B.`
- `Place Unit A as left flank attack at Anchor Unit B.`
- `Place Unit A as right flank attack at Anchor Unit B.`
- `Place Unit A as simple support left at Anchor Unit B.`
- `Place Unit A as simple support right at Anchor Unit B.`
- `Place Unit A as rear attack at Anchor Unit B.`
- `Place Unit A as full front contact at Anchor Unit B.`
- `Place Unit A as left-offset front contact at Anchor Unit B.`
- `Place Unit A as right-offset front contact at Anchor Unit B.`
- `Place Unit A as simple support flank left at Anchor Unit B.`
- `Place Unit A as simple support flank right at Anchor Unit B.`
- `Place Unit A as support on anchor front enemy left at Anchor Unit B.`
- `Place Unit A as support on anchor front enemy right at Anchor Unit B.`

Optional strict machine form (internal):

- `place <UNIT_ID> pattern=<PATTERN_TOKEN> anchor=<ANCHOR_ID>`
- `place <UNIT_ID> pattern=<PATTERN_TOKEN> anchor=<ANCHOR_ID> ref=anchor|anchor-front-enemy`

Current P9 bridge implementation notes:

- Resolver and contract slice is implemented in `src/data/melee-drill-scenarios.js`, but melee drill scenario loading now uses stored final coordinates (no load-time placement chain execution).
- Scenario files should not persist runtime contact/support outcomes; combat meaning is derived later by engine/state from board geometry.
- Bridge payload fields per placement intent: `requestedPatternToken`, `patternToken`, `anchorUnitId`, `resolvedReferenceUnitId`, `refMode`, `status`, `sourceStatus`, `blockedReason`.
- P9 deterministic blocked reasons currently emitted by contract layer:
  - `non-simple-front-enemy-selection-deferred-post-p16`
  - `pattern-token-not-yet-routed-in-p9-03x`
  - `placement-ref-mode-unsupported`
  - `placement-anchor-missing`
  - `placement-unit-missing`

Pattern tokens:

- `simple-support-left`
- `simple-support-right`
- `flank-attack-left`
- `flank-attack-right`
- `rear-attack`
- `front-attack-full`
- `front-attack-left-offset`
- `front-attack-right-offset`
- `simple-support-flank-left`
- `simple-support-flank-right`

## Intent Mini Grammar (V1)

German parser form:

- `Stelle Einheit <UNIT_ID> als <PATTERN_NAME_DE> an Anker-Einheit <ANCHOR_ID>.`

English parser form:

- `Place Unit <UNIT_ID> as <PATTERN_NAME_EN> at Anchor Unit <ANCHOR_ID>.`

Allowed pattern names (German):

- `linken Flankenangriff`
- `rechten Flankenangriff`
- `simple support links`
- `simple support rechts`
- `Rueckenangriff`
- `voller Frontkontakt`
- `Frontkontakt links versetzt`
- `Frontkontakt rechts versetzt`
- `simple support Flanke links`
- `simple support Flanke rechts`
- `support am Front-Gegner links`
- `support am Front-Gegner rechts`

Allowed pattern names (English):

- `left flank attack`
- `right flank attack`
- `simple support left`
- `simple support right`
- `rear attack`
- `full front contact`
- `left-offset front contact`
- `right-offset front contact`
- `simple support flank left`
- `simple support flank right`
- `support on anchor front enemy left`
- `support on anchor front enemy right`

Normalization map (to tokens):

- `linken Flankenangriff` -> `flank-attack-left`
- `left flank attack` -> `flank-attack-left`
- `rechten Flankenangriff` -> `flank-attack-right`
- `right flank attack` -> `flank-attack-right`
- `simple support links` -> `simple-support-left`
- `simple support left` -> `simple-support-left`
- `simple support rechts` -> `simple-support-right`
- `simple support right` -> `simple-support-right`
- `Rueckenangriff` -> `rear-attack`
- `rear attack` -> `rear-attack`
- `voller Frontkontakt` -> `front-attack-full`
- `full front contact` -> `front-attack-full`
- `Frontkontakt links versetzt` -> `front-attack-left-offset`
- `left-offset front contact` -> `front-attack-left-offset`
- `Frontkontakt rechts versetzt` -> `front-attack-right-offset`
- `right-offset front contact` -> `front-attack-right-offset`
- `simple support Flanke links` -> `simple-support-flank-left`
- `simple support flank left` -> `simple-support-flank-left`
- `simple support Flanke rechts` -> `simple-support-flank-right`
- `simple support flank right` -> `simple-support-flank-right`
- `support am Front-Gegner links` -> `simple-support-flank-left` (alias with `ref=anchor-front-enemy`)
- `support on anchor front enemy left` -> `simple-support-flank-left` (alias with `ref=anchor-front-enemy`)
- `support am Front-Gegner rechts` -> `simple-support-flank-right` (alias with `ref=anchor-front-enemy`)
- `support on anchor front enemy right` -> `simple-support-flank-right` (alias with `ref=anchor-front-enemy`)

## Placement Result Status

- `exact`: all required constraints satisfied.
- `blocked`: requested pattern cannot be satisfied without violating hard constraints.
- `needs-source-check`: pattern is parsed, but source/rule closure is not complete for legal auto-placement claims.

V1 behavior:

- Deterministic only: no silent fallback to another pattern.
- If requested pattern is impossible, return `blocked` with diagnostics.

## Hard Constraints

- No footprint overlap.
- Requested edge and corner contacts must be true simultaneously.
- Any side-to-side contact is evaluated as parallel edge contact; corner rules define longitudinal offset only.
- Placement must preserve requested side/corner mapping exactly.
- No hidden auto-rotation after final solve.

## Contact Pattern Library (V1)

### 1) Simple Support Left

Required constraints:

- Unit `right` touches Anchor Unit `left`.
- Unit `FR` touches Anchor Unit `FL`.

### 2) Simple Support Right

Required constraints:

- Unit `left` touches Anchor Unit `right`.
- Unit `FL` touches Anchor Unit `FR`.

### 3) Flank Attack Left

Required constraints:

- Unit `front` touches Anchor Unit `left`.
- Unit `FL` touches Anchor Unit `FL`.

### 4) Flank Attack Right

Required constraints:

- Unit `front` touches Anchor Unit `right`.
- Unit `FR` touches Anchor Unit `FR`.

### 5) Rear Attack

Required constraints:

- Unit `front` touches Anchor Unit `rear`.
- Unit `FL` touches Anchor Unit `RL`.
- Unit `FR` touches Anchor Unit `RR`.

### 6) Front Attack Full Contact

Required constraints:

- Unit `front` touches Anchor Unit `front`.
- Unit `FR` touches Anchor Unit `FL`.
- Unit `FL` touches Anchor Unit `FR`.

### 7) Front Attack Left Offset

Required constraints:

- Unit `front` touches Anchor Unit `front`.
- Unit `FR` touches Anchor Unit `front`.
- Anchor Unit `FL` touches Unit `front`.

### 8) Front Attack Right Offset

Required constraints:

- Unit `front` touches Anchor Unit `front`.
- Unit `FL` touches Anchor Unit `front`.
- Anchor Unit `FR` touches Unit `front`.

### 9) Simple Support Flank Left

Required constraints:

- Unit `right` touches Anchor Unit `left`.
- Unit `right` touches Anchor Unit `FL`.

### 10) Simple Support Flank Right

Required constraints:

- Unit `left` touches Anchor Unit `right`.
- Unit `left` touches Anchor Unit `FR`.

### 11) Alias: Enemy Front Support Left

Precondition:

- Anchor Unit is in `front` to `front` contact with exactly one enemy unit.

Required constraints:

- Alias resolves to token `simple-support-flank-left` with `ref=anchor-front-enemy`.
- Apply pattern 9 constraints using Anchor Front Enemy as the reference target.

Blocked behavior:

- If Anchor Unit has zero or multiple front enemies, return `blocked` with reason `non-simple-front-enemy-selection-deferred-post-p16`.

### 12) Alias: Enemy Front Support Right

Precondition:

- Anchor Unit is in `front` to `front` contact with exactly one enemy unit.

Required constraints:

- Alias resolves to token `simple-support-flank-right` with `ref=anchor-front-enemy`.
- Apply pattern 10 constraints using Anchor Front Enemy as the reference target.

Blocked behavior:

- If Anchor Unit has zero or multiple front enemies, return `blocked` with reason `non-simple-front-enemy-selection-deferred-post-p16`.

## Status Matrix

| Pattern | Token | V1 Scope | Source Status | Notes |
| --- | --- | --- | --- | --- |
| Simple Support Left | `simple-support-left` | approved | needs-source-check | scenario builder deterministic placement; bilingual intent enabled |
| Simple Support Right | `simple-support-right` | approved | needs-source-check | mirror of left variant; bilingual intent enabled |
| Flank Attack Left | `flank-attack-left` | approved | needs-source-check | deterministic flank geometry; side-touch means parallel contact |
| Flank Attack Right | `flank-attack-right` | approved | needs-source-check | mirror of left variant; side-touch means parallel contact |
| Rear Attack | `rear-attack` | approved | needs-source-check | strict double-corner rear lock; bilingual intent enabled |
| Front Attack Full Contact | `front-attack-full` | approved | needs-source-check | full front lock with both front-corner constraints |
| Front Attack Left Offset | `front-attack-left-offset` | approved | needs-source-check | partial front alignment with right-corner-leading constraint |
| Front Attack Right Offset | `front-attack-right-offset` | approved | needs-source-check | mirror of left-offset variant |
| Simple Support Flank Left | `simple-support-flank-left` | approved | needs-source-check | side-contact support variant against anchor left side |
| Simple Support Flank Right | `simple-support-flank-right` | approved | needs-source-check | mirror flank-side support variant |
| Enemy Front Support Left (alias) | `simple-support-flank-left` | approved | needs-source-check | alias with `ref=anchor-front-enemy`; only simple single-front-enemy case in V1 |
| Enemy Front Support Right (alias) | `simple-support-flank-right` | approved | needs-source-check | alias with `ref=anchor-front-enemy`; only simple single-front-enemy case in V1 |
| Attach Right (group) | n/a | deferred | blocked | group scope deferred to post-P16 |
| Attach Left (group) | n/a | deferred | blocked | group scope deferred to post-P16 |

## Determinism and Mirroring Rule

Mirroring policy (approved by user):

- If a left variant exists, the right variant is allowed by default unless explicitly restricted by future source-verified exception.
- V1 contains both explicit left and right patterns to avoid hidden inference.

## Diagnostics Contract

Every placement attempt returns:

- requested pattern and ids,
- resolved target pose,
- status (`exact`, `blocked`, `needs-source-check`),
- per-constraint pass/fail list,
- first blocking reason when not exact.

## Examples

Example request:

- `Stelle Einheit U13 als linken Flankenangriff an Anker-Einheit U11.`

Expected interpretation:

- Pattern token: `flank-attack-left`
- Required contacts:
  - `U13.front` -> `U11.left`
  - `U13.FL` -> `U11.FL`

## Future Integration (Not V1 Implementation)

Planned reuse path:

1. Agent scenario builder uses this exact catalog first.
2. Later UI snap uses the same catalog as snap targets.
3. Conformation and advanced contact helpers reuse side/corner primitives from the same geometry layer.

## Approval Checklist

Before implementation work starts on tooling:

- Confirm final term choice (`Anchor Unit`, `Unit`) accepted.
- Confirm all V1 single-unit patterns accepted.
- Confirm status labels accepted.
- Confirm no group patterns in V1.
- Confirm canonical German and English intent sentences accepted.
- Confirm the side-touch parallel-orientation invariant accepted.
