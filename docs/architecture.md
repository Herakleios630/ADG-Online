# AdG Online Architecture Blueprint

## Purpose

AdG Online is a deterministic tabletop simulation engine for AdG V4-style play. The engine is not a loose adaptation: it must model the tabletop rules as written, including errata, exceptions, ambiguous physical cases, command restrictions, and conformation duties. The application exists for tournament training, rule explanation, replay, and eventually authoritative multiplayer.

This document is a system blueprint only. It intentionally contains no engine implementation.

## Source Material

Primary sources live in `Konzepte/` and must remain the project source of truth:

- `Rules.pdf`: base AdG V4 rules.
- `Errata_ADG_V4_English.pdf`: corrections and clarifications. Errata overrides the rulebook.
- `Reglettes.pdf`: movement ruler distances by troop family.
- `ArmyLists1-82.pdf`: printed army list structure and constraints.
- `Army_list_spreadsheet_V4 (1).xlsx`: budget formats, point calculations, army index, and calculator structure.
- `Konzept.pdf`: initial project architecture direction.

Important extraction note: the main rulebook and army-list PDFs are image-based in this workspace. The architecture below was prepared from visual inspection of rendered pages plus extracted text from the errata, ruler sheet, concept document, and spreadsheet. Before implementing each phase, the current phase rules must be manually verified against the relevant PDF pages.

## Core Philosophy

Rule accuracy is the highest priority. The engine must reject an action if the tabletop rules reject it, even when a permissive approximation would feel smoother in a digital UI.

The engine must be deterministic. Given the same initial state, action log, random seed, and player decisions, it must produce the same resulting state and explanations.

The engine must be explainable. Every validation result must include rule-grounded reasons, references, computed measurements, and the exact state facts used in the decision.

The engine must be modular. UI, rendering, multiplayer transport, state persistence, and rule logic must remain separate. No canvas event should directly mutate game state. No combat rule should know how a panel is rendered.

The engine must be incremental. Work proceeds from P0 upward. A phase cannot start until the prior phase has been demonstrated and approved by the user.

The product must become a complete playable game, not only a geometry/rules sandbox. The final game includes a start menu, options, army selection, terrain placement, deployment, all game phases, single-device singleplayer/hotseat play, replay, and multiplayer preparation.

The default product target is official-style standard 200-point tournament training for two players. Other formats are secondary until the 200-point path is rule-complete.

The project must stay modular. JavaScript files target fewer than 800 lines and must not exceed 1000 lines without explicit approval and a refactor plan.

Before every feature phase, the team performs a short brainstorming and rule-verification pass: re-check concepts, source rules, errata, data needs, UI expectations, edge cases, and tests.

See `docs/project-governance.md` for workflow, testing, memory, branch, commit, push, and PR rules.

See `docs/rules-knowledge.md` for the plan to turn image-heavy PDFs into AI-readable markdown and structured rule tables.

## Final Game Scope

The final product should support a complete match flow:

1. Launch into a start menu.
2. Choose mode: training, local singleplayer/hotseat, replay viewer, army builder, multiplayer when available.
3. Configure options: ruleset version, point format, player names, player colors, display scale, explanation level, debug overlays, input preferences, and accessibility settings.
4. Select or build armies.
5. Create battlefield, place terrain, camps, fortifications, obstacles, and deployment zones according to the rules.
6. Deploy units, commanders, ambushes, and off-table forces.
7. Play all phases through a deterministic rule engine.
8. Resolve victory, army cohesion, end-of-game state, replay export, and post-game review.

Singleplayer initially means local manual play on one device with the engine enforcing both sides. A true AI opponent is a later optional layer and must not be allowed to simplify the rules.

## Standard 200-Point Profile

The first complete ruleset profile is `standard-200`.

Default values:

- 200 points per army;
- two players;
- three corps per army;
- one commander per corps;
- one mandatory camp per army;
- standard 6-15 mm battlefield: 120 x 80 cm;
- UD = 4 cm;
- standard D6 rules unless an optional dice rule is explicitly selected later;
- reduced 100-point and big-battle 300/400-point formats are later variants, not early design drivers.

Standard 200 is a rules profile, not a UI preset. It affects army validation, table size, terrain size, setup sequence, deployment zones, command budgets, camp budget, and scenario fixtures.

