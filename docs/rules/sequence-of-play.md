# Sequence Of Play

Status: RV2-04 source-lock baseline for high-level sequence; detailed shooting, melee, rout, pursuit, and victory timing still require their own later RV2-04 passes before implementation-complete claims.

## Source References

- `docs/source/Rules_v2.md` `rv2.sequence-and-turn-structure`, from `Rules_Color_300DPI.pdf` p.23.
- `docs/source/Rules_v2.md` `rv2.command-and-commanders`, from `Rules_Color_300DPI.pdf` p.24-28.
- `docs/source/Rules_v2.md` setup entries from `Rules_Color_300DPI.pdf` p.73-80.
- `docs/rules/open-verification.md` IDs `turn.loop.phase-order`, `movement.active-player-and-phase-legality`, and setup hidden-information IDs.

## Pre-Battle Sequence

The game begins before the first movement phase. The setup sequence must be represented as explicit states:

1. Select format and ruleset profile.
2. Build or select armies.
3. Calculate initiative values.
4. Roll for initiative.
5. Determine attacker and defender choices.
6. Select battle region.
7. Select and place terrain.
8. Adjust terrain.
9. Place camps, fortifications, and obstacles.
10. Record battle plans.
11. Place ambush markers.
12. Deploy visible corps.
13. Resolve dismounting decisions.
14. Start battle.

## Setup State Machine Plan

Each setup step should become an explicit state with ownership, visibility, input, lock rules, and transition conditions.

### setup.format-selection

- Owner: system plus both players.
- Public data: selected format profile, ruleset version, battlefield profile, scale assumptions.
- Private data: none.
- Required input: format choice and any approved ruleset profile switches.
- Locked output: `formatId`, `rulesetVersion`, battlefield profile assumptions.
- Transition condition: format profile is selected and accepted for the match.
- Open verification: whether any Standard 200 tournament options must be represented as explicit selectable subprofiles.

### setup.army-selection

- Owner: each player for own roster choices.
- Public data: only what the chosen mode should reveal before setup; likely not full roster detail in all modes.
- Private data: army selection details until the rules require disclosure.
- Required input: army list choice and roster content.
- Locked output: provisional rosters and army-list references.
- Transition condition: both rosters reach a valid or at least accepted pre-setup state for the chosen mode.
- Open verification: when full roster disclosure becomes public in standard pre-battle flow.

The later hidden-information model must explicitly decide whether roster details stay private until later setup steps or are fully public immediately in standard tournament play.

### setup.initiative-values

- Owner: system with player-provided army facts.
- Public data: initiative inputs once confirmed by the rules.
- Private data: none unless a source exception exists.
- Required input: all army-derived initiative modifiers and required declarations.
- Locked output: initiative calculation inputs.
- Transition condition: initiative inputs are complete and auditable.
- Open verification: exact initiative input set and modifiers for Standard 200.

### setup.initiative-roll

- Owner: system.
- Public data: initiative roll and resulting initiative outcome.
- Private data: none.
- Required input: deterministic random result.
- Locked output: initiative result.
- Transition condition: initiative winner is known.
- Open verification: whether any tied or modified outcomes need extra substeps.

### setup.attacker-defender-decision

- Owner: initiative winner.
- Public data: attacker and defender roles once chosen.
- Private data: none.
- Required input: role decision if the rules provide a choice.
- Locked output: attacker or defender assignment.
- Transition condition: roles are fixed.
- Open verification: whether role choice is always explicit or ever forced by rule context.

### setup.region-selection

- Owner: the player entitled to choose the region.
- Public data: chosen battle region.
- Private data: none.
- Required input: legal region choice.
- Locked output: region and related terrain framework.
- Transition condition: region is legal and confirmed.
- Open verification: exact chooser and any constraints derived from army types.

### setup.terrain-selection-and-placement

- Owner: attacker and defender in rule-defined order.
- Public data: placed terrain pieces and public placement parameters.
- Private data: none unless a later rule says otherwise.
- Required input: compulsory terrain, chosen terrain pieces, sizes, shapes, and placements.
- Locked output: placed terrain set before adjustment.
- Transition condition: all required terrain pieces are selected and placed legally.
- Open verification: exact selection quotas, order, region interactions, and placement constraints.

### setup.terrain-adjustment

- Owner: system plus the player entitled to adjust.
- Public data: final adjusted terrain layout.
- Private data: none.
- Required input: any strategist or adjustment rolls and resulting terrain movement.
- Locked output: final terrain layout before camps and deployment objects.
- Transition condition: terrain adjustment is resolved and logged.
- Open verification: exact timing and permissions for terrain adjustment.

### setup.camps-fortifications-obstacles

- Owner: each player for own eligible setup objects.
- Public data: placed public setup objects.
- Private data: none unless a rule exception exists.
- Required input: camp type, fortifications, obstacles, stakes, and legal placements.
- Locked output: setup objects on the battlefield.
- Transition condition: all mandatory camps and eligible fortifications or obstacles are resolved.
- Open verification: exact placement restrictions and budget interactions.

