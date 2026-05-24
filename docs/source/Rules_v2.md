# AdG V4 Rules V2 Source Corpus

Status: Working default source layer for hardened rule-sensitive planning - RV2-01 routing, RV2-02 example inventory, RV2-03 first full digest, RV2-04 deep-pass source locks, and the first RV2-05A recalibration slice are agent-complete; manual acceptance gates remain pending before treating the corpus as fully accepted project-wide
Created: 2026-05-23
Primary source: docs/source/new scan/Rules_Color_300DPI.pdf
Authority chain: Konzepte/Errata_ADG_V4_English.pdf > docs/source/new scan/Rules_Color_300DPI.pdf > Konzepte/Rules.pdf > Konzepte/merged.pdf
Execution board: RULES_V2_todo.md

## Purpose

This file is the AI-readable rules corpus for the color-scan pass.

RV2-01 established reading order first. RV2-02 example extraction and RV2-03 first full digest are agent-complete. RV2-04 produced source-lock rule-area notes, and RV2-05A has already recalibrated the main downstream planning docs against them. For hardened areas, this file is now the working default lookup layer ahead of the older `docs/source/rules.md`, while manual acceptance still governs final project-wide signoff.

## Status Vocabulary

- `scan-confirmed`: section wording was checked directly against the rendered page image in the color scan.
- `ocr-assisted`: section wording is usable for routing and early digesting, but still needs a direct page-image pass before it should drive implementation.
- `errata-overridden`: the effective rule is controlled by errata, not the base page wording alone.
- `needs-source-check`: the section is too risky to trust yet without more direct page/image work.
- `scan-mapped`: page and column routing confirmed well enough for source-order extraction.
- `needs-visual-check`: routing is usable, but the page contains low contrast, a weak text layer, or a strong visual asset that must be read from the page image.
- `not-started`: no rule digest text has been written yet.

## Reading Contract

- Read the full left column first, then the full right column, then advance to the next printed page.
- Treat yellow boxes, yellow tables, black panels, captions, arrows, and legends as first-class source assets.
- Do not trust OCR stream order where two columns, full-width interruptions, or image-led examples exist.
- Use the routing table below as extraction guidance, not as final rule wording.

## Source-Order Routing Coverage Map

This table tracks routing readiness and visual-risk hotspots, not final digest completeness. A range may stay `needs-visual-check` here even after later digest entries become `scan-confirmed`, because the flag records that direct page-image reading was required.

| PDF pages | Working area | Routing status | Notes |
| --- | --- | --- | --- |
| 1 | front cover | scan-mapped | cover only |
| 2-4 | contents and front matter | scan-mapped | contents pages and front matter routing |
| 5-6 | overview and introduction | scan-mapped | overview, intro, and rules organisation |
| 7-8 | equipment and basing | needs-visual-check | basing diagrams and yellow examples visible |
| 9-11 | unit basics and etiquette | needs-visual-check | unit orientation, groups, etiquette |
| 12-22 | troops and unit characteristics | needs-visual-check | troop tables, examples, and characteristic pages |
| 23-28 | setup and command | needs-visual-check | setup, commanders, command range, CP, commander movement |
| 29-34 | movement and manoeuvre | needs-visual-check | movement geometry, slides, wheels, extension, contraction |
| 35-38 | zone of control | needs-visual-check | ZOC diagrams and exceptions |
| 39-41 | interpenetration and contact | needs-visual-check | interpenetration, burst through, contacting enemy |
| 42-46 | charge | needs-visual-check | charge procedure and uncontrolled charge examples |
| 47-49 | evade | needs-visual-check | blocked evade and evade direction diagrams |
| 50-54 | conformation and rally | needs-visual-check | conformation and shifting visuals are source-significant |
| 55-59 | shooting | needs-visual-check | rallying transition, LOS, shooting resolution visuals |
| 60-66 | melee and camp assault | needs-visual-check | melee support, modifiers, camp attack visuals |
| 67-69 | fortifications, rout, pursuit | needs-visual-check | fortifications, routed units, pursuit |
| 70-80 | terrain and setup sequence | needs-visual-check | terrain definitions, placement, camps, ambush, deployment, flank march |
| 81 | budget | needs-visual-check | budget page is visually heavy and needs manual page-image reading |
| 82-85 | optional rules and reference cards | scan-mapped | reduced format, big battles, cards, demoralisation, reference cards |
| 86 | back cover | scan-mapped | no useful rules text layer |

## RV2-01 Page And Column Routing Table

Status: `scan-mapped` with targeted `needs-visual-check` flags. Column anchors are OCR-assisted routing hints only.