## Training Modes

Tournament preparation needs several strictness levels without changing legality.

- Tournament Training: strict official sequence, standard-200 default, hidden information respected, limited post-confirmation undo, explanations available but no illegal shortcuts.
- Study Mode: same rules, deeper explanations, debug overlays, source references, replay branching, and broad undo for learning.
- Sandbox/Dev Mode: incomplete features and artificial fixtures allowed, but clearly marked as not tournament-complete.

No mode may turn an illegal action into a legal one. Modes only affect assistance, visibility, undo, overlays, and pacing.

## Game Shell

The UI shell is separate from the engine.

Screens:

- start menu;
- mode select;
- options/settings;
- army builder;
- game setup;
- terrain placement;
- deployment;
- battlefield;
- combat/reaction dialogs;
- replay viewer;
- multiplayer lobby later.

The shell stores user preferences separately from game state. User settings can influence presentation, controls, colors, and debug overlays, but never rule legality.

## High-Level Architecture

```text
UI interaction layer
  -> action proposal
Engine rule modules
  -> validation result + explanation
Reducer / state transition
  -> new GameState
Action log
  -> replay, undo, multiplayer sync
Authoritative server, later phase
  -> validates accepted actions and broadcasts canonical events
```

The client proposes actions. The engine validates them. The reducer applies only validated actions. Replay and multiplayer use the same action format, so local play and network play share one rule path.

## Project Structure Target

```text
src/
  engine/
    geometry/
    movement/
    zoc/
    command/
    combat/
    conformation/
    terrain/
    validation/
    replay/
    random/
    setup/
    visibility/
    ai/
  state/
  data/
    armies/
    rules/
    units/
    assets/
  ui/
    shell/
    canvas/
    input/
    overlays/
    panels/
    settings/
    menus/
    setup/
    replay/
    training/
  multiplayer/
  assets/
  systems/
  utils/
docs/
  rules/
Konzepte/
.github/agents/
```

Only the base Vite shell exists at project initialization. The target structure will be created gradually by phase, not all at once.

## Module Responsibilities

`engine/geometry` owns points, vectors, rotated rectangles, base edges, intersections, projections, facing zones, nearest-point calculations, swept bounds, table-edge checks, and distance measurement in UD.

`engine/movement` owns movement command definitions, move segmentation, movement allowance accounting, advance, wheel, slide, quarter-turn, half-turn, extension, contraction, disengage, evade, charge movement, and multi-move composition.

`engine/zoc` owns ZOC construction, ZOC exceptions, most-threatening-enemy selection, ZOC entry/exit detection, and legal movement while inside enemy ZOC.

`engine/command` owns corps activation, commander quality, CP generation, CP spending, command range, free commander CP, out-of-command costs, unreliable or hesitant corps rules, and phase sequencing.

`engine/combat` owns shooting, melee, combat factor lookup, support classification, dice results, modifiers, cohesion loss, commander risk, rout, pursuit, camp attacks, and calculation breakdowns.

`engine/conformation` owns contact classification, alignment duties, support conformation, already-in-contact conformation, shifting, incomplete conformation, special conformation, and conformation after pursuit.

`engine/terrain` owns terrain categories, visibility, cover, movement penalties, combat penalties, terrain placement legality, and rule exceptions such as roads, rivers, bridges, hills, and fortifications.

`engine/validation` orchestrates rule checks and returns structured diagnostics. It does not own rule facts; it coordinates modules and formats reasons.

`engine/replay` owns action logs, deterministic re-application, snapshots, undo boundaries, and replay playback state.

`engine/random` owns seeded dice and random draws. Dice are never taken directly from `Math.random()`.

`engine/setup` owns pre-game sequence, terrain placement legality, camp and fortification placement, deployment, ambush state, off-table forces, and transition into turn one.

`engine/visibility` owns player-scoped state views, hidden battle plans, ambush contents, fake markers, flank marches, reveal triggers, and replay visibility modes.

`engine/ai` is a future client of the engine action API. It may propose actions but cannot decide legality, inspect hidden enemy data, or bypass validators.

`state` owns serializable state types and reducers. State must be plain data, not class instances with hidden behavior.

`data` owns JSON rules, army lists, unit catalogs, point tables, terrain definitions, and errata overlays.

