# Charge

Status: RV2-05A source-lock baseline from Rules-v2 p.41-49 and p.50-54; implementation-grade only for the explicitly listed P7/P7A/P7A2 invariants after direct errata cross-check and manual acceptance.

## Planning Boundary

- P7 first pass is single-unit-only.
- Charge is a dedicated command chosen before movement, not a normal move that later becomes a charge.
- If a unit has already moved, stayed, or otherwise finished movement in the current movement phase, charge must be disabled.
- Once charge starts, the flow becomes charge-specific: target selection, legal charge-start manoeuvre, frozen direction, straight-ahead charge path, reactions, contact, and then conformation.

## Source-Locked Or User-Locked Planning Facts

- Charge must be declared before movement.
- P7 must keep charge-start manoeuvres separate from normal advance/wheel/slide controls.
- After the legal charge-start manoeuvre, the charge direction must be treated as frozen for the rest of the charge preview.
- Contact must be detected along the charge path, not only from an end pose.
- Reactions and evades must appear as deterministic pause points in reducer-owned state.

## RV2-04 Recalibrated Source Lock

The Rules-v2 scan-confirmed pass on p.42-54 now gives a tighter baseline for the P7A2/P7B-critical charge flow. The broad question is no longer whether the charge chapter is readable enough; the remaining work is converting those source-backed steps into explicit solver boundaries.

Source-locked flow facts for the current supported subset:

- Charge is a dedicated movement into combat contact and has an ordered procedure: select initial target, confirm range, indicate exact direction, resolve target reaction, then resolve the correct movement branch.
- Charge-start geometry is constrained at the beginning of the move: the unit may wheel or slide, but not both; quarter-turn or half-turn plus optional wheel is a separate allowed start family and excludes sliding.
- Once the charge has started, its direction is frozen.
- Corner contact is enough only if the charger can then conform at least partially; already-touching enemies do not re-charge one another and instead hand off to conformation or other contact cleanup.
- If the initial targets do not evade, units that can do so must contact the enemy or move into a support position.
- If all initial targets evade, the evader's movement must be resolved first; only then does the charger roll adjusted charge distance and continue from the committed post-evade board state.
- The adjusted-distance table is now scan-confirmed as `1-2 = movement - 1 UD`, `3-4 = normal movement`, `5-6 = movement + 1 UD`, with heavy infantry exempt from the reduction.
- Non-impetuous chargers after an all-targets-evade branch must still make the printed minimum advance if possible, then may stop or continue. Impetuous chargers must continue to full adjusted distance.
- Charge movement stops on enemy contact, a blocking enemy ZoC, a non-interpenetrable friendly unit, penalizing terrain, a friendly unit already in combat, or the table edge.
- Secondary targets reached during continuation use the same contact-restriction and ZoC framework and may trigger their own reaction sequence.
- Prohibited charges already include same-edge occupancy in melee or melee support, blocked column faces, and flank/rear attacks that cannot fully conform because of enemy ZoCs.
- The charge branch does not end at first contact visually; it ends in a rule-owned handoff into conformation, support position, blocked stop, or a later continuation/secondary-target event.

## P7A2/P7B Critical Handoff Invariants

- `reaction -> committed evade move -> adjusted charge distance` is the source-backed order for the all-initial-targets-evade branch.
- The charger's follow-through must be computed from the actual committed post-evade unit state, not from a preview-only evade ghost.
- `support position`, `contact`, `continuing charge`, and `conformation` are distinct states and should not be collapsed into one final-pose guess.
- Conformation remains downstream of contact classification and charge-branch resolution; P7B must consume the charge handoff, not recreate it.

Working predicates for the supported single-unit subset:

- `contact` begins as soon as the moving unit's front edge reaches a new enemy, including corner contact, because the source text treats any new enemy contact as combat-starting contact that later requires conformation.
- `support position` is narrower than mere proximity. It is the non-main-contact alignment state used when the unit does not become the main contacting attacker on that enemy edge but is still in a legal support relationship that the rules describe as support rather than a new separate charge target.
- `continuing charge` only exists after the initial branch outcome is known and only for units that have not already contacted an enemy and are not already in support.
- `conformation` starts only after the charge branch has produced a contact or support-contact state that the phasing player's unit must legally tidy.

