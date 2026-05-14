# Sequence Of Play

Status: initial planning extract; requires full source verification before implementation.

## Source References

- `Rules.pdf`, overview and introduction around pages 5-8.
- `Rules.pdf`, command and phase sections around pages 24-28.
- `Rules.pdf`, setup section around pages 73-79.

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

## Turn Loop

The battle turn must be modeled as a strict sequence once verified:

- active player and corps activation;
- CP roll and command context;
- charges, reactions, evades, and movement;
- shooting;
- melee combat;
- routs, pursuits, cohesion, rally, and cleanup;
- victory checks and end turn.

## Engine Invariants

- A player cannot skip a setup state that requires a legal decision.
- A later phase cannot mutate decisions that are locked by an earlier state unless a rule permits it.
- Every phase transition must be logged as an action or system event.
- Hidden declarations stay hidden from the opponent until a reveal rule applies.

## Open Verification

- Exact names and order of official battle phases.
- Whether any phase is simultaneous or has player-selected order.
- Which decisions are locked, public, private, or reversible.
