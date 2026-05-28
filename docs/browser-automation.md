# Browser Automation Notes

Use DOM selectors before visual guessing. The battlefield uses overlapping panels and scroll containers, so screenshot-only clicks can land in the side panel instead of the central action.

Stable entry selectors:

- Main menu to new game: `[data-automation-id="navigate-new-game"]`
- New game to direct battle: `[data-automation-id="start-direct-battle"]`
- New game to Charge Drill: `[data-automation-id="start-charge-drill-battle"]`
- New game to Conform Drill: `[data-automation-id="start-conform-drill-battle"]`
- Round start: `[data-automation-id="round-begin"]`
- Corps 1 activation: `[data-automation-id="select-active-corps-corps-1"]`
- Setup primary step: `[data-testid="setup-primary-button"]`

Battlefield unit selectors:

- Any unit token: `[data-action="select-unit"][data-unit-id="..."]`
- Charge Drill front charger: `[data-automation-id="unit-charge-drill-p1-front-charger"]`
- Charge Drill front target: `[data-automation-id="unit-charge-drill-p2-front-target"]`
- Charge Drill cavalry bow charger: `[data-automation-id="unit-charge-drill-p1-cavalry-bow-charger"]`
- Charge Drill heavy infantry target: `[data-automation-id="unit-charge-drill-p2-heavy-infantry-target"]`
- Charge Drill pike target: `[data-automation-id="unit-charge-drill-p2-pike-target"]`
- Charge Drill elephant target: `[data-automation-id="unit-charge-drill-p2-elephant-target"]`
- Conform Drill CFD-E1 B1 charger: `[data-automation-id="unit-conform-drill-cfd-e1-b1-charger"]`
- Conform Drill CFD-E1 A1 target: `[data-automation-id="unit-conform-drill-cfd-e1-a1-target"]`
- Conform Drill CFD-E1 B2 shifted-neighbor anchor: `[data-automation-id="unit-conform-drill-cfd-e1-b2-shifted-neighbor"]`
- Conform Drill CFD-E2 deferred B1 reference anchor: `[data-automation-id="unit-conform-drill-cfd-e2-reference-anchor"]`
- Conform Drill CFD-E2 deferred B2/B3 reference anchors: `[data-automation-id="unit-conform-drill-cfd-e2-b2-reference"]`, `[data-automation-id="unit-conform-drill-cfd-e2-b3-reference"]`
- Conform Drill CFD-E2 deferred A1/A2/A3 reference anchors: `[data-automation-id="unit-conform-drill-cfd-e2-a1-reference"]`, `[data-automation-id="unit-conform-drill-cfd-e2-a2-reference"]`, `[data-automation-id="unit-conform-drill-cfd-e2-a3-reference"]`
- Conform Drill CFD-E3 deferred anchor: `[data-automation-id="unit-conform-drill-cfd-e3-reference-anchor"]`
- Conform Drill CFD-E4 deferred anchor: `[data-automation-id="unit-conform-drill-cfd-e4-reference-anchor"]`
- Conform Drill metadata filters: `data-unit-scenario-lane-id`, `data-unit-scenario-example-id`, `data-unit-scenario-support-status`, and `data-unit-scenario-blocker`.
- Lower/upper visual disambiguation: compare numeric `data-unit-y-ud`; larger `y` is lower on the screen.
- Owner/corps filters: `data-unit-owner` and `data-unit-corps-id`.

Conform Drill shell note:

- Open it from New Game with `[data-automation-id="start-conform-drill-battle"]`.
- `CFD-E1` maps to `rv2-p53-shifting-units-a` and is the first live shifting lane.
- `CFD-E2` maps to `rv2-p53-incomplete-conformation-a` and is a six-token deferred reference lane for B1/B2/B3 versus A1/A2/A3. Verify `data-unit-scenario-support-status="deferred"` plus `data-unit-scenario-blocker="Requires multi-unit in-contact and support-network-aware conformation."` instead of expecting live solver behavior.
- `CFD-E3` and `CFD-E4` remain visible deferred reference anchors; verify `data-unit-scenario-support-status="deferred"` instead of expecting live solver behavior.
- `CFD-E1` smoke flow: click `[data-automation-id="round-begin"]`, choose `[data-automation-id="select-active-corps-corps-1"]`, select `[data-automation-id="unit-conform-drill-cfd-e1-b1-charger"]`, start `[data-automation-id="start-charge-preview"]`, target `[data-automation-id="unit-conform-drill-cfd-e1-a1-target"]`, confirm the charge direction, then resolve `[data-action="resolve-charge-reaction"][data-decision-type="no-evade"]`.
- `CFD-E1` expected live markers after no-evade: `[data-conformation-preview-ghost][data-conformation-candidate-id="front-primary"][data-conformation-candidate-status="complete"]`, `[data-conformation-shift-ghost][data-shift-unit-id="conform-drill-cfd-e1-b2-shifted-neighbor"][data-shift-direction="rear"]`, and `[data-conformation-shift-badge][data-shift-direction="rear"]`.

