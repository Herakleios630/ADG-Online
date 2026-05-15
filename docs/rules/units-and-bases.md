# Units And Bases

Status: planning blueprint; not a complete troop or army-list extract.

## Purpose

This file defines the data boundary between stable unit catalog facts, mutable match-state facts, roster-selection facts, and shared base or rule-table data.

It exists to keep later geometry, setup, movement, combat, and army-builder phases from duplicating rule facts in the wrong place.

## Core Separation

Use these buckets consistently:

- `FormatProfile`: match-level constraints such as points cap, corps count, camp requirement, battlefield profile, and setup hooks.
- `Roster`: selected army content and validation state for one side before or alongside battle setup.
- `UnitDefinition`: stable troop identity and default rule hooks derived from army-list and rule sources.
- `BaseProfile`: shared base size and shape facts.
- `UnitInstance`: mutable current battlefield state for one specific unit in one specific match.
- `RuleTables`: shared derived values such as movement allowances, combat factors, terrain effects, command costs, and setup restrictions.

## Unit Definition

`UnitDefinition` should describe what a unit is, not what it is currently doing.

Typical fields:

- `id`
- `armyListId`
- `listEntryId`
- `troopType`
- `category`
- `baseProfileId`
- `defaultQuality`
- `defaultCohesion`
- `protection`
- `defaultAbilities`
- `keywords`
- `rosterConstraints`
- `sourceRefs`

Allowed examples:

- heavy infantry versus cavalry identity
- listed armour or protection class
- default base profile hook
- printed troop abilities or options

Not allowed here:

- current x/y position
- current angle or facing on the battlefield
- current cohesion loss
- current in-command or out-of-command status
- hardcoded movement distance for the current terrain or command state
- current combat factor against the current opponent

## Base Profile

`BaseProfile` should hold reusable measurement facts shared by many units.

Typical fields:

- `id`
- `widthUd`
- `depthUd`
- `shape`
- `sourceRefs`

Base dimensions should come from shared profiles or a small shared catalog, not from repeated magic numbers across roster and engine code.

## Unit Instance

`UnitInstance` should describe one unit inside one match right now.

Typical fields:

- `id`
- `ownerId`
- `armyId`
- `corpsId`
- `definitionId`
- `listEntryId`
- `quality`
- `cohesion`
- `maxCohesion`
- `abilities`
- `base`
- `pose`
- `status`
- `visibilityState`
- `temporaryEffects`
- `actionFlags`

Allowed examples:

- current position and angle
- current cohesion or disorder
- whether the unit has moved, routed, engaged, dismounted, or revealed
- whether the unit is in ambush, off table, in command, or currently in contact

Not allowed here:

- global movement allowance tables
- standard format point cap
- battle region terrain quotas
- universal combat factor tables
- hardcoded command costs

## Roster

`Roster` should hold army-building and pre-battle legality state, not live battlefield motion.

Typical fields:

- `id`
- `playerId`
- `armyListId`
- `formatId`
- `selectedEntries`
- `corpsAssignments`
- `commanderSelections`
- `campSelection`
- `pointsSpent`
- `validationState`
- `sourceRefs`

Roster data may later feed setup and deployment, but it must stay distinct from the live unit-instance layer.

## Rule Tables

`RuleTables` should own shared derived facts and lookup surfaces.

Typical table families:

- format profiles
- battlefield profiles
- base profiles
- movement allowances and maneuver costs
- command costs and command restrictions
- ZOC rules and exceptions
- combat factors and cohesion results
- terrain effects and setup restrictions
- conformation rules
- victory conditions

If a value changes because of terrain, command status, contact type, opponent type, support, or phase context, it is probably not a permanent field on the unit instance.

## Engine Invariants

- UI and asset layers may display unit identity, but they never decide legality.
- Point costs, movement allowances, combat factors, and setup restrictions must come from authoritative data or rule tables, not UI components.
- A unit instance may override default quality or abilities because of scenario or roster choice, but that override is still current match state, not a new global definition.
- A roster may be invalid while unit definitions remain perfectly valid catalog entries.
- Base geometry must remain render-independent so future sprite changes do not alter legality.

## Open Verification

- Exact base-size catalog and whether it is fully standardized by troop family or also army-list specific.
- Which troop characteristics belong in unit definitions versus later command or combat tables.
- Which army-list options permanently alter a unit definition versus only altering roster choice or current instance state.
- Whether any setup-only statuses should live outside the main unit instance until deployment completes.

When unresolved source questions affect this split, track them in `docs/rules/open-verification.md`.