`assets` and `data/assets` own visual mapping from unit definitions to rectangles, PNG sprites, sprite atlases, masks, and player-color palettes. Asset data never changes rules.

`ui` owns rendering and input translation. It can ask the engine for previews and explanations, but cannot decide legality.

`multiplayer` owns transport, server action submission, canonical action receipts, reconciliation, and lobby/session shape. It never bypasses engine validation.

## Complete Sequence Of Play

The engine must eventually represent the full game lifecycle, not only battlefield movement.

```text
app boot
  -> start menu
  -> mode and options
  -> army selection or army builder
  -> standard-200 format confirmation
  -> initiative calculation and roll
  -> attacker/defender decision
  -> region selection
  -> terrain selection and placement
  -> terrain adjustment
  -> camps, fortifications, and obstacles
  -> private battle plans
  -> ambush markers and flank march declarations
  -> corps deployment
  -> dismounting decisions
  -> turn loop
       -> initiative / active player context where applicable
       -> corps activation and command points
       -> charges, reactions, evades, and movement
       -> shooting
       -> melee combat
       -> routs, pursuits, cohesion, rally, and cleanup
       -> victory checks and end turn
  -> result screen and replay export
```

Each stage is an explicit game state, so UI screens and multiplayer sync can resume safely.

## Data Model Blueprint

All core state must be serializable JSON.

```ts
GameState = {
  schemaVersion,
  rulesetVersion,
  randomSeed,
  mode,
  formatId,
  battlefieldProfileId,
  settingsSnapshot,
  setupState,
  turn,
  phase,
  activePlayerId,
  activeCorpsId,
  players,
  armies,
  corps,
  units,
  commanders,
  terrain,
  deployment,
  hiddenInfo,
  visibility,
  combats,
  pendingDecisions,
  actionLog
}
```

Data is split into three layers.

`UnitDefinition` is stable rules/data identity:

```ts
UnitDefinition = {
  id,
  troopType,
  category,
  baseProfileId,
  defaultQuality,
  defaultCohesion,
  defaultAbilities,
  visualProfileId,
  sourceRefs
}
```

`UnitInstance` is current match state:

```ts
UnitInstance = {
  id,
  ownerId,
  armyId,
  corpsId,
  definitionId,
  listEntryId,
  quality,
  cohesion,
  maxCohesion,
  abilities,
  base: { widthUd, depthUd },
  pose: { xUd, yUd, angleDeg },
  status: {
    disordered,
    routed,
    engaged,
    hasMoved,
    inCommand,
    battleReady,
    stakesPlaced,
    commanderIncluded,
    inAmbush,
    offTable,
    terrainState,
    contactState
  }
}
```

`RuleTables` hold derived rule values:

```ts
RuleTables = {
  movementAllowances,
  maneuverCosts,
  zocRules,
  commandCosts,
  chargeRanges,
  combatFactors,
  cohesionResults,
  terrainEffects,
  conformationRules,
  victoryRules
}
```

Example rule: a unit instance may store that it is Heavy Infantry, Cataphract, in command, has stakes, has current cohesion loss, and is currently in contact. It must not store hardcoded movement distance or combat factor against cavalry. Those values are derived from global rule tables, source data, terrain, state, and validation context.

Hidden information is part of canonical game state but not necessarily part of each player's visible state. The engine must be able to derive a player view from the canonical state.

```ts
Action = {
  id,
  playerId,
  phase,
  type,
  payload,
  declaredAtStateHash,
  randomClaims,
  explanationId
}
```

Validation output must be structured:

```ts
ValidationResult = {
  ok,
  severity,
  ruleArea,
  message,
  facts,
  ruleRefs,
  requiredChoices,
  alternatives
}
```

## Geometry Foundation

Units are rotated rectangles measured in UD. The front edge, rear edge, flank edges, center point, corners, and facing zones are derived from the unit pose and base dimensions.

Geometry invariants:

- A unit has one front edge, one rear edge, and two flank edges at all times.
- Front, flank, and rear relationships are derived from base geometry, not visual sprites.
- Distance measurement must distinguish front-edge travel, wheel outer-corner travel, slide distance, and closest-point distance.
- Contact can be front, flank, rear, corner-to-corner, flank-to-flank, or incomplete.
- Any physical impossibility must be represented explicitly, not resolved by nudging silently.