Charge Drill family-anchor selection note:

- The drill opens with round-start overlays; click `round-begin` first, then clear the corps-selection dialog before expecting battlefield token clicks to work.
- Player-1 family anchors (`cavalry-bow`, `heavy-infantry`, `pike`, `elephant`) are all under `p1-corps-2`.
- Player-2 family anchors (`cavalry-bow`, `heavy-infantry`, `pike`, `elephant`) are all under `p2-corps-2`.
- The new Corps II family lanes are intentionally flipped from the older south-to-north drill lanes: P1 chargers sit nearer the north edge around `yUd=3.4`, while P2 targets sit inward around `yUd=6.8` so an evade goes toward the table center instead of immediately off-table.
- Other live drill lanes still matter for smoke tests: `front/wheel/slide/zoc/evade-blocker/table-exit/light-troop-hook` chargers stay under `p1-corps-1`; the light-troop hook target stays under `p2-corps-3`.
- If a family anchor looks visible but is not clickable, first confirm `data-unit-owner` matches the active player and `data-unit-corps-id` matches the active corps.

For Playwright-style tests, prefer `locator('[data-automation-id="round-begin"]').click()` over text or coordinates.

Modal-first workflow for browser agents:

- Before scanning the whole battlefield or side panel, query `[data-automation-role="active-modal"]`.
- If it exists, read `data-active-modal-id` and click `data-active-modal-next-action-selector` first unless the test explicitly needs a different modal branch.
- This prevents common misses where `Runde beginnen`, corps selection, hotseat handoff, or the evade branch dialog is centered while background controls are still present but blocked.

Optional browser repro recording:

- Open the app with `?recordClicks=1` in addition to any debug filters, for example `?debug=1&log=charge,ui,perf&level=debug&recordClicks=1`.
- The browser records bounded semantic action events into `window.__ADG_DEBUG__.repro` without raw DOM dumps or continuous pointer streams.
- When the dev server is running, the same events are also written automatically to a separate JSONL sink at `logs/adg-browser-repro-current.jsonl` through the browser repro endpoint.
- The repro sink now keeps the latest `5` recorder sessions instead of clearing on each fresh browser session; each session begins with a persisted `session-start` marker so recent runs stay distinguishable.
- Useful helpers: `window.__ADG_DEBUG__.repro.getLog()`, `window.__ADG_DEBUG__.repro.getSummary()`, `window.__ADG_DEBUG__.repro.clear()`, and `window.__ADG_DEBUG__.repro.export()`.
- `window.__ADG_DEBUG__.repro.export()` includes `canonicalReplay`, a bounded `adg-canonical-replay-v1` projection of supported UI repro events into intended game/reducer actions. Unsupported UI-only entries are reported as `unsupported` diagnostics instead of being treated as replayable.
- `window.__ADG_DEBUG__.repro.replayCanonical(exportedOrEvents)` replays supported canonical events by dispatching the same reducer-owned actions the UI already uses. Supported movement commits are decomposed into preview-plus-confirm action pairs instead of patching final poses.
- The replay helper accepts either the whole `export()` payload, a plain `canonicalReplay` object, or a raw canonical event array. It returns a structured result with `ok`, `status`, `summary`, `steps`, and the first blocking or drift reason when replay cannot continue.
- LOG-10C adds bounded semantic drift diagnostics. Each replay step compares the current pre-action checkpoint against the recorded checkpoint, then checks bounded post-action outcomes where the result should be deterministic, such as the branch-distance die roll.
- Drift output is compact on purpose: the first failing step includes `comparisonPhase`, `ownerClass`, a small mismatch list, and compact checkpoint hashes instead of full state or DOM dumps.
- For LOG-10B, charge-start movement commits remain intentionally `unsupported` in canonical replay exports. They are recorded diagnostically, but replay stops at that step instead of inventing a non-source-backed charge-start shortcut.
- Canonical movement commits carry semantic facts such as `unitId`, `commandId`, `segmentIndex`, `distanceUd`, `angleRadians`, `pivotSide`, `side`, `totalDistanceUd`, and whether the commit is normal movement or a charge-start manoeuvre. They never set final unit pose directly.
- Record one exact path manually, export it, then use the ordered action list as the primary script for future browser checks instead of rediscovering clicks from screenshots.
- Practical replay-drift loop: `const exported = window.__ADG_DEBUG__.repro.export(); const result = window.__ADG_DEBUG__.repro.replayCanonical(exported);`. If `result.status === 'drift'`, inspect `result.steps.find((step) => step.status === 'drift')` for the first mismatch path and owner classification.

