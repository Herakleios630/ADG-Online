# Command Source Lock

Status: RV2-04 first source-lock baseline from Rules-v2; implementation-grade for core P6/P7 command context only after direct errata cross-check and manual acceptance.

## Source References

- `docs/source/Rules_v2.md` `rv2.command-and-commanders`, from `Rules_Color_300DPI.pdf` p.24-28.
- Example crops: `rv2-p24-commander-quality-table-a`, `rv2-p25-strategist-cp-example-box-a`, `rv2-p26-command-range-example-a`, `rv2-p27-commanders-and-groups-a`.
- Errata summary: `docs/rules/errata.md`, especially commander engaged-in-combat narrowing.
- Open verification: `command.corps-activation-order-and-lock`, `command.range-nearest-point-measurement`, `command.cp-formula-and-rounding`, `command.order-cost-components`, `command.order-timing-in-command-snapshot`, `command.rally-and-charge-cp-gating`, commander attachment IDs.

## Scan-Confirmed Baseline

- Standard army command structure is one commander-in-chief plus two sub-commanders, each tied to a corps; one sub-commander may be allied and sub-commanders may be unreliable.
- Commander quality values for CP calculation are `Ordinary = 0`, `Competent = +1`, `Brilliant = +2`, and `Strategist = +3`.
- A strategist is still a brilliant commander-in-chief for normal classification, but gets the extra strategist CP/initiative/setup advantages recorded in the rules corpus.
- When a corps is activated, roll `1D6`, add the active commander's value, divide by two, round up, and assign the result as that corps' CP for the sequence.
- Each commander also has one free CP per game-turn for tightly limited uses; exact use restrictions stay source-sensitive until direct errata/manual acceptance.
- Orders are corps-scoped. A commander gives orders only to units of that command.
- The same unit or group may receive up to three move orders in one game-turn, subject to movement-count and tactical-distance restrictions.
- Normal movement or a commanded charge within command range costs `1 CP`; out-of-command adds `+1 CP`; difficult manoeuvre adds `+1 CP`; spontaneous and uncontrolled charges spend no CP; rally and preventing uncontrolled charge use explicit special costs.
- Command range is measured nearest point to nearest point from commander base to target unit or group; enemy units and terrain do not block the command-range measurement.
- Printed command ranges are `4 UD` ordinary, `6 UD` competent, and `8 UD` brilliant or strategist; light troops double command range.
- Attached commanders measure as if just behind the attached unit for command-range purposes.
- Individually based commanders move `5 UD`, rotate freely, do not block friendly movement, may be minimally displaced to make room, and may attach to one unit at a time.
- Attached or included commanders alter combat bonus, free-CP use, movement, and elimination risk; these states must be explicit live match state.
- A corps whose commander is lost still rolls CP without commander value, but counts as permanently out of command range for later orders.

## Engine Invariants

- `activeCorpsId`, commander identity, commander quality, commander live/lost state, and CP pool must be reducer-owned command state.
- Command-range classification is a snapshot at the moment an order is given; later movement may require a fresh command-range check for a later order.
- Order cost must be componentized: base action cost, out-of-command surcharge, difficult-manoeuvre surcharge, and special costs such as preventing uncontrolled charge.
- Commander attachment/inclusion is not a visual tag. It changes command range, movement coupling, combat participation, elimination risk, and future public/private replay facts.
- A lost commander is not equivalent to ordinary out-of-range geometry; it is a permanent command-state condition for that corps.

## Edge Cases And Test Hooks

- CP formula should test low and high die rolls for each commander grade, including the strategist example.
- Command range should test nearest-point distance at exact boundary, just inside, and just outside, including light-troop doubled range.
- Order-cost tests should keep ordinary, out-of-command, difficult, and impetuous/prevent-charge branches separate.
- Lost-commander tests should confirm CP still rolls but all later orders are treated as out of command range.
- Commander attachment tests should preserve explicit attached/included state and reject ambiguous attachment to a group, matching the p.27 example crop.

## Open Verification

- Keep `command.order-cost-components` open as `errata-check` until commander-engaged surcharge, difficult-manoeuvre surcharge, and special CP entries are directly cross-checked.
- Keep commander attach/detach timing IDs open until p.27-28 and combat timing are manually checked with errata.
- Keep `command.rally-and-charge-cp-gating` open because rally and full charge lifecycle are separate RV2-04 areas.