Working deterministic predicates aligned to the current engine vocabulary:

- For the supported subset, charge-stop resolution should be based on the earliest path sample that produces a rules-relevant event before or at target contact, not on the final preview pose.
- If nothing earlier intervenes, target contact is the first accepted stop event.
- If several blocking events land on the same sampled step, the current working fallback should keep them distinct and resolve them deterministically rather than merging them into one generic failure. The remaining source-sensitive part is the exact same-step priority between enemy contact, foreign ZoC block, and non-interpenetrable physical blocker.
- Contact classification should be read from the attacker's front edge against the defender's footprint, using the frozen charge-start geometry relative to the defender rather than a later conformation pose.
- In that working basis, `front` remains true if any part of the attacker's front edge is still directly in front of the defender front line; `flank` requires the whole attacking front edge to be behind that front line without being wholly in the direct rear area; `rear` requires the whole attacking front edge to lie in the direct rear area.
- Exact boundary cases at the rear line or corner-only grey zone should remain explicit `rear-or-flank` or `needs-source-check` outcomes until errata-confirmed tie handling is pinned down.

Working distinction between `secondary target` and `new target` for the current doc set:

- Treat `secondary target` as the default later-charge event: a newly reached enemy encountered during continuing movement under the already frozen charge direction and already established movement budget.
- Reserve `new target` for the narrower interposed-enemy or most-threatening-enemy replacement case where the rules force the charge's controlling opponent to change before ordinary continuation logic applies.
- Until a deeper page-image comparison closes the remaining ambiguity, solver and reducer state should preserve these as separate event types rather than silently merging them.

## P7A First Supported Evade Subset

The accepted P7A entry slice is the smallest non-invented evade branch that can consume the P7 reaction gate without claiming full rule completeness.

Supported reaction categories for the first P7A pass:

- `may-evade`: an evade-capable target that is not currently forced, blocked, or forbidden from evading.
- `must-evade`: light infantry in open terrain contacted by heavy troops, unless after conformation they would be in melee with light troops, elephants, or scythed chariots, or would be in a support position.
- `cannot-evade`: units outside the evade-capable troop families, plus units engaged in melee or in melee support. A unit providing only simple support remains an exception and can evade.
- `blocked-evade`: a unit that could otherwise evade, but whose evade move is cancelled because after the free initial reorientation an enemy ZoC lies directly ahead, or because a simple blocker less than `1 UD` ahead cannot be avoided by the supported first-pass avoidance rules.

Evade-capable troop families for the first P7A pass:

- light infantry
- light cavalry
- javelinmen
- cavalry with the rule-quoted bow/crossbow combination cases
- other cavalry, camelry, and light chariots without `Impact` or `Impetuous`

Exact mounted edge-case evaluation should still be driven by explicit capability data in P7A-01 rather than inferred ad hoc from unit labels.

Adjusted-distance mapping for the first P7A pass, recalibrated from the Rules-v2 scan-confirmed pass:

- charge adjusted distance: `1-2 => movement -1 UD`, `3-4 => normal movement`, `5-6 => movement +1 UD`
- evade adjusted distance: `1-2 => movement -1 UD`, `3-4 => normal movement`, `5-6 => movement +1 UD`

Working source note:

- The die mapping above is supported by the Rules-v2 scan-confirmed pass for the charge and evade tables. A direct errata-overrides-base confirmation pass is still worth keeping open, but this is no longer just an OCR helper assumption.

## P7A First-Pass Non-Claims

- This file does not yet claim full group evade handling.
- This file does not yet claim terrain-complete evade movement.
- This file does not yet claim optional evade-direction wheel, full obstacle avoidance, interpenetration solver completeness, table-exit loss handling, or light-troop end-half-turn behavior in the first P7A movement slice.
- This file does not yet claim full mounted exception completeness beyond the explicit capability families above.

## P7A2 Evade Completion Contract

P7A2 exists because the accepted P7A supported subset computes and renders an evade plan, but the evader must become branch-authoritative board state before adjusted charge distance and later conformation.

