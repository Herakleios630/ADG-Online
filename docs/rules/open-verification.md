# Open Rule Verification

This file tracks rule areas that must be checked directly against the source documents before implementation.

## High Priority

- Standard 200-point profile: 200 points, three corps, mandatory camp, commander/camp budget, standard battlefield profile, and initiative inputs.
- Sequence of play and exact phase names.
- Complete pre-battle sequence: initiative, attacker/defender, region, terrain, terrain adjustment, camps/fortifications, battle plan, ambushes, deployment, dismounting, start battle.
- Terrain placement procedure: regions, compulsory terrain, selection quotas, legal terrain shapes, deployment zones, camps, fortifications, obstacles, roads, rivers, hills, and villages.
- Hidden information: battle plans, ambush contents, fake markers, flank marches, reveal triggers, hotseat player views, replay visibility.
- Deployment: corps zones, command range at deployment, commander placement, visible/off-table forces, dismounting order.
- Movement allowance table by troop type, terrain, road, and special state.
- Wheel, slide, turn, extension, contraction, interpenetration, and difficult maneuver restrictions.
- ZOC definition, exceptions, most-threatening enemy tie breakers, and ZOC movement permissions.
- Charge declaration, contact type, charge range, minimum advance, evade, and reaction rules.
- Conformation diagrams, shifting restrictions, incomplete conformation, already-in-contact cases, and errata amendments.
- Shooting ranges, line of sight, cover, terrain effects, target priorities, and results.
- Melee combat factors, support, multiple attacks, terrain penalties, abilities, quality, cohesion loss, and errata amendments.
- Rout, pursuit, rally, army cohesion, victory, and end-game conditions.
- Army list data conversion from printed lists and spreadsheet formulas.

## Source Extraction Notes

- `Rules.pdf` and `ArmyLists1-82.pdf` produced almost no usable text through normal PDF extraction.
- Rendered visual page sheets exist in the temporary extraction folder from the initial architecture pass, but durable rule summaries must be written here before implementation relies on them.
- Errata text was readable and should be summarized into `errata.md` before implementing affected systems.