## Terrain And Setup System

Terrain and deployment are first-class rule systems.

Setup responsibilities:

- choose game format and table size;
- calculate initiative values and resolve initiative roll;
- determine attacker and defender roles;
- choose the battle region from the legal army-derived regions;
- select terrain options allowed by army and rules;
- place terrain pieces with legal sizes, shapes, sectors, and spacing;
- enforce compulsory terrain, terrain quotas, placement order, road-last placement, and terrain adjustment rolls;
- place roads, rivers, villages, hills, fields, woods, plantations, gullies, marsh, rough, difficult, camps, fortifications, obstacles, and stakes when applicable;
- validate camps, fortifications, obstacles, battle plans, deployment zones, ambush markers, flank marches, commanders, off-table troops, and dismounting;
- expose every illegal placement with a rule explanation.

Terrain must affect movement, ZOC, shooting, combat, visibility, ambushes, and deployment through data-driven rules. Terrain cannot be a decorative overlay.

## Hidden Information Model

Hidden information must exist before multiplayer.

Private data includes:

- battle plan declarations;
- ambush marker contents;
- fake ambush markers;
- flank march corps and arrival flank;
- unrevealed off-table units;
- private deployment facts that should not be shown to the opponent.

The engine exposes derived views:

- canonical view for validation and post-game review;
- player-one view;
- player-two view;
- referee/debug view;
- replay player-view mode.

Reveal events must be logged as actions so training replay can explain why hidden information became public.

## Movement System Design

Movement is command-based and segmented. A declared move is a sequence of typed segments such as advance, wheel, slide, quarter-turn, half-turn, extension, contraction, evade, disengage, charge, or pursuit. Each segment may be split into subsegments when a rule boundary is crossed, especially ZOC entry, contact, terrain entry, obstacle crossing, or table-edge interaction.

Official movement cannot be validated without command context. P0 may include a non-official straight-advance feasibility action, but every later movement phase needs active corps, commander, CP, command range, and in-command facts available to the validator.

Key movement rule facts from the source review:

- Movement is performed corps by corps; all movement for one corps is completed before the next corps.
- A movement requires an order, represented by CP spending or a free command case.
- Units may move individually or as groups; groups start and finish as a group unless a rule splits them.
- Movement allowance depends on troop type and terrain crossed.
- If different terrain types are crossed in a single movement, the lowest relevant allowance applies.
- Roads can allow full open-terrain movement in the relevant cases.
- A slide is up to 1 UD straight ahead during movement and counts as movement distance except in cases where the rules state otherwise.
- A unit normally performs only one slide per movement phase.
- A wheel is measured by the outer front corner that moves farthest.
- A wheel cannot be combined with an extension.
- Quarter-turn and half-turn movement costs must be accounted for, including the errata restriction against combining multiple quarter/half turns except for light troops.
- Extension and contraction change group frontage/depth and have specific group restrictions.
- Multiple moves are possible only under listed conditions and carry maneuverability constraints.
- Difficult maneuvers require CP cost handling and depend on troop class and errata.

Movement validation pipeline:

```text
Declared action
  -> normalize command intent
  -> derive segments
  -> split into subsegments at rule boundaries
  -> validate each subsegment against geometry, terrain, ZOC, command, and contact
  -> produce preview plus explanation
  -> apply only after confirmation
```

Movement edge cases to preserve:

- Enemy at less than 4 UD changes what moves can be taken, including stakes placement from errata.
- ZOC may appear midway through a segment, so validation cannot inspect only start and end poses.
- A group may temporarily overlap friendly units in allowed wheel cases, but only under exact rule conditions.
- Light troops have special free turn behavior and retreat/evade behavior.
- War wagons, heavy artillery, cataphracts, pikemen, impetuous troops, elephants, and scythed chariots each have movement exceptions.
- Terrain can penalize movement and can also suppress ZOC in errata-defined cases.

## ZOC System

ZOC is a core movement constraint, not a rendering overlay. A unit within less than 1 UD directly in front of an enemy is in that enemy's ZOC, subject to exceptions.

ZOC invariants:

- ZOC is derived from the enemy front edge and base width.
- Only relevant enemy ZOCs restrict movement; exceptions must be evaluated before restriction.
- If a unit is in multiple ZOCs, the most threatening enemy controls the allowed movement options.
- Most-threatening enemy selection follows rule priority: nearest enemy in front, then largest front coverage, then nearest flank/rear cases as applicable.
- Movement in ZOC must either stay, charge the most threatening enemy, align/get closer under the allowed conditions, conform, retreat/exit legally, evade where allowed, or perform another explicitly legal case.
- A ZOC cannot be ignored because the user drags a unit through it quickly.

Important errata constraints:

- A unit may always charge the most threatening enemy; wheel, quarter-turn, half-turn, or slide can be allowed to align with that target before charging.
- Quarter-turn or half-turn in place may be allowed to face an enemy exerting ZOC on rear or flank even if part of the front edge exits that ZOC.
- ZOC is not exerted into, from, or while situated in terrain that penalizes the unit in combat.
- Certain interpenetrations cannot be lateral except for specified unit types.

ZOC edge cases:

- Entering a ZOC during a charge or ordinary move.
- Exiting a ZOC voluntarily or involuntarily.
- A flank ZOC that is or is not a flank-charge position.
- Contact with the most-threatening enemy when another enemy's ZOC also overlaps.
- ZOC ignored during evade movement, but not during the triggering legality check.
- Units or terrain that do not exert ZOC: camps, artillery, war wagons, some terrain cases, and other listed exceptions.

## Command System

Command is the turn structure and action budget. It must be modeled before advanced movement can be trusted.

Command design facts:

- Armies contain corps led by commanders.
- Commanders have quality values and command ranges.
- Corps are activated one at a time by the phasing player.
- CP are rolled or determined per corps according to commander value and status.
- CP are spent for movement orders, difficult maneuvers, spontaneous charges, uncontrolled charges, rallies, commanders engaged in combat, out-of-command activity, and other listed cases.
- A commander can have a free command point for specific commander/unit movement cases.
- Command range is affected by commander quality, light troop exceptions, terrain/enemy blocking rules, and out-of-command costs.
- Unreliable, allied, hesitant, lost-commander, ambush, and flank-march cases must be explicit states.

Command invariants:

- No unit acts outside the active phase and command context unless a rule explicitly allows it.
- CP spending must be auditable: every spent point records the rule reason.
- Commander-in-combat status follows errata: only a commander fighting with the main unit of a melee counts as engaged for CP, combat bonus, and risk.
- A phase cannot silently continue if a player decision is required.

## Charge And Special Movement

Charges are movement actions with contact intent. They require target selection, charge direction, target reaction, charge movement, contact check, and conformation.

Charge invariants:

- The initial target must be within legal charge range.
- The charge direction must be declared and must respect ZOC of the most-threatening enemy.
- Charge movement must comply with ZOC rules, terrain restrictions, minimum advance requirements, and contact restrictions.
- Contact may be front, flank, or rear only if the starting position and rule conditions allow it.
- Prohibited charges must be rejected before movement is applied.
- Secondary targets and continuing charges are separate validation concerns.
- Impetuous and uncontrolled charge rules are not optional shortcuts; they are forced behavior with exceptions.

Evade, disengage, burst-through, pursuit, and rout movement are special movement subsystems. They must use the same geometry and validation engine but have their own rule modules and explanation paths.

## Conformation System

Conformation is not cosmetic alignment. It determines whether units fight, support, remain in contact, shift, or become incomplete contacts.

Conformation design facts:

- Conformation can occur after charge, to support a friendly unit already in melee, to align with an enemy already in contact but not in melee, to align with a routed unit in melee, or during rout/pursuit when a pursuer contacts a new enemy.
- After contact, each unit must conform against the most-threatening enemy unless a higher-priority rule prevents it.
- Conformation is normally done first by sliding and then pivoting to align relevant corners and front edges.
- Distance moved during conformation is not deducted from normal movement allowance.
- Conformation does not cost CP.
- If conforming unit is part of a group, other group units may move up to 1 UD to remain aligned as a group.
- Conformation may require shifting friendly units; shifting has minimum movement, priority, and restriction rules.

Errata-critical conformation rules:

- If front-corner conformation on a flank is physically impossible because of impassable terrain, table edge, enemy unit, or unshiftable friendly unit, rear-corner conformation can count as complete conformation, but cannot be used to avoid ZOC.
- When a unit must conform to enemy A but is also in enemy B's ZOC, ZOC of B has priority; the unit may remain in contact with A without moving.
- War wagons, heavy artillery, units defending fortifications or obstacles, and units behind stakes cannot be shifted to allow conformation.
- If a unit is routed, there is no conformation before pursuit.

Conformation edge cases:

- Incomplete conformation caused by terrain, table edge, enemy units, or unshiftable friendly units.
- Units with different base depths.
- Light infantry conforming into open terrain.
- War wagons and heavy artillery special restrictions.
- Columns attacked on the flank.
- Multiple enemies in contact or support positions.
- Pursuit contact that is not a new charge.

## Combat System

Combat covers shooting, melee, support, multiple attacks, modifiers, dice, cohesion loss, rout, and pursuit. It must be built after movement and conformation because melee eligibility depends on exact contact state.

Combat design facts:

- Shooting and melee are resolved in phase order with simultaneous effect timing where required.
- Dice use D6 and must be deterministic under seed control.
- Combat factor comes from troop type, opponent type, contact direction, first-round status, abilities, quality, terrain, protection, support, disorder, commander, height, fortification, and errata.
- Combat resolution compares modified die results and maps the difference to cohesion loss.
- Combat explanations must show every factor, modifier, cancellation, die roll, and cohesion result.

Combat invariants:

- Main unit and support units must be classified before factors are calculated.
- Flank/rear attacks can reduce combat factors to zero, including bonuses called out in errata.
- Ability cancellation must be explicit. For example, terrain can cancel mounted Impact in some cases, but Furious Charge can still apply per errata and may cancel Armour.
- Quality modifies dice according to Elite, Ordinary, or Mediocre rules.
- Disorder penalties do not apply to support or melee support where rules exclude them.
- Multiple attacks and support limits must be enforced.
- Combat cannot pull data from UI labels; it must use unit and rules data.

High-risk combat edge cases:

- Furious Charge plus Armour errata.
- Mounted Impact in rough or difficult terrain.
- Polearm revised effect.
- War wagons with blades errata.
- Light infantry destruction by heavy units depending on contacted terrain.
- Commander engaged versus commander in support.
- Camps, fortifications, stakes, obstacles, bridges, and riverbank bonuses.

## Replay System

Replay is the backbone of determinism, undo, debugging, and multiplayer.

Action log rules:

- Every accepted player decision becomes an action.
- Every random result is represented by seed position and result claim.
- Every action records pre-state hash and post-state hash.
- Validation explanations are stored or reproducible from state and action.
- Undo rewinds to the previous checkpoint and replays accepted actions.

Replay modes:

- Training mode may allow broad undo and branch exploration.
- Tournament mode should restrict undo to pre-confirmation previews or agreed rollback points.
- Multiplayer mode accepts only server-confirmed canonical actions.

## Multiplayer Architecture

The multiplayer model is server-authoritative and action-based. Clients do not sync arbitrary state diffs.

```text
Client proposes action
Server validates against canonical state
Server appends accepted action
Server broadcasts action + resulting state hash
Clients replay action locally
Clients request snapshot if hash diverges
```

Multiplayer invariants:

- The same engine validation path runs locally for preview and on the server for authority.
- Hidden information, ambush markers, and private plans require visibility-scoped state views.
- Randomness is server-seeded and committed through the action log.
- A desynced client never becomes authoritative.
- Transport errors cannot create game actions.

## AI Opponent Architecture

AI opponent support is later work and must not change the rules architecture.

AI rules:

- AI receives only the visibility-scoped state for its player side.
- AI proposes normal engine actions.
- The engine validates AI actions exactly like human actions.
- AI heuristics can rank legal actions but cannot invent legal exceptions.
- AI cannot inspect unrevealed ambushes, hidden battle plans, or flank march declarations.
- AI training explanations should separate rule legality from strategic preference.

AI is therefore a player controller, not a rules module.

## Army Builder Concept

The Army Builder is a data-driven module. Armies, units, options, allies, dates, list classifications, commander budgets, camps, fortifications, and point limits must be loaded from JSON derived from the source army material.

Core requirements:

- No hardcoded army lists in engine code.
- Multiple list formats: reduced 100, standard 200, big battle 300, and future custom formats.
- Unit entries define min/max, points, quality options, upgrades, replacements, date windows, regional options, and notes.
- Validation must explain why an army is legal or illegal.
- Errata overlays must patch army list data without rewriting base list files.

See `docs/army-builder.md` for the detailed design.

## Visual Asset System

The first playable phases use simple rectangles because rule geometry must be correct before art. The rendering layer must still be designed for later replacement.

Visual asset goals:

- rectangle fallback for every unit;
- replaceable PNG sprites or sprite atlases per troop family;
- separate masks or palette channels for player colors;
- player-selectable colors such as green, red, blue, or custom palettes;
- tunic, shield, banner, accent, and base markers as separate color targets where possible;
- visual profiles linked to `UnitDefinition`, not to engine validation;
- no rule logic depending on sprite dimensions beyond the explicit base geometry.

Later generated or hand-provided unit art should resemble the rulebook example style only as inspiration, with original assets created for this project. If the user provides reference images, they should be stored as design reference, not as engine data.

## UI Interaction Model

The UI is an action proposal surface. It never owns rule legality.

Movement interaction:

1. Select active corps or unit.
2. Choose legal command type offered by command context.
3. Preview path using engine-generated geometry.
4. Show distance, ZOC, terrain, contact, and conformation overlays.
5. Display validation result and rule explanation.
6. Confirm action only if validation is legal or if the rule requires a player choice.

Combat interaction:

1. Display pending combats and legal resolution order choices.
2. Show main unit, support, contact type, factors, modifiers, and pending dice.
3. Request dice roll through deterministic random module.
4. Show calculation breakdown.
5. Apply cohesion/rout/pursuit consequences through engine actions.

Army builder interaction:

1. Choose format and army list.
2. Choose date/region/options.
3. Add commanders, corps, troops, camps, fortifications, and allies.
4. See live point total and rule violations.
5. Export a validated roster into game setup.

UI debug overlays for training:

- Unit front/flank/rear zones.
- ZOC rectangles and most-threatening enemy markers.
- Movement segments and subsegments.
- Terrain penalties and cover lines.
- Contact classification.
- Conformation candidates and blocked shifts.

Main-menu and settings interaction:

1. Start menu opens mode selection.
2. Options allow player colors, explanation depth, debug overlays, display scale, and input preferences.
3. Singleplayer/local mode proceeds to army/setup flow.
4. Replay mode opens saved action logs.
5. Multiplayer mode opens lobby/session setup once that phase exists.

Settings are presentation preferences. A setting may show more or fewer explanations, but it cannot weaken rule validation.

## Validation And Explainability

Every validator returns a result with:

- outcome: legal, illegal, warning, or requires decision;
- rule area and source reference;
- measured facts such as distances, angles, terrain, and contact edges;
- state facts such as unit status, corps status, commander range, CP availability;
- reason text suitable for a training UI;
- next legal alternatives where the rules allow them.

Example explanation shape:

```text
Illegal move: unit enters enemy ZOC and ends farther from the most-threatening enemy.
Facts: entered ZOC at subsegment 2.3, enemy A is 0.72 UD from front edge, final distance is 0.91 UD.
Rule basis: movement in ZOC must charge, align/get closer under allowed cases, conform, or exit by a legal rule.
```

## Phase Gate Rule

Development is locked to the phase plan in `todo.md`.

- Do not work on P1 until P0 is implemented, tested, demonstrated, and approved by the user.
- Do not start any next phase because it seems convenient.
- If a later-phase concern is discovered early, document it as a dependency or risk, then return to the current phase.
- The AdG-Rules-Engine-Agent should review every phase design before implementation starts.
- The agent should run or request appropriate unit tests, browser checks, git status checks, and source verification for each phase.

## Open Verification Register

The following items must be verified directly against source pages before implementation:

- Exact movement allowance table values by troop type and terrain.
- Exact ZOC exceptions and most-threatening enemy tie breakers.
- Exact CP cost table and commander range exceptions.
- Charge range adjustment table and minimum movement requirements.
- Conformation diagrams for corner, flank, support, and incomplete cases.
- Shooting range, target priority, line-of-sight, and protection modifiers.
- Full melee combat factor tables and all errata updates.
- Army list data conversion method from printed lists and spreadsheet formulas.