Shared Charge Drill smoke selectors:

- Player switch: `[data-action="set-active-player"][data-player-id="player-1"]` and `[data-action="set-active-player"][data-player-id="player-2"]`
- Corps switch in side panel: `[data-action="select-active-corps"][data-corps-id="corps-1"]`, `[data-action="select-active-corps"][data-corps-id="corps-2"]`, `[data-action="select-active-corps"][data-corps-id="corps-3"]`
- Corps switch in round dialog: `[data-automation-id="select-active-corps-corps-1"]`, `[data-automation-id="select-active-corps-corps-2"]`, `[data-automation-id="select-active-corps-corps-3"]`
- Charge button: `[data-automation-id="start-charge-preview"]`
- Evade decision buttons: `[data-action="resolve-charge-reaction"][data-decision-type="evade"]`, `[data-action="resolve-charge-reaction"][data-decision-type="no-evade"]`, `[data-action="resolve-charge-reaction"][data-decision-type="forced-evade"]`
- Evade distance roll buttons: `[data-action="resolve-charge-branch-distance"]`
- Handoff acknowledgement: `[data-action="acknowledge-evade-choice-handoff"]`
- Adjusted charge roll: `[data-action="start-adjusted-charge-distance-roll"]`
- Cancel current charge flow: `[data-action="cancel-charge-preview"]`

## CD2-04 Manual Smoke Runbook

Use this runbook after the drill opens cleanly. Each flow lists the acting corps and the relevant enemy corps so the lane can be re-entered without rediscovering ownership or corps gating.

Shared setup for every CD2-04 pass:

1. Open the app in the embedded browser when available; otherwise use the local browser and keep DOM selectors in devtools ready.
2. From the main menu, click `[data-automation-id="navigate-new-game"]`, then `[data-automation-id="start-charge-drill-battle"]`.
3. Click `[data-automation-id="round-begin"]`, then clear the corps-selection dialog with the acting corps for the chosen flow.
4. When a unit should become active, confirm its token matches the expected owner/corps via `data-unit-owner` and `data-unit-corps-id` before treating a disabled token as a bug.
5. For selected tokens, expect `aria-pressed="true"` on the chosen `[data-action="select-unit"]` button.

Flow A - Baseline cavalry charge lane:

1. Acting unit/corps: `P1 Front Charger` in `p1-corps-1`; target lane anchor: `P2 Front Target` in `p2-corps-1`.
2. Clear the round dialog with `corps-1`, keep active player on `player-1`, then click `[data-automation-id="unit-charge-drill-p1-front-charger"]`.
3. Expected selection state: the chosen token has `aria-pressed="true"`, and `[data-automation-id="start-charge-preview"]` is enabled.
4. Click `[data-automation-id="start-charge-preview"]`, then click `[data-automation-id="unit-charge-drill-p2-front-target"]` if targeting is surfaced as a token target.
5. Expected outcome: the charge button becomes active for the preview, the battlefield shows `data-charge-preview-corridor` and `data-charge-preview-ghost`, and the reaction dialog remains a normal mounted baseline lane rather than a light-troop hook or blocker-special case.