| PDF page | Working area | Asset categories | Left-column anchor | Right-column anchor |
| ---: | --- | --- | --- | --- |
| 1 | front cover | front cover, dark panel candidate, weak text layer | I - I - -91 | no reliable text anchor |
| 2 | contents and front matter | two-column page, low-contrast check | 25, 80, 87; 15, 59 | L`ART DE LA GUERRE; EREEX |
| 3 | contents and front matter | two-column page | OVERVIEW.................".......................5; INTRODUCTION ..."..MM.."..M ......... 6 | Contacting enemy; SPECIAL MOVEMENTS ............................ 42 |
| 4 | contents and front matter | two-column page, yellow asset candidate, dark panel candidate | SFT"G UP ...........  ............ "...."... ....... 73; - preparation | L'ART DE LA GUERRE; Demoralisation rules |
| 5 | overview and introduction | two-column page | L'ART DE LA GUERRE; L'A7`f dc Jcz G#e77e first appeared in 2008. This fourth | REREEgw; The supreme art Of war is to subdue the enemy without fighting. Sun Tzu |
| 6 | overview and introduction | two-column page | at,; RULES 0RGANISATION | L'ART DE LA GUERRE; INTRO |
| 7 | equipment and basing | two-column page, yellow asset candidate | L'ART DE LA GUERRE; EQUIPMENT | also possible to base the figures on two half-depth; bases. The two bases are then joined together to |
| 8 | equipment and basing | two-column page, yellow asset candidate | HOW UNITS ARE; REPRESENTED | L'ART DE LA GUERRE; Units with missile support |
| 9 | unit basics and etiquette | two-column page | L'ART DE LA GUERRE; UNIT STATUS | UNIT ORIENTATION; Each unit has an orientation that defines a front (or |
| 10 | unit basics and etiquette | two-column page, yellow asset candidate, dark panel candidate | GROUPS 0F UNITS; in order to make movement easier, several units of | L'ART DE LA GUERRE; A group can be as many units deep as desired. |
| 11 | unit basics and etiquette | two-column page, yellow asset candidate | L'ART DE LA GUERRE; GAME EHQUETTE | Fair play; It is important to not forget that Z'Arf de J G#c7'7`e is |
| 12 | troops and unit characteristics | two-column page, low-contrast check | TROOP ATTRIBUTES; In Z'Arf dc J Gz/cr7'c all troops have five main | L'ART DE LA GUERRE; If you know the enemy and know yourself you need not fear the results of a hundred battles. Sun Tzu |
| 13 | troops and unit characteristics | two-column page, low-contrast check | L'ART DE LA GUERRE; TROOP DESCRIPTION | Medium infantry (MI); These troops typically have light or partial armour |
| 14 | troops and unit characteristics | two-column page, low-contrast check | hancisca or angon and those classified as J777pcfz/o7ts; ha`te the J77tpflcf ability. | L'ART DE LA GUERRE; Levy: These are civilians and combatants of little |
| 15 | troops and unit characteristics | two-column page | L'ART DE LA GUERRE; AIillery (AI) | I Combat factor of +1 against mounted, LI, LMI,; MI and Levy. |
| 16 | troops and unit characteristics | two-column page | Cataphracts (Ct); Cataphracts are warriors from the ancient period | L'ART DE LA GUERRE; Scythed chariots are fxpc7tczflbJc troops that have only |
| 17 | troops and unit characteristics | two-column page | L'ART DE LA GUERRE; SPECIAL ABILITIES | Armour and heavy armour; Some troops are better protected by metal armour |
| 18 | troops and unit characteristics | two-column page, yellow asset candidate, low-contrast check | Exples,; dl Unit A has the 2HW deility and unit 8 has the 2IIW | L'ART DE LA GUERRE; F#7.i.o#s Ofzrgc does not apply in the following cases: |
| 19 | troops and unit characteristics | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; Exapli A barbarian Oreavy swordsmen Impetuous) | Elephants: Elephants panic horses and camels.; Camels: Light cavalry, medium cavalry and |
| 20 | troops and unit characteristics | two-column page, yellow asset candidate | Pavise; L-hits equipped with a large shield or a pavise | L'ART DE LA GUERRE; Expendables |
| 21 | troops and unit characteristics | two-column page | L'ART DE LA GUERRE; DISMOUNTED TROOPS | cohesion points if the unit has J777pcf ability or is; J77ipcfwot/s,. otherwise as medium swordsmen. |
| 22 | troops and unit characteristics | two-column page, yellow asset candidate | UNIT CHARACTERISTICS TABLES; llllm I - | L'ART DE LA GUERRE; _I-.:rfu-antry |
| 23 | setup and command | two-column page | L'ART DE LA GUERRE; GAME SETUP | W E ,PIAY; He will win who, prepared himselfi waits to take the enemy unprepared. Sun Tzu |
| 24 | setup and command | two-column page, yellow asset candidate | COMMANDERS; =Ih army must have a co7#7777iczer-1.71-ch{.e/ and two | L'ART DE LA GUERRE; COMRANo |
| 25 | setup and command | two-column page | L'ART DE LA GUERRE; Strategists | An army's corps are activated one after the other in; the order chosen by the player. When an army corps |
| 26 | setup and command | two-column page, yellow asset candidate, dark panel candidate | ~1 commander sends his orders by signals or; anigers. Units or group must be in command | L'ART DE LA GUERRE; -andrange |
| 27 | setup and command | two-column page, yellow asset candidate | L'ART DE LA GUERRE; MOVEMENTOF | move with this unit if he has enough CP to give; other movement orders. When a commander is |
| 28 | setup and command | two-column page | Commander engaged in combat;  A commander engaged in combat gives a +1 | L'ART DE LA GUERRE; If a commander is included in a unit the following |
| 29 | movement and manoeuvre | two-column page, yellow asset candidate | L'ART DE I.A GUERRE; The clever general imposes his will on the enemy, but does not allow the enemy' s will to be inposed on him. Sun Tzu | Zone of control: A unit within less than 1 UD; directly in front of an enemy can only perform |
| 30 | movement and manoeuvre | two-column page, yellow asset candidate, dark panel candidate | - ``l`en a unit or group moves only the distance; trai`'elled by the front edge is measured. No | L'ART DE LA GUERRE; ng distances |
| 31 | movement and manoeuvre | two-column page, yellow asset candidate | L'ART DE LA GUERRE; wheel | wheeling artillery; I Light, medium and heavy artillery, can change |
| 32 | movement and manoeuvre | two-column page, yellow asset candidate, dark panel candidate | `\hen changing from column to line, rear rank units; are moved individually and aligned alongside the | L'ART DE LA GUERRE; Light troops |
| 33 | movement and manoeuvre | two-column page, yellow asset candidate | L'ART DE LA GUERRE; I A group can advance straight ahead before or | Contraction; This is the reverse manoeuvre of an extension, i.e. a |
| 34 | movement and manoeuvre | two-column page, yellow asset candidate | MULTIPLE MOVEMENTS; A unit or group of units can perform a second or | L'ART DE LA GUERRE; MANOEUVRABILITY |
| 35 | zone of control | two-column page | L'ART DE LA GUERRE; Specific cases | ZONE OF CONTROL; Definition |
| 36 | zone of control | two-column page, yellow asset candidate, dark panel candidate | if a unit is in the ZoC of several enemy units, only; the ZoC of the most threatening enemy unit is | L'ART DE LA GUERRE |
| 37 | zone of control | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; special case: If contact with #te 777Os #ircfe77i.77g | Exiting a ZoC; A unit can voluntarily exit an enemy ZoC under the |
| 38 | zone of control | two-column page, yellow asset candidate, dark panel candidate | Exceptions to ZoC; I The camp, artillery and war wagons do not exert | i;,,;#i,,;:pr#ap:i:;:,:,:rty,:i:,i:;I;:,:,i:,i,;:,:,:i;,,; L'ART DE LA GUERRE |
| 39 | interpenetration and contact | two-column page, yellow asset candidate | L'ART DE LA GUERRE; INTERPENETRATI0N | Adjusting positions; During interpenetration, the movement allowance of |
| 40 | interpenetration and contact | two-column page, dark panel candidate | Bust through; .1 burst through is a particular form of | L'ART DE LA GUERRE; Allowed cases |
| 41 | interpenetration and contact | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; CONTACTING ENEMY | Type of contact; A unit can contact an enemy's front, flank, or rear |
| 42 | charge | two-column page | CHARGE; Definition | L'ART DE LA GUERRE; IAL MOVEMENTS |
| 43 | charge | two-column page | L'ART DE LA GUERRE; Charge procedure | 6 - If all initial targets evade; I The charging unit or group rolls lD6 to adjust its |
| 44 | charge | two-column page, yellow asset candidate, dark panel candidate | in combat, a friendly unit that cannot be; interpenetrated or a table edge. | L'ART DE LA GUERRE; Prohibited charges |
| 45 | charge | two-column page | L'ART DE LA GUHRRE; Uncontrolled charges | Only enemies (including those already in melee); situated in front or to the flank of the unit are |
| 46 | charge | two-column page, yellow asset candidate, dark panel candidate | hceptions to uncontrolled charge; tin Jirzpc#oc/s unit is not required to make an | L'ART DE LA GUERRE; If the charging unit is a cavalry unit and the |
| 47 | evade | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; EVADE MOVE | 2 - Blocked evade move; An evading unit may be blocked by something that |
| 48 | evade | two-column page, yellow asset candidate, dark panel candidate | Sinnd case: Evade blocked by an obstacle; Aha any change in orientation, the evading unit has | L'ART DE LA GUERRE; 3 - Evade move direction |
| 49 | evade | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERFaE;  Allenemy zocs are ignored. | Light crossbowmexp/ |
| 50 | conformation and rally | two-column page, yellow asset candidate, dark panel candidate | CONFORMATION; Definition | L'ART DE LA GUERRE; I If several units are in the ZoC of the same |
| 51 | conformation and rally | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; ComfQrmation to give support | ZoCs and restrictions on contact with the enemy; must be respected and take precedence over the |
| 52 | conformation and rally | two-column page, yellow asset candidate, dark panel candidate | Conforming units in melee; Following a charge, units may sometimes not be able | L'ART DE LA GUERRE; If the pursuer still has other enemies in melee |
| 53 | conformation and rally | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; Additional points | no reliable text anchor |
| 54 | conformation and rally | two-column page, yellow asset candidate, dark panel candidate | ;i'firrd conformation; ous conformation | L'ART DE LA GUERRE; Heavy artillery |
| 55 | shooting | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; PROCEDURE | RALLYING; Securing ourselves against dofeat lies in our own hands, but the opportunity of defeating the enemy is provided by himseif. |
| 56 | shooting | two-column page, yellow asset candidate | The success Of an operation lies in its praparation. Sun Tzu; GENERAL RULES | L'ART DE LA GUERRE; OTING |
| 57 | shooting | two-column page, yellow asset candidate | L'ART DE LA GUERRE; Line of sight | Special cases:; I Light cavalry can shoot from any side, meaning |
| 58 | shooting | two-column page, yellow asset candidate, dark panel candidate | SIT_00TING RESOLUTION; The main shooter and the target each roll lD6, which | L'ART DE LA GUERRE; N/gei Units Of LMI, M1, HI and mixed units armed with |
| 59 | shooting | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; Artillery and LI Ir!cc#dt.ny: Armour is useless | Artillery may shoot over friendly LI or LH on the; same level if the artillery and its target are both |
| 60 | melee and camp assault | two-column page | MELEE; Invinchility lies in the defence; the possibility Of victory in the attack. Sun Tzu | L'ART DE LA GUERRE; Simple support |
| 61 | melee and camp assault | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE | ULTIPLE ATTACKS; The following rule is used to simulate the |
| 62 | melee and camp assault | two-column page, yellow asset candidate | MELEE RESOLUTION; The phasing player determines the order in which to | L'ART DE LA GUERRE; Destruction of light infantry |
| 63 | melee and camp assault | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; MELEE MODIFIERS | Support modifier; A unit may be supported by up to three friendly |
| 64 | melee and camp assault | two-column page, yellow asset candidate | Situation modifier; If the main unit of a melee is situated on the flank or | L'ART DE LA GUERRE; Height advantage modifier |
| 65 | melee and camp assault | single/full-page layout check, yellow asset candidate, dark panel candidate, weak text layer | no reliable text anchor | II,.ngiRE:,i{, ,I,i:Il:I,::riLif:,i,:,I |
| 66 | melee and camp assault | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; i:, J, Ting: i,;:;,i:i,i:,iL.:Il::,:1.i::i | ATTACKING THE CAMP; The camp represents the baggage, provisions and |
| 67 | fortifications, rout, pursuit | two-column page, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; FORTIFICATIONS AND | units on the same long side, only one enemy unit; fights. The effect of the second unit is only to |
| 68 | fortifications, rout, pursuit | two-column page, yellow asset candidate, dark panel candidate | AND; ROUTED UNITS | L'ART DE LA GUERRE; I_It TI: |
| 69 | fortifications, rout, pursuit | two-column page, yellow asset candidate | L'ART DE LA GUERRE; PuRSUIT | If an enemy unit is attacked on its flank or rear; by a pursuer (other than LI/LH) while it is |
| 70 | terrain and setup sequence | two-column page | Topographic setting is a valuable aid in military operations. Sun Tzu; Terrain is an important part of any battle. Depending | L'ART DE LA GUERRE; Difficult |
| 71 | terrain and setup sequence | two-column page, yellow asset candidate | L'ART DE LA GUERRE; TERRAIN DESCRIPTION | A gentle hill is regarded as open terrain. The player; can choose to add vegetation or other types of cover |
| 72 | terrain and setup sequence | two-column page, yellow asset candidate | Fields; These are areas of cultivated land with ditches, | L'ART DE LA GUERRE; the gully. Units in the gully can shoot at each other. |
| 73 | terrain and setup sequence | two-column page, yellow asset candidate | L'ART DE LA GUERRE; He who has no goals will not achieve them. Sun Tzu | NGun; Each role (attacker or defender) has its advantages |
| 74 | terrain and setup sequence | two-column page, yellow asset candidate, dark panel candidate | + In steppes, only a single hill may be completely covered with brush and be rough terrain.; rmcing sequence | L'ART DE LA GUERRE; Placing a river or coastal zone |
| 75 | terrain and setup sequence | two-column page, yellow asset candidate | L'ART DE LA GUERRE; Placing the village | Each terrain piece must be placed entirely within; the sector indicated by the placement die. |
| 76 | terrain and setup sequence | two-column page, yellow asset candidate |  Compulsory terrain placed by the defender does; not count towards these totals. | L'ART DE LA GUERRE; CAMPS & FORTIFICATIONS |
| 77 | terrain and setup sequence | two-column page | L'ART DE LA GUERRE; AMBUSH | Discovering an ambush; I Until it has been revealed, an ambush is treated |
| 78 | terrain and setup sequence | two-column page | DEPLOYING ARMY CORPS; Sequence of deployment | L'ART DE LA GUERRE; If the table is a non-standard size (see optional rules), |
| 79 | terrain and setup sequence | two-column page | L'ART DE LA GUERRE; FLANK MARCHES | does not have enough CP to move them, they are; lost and removed from play. |
| 80 | terrain and setup sequence | two-column page, yellow asset candidate | Driving back a flank march; If both players have ordered a flank march on the | L'ART DE LA GUERRE; Hesitant corps |
| 81 | budget | single/full-page layout check, yellow asset candidate, dark panel candidate | L'ART DE LA GUERRE; BUDGET | no reliable text anchor |
| 82 | optional rules and reference cards | two-column page | OPTIONAL RELES; Do not repeat the same tactics; adapt to circumstances. Sun Tzu | L'ART DE LA GUERRE; It is not possible to choose impassable terrain as |
| 83 | optional rules and reference cards | two-column page | L'ART DE LA GUERRE; BIG BATTLES | RANDOM FACTOR; In order to reduce the random factor, several options |
| 84 | optional rules and reference cards | two-column page | USING CARDS; This method prevents one player from having more | L'ART DE LA GUERRE; DEMORALISATION RULES |
| 85 | optional rules and reference cards | two-column page | L'ART DE LA GUERRE; The cohesion of your army increases by | To determine your CPs for this round, roll; 2D6 per corps and keep the highest die. |
| 86 | back cover | back cover, yellow asset candidate, dark panel candidate, weak text layer | no reliable text anchor | no reliable text anchor |

## Open Verification For RV2-01

- Pages 2, 12, 13, 14, and 18 are readable but low-contrast and should be read from the rendered page image during RV2-03 or RV2-04.
- Pages 47-54 remain the highest-risk geometry area because evade and conformation depend on diagrams and cropped examples, not OCR alone.
- Pages 65 and 81 have weak or visually heavy text extraction and need direct page-image reading before any digest text is trusted.
- The routing table is sufficient to begin RV2-02 example inventory and RV2-03 source-order digesting, but it is not a substitute for page-image review.

## RV2-03 Source-Order Digest

Status: first full source-order digest covers pages `1-86`; RV2-04 deep-pass hardening is still required before treating each area as implementation-grade.

### rv2.overview-and-introduction

Source: Rules_Color_300DPI.pdf p.5-6; merged.pdf OCR helper for routing only
Status: ocr-assisted
Strongest evidence: prose headings and introductory text

Project wording:

- The opening rules pages frame the game as a historical miniatures battle fought with model units, scenery, a flat table, and simple measuring tools.
- Distance is measured in `UD`, so later engine and UI work should treat `UD` as the primary rules unit rather than as presentation-only text.
- The early introduction also establishes the core dice convention used throughout the book: a result written as `4+` means success on `4`, `5`, or `6` on a `D6`.
- These pages are descriptive and organizational rather than procedural, so they belong in the source corpus mainly as global measurement and terminology anchors.

Engine invariant:

- Global measurement and dice conventions should live in shared format or rules data, not inside UI components or ad hoc reducer constants.

Open verification:

- Re-read pages `5-6` directly from rendered page images before promoting any broader summary of the introduction beyond measurement and terminology conventions.

### rv2.equipment-and-basing

Source: Rules_Color_300DPI.pdf p.7-8
Status: scan-confirmed
Strongest evidence: prose, basing table, and unit-representation diagram

Project wording:

- The equipment section expects figures, terrain, a flat playing area, rulers marked in `UD`, cohesion markers, and standard six-sided dice.
- Table size varies with figure scale; the printed example for `6-15 mm` remains the familiar `120 x 80 cm` battlefield.
- Players may use a wide range of miniature scales, but base width must stay consistent across troop types in both armies for the chosen scale.
- Base depth is more flexible for normal play, but standard basing is the tie-break standard for exact measurement and rule disputes.
- One battlefield unit is normally represented by one stand, but infantry may also be split across two half-depth bases joined together to represent the same unit.
- When one unit uses multiple bases, those bases stay edge-to-edge, corner-aligned, and facing the same direction.
- The representation page confirms several display conventions that matter later for rules reading: missile support is shown by an extra rear rank base, mixed units place shooters behind the front rank, camps are mandatory army elements, and commanders may be based separately or as part of a bodyguard base.

![Table: basing dimensions by troop category and figure scale](rules-v2-examples/rv2-p07-basing-table-a.png)

![Diagram: how units are represented on the tabletop](rules-v2-examples/rv2-p08-unit-representation-diagram-a.png)

Engine invariant:

- Base geometry and standard footprint rules belong in shared base-profile data, while whether a commander, camp, or unit is currently on the battlefield belongs in match-state objects.

Open verification:

- Promote the exact basing table into structured values later rather than duplicating every row in prose prematurely.

### rv2.unit-status-and-orientation

Source: Rules_Color_300DPI.pdf p.9
Status: scan-confirmed
Strongest evidence: prose and orientation diagram

Project wording:

- Units begin the battle in `Good order`, meaning formed, combat-ready, and at full cohesion.
- A unit that loses cohesion from shooting or melee can become `Disordered`; disorder penalizes melee and shooting, does not change the unit's protection, and may be recovered later by rallying.
- A unit that has lost all cohesion is `Routed`, cannot continue fighting or be rallied, and is removed from the battlefield at the end of the current phase.
- The printed colour suggestions for loss markers are recording aids, not separate game mechanics.
- Every unit has a front, rear, and two flanks. The rules use a small triangle on the base to show the front in diagrams.
- The page also gives early geometry terms that later legality code must preserve carefully: `on the flank`, `on the rear`, `directly in front`, `the unit most in front`, and `nearest unit` are all defined from the actual base footprint, not from unit centers.
- The special note for `WWg` and `LH` says their current shooting edge counts as the front edge for shooting purposes only.

Engine invariant:

- Cohesion state, disorder, and routing belong on the unit instance, while front, flank, rear, and nearest relationships must be computed from pose and footprint geometry.

Open verification:

- Re-check the exact geometric wording for `most in front` and `nearest unit` before turning those definitions into solver tie-break logic.

### rv2.groups-and-army-composition

Source: Rules_Color_300DPI.pdf p.10
Status: scan-confirmed
Strongest evidence: prose and grouped visual example

Project wording:

- Groups are temporary movement-phase collections of units from the same corps that can be moved together.
- To count as one group, units must touch adjacent group members by a lateral or frontal edge and also by one corner of the front edge, while facing the same direction.
- Groups may be formed or dispersed during movement, but a set of units must be a valid group both at the start and at the end of a shared move if they are to activate and move together.
- The page explicitly allows exceptions later in the book for continuing charges and interpenetration adjustments.
- Group depth may vary by rank, but frontage is capped and the mixing rules are strict: mounted and foot do not normally mix, with listed exceptions such as light infantry with mounted units and elephants with foot units.
- Additional composition limits on the page matter later for validator work: elephants do not group with non-elephant mounted troops, camel units group only with other camel units or light infantry, artillery and war wagons may group with foot, and scythed chariots do not form mixed groups.
- The same page also establishes the default army frame: an army has three corps, one may be an allied contingent, every corps has a commander and at least one unit, one commander is the `CiC`, and the standard army budget is `200` points even though optional variants later change that size.

![Example: legal and illegal groups of units](rules-v2-examples/rv2-p10-groups-of-units-example-a.png)

Engine invariant:

- Group state must preserve corps identity and alignment legality; army construction defaults to three commanded corps before later optional variants are considered.

Open verification:

- Cross-check the `200`-point standard later against the dedicated budget and optional-rules pages before promoting it from early digest wording into a final format profile.

### rv2.game-etiquette

Source: Rules_Color_300DPI.pdf p.11
Status: scan-confirmed
Strongest evidence: prose

Project wording:

- The etiquette page is explicitly about avoiding disputes rather than introducing new combat mechanics.
- Dice handling conventions should be agreed before play, and unclear `cocked` dice are meant to be rerolled rather than argued over.
- The rules recommend small rulers marked in `UD` instead of tape measures, and they explicitly allow checking shooting distance and line of sight before firing; if the originally chosen target cannot be seen, another target may be selected.
- A move is final unless the exact starting position was marked, so intention declaration and visible measurement discipline are part of normal play.
- When an unforeseen or ambiguous situation appears, the book tells players to apply common sense in the spirit of the rules; if needed, they can settle the immediate dispute with a `D6` roll and verify the detail later.
- Fair-play and referee guidance are project-relevant for UX and tournament training, but they are not substitutes for deterministic engine legality.

Engine invariant:

- Pre-measurement and line-of-sight preview are rules-legal aids, but etiquette and referee text should surface as UX guidance rather than as hidden legality logic.

Open verification:

- Decide later whether any of this page should be extracted into player-help overlays or a training-mode reference panel instead of the strict rules core.

### rv2.troop-attributes

Source: Rules_Color_300DPI.pdf p.12
Status: scan-confirmed
Strongest evidence: prose definitions and attribute lists

Project wording:

- The troop chapter says every troop is defined by five main attributes: category, type, protection, cohesion, and quality.
- Categories first divide units into foot and mounted families, then call out `LI` and `LH` as the `light troops` subset while all others count as `heavy troops` for later rules interactions.
- `Type` is the more specific fighting style or weapon family inside a category and is the place where combat factors, bonuses, and specific abilities attach.
- `Protection` is a numeric missile-resistance value that already reflects armour density and can later be modified by terrain, cover, fortifications, or some abilities.
- `Cohesion` is the unit's staying power in battle and runs from `1` to `4`; once all cohesion is lost the unit is routed.
- `Quality` comes in `Elite`, `Ordinary`, and `Mediocre` grades. It modifies melee, shooting, and protection against shooting, but the page explicitly excludes rally tests and charge or evade movement-adjustment rolls from quality effects.

Engine invariant:

- Category, type, protection, cohesion, quality, and abilities belong to source-backed rule tables and unit definitions; only current remaining cohesion and current disorder or rout belong to live unit state.

Open verification:

- When this chapter is hardened later, cross-check whether every quality or protection modifier on later pages is already folded into a printed table value or must be applied dynamically.

### rv2.troop-descriptions-and-ability-anchors

Source: Rules_Color_300DPI.pdf p.13-22
Status: needs-source-check
Strongest evidence: troop-description prose, yellow examples, black-panel examples, and consolidated characteristics table

Project wording:

- The description pages expand each troop family into more specific battlefield roles, usually tying a named troop type to a characteristic combat factor, protection profile, and one or more special abilities.
- The early foot pages distinguish loose missile troops, javelinmen, medium infantry, heavy infantry, pikes, levies, war wagons, and other specialized sub-types by formation, terrain tolerance, and anti-mounted behavior.
- The interaction pages make clear that abilities are not cosmetic labels; they change combat resolution in tightly defined ways. The scan-confirmed examples on `p18-19` show especially important interaction families for later engine work: `2HW` versus `Armour` and `Missile support`, `Impact` versus `Furious charge`, `Javelin`, `Incendiary`, and `Panic` from elephants or camels.
- The elephant-panic example also clarifies that panic is contact-based, not a broad aura shortcut: only contacted units are affected, the penalty is not cumulative, panicked units keep their special abilities, and some troops such as scythed chariots are exempt.
- The chapter culminates in a consolidated foot-and-mounted characteristics table that summarizes category, protection, cohesion, combat factor, and several critical footnotes. That table is the safer future import surface for structured data than paraphrasing every troop paragraph one by one.

![Example box: two-handed weapon against armour and missile support](rules-v2-examples/rv2-p18-2hw-armour-example-box-a.png)

![Example box: impact versus furious charge interactions](rules-v2-examples/rv2-p19-impact-example-box-a.png)

![Example: elephants causing panic](rules-v2-examples/rv2-p19-elephants-causing-panic-a.png)

![Table: unit characteristics tables for foot and mounted troops](rules-v2-examples/rv2-p22-unit-characteristics-tables-a.png)

Engine invariant:

- Special abilities and troop-type combat values should be data-driven and source-referenced, with interaction rules resolved by explicit rule tables rather than hardcoded UI exceptions.

Open verification:

- Pages `15-21` still need a full direct reread before this chapter can be promoted from anchor summary to implementation-grade troop taxonomy.
- The p.22 table should later be transcribed carefully into structured data with its footnotes preserved as first-class rule hooks rather than flattened remarks.

### rv2.sequence-and-turn-structure

Source: Rules_Color_300DPI.pdf p.23
Status: scan-confirmed
Strongest evidence: prose sequence overview

Project wording:

- The `How to play` opener ties the battle back to prior army creation and setup, then fixes the high-level flow for the rest of the game.
- The game begins with an initiative roll that decides attacker and defender; the attacker plays first, and that play order then remains fixed for the whole battle.
- Time is divided into game-turns, each made of one player sequence per side. The currently active player is the `phasing player`.
- Within a player sequence, corps are activated one at a time, each corps only once, and one corps activation must be completed before the next begins.
- The page also anchors the major phase order for the sequence: movement and corps activation, shooting, combat, rout or pursuit resolution, victory check, then eventual end-of-game conditions.
- Shooting and combat are both resolved with simultaneous results even though the phasing player chooses the order in which their local resolutions are processed.

Engine invariant:

- Turn order, phasing-player state, corps activation state, and end-of-sequence victory checks must be explicit engine state rather than UI flow conventions.

Open verification:

- Later deep-pass work should align this page-level flow with the more detailed movement, shooting, melee, rout, and victory chapters before any implementation phase treats it as fully hardened.

### rv2.command-and-commanders

Source: Rules_Color_300DPI.pdf p.24-28
Status: scan-confirmed
Strongest evidence: prose, command-value table, yellow example box, and command-range diagrams

Project wording:

- Every army has one commander-in-chief and two sub-commanders, each leading a corps. One sub-commander may be allied, and sub-commanders may also be `unreliable`.
- Command quality is budgeted through the army's `command value`. The page-level table assigns `Ordinary = 0`, `Competent = +1`, `Brilliant = +2`, and `Strategist = +3` when calculating command points.
- A strategist is a special commander-in-chief option: still treated as brilliant, but with an extra `+1` when calculating CPs, an initiative bonus, and added setup-side advantages later in terrain adjustment and ambush placement.
- When a corps is activated, the player rolls `1D6`, adds the active commander's value, divides by two, rounds up, and gets the number of command points available to that corps for the sequence. Each commander also has one free command point each game-turn for tightly limited uses.
- The worked strategist example on `p25` confirms the intended arithmetic and makes clear that the strategist's extra point is included before halving and rounding.
- Orders are corps-scoped. A commander gives orders only to units under that command and can issue up to three move orders per game-turn to the same unit or group.
- The visible CP list on `p25` establishes the main cost pattern: spontaneous or uncontrolled charges cost no CP, ordinary movement or charge within command range costs `1 CP`, being out of command range adds `+1 CP`, difficult manoeuvres add `+1 CP`, and rallying or preventing uncontrolled charge have their own explicit costs.
- Command range is measured from the nearest point of the commander's base to the nearest point of the target unit or group and ignores enemy units and terrain for the range test. The printed ranges are `4 UD` for ordinary, `6 UD` for competent, and `8 UD` for brilliant or strategist commanders.
- Light troops double their command range, and a commander attached to a unit measures as if just behind that unit for command-range purposes.
- Individually based commanders move `5 UD`, can rotate freely, do not block friendly movement, may be displaced minimally to make room, and may attach to one unit at a time.
- Attached or included commanders change both legality and risk: they move with the unit, may use the free CP in limited attached cases, can be exposed to elimination when the unit loses cohesion or routs, and may give a `+1` combat bonus when personally engaged in combat.
- A corps that has lost its commander remains playable but counts as permanently out of command range for later orders, while still rolling for CP each turn without that commander's value.

![Table: commander quality values](rules-v2-examples/rv2-p24-commander-quality-table-a.png)

![Example box: strategist command points](rules-v2-examples/rv2-p25-strategist-cp-example-box-a.png)

![Example: command range for ordinary, mounted, and light troops](rules-v2-examples/rv2-p26-command-range-example-a.png)

![Example: commanders and groups](rules-v2-examples/rv2-p27-commanders-and-groups-a.png)

Engine invariant:

- Active corps, commander quality, command range, CP generation, free-CP use, and commander attachment or inclusion state must remain explicit reducer or engine state because later movement, rally, charge, and combat legality all depend on them.

Open verification:

- Before any implementation phase hardens command rules, re-check the p.25 CP-cost list against later movement, rally, and uncontrolled-charge chapters so the same action is not costed twice or inconsistently.
- The exact elimination timing for attached or included commanders should later be mapped into a deterministic post-combat sequence with rout and pursuit timing, not handled ad hoc.

### rv2.movement-general-and-allowances

Source: Rules_Color_300DPI.pdf p.29
Status: scan-confirmed
Strongest evidence: prose and movement-allowance table

Project wording:

- Movement is executed corps by corps by the phasing player, and all moves for one corps must be completed before the next corps begins.
- A movement may be performed by a single unit or by a valid group. If a group moves together, it must begin and end that movement as a valid group.
- In normal movement, a group moves at the speed of its slowest unit. During a wheel, each unit may still use up to its own maximum movement as long as the whole set remains a group until the wheel is complete.
- To move at all, a unit or group needs an order and therefore spends the relevant command points from its commander.
- The page establishes three distance bands relative to the enemy: the `operational zone` at `4 UD` or more, the `tactical zone` at less than `4 UD`, and the `zone of control` at less than `1 UD` directly in front of an enemy.
- The operational versus tactical split matters immediately for movement count: units in the tactical zone may only move once per turn, while units in the operational zone may later qualify for multiple moves.
- A unit moves up to its printed movement allowance in `UD` according to troop type and the terrain crossed. If it crosses several terrain types in the same move, it uses the lowest relevant allowance.
- Mixed groups use the allowance of the slowest troop type.
- A unit or group moving entirely along a road uses its open-terrain allowance regardless of the terrain crossed by the road and may add `1 UD` if the player chooses.
- Heavy infantry in open terrain has a special operational-zone boost: if it starts the move in the operational zone, it may advance `3 UD` instead of `2 UD`.
- The yellow note on the page also matters for later geometry checks: non-standard base depths are treated as standard depth when determining whether a unit is in terrain.

![Table: movement allowance by troop type and terrain](rules-v2-examples/rv2-p29-movement-allowance-table-a.png)

Engine invariant:

- Operational-zone state, tactical-distance state, movement allowance, terrain-sensitive allowance reduction, and road-bonus handling must remain explicit rules data and computed legality, not inferred loosely from UI distance tools.

Open verification:

- Later hardening should transcribe the full movement-allowance table and cross-check the road and heavy-infantry exceptions against charge, evade, and difficult-manoeuvre chapters.

### rv2.movement-measurement-and-core-manoeuvres

Source: Rules_Color_300DPI.pdf p.30-33
Status: scan-confirmed
Strongest evidence: prose, diagrams, and worked manoeuvre examples

Project wording:

- Movement distance is measured from the front edge. When a unit or group moves, no point on the front edge may travel farther than the allowance used for that movement.
- For a simple advance that includes a single wheel, the rules allow a simplified measurement method if both players agree: measure the straight-line distance moved by the outside front corner, with any slide of up to `1 UD` included in that same simplified measure.
- A `slide` is a lateral displacement of up to `1 UD` that may happen before, during, or after the advance portion of the move. Except when charging or contacting an enemy, a slide requires at least `1 UD` of straight-ahead advance in the same move.
- A slide is `free` in the sense that the lateral offset is not added to the measured movement distance, but a unit may only perform one slide during the whole movement phase even if it makes multiple moves.
- Slides cannot be combined with quarter-turns, half-turns, extensions, or contractions, and they are forbidden in an enemy zone of control except when charging the most threatening enemy or conforming to an enemy already engaged in melee.
- A `wheel` pivots around one outer front corner while the opposite front corner traces the measured distance. A normal wheel is limited to `90 degrees`, while war wagons are limited to `45 degrees`; for a single unit that wheel cost counts as `1.5 UD` of movement.
- Group wheels use the widest rank as the pivot reference, may temporarily overlap adjacent friendly units during the wheel, and may consist of several smaller wheels as long as the total does not exceed the same angular limit.
- Artillery has a special wheel rule: light, medium, and heavy artillery may change facing by wheeling on their central point up to `90 degrees`, but artillery behind a fortification cannot wheel. Light and medium artillery may also use a front-corner wheel like other units.
- Half-turns and quarter-turns are reorientation manoeuvres. They cost `1 UD` for most units, but `2 UD` for unmanoeuvrable units, war wagons, pikemen, and cataphracts.
- A half-turn rotates the unit `180 degrees` in place so the former rear edge becomes the new front edge. A quarter-turn rotates the unit `90 degrees` so the new front edge occupies the former side-edge position.
- Line-to-column and column-to-line changes are treated through that quarter-turn framework: the front unit or front rank anchors the turn, the following units align behind or alongside it, and any incidental gained distance from that realignment is not counted against movement allowance.
- If there is not enough room to place all units in the new front rank when changing from column to line, the blocked units are placed in a second rank instead.
- Light troops have a distinct freedom: they may take one free half-turn or quarter-turn at the beginning or end of a move, then a second such turn in the same move by paying `1 UD` of movement. This is what allows them to retreat while still facing the enemy.
- War wagons also have a special quarter-turn exception: a single wagon or a group of up to two wagons may slide one wagon sideways by `1 UD` to create room for the turn.
- `Extension` applies only to groups deployed several ranks deep. It widens the front by deploying rear-rank units to the sides of units already in the front rank.
- An extension counts as movement for the whole group, costs `1 UD` plus `1 UD` per unit extended, and is limited by terrain and by the slowest troop category if the group is mixed. Units with only `1 UD` of movement allowance cannot extend.
- An extension may be combined with a straight advance before or after the frontage change, may still occur when some front-rank units are in melee, and may invoke normal interpenetration rules if the extension path is blocked by friendly units.
- `Contraction` is the reverse manoeuvre: reduce the width of the front by advancing lead units at least one base depth so the following units can slide in behind them.
- Lead units may wheel during a contraction; the other units' individual distances are not measured separately. Like extension, contraction is capped by movement allowance, terrain, and the slowest troop category, and units with only `1 UD` of movement allowance cannot perform it.

![Example: measurement of distances with wheel and slide](rules-v2-examples/rv2-p30-measurement-of-distances-a.png)

![Example: slides during movement](rules-v2-examples/rv2-p30-examples-of-slides-a.png)

![Example: wheel manoeuvres](rules-v2-examples/rv2-p31-wheel-examples-a.png)

![Example: half-turn on the spot](rules-v2-examples/rv2-p31-half-turn-on-the-spot-a.png)

![Example: from line to column](rules-v2-examples/rv2-p32-from-line-to-column-a.png)

![Example: from column to line with blocked frontage](rules-v2-examples/rv2-p32-from-column-to-line-a.png)

![Example: war wagons quarter-turn](rules-v2-examples/rv2-p32-war-wagons-quarter-turn-a.png)

![Example: extension manoeuvre](rules-v2-examples/rv2-p33-extension-example-a.png)

![Example: contraction manoeuvres](rules-v2-examples/rv2-p34-contraction-examples-a.png)

Engine invariant:

- Measurement method, slide limits, wheel geometry, turn costs, line-column reformation, and frontage-changing manoeuvres must be resolved by deterministic footprint-aware logic; they are too geometry-sensitive to encode as loose text flags on actions.

Open verification:

- Later deep-pass work should separate the exact sequencing rules for extension and contraction into explicit solver steps, especially where blocked frontage, mixed categories, or friendly interpenetration interact.

### rv2.multiple-movements-and-manoeuvrability

Source: Rules_Color_300DPI.pdf p.34
Status: scan-confirmed
Strongest evidence: prose and contraction example page

Project wording:

- A unit or group may make a second move, and in some cases a third consecutive move, in the same movement phase.
- Multiple moves are only available if the unit or group remains outside tactical distance for the entire movement phase, meaning at `4 UD` or more from all enemy units, camps, and ambush markers. An enemy commander who is not included in a unit does not block this.
- Unmanoeuvrable troops other than impetuous cavalry, plus artillery and war wagons, cannot make a third movement.
- Other troops, including impetuous cavalry, may make a third consecutive movement only if the corps commander accompanies the group during all three movements.
- A third movement normally counts as a difficult manoeuvre, except for light troops and non-impetuous cavalry.
- The `unmanoeuvrable` class on the page includes impetuous units, elephants, levies, heavy artillery, and scythed chariots.
- Difficult manoeuvres cost one additional command point, but multiple reasons for difficulty do not stack beyond that single extra `CP`.
- Two manoeuvre families are difficult for all troops: a third move in the same phase except where the page exempts it, and voluntarily exiting an enemy zone of control except for troops that are allowed to evade.
- For unmanoeuvrable troops, the difficult category also includes any manoeuvre containing a quarter-turn, half-turn, extension, or contraction, plus any advance shorter than the unit's full movement allowance unless the move ends in enemy contact.
- A full-allowance advance that includes a wheel or slide still counts as an easy manoeuvre.
- If a group contains one or more unmanoeuvrable units, the difficult-manoeuvre penalty applies to the whole group.
- The page also states a failure consequence that matters later for engine sequencing: if a unit lacks enough movement allowance to carry out a difficult manoeuvre, the manoeuvre may still happen but causes disorder rather than extra cohesion loss if the unit was already disordered.

Engine invariant:

- The engine needs explicit concepts for `move count this phase`, `outside tactical distance for full phase`, `unmanoeuvrable`, and `difficult manoeuvre surcharge`, because those states determine both legality and CP cost.

Open verification:

- Re-check the exact disorder consequence for insufficient movement allowance during difficult manoeuvres when the movement and cohesion chapters are hardened together.

### rv2.movement-specific-cases

Source: Rules_Color_300DPI.pdf p.35 left column
Status: scan-confirmed
Strongest evidence: prose

Project wording:

- The page opens by collecting troop-specific movement consequences that refine the generic manoeuvre rules from `p29-34`.
- Pikemen and cataphracts treat quarter-turns and half-turns as difficult manoeuvres because of their dense formations.
- Impetuous cavalry keeps the special right to perform a third movement even though it is classed as unmanoeuvrable, but that third movement is still difficult.
- War wagons pay `2 UD` for quarter-turns and half-turns, cannot perform those turns in groups mixed with non-wagons, and can only switch between line and column in groups of at most two wagons.
- Heavy artillery cannot move normally, but may change orientation by wheeling on its center point up to `90 degrees`; that wheel is treated as a difficult manoeuvre.
- Scythed chariots are even more constrained: they may only make simple movement, including wheels and slides, and no other manoeuvres.
- The impetuous rule also tightens command cost near the enemy: when an impetuous unit or group is within charge range, any manoeuvre other than a charge or a move ending in melee support costs `3 CP`, and preventing the compulsory charge also costs `3 CP`.

Engine invariant:

- These troop-class movement overrides need to be modeled as explicit rule-table exceptions keyed by troop traits, not as post-hoc UI prohibitions.

Open verification:

- Cross-check the impetuous `3 CP` rule later against the dedicated uncontrolled-charge pages so prevention, support moves, and compulsory charges stay sequenced consistently.

### rv2.zone-of-control

Source: Rules_Color_300DPI.pdf p.35-38
Status: scan-confirmed
Strongest evidence: prose, diagrams, black-panel examples, and yellow example box

Project wording:

- A unit is in an enemy `zone of control` if it is directly in front of that enemy and less than `1 UD` from the enemy front edge.
- The page gives a practical measuring method: place a `1 UD` square adjacent to and aligned with the enemy front edge. If that marker covers any part of the unit base, the unit is in the ZoC; if it only touches, the unit is exactly `1 UD` away and therefore outside.
- Units may exert a ZoC through friendly troops they are allowed to interpenetrate.
- If a unit is in several ZoCs at once, only the ZoC of the `most threatening enemy` matters for its movement. If several enemies are equally threatening, the owner of the constrained unit chooses which individual ZoC applies.
- The most threatening enemy is prioritized first by enemies in front of the unit and only secondarily by flank or rear coverage if nothing is in front. Nearness and the amount of front-edge coverage break the tie.
- Inside the ZoC of the most threatening enemy, the legal movement set is narrow: the unit may stay still, charge that enemy, or align and get closer to that enemy through a controlled advance, wheel, quarter-turn, or half-turn.
- Those non-charge movements are constrained by geometry: the unit may not end less aligned than when it began, no point of its front edge may move farther from the threatening enemy's front edge than before, no front-edge point that began in the ZoC may leave it, an advance must still point in a direction that could contact that enemy's front edge, and the unit cannot slide.
- A group may still perform an extension or contraction in a ZoC so long as no unit leaves the enemy ZoC during that manoeuvre.
- Any charge by a unit that is in or enters an enemy ZoC must target the most threatening enemy, except for the special interposition case on `p37` where contact with that enemy is impossible only because another enemy is in the way.
- That special case matters for flank protection and redirection: a friendly unit's ZoC can prevent a full flank contact, and an interposing enemy may become the only legal charge target when the formally most threatening enemy cannot actually be reached.
- Exiting a ZoC depends on evade capability. Troops that can evade may leave by performing an evade move in their own turn, using the most threatening enemy as the reference for the initial reorientation and otherwise following the evade procedure.
- Troops that cannot evade must back straight away from the enemy after facing the most threatening enemy if necessary. Foot retreat `1 UD`; mounted troops retreat `2 UD`. They stop if blocked by enemy troops, non-interpenetrable friends, impassable terrain, or the table edge.
- That voluntary ZoC exit is a difficult manoeuvre costing `2 CP`, disorders the unit, cannot be made by a group, and does not allow contact or shooting during the same action.
- Mounted troops have one relief valve: if their rear is inside the ZoC of a slower enemy, they may move straight ahead their full movement allowance for only `1 CP` and without becoming disordered, even as a group move.
- Some ZoC exits are involuntary and therefore permitted, including movement caused by conformation help for a friendly melee, friendly interpenetration displacement, or a group's switch from column to line.
- The exceptions page narrows who exerts ZoC and through which terrain. Camps, artillery, and war wagons do not exert ZoC although they are still constrained by enemy ZoC. Light infantry in open terrain only exerts ZoC on targets it can charge, while light infantry wholly in rough or difficult terrain exerts ZoC on all enemy units at least partly in rough or difficult terrain.
- A ZoC is ignored by units completely behind a friendly fortification or obstacle or entirely behind an intervening friendly unit.
- A unit stops exerting ZoC as soon as it is engaged in melee, even if only attacked on flank or rear.
- A unit does not exert ZoC into terrain that penalizes it in combat, or out of such terrain, and units making an evade move ignore enemy ZoC during that evade procedure.

![Diagram: zone of control definition at one UD](rules-v2-examples/rv2-p35-zoc-definition-a.png)

![Example: most threatening enemy in zone of control](rules-v2-examples/rv2-p36-most-threatening-enemy-a.png)

![Example: prohibited move in zone of control](rules-v2-examples/rv2-p36-prohibited-move-zoc-a.png)

![Example: advance in a zone of control](rules-v2-examples/rv2-p36-advance-in-zoc-a.png)

![Example: protecting a flank with zone of control](rules-v2-examples/rv2-p37-protecting-flank-a.png)

![Example: special case for most threatening enemy and interposing unit](rules-v2-examples/rv2-p37-zoc-special-case-a.png)

![Example: involuntary exit from a zone of control](rules-v2-examples/rv2-p38-involuntary-exit-zoc-a.png)

![Example: terrain-sensitive zone of control interactions](rules-v2-examples/rv2-p38-zoc-example-a.png)

![Example box: cavalry in rough terrain and medium infantry zone of control](rules-v2-examples/rv2-p38-zoc-terrain-example-box-a.png)

Engine invariant:

- ZoC legality depends on exact footprint geometry, threat prioritization, terrain-sensitive exertion rules, and special exit procedures, so it must stay in pure engine logic with deterministic tie-breaking.

Open verification:

- Later deep-pass work should split the `most threatening enemy` choice into explicit algorithmic tie-break steps, because it controls charge targeting, alignment, exit legality, and later conformation.
- The mounted forward-exit special case should be re-checked together with evade and pursuit wording so it does not get misfiled as ordinary retreat logic.

### rv2.interpenetration-and-burst-through

Source: Rules_Color_300DPI.pdf p.39-40
Status: scan-confirmed
Strongest evidence: prose and worked example

Project wording:

- `Interpenetration` allows some friendly troops to pass through others during movement, charge, or evade.
- The permitted matrix is selective, not generic. Non-included commanders may pass through and be passed through by all friendly troops in any direction. Light infantry can pass through all friendly troops, and all troops may pass through friendly light infantry.
- Light cavalry and other mounted troops may interpenetrate each other only under the printed orientation constraints. LMI may interpenetrate friendly LMI under the same orientation logic.
- Non-impetuous foot knights and heavy or medium swordsmen may pass through friendly bowmen, crossbowmen, or handgunners, and the reverse is also allowed, but mixed units do not use this shooter-swordsmen interpenetration rule.
- Foot troops may pass through friendly artillery in any direction and through friendly war wagons by the wagons' long edge.
- Interpenetration is blocked by several state conditions: the crossed friendly unit may not already be in melee or providing melee support, unreliable allied corps cannot be interpenetrated, camps can never be passed through, and interpenetrating ambush troops reveals the ambush immediately.
- Mounted panic interactions also matter here: mounted troops cannot interpenetrate friendly mounted troops that would cause them panic, and if such panic-causing mounted troops are themselves interpenetrated they lose one cohesion point.
- The movement allowance of the passing unit must let it reach at least partly to the far side of the crossed unit. If not, the interpenetration is illegal.
- Position adjustment depends on what is crossed. Light troops and non-included commanders are advanced just enough to clear the crossed unit. Heavy artillery, war wagons, and units behind fortifications or obstacles must be fully cleared by the crossing unit or the interpenetration is forbidden. In other cases the crossed unit is pushed back the minimum needed to make room.
- Only the units actually involved in the crossing are adjusted, so a moving group can be broken up without changing the original CP cost of the order.
- Light troops that were interpenetrated may still move or rally afterwards. Other units that were pushed or moved back by the interpenetration may not move or rally again during that sequence.
- `Burst through` is a harsher special form of interpenetration used when a unit forces its way through friends it would not normally be allowed to cross.
- Burst through can happen during uncontrolled charge resolution or when a unit flees because of an arriving flank march. It follows interpenetration-style adjustment rules but may be done in any direction, including sliding through another unit.
- Almost all units may be burst through except pikemen, elephants, war wagons, and the camp. The move is also forbidden if it would cross an obstacle or fortification, or if the unit being crossed is in melee or currently giving support to a friendly unit in melee.
- Units that are burst through lose one cohesion point and may not move or rally again during that sequence, even if they are light troops. If they had only one cohesion left, this can rout them. Several burst-through events in the same sequence still inflict only one cohesion loss total.

![Example: interpenetration with partial crossing and adjustment](rules-v2-examples/rv2-p39-interpenetration-example-a.png)

Engine invariant:

- Interpenetration legality depends on troop pairings, orientation, support state, panic interactions, and spatial clearance, so the engine needs an explicit crossing-permission matrix plus deterministic adjustment rules.

Open verification:

- Later hardening should isolate the exact pairwise interpenetration matrix and burst-through consequences into data-backed rule tables instead of leaving them in prose.

### rv2.disengage-and-contacting-enemy

Source: Rules_Color_300DPI.pdf p.40-41
Status: scan-confirmed
Strongest evidence: prose and contact diagrams

Project wording:

- `Disengage` is the backward fall-back move for a unit or group already in melee or giving melee support to a fight.
- For unmanoeuvrable troops, ordering a disengage is a difficult manoeuvre and therefore costs `2 CP`.
- Disengage is only allowed in printed matchup families: light infantry against foot or elephants, light infantry against mounted units penalized by terrain, mounted troops other than elephants and scythed chariots against foot or slower mounted, javelinmen against heavy infantry or elephants, and any unit fighting war wagons, artillery, or an enemy across a fortification or obstacle.
- It is forbidden if an enemy front is already contacting the disengaging unit's flank or rear, if another enemy ZoC constrains the unit's flank or rear, or if something blocking sits less than `1 UD` directly behind the unit.
- A disengaging unit or group moves straight backward while still facing the enemy and must move its full movement allowance minus `1 UD`.
- It stops if it meets an enemy, a friendly unit it cannot interpenetrate, impassable terrain, a table edge, or another enemy ZoC. The disengaging unit may not contact any enemy, even a camp.
- While disengaging, the unit ignores the ZoC of the enemy it is leaving and may interpenetrate friendly units to the rear. Neither the disengaging unit nor the enemy it was fighting may shoot, and the enemy does not move as part of the disengage.
- `Contacting enemy` then defines when a moving unit actually engages a new foe. Any contact with a new enemy, even corner contact, starts combat and later requires conformation.
- New contact can happen during a charge, when moving to support a friendly unit already in melee, or during pursuit after combat.
- Sliding along an enemy's flank or rear is tightly limited. It is allowed when the enemy unit or the front unit of a column is already in melee and the sliding unit is charging, pursuing, or moving to support; when the sliding unit was already in contact at the start of its move and then changes which enemy it is engaging; or when the unit is charging the most threatening enemy.
- That last case is the only time a unit may slide along the front edge of another, less threatening enemy.
- Contact geometry is classified by which enemy edge the attacker's front edge reaches. Front contact requires starting entirely or partially in front of the straight line extending the enemy front edge. Flank and rear contact require starting behind the corresponding extension lines with the printed exclusions that stop a nominal flank path from counting if any part of the attacker's front edge is directly in front of the enemy's front or rear edge.

![Example: sliding along the enemy](rules-v2-examples/rv2-p41-sliding-along-enemy-a.png)

![Diagram: front, flank, and rear contact types](rules-v2-examples/rv2-p41-types-of-contact-a.png)

Engine invariant:

- Disengage, legal new contact, and sliding-along-enemy decisions all require geometry-aware solver logic that shares concepts with ZoC and later conformation rather than duplicating them independently.

Open verification:

- When the charge and conformation chapters are hardened, re-check how corner contact, sliding, and support contact sequence into the first mandatory conformation step.

### rv2.charge-definition-and-procedure

Source: Rules_Color_300DPI.pdf p.42-44
Status: scan-confirmed
Strongest evidence: prose, procedure list, adjusted-distance table, and worked examples

Project wording:

- A `charge` is the special movement that brings a unit into combat contact with an enemy and unlocks bonuses that apply only in the first round of melee.
- Charges come in three forms: `commanded`, `spontaneous`, and `uncontrolled`.
- Corner contact is enough only if the charging unit can then conform at least partially. Units already touching each other do not charge one another again; they conform instead. Moving into contact with an enemy already in melee to support a friend is a movement, not a charge.
- Contact restrictions still apply during charge. Light infantry in open terrain may only charge target families they are allowed to fight after conformation or move into legal support. In rough or difficult terrain they gain broader charge freedom against enemies penalized there, disordered enemies, or flank/rear contacts.
- If a light-infantry charge path would bring it into a melee contact it is not allowed to make, the charge stops just short of contact. Light infantry may always move into contact with an enemy already in melee to provide support.
- War wagons without blades, artillery, and expendable levies can never charge or move into contact to provide support.
- A unit is within charge range only if the closest-point distance is within its available movement allowance and it can make a legal charge movement that reaches the target. Wheels and turns reduce the usable charge distance, while a slide does not.
- Groups may charge if at least one unit begins within charge range, but only the units that start within range can later conform with the enemy.
- The charge procedure is explicit. The player selects the initial target, confirms range, indicates the exact charge direction, and then resolves target reaction before moving the charging unit or group.
- The initial target normally must be reachable without passing through enemy troops, but heavy troops may choose a target behind enemy light infantry in open terrain because those light infantry are forced to evade.
- At the very start of the charge move, the unit may wheel or slide, but not both. It may also use a quarter-turn or half-turn followed by an optional wheel, but then without sliding.
- Once the charge has started, the direction cannot be changed. Charge movement must still respect ZoC rules, and an extension or contraction that brings a front edge into enemy contact counts as a charge.
- If the initial targets do not evade, every charging unit that can do so must contact the enemy or move into a support position. Other units may continue the charge under the later continuation rules.
- If all initial targets evade, the charging unit rolls `1D6` for adjusted charge distance. The printed table gives `movement - 1 UD` on `1-2` except for heavy infantry, normal movement on `3-4`, and `movement + 1 UD` on `5-6`.
- Groups with mixed movement allowances roll separately by movement-allowance subgroup. Charging heavy infantry never has its charge distance reduced.
- When all initial targets evade, non-impetuous chargers should still advance at least `1 UD` for foot or `2 UD` for mounted if possible, then may stop or continue up to their adjusted maximum. Impetuous chargers must continue to their full adjusted distance.
- Whether or not the initial targets evade, a charge stops when it meets an enemy, a blocking enemy ZoC, a non-interpenetrable friendly unit, penalizing terrain, a friendly unit already in combat, or the table edge.
- Continuing a charge lets units in the group that have not yet contacted an enemy and are not already in support keep moving up to their maximum movement allowance. This is optional for non-impetuous units and mandatory for impetuous units if they can legally keep going.
- Continuing a charge can split a group without changing the original CP cost.
- Secondary targets reached during charge movement are handled under the same contact-restriction and ZoC framework, and those secondary targets may evade if they are allowed to do so.
- Prohibited charges include striking an edge of a unit that is already occupied in melee or melee support, charging blocked column faces, and charging flank or rear when full conformation on that side would be impossible because of enemy ZoCs.

![Table: adjusted charge distance by D6 roll](rules-v2-examples/rv2-p43-adjusted-charge-distance-table-a.png)

![Example: continuing a charge into secondary targets](rules-v2-examples/rv2-p44-continuing-a-charge-example-a.png)

![Example: illegal charge into a unit already in melee support](rules-v2-examples/rv2-p44-illegal-charge-a.png)

Engine invariant:

- Charge resolution needs a fixed ordered procedure with explicit state for target selection, direction lock, target reaction, adjusted distance, secondary contacts, and post-contact conformation, because each step changes the legality of the next one.

Open verification:

- When charge and conformation are deep-passed together, the exact boundary between `support position`, `contact`, `continuing charge`, and `conformation` should be turned into an explicit state machine rather than narrative sequencing.

### rv2.spontaneous-and-uncontrolled-charges

Source: Rules_Color_300DPI.pdf p.44-46
Status: scan-confirmed
Strongest evidence: prose, exception list, yellow example box, and worked uncontrolled-charge example

Project wording:

- A `spontaneous charge` is the no-orders version of a very short-range charge. It is possible when a unit has an enemy in its ZoC.
- If a group contains at least one unit able to make a spontaneous charge, the whole group may charge with that unit. No CP is spent, even if the commander is out of range or engaged.
- Spontaneous charges must advance straight ahead without wheeling or sliding. If a different approach geometry is needed, the player must pay CP for a commanded charge instead.
- Spontaneous charging is still allowed through some friendly interpenetration cases, and spontaneous charges by impetuous troops do not suffer the combat penalty that applies to uncontrolled charges.
- `Uncontrolled charges` are the impetuous version. If an impetuous unit or impetuous group is within charge range of an enemy, ignoring intervening friends, it may be forced to charge if not properly restrained.
- The page ties this directly to command cost. Any manoeuvre other than a charge or a move to support a friend in melee costs `3 CP`, and even staying still or rallying a unit of that group costs `3 CP`. A charge or move to give support costs `1 CP`, or `2 CP` if it is a difficult manoeuvre.
- If such a unit or group receives no order, all impetuous units within charge range of an enemy must make an uncontrolled charge.
- The timing is important: the uncontrolled-charge check happens before moving the impetuous unit, or at the end of its corps movement phase if it did not move, rally, or get held in place. Later friendly charges and enemy evades can create or remove the condition during the same phase.
- Uncontrolled charges are resolved only after all other movements of units in that corps.
- Target choice follows a printed priority ladder. If any valid enemy exerts a ZoC on the impetuous unit, the most threatening enemy is chosen, excluding enemies to the rear. Otherwise the nearest target directly in front is preferred; if none is there, the nearest other non-rear target is chosen.
- Only enemies in front or on the flank are considered. Rear enemies never provoke an uncontrolled charge.
- Units making uncontrolled charges are moved unit by unit from left to right or right to left at the player's choice, using the shortest route toward the target. If the target is already in melee, the unit tries to enter a support position and prefers the closest one.
- Friendly troops between the charger and its target are handled by interpenetration or burst through as needed. The uncontrolled charger must continue up to its full adjusted charge distance and stops only once it reaches melee or a legal support position.
- Units that cannot contact an enemy do not make an uncontrolled charge, but every uncontrolled-charge movement must still obey enemy ZoC rules.
- Uncontrolled chargers fight with a `-1` penalty in the first round of melee. That penalty stacks with disorder but does not cancel the unit's special abilities.
- Impetuous units have one voluntary escape from that penalty: if the target is directly in front and within `1 UD` or less, they may choose a spontaneous charge instead.
- The exception list on `p46` is broad and rule-significant. Impetuous units are not required to make an uncontrolled charge when they are already in melee or support, when only a rear ZoC constrains them, when in ambush, when fortifications, obstacles, stakes, rivers, or villages make the charge illegitimate, when the only target is an elephant or war wagon, when the charge would trigger panic, when light troops can only be reached through friendly interpenetration or burst through, or when the resulting contact would put the charger into forbidden flank, rear, or penalizing-terrain combat.
- The page also gives troop-specific front-contact carve-outs: some foot troops need not uncontrolled-charge enemy mounted to the front, and cavalry usually need not uncontrolled-charge steady heavy infantry to the front, with printed exceptions for certain cavalry families.
- The yellow note matters for future solver work: if the uncontrolled-charge target can evade, enemy units or terrain behind that target up to the charger's movement allowance plus `1 UD` must be considered before deciding whether the charge is still compulsory.

![Example box: when light troops do not trigger uncontrolled charge](rules-v2-examples/rv2-p46-uncontrolled-charge-example-box-a.png)

![Example: uncontrolled charge resolution across several impetuous units](rules-v2-examples/rv2-p46-uncontrolled-charge-example-a.png)

Engine invariant:

- Spontaneous and uncontrolled charges need explicit solver branches with target-priority logic, compulsory-versus-prevented state, and a first-round combat modifier, not just alternate CP costs on the normal charge path.

Open verification:

- Later deep-pass work should formalize the full uncontrolled-charge exception matrix by troop family and terrain because these carve-outs directly affect whether a compulsory action exists at all.

### rv2.evade

Source: Rules_Color_300DPI.pdf p.47-49
Status: scan-confirmed
Strongest evidence: prose, tables, and worked diagrams

Project wording:

- An `evade` is the reaction movement used to avoid a charge or pursuit. A unit may evade several times in the same phase if needed, and the same movement procedure is also used when voluntarily exiting an enemy ZoC.
- Only listed troop families may evade: light infantry, light cavalry, javelinmen, cavalry with `Impact` plus certain missile variants, and the remaining cavalry or camel-mounted light types that do not have `Impact` or `Impetuous`.
- Evade is not allowed if the unit is already in melee or providing melee support against an enemy, except that a unit giving only simple support may still evade. It is also impossible if the evade path is blocked.
- Some troops must evade rather than receive the charge. Light infantry contacted in open terrain by heavy troops must evade unless, after conformation, they would be fighting other light troops, elephants, or scythed chariots, or would end in a legal support position for a friend.
- If such light infantry cannot evade, or evade and are then caught by a troop type that automatically destroys them, they are eliminated rather than merely fighting normally.
- A unit or all or part of a group may attempt the evade procedure if at least one of the units would be contacted by the charge.
- The first step is reorientation opposite to the charge direction. A charge on the front forces a half-turn, a flank charge forces a quarter-turn, and a rear charge leaves the unit facing as it was. This initial reorientation is free and does not reduce the evade distance.
- After that reorientation, the evade may be blocked in two broad ways. It is blocked by enemy ZoC if an enemy is at least partly directly in front and exerts a ZoC on the unit trying to flee. It is blocked by an obstacle if enemy troops, non-interpenetrable friends, or impassable terrain lie less than `1 UD` directly ahead and cannot be avoided by a slide of `1 UD` or less.
- A slide used to avoid an obstacle during evade is not free; its distance is deducted from the evade distance. If the unit starts within `1 UD` of rough or difficult terrain, it cannot slide to avoid that terrain and must enter it, reducing movement accordingly.
- The unit may reorient further if needed to make an interpenetration, and if the initial reorientation does not leave the evade blocked the player may optionally wheel to exactly match the direction of the charge. That wheel also deducts from the evade distance.
- Evade distance is adjusted by one `D6` roll per evading unit or group: `1-2 = movement - 1 UD`, `3-4 = normal movement`, `5-6 = movement + 1 UD`. Mixed-allowance groups roll separately by movement subgroup.
- The actual evade move is straight-line movement up to the adjusted distance. While evading, all enemy ZoCs are ignored.
- To avoid new obstacles encountered during the move, the unit may slide up to `1 UD` or wheel up to `90 degrees`, using the minimum geometry needed and deducting the distance moved by those manoeuvres from the remaining evade distance. The unit may use only one slide in the evade together with one or more wheels up to `90 degrees` total.
- No quarter-turn or half-turn is allowed during the evade other than the initial reorientation. The enemy camp may not be contacted and must be avoided.
- Friendly units that can be interpenetrated are passed through without cohesion loss. If an evading enemy heavy troop would contact light infantry in open terrain, that light infantry must itself attempt to evade; in rough or difficult terrain it does not, and instead acts as an obstacle.
- If an evading group reaches a gap between obstacles, it contracts in order to continue moving, placing the contracting units at the rear and increasing the chance of being caught.
- Light troops may take an additional free half-turn at the end of their evade. No troops may shoot after they have evaded.
- If the charger catches the evading unit, the evader immediately loses one cohesion point unless the charging unit consists of light troops. In the following combat phase, the caught unit fights as if attacked from the rear.
- A unit that exits the table while evading is lost and does not return; any attached or included commander is lost with it. Those losses count toward army demoralisation, while pursuers stop at the table edge even if their adjusted movement would carry them farther.

![Example: evading unit orientation after flank charge](rules-v2-examples/rv2-p47-evade-orientation-a.png)

![Example: evade blocked by enemy zone of control](rules-v2-examples/rv2-p47-evade-blocked-zoc-a.png)

![Example: evade blocked by obstacle](rules-v2-examples/rv2-p48-evade-blocked-obstacle-a.png)

![Example: optional wheel to match charge direction during evade](rules-v2-examples/rv2-p48-evade-direction-a.png)

![Table: adjusted evade distance by D6 roll](rules-v2-examples/rv2-p48-evade-distance-table-a.png)

![Example: evade movement with slide and wheel around new obstacles](rules-v2-examples/rv2-p49-evade-movement-a.png)

Engine invariant:

- Evade needs its own ordered solver path with explicit state for eligibility, forced evade, initial reorientation, blocked-path checks, adjusted distance, obstacle avoidance, catch resolution, and table exit; it cannot safely be treated as a generic backward move.

Open verification:

- Later hardening should connect forced light-infantry evade and caught-evader elimination directly to the melee-resolution and auto-destruction rules so the removal timing is deterministic.

### rv2.conformation-core

Source: Rules_Color_300DPI.pdf p.50-52
Status: scan-confirmed
Strongest evidence: prose and worked diagram cluster

Project wording:

- `Conformation` is the special movement used to align units more neatly against their opponents before combat is resolved.
- Any unit in enemy contact, even by only one corner, may need to conform. The exact way it conforms is dictated by the ZoC of its most threatening enemy.
- A unit in melee or melee support normally aligns front edge to front edge, front corner to front corner, or in flank or rear attacks by placing a front corner against the enemy rear corner if a more complete alignment is impossible.
- A unit in simple support instead aligns front corner to front corner or flank to flank, depending on the available support geometry.
- Every unit must conform as fully as possible; if it cannot, the result is an incomplete conformation handled later in the chapter. A unit does not have to enter terrain that penalizes it in melee in order to conform fully, though it may choose to do so.
- Only the phasing player's units conform. Conformation costs no CP and the distance moved is not deducted from movement allowance.
- If the conforming unit belongs to a group, the other units in that group may also be moved up to `1 UD` so the group stays aligned.
- Conformation occurs during the movement phase or the rout-and-pursuit phase after a charge, when moving to support a friendly unit already in melee, when aligning with an enemy already in contact but not yet in melee, when fixing units already in melee that could not fully conform earlier, or when a pursuer contacts a new enemy.
- After a charge, each unit that was within charge range conforms against the most threatening enemy. The printed examples confirm that conformation is resolved by sliding first and then pivoting into the best corner-to-corner or edge-to-edge relationship.
- If several friendly units are in the ZoC of the same enemy, the unit that first entered that enemy ZoC is the one that conforms to it, even if another friendly unit made the actual first contact.
- Units that cannot line up cleanly in front of an enemy may conform into a simple support position with front corner against front corner.
- During movement, a unit or group may also conform to an enemy in order to support a friendly unit already in melee. In that case ZoC and enemy-contact restrictions still take precedence over the desire to conform, and if the enemy can evade the conforming unit aligns first and the enemy then makes its evade move. This support conformation is not treated as a charge, so first-round-only abilities such as `Impact`, `Javelin`, or `Furious charge` do not apply.
- Units can also be left touching an enemy without yet being in melee or proper support because of earlier movement or combat results. The phasing player should resolve these positions in the movement phase either by conformation, by moving units away, or by charging a different enemy.
- Some troops do not have to conform in those cleanup situations, including artillery, war wagons, and units behind a fortification, obstacle, or stakes.
- In later movement phases, units that have an enemy on their front and are not fully aligned must conform if possible. Units with an enemy on flank or rear must turn to conform during their own movement phase unless they are already engaged by another enemy on their front edge.
- Conformation also interacts with pursuit: after a victorious combat, a pursuer that contacts a new enemy must conform immediately if possible. If that pursuer still has another enemy in melee support on flank or rear, it does not pursue farther and instead conforms to one of its remaining opponents at the phasing player's choice.
- Flank or rear conformation remains limited by enemy ZoCs. A unit may not attack flank or rear if full conformation there is impossible because of enemy ZoCs, except for the earlier special interposition case.

![Example: conformation after charge against the most threatening enemy](rules-v2-examples/rv2-p50-conformation-after-charge-a.png)

![Example: alternate charge conformation sequence](rules-v2-examples/rv2-p50-conformation-other-example-a.png)

![Example: conformation to give support in melee](rules-v2-examples/rv2-p51-conformation-support-a.png)

![Example: conforming units already in contact](rules-v2-examples/rv2-p51-conformation-already-contact-a.png)

![Example: another conformation case with prior melee occupancy](rules-v2-examples/rv2-p51-conformation-another-example-a.png)

![Example: conforming units in melee](rules-v2-examples/rv2-p52-conformation-in-melee-a.png)

![Example: conformation during pursuit contact](rules-v2-examples/rv2-p52-conformation-pursuit-a.png)

![Example: conformation constrained by enemy zone of control](rules-v2-examples/rv2-p52-conformation-zoc-a.png)

Engine invariant:

- Conformation is a distinct solver stage between contact and combat, driven by most-threatening-enemy logic, support geometry, and group-preservation adjustments; it cannot be folded into charge movement or melee setup as a loose postprocess.

Open verification:

- The remaining conformation edge cases are now folded into the chapter, but later deep-pass work should still turn the special-case ordering into explicit algorithmic steps.

### rv2.conformation-special-cases

Source: Rules_Color_300DPI.pdf p.53-54
Status: scan-confirmed
Strongest evidence: prose and worked example cluster

Project wording:

- When a unit conforms, it may shift friendly units that are not already engaged in melee if this is necessary to create space.
- Shifting follows a minimization rule: move the minimum number of units, ideally one, and shift them the minimum necessary distance, preferring movement to the rear before movement to the flank.
- A unit in support may only be shifted if it remains in a support position afterwards.
- A shift may cause a unit to enter or leave enemy ZoCs involuntarily, which is allowed under the same involuntary-exit logic used earlier in the ZoC chapter.
- A friendly unit shifted by another unit's conformation may not then move or rally later in that movement phase unless it is light troops. A unit that has already moved or rallied may still be shifted by another unit's conformation.
- Sometimes full conformation is impossible because of terrain, the table edge, or friendly units that cannot be shifted. In that case combat still occurs in `incomplete conformation`.
- If a unit cannot fully conform on an enemy flank, it must instead fully conform on the rear if it contacts a rear corner, or on the front if it contacts a front corner and that alternative is possible.
- If a unit cannot fully conform on the rear of an enemy, it must instead fully conform on the nearest flank if possible.
- Otherwise the units remain incompletely conformed. This is explicitly temporary, and the rules expect the units to fully conform during a later movement phase as soon as the position permits it.
- Terrain can justify remaining only partially aligned. A unit is not required to enter terrain that penalizes it in melee to conform fully, though on its own later turn the opposite side may then need to conform if its own terrain position is not penalizing.
- `Ambiguous conformation` is resolved against the principal opponent: after conformation a unit must be clearly aligned with its principal enemy and must not end up more aligned with a different enemy instead.
- Units on deep or non-standard bases may temporarily use a standard-dimension marker to resolve the conformation geometry cleanly.
- Light infantry has a special safety rule. If it would have to conform to heavy troops that automatically destroy it, it is moved instead of conforming, at no CP cost, up to `1 UD` in any direction. If it still cannot break contact, it is automatically destroyed in the next combat phase.
- Light infantry also treats open terrain as penalizing terrain for this purpose, so LI attacking enemies partly in rough or difficult terrain need not conform if doing so would take them into open terrain.
- War wagons without blades never conform to the enemy. War wagons with blades conform when they charge or contact an enemy, but not in other cases.
- Heavy artillery, because it is immobile, can only conform by a quarter-turn or half-turn and does not conform in any other case.
- A unit defending behind a fortification, obstacle, or stakes does not conform against a unit attacking through that barrier.
- Columns attacked from the flank are handled as a special case because of differing base widths and depths. The defenders are shifted so that each unit stays in contact with only one opponent, and while doing this all units are treated as if they had a depth of `1 UD`.

![Example: shifting units when conforming](rules-v2-examples/rv2-p53-shifting-units-a.png)

![Example: incomplete conformation](rules-v2-examples/rv2-p53-incomplete-conformation-a.png)

![Example: conformation limited by penalising terrain](rules-v2-examples/rv2-p53-conformation-terrain-a.png)

![Example: incomplete flank conforming](rules-v2-examples/rv2-p53-incomplete-flank-conforming-a.png)

![Example: ambiguous conformation resolved by principal opponent](rules-v2-examples/rv2-p54-ambiguous-conformation-a.png)

![Example: columns attacked from the flank](rules-v2-examples/rv2-p54-columns-attacked-flank-a.png)

Engine invariant:

- These special cases mean conformation needs a dedicated exception layer for shifting, incomplete states, terrain-sensitive choices, light-infantry escape handling, and special footprints like columns, artillery, or war wagons.

Open verification:

- Later hardening should separate `principal opponent`, `can be shifted`, and `must remain in support` into explicit solver predicates so ambiguous and incomplete conformations stay deterministic.

### rv2.rallying

Source: Rules_Color_300DPI.pdf p.55
Status: scan-confirmed
Strongest evidence: prose and worked example

Project wording:

- Units in `Disorder` may try to regain one cohesion point by rallying during the movement phase.
- A unit that attempts to rally cannot voluntarily move or conform in that phase, but it may still shoot or fight in melee afterward.
- Only light troops that were shifted by interpenetration or conformation may still be rallied later in the same phase; other shifted units may not.
- A rally test is a `D6` roll. Unit quality does not modify that die roll. If the test succeeds, the unit regains one cohesion point; if it fails, cohesion stays unchanged.
- Only one rally attempt may be made per unit per game-turn.
- Rally difficulty depends on enemy proximity and contact state. A unit more than `4 UD` from all enemies rallies on `3+` and costs no CP, even if it is out of command range or its commander is lost or engaged.
- A unit `4 UD` or less from an enemy, even if merely supporting a friend in combat, rallies on `4+` and costs `1 CP`.
- A unit engaged in melee or in melee support against an enemy rallies on `5+` and costs `2 CP`.
- Elephants and expendable units cannot be rallied.
- If a unit is `4 UD` or less from an enemy and out of command range, the commander must spend one additional CP. If the commander is attached to or included in the unit, the unit gains `+1` on the rally die once per game-turn for that specific unit.
- A commander may move and attach before rallying in order to grant that bonus, and may use its free command point to rally the unit it is attached to or included in.
- A commander engaged in melee must spend one extra CP to rally a unit unless it is the unit he is attached to or included in.
- If a group of impetuous troops is held by paying `3 CP`, one rally attempt for one unit in that group is allowed with no extra CP cost; additional rally attempts in the same group cost `1 CP` each.

![Example: rallying with command-point costs by proximity](rules-v2-examples/rv2-p55-example-of-rallying-a.png)

Engine invariant:

- Rallying needs explicit per-unit turn state, enemy-distance state, commander-attachment state, and CP-cost computation; it cannot be inferred only from current cohesion.

Open verification:

- Later hardening should align rally timing with disorder application, shifted-unit restrictions, and commander-use sequencing so free CP and attached-bonus use remain deterministic.

### rv2.shooting-core

Source: Rules_Color_300DPI.pdf p.56-59
Status: scan-confirmed
Strongest evidence: prose, tables, diagrams, and worked example

Project wording:

- Units may shoot during both their own sequence and the opponent's sequence, depending on the situation. Shooting is optional.
- The phasing player chooses the order in which separate shootings are resolved, but all shots are treated as simultaneous. An enemy unit disordered or routed earlier in the same shooting phase still shoots back as if those effects had not yet happened.
- Only listed missile-bearing units can shoot: light infantry, javelinmen, bowmen, crossbowmen, handgunners, some medium swordsmen with bows or spear-throwers, mixed units with bows or crossbows, several mounted missile types, artillery, war wagons without blades, and elephants with light artillery.
- Shooting range depends on the weapon and the troop using it. The page-level table is the authoritative source for those values, including the distinction between shorter-ranged light shooters and longer-ranged formed foot or artillery.
- Medium and heavy artillery that moved or wheeled in the player's sequence cannot shoot in that same sequence. Other shooting units may still shoot after moving so long as they did not make a second or third move.
- A unit that charged, evaded, disengaged, or retreated out of an enemy ZoC cannot shoot in that same sequence.
- A unit engaged in melee or supporting a friend in melee cannot shoot. A unit also cannot shoot at an enemy engaged in melee or supporting another unit in melee, even where full conformation was impossible. Units merely touching an enemy without actually providing support may still shoot and be targeted.
- Target priority is constrained. If several targets are eligible, the shooter must first select the nearest target directly in front, or the `most in front` among equally near targets. If nothing is directly in front, the nearest target within the shooting zone becomes the priority target.
- If several targets still share the same priority, the player chooses, but must keep shooting at the same target in later turns unless the relative positions change.
- Light cavalry is a special case with `360 degrees` shooting and therefore always shoots at the nearest target. Medium and heavy artillery follow standard target priority at `4 UD` or less, but if no target is at `4 UD` or less they may freely choose any target over `4 UD` inside their extended shooting zone.
- Line of sight requires vision to the target. A unit cannot shoot at units in ambush, units hidden behind terrain or other units, or targets that are simply outside line of sight.
- Valid line of sight is checked by tracing two straight lines from the two corners of the shooting edge to a single point on one edge of the target base; those lines must not be blocked by terrain or other units.
- A shot is made from the shooting edge, usually the front edge. A target must be both within range and inside the shooting zone.
- Range is measured from any point on the front edge of the shooter to any point on the target base. The normal shooting zone is a rectangle straight ahead whose depth equals the weapon range and whose width is the shooting edge plus `1 UD` on each side.
- Several troop types have special shooting zones. Light cavalry can shoot from any side, so line of sight, zone, and range may be measured from any edge. Light chariots may shoot from their rear edge at `-1`. War wagons shoot only from a flank edge, chosen each phase. Medium and heavy artillery extend their long-range shooting zone to `2 UD` on either side of the artillery base.
- A unit may only be shot once per shooting phase. All shooting at the same target is therefore resolved in a single combined calculation.
- If several shooters fire at one target, the player chooses one main shooter and the other eligible shooters provide support. Each supporting unit gives `+1` to the die roll up to a maximum of `+3`.
- The main shooter and target each roll `1D6`. The target adds its protection value, and the main shooter adds the relevant circumstance modifiers.
- The printed circumstance table includes penalties for light troops shooting, targets in cover or behind a fortification, disorder, and shooting from cover or difficult terrain, plus bonuses for supporting shooters and for some formed infantry bow, crossbow, or firearm units shooting at mounted targets.
- If the modified shooter result is higher than the target's result, the target loses one cohesion point. Cohesion loss from shooting is limited to one point per phase. If the shooter result is equal to or lower than the target result, there is no effect.
- When two units shoot at each other, resolve the two shots in sequence but apply the results only after both rolls are complete. Both units can therefore lose cohesion or even rout in the same phase.
- Crossbows and firearms reduce protection by piercing heavy armour. Armour and heavy armour bonuses do not apply against them, though some units such as elephants and war wagons keep special values.
- Longbows reduce the basic protection of most targets by one, to a minimum of zero, with listed exceptions.
- Artillery and light infantry with `Incendiary` reduce most targets to protection `0`; only dispersed light troops keep protection `1`.
- Pavises add `+1` protection after crossbow, firearm, or longbow modifiers are applied, but give no protection against artillery or incendiary light infantry and are not cumulative with terrain or fortification cover.
- Terrain cover and fortifications matter only if the line of sight actually passes through the cover. If more than `1 UD` of cover terrain lies between the units, shooting is not possible. Stakes and obstacles do not themselves grant protection.
- Light troops provide reduced shooting support: each supporting light-troop unit counts as half a unit, rounded up when totaling the support bonus.
- Several `shooting overhead` cases are allowed. Troops on a higher hill may shoot over lower friends if the target is at least `1 UD` beyond them. Artillery may shoot over friendly LI or LH on the same level if both artillery and target are at least `1 UD` from the intervening light troops. Artillery may also shoot over enemy LI and LH without restriction. Some integrated light artillery may shoot over named infantry types in front of them if aligned correctly, and LH may shoot in support over another LH with the same armament if aligned front-corner to rear-corner and facing the same way.

![Table: shooting ranges by missile weapon](rules-v2-examples/rv2-p56-shooting-ranges-table-a.png)

![Diagram: shooting zone and range by troop type](rules-v2-examples/rv2-p57-shooting-zone-a.png)

![Example: line of sight and priority target](rules-v2-examples/rv2-p58-line-of-sight-a.png)

![Table: shooting circumstance modifiers](rules-v2-examples/rv2-p58-shooting-modifiers-a.png)

![Example: shooting priority, support, and simultaneous results](rules-v2-examples/rv2-p59-shooting-example-a.png)

Engine invariant:

- Shooting needs an explicit solver for eligibility, target priority, line of sight, shooting-zone geometry, support aggregation, simultaneous resolution, and protection-modifier stacks; it cannot be reduced to a simple range check plus die roll.

Open verification:

- Later deep-pass work should split the protection-modifier stack and the special overhead-fire cases into precise ordered subrules so artillery, pavises, longbows, and incendiary fire do not conflict.

### rv2.melee-core

Source: Rules_Color_300DPI.pdf p.60-61
Status: scan-confirmed
Strongest evidence: prose and support examples

Project wording:

- The melee phase takes place after movement and shooting are complete.
- A unit in enemy contact can be in one of three combat roles: it is either the `main unit` of a melee, in `simple support`, or in `melee support`.
- A melee can last across several turns and only ends when all units of one side are routed or successfully disengage.
- The `main unit` is normally the unit fighting directly on the enemy front edge other than by a single corner only. If conformation is incomplete, the unit most in front of the enemy is the main unit. If the enemy is contacted only on flank or rear, the first unit to contact becomes the main unit.
- Corner-to-corner contact alone is not enough to count as a melee. Units must at least be partially conformed.
- A unit in melee can receive support only from friendly units that are not already in melee with another enemy.
- `Simple support` exists when the supporter is aligned in front-corner to front-corner contact with a friendly main unit fighting on its front edge, or when the supporter has a meaningful flank-edge contact against the flank edge of an enemy already engaged on its front or rear edge and is oriented either the same way as that enemy or directly opposite.
- Each unit in simple support gives `+1` to the friendly main unit.
- `Melee support` is stronger. The supporting unit must be fully conformed with its front edge against the enemy flank or rear that is opposite the supported friendly unit. If flank or rear conformation is incomplete, the bonus drops back to simple support.
- Each unit in melee support gives a bonus equal to its combat factor plus `1`, but special abilities, disorder, and commander presence are ignored when calculating that support value.
- A unit may provide simple support to at most two friends, one on each flank. A unit may be supported by at most three units in total, one on each flank and one to the rear of its enemy.
- If two units are in support positions on the same flank, only one support bonus is counted and the owning player chooses which unit provides it in that sequence.
- Panic caused by camels or elephants affects only units actually in melee with those troops, not units merely in simple or melee support.
- A unit whose flank edge touches the rear edge of an enemy cannot provide support against that same enemy.
- Multiple attacks are the rule for newly coordinated flank or rear attacks. If a unit already in melee or melee support is newly attacked on flank or rear by a fresh enemy other than light troops, artillery, or war wagons, it immediately loses one cohesion point, but only if that attacker fully conforms on the flank or rear.
- The same cohesion-loss rule applies if a unit is simultaneously engaged on multiple sides in the same phase and at least one new flank or rear attacker fully conforms.
- The loss happens in the phase of the new contact, is capped at one cohesion point per player's sequence, and if it removes the last cohesion point the unit is routed immediately and normal melee is not then resolved against it.
- War wagons can neither initiate nor suffer multiple attacks. Artillery cannot initiate a multiple attack, though it may suffer one.

![Example: support number one](rules-v2-examples/rv2-p61-support-example-1-a.png)

![Example: support number two](rules-v2-examples/rv2-p61-support-example-2-a.png)

Engine invariant:

- The melee solver needs explicit role classification for main unit, simple support, and melee support, plus a separate immediate multiple-attack trigger before normal melee resolution.

Open verification:

- Later hardening should turn support-role classification into precise geometry predicates shared with conformation, so `simple support`, `melee support`, and `partial conformation` stay consistent.

### rv2.melee-resolution-and-modifiers

Source: Rules_Color_300DPI.pdf p.62-64
Status: scan-confirmed
Strongest evidence: prose, loss table, yellow examples, and modifier examples

Project wording:

- The phasing player chooses the order in which melees are resolved, but as in shooting the results are considered simultaneous.
- To resolve a melee, compare the opponents' combat factors, then add all applicable modifiers and special abilities to get a combat differential in favor of one side.
- Each player rolls `1D6`. Quality modifies the die before the differential is added: `Elite` adds `+1` on a roll of `3` or less, `Mediocre` applies `-1` on a roll of `4` or more, and `Ordinary` gives no quality modifier.
- The side with the better differential adds that differential to its die result, and then special abilities that modify the final result are applied.
- Compare the two final results. A tie causes no cohesion loss. A difference of `1-2` causes `1` cohesion loss, `3-4` causes `2`, `5-6` causes `3`, and `7+` causes automatic rout.
- Light infantry as the main unit in open terrain against most heavy troops, war wagons, cavalry, cataphracts, heavy chariots, or knights is automatically routed instead of resolving the melee. This automatic destruction does not happen when the LI is entirely in rough or difficult terrain.
- `Furious charge` applies only in the first round of a melee and only when the unit charges or is charged on its front edge. It does not apply after later conformation of existing contact or after pursuit contact.
- Combat factor comes from the troop tables on `p22`, but the modifier pages define how that factor is changed by the current situation.
- First-round abilities only apply if the unit charges or receives a charge on its front edge. If it is charging, or being charged, on flank or rear, those front-edge-only first-round abilities do not apply.
- Flank or rear attack has a major effect. If a unit is attacked on flank or rear by a non-light enemy that fully conforms there, its combat factor is reduced to `0`. Some abilities such as `2HW`, `Impact`, `Javelin`, `Polearm`, `Furious charge`, and `Missile support` are cancelled even when the attacker is light troops or not fully conformed, but armour, heavy armour, and camel or elephant panic still apply.
- A main unit situated on an enemy flank or rear gains a `+1` situation modifier even if its conformation on that flank or rear is incomplete.
- Terrain modifiers are printed by troop family. Any penalized unit suffers the penalty if any part of its base is in the terrain, and a unit attacking an enemy exactly at the edge of a terrain piece is treated as partially entering that terrain for the whole combat.
- Mounted troops that are in terrain penalizing them in melee lose `Impact` and `Furious charge`, and they do not automatically destroy light infantry there.
- Special terrain cases on the page include camels treating brush as open terrain, camels not being penalized in sand dunes, and elephants treating fields and brush as open terrain.
- Height advantage gives `+1`. A unit is higher on a hill if it is entirely on the hill and the crest line or the highest point lies behind the extension of its front edge. Riverbanks and gully edges use their own similar defender-favored conditions.
- A commander attached to the main unit may choose to be engaged in the melee before dice are rolled. If engaged, the unit gains `+1`, but the commander risks being lost if the unit loses the melee. Included commanders are automatically engaged in melees involving their unit.

![Table and example: melee resolution and furious charge](rules-v2-examples/rv2-p62-melee-resolution-table-a.png)

![Example: flank or rear attack](rules-v2-examples/rv2-p63-flank-rear-attack-a.png)

![Example box: incomplete flank or rear contact still gains the situation modifier](rules-v2-examples/rv2-p64-situation-modifier-example-a.png)

![Example: height advantage on a hill](rules-v2-examples/rv2-p64-height-advantage-a.png)

Engine invariant:

- Melee resolution needs an explicit ordered calculation pipeline: combat factor base, support bonuses, situation and terrain modifiers, quality-die modification, differential application, special-ability result modifiers, then loss-table mapping.

Open verification:

- Later deep-pass work should isolate which effects change `combat factor`, which change the `die`, and which change the `final result`, because the order matters and several abilities stack differently.

### rv2.melee-examples-and-camp-assault

Source: Rules_Color_300DPI.pdf p.65-66
Status: scan-confirmed
Strongest evidence: worked example page and camp-assault prose

Project wording:

- The full melee example page confirms that melee resolution is intended to combine support counting, first-round ability cancellation, disorder, armour adjustment, multiple-attack losses, and flank or rear effects in one ordered computation rather than as separate mini-combats.
- It also makes explicit that a unit already affected by a multiple attack can then fight a later melee in the same sequence with its disorder and cohesion state already reduced.
- `Attacking the camp` is a specialized melee case. The enemy camp is treated as an enemy unit without a ZoC.
- A unit cannot contact the enemy camp during its second or third movement.
- The camp triggers uncontrolled charge for impetuous troops, except for impetuous mounted troops against a fortified camp.
- No unit may pass through a camp.
- An unfortified camp attacked in melee is automatically lost and looted.
- A fortified camp cannot be attacked by light troops. Other troops may attack it, but the combat is simplified: each attacker rolls a die, and the camp is lost on `5-6` to foot troops or elephants and only on `6` to other mounted troops.
- During an attack on a fortified camp, no factors or modifiers, including quality, are applied, and the defenders can never inflict losses on the attackers.
- A unit attacking the enemy camp counts as being in melee. It can be shot at, cannot evade if charged, and if attacked by another unit the camp attack ends and the unit instead fights that new enemy, conforming to it in its next movement phase.
- The camp gives no support in melee and cannot be part of a multiple attack.
- Once a camp is lost, all units that participated in the attack begin looting it. A looting unit stays in place and can do nothing else.
- Before a commander may order a looting unit, he must roll `4+` on `1D6`; if this fails, no orders can be given and the unit keeps looting that turn.
- A looting unit still counts as being in melee and does not make uncontrolled charges.
- A lost and looted camp remains on the battlefield as an obstacle to movement rather than being removed.

![Example page: melee examples](rules-v2-examples/rv2-p65-melee-examples-a.png)

![Example: camp assault with multiple attacks and rout effect](rules-v2-examples/rv2-p66-attacking-camp-example-a.png)

Engine invariant:

- Camp assault and looting need dedicated state transitions rather than being treated as ordinary unit combat, because camp loss, looting lock, command recovery, and movement obstruction follow their own rules.

Open verification:

- Later hardening should connect camp loss and looting state to victory, uncontrolled-charge, and command-order systems so the camp remains a persistent battlefield object after capture.

### rv2.fortifications-obstacles-and-war-wagons

Source: Rules_Color_300DPI.pdf p.67
Status: scan-confirmed
Strongest evidence: prose and worked war-wagon support example

Project wording:

- Fortifications are earthworks, palisades, or wagon laagers. Obstacles are ditches, traps, or pits. They are placed at the beginning of the battle, remain fixed, have a front and rear, and only the unit behind them benefits from their effects.
- Passing through a fortification or obstacle costs `1 UD` for foot and `2 UD` for mounted troops.
- A unit may end partially across a fortification or obstacle, or temporarily remove it, if there is not enough room to cross it entirely.
- To gain the defensive effect, the unit must be aligned corner to corner behind the barrier. If the unit is attacked on flank or rear, it benefits only if the resulting combat is actually fought across that fortification or obstacle.
- The front edge of the fortification or obstacle is treated as the front edge of the unit behind it, including for shooting-range measurement.
- Foot units other than war wagons and light infantry gain `+1` in melee behind a fortification, but not behind a mere obstacle.
- `Impact` and `Furious charge` do not apply if the combat is fought across a fortification or obstacle.
- Mounted troops attacking across a fortification or obstacle suffer `-2` in melee.
- Light infantry defending a fortification, but not an obstacle, is not treated as being in open terrain. That means heavy troops do not auto-destroy it there and it is not compelled to evade just because the attack comes from heavy troops in the open.
- All units except war wagons placed behind a fortification, but not behind a simple obstacle, count as being in cover unless shot at by artillery.
- A unit behind a fortification or obstacle cannot wheel.
- War wagons then define their own combat logic. All edges of a war wagon count as front edges for combat purposes, so a war wagon can never be attacked on flank or rear and is never the subject of a multiple attack.
- When a war wagon is attacked on one long edge by a single enemy unit, it counts as supported and gets `+1` in melee. If two enemy units are on that same long edge, only one actually fights and the second merely cancels that support bonus.
- Units contacting a war wagon on its other sides with a front edge provide simple support only; corner-to-corner or flank contacts do not provide support.
- A war wagon cannot make flank or rear attacks and cannot provide melee support against an enemy. If it contacts an enemy flank or rear, it only provides simple support.
- Only one enemy unit at a time can be the main unit fighting a war wagon. The phasing player chooses which contacting unit is the main unit for that melee phase.
- A war wagon may support friendly units in simple support from any of its sides or corners in any orientation, but it may support at most two friendly units in total, one per side.
- Light infantry may contact a war wagon in order to support a friendly unit fighting it, but if after combat that LI remains alone in contact with the war wagon it must break contact by moving `1 UD`.
- War wagons other than `Mediocre` may become `Battle-ready`, linking them back to the earlier troop-quality and attribute chapter.

![Example: war wagon support and contact limits](rules-v2-examples/rv2-p67-war-wagons-support-a.png)

Engine invariant:

- Barriers and war wagons need dedicated geometry and combat-state rules; they are not just terrain tags or normal units with unusual combat factors.

Open verification:

- Later hardening should connect the fortification and obstacle effects back to shooting cover, conformation exceptions, and pursuit restrictions so the same barrier state is interpreted consistently across phases.

### rv2.routed-units-and-elephant-rampage

Source: Rules_Color_300DPI.pdf p.68
Status: scan-confirmed
Strongest evidence: prose, rampage table, and routing example

Project wording:

- A unit that has lost all its cohesion points from any cause is `Routed` and removed from play.
- Routing and pursuit are executed only at the end of the player's sequence, after all combats have been resolved.
- If a unit is routed while in melee and is attacked only on flank or rear, it is first reoriented to face its main enemy. Units routed from shooting are not reoriented.
- Friendly units directly behind the routed unit after that reorientation and within less than `1 UD` lose one cohesion point as the routed unit passes through them. This can cascade into further routs.
- Enemy units are not affected by a normal rout path.
- Routing artillery, war wagons, and scythed chariots do not inflict collateral cohesion loss; they are simply removed.
- Routing light infantry only causes cohesion loss to other light infantry units.
- If an elephant routs, a special `Elephant rampage` rule replaces the normal simple rearward effect.
- A routing elephant first reorients if required, then rolls `1D6` for its rampage direction: `1 = forward`, `2 = 90 degrees left`, `3 = 90 degrees right`, `4-6 = to the rear`.
- All friendly and enemy units except light infantry lose one cohesion point if they are less than `1 UD` from the rampaging elephant in the indicated direction.
- The worked example confirms that the elephant rampage can hit enemy units, can spare light infantry, and can combine with later ordinary rout cascades from units broken by the elephant's passage.
- Commanders engaged in combat or included in a routed unit still risk elimination under the commander-loss rules previously referenced in the command chapter.

![Table: elephant rampage direction](rules-v2-examples/rv2-p68-elephant-rampage-table-a.png)

![Example: routing elephant and cascading losses](rules-v2-examples/rv2-p68-routing-example-a.png)

Engine invariant:

- Routing is not just a removal event; it has delayed sequence timing, reorientation rules, cascade effects, and a special elephant branch that can affect both sides.

Open verification:

- Later hardening should make rout propagation and elephant rampage explicit event chains so simultaneous end-of-sequence cascades stay deterministic and replay-safe.

### rv2.pursuit-and-army-rout

Source: Rules_Color_300DPI.pdf p.69
Status: scan-confirmed
Strongest evidence: prose, loss table, and yellow army-cohesion example

Project wording:

- A unit that routs all its melee opponents may pursue at the end of the melee phase, after routs have been resolved. Only the phasing player's units ever pursue.
- A pursuit is a straight-forward move of up to `1 UD` that ignores enemy ZoC. Elephants and impetuous units that pursue must move one complete `1 UD`.
- A unit that has routed its opponents but is still in front-edge contact with enemies on its flank or rear does not pursue; it immediately conforms to face one of those remaining enemies instead.
- War wagons, artillery, and expendable levies never pursue.
- Pursuit is optional for non-impetuous units and mandatory for elephants and impetuous units except in the printed exceptions.
- The exceptions are rule-significant: no mandatory pursuit if the unit destroyed artillery, a war wagon, a scythed chariot, or an elephant; if pursuit would take it off-table or into terrain that penalizes it in combat; if the unit is defending a fortification, obstacle, or river bank; if an impetuous foot unit would be pursuing mounted troops; or if the pursuit path would run along an enemy front.
- Supporting friendly units may also advance the same distance if they are aligned corner to corner with the pursuing unit and have the same facing.
- If several friendly units are in melee with the same enemy, only one may pursue, at the player's choice. If one of them is impetuous, that unit must pursue unless another pursuing unit blocks its path.
- Pursuit may pass through a fortification or obstacle.
- Pursuit may contact a new enemy. The pursuer then conforms immediately to the new enemy, enemy units contacted by pursuit may evade if allowed, and if the enemy does not evade the resulting combat is fought in the next melee phase and does not count as a charge.
- If the pursuer attacks an enemy already in melee or in melee support on flank or rear, and the pursuer is not light infantry or light cavalry, that enemy immediately loses one cohesion point under the same multiple-attack logic used earlier. If that enemy then routes, there is no further subsequent pursuit.
- If the contacted enemy is not already in melee, it will conform in its own next movement phase before combat resolution.
- At the end of each player's sequence, the game checks whether either army has been routed. An army routs when its accumulated losses are equal to or greater than its current army cohesion value; if both rout at once the game is a draw by simultaneous rout.
- Army cohesion value equals the number of units in the army. A fortified or sacred camp counts as one additional unit. Units not currently on the table, such as flank-march or ambush forces, do not count toward current army cohesion.
- The loss table on the page is explicit: each `Disordered` unit counts `1`, each unit that fled the table counts `1`, each `Routed` unit counts `2`, each lost commander counts `1 + command value`, a lost camp counts `4`, and a lost fortified or sacred camp counts `6`.
- `Expendable` units count neither toward army cohesion value nor toward army-cohesion losses.

![Table: army cohesion losses](rules-v2-examples/rv2-p69-army-cohesion-losses-a.png)

![Example box: current army cohesion value and losses](rules-v2-examples/rv2-p69-army-rout-example-a.png)

Engine invariant:

- Pursuit, army-rout checks, and commander or camp loss all need explicit end-of-sequence accounting, because current on-table strength and accumulated losses can change during the same turn.

Open verification:

- Later hardening should align army-cohesion accounting with setup state for ambushes, flank marches, sacred camps, and commander elimination so the army-rout calculation always reflects the current legal battlefield state.

### rv2.terrain-fundamentals

Source: Rules_Color_300DPI.pdf p.70-72
Status: scan-confirmed
Strongest evidence: prose, terrain tables, and hills-visibility diagram

Project wording:

- Terrain is a first-class part of the game because it changes movement, combat, visibility, cover, ambush rights, and later setup constraints.
- Terrain pieces may be linear, such as roads or rivers, or area elements. Most area elements are irregular with rounded corners, but fields, plantations, and villages must be rectangular.
- A valid terrain element must fit inside a circle of `6 UD` diameter and must be able to contain a rectangle of `2 UD x 3 UD`.
- The core terrain types are `open`, `rough`, `difficult`, and `impassable`.
- Open terrain has no movement effect and includes any table area not covered by terrain pieces.
- Rough terrain includes brush, scrub, rocks, gullies, orchards, and cultivated fields with ditches or hedges. It impedes most troops except light and medium infantry.
- Difficult terrain includes dense woods, marshes, sand dunes, steep hills, and villages. Only light infantry moves through this terrain without penalty.
- Impassable terrain cannot be crossed or occupied and does not by itself block visibility, shooting, or line of command.
- Terrain can block visibility and allow ambushes. In general, troops physically on the table are considered known to the enemy, but terrain that blocks visibility can hide ambush markers and units placed inside or behind a crest or horizon line.
- Cover from shooting depends on line of sight passing through the terrain. A target can gain protection from cover while also suffering its own shooting penalty if it shoots from inside that cover.
- Rivers and coastal zones are variable or fixed barriers. A river is `1-2 UD` wide, stretches from one long table edge to the other, and its difficulty is determined when placed: `1 = open terrain`, `2-3 = rough`, `4-5 = difficult`, `6 = impassable flooded river`.
- Units normally cross a river only at right angles, except for a dried river. In an undried river, the only allowed manoeuvres are sliding and half-turning. Units partly in a river have no cover and defending the bank gives `+1` in combat against troops at least partly in the river.
- A coastal zone represents the edge of a large river, lake, or sea. It is always `4 UD` wide and completely impassable.
- Hills are rounded terrain pieces with a peak. Difficult hills must have a crest line; any hill also has a horizon line used for visibility. Gentle hills count as open unless covered by vegetation; steep hills are difficult regardless of vegetation.
- Hills affect both combat and visibility. A higher unit gains the combat bonus already referenced in the melee chapter, and units behind the horizon or crest line are hidden until the enemy passes the relevant line or comes within `1 UD`.
- The hill example confirms the zone-based visibility logic and the extra hiding effect of a crest line on a difficult hill.
- Named rough and difficult elements then refine the generic categories. Brush is rough and elephants and camels treat it as open. Plantations are rough, offer cover, allow ambush to all except elephants, and impose `-1` for most shooting from inside. Fields are rough, offer no cover, allow ambush only to LI, and elephants treat them as open.
- Woods are difficult, offer cover, allow ambush to all troops, and impose `-1` for most shooting from inside. Marsh is difficult, offers no cover, and allows ambush only to LI. Sand dunes are difficult, offer no cover, allow ambush only to LI, and camels treat them as rough for movement but are not penalized in combat there.
- A gully is rough and offers no cover, but gives units outside it a combat bonus against enemies at least partly inside. Units fully inside a gully are invisible from outside except to enemies within `1 UD` of the edge. Units inside a gully cannot shoot at or be shot at by enemies more than `1 UD` from the edge, but units inside the gully can shoot at each other and fire can pass over the gully.
- A road uses the category of the terrain crossed for combat, but speeds movement and may pass through most terrain types except coastal zones and impassable terrain.
- A village is difficult terrain, gives cover to all units, allows ambush to all except elephants and war wagons, and imposes `-1` on most shooting from within.
- The consolidated terrain table on `p72` is the safest later import surface for category, ambush permissions, and cover behavior.

![Table: river difficulty](rules-v2-examples/rv2-p71-river-difficulty-table-a.png)

![Example: hills and visibility zones](rules-v2-examples/rv2-p71-hills-visibility-a.png)

![Table: terrain categories, ambush permissions, and cover](rules-v2-examples/rv2-p72-terrain-table-a.png)

Engine invariant:

- Terrain must be represented as structured rule objects with category, visibility, cover, ambush eligibility, movement penalties, and special-case tags; it cannot be collapsed into a single movement-cost field.

Open verification:

- Later hardening should unify the hill, gully, and cover rules with line-of-sight and combat modifiers so visibility and combat-height logic share the same geometric primitives.

### rv2.setup-terrain-selection-and-placement

Source: Rules_Color_300DPI.pdf p.73-75
Status: scan-confirmed
Strongest evidence: prose, compulsory-terrain example, terrain-selection table, terrain-sector diagram, and terrain-position table

Project wording:

- The setup chapter begins after army composition. Each army is organized into corps led by commanders, then the players prepare the battlefield, camps, battle plans, ambushes, deployment, dismounting, and battle start in a fixed order.
- Initiative is based on command quality and scouting. Each army totals the values of all commanders, divides by two rounding down, adds `+1` if the commander-in-chief is a strategist, and adds scouting bonuses from LH and LI in the printed proportions.
- Both players then roll `1D6`; the player with the higher initiative value adds the difference between the armies' initiative values, capped at `+4`, and the higher final result wins initiative.
- The initiative winner chooses the region for the battle and whether to be attacker or defender. Attacker and defender then gain asymmetric setup rights: the defender chooses and places terrain first and gets an additional compulsory terrain; the attacker adjusts terrain first, deploys second, places ambush only in own deployment zone, and plays first. The defender adjusts terrain second, deploys first, may place flank-sector ambushes up to halfway across the table, and plays second.
- Each region has one compulsory terrain type for the defender. The compulsory-terrain example on `p73` confirms that this mandatory pick still counts against the terrain-type maximum shown in the later table.
- The terrain-selection table on `p74` is the authoritative source for how many pieces of each terrain type each region may choose, including which piece is compulsory and the special steppe note that only one hill may be fully covered with brush.
- Choosing and placing terrain follows a fixed sequence. The defender takes the compulsory terrain and chooses `2-4` other pieces; the attacker then chooses `2-4` pieces; the defender places the compulsory piece; if either player selected a river or coastal zone that player places it; the defender places the village if one exists; the defender and then the attacker place all remaining pieces except the road; the road is always placed last; then the attacker tries terrain adjustment, followed by the defender.
- A player cannot choose more than two identical terrain pieces including the compulsory piece, and at least two terrain pieces must be placed on the battlefield.
- River or coastal-zone selection is not guaranteed. The player must first roll `4+`; on failure they choose another terrain piece instead.
- The river or coastal zone is placed along a chosen short table edge. A river must lie fully between `2` and `6 UD` from the chosen table edge; a coastal zone extends `4 UD` in from that edge.
- Only the defender may attempt to place a village, and even then only on a successful `4+` roll. If already using a river or coastal area, the village must touch that feature. The defender also places a connecting road for the village, and in some regions may place the village on a hill, treating hill and village as one combined placed piece.
- For each other terrain element except the road, the player rolls `2D6`: one die determines the sector and one determines position relative to the table edge. Sector placement uses six `10 x 10 UD` sectors, with `1-2 = left`, `3-4 = center`, `5-6 = right` within the player's relevant half.
- The terrain-position table states that on `1-4` the terrain must touch one table edge or a river or coastline, and on `5-6` it must be at least `2 UD` from all table edges.
- Each terrain piece must be placed entirely within the indicated sector. No terrain except a road may be placed on top of another terrain piece.
- If a terrain piece cannot be placed because of lack of space, each player gets one reroll for placement. If the piece still cannot be placed, it is discarded. Impassable terrain cannot be placed in a central sector and must be rerolled until a flank sector is selected.
- Terrain balance across the two table halves is regulated. If at any point one half has three or more terrain pieces more than the other half, the next terrain piece is placed in the half with fewer pieces, excluding road, river, and coastal zone from the count.
- The road is always placed last. The player rolls `2D6` to select two sectors and then connects any table edges in those sectors with a straight road or a road with one bend. If both dice indicate the same sector, the player may choose any two sectors.
- A road must be between `10` and `30 UD` long, may run over other terrain except coastal zones or impassable terrain other than a flooded river, and if it crosses a river then a bridge or ford is automatically present.

![Table and example: compulsory terrain by region](rules-v2-examples/rv2-p73-compulsory-terrain-table-a.png)

![Table: terrain availability by topographic setting](rules-v2-examples/rv2-p74-terrain-selection-table-a.png)

![Diagram: terrain sectors for placement](rules-v2-examples/rv2-p75-terrain-sectors-a.png)

![Table: terrain position relative to table edges](rules-v2-examples/rv2-p75-terrain-position-table-a.png)

Engine invariant:

- Setup terrain selection and placement need a staged state machine with asymmetric attacker or defender privileges, region tables, sector and edge-position constraints, and reroll or discard handling.

Open verification:

- Later hardening should reconcile these setup-region tables with the already accepted project setup docs so standard-200 setup logic consumes one canonical region and terrain source.

### rv2.terrain-adjustment-and-camps

Source: Rules_Color_300DPI.pdf p.75-76
Status: scan-confirmed
Strongest evidence: prose and terrain-adjustment table

Project wording:

- After terrain placement, players who chose fewer than the maximum number of terrain pieces may try to move, rotate, or remove terrain, excluding roads, rivers, coastal zones, and villages including any hill on which a village is placed.
- A compulsory terrain piece can be moved but not removed.
- If a player chose `2` terrain pieces, they may attempt to adjust two currently placed terrain pieces. If they chose `3`, they may attempt to adjust one. Compulsory terrain placed by the defender does not count toward these totals.
- Normally only one adjustment attempt per player per terrain piece is allowed, but a strategist may attempt one additional piece or reroll one failed adjustment die.
- The player may choose terrain placed either by themselves or by the opponent, and need not attempt any terrain adjustment at all.
- The terrain-adjustment table is explicit: `1-2` terrain stays in place; `3-4` it may be moved up to `4 UD`; `5` it may be moved up to `6 UD` or rotated, and impassable terrain may instead be removed; `6` it may be moved up to `6 UD` or rotated, and may also be removed unless it is compulsory or another piece has already been removed in this way.
- Rotation keeps one chosen point fixed. After moving, terrain may not overlap any other terrain piece except a road. Impassable terrain may be removed but not moved if the removal option is chosen.
- Once all terrain has been placed, each player starting with the defender deploys their camp together with any fortifications or obstacles.
- A camp must be in the player's deployment zone, either next to the player's table edge or beside a river or coastal zone. If the camp is fortified, it may be placed anywhere in the player's deployment zone.
- A camp must be in open terrain and must remain accessible by a passage at least `1 UD` wide through open terrain. A camp cannot be placed on a road.
- Fortifications and obstacles are placed in the player's deployment zone for heavy troops in any type of terrain except marshes, a river, or a coastal zone.
- Fortifications and obstacles must either touch and align with each other or be separated by at least `1 UD` so a unit can pass between them.
- The battle plan is a formal hidden-information step. Each player records the relative positions of corps not making a flank march, which corps if any are making a flank march and on which flank they will arrive, and the composition of each ambush.
- The plan does not need exact unit-by-unit placement. It records corps relationships such as left wing, center, or right wing.

![Table: terrain adjustment outcomes](rules-v2-examples/rv2-p76-terrain-adjustment-table-a.png)

Engine invariant:

- Terrain adjustment, camp placement, fortification placement, and battle plans are setup-state transitions with hidden-information consequences; they should not be represented as ad hoc battlefield edits.

Open verification:

- Later hardening should connect battle-plan data to deployment legality, flank-march arrival, and ambush reveal rules so private setup information stays separated from public battlefield state.

### rv2.ambushes-and-deployment

Source: Rules_Color_300DPI.pdf p.77-78
Status: scan-confirmed
Strongest evidence: prose and deployment or ambush diagrams

Project wording:

- Units in ambush are not deployed openly on the table. Instead, players place `1 UD` square ambush markers to indicate their position.
- Each player may place two ambush markers, or three if the commander-in-chief is a strategist. The defender places all ambush markers first, then the attacker.
- Ambush markers are placed before visible deployment starts.
- Both players may place ambush markers up to `5 UD` in from their own table edge, or up to `7 UD` if the ambush contains only light troops. The defender also has the extra privilege already noted earlier: in the two flank sectors the defender may place ambushes up to halfway across the table.
- Ambush markers must be placed in terrain that allows ambush, or behind a wood, plantation, village, or hill so long as the marker is out of sight from any point in the enemy deployment zone, including the enemy ambush zone.
- An ambush may contain up to four units other than artillery, scythed chariots, or war wagons. There must be enough room to deploy all ambushed units out of sight of the enemy and without overlap, and all units in one ambush must form a valid group.
- A commander may be in ambush only if it is not the commander-in-chief. A player may also place a fake ambush containing no units. The battle plan must record which units, if any, are in each ambush.
- Until revealed, an ambush is treated as an enemy unit even if it is fake. A unit that moves to within `4 UD` of an ambush marker cannot make a second or third move, and an ambush marker itself cannot be charged before discovery.
- An ambush is automatically revealed if an enemy comes within `1 UD`, if an enemy has clear line of sight to the marker, or if a friendly unit passes through the marker during interpenetration-style movement.
- When a unit reaches a position that reveals an ambush or comes within `1 UD` of the marker, it must stop moving. The opponent then declares whether the ambush contains troops. If fake, the marker is removed and the enemy can finish moving. If real, the ambushed units are deployed respecting three constraints: they must still form a valid group, stay inside the terrain or out of enemy sight at the start of movement, and one unit must be placed entirely on the ambush marker while no unit may be deployed within `1 UD` of an enemy.
- A player may reveal an ambush voluntarily during their own movement phase by deploying the units without moving them, spending no CP if they do not move. A player may also reveal an ambush during the opponent's movement phase as soon as an enemy is or comes within `4 UD` of the marker; the enemy may continue moving but cannot charge the newly revealed units that were in ambush.
- If an ambush is illegal or cannot be deployed, the units are placed by the opponent along the long table edge in the area of their corps deployment, or in tournament conditions may be treated as having fled the battle. Those absent units reduce the army's cohesion value but do not count as losses.
- If an entire corps is in ambush, the player may still roll each game-turn for CP as a concealment bluff even if those CP are not used.
- Visible corps deployment begins only after battle plans and ambush placement are complete. Starting with the defender, players alternate deploying one visible corps at a time until all visible corps are on the table. Corps in ambush or on flank march are excluded from this visible deployment.
- When placing a corps openly, the player must describe the troops to the opponent at the time of placement, including type, quality, and abilities.
- Corps must be deployed clearly as left wing, center, and right wing. A corps may not be deployed behind another. Each corps must fit inside its own rectangular deployment zone matching the battle plan, and all units belonging to that corps, even units in ambush, must belong to that zone. All non-ambushed units must also be within command range of their commander.
- Only the relative position of the deployment zones matters. Units are placed freely within their zone.
- On a standard `120 x 80 cm` table, light troops may deploy right up to the flank edges and up to `7 UD` from the long table edge. All other units, including the camp, must be at least `4 UD` from the flank edges and up to `5 UD` from the long table edge.
- On a non-standard table, deployment is adjusted. Light units deploy at least `3 UD` from the table center line; other troops must deploy `4 UD` or more from the lateral edges and `5 UD` from the center line.
- No unit may deploy in a coastal zone, river, or terrain in which it cannot move unless it is on a road.
- Once all units are placed, the player announces deployment completion. If asked, a player should state whether some units are not visible, but without specifying whether they are in ambush or on flank march.
- Dismounting choices are made after all corps have been deployed on the table. The defender chooses first, then the attacker, and dismounting follows the troop-type rules already defined earlier in the troop chapter.

![Diagram: ambush placement zones](rules-v2-examples/rv2-p77-ambush-zones-a.png)

![Diagram: deployment zones for heavy and light troops](rules-v2-examples/rv2-p78-deployment-zones-a.png)

Engine invariant:

- Ambushes and deployment require explicit hidden-state modeling, battle-plan linkage, reveal triggers, and legal placement geometry; these are setup-state systems, not just alternate starting coordinates.

Open verification:

- Later hardening should split the hidden-information model between true ambush contents, fake markers, visible deployment disclosure, and post-reveal placement restrictions.

### rv2.flank-marches-and-hesitant-corps

Source: Rules_Color_300DPI.pdf p.79-80
Status: scan-confirmed
Strongest evidence: prose

Project wording:

- A flank march is a corps that is not deployed on the table during setup but instead arrives later from one flank edge. The battle plan must state which corps is on flank march and on which flank it will arrive.
- Each player may attempt only one flank march. A flank march cannot be assigned to a flank blocked by a coastal zone or an impassable river.
- The corps containing the commander-in-chief may not be sent on flank march. A flank-march corps may not include war wagons, scythed chariots, or artillery.
- At the beginning of each movement phase, the player rolls `1D6` for the flank-march corps. A `6` on the first attempt, or `5-6` on later rolls, means it will arrive during the next game-turn. A corps consisting only of light cavalry gets `+1` to this roll.
- When the flank march is about to arrive, the player declares the table edge according to the flank recorded on the battle plan.
- In the game-turn after the successful arrival roll, all units in the flank march must move onto the table during that player's movement phase or they are lost.
- Units may enter anywhere along the chosen short or flank edge. Their first move must be perpendicular to that edge, measured from the table edge itself. It must be either a simple straight move without manoeuvre or a straight-ahead charge. All normal movement rules otherwise apply.
- All flank-march troops count as in command range on the turn they enter. If some units cannot enter because there is not enough room or the commander lacks enough CP to move them, those units are lost and removed from play. Units lost this way reduce army cohesion value but do not count as losses for army demoralisation.
- The arrival of a flank march can cause nearby enemies to flee. When the flank-march units move on to the table, all enemy units, including those in ambush, that are `4 UD` or less from the entry points panic and flee.
- If such an enemy is not already in melee or melee support, it makes an evade move perpendicular to the entry edge. If it is not normally allowed to evade, it still makes that evade move but loses one cohesion point, which can rout it.
- Units in melee or melee support do not flee and continue the fight. Artillery and war wagons not in melee are automatically eliminated instead of evading. Units that flee from a flank march may burst through friends if blocked by enemy units.
- If both players ordered a flank march on the same edge, the smaller corps is driven back. Light units count as half a unit when comparing corps size. If the two corps are the same size, both are driven back.
- A driven-back flank march enters on the next movement phase of its owning player from the flank edge up to `5 UD` from the player's base edge. Its first move must be a simple straight move without manoeuvre or charge. Its arrival does not cause enemy units to flee.
- Units of a repulsed flank march that approach within `4 UD` of an enemy become `Disordered`. The victorious flank march enters on the next movement phase and its arrival does cause the enemy to flee as normal.
- Allied or unreliable commanders can create `hesitant corps`. If the first activation die roll for a corps led by such a commander is a natural `1`, the corps is hesitant.
- A hesitant corps, or one that has not yet tested while allied or unreliable, cannot move or shoot and is not subject to uncontrolled charges.
- A hesitant corps cannot voluntarily reveal its ambushes. It must wait until they are discovered by the enemy.
- If a hesitant corps is on flank march, it cannot enter the table until it becomes reliable. Starting with the turn in which it becomes reliable, another `D6` is rolled immediately to see whether the flank march will arrive next turn.
- In each turn after the first, if the activation die roll is `6`, the hesitant corps becomes reliable. When that happens, a new die is rolled to determine the CP for that game-turn.
- The commander-in-chief may spend exactly `2 CP` each turn to give `+1` to the test for a hesitant corps to become reliable.
- A hesitant corps becomes reliable immediately if the enemy attacks or shoots at it, or comes within `4 UD` of one of its units. If some units of the hesitant corps are in ambush, the corps becomes reliable if an enemy comes within `1 UD` of the ambush marker, except for fake ambushes.

Engine invariant:

- Flank marches and hesitant corps need delayed-arrival state, hidden plan state, special entry movement, flee-on-arrival reactions, and reliability transitions; they cannot be modeled as ordinary reserve deployment.

Open verification:

- Later hardening should reconcile flank-march losses that reduce army cohesion value but do not count as losses with the army-rout accounting rules, so off-table setup failures are scored consistently.

### rv2.budget-and-force-costing

Source: Rules_Color_300DPI.pdf p.81
Status: scan-confirmed
Strongest evidence: prose and budget tables

Project wording:

- In the standard format game, the army budget is `200` points.
- A standard camp is free, but a sacred or fortified camp has an added point cost.
- Each army is organized into three corps led by commanders. Allied or unreliable commanders, and commanders included in a unit, are cheaper than their normal equivalents.
- The commander-and-camp budget table is the authoritative source for the point adjustments at `100`, `200`, and `300` point formats, including strategist, brilliant, competent, ordinary, allied or unreliable, included commanders, fortifications, obstacles, fortified camps, and sacred camps.
- The foot-unit and mounted-unit budget tables are the authoritative source for unit point costs by troop class and quality, plus the priced options that modify those units.
- The page also clarifies the shorthand used in the tables: `M = Mediocre`, `O = Ordinary`, and `E = Elite`.
- This budget page is the main bridge between the rules corpus and the army-list corpus. It states the force-construction cost framework, but the actual legal availability of troop types and command points still depends on the army list used.

![Table: commander and camp budget adjustments](rules-v2-examples/rv2-p81-budget-commander-camp-a.png)

![Table: foot unit costs and options](rules-v2-examples/rv2-p81-budget-foot-units-a.png)

![Table: mounted unit costs and options](rules-v2-examples/rv2-p81-budget-mounted-units-a.png)

Engine invariant:

- Budget logic should be data-driven from structured cost tables plus army-list constraints; it must stay separate from battlefield engine state.

Open verification:

- Later hardening should cross-check these costs against the army-list scans and spreadsheet before any army-builder import treats them as canonical structured data.

### rv2.optional-rules-and-variants

Source: Rules_Color_300DPI.pdf p.82-85
Status: scan-confirmed
Strongest evidence: prose and event-card tables

Project wording:

- The tail of the rulebook contains explicit optional and variant systems rather than baseline standard-200 tournament rules.
- `Reduced format` is a faster `100`-point variant. It changes army size, corps count, command value scaling, table size, scouting thresholds, terrain setup limits, ambush capacity, group size, and army-demoralisation values.
- `Big battles` expands the game to `300` or `400` points, increasing corps count, command value, table size, terrain size, scouting thresholds, ambush capacity, and in the `400`-point case moving to doubles-style play with joint demoralisation accounting.
- `Random factor` introduces alternative dice schemes meant to reduce variance in melee while leaving command points, shooting, rallying, evade-distance adjustment, commander elimination, and camp attack on ordinary dice unless the option says otherwise.
- The page lists several interchangeable random-factor variants: average dice, `D8` or `D4`, `D10`, rerolling `1s` and `6s`, and `3D6` keeping the middle die.
- `Using cards` replaces dice rolls with modified card decks and fixes left-to-right resolution order for melees and shots relative to the phasing player.
- `Rerolls` gives each player a pool of rerolls for shooting, melee, rallying, or command-point generation, with explicit exclusions such as evade-distance adjustment, camp attack, and commander elimination.
- `Demoralisation rules` is another optional variant that changes army-demoralisation values by troop importance, making expendables negligible and elite troops more important.
- `Events` uses a standard deck with jokers. Players draw cards before initiative, picture cards create shared events, and the suit tables on `p85` define the concrete effects for hearts, clubs, diamonds, and spades, plus weather-related jack effects and joker cancellation.
- These optional systems are source-significant and should remain in the corpus, but they are not the default project target unless the user explicitly reprioritizes away from standard `200`.

![Table: heart event cards](rules-v2-examples/rv2-p85-events-hearts-a.png)

![Table: club event cards](rules-v2-examples/rv2-p85-events-clubs-a.png)

![Table: diamond event cards](rules-v2-examples/rv2-p85-events-diamonds-a.png)

![Table: spade event cards](rules-v2-examples/rv2-p85-events-spades-a.png)

Engine invariant:

- Optional formats and event systems should be modeled as separate format or variant profiles layered on top of the standard rules, not merged into default legality.

Open verification:

- Later hardening should keep the standard-200 baseline explicit whenever reduced format, big battles, rerolls, cards, demoralisation variants, or events are discussed so optional systems do not leak into the default rules track.

### rv2.back-cover

Source: Rules_Color_300DPI.pdf p.86
Status: scan-confirmed
Strongest evidence: back-cover artwork and marketing text

Project wording:

- The last page is back-cover presentation only and does not add rules content.

Engine invariant:

- None.

## RV2-02 Working Example Library

Status: first-pass focused-crop inventory is agent-complete on 2026-05-23 across pages `1-86`; manual crop-quality and completeness spot-checks remain pending.

Primary inventory: `rules-v2-examples/index.md`

### Equipment And Basing

![Table: basing dimensions by troop category and figure scale](rules-v2-examples/rv2-p07-basing-table-a.png)

![Diagram: how units are represented on the tabletop](rules-v2-examples/rv2-p08-unit-representation-diagram-a.png)

### Unit Basics And Etiquette

![Example: legal and illegal groups of units](rules-v2-examples/rv2-p10-groups-of-units-example-a.png)

### Troops And Unit Characteristics

![Example box: two-handed weapon against armour and missile support](rules-v2-examples/rv2-p18-2hw-armour-example-box-a.png)

![Example box: impact versus furious charge interactions](rules-v2-examples/rv2-p19-impact-example-box-a.png)

![Example: elephants causing panic](rules-v2-examples/rv2-p19-elephants-causing-panic-a.png)

![Table: unit characteristics tables for foot and mounted troops](rules-v2-examples/rv2-p22-unit-characteristics-tables-a.png)

### Rallying

![Example: rallying with command-point costs by proximity](rules-v2-examples/rv2-p55-example-of-rallying-a.png)

### Setup And Command

![Table: commander quality values](rules-v2-examples/rv2-p24-commander-quality-table-a.png)

![Example box: strategist command points](rules-v2-examples/rv2-p25-strategist-cp-example-box-a.png)

![Example: command range for ordinary, mounted, and light troops](rules-v2-examples/rv2-p26-command-range-example-a.png)

![Example: commanders and groups](rules-v2-examples/rv2-p27-commanders-and-groups-a.png)

### Movement And Manoeuvres

![Table: movement allowance by troop type and terrain](rules-v2-examples/rv2-p29-movement-allowance-table-a.png)

![Example: measurement of distances with wheel and slide](rules-v2-examples/rv2-p30-measurement-of-distances-a.png)

![Example: slides during movement](rules-v2-examples/rv2-p30-examples-of-slides-a.png)

![Example: wheel manoeuvres](rules-v2-examples/rv2-p31-wheel-examples-a.png)

![Example: half-turn on the spot](rules-v2-examples/rv2-p31-half-turn-on-the-spot-a.png)

![Example: from line to column](rules-v2-examples/rv2-p32-from-line-to-column-a.png)

![Example: from column to line with blocked frontage](rules-v2-examples/rv2-p32-from-column-to-line-a.png)

![Example: war wagons quarter-turn](rules-v2-examples/rv2-p32-war-wagons-quarter-turn-a.png)

![Example: extension manoeuvre](rules-v2-examples/rv2-p33-extension-example-a.png)

![Example: contraction manoeuvres](rules-v2-examples/rv2-p34-contraction-examples-a.png)

### Zone Of Control

![Diagram: zone of control definition at one UD](rules-v2-examples/rv2-p35-zoc-definition-a.png)

![Example: most threatening enemy in zone of control](rules-v2-examples/rv2-p36-most-threatening-enemy-a.png)

![Example: prohibited move in zone of control](rules-v2-examples/rv2-p36-prohibited-move-zoc-a.png)

![Example: advance in a zone of control](rules-v2-examples/rv2-p36-advance-in-zoc-a.png)

![Example: protecting a flank with zone of control](rules-v2-examples/rv2-p37-protecting-flank-a.png)

![Example: special case for most threatening enemy and interposing unit](rules-v2-examples/rv2-p37-zoc-special-case-a.png)

![Example: involuntary exit from a zone of control](rules-v2-examples/rv2-p38-involuntary-exit-zoc-a.png)

![Example: terrain-sensitive zone of control interactions](rules-v2-examples/rv2-p38-zoc-example-a.png)

![Example box: cavalry in rough terrain and medium infantry zone of control](rules-v2-examples/rv2-p38-zoc-terrain-example-box-a.png)

### Interpenetration And Contact

![Example: interpenetration with partial crossing and adjustment](rules-v2-examples/rv2-p39-interpenetration-example-a.png)

![Example: sliding along the enemy](rules-v2-examples/rv2-p41-sliding-along-enemy-a.png)

![Diagram: front, flank, and rear contact types](rules-v2-examples/rv2-p41-types-of-contact-a.png)

### Charge

![Table: adjusted charge distance by D6 roll](rules-v2-examples/rv2-p43-adjusted-charge-distance-table-a.png)

![Example: continuing a charge into secondary targets](rules-v2-examples/rv2-p44-continuing-a-charge-example-a.png)

![Example: illegal charge into a unit already in melee support](rules-v2-examples/rv2-p44-illegal-charge-a.png)

![Example box: when light troops do not trigger uncontrolled charge](rules-v2-examples/rv2-p46-uncontrolled-charge-example-box-a.png)

![Example: uncontrolled charge resolution across several impetuous units](rules-v2-examples/rv2-p46-uncontrolled-charge-example-a.png)

### Evade

![Example: evading unit orientation after flank charge](rules-v2-examples/rv2-p47-evade-orientation-a.png)

![Example: evade blocked by enemy zone of control](rules-v2-examples/rv2-p47-evade-blocked-zoc-a.png)

![Example: evade blocked by obstacle](rules-v2-examples/rv2-p48-evade-blocked-obstacle-a.png)

![Example: optional wheel to match charge direction during evade](rules-v2-examples/rv2-p48-evade-direction-a.png)

![Table: adjusted evade distance by D6 roll](rules-v2-examples/rv2-p48-evade-distance-table-a.png)

![Example: evade movement with slide and wheel around new obstacles](rules-v2-examples/rv2-p49-evade-movement-a.png)

### Conformation

![Example: conformation after charge against the most threatening enemy](rules-v2-examples/rv2-p50-conformation-after-charge-a.png)

![Example: alternate charge conformation sequence](rules-v2-examples/rv2-p50-conformation-other-example-a.png)

![Example: conformation to give support in melee](rules-v2-examples/rv2-p51-conformation-support-a.png)

![Example: conforming units already in contact](rules-v2-examples/rv2-p51-conformation-already-contact-a.png)

![Example: another conformation case with prior melee occupancy](rules-v2-examples/rv2-p51-conformation-another-example-a.png)

![Example: conforming units in melee](rules-v2-examples/rv2-p52-conformation-in-melee-a.png)

![Example: conformation during pursuit contact](rules-v2-examples/rv2-p52-conformation-pursuit-a.png)

![Example: conformation constrained by enemy zone of control](rules-v2-examples/rv2-p52-conformation-zoc-a.png)

![Example: shifting units when conforming](rules-v2-examples/rv2-p53-shifting-units-a.png)

![Example: incomplete conformation](rules-v2-examples/rv2-p53-incomplete-conformation-a.png)

![Example: conformation limited by penalising terrain](rules-v2-examples/rv2-p53-conformation-terrain-a.png)

![Example: incomplete flank conforming](rules-v2-examples/rv2-p53-incomplete-flank-conforming-a.png)

![Example: ambiguous conformation resolved by principal opponent](rules-v2-examples/rv2-p54-ambiguous-conformation-a.png)

![Example: columns attacked from the flank](rules-v2-examples/rv2-p54-columns-attacked-flank-a.png)

### Shooting

![Table: shooting ranges by missile weapon](rules-v2-examples/rv2-p56-shooting-ranges-table-a.png)

![Diagram: shooting zone and range by troop type](rules-v2-examples/rv2-p57-shooting-zone-a.png)

![Example: line of sight and priority target](rules-v2-examples/rv2-p58-line-of-sight-a.png)

![Table: shooting circumstance modifiers](rules-v2-examples/rv2-p58-shooting-modifiers-a.png)

![Example: shooting priority, support, and simultaneous results](rules-v2-examples/rv2-p59-shooting-example-a.png)

### Melee

![Table and example: melee resolution and furious charge](rules-v2-examples/rv2-p62-melee-resolution-table-a.png)

![Example: support number one](rules-v2-examples/rv2-p61-support-example-1-a.png)

![Example: support number two](rules-v2-examples/rv2-p61-support-example-2-a.png)

![Example: flank or rear attack](rules-v2-examples/rv2-p63-flank-rear-attack-a.png)

![Example box: incomplete flank or rear contact still gains the situation modifier](rules-v2-examples/rv2-p64-situation-modifier-example-a.png)

![Example: height advantage on a hill](rules-v2-examples/rv2-p64-height-advantage-a.png)

![Example page: melee examples](rules-v2-examples/rv2-p65-melee-examples-a.png)

![Example: camp assault with multiple attacks and rout effect](rules-v2-examples/rv2-p66-attacking-camp-example-a.png)

### Rout And Pursuit

![Example: war wagon support and contact limits](rules-v2-examples/rv2-p67-war-wagons-support-a.png)

![Table: elephant rampage direction](rules-v2-examples/rv2-p68-elephant-rampage-table-a.png)

![Example: routing elephant and cascading losses](rules-v2-examples/rv2-p68-routing-example-a.png)

![Table: army cohesion losses](rules-v2-examples/rv2-p69-army-cohesion-losses-a.png)

![Example box: current army cohesion value and losses](rules-v2-examples/rv2-p69-army-rout-example-a.png)

### Terrain

![Table: river difficulty](rules-v2-examples/rv2-p71-river-difficulty-table-a.png)

![Example: hills and visibility zones](rules-v2-examples/rv2-p71-hills-visibility-a.png)

![Table: terrain categories, ambush permissions, and cover](rules-v2-examples/rv2-p72-terrain-table-a.png)

![Table and example: compulsory terrain by region](rules-v2-examples/rv2-p73-compulsory-terrain-table-a.png)

![Table: terrain availability by topographic setting](rules-v2-examples/rv2-p74-terrain-selection-table-a.png)

![Diagram: terrain sectors for placement](rules-v2-examples/rv2-p75-terrain-sectors-a.png)

![Table: terrain position relative to table edges](rules-v2-examples/rv2-p75-terrain-position-table-a.png)

![Table: terrain adjustment outcomes](rules-v2-examples/rv2-p76-terrain-adjustment-table-a.png)

### Setup

![Diagram: ambush placement zones](rules-v2-examples/rv2-p77-ambush-zones-a.png)

![Diagram: deployment zones for heavy and light troops](rules-v2-examples/rv2-p78-deployment-zones-a.png)

### Budget

![Table: commander and camp budget adjustments](rules-v2-examples/rv2-p81-budget-commander-camp-a.png)

![Table: foot unit costs and options](rules-v2-examples/rv2-p81-budget-foot-units-a.png)

![Table: mounted unit costs and options](rules-v2-examples/rv2-p81-budget-mounted-units-a.png)

### Optional Rules

![Table: heart event cards](rules-v2-examples/rv2-p85-events-hearts-a.png)

![Table: club event cards](rules-v2-examples/rv2-p85-events-clubs-a.png)

![Table: diamond event cards](rules-v2-examples/rv2-p85-events-diamonds-a.png)

![Table: spade event cards](rules-v2-examples/rv2-p85-events-spades-a.png)