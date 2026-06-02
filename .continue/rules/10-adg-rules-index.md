# ADG Rules Index – for rule-aware agents

> **IMPORTANT:** Do NOT load all rule files into context. Use this index to locate the
> relevant rule file, then read only that file with `filesystem_read_text_file`.

## How to use

When the user asks about a rules topic (e.g. "Prüfe ob das mit den Shooting-Regeln übereinstimmt"):

1. Match the topic against the **Keywords** column below.
2. Read the corresponding `docs/rules/<file>` with `filesystem_read_text_file`.
3. Also read `docs/rules/errata.md` if the topic might be affected by errata.
4. If anything remains unclear, read `docs/rules/open-verification.md` as last resort.

## Rule file index

| File | Topic | Keywords |
|------|-------|----------|
| `docs/rules/sequence-of-play.md` | Sequence of Play | turn structure, phase order, round, initiative |
| `docs/rules/standard-200.md` | Standard 200 Points | army size, 200 points, tournament standard |
| `docs/rules/units-and-bases.md` | Units & Bases | base size, unit type, basing, representation |
| `docs/rules/command.md` | Command & CP | command points, commander, CP range, in command |
| `docs/rules/terrain-and-setup.md` | Terrain & Setup | terrain placement, deployment, setup zones, ambush |
| `docs/rules/setup-source-notes.md` | Setup Source Notes | setup clarifications, deployment details |
| `docs/rules/hidden-info.md` | Hidden Information | hidden units, ambush markers, concealed |
| `docs/rules/movement.md` | Movement Rules | move distance, manoeuvre, march, advance, wheel, slide |
| `docs/rules/movement-source-notes.md` | Movement Source Notes | movement clarifications, move validation |
| `docs/rules/zoc.md` | Zone of Control | ZOC, zone of control, most threatening, ZOC exit |
| `docs/rules/charge.md` | Charge | charge declaration, charge path, charge reaction, uncontrolled charge |
| `docs/rules/conformation.md` | Conformation | conform, alignment, conforming after charge, shifting |
| `docs/rules/shooting.md` | Shooting | ranged combat, shooting modifiers, line of sight, support |
| `docs/rules/melee.md` | Melee (V1) | close combat V1, melee factors, resolution V1 |
| `docs/rules/melee-decision-matrix.md` | Melee Decision Matrix | melee matrix, combat factor lookup table |
| `docs/rules/rout-and-pursuit.md` | Rout & Pursuit | rout, broken units, pursuit, army rout |
| `docs/rules/errata.md` | Errata (V4) | errata, rule corrections, V4 changes |
| `docs/rules/open-verification.md` | Open Verification | unresolved rules questions, blocked items |
| `docs/rules/index.md` | Rules Knowledge Index | meta, source priority, verification workflow |

## Engine code mapping

When checking engine code against rules, also read the relevant `src/engine/<topic>/` files.
The rule files above are the **what**, the engine files are the **how**.

| Rule area | Engine directory |
|-----------|-----------------|
| Charge | `src/engine/charge/` |
| Command | `src/engine/command/` |
| Conformation | `src/engine/conformation/` |
| Geometry | `src/engine/geometry/` |
| Melee V1 | `src/engine/melee/` |
| Melee V2 | `src/engine/melee-v2/` |
| Movement | `src/engine/movement/` |
| Setup | `src/engine/setup/` |
| Shooting | `src/engine/shooting/` |
| Visibility | `src/engine/visibility/` |
| ZOC | `src/engine/zoc/` |
| State (shooting) | `src/state/p0-shooting.js` |
| State (melee V2) | `src/state/p9-melee-v2.js` |
| State (core) | `src/state/p0-state.js` |

## Source authority (pyramid)

1. `docs/source/konzepte/Errata_ADG_V4_English.pdf`
2. `docs/source/konzepte/Rules.pdf`
3. `docs/source/konzepte/ArmyLists1-82.pdf`
4. `docs/source/konzepte/Reference_Sheet_V4.pdf`

Always prioritise Errata over base rules. When in doubt, flag as `needs-source-check`.