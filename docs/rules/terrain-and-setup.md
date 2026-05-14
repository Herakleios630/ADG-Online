# Terrain And Setup

Status: initial planning extract; requires full source verification before implementation.

## Source References

- `Rules.pdf`, terrain description around pages 71-72.
- `Rules.pdf`, setting up around pages 73-76.
- `Errata_ADG_V4_English.pdf`, terrain, deployment, and setup corrections.

## Terrain Selection Model

Terrain is chosen by region and role.

Planning facts:

- the player with initiative chooses the region based on attacker/defender decision;
- each region has a compulsory terrain type;
- the defender places compulsory terrain;
- each player chooses a limited number of terrain pieces;
- a player cannot choose more identical pieces than allowed;
- river or coastal-zone selection may require a die roll;
- road placement happens last;
- terrain adjustment happens after placement and can be affected by a strategist.

## Terrain Data Fields

Each terrain definition should include:

- `terrainType`;
- `regionAvailability`;
- `mandatoryInRegions`;
- `selectionLimit`;
- `sizeBoundsUd`;
- `placementOrder`;
- `edgeConstraints`;
- `spacingRules`;
- `category` such as open, rough, difficult, impassable, variable;
- `coverEffect`;
- `shootingEffect`;
- `movementEffect`;
- `combatEffect`;
- `ambushPermission`;
- `visibilityEffect`;
- `roadInteraction`;
- `sourceRefs`.

## Setup Objects

Setup must also model:

- camps;
- fortified or sacred camps;
- fortifications;
- obstacles;
- deployment zones;
- battle plan declarations;
- ambush markers;
- flank marches;
- dismounting decisions.

## Open Verification

- Exact region table and terrain counts.
- Exact terrain size minima and maxima for standard 200.
- Exact placement restrictions for terrain overlap, roads, rivers, coastal zones, and villages.
- Exact terrain adjustment table.
- Exact camp and fortification placement restrictions.
