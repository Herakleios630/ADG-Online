# Terrain And Setup

Status: planning skeleton for P3; exact terrain tables, geometry, and placement restrictions still require source verification.

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

## P3 Terrain Object Families

P3 should not treat all terrain as one generic blob. At minimum, planning must distinguish:

- region-driven compulsory terrain;
- optional terrain pieces selected by each side;
- roads and rivers with special placement order or geometry rules;
- elevated or enclosed terrain such as hills, villages, plantations, woods, and fields where applicable;
- camps, sacred or fortified camps, fortifications, obstacles, and stakes as setup objects that interact with terrain rules but are not just decorative terrain.

Different object families may need different placement order, size rules, overlap rules, combat effects, and visibility behavior.

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

P3 should also expect later separation between:

- terrain definition fields shared by all instances of a terrain type;
- terrain instance fields such as chosen size, orientation, region slot, and current placement;
- placement validation facts such as spacing, overlap, edge contact, river or road continuity, and deployment-zone interaction.

## Terrain Instance Fields Needed Later

Each placed terrain object will likely need at least:

- `id`
- `terrainType`
- `regionId`
- `ownerRole` if placement rights matter
- `shapeModel`
- `sizeUd`
- `pose`
- `placementStep`
- `isCompulsory`
- `adjustmentState`
- `sourceRefs`

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

## Setup Object Fields Needed Later

P3 should be able to model at least these setup-object families and typical data hooks:

### Camps

- camp type
- owning army
- fortified or sacred flags where legal
- placement pose or region
- point or budget implications
- visibility status if any special rule applies

### Fortifications And Obstacles

- type
- owner
- linked camp or battlefield area if required
- size or segment model
- placement pose
- terrain interaction
- source refs

### Battle Plans And Private Declarations

- declaration type
- owning player
- visibility scope
- locked-at setup state
- reveal triggers

### Ambush Markers And Flank Marches

- marker id or declaration id
- owning player
- canonical hidden contents
- public shell or marker state
- legal placement or entry zones
- reveal or arrival conditions

### Deployment And Dismounting

- corps deployment zone reference
- unit placement set
- commander placement set
- off-table state if used
- dismount choice and resulting unit-state effect

## Setup State Ownership And Data Boundaries

The setup system should treat each object family as belonging to a specific setup state rather than one large freeform editor.

- Region choice belongs to `setup.region-selection` and locks the terrain framework for later states.
- Terrain pieces belong to `setup.terrain-selection-and-placement` and become locked inputs to later camp and deployment states.
- Terrain adjustment belongs to its own `setup.terrain-adjustment` state, not as a casual edit after camps or deployment.
- Camps, fortifications, obstacles, and stakes belong to `setup.camps-fortifications-obstacles`.
- Battle plans, ambushes, and flank marches belong to private-declaration states and must preserve hidden-information boundaries.
- Visible unit deployment belongs to `setup.visible-deployment`.
- Dismounting belongs to a later dedicated setup decision state if the rules require it before battle begins.

## Setup Object Visibility

- Terrain pieces, camps, fortifications, obstacles, and visible deployments are public once placed.
- Battle plans, ambush contents, fake markers, flank-march composition, and some off-table choices are canonical but visibility-scoped.
- Setup validation must be able to reason over canonical hidden state even when the UI only shows a player-specific view.

## P3 Data Requirements

Before P3 starts implementation, the planning set should know or explicitly block:

- region catalog and compulsory terrain relationships;
- terrain selection quotas and duplicate-piece limits;
- legal terrain size categories or bounds;
- placement order including road-last behavior;
- terrain-adjustment timing and permissions;
- camp, fortification, obstacle, and stake legality requirements;
- deployment-zone dependencies on terrain and setup state;
- battle plan, ambush, flank march, and dismount timing relative to visible deployment.

## P3 Blocker Summary

P3 should not begin assuming these are already settled:

- exact region table;
- exact terrain counts by region or player;
- exact terrain geometry minima and maxima;
- exact road, river, coastal-zone, village, and overlap rules;
- exact terrain-adjustment process;
- exact camp, fortification, obstacle, and stake restrictions;
- exact deployment-zone math and any terrain-driven exceptions;
- exact ambush-placement and flank-march declaration constraints.

## Open Verification

- Exact region table and terrain counts.
- Exact terrain size minima and maxima for standard 200.
- Exact placement restrictions for terrain overlap, roads, rivers, coastal zones, and villages.
- Exact terrain adjustment table.
- Exact camp and fortification placement restrictions.
- Exact state boundary between visible deployment, hidden declarations, and dismounting.
- Exact terrain object families and whether any share placement or size rules that should stay in common rule tables.