Flow B - Light-troop evade plus end half-turn:

1. Acting unit/corps: `P1 Light Troop Hook Charger` in `p1-corps-1`; target lane anchor: `P2 Light Troop Half-Turn Target` in `p2-corps-3`.
2. Clear the round dialog with `corps-1`, keep active player on `player-1`, then click `[data-automation-id="unit-charge-drill-p1-light-troop-hook-charger"]`.
3. Start charge preview and target `[data-automation-id="unit-charge-drill-p2-light-troop-hook-target"]`.
4. Expected reaction state: the target belongs to `player-2` / `p2-corps-3`, the reaction dialog offers an evade-capable path, and the flow eventually exposes `[data-action="resolve-charge-branch-distance"]` and then `[data-action="start-adjusted-charge-distance-roll"]` after the evade step completes.
5. Expected lane meaning: this is the live drill lane for the end-half-turn hook, so if the committed evader path finishes without the half-turn behavior, treat that as a gameplay regression rather than a selector problem.

Flow C - Cavalry-bow reaction hook:

1. Acting unit/corps: `P1 Cavalry Bow Charger` in `p1-corps-2` near the north edge; target lane anchor: `P2 Cavalry Bow Target` in `p2-corps-2` toward the table center.
2. Clear the round dialog with `corps-2`, keep active player on `player-1`, then click `[data-automation-id="unit-charge-drill-p1-cavalry-bow-charger"]`.
3. Start charge preview and target `[data-automation-id="unit-charge-drill-p2-cavalry-bow-target"]`.
4. Expected state: both lane tokens report `data-unit-corps-id` for corps 2, the target remains a mounted evade lane, and no light-troop-only end-half-turn behavior should appear.
5. Expected hook evidence: this lane is the bow-capable mounted anchor, so preserve the `cavalry-bow` identity and mounted evade behavior without inferring P8 shooting resolution from the smoke test.

Flow D - Heavy-infantry adjusted-charge never-reduce anchor:

1. Acting unit/corps: `P1 Heavy Infantry Charger` in `p1-corps-2`; live evade target anchor: `P2 Light Troop Half-Turn Target` in `p2-corps-3`.
2. Clear the round dialog with `corps-2`, keep active player on `player-1`, then select `[data-automation-id="unit-charge-drill-p1-heavy-infantry-charger"]`.
3. Start charge preview and target `[data-automation-id="unit-charge-drill-p2-light-troop-hook-target"]`.
4. Expected flow: the heavy-foot acting unit remains selectable through `p1-corps-2`, the light-troop target still drives an evade branch, and after the evade commits the UI should offer `[data-action="start-adjusted-charge-distance-roll"]`.
5. Expected meaning: this is the practical browser anchor for the current heavy-style `never reduce` adjusted-charge regression; use it as a smoke path, but keep the exact distance-law assertion in automated tests rather than by eye.

Flow E - Pike or elephant future-special anchor:

1. Acting unit/corps: `P1 Pike Charger` or `P1 Elephant Charger`, both in `p1-corps-2` near the north edge; target anchor: `P2 Pike Target` or `P2 Elephant Target`, both in `p2-corps-2` toward the table center.
2. Clear the round dialog with `corps-2`, keep active player on `player-1`, then select either `[data-automation-id="unit-charge-drill-p1-pike-charger"]` or `[data-automation-id="unit-charge-drill-p1-elephant-charger"]`.
3. Start charge preview and target the matching `[data-automation-id="unit-charge-drill-p2-pike-target"]` or `[data-automation-id="unit-charge-drill-p2-elephant-target"]`.
4. Expected state: the lane remains readable and reachable through corps 2 on both sides, the target token reports the correct `data-unit-corps-id`, and the flow behaves as a stable non-evade anchor rather than pretending special combat rules already exist.
5. Expected meaning: pike and elephant are future-special anchors for later conformation/combat work, so use this smoke only to confirm discoverability, correct corps mapping, and stable charge-lane identity.

Acceptance note for CD2-04:

- Browser smoke should prefer embedded browser tools when available in the session.
- If embedded browser tools are unavailable, fall back to the DOM selectors above plus screenshot review; do not claim manual acceptance from automated tests alone.

## Debug Logging

