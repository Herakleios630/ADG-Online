# Hidden Information

Status: player-view planning extract; exact source wording and trigger details still require verification before implementation.

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

Other likely visibility-scoped data classes to preserve explicitly:

- exact battle-plan parameters and any downstream effect selections;
- ownership and composition of hidden flank-march corps;
- whether a public ambush marker is real or fake before reveal;
- player-specific explanation text that would leak hidden state if shown to the opponent;
- replay visibility filters for omniscient versus player-limited review.

## Canonical State Versus Player View

The engine should treat hidden information in two layers:

- canonical state: full rule truth used by validators, replay, save/load, and later authoritative sync;
- player-visible state: filtered or transformed view derived from the canonical state for one viewer.

Player-visible state must never be the authority source. It is a projection from the canonical state plus a visibility policy.

That means:

- validators reason on canonical data, not on a player's filtered view;
- local hotseat must temporarily suppress the other player's private data during handoff;
- replay can switch between omniscient and player-scoped views without changing canonical history;
- future multiplayer transport should serialize only the visibility-scoped view per client;
- future AI should read only its side's player-visible state.

## Setup-State Visibility Map

Hidden information begins during setup, not only once battle starts.

- `setup.format-selection`: fully public.
- `setup.army-selection`: visibility may depend on mode and later verified disclosure timing.
- `setup.battle-plans-and-private-declarations`: canonical hidden state with player-scoped views.
- `setup.ambush-markers-and-flank-marches`: public marker shells plus hidden contents and hidden off-table state.
- `setup.visible-deployment`: mixed state, where visible unit placement is public but hidden setup commitments remain private.
- `setup.start-battle`: canonical state carries unresolved hidden information forward into the live match.

The setup state machine therefore needs explicit visibility-scoped outputs, not just a generic hidden-info bucket.

## Visibility Modes

At minimum, planning should support these visibility modes:

- `canonical`: full engine truth for validation, persistence, and judge-level inspection;
- `player-one-view`: only what player one may legally know now;
- `player-two-view`: only what player two may legally know now;
- `hotseat-handoff`: temporary handoff-safe view that avoids leaking private data while passing the device;
- `replay-omniscient`: full post-game review view;
- `replay-player-view`: replay filtered to one side's legal knowledge at each historical moment;
- `ai-side-view`: future AI consumption surface, restricted to the same legal knowledge as its side.

## Visibility Policy By Data Class

Planning split by data family:

- public battlefield objects: always visible to both players once legally placed or revealed.
- public setup metadata: visible to both sides once the relevant setup state locks it.
- private declarations: visible only to the owning player until a reveal rule changes that status.
- hidden battlefield state: canonical truth exists, but the opponent sees either nothing or a public shell such as a marker.
- replay-only knowledge: omniscient review can show more than player-view replay without changing the canonical log.

## Engine Invariants

- The canonical state can contain private information, but player views must be visibility-scoped.
- Hotseat mode must protect private data during handoff between players.
- Replay viewer must support both omniscient review and player-view replay.
- AI opponents may only inspect their own visibility-scoped state.
- Multiplayer sync must never broadcast private information to the wrong client.
- Reveal events must transform visibility explicitly; they must not silently mutate what each player can see.
- Every hidden datum should have a defined owner, visibility scope, and reveal path.
- A player explanation panel must not leak hidden canonical data through validator text.
- Action logs and replay history must preserve when a datum became visible, not just that it is visible now.

## Reveal Events

Reveal actions should be explicit and logged.

Potential reveal triggers to verify:

- enemy approaches within a specified distance of an ambush marker;
- clear line of sight to a marker;
- friendly unit passes through marker;
- player voluntarily reveals during own movement phase;
- flank march arrival roll succeeds;
- enemy units flee from a flank march arrival.

Each reveal trigger should later identify:

- the triggering state or phase;
- the owner of the hidden information;
- what becomes public;
- what remains private;
- whether the reveal is optional or mandatory;
- what action or system event logs the reveal.

## Reveal Event Model

Each later reveal event should be representable as a structured transition such as:

- `reveal.ambush-marker`
- `reveal.fake-ambush-marker`
- `reveal.flank-march-arrival`
- `reveal.private-declaration-public-effect`

The event should record:

- the source hidden object id;
- the triggering player or system cause;
- the pre-reveal visibility scope;
- the post-reveal visibility scope;
- any battlefield state created by the reveal;
- the rule reference or open-verification id that justifies the reveal.

## Future Test Requirements

Later phases should test at least:

- player-view filtering for both sides from the same canonical state;
- hotseat handoff not leaking private declarations;
- reveal events changing only the intended data visibility;
- replay-omniscient versus replay-player-view differences;
- AI-side view containing no unrevealed enemy hidden data.

## Open Verification

- Exact number of ambush markers and strategist modifications.
- Exact ambush placement zones and allowed terrain.
- Exact fake ambush behavior.
- Exact flank march arrival and driven-back rules.
- Exact relationship between ambushes, hesitant corps, and CP rolls.
- Exact roster-disclosure timing in standard pre-battle flow.
- Exact mandatory versus optional reveal triggers.