Working contract for source verification:

- Target reaction and evade movement resolve before the all-initial-targets-evade adjusted charge distance branch.
- A supported evader should not remain a ghost-only preview once the charger is allowed to roll adjusted charge distance.
- Slide used to avoid an obstacle is not free and reduces the evade distance by the slide distance.
- The player-facing P7A2 choice is limited to the initial evade branch: optional direction wheel versus the no-direction branch. Within the chosen branch, the solver should automatically pick the legal path that maximizes resulting distance from the charger and only fall through to deterministic tie-breaks when needed.
- No-choice legal evades should show a notice and then auto-commit.
- Direction wheel and obstacle wheel remain confirmed P7A2 scope. The current working baseline is to inherit the ordinary single-unit wheel geometry from the movement chapter unless evade wording or errata says otherwise: pivot on an outer front corner, measure the opposite front corner, and cap the wheel at `90 degrees`.
- The scan-confirmed evade text allows a combined obstacle-avoidance sequence during one evade: after the free initial reorientation, the unit may optionally wheel to match the charge direction, and during the later straight evade move it may still use up to one slide plus one or more wheels totalling up to `90 degrees` to avoid new obstacles, with all such manoeuvres deducted from evade distance.
- Table-edge handling remains a P7A2/P7B source-check boundary inside the current supported subset. The live reducer path currently surfaces `charge.evade.table-edge` as source-open and keeps adjusted charge blocked until direct page/errata confirmation closes whether immediate removal from play is legal or whether a different table-exit consequence applies.
- Light troops may take an additional free half-turn at the end of their evade. The direct 300-DPI scan wording uses generic `light troops`, so for the current project baseline this inherits the normal `light troops` privilege from the troop/movement rules and binds to the usual `LI` plus `LH` family boundary rather than to every evade-capable troop.
- No troops may shoot after they have evaded in that same player sequence. Because the shooting phase allows fire from both active and passive players, an evading passive unit misses the immediately following shooting phase of the opponent's sequence, then regains normal eligibility in its own next sequence subject to ordinary movement and shooting limits. The reducer reset of `hasEvadedThisSequence`, `cannotShootThisSequence`, and `evadeCountThisPhase` at that player's next `ROUND_BEGIN` matches this working source-locked boundary.
- A blocked evade, source-open evade, or unsupported obstacle/interpenetration case must not be confirmed as if it were legal.
- Enemy ZoCs during the actual evade movement and the exact reset/side-effect boundaries require explicit source-lock before implementation claims.
- Interpenetration remains deferred from P7A2 unless the user explicitly expands the phase.

## Source-Check Questions For P7

- Which exact unit families and support-context exceptions still need direct errata confirmation before the supported `may/must/cannot/blocked evade` categories are treated as phase-safe?
- Which exact support geometries from the examples should count as legal single-unit `support position` in the first continuation subset, instead of only being left as conformation-stage diagnostics?
- What exact event ordering should be used when a continued charge meets a `secondary target` versus the narrower interposed-unit `new target` case, and does any rule force one to pre-empt the other when they coincide geometrically?
- Which printed stop events should share one deterministic first-hit ordering when several would occur on the same geometric segment, especially same-step enemy contact versus foreign ZoC versus physical blocker?
- How should charge cost integrate with the P6 command/CP model once spontaneous, uncontrolled, and move-to-support variants are all source-locked for the same reducer path?

## Engine Design Implications

- Charge should use a dedicated preview object instead of reusing normal movement preview state for legality decisions.
- Charge path preview should produce contact and reaction events, not only a final pose.
- Any charge-specific slide/shift must remain a charge-start concept, not a normal movement command.
- The engine should preserve separate branch records for `initial target stands`, `all initial targets evade`, and `secondary target encountered`, because those branches have different distance, stop, and conformation consequences.
- Charge state should carry enough evidence for later conformation to explain why a unit ended in enemy contact, simple support, blocked stop, or no-contact minimum advance.

## Non-Claims

- This file does not yet establish legal group charges.
- This file does not yet establish full evade movement.
- This file does not yet establish melee factors, support classification, or combat results.