Use filtered logs for live rule debugging instead of turning on every trace at once.

Current debug entry points:

- Broad debug/perf: `?debug=1&perf=1`
- Filtered debug: `?debug=1&log=charge,evade&level=debug`
- Trace for hard solver bugs: `?debug=1&log=charge,evade,movement&level=trace`
- Browser memory mirror: `window.__ADG_DEBUG__.getLog()`
- Runtime filters: `window.__ADG_DEBUG__.setFilters({ areas: ['charge', 'evade'], level: 'trace' })`
- Runtime helpers: `getFilters()`, `enableArea(area)`, `disableArea(area)`, and `setLevel(level)`
- Guardrail helpers: `getLogSummary()`, `clearLog()`, `downloadLog()`, and `copyLogSummary()`
- Local JSONL sink: `logs/adg-debug-current.jsonl`

When debugging charge/evade issues, capture the relevant `action-complete` entries plus `evadeDecisionTrace`, `contactDecisionTrace`, and `reactionRequests[*].decisionTrace`. For known P7A2 live cases, first use `charge,contact,reaction,evade,movement` filters before expanding to `all`.

LOG-02 note: browser debug entries now include top-level `level` and `area` fields before they are mirrored in memory or posted to JSONL. `debugConsole=1` is still required for full console echo.

LOG-03 note: action-reduced and action-complete entries can emit filtered `charge.trace-summary`, `contact.trace-summary`, `reaction.trace-summary`, `evade.trace-summary`, and `movement.trace-summary` entries derived from existing reducer/browser debug facts. Use these summaries first, then inspect the full `state.evadeDecisionTrace`, `state.contactDecisionTrace`, and `state.reactionRequests[*].decisionTrace` payloads when a candidate-level branch needs detail.

LOG-04 note: browser memory logs are bounded by entry count and approximate byte size. Large arrays and strings are summarized before writing rule events, and oversized JSONL entries are shrunk before disk write. The JSONL sink rotates `logs/adg-debug-current.jsonl` to `logs/adg-debug-current.previous.jsonl` before the current file exceeds its configured size. `logs/` is ignored by git and excluded from the Vite watcher.

Fresh debug run checklist:

1. Open a filtered URL such as `?debug=1&log=charge,contact,reaction,evade,movement&level=trace`.
2. Run `window.__ADG_DEBUG__.clearLog()` before the reproduction step.
3. Reproduce the issue once, then inspect `window.__ADG_DEBUG__.getLogSummary()` for entry count, byte estimate, areas, and levels.
4. Use `window.__ADG_DEBUG__.getLog()` for browser memory evidence and `logs/adg-debug-current.jsonl` for persisted evidence.
5. If sharing only a compact report, use `window.__ADG_DEBUG__.copyLogSummary()`; if a full browser-memory export is useful, use `window.__ADG_DEBUG__.downloadLog()`.

## LOG-05 Manual P7A2 Debug Checklist

Use this checklist when the user manually clicks through Charge Drill while the agent watches the filtered browser log. This checklist is diagnostic only: do not mark a gameplay bug fixed from this runbook alone.

Shared setup for every LOG-05 pass:

1. Start the Vite dev server and open `http://127.0.0.1:5174/?debug=1&log=charge,contact,reaction,evade,movement&level=trace`.
2. From the main menu, choose `New Game`, then `Charge Drill`.
3. Click through setup/round start until Player 1 Corps 1 can issue commands.
4. Before each individual reproduction, run `window.__ADG_DEBUG__.clearLog()` in the browser console or ask the agent to clear it with browser tooling.
5. After each reproduction, stop clicking and let the agent capture `window.__ADG_DEBUG__.getLogSummary()`, the last matching `*.trace-summary` entries, and the matching JSONL sequence.
6. If the screen state matters, capture or describe the visible unit labels, selected unit, command-panel buttons, dice popup, and any hotseat handoff popup before resetting.

Test A - Unit 20 wrong evade path:

1. Reset or reload Charge Drill so unit positions are clean.
2. Select the lane that reproduces the wrong path for unit 20. Known candidate lane: `P1 Evade Blocker Charger` charging `P2 Evade Blocked By Blockers Target`; if the user observed unit 20 in a different lane, use the observed lane instead and record it.
3. Start `Charge`, select the target, and proceed through target reaction until an evade result or evade-choice/handoff appears.
4. If a dice popup appears, use the same die result as the original repro if known; otherwise record the shown/selected roll exactly.
5. If an evade choice popup appears, choose the same branch the original repro used.
6. Stop immediately after the evader path/ghost or committed token shows the wrong direction.
7. Expected log evidence: `reaction.trace-summary` names the target unit and reaction branch; `evade.trace-summary` includes candidate path types, rejected candidates, chosen candidate, blocker/slide/wheel diagnostics, and final pose; `charge.trace-summary` still references the same charge action.
8. Classification to record: engine decision if the chosen candidate is already wrong; reducer transition if the candidate is right but committed unit pose/path is wrong; UI preview if logs are right but the ghost/token is wrong.

Test B - Unit 21 missing evade roll:

1. Reset or reload Charge Drill so unit positions are clean.
2. Select the lane that reproduces the missing roll for unit 21. Known candidate lane: a secondary or follow-up target after an initial charge/evade sequence; if the user observed a specific unit 19 to unit 21 sequence, reproduce that exact target order.
3. Start the charge sequence and continue only until unit 21 should receive an evade option or evade distance roll.
4. Do not click past the point where the roll is missing; leave the command panel/popup visible.
5. Expected log evidence: `contact.trace-summary` should show whether unit 21 entered a contact or secondary-target queue; `reaction.trace-summary` should show whether unit 21 was evaluated, skipped, blocked, or classified as no-reaction; `evade.trace-summary` should appear only if an evade plan was actually created.
6. Classification to record: contact/secondary-target gap if unit 21 never enters the contact/reaction queue; capability-data gap if reaction says no/missing capability unexpectedly; reducer/UI gap if reaction/evade traces exist but the roll popup/button does not appear.

Test C - wheel snapping:

1. Reset or reload Charge Drill so unit positions are clean.
2. Select the unit/lane where the wheel snap was observed. Known candidate lane: `P1 Wheel Charger` using the `Wheel` command or charge-start wheel controls.
3. Click `Wheel`, drag the front-corner wheel handle slowly to the angle that previously snapped, and stop immediately when the preview jumps or normalizes unexpectedly.
4. If the snap happens only during charge-start controls, start `Charge`, choose the relevant target, select the wheel start option, then reproduce the same drag.
5. Do not confirm movement after a snap unless the bug only appears on confirm; if confirm is needed, state that before proceeding.
6. Expected log evidence: `movement.trace-summary` should show selected command, wheel mode, pivot side, preview angle, preview status, last preview segment, validation status, and any normalized pose; `charge.trace-summary` should only be relevant for charge-start wheel snapping.
7. Classification to record: browser hitbox/drag if raw wheel state jumps before reducer validation; reducer normalization if the preview angle/pose changes abruptly in action logs; engine movement geometry if preview and reducer state agree but computed wheel distance/pose is wrong.

Agent capture template after each test:

1. Scenario name and exact clicked lane/units.
2. Last visible UI state and whether the user says the behavior is wrong, missing, or only suspicious.
3. `getLogSummary()` result.
4. Relevant trace summary sequence in order: `charge`, `contact`, `reaction`, `evade`, `movement`.
5. First root-cause classification and the smallest next code surface to inspect.

LOG-05 execution notes 2026-05-25:

- Unit 20 wrong evade path was successfully classified from filtered browser logs as an engine-side evade-solver branch problem. The useful traces were `reaction.trace-summary`, `evade.trace-summary`, the full `evadeDecisionTrace`, and persisted JSONL state summaries for the same charge lane.
- Unit 21 missing evade roll was successfully classified from filtered browser logs in two stages: first as a reducer/UI mismatch where a pending secondary request existed but the dialog did not surface it, then as a secondary-request requeue problem where the same defender could be prompted again after recompute.
- For wheel snapping, the practical live-debug entry points are now pinned even though the bad snap threshold was not re-observed during LOG-05 closeout: use `data-automation-id="toggle-wheel-mode"`, reproduce on `unit-charge-drill-p1-wheel-charger` or the matching charge-start wheel lane, and inspect `[data-wheel-handle]` together with `movement.trace-summary` before widening scope.