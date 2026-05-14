# Hidden Information

Status: initial planning extract; requires full source verification before implementation.

## Source References

- `Rules.pdf`, battle plan, ambush, deployment, and flank march sections around pages 76-80.
- `Errata_ADG_V4_English.pdf`, ambush and hesitant corps clarifications.

## Hidden Information Areas

Hidden information exists in local play and multiplayer.

Core private data:

- battle plan structure;
- which corps is on which flank march and which flank it will enter from;
- ambush marker contents;
- fake ambush markers;
- unrevealed off-table units;
- private confirmation that some units are not visible because they are in ambush or flank marching.

## Engine Invariants

- The canonical state can contain private information, but player views must be visibility-scoped.
- Hotseat mode must protect private data during handoff between players.
- Replay viewer must support both omniscient review and player-view replay.
- AI opponents may only inspect their own visibility-scoped state.
- Multiplayer sync must never broadcast private information to the wrong client.

## Reveal Events

Reveal actions should be explicit and logged.

Potential reveal triggers to verify:

- enemy approaches within a specified distance of an ambush marker;
- clear line of sight to a marker;
- friendly unit passes through marker;
- player voluntarily reveals during own movement phase;
- flank march arrival roll succeeds;
- enemy units flee from a flank march arrival.

## Open Verification

- Exact number of ambush markers and strategist modifications.
- Exact ambush placement zones and allowed terrain.
- Exact fake ambush behavior.
- Exact flank march arrival and driven-back rules.
- Exact relationship between ambushes, hesitant corps, and CP rolls.