### setup.battle-plans-and-private-declarations

- Owner: each player for own hidden declarations.
- Public data: only what the rules require to be public at declaration time.
- Private data: battle plans, some flank-march data, and other hidden commitments.
- Required input: all private declarations required before deployment or battle.
- Locked output: canonical hidden declarations.
- Transition condition: all required declarations are stored and visibility-scoped.
- Open verification: exact declaration timing, wording, and public/private boundaries.

### setup.ambush-markers-and-flank-marches

- Owner: eligible player.
- Public data: visible markers or public declaration shells only.
- Private data: marker contents, fake markers, off-table corps, chosen entry flank.
- Required input: ambush placement and flank-march declarations if allowed.
- Locked output: hidden ambush and flank-march state.
- Transition condition: all hidden setup markers and off-table declarations are stored.
- Open verification: exact marker counts, zones, fake-marker rules, and reveal prerequisites.

### setup.visible-deployment

- Owner: each player in the rule-defined deployment order.
- Public data: visible unit and commander placements.
- Private data: hidden setup state remains concealed.
- Required input: corps deployment, commander positions, and visible off-table statuses.
- Locked output: visible deployment state.
- Transition condition: all visible forces are deployed legally.
- Open verification: exact deployment order, zones, and commander-placement rules.

### setup.dismounting-decisions

- Owner: eligible player.
- Public data: resulting mounted or dismounted battlefield state once the rule requires it to be known.
- Private data: none unless timing rules delay disclosure.
- Required input: dismount decisions and resulting unit-state changes.
- Locked output: final pre-battle mounted or dismounted status.
- Transition condition: all required dismount choices are resolved.
- Open verification: exact timing and visibility of dismount decisions.

### setup.start-battle

- Owner: system.
- Public data: transition into battle-ready match state.
- Private data: unresolved hidden information remains visibility-scoped.
- Required input: none beyond a consistency check that setup is complete.
- Locked output: turn-one ready game state.
- Transition condition: every prior required setup state is complete and logged.
- Open verification: exact handoff from setup to first battle phase.

The handoff must preserve visibility-scoped hidden information rather than flattening all setup outputs into one public battlefield snapshot.

## Turn Loop

Rules-v2 p.23 now supports this battle-turn baseline:

- initiative fixes attacker and defender before the battle starts;
- the attacker takes the first player sequence, then play alternates in fixed order;
- each game-turn contains one player sequence for each side;
- the active side is the phasing player during that sequence;
- during the movement part of the sequence, the phasing player activates corps one at a time, completing one corps before another is activated;
- each corps may be activated only once in the player sequence;
- after movement and corps activation, the sequence proceeds through shooting, combat, rout or pursuit resolution, victory check, and end-of-game handling;
- shooting and combat results are simultaneous even when the phasing player chooses local resolution order.

The exact internal timing of shooting, melee, rout/pursuit, army-cohesion accounting, and victory remains tied to the later RV2-04 passes for those rule areas.

## Turn-Loop Planning States

These battle states remain planning-only until the exact official order and names are re-verified:

- `turn.initiative-or-active-context`
- `turn.corps-activation`
- `turn.command-and-cp`
- `turn.charges-and-reactions`
- `turn.movement`
- `turn.shooting`
- `turn.melee`
- `turn.rout-pursuit-rally-cleanup`
- `turn.victory-check`
- `turn.end`

For each later implementation phase, the engine should know:

- who owns the decision in that state;
- what is public versus private;
- what the required input is;
- what output becomes locked for later states;
- which action or system event advances the state.

## Engine Invariants

- A player cannot skip a setup state that requires a legal decision.
- A later phase cannot mutate decisions that are locked by an earlier state unless a rule permits it.
- Every phase transition must be logged as an action or system event.
- Hidden declarations stay hidden from the opponent until a reveal rule applies.
- A setup state must expose whether its outputs are public, private, or visibility-scoped.
- Start-battle transition must fail if any mandatory setup decision is incomplete.
- Later states must reference locked outputs from earlier states rather than re-deriving or silently replacing them.
- Battle state must store `gameTurn`, `phasingPlayerId`, `activeCorpsId`, per-corps activation completion, and phase segment rather than deriving them from UI button state.
- A corps activation is an atomic command context for that corps: CP generation, movement orders, charges, and rally attempts must consume that corps' available command state before another corps is activated.
- Simultaneous result phases need deterministic resolution logs so user-selected resolution order never changes the underlying simultaneous casualty logic.

## Open Verification

- `turn.loop.phase-order`: narrowed to exact official wording and later chapter alignment for shooting, melee, rout/pursuit, victory, and simultaneous result ordering.
- `movement.active-player-and-phase-legality`: narrowed to active-player, active-corps, and one-activation-per-corps enforcement for movement legality.
- Setup public/private and lock-state questions remain in `docs/rules/open-verification.md` until the setup/terrain RV2-04 pass closes them.
