# LOGGING TODO - Selective Rule Logging + Browser Diagnostics

Status: LOG-00 through LOG-06 complete on 2026-05-25; LOG-07 approved by Reviewer on 2026-05-27 and identified the delay inside the charge-branch reducer path; LOG-08 completed on 2026-05-27 as a narrow reducer/solver hotspot investigation with safe lower-level memoization only and a measured rescope point in the direction-wheel evade solver; the original LOG-09 branch-pruning implementation attempt is paused; LOG-09 completed on 2026-05-27 by moving the meaningful wheel-versus-current-orientation decision ahead of the heavy branch solve, restoring prompt handoff on the exact `unit 3 -> unit 20`, evade, roll `6` browser path without changing the supported player-facing evade semantics; LOG-10 now has a follow-up split between UI repro capture and canonical reducer replay so exact runs are reproduced through real game actions rather than end-position patching; LOG-11 remains the selected-branch direction-wheel analysis because the initial prompt is fast, `current orientation` is fast, and `direction wheel` remains slow after the explicit branch choice
Planner: AdG-Rules-Engine-Agent
Preferred future executor: GPT-5.4 after user approval
Recommended review support: GPT-5.5 for `LOG-00` taxonomy/API review if the scope expands beyond the first P7A2 support slice
Master plan: roadmap.md
Primary active dependency: P7A2_todo.md remains the active gameplay board; this board may be executed as a cross-cutting support slice for P7A2 browser debugging after explicit user approval
Related boards: P7A2_todo.md, UNIT_CAPABILITIES_todo.md, CHARGE_DRILL_2_todo.md, P7B_todo.md, P8 future planning
Existing code foundation: src/debug/browser-debug-logger.js, src/debug/vite-debug-log-plugin.js, src/debug/debug-log-contract.js, logs/adg-debug-current.jsonl, decision traces in src/engine/charge/ and src/state/p0-state.js

## Purpose

Build a general, selective logging system for AdG Online that can be enabled by rule area and detail level.

The current P7A2 browser logger already helped isolate charge/evade bugs. This board turns that successful local tool into a project-wide rule instrumentation contract: future gameplay features must be loggable from their first implementation slice, without forcing every detailed trace into every debug run.

## Product Invariant

Logging must explain rule decisions without becoming rule logic.

- Engine and reducer modules may emit structured facts, candidate lists, diagnostics, chosen branches, rejected branches, timings, and source status.
- UI may display, filter, export, or trigger logging, but UI must not decide legality because a log is present.
- Logs are bounded, serializable, privacy-aware, and off or minimal by default.
- Rule decisions that involve hidden information must respect player-view boundaries in future replay/multiplayer contexts. Dev-mode full-state logs are allowed only when explicitly enabled.
- Logging must help reproduce bugs such as unit 20 wrong evade direction, unit 21 missing evade rolls, wheel snapping, secondary-target queues, and later conformation/shooting issues.

## Logging Model

LOG-00 taxonomy status: frozen for the first implementation pass after 2026-05-25 planning review, pending user acceptance. Later cards may add a new area only if a concrete feature needs it and the board records the reason.

Use two independent filters:

1. Level filter, from least to most verbose:
	- `error`: crashes, impossible states, failed invariants, rejected action with no safe fallback.
	- `warn`: source-open or unsupported rule boundary, suspicious state, fallback path used.
	- `info`: high-level action and phase milestones.
	- `debug`: rule decision summaries, selected candidates, primary diagnostics.
	- `trace`: detailed candidate iteration, rejection reasons, sampled geometry, recursion, timing internals.
2. Area filter:
	- `action`, `state`, `setup`, `command`, `movement`, `zoc`, `charge`, `contact`, `reaction`, `evade`, `conformation`, `shooting`, `melee`, `rout`, `terrain`, `visibility`, `army-builder`, `replay`, `ui`, `perf`, `network`, `ai`, `all`.

Example future controls:

- `?debug=1&log=charge,evade&level=debug`
- `?debug=1&log=movement,zoc&level=trace&perf=1`
- `window.__ADG_DEBUG__.setFilters({ areas: ['charge', 'evade'], level: 'trace' })`
- localStorage persistence for repeated browser live tests.

## Event Contract

Every log event should be structured JSON, not prose-only console output.

Minimum event shape:

```js
{
  timestamp,
  sessionId,
  level,
  area,
  eventType,
  actionType,
  phase,
  unitIds,
  ruleId,
  sourceStatus,
  message,
  input,
  decision,
  candidates,
  diagnostics,
  timings,
  stateSummary
}
```

Rules:

- `message` is a short human-readable summary.
- `decision` carries the chosen branch and reason.
- `candidates` may be summarized unless `level=trace`.
- Full geometry samples, path recursion, and candidate sweeps are `trace` only.
- Repeated events must be throttled or coalesced where practical.
- Logs must be safe to stringify and write as JSONL.

## GPT-5.4 Execution Contract

GPT-5.4 should execute cards sequentially unless the user narrows scope.

- Before each card, give a PM block brief with exact goal, planned files, scope split, validation commands, manual acceptance steps, and non-goals.
- Do not add gameplay rule behavior in this board unless a logging bug exposes a minimal root-cause fix that the user explicitly approves.
- Keep logging helpers modular; do not grow `src/debug/browser-debug-logger.js` into a monolith.
- Keep logs bounded to avoid repeating the OOM/debug-spam issue.
- Preserve the current `?debug=1` / `?perf=1` behavior during migration.
- After each card, update this board and roadmap status.

## Immediate GPT-5.4 Priority

Recommended first working slice after user approval:

1. `LOG-00` to freeze taxonomy and filters.
2. `LOG-01` and `LOG-02` to make filters real.
3. `LOG-03` with only `charge`, `reaction`, `evade`, `contact`, and `movement` adapters needed for the current P7A2 bugs.
4. `LOG-05` to run browser live tests for unit 20, unit 21, and wheel snapping with filtered logs.

Do not wait for shooting/melee/rout instrumentation before using the first slice for P7A2 debugging.

## Non-Goals For This Board

- no gameplay rule changes by default
- no external logging service
- no telemetry upload
- no multiplayer/server logging policy beyond future-safe event shape
- no full replay viewer
- no large UI settings redesign unless explicitly approved
- no unbounded console spam

## Execution Cards

### [x] LOG-00 - Logging Taxonomy And Governance Contract

Goal: source and freeze the project-wide logging taxonomy before code changes.

Planned files:

- LOGGING_todo.md
- roadmap.md
- docs/project-governance.md
- docs/architecture.md
- .github/copilot-instructions.md
- docs/browser-automation.md

Implementation steps:
1. Confirm the `level` and `area` taxonomy listed above.
2. Add a governance rule that every new feature card must include logging/instrumentation expectations or an explicit non-goal.
3. Add an architecture note that logging is an observation layer over engine/reducer decisions, not a rule authority.
4. Add a browser-debug runbook note explaining filtered logs and JSONL inspection.
5. Add repo-agent instruction bullets so future agents do not skip logging seams.
6. Mark this card complete only after the docs agree on taxonomy and ownership boundaries.

Non-goals:

- no code changes
- no new UI controls

Validation:

- Markdown/docs review.
- `git diff -- LOGGING_todo.md roadmap.md docs/project-governance.md docs/architecture.md .github/copilot-instructions.md docs/browser-automation.md`

Manual acceptance:

- User confirms the taxonomy is usable for live debugging.

Stop condition:

- Stop if the user prefers a pure area-filter model with no severity levels, or a pure severity model with no area filters.

Expected result: every future GPT-5.4 feature card can state exactly what it logs and how to enable it.

Progress 2026-05-25:

- User explicitly approved executing only `LOG-00`; no code implementation was started.
- The first-pass logging taxonomy is frozen as a combined level filter plus area filter model: `error`, `warn`, `info`, `debug`, `trace` and `action`, `state`, `setup`, `command`, `movement`, `zoc`, `charge`, `contact`, `reaction`, `evade`, `conformation`, `shooting`, `melee`, `rout`, `terrain`, `visibility`, `army-builder`, `replay`, `ui`, `perf`, `network`, `ai`, `all`.
- Governance now requires future feature cards to state logging/instrumentation expectations or an explicit logging non-goal.
- Architecture now records logging as an observation layer over engine/reducer facts, not a legality authority.
- Browser automation notes now describe the intended filtered debug URLs and JSONL/memory-log inspection flow.
- Repo instructions now tell future agents that complex gameplay features should be loggable by rule area and detail level from the first implementation slice.
- Roadmap now tracks `LOG0` as a support slice and keeps LOG-01+ unstarted.

Validation 2026-05-25:

- Editor diagnostics are clean for `LOGGING_todo.md`, `roadmap.md`, `docs/project-governance.md`, `docs/architecture.md`, `.github/copilot-instructions.md`, and `docs/browser-automation.md`.
- No `npm test` / `npm run build` run for LOG-00 because this card is docs/governance only.

Manual acceptance 2026-05-25:

- User confirmed the taxonomy with "Ja das passt".

### [x] LOG-01 - Logging Config And Event Contract Module

Goal: create a shared debug config/event contract that the browser logger, engine traces, and future rule modules can all use.

Planned files:

- src/debug/debug-log-contract.js
- src/debug/logging-config.js or src/debug/rule-logging.js
- src/debug/logging-config.test.js or src/debug/rule-logging.test.js
- LOGGING_todo.md

Implementation steps:
1. Define `LOG_LEVELS`, `LOG_AREAS`, default filters, and ordered level comparison.
2. Parse URL/localStorage filter strings without throwing on malformed input.
3. Add `shouldLog({ level, area, filters })` with tests for `all`, unknown areas, unknown levels, and default behavior.
4. Define `createRuleLogEvent(...)` that normalizes event shape and strips unserializable values.
5. Keep the existing debug endpoint constants backward-compatible.

Non-goals:

- no engine instrumentation yet
- no UI settings panel

Validation:

- `node --test src/debug/logging-config.test.js src/debug/vite-debug-log-plugin.test.js`
- `npm run build`

Manual acceptance:

- none for data-only behavior

Stop condition:

- Stop if the filter parser would break existing `?debug=1` / `?perf=1` workflows.

Expected result: logging has a shared contract instead of ad hoc browser-only flags.

Progress 2026-05-25:

- Added `src/debug/logging-config.js` with frozen `LOG_LEVELS`, `LOG_AREAS`, default filters, ordered level comparison, URL/localStorage-style filter parsing, `shouldLog`, safe value cloning, and `createRuleLogEvent`.
- Re-exported the LOG-01 contract from `src/debug/debug-log-contract.js` without changing `DEBUG_LOG_ENDPOINT`, `DEFAULT_DEBUG_LOG_DIR`, or `DEFAULT_DEBUG_LOG_FILE`.
- Updated the Vite JSONL normalizer to add backward-compatible top-level `level` and `area` fields plus a normalized `ruleEvent` object while preserving existing `kind`, `action`, `state`, `performance`, `overlays`, `error`, and `details` fields.
- Added `src/debug/logging-config.test.js` and extended `src/debug/vite-debug-log-plugin.test.js` for filter parsing, `all`, unknown level/area rejection, event normalization, circular-value handling, and middleware compatibility.

Validation 2026-05-25:

- `node --test src/debug/logging-config.test.js src/debug/vite-debug-log-plugin.test.js` passed: 8 tests, 8 pass.
- `npm run build` passed.

### [x] LOG-02 - Browser Debug Filter Controls

Goal: make the existing browser logger respect level and area filters without losing the current memory mirror and JSONL output.

Planned files:

- src/debug/browser-debug-logger.js
- src/debug/browser-debug-logger.test.js if a pure test seam is practical
- src/debug/vite-debug-log-plugin.js if endpoint metadata needs filtering support
- docs/browser-automation.md
- LOGGING_todo.md

Implementation steps:
1. Parse `?log=` and `?level=` alongside existing `?debug=1` and `?perf=1`.
2. Add `window.__ADG_DEBUG__.setFilters`, `getFilters`, `enableArea`, `disableArea`, and `setLevel` helpers.
3. Keep `window.__ADG_DEBUG__.getLog()` and `window.__ADG_PERF_LOG__` backward-compatible.
4. Ensure JSONL entries include `level` and `area`.
5. Keep full console echo behind `debugConsole=1`.
6. Add tests for filter behavior if a browserless seam is practical; otherwise document focused manual/browser validation.

Non-goals:

- no visible options screen yet
- no backend dashboard

Validation:

- focused debug tests where available
- `node --test src/debug/vite-debug-log-plugin.test.js`
- `npm run build`
- browser smoke with `?debug=1&log=charge,evade&level=debug`

Manual acceptance:

- User or agent confirms filtered logs appear for selected areas and stay quiet for disabled areas.

Stop condition:

- Stop if filter handling makes live debugging harder than the current unfiltered P7A2 logger.

Expected result: live browser tests can turn on charge/evade logging without drowning in unrelated UI or perf events.

Progress 2026-05-25:

- Updated `src/debug/browser-debug-logger.js` so `?log=` and `?level=` are parsed through the shared LOG-01 filter contract.
- Added `window.__ADG_DEBUG__.getFilters()`, `setFilters(...)`, `enableArea(area)`, `disableArea(area)`, and `setLevel(level)` while preserving `getLog()`, `enable()`, and `disable()`.
- Browser entries now carry top-level `level` and `area` before memory mirroring and JSONL posting.
- Full console echo remains gated by `debugConsole=1` or `adg-debug-console` localStorage.
- Added `src/debug/browser-debug-logger.test.js` for browserless filter coverage.
- Updated `docs/browser-automation.md` from planned filtered debug commands to current supported commands.

Validation 2026-05-25:

- `node --test src/debug/logging-config.test.js src/debug/browser-debug-logger.test.js src/debug/vite-debug-log-plugin.test.js` passed: 10 tests, 10 pass.
- `npm run build` passed.
- Browser smoke used `http://127.0.0.1:5174/?debug=1&log=charge,evade&level=debug`.
- Browser memory acceptance: `window.__ADG_DEBUG__.getFilters()` returned `{ level: 'debug', areas: ['charge', 'evade'] }`; a manual `ui` info event was filtered, a manual `charge` debug event was kept, and a manual `charge` trace event was filtered.
- JSONL acceptance: `logs/adg-debug-current.jsonl` recorded the kept `log02-charge-kept` entry with `level: 'debug'` and `area: 'charge'`; `log02-ui-filtered` and `log02-trace-filtered` were absent.

Manual acceptance 2026-05-25:

- Agent performed the requested LOG-02 acceptance check directly in the browser and JSONL sink.

### [x] LOG-03 - Rule Decision Adapters For Current P7A2 Bugs

Goal: route current charge, contact, reaction, evade, and movement decision traces through the shared logging contract.

Planned files:

- src/engine/charge/contact.js
- src/engine/charge/reaction.js
- src/engine/charge/evade.js
- src/state/p0-state.js
- src/debug/rule-logging.js
- relevant tests already covering P7A2 decision traces
- LOGGING_todo.md

Implementation steps:
1. Keep existing `decisionTrace` arrays as replay/debug evidence.
2. Add a thin adapter that summarizes those traces into area-tagged events: `contact`, `reaction`, `evade`, `charge`, and `movement`.
3. For `evade`, include branch choice, direct-blocker check, path-avoidance encounter, slide/wheel candidates, selected candidate, source-open diagnostics, and final pose.
4. For `reaction`, include capability/profile source, must/may/no/blocked reaction, and missing capability diagnostics.
5. For `contact`, include ordered contact events, secondary-target queue candidates, and clipped guide distance.
6. For `movement`, include wheel snapping input/output when wheel controls or movement preview creates a normalized pose.
7. Avoid importing browser APIs into engine modules; engine returns trace data, reducer/browser logger emits it.

Non-goals:

- no conformation, shooting, melee, or rout instrumentation yet
- no broad solver rewrite

Validation:

- `node --test src/engine/charge/contact.test.js src/engine/charge/reaction.test.js src/engine/charge/evade.test.js src/state/p0-state.test.js`
- `npm run build`

Manual acceptance:

- Browser live test can inspect why unit 20 chose a wrong evade path, why unit 21 did or did not receive an evade roll, and whether a wheel snapped due to UI, reducer, or engine normalization.

Stop condition:

- Stop if the adapter would require changing replay/state shape instead of observing existing facts.

Expected result: the current difficult P7A2 bugs become log-first browser investigations.

Progress 2026-05-25:

- Added `src/debug/rule-logging.js` as a browser/debug-layer adapter that converts existing reducer/browser `stateSummary` facts and existing `decisionTrace` arrays into filtered `charge.trace-summary`, `contact.trace-summary`, `reaction.trace-summary`, `evade.trace-summary`, and `movement.trace-summary` events.
- Kept engine and reducer rule modules observational-only for this card; no gameplay legality or replay/state shape was changed.
- Updated `src/debug/browser-debug-logger.js` to emit matching rule trace summaries independently from parent action events, so `log=contact` can keep a contact trace even if the parent action event is not itself a contact-area event.
- Added movement/wheel debug summary fields to browser state summaries: selected command, wheel mode, pivot side, preview angle, preview status, segment count, last segment, confirmation status, and validation status.
- Added `src/debug/rule-logging.test.js` and extended `src/debug/browser-debug-logger.test.js` for charge/contact/reaction/evade/movement summaries, idle non-charge suppression, and parent-filtered rule-event emission.
- Browser smoke exposed and fixed an idle-log-spam edge: `charge.trace-summary` no longer emits for `chargeStatus: idle` startup, round, or select-unit actions.

Validation 2026-05-25:

- `node --test src/engine/charge/contact.test.js src/engine/charge/reaction.test.js src/engine/charge/evade.test.js src/state/p0-state.test.js src/debug/rule-logging.test.js src/debug/browser-debug-logger.test.js src/debug/logging-config.test.js src/debug/vite-debug-log-plugin.test.js` passed: 223 tests, 223 pass.
- `npm run build` passed.
- Browser smoke used `http://127.0.0.1:5174/?debug=1&log=charge,contact,reaction,evade,movement&level=debug`.
- Browser smoke confirmed synthetic rule summary markers for all five LOG-03 areas were kept and `ui` was filtered.
- Browser smoke confirmed a real Charge Drill target selection emitted `charge.trace-summary`, `contact.trace-summary`, and `reaction.trace-summary`; the contact summary included clipped guide distance and the reaction summary included a `may-evade` capability-data trace.
- Browser smoke confirmed no `*.trace-summary` events were emitted for idle startup, round-begin, corps-select, or select-unit actions.

Manual acceptance 2026-05-25:

- Agent performed the requested browser/log acceptance directly for LOG-03. The exact unresolved unit 20 wrong-evade, unit 21 missing-roll, and wheel-snap bug investigations remain the purpose of `LOG-05`, now with LOG-03 summaries available.

### [x] LOG-04 - JSONL Size, Export, And OOM Guardrails

Goal: keep detailed logging useful without reintroducing watcher churn, memory pressure, or giant logs.

Planned files:

- src/debug/browser-debug-logger.js
- src/debug/vite-debug-log-plugin.js
- src/debug/debug-log-contract.js
- docs/browser-automation.md
- .gitignore if any new generated log artifacts appear
- LOGGING_todo.md

Implementation steps:
1. Keep in-memory rings bounded by event count and/or approximate byte size.
2. Add trace-level candidate truncation or summarization for large arrays.
3. Add optional `downloadLog` / `copyLogSummary` helpers if useful without UI churn.
4. Ensure `logs/` remains ignored and VS Code watcher exclusions still cover log churn.
5. Document how to clear logs and reproduce a fresh run.

Non-goals:

- no remote storage
- no long-term analytics

Validation:

- debug plugin tests
- `npm run build`
- browser smoke with trace enabled for a charge/evade sequence; confirm log size stays bounded

Manual acceptance:

- User confirms log size and content are practical during real debugging.

Stop condition:

- Stop if trace logs make the browser noticeably laggy in Charge Drill.

Expected result: detailed logging remains an everyday debugging tool, not a new performance problem.

Progress 2026-05-25:

- Added shared guardrail constants in `src/debug/debug-log-contract.js`: max debug entry bytes, max JSONL file bytes, max browser memory bytes, max array items, and max string length.
- Added bounded `summarizeLogValue(...)` handling in `src/debug/logging-config.js`; rule events now summarize large arrays/strings and keep truncation markers instead of dumping unlimited candidate data.
- Updated `src/debug/browser-debug-logger.js` to shrink oversized entries before memory/transport, bound the browser memory log by entry count and approximate byte size, and expose `getLogSummary()`, `clearLog()`, `downloadLog()`, and `copyLogSummary()` through `window.__ADG_DEBUG__`.
- Updated `src/debug/vite-debug-log-plugin.js` to shrink oversized JSONL entries and rotate `logs/adg-debug-current.jsonl` to `logs/adg-debug-current.previous.jsonl` before the current file exceeds its configured size.
- Confirmed `logs/` is already ignored by git and excluded from the Vite watcher; no `.gitignore` or Vite watcher change was needed.
- Updated `docs/browser-automation.md` with the fresh-run checklist, guardrail helpers, JSONL rotation behavior, and export/summary workflow.

Validation 2026-05-25:

- `node --test src/debug/logging-config.test.js src/debug/browser-debug-logger.test.js src/debug/vite-debug-log-plugin.test.js src/debug/rule-logging.test.js` passed: 19 tests, 19 pass.
- `npm run build` passed.
- Browser smoke used `http://127.0.0.1:5174/?debug=1&log=evade&level=trace`.
- Browser smoke generated 80 trace entries with 60 candidate objects each; memory summary stayed bounded at 14 entries and about 495 KB under the 512 KB browser-memory cap.
- Browser smoke confirmed candidate arrays were summarized to 40 entries plus a truncation marker.
- JSONL smoke confirmed `log04-jsonl-trace-bound` entries were written and the current JSONL file stayed about 1.1 MB, below the 5 MB rotation threshold.

Manual acceptance 2026-05-25:

- Agent performed the requested browser/log acceptance directly. User-side practicality acceptance remains available during LOG-05 real bug investigations.

### [x] LOG-05 - Browser Live Debug Runbook For Unit 20, Unit 21, And Wheel Snap

Goal: use filtered logging plus browser live tests to reproduce the known unresolved P7A2 defects.

Planned files:

- docs/browser-automation.md
- P7A2_todo.md
- LOGGING_todo.md
- bugfix notes in the relevant phase board if root causes are found

Implementation steps:
1. Write exact browser steps for unit 20 wrong evade, including expected log filters.
2. Write exact browser steps for the unit 19/21 or unit 21 missing evade-roll case.
3. Write exact browser steps for wheel snapping, including movement/charge filter settings.
4. Document how to capture `window.__ADG_DEBUG__.getLog()` and `logs/adg-debug-current.jsonl` evidence.
5. Record the first observed root-cause classification: engine decision, reducer state transition, UI stale state, browser hitbox/selector issue, or missing capability data.
6. Do not mark the bugs fixed unless a later implementation card actually fixes and validates them.

Non-goals:

- no bug fix unless separately approved
- no P7B work

Validation:

- browser live run when tools are available
- saved log excerpts or summarized event sequence in P7A2_todo.md

Manual acceptance:

- User confirms the runbook matches the observed cases or supplies the missing interaction step.

Stop condition:

- Stop if the bug cannot be reproduced and ask for the exact click/roll sequence plus screenshot context.

Expected result: unresolved live bugs have actionable logs instead of only screenshots.

Progress 2026-05-25:

- User approved LOG-05 as a manual live-test preparation slice: the agent prepares the exact checklist, starts/opens the debug environment when ready, the user performs the clicking, and the agent watches/captures the filtered logs.
- Added a dedicated LOG-05 manual P7A2 debug checklist to `docs/browser-automation.md` for unit 20 wrong evade path, unit 21 missing evade roll, and wheel snapping.
- Each test now has reset/setup steps, expected filtered log evidence, and the first root-cause classification to record: engine decision, reducer transition, UI preview/stale state, browser hitbox/selector issue, contact/secondary-target gap, or missing capability data.

Progress 2026-05-25:

- The browser/logger runbook from `docs/browser-automation.md` was used for the live P7A2 investigations that followed LOG-03/04.
- Unit 20 wrong evade path was classified as an engine decision issue inside the evade solver: the direct-blocker branch initially allowed a wrong wheel / over-broad shortcut instead of the source-shaped minimal slide then later avoidance path.
- Unit 21 missing evade roll was classified in two stages: first as a reducer-to-UI gap where the reducer already held a pending secondary reaction request but the battlefield dialog selected/suppressed the wrong state, then as a reducer queue issue where the same defender could be requeued after recompute and surface a second prompt.
- The resulting fixes were implemented and validated under P7A2, so this card now has real example classifications for engine decision, reducer transition, and stale UI state instead of a checklist-only runbook.
- Wheel-snap support is now operational at the runbook level: the filtered `movement` trace path, the wheel button selector, and the DOM wheel-handle selectors are documented and verified. The exact bad snap threshold was not re-observed during the final LOG-05 closeout, so the retained runbook remains the escalation path if that issue returns.

Validation 2026-05-25:

- Agent performed browser/log investigations during the live P7A2 bug work using filtered URLs under `charge,contact,reaction,evade,movement` plus browser memory summaries and persisted JSONL evidence.
- P7A2 now contains the summarized root-cause record for the unit 20 and unit 21 investigations.
- The current wheel debug surface was re-checked against stable selectors and DOM wheel handles: `data-automation-id="toggle-wheel-mode"` and `[data-wheel-handle]`.

Manual acceptance 2026-05-25:

- User accepted the resulting debugging/fix cycle by moving on from the unit 20/unit 21 defects and explicitly requested continuing with LOG-05 closure and LOG-06.

### [x] LOG-06 - Future Feature Logging Gate

Goal: make logging a durable Definition-of-Ready / Definition-of-Done requirement for future features.

Planned files:

- docs/project-governance.md
- roadmap.md
- future phase boards as they are touched
- LOGGING_todo.md

Implementation steps:
1. Add a `Logging` item to phase/card planning: levels, areas, events, filters, and manual/browser debug checks.
2. Require every new engine feature to emit at least `error`/`warn` diagnostics and a `debug` decision summary for key legal decisions, unless explicitly out of scope.
3. Require every UI feature that wraps rule decisions to preserve or surface the relevant rule logs without owning legality.
4. Add review criteria: missing logging is a planning finding for complex rule features.
5. Link this board from P7B/P8 and later boards when those phases are next updated.

Non-goals:

- no retroactive full instrumentation of every existing module in one pass

Validation:

- docs review
- next phase board includes logging expectations before implementation

Manual acceptance:

- User accepts logging as a permanent repo workflow rule.

Stop condition:

- Stop if logging requirements become so heavy that they block small safe changes; revise to match risk level.

Expected result: future AdG Online features are loggable by design from the first card.

Progress 2026-05-25:

- Project governance now states more explicitly that every future feature card must name logging areas, minimum levels, important events/decisions, filter entry points, and the expected browser/manual debug check, or say why logging is a non-goal.
- Review guidance now treats missing logging expectations as a planning finding for complex rule features, not as optional polish.
- Future-facing draft boards were updated while touched so the next likely execution boards point back to `LOGGING_todo.md` and define a board-level logging gate instead of relying on ad hoc reminders.
- Roadmap status was updated so LOG0 is no longer described as an unstarted support board.

Validation 2026-05-25:

- Markdown/docs review across `docs/project-governance.md`, `roadmap.md`, `P7B_todo.md`, `P7C_todo.md`, `P7A2_todo.md`, `docs/browser-automation.md`, and this board.

Manual acceptance 2026-05-25:

- User requested completing LOG-05 and LOG-06 after the live debugging work, which serves as approval to lock this support workflow in.

### [x] LOG-07 - Timestamped External-Browser Charge-Branch Stall Trace

Goal: add a timestamped diagnostics trace for the exact `resolve-charge-branch-distance` to `evade-choice-handoff-visible` path, and persist it to the existing browser/server debug log so external-browser stalls can be reconstructed from file logs.

Planned files:

- src/main.js
- src/debug/browser-debug-logger.js
- src/debug/debug-log-contract.js
- src/debug/vite-debug-log-plugin.js
- optional focused tests under existing debug logger coverage if a stable seam is practical

Implementation steps:
1. Add explicit timestamped lifecycle events for this narrow charge-branch slice: click received, reducer start, reducer end, render start, render end, first animation frame after render, handoff overlay mounted, and handoff overlay visible or measured.
2. Ensure every event writes absolute wall-clock timestamp, high-resolution monotonic timestamp, action type, current screen, setup view mode, viewport size, device pixel ratio, and scenario/correlation identifiers where available.
3. Persist these events through the existing browser debug pipeline and Vite JSONL sink so VS Code browser runs and external browser runs land in the same file-backed log.
4. Gate the instrumentation narrowly to charge-branch / evade-handoff investigation mode so normal play and unrelated actions are not spammed.
5. Include one stable repro correlation id or sequence id so a single external-browser run can be extracted from the JSONL file.
6. Keep payloads bounded and serializable: log timings, counts, and markers, not full DOM snapshots or full state dumps.

Logging expectations:

- Required areas: `perf`, `ui`, and `charge`.
- Stable grep-friendly event names: `charge-branch-click`, `charge-branch-reducer-start`, `charge-branch-reduced`, `charge-branch-render-start`, `charge-branch-rendered`, `charge-branch-next-frame`, `evade-handoff-overlay-mounted`, and `evade-handoff-overlay-visible`.
- Every event must include both `timestampIso` and `nowMs`.
- Every event must reach the external-browser file log, not only browser memory arrays.

Non-goals:

- no charge, evade, or solver rule changes
- no broad render refactor
- no generic always-on profiler for the whole app
- no roadmap phase expansion

Validation:

- focused debug logger tests
- focused handoff UI test slice
- one real browser repro with logging enabled
- confirm `logs/adg-debug-current.jsonl` contains the ordered event chain for the `6` roll path

Manual acceptance:

1. Start the app with debug logging enabled.
2. Reproduce Charge Drill `unit 3 -> unit 20`, choose evade, and click `6`.
3. Confirm the JSONL log contains a single ordered trace for that repro.
4. Confirm the trace shows where the long gap occurs: before reduce, inside render, before first frame, or before overlay visible.

Stop condition:

- Stop once the log explains where the external-browser delay occurs precisely enough to choose the next owning layer.

Expected result: one reproducible, file-backed timestamp trace for the problematic path, usable from both VS Code browser and external browser.

Approved 2026-05-26:

- User approved the Lead / Phase Steward planning step with "GPT-5.5 Lead: LOG-07 in LOGGING_todo.md freigeben".
- Current observed reducer output for the exact `unit 3 -> unit 20`, roll `6` path is small (`2` avoidance candidates, `1` path segment, `evadeChoiceHandoff.status: pending`), so LOG-07 is scoped to browser/runtime diagnostics rather than rule computation.
- Coding Agent should not continue speculative performance fixes until this timestamp trace identifies the owning delay layer.

Progress 2026-05-26:

- Added stable LOG-07 event names to `src/debug/debug-log-contract.js`.
- Added a bounded lightweight charge-branch trace path to `src/debug/browser-debug-logger.js` so LOG-07 events avoid the heavy full-state/overlay summary path used by normal action logs.
- Updated `src/main.js` to emit the ordered lifecycle chain around `RESOLVE_CHARGE_BRANCH_DISTANCE`: click, reducer start/end, render start/end, first post-render frame, and handoff overlay mounted/visible checks.
- Updated `src/debug/vite-debug-log-plugin.js` so normalized JSONL entries preserve `timestampIso` and `nowMs` on the top-level entry.
- Added focused coverage in `src/debug/browser-debug-logger.test.js` and `src/debug/vite-debug-log-plugin.test.js`.

Validation 2026-05-26:

- `node --test src/debug/browser-debug-logger.test.js src/debug/vite-debug-log-plugin.test.js src/ui/battlefield-command-panel.test.js` passed: 41 tests, 41 pass.
- `npm run build` passed.
- Browser repro used `http://127.0.0.1:4173/?debug=1&log=charge,ui,perf&level=debug` and confirmed a generated LOG-07 trace is persisted to `logs/adg-debug-current.jsonl` with all eight event kinds, one shared `traceId`, `timestampIso`, `nowMs`, state context, and overlay mounted/visible fields.

Manual acceptance pending 2026-05-26:

- The exact external-browser `unit 3 -> unit 20`, evade, roll `6` stall still needs to be reproduced by the user with `log=charge,ui,perf` enabled so the resulting JSONL trace can identify the real delay layer.
- The Coding Agent browser validation confirmed the file-backed trace pipeline on a reachable charge-branch roll, but did not claim the external-browser stall itself is fixed or fully diagnosed.

External-browser acceptance and review 2026-05-27:

- User reproduced the exact external-browser path with `log=charge,ui,perf` enabled: visible `unit 3 -> unit 20`, internal `charge-drill-p1-wheel-charger -> charge-drill-p2-double-blocker`, evade, roll `6`.
- `logs/adg-debug-current.jsonl` contains the full ordered LOG-07 chain for trace `adg-debug-1779856937961-1e6847e4-0abd-4cff-85bc-ff7d21c093f6:charge-branch-1`.
- The measured delay is inside the reducer/solver interval: `charge-branch-reducer-start` at `2026-05-27T04:42:31.738Z`, `charge-branch-reduced` at `2026-05-27T04:43:52.587Z`, about `80.85s` elapsed.
- After reducer completion, UI rendering and handoff overlay visibility are fast: render and visible overlay events complete within the same final frame sequence, and the resulting state has `evadeChoiceHandoff.status: pending`, `evadeMove.status: choice-required`, and `2` avoidance candidates.
- Reviewer / Rules Agent returned `Approved`: LOG-07 is diagnostically successful; the remaining problem belongs to the reducer/solver path, not the handoff overlay.

### [x] LOG-08 - Charge-Branch Reducer/Solver Hotspot Investigation

Goal: isolate and repair, only if locally proven, the reducer/solver hotspot responsible for the external-browser `unit 3 -> unit 20`, evade, roll `6` stall where LOG-07 measured about `80.85s` between `charge-branch-reducer-start` and `charge-branch-reduced`.

Approved 2026-05-27:

- User requested Lead / Phase Steward scoping for the follow-up investigation using the completed LOG-07 evidence.
- LOG-08 is approved as a narrow Coding Agent card. It may profile and optimize the owning reducer/solver slice, but must not change charge, evade, or handoff legality.

Planned files:

- src/state/p0-charge-reaction-reducers.js
- src/state/p0-charge-evade-helpers.js
- src/state/p0-charge-branch-helpers.js
- src/engine/charge/evade-geometry.js
- src/engine/charge/evade.test.js
- src/state/p0-state.test.js
- optional: src/debug/browser-debug-logger.js only if LOG-07 needs one additional bounded reducer-substage marker; do not broaden the logger otherwise
- LOGGING_todo.md

Implementation steps:
1. Reproduce the slow path outside the browser first if possible by constructing or reusing the Charge Drill reducer state for internal `charge-drill-p1-wheel-charger -> charge-drill-p2-double-blocker`, evade, roll `6`.
2. Add a focused benchmark/probe test or local diagnostic harness around `reduceResolveChargeBranchDistance(state, 6)` that records elapsed time and verifies the expected post-state: `evadeChoiceHandoff.status: pending`, `evadeMove.status: choice-required`, and `2` avoidance candidates.
3. If the reducer-only repro is slow, instrument the nearest owning subcalls in `p0-charge-reaction-reducers.js`, `p0-charge-evade-helpers.js`, `p0-charge-branch-helpers.js`, and `evade-geometry.js` with temporary local timing counters or a bounded debug event to identify the exact hot loop or repeated computation.
4. If the reducer-only repro is not slow, compare browser/external JSONL with the reducer probe and stop with a finding that the hotspot needs browser-specific profiling; do not guess.
5. Once the hotspot is identified, apply the smallest local performance fix that preserves the same chosen evade result, candidate count, decision trace semantics, and handoff state. Preferred fixes are bounded iteration guards, memoizing repeated pure geometry checks within a single solver call, or reusing already-computed candidate data. Avoid changing legal acceptance criteria.
6. Add or update focused tests so the exact `unit 3 -> unit 20`, roll `6` path completes quickly enough for a deterministic regression guard and still produces the same supported-subset state.
7. Remove temporary unbounded probes before closeout. If adding a permanent log marker, keep it behind existing `charge`/`perf` filters, include counts/durations only, and keep payloads bounded.
8. Update this card with the measured before/after timing, files changed, validation results, and whether the external-browser manual check still needs to be repeated.

Non-goals:

- no charge, evade, ZOC, conformation, or handoff rule changes
- no new evade capability/profile data
- no broad solver rewrite
- no UI rendering refactor
- no generic application profiler
- no removal or weakening of LOG-07 evidence
- no claim that the broader evade system is tournament-complete

Validation:

- Focused reducer/engine validation for the exact internal path, preferably via `node --test src/state/p0-state.test.js src/engine/charge/evade.test.js` or a narrower added test command if practical.
- Existing UI/debug guard: `node --test src/debug/browser-debug-logger.test.js src/debug/vite-debug-log-plugin.test.js src/ui/battlefield-command-panel.test.js`.
- `npm run build`.
- If a performance threshold is added, keep it coarse enough to avoid machine-flaky tests but strict enough to catch an 80-second regression. A practical target is sub-second reducer completion on the existing development machine; if CI timing is unstable, assert bounded candidate/iteration counts instead of wall-clock time.

Logging expectations:

- Required areas: `charge` and `perf`; `ui` only for reusing LOG-07 browser confirmation.
- Minimum level: `debug` for summary timing; `trace` only for temporary local candidate-loop diagnosis and never left as unbounded browser spam.
- Key evidence to preserve: LOG-07 top-level lifecycle events, reducer elapsed time, selected/target unit IDs, roll value, handoff status, evade status, avoidance candidate count, and the exact substage/counter that explains the hotspot.
- Debug URL for manual/browser confirmation: `?debug=1&log=charge,ui,perf&level=debug`.

Manual acceptance:

1. Open the external browser with `?debug=1&log=charge,ui,perf&level=debug`.
2. Reproduce Charge Drill visible `unit 3 -> unit 20`, choose evade, and click `6`.
3. Expected result after a successful fix: the handoff overlay appears promptly, and the JSONL trace still contains the eight LOG-07 events with a much smaller `charge-branch-reducer-start` to `charge-branch-reduced` gap.
4. If the Coding Agent only identifies the hotspot and cannot safely fix it inside this card, expected result is a concise measurement packet naming the exact next owning card instead of a manual pass claim.

Stop condition:

- Stop when the exact slow path either has a safe, validated local performance fix with unchanged reducer outcome, or when measurement identifies a broader solver design issue that requires Lead / Phase Steward rescoping.
- Stop immediately if the only apparent fix would change charge/evade legality, candidate acceptance, or supported-subset semantics.

Expected result: a narrow, reproducible reducer/solver performance diagnosis and, if safe, a minimal fix that turns the external `unit 3 -> unit 20`, roll `6` branch from an approximately `80.85s` reducer stall into a prompt handoff while preserving the same rule-state outcome.

Role routing:

- Implementing role/model: Coding Agent with GPT-5.4.
- Required review role/model after implementation: Reviewer / Rules Agent with GPT-5.4, because charge/evade solver code is rule-sensitive even if the intended change is performance-only.
- Lead / Phase Steward review required if the hotspot cannot be fixed without changing solver semantics or if the fix requires a broader evade/pathfinding redesign.

Progress 2026-05-27:

- Added a reducer-only probe in `src/state/p0-state.test.js` for the exact Charge Drill path `charge-drill-p1-wheel-charger -> charge-drill-p2-double-blocker`, evade, roll `6`, with assertions for `evadeChoiceHandoff.status: pending`, `evadeMove.status: choice-required`, `2` avoidance candidates, and hotseat handoff view mode.
- Added per-solve memoization in `src/engine/charge/evade-solver.js` and threaded the shared memo through `src/engine/charge/evade.js` for repeated battlefield, overlap, and linear-path checks within one evade solve.
- Local helper timing isolated the remaining dominant subcall to `resolveChargePreviewEvadePlan(...)`, specifically the `getDirectionWheelCandidates(...)` branch inside the evade solver.
- The retained safe local memoization change improved the exact reducer-only probe from about `93768ms` to about `48932ms` on the development machine while preserving the same reducer-visible outcome.
- Reviewer follow-up found that an attempted whole-result `getPathAvoidanceCandidates(...)` cache was not safe because it ignored recursion history and suppressed inner `path-avoidance-*` trace emission; that cache was removed, and the reducer-only probe remained about `48932ms`, confirming the lower-level memoization carries the real measured benefit.
- Follow-up engine measurement showed the remaining hot loop is the direction-wheel follow-on path search: `getDirectionWheelCandidates(...)` takes about `49188ms`, and its inner direction-wheel `getPathAvoidanceCandidates(...)` call alone takes about `48472ms` while producing `18` `direction-wheel-slide` candidates that later collapse to the same player-facing branch outcome.
- Stop condition reached on the broader-design branch: further large improvement now appears to require pruning or restructuring the direction-wheel candidate search, which risks changing solver candidate-acceptance or decision-trace semantics and should be rescoped by Lead / Phase Steward before more implementation.

Validation 2026-05-27:

- `node --test --test-name-pattern "charge drill wheel-charger double-blocker branch distance can be reproduced reducer-only for hotspot probing" src/state/p0-state.test.js` passed before the memoization change at about `93842ms` test runtime / `93768ms` diagnostic elapsed.
- The same reducer-only probe passed after retaining only the safe lower-level memoization at about `48993ms` test runtime / `48932ms` diagnostic elapsed.
- `node --test --test-name-pattern "isolated evade plan resolves the drill double-blocker evade with a slide|isolated evade plan prefers the direct slide in the live-like unit 20 blocker geometry|isolated evade plan offers an optional direction wheel to match the charge direction" src/engine/charge/evade.test.js` passed: 3 tests, 3 pass.
- `npm run build` passed.

Manual acceptance pending 2026-05-27:

- External-browser confirmation has not been rerun after the partial memoization change.
- If the user wants to verify the current partial improvement before rescoping, repeat the LOG-07 repro at `?debug=1&log=charge,ui,perf&level=debug` and compare the `charge-branch-reducer-start` to `charge-branch-reduced` gap against the prior about `80.85s` baseline.
- This card does not claim a prompt handoff yet; it delivers a narrower measurement packet plus a safe partial reduction and identifies the next owning redesign boundary.

Reviewer handoff 2026-05-27:

- Requested role/model: Reviewer / Rules Agent with GPT-5.4.
- Review focus: confirm the retained lower-level memoization in `src/engine/charge/evade-solver.js` and `src/engine/charge/evade.js` is bounded, preserves candidate legality and final reducer-visible outcome, and does not change handoff/UI behavior.
- Measurement packet: exact reducer-only path still reproduces at about `48.8s`; `resolveChargePreviewEvadePlan(...)` dominates that time; inside the engine, `getDirectionWheelCandidates(...)` is about `49.2s`, and its inner direction-wheel `getPathAvoidanceCandidates(...)` path is about `48.5s` for `18` `direction-wheel-slide` candidates.
- Expected reviewer result: `Approved`, `Needs Changes`, or `Blocked`, with explicit comment on whether the remaining improvement now requires Lead / Phase Steward rescoping due to solver-semantic risk.

Fresh external-browser evidence 2026-05-27:

- The user reran the exact external/browser repro after the LOG-08 cleanup. Trace `adg-debug-1779860866473-18d08861-c87b-4d04-b558-bfcdc064e92a:charge-branch-1` still shows the same owning path: evade-distance branch, roll `6`, `charge-drill-p1-wheel-charger -> charge-drill-p2-double-blocker`, and a long reducer gap.
- `charge-branch-reducer-start` to `charge-branch-reduced` is still about `42999ms`, while the reducer result remains unchanged: `evadeChoiceHandoff.status: pending`, `evadeMove.status: choice-required`, `evadeCandidateCount: 2`, and `evadeDecisionTraceCount: 46`.
- The subsequent adjusted-charge-distance branch in the same browser run is fast: trace `...:charge-branch-2` reduced in about `11.2ms`, which confirms the remaining visible stall is still isolated to the evade-distance direction-wheel solve rather than to the post-handoff adjusted-charge path.

### [x] LOG-09 - Deterministic Tournament-Style Evade Resolver For Prompt Handoff

Goal: replace the remaining exhaustive direction-wheel/path-avoidance micro-search on the exact `charge-drill-p1-wheel-charger -> charge-drill-p2-double-blocker`, evade, roll `6` path with a bounded, deterministic, tournament-style evade resolver that preserves the real player decision and automatically maximizes the legal evade result inside each branch.

Rescoped 2026-05-27 (pending user approval because this replaces the earlier branch-pruning card):

- LOG-08 proved the broad reducer frame, UI render, and overlay handoff are not the issue.
- LOG-08 plus the fresh external browser log isolate the remaining stall to the evade-distance direction-wheel solve: about `49.2s` local in `getDirectionWheelCandidates(...)`, about `48.5s` in its inner direction-wheel `getPathAvoidanceCandidates(...)`, and still about `43.0s` in the fresh external browser trace.
- The first LOG-09 implementation attempt was paused because pruning after exhaustive candidate generation is still treating the symptom. The better product model is to prevent the internal micro-combinatorics in the first place.
- Rules source supports a small decision surface: free initial reorientation, optional exact-match direction wheel, then a straight evade up to the adjusted distance with obstacle avoidance by one slide up to 1 UD and wheels totaling up to 90 degrees. The player-facing P7A2 choice remains the initial branch; the engine should resolve the best legal path inside that branch.

Design contract:

- Player-facing branches are limited to:
  - no initial direction wheel;
  - optional exact-match direction wheel, only when legal and meaningful.
- Inside a selected branch, the solver automatically resolves the evade path by this objective order:
  1. maximize final distance from the charger/reference pose;
  2. use the full rolled evade distance when legally possible;
  3. keep the final movement direction as close as possible to the branch evade direction;
  4. use the minimum legal avoidance geometry;
  5. prefer slide over wheel when distance and direction are equivalent;
  6. use deterministic side/id ordering only as the last tie-break.
- If a wheel path reaches strictly farther than a slide path, the wheel path wins because maximum legal distance is primary. If slide and wheel are equivalent, slide wins because it preserves the tournament-table procedure and avoids unnecessary direction change.
- The supported P7A2 subset still returns at most one best candidate per initial branch. The exact hot path is expected to remain `2` final player-facing candidates if both initial branches are legal.

Planned files:

- new or split module: `src/engine/charge/evade-branch-resolver.js` or equivalent, because `src/engine/charge/evade-solver.js` is already over the project steward size target and must not absorb a large rewrite
- `src/engine/charge/evade-solver.js` for a narrow integration seam only
- `src/engine/charge/evade.js` if the branch reference/objective context needs to be passed explicitly
- `src/engine/charge/evade.test.js`
- `src/state/p0-state.test.js`
- optional: one bounded `charge`/`perf` summary marker only if external confirmation needs a stable count/timing hook
- `LOGGING_todo.md`

Implementation steps:
1. Treat the paused branch-pruning code as provisional. Before implementation, the Coding Agent must inspect and either replace or remove the partial `branchReferencePose` / best-of-direction-branch experiment so the final change is one coherent deterministic resolver, not two overlapping optimizers.
2. Add or keep focused probes for the exact reducer hot path and for engine-local branch resolution. These should record branch count, obstacle count, candidate-family count, final player-facing count, and elapsed time without brittle CI wall-clock asserts.
3. Build a branch seed list: `no-direction-wheel` from the reoriented evade pose, and `direction-wheel` from the legal exact-match direction wheel after deducting wheel distance.
4. Implement a bounded branch resolver:
  - advance straight until the first blocker, table edge, or full distance;
  - if no blocker appears, return the full-distance terminal candidate;
  - if blocked, evaluate minimal slide left/right up to 1 UD when the slide is still available;
  - evaluate bounded obstacle-wheel families left/right using existing wheel geometry and binary refinement, not a 5-degree sweep multiplied through recursion;
  - deduct all avoidance movement from remaining distance and continue straight;
  - repeat only for the existing small P7A2 obstacle cap, with O(branches * blockers) behavior rather than recursive angle/slide combinatorics.
5. Score the bounded candidates with the design contract objective order and keep only the best result for that initial branch. Preserve blocker ids and avoidance steps for the chosen path's trace.
6. Keep source-open behavior honest: if the resolver meets a case outside the current P7A2 subset, return `needs-source-check`/diagnostics rather than silently approximating tournament-complete behavior.
7. Validate that the exact hot path still reaches `evadeChoiceHandoff.status: pending`, `evadeMove.status: choice-required`, hotseat handoff mode, and the expected player-facing branch count unless Reviewer explicitly accepts a rule-equivalent count change.
8. Re-run the exact external-browser LOG-07 repro after the change and compare against the fresh `~43.0s` external baseline.

Non-goals:

- no removal of the supported optional direction-wheel branch
- no new global or whole-result recursive solver cache
- no broad movement/pathfinding framework
- no charge, reaction, handoff, or adjusted-charge-distance rule change
- no UI rendering or overlay refactor
- no claim that every future multi-unit/table-edge/tournament edge case is complete beyond the supported P7A2 subset

Validation:

- `node --test --test-name-pattern "charge drill wheel-charger double-blocker branch distance can be reproduced reducer-only for hotspot probing" src/state/p0-state.test.js`
- focused `src/engine/charge/evade.test.js` coverage for direct slide, optional direction wheel, direction-wheel plus later slide, simultaneous blocker identity, and a case where wheel is chosen only because it reaches farther than slide
- `npm run build`
- one real browser repro with `?debug=1&log=charge,ui,perf&level=debug`
- Performance target: local reducer probe should be prompt, ideally under `1s`; external reducer gap should be under `2s` if achievable. A result under `5s` with unchanged semantics is acceptable for this card only if the board records the remaining cause and a follow-up is planned.

Logging expectations:

- Required areas: `charge` and `perf`
- Minimum level: `debug`
- Key evidence: initial branch count, bounded obstacle-family count, selected branch candidate ids/types, final player-facing candidate count, reducer elapsed time, and whether the exact external trace still shows `pending` handoff.
- Any permanent marker must be one bounded summary event or decision-trace entry; no unbounded candidate spam.

Manual acceptance:

1. Open the external browser with `?debug=1&log=charge,ui,perf&level=debug`.
2. Reproduce visible `unit 3 -> unit 20`, choose evade, and click `6`.
3. Expected result after a successful fix: the handoff overlay appears promptly, the JSONL trace still shows the same top-level LOG-07 lifecycle order, and the reducer gap is materially below the fresh `~43.0s` baseline.
4. Expected rule-state result: the handoff still lands on `evadeChoiceHandoff.status: pending` with the same supported defender-choice semantics; if the exact final candidate count changes, the card must explain why that is still rule-equivalent and must be accepted by Reviewer / Rules Agent.

Stop condition:

- Stop when the exact hot path has a deterministic resolver with unchanged player-facing branch semantics and a prompt external handoff.
- Stop and mark `Needs Source Check` if the resolver cannot determine minimum legal avoidance geometry for a blocker family without a source decision.
- Stop and return to Lead / Phase Steward if the only remaining performance path would require changing initial direction-wheel availability, maximum-distance ordering, blocker reporting, or the decision-trace contract.

Expected result: a rule-shaped, bounded evade resolver that feels like table play: choose the meaningful initial branch, then the engine advances as far as legally possible, slides when that is equivalent and sufficient, wheels when needed for better legal distance, and returns a prompt handoff.

Progress 2026-05-27:

- The exact hot path no longer solves both initial evade branches during `RESOLVE_CHARGE_BRANCH_DISTANCE`. The reducer now returns a cheap `initial-branch` choice plan when a meaningful direction mismatch exists.
- The player-facing initial choice is now explicit in the UI after the hotseat handoff acknowledgement: `Aktuelle Orientierung` versus `Wheel`.
- Exact reducer-only repro for `charge-drill-p1-wheel-charger -> charge-drill-p2-double-blocker`, evade, roll `6` dropped from the prior tens-of-seconds hotspot to `2ms` diagnostic elapsed while preserving `evadeChoiceHandoff.status: pending`, `evadeMove.status: choice-required`, and `2` player-facing branch candidates.
- Browser-runtime repro using the integrated browser and the real DOM confirmed the same exact path renders the handoff overlay promptly and records the branch-distance reducer step at about `14.5ms` in-browser for the scripted repro.
- Candidate evidence for the exact path:
  - initial branch candidates: `branch-current-orientation`, `branch-direction-wheel`
  - branch candidate count at handoff: `2`
  - reducer-side follow-up probe after branch selection: `branch-current-orientation` auto-commits to `slide-left-1.000`; `branch-direction-wheel` auto-commits to one direction-wheel/slide chain without requiring a second player choice in the current supported drill path.
- The deeper bounded per-branch rewrite proposed in the first LOG-09 draft was no longer needed to satisfy the approved product goal once the initial branch choice moved ahead of heavy solving. If future selected-branch cases prove slow, they should be tracked as a new follow-up card rather than reviving the paused pruning experiment.

Validation 2026-05-27:

- `node --test --test-name-pattern "isolated evade plan can defer the initial wheel-versus-current-orientation choice before solving branches|charge drill wheel-charger double-blocker branch distance can be reproduced reducer-only for hotspot probing|charge drill wheel-charger double-blocker initial current-orientation branch commits after the explicit branch choice" src/engine/charge/evade.test.js src/state/p0-state.test.js`
- `node --test --test-name-pattern "isolated evade plan offers an optional direction wheel to match the charge direction|isolated evade plan can offer a direction wheel followed by a later slide around a new blocker|isolated evade plan keeps all simultaneous encounter blockers on later wheel-slide candidates" src/engine/charge/evade.test.js`
- `npm run build`
- Integrated-browser scripted repro on `http://127.0.0.1:4175/?debug=1&log=charge,ui,perf&level=debug` confirming:
  - handoff overlay visible after `unit 3 -> unit 20`, evade, roll `6`
  - handoff text still instructs the hotseat pass before the evade choice opens
  - acknowledged handoff shows `Wheel oder aktuelle Orientierung?` with buttons `Aktuelle Orientierung` and `Wheel`
  - exact branch candidate ids remain `branch-current-orientation` and `branch-direction-wheel`

Reviewer handoff 2026-05-27:

- Review focus: confirm that moving the initial branch choice ahead of heavy solving is rule-equivalent for the supported P7A2 subset and does not remove any supported player-facing evade option.
- Required checks:
  - exact `unit 3 -> unit 20`, evade, roll `6` still produces hotseat handoff first, then the explicit branch choice dialog after acknowledgement
  - `current orientation` and `direction wheel` branches still auto-maximize the legal evade path inside the chosen branch without adding unsupported extra player choices
  - no regression to existing direction-wheel cases already covered in `src/engine/charge/evade.test.js`
- Expected reviewer output: `Approved`, `Needs Changes`, or `Blocked` with concrete rule findings.

Role routing:

- Planning role/model: Lead / Phase Steward with GPT-5.5 preferred; this rescoped card is drafted here for user review.
- Implementing role/model after approval: Coding Agent with GPT-5.4.
- Required review role/model after implementation: Reviewer / Rules Agent with GPT-5.4.
- Lead / Phase Steward review required again if deterministic branch resolution exposes a new rule ambiguity or cannot meet prompt-handoff performance without changing player-facing semantics.

### [ ] LOG-10 - Browser Repro Capture, Modal-First Automation, And Replayable Action Logs

Progress 2026-05-27:

- Started the Coding Agent implementation slice with a bounded browser repro contract and recorder behind `?recordClicks=1` / `adg-record-clicks`.
- Added modal-first automation metadata to the round, charge reaction, branch distance, evade handoff, and initial evade branch dialogs so browser agents can query the active modal before background controls.
- Wired central delegated action clicks into the recorder and exposed `window.__ADG_DEBUG__.repro` helpers for log, summary, clear, enable/disable, and export.
- Extended the recorder so `recordClicks=1` also persists the same bounded semantic events automatically into a separate dev-server JSONL file: `logs/adg-browser-repro-current.jsonl`.
- Follow-up 2026-05-27: the persisted repro sink now keeps the latest `5` recorder sessions and writes an explicit `session-start` marker instead of deleting the file on each new browser recorder session.
- Follow-up 2026-05-27: retention now prefers the latest `5` meaningful recorder sessions, so empty `session-start` tab opens no longer evict the last real `navigate -> scenario-start -> modal` repro chain.
- Follow-up 2026-05-27: the current exact browser repro now replays end-to-end through canonical reducer actions on the fresh VS Code browser page with `39/39` events dispatched, after narrowing modal-lag deferrals to the supported charge/evade dialogs and carrying forward bounded branch-roll facts for older recorder sessions that only captured the die in adjacent action payloads.
- Added focused contract/recorder tests plus UI tests for the round begin and corps-selection modal metadata.
- Files touched in this slice: `src/debug/browser-repro-contract.js`, `src/debug/browser-repro-recorder.js`, `src/debug/browser-debug-logger.js`, `src/ui/p0-app.js`, `src/ui/battlefield-dialogs.js`, `src/ui/p0-app.test.js`, `src/debug/browser-repro-recorder.test.js`, `src/debug/browser-debug-logger.test.js`, and `docs/browser-automation.md`.
- Agent validation completed:
  - focused tests: `node --test src/debug/browser-repro-recorder.test.js src/debug/browser-debug-logger.test.js src/ui/p0-app.test.js`
  - build: `npm run build`
  - live browser check on `127.0.0.1:4175/?debug=1&log=charge,ui,perf&level=debug&recordClicks=1`
- Live browser evidence from the implemented slice:
  - recorder gate active via `window.__ADG_DEBUG__.repro.isEnabled()`
  - modal-first metadata surfaced `round-begin` first, then `round-corps-selection`
  - exported repro log preserved the ordered path `navigate -> start-charge-drill-battle -> round-begin -> select-active-corps`
- Additional browser replay evidence 2026-05-27:
  - refreshed `public/replay-smoke.json` from `logs/adg-browser-repro-current.jsonl` stayed fully replayable with `39` canonical events and `0` unsupported events
  - fresh VS Code browser replay returned `status: ok`, `replayedEventCount: 39`, `dispatchedActionCount: 39`, and no first-drift step for the exact `unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel` path
- Remaining manual acceptance for LOG-10 is now only the user-visible confirmation that the same exact path still looks correct in the external browser, not agent-side replay correctness.

Goal: make browser debugging reproducible without rediscovering the click order every run by adding modal-first automation hints and an optional browser-side action recorder that captures real user click paths, dialog choices, wheel adjustments, rolls, and branch selections into a replayable repro log.

Current motivation 2026-05-27:

- Current browser-tool runs waste time searching broad page state while the real next action often lives in a centered modal such as `Runde beginnen`, corps selection, handoff acknowledgement, or the initial evade branch dialog.
- The project now has a stable need for exact repro playback: `Neues Spiel -> Charge Drill -> Runde beginnen -> Corps -> unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel` should be recordable once and replayable later by agents and tests.
- The same tooling should help future debugging of wheel angle input and other gesture-like controls instead of relying on repeated ad hoc Playwright inspection.

Planned files:

- `LOGGING_todo.md`
- `roadmap.md` only if the support-slice status summary needs to mention the new split explicitly
- `docs/browser-automation.md`
- `src/debug/browser-debug-logger.js`
- new helper/module such as `src/debug/browser-repro-recorder.js` and/or `src/debug/browser-repro-contract.js`
- `src/ui/p0-app.js`
- `src/ui/battlefield-dialogs.js`
- `src/ui/p0-wheel-controls.js`
- `src/ui/p0-slide-controls.js` if gesture capture needs the same contract
- targeted tests under `src/debug/` and `src/ui/`
- optional bounded log file convention such as `logs/adg-browser-repro-current.jsonl`

Implementation steps:
1. Define a bounded repro event contract for browser actions. Minimum supported event families: navigation, dialog/open modal, button click, unit selection, target selection, roll selection, handoff acknowledgement, branch selection, and gesture-derived actions such as wheel angle confirmation.
2. Add modal-first automation metadata so active dialogs and overlays expose an obvious highest-priority next-action surface to browser tooling. Prefer stable automation ids or one explicit active-modal descriptor over brittle text scraping.
3. Add an opt-in browser recorder gate such as `?recordClicks=1` or equivalent debug hook that records only bounded, structured action events. Do not log secrets, freeform clipboard contents, or unbounded DOM dumps.
4. Record enough payload to replay the path exactly: action type, automation id or dataset target, unit id/target id where relevant, die roll, branch id, wheel metadata, and timestamp ordering. If raw pointer movement is too noisy, capture resolved semantic wheel actions instead of pixel-by-pixel traces.
5. Add a replay/export hook through `window.__ADG_DEBUG__` or a sibling debug surface so an agent or developer can retrieve the last recorded repro as JSON without manual copy reconstruction.
6. Update the browser-automation runbook with the preferred workflow: record once in the external browser, inspect/export the repro log, then replay the exact sequence in future agent/browser checks.
7. Validate that modal-first hints actually prioritize `Runde beginnen`, corps selection, handoff acknowledgement, and evade-branch dialogs before background battlefield buttons.

Non-goals:

- no full generic macro engine for every future UI surface in one pass
- no raw continuous pointer-stream recording unless semantic wheel/slide events prove insufficient
- no replacement of existing debug JSONL logs for rule/perf tracing
- no solver or gameplay legality changes
- no promise that every historical browser test will auto-migrate without touching selectors

Logging expectations:

- Required areas: `ui`, `action`, and `perf` when timing the replay path
- Minimum level: `debug`
- Key evidence: active modal identifier, ordered repro event list, event count, replay/export success, and whether the same recorded path reopens the intended dialogs in order
- Recorder output must be bounded and serializable; no unbounded DOM snapshots or repeated full-state dumps

Validation:

- targeted tests for the repro contract/parser and any new debug API surface
- targeted UI tests proving the active modal metadata is present for round begin, corps selection, handoff acknowledgement, and initial evade branch dialogs
- one browser manual run with recording enabled over an exact path such as `Neues Spiel -> Charge Drill -> Runde beginnen -> Corps I -> unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel`
- one replay/export check showing the recorded sequence can be consumed without guessing the click order again

Manual acceptance:

1. Open the browser with debug logging and the recorder gate enabled.
2. Perform one real repro path manually, including dialog choices and the `Wheel` branch selection.
3. Export or inspect the recorded repro log.
4. Confirm the log preserves the exact order and meaningful payload of the performed actions without noise from unrelated background elements.
5. Confirm the next browser test can use the recorded path as its primary action script instead of rediscovering the clicks.

Stop condition:

- Stop when one exact charge-drill path can be recorded and replayed/exported with modal-first guidance and without re-deriving the click sequence from page text.
- Stop and return to Lead / Phase Steward if gesture-heavy controls require a broader input-abstraction design than a bounded debug recorder can safely support in this slice.
- Stop and mark `Needs Source Check` only if a proposed replay shortcut would blur the line between browser-action logging and engine-state mutation.

Expected result: future browser debugging starts from a reproducible, recorded action path with the active modal surfaced first, instead of broad page scraping and trial-and-error clicking.

Reviewer routing:

- Planning role/model: Lead / Phase Steward with GPT-5.5.
- Implementing role/model after approval: Coding Agent with GPT-5.4.
- Required review role/model after implementation: Reviewer / Rules Agent with GPT-5.4 for workflow correctness and bounded logging review.
- Reviewer focus: confirm the recorder/replay tooling preserves real user action order, remains bounded, and does not bypass the actual UI flow.

## LOG-10 Follow-Up Plan - Exact Repro Without End-State Patching

Planning decision 2026-05-27:

- Treat the existing browser repro sink as the UI-observation layer, not as the final replay truth.
- Add a canonical replay layer that converts recorded UI facts into real reducer/game actions and then dispatches those actions through the existing game path.
- Gesture replay must use resolved semantic movement facts produced by the game, not raw pointer pixels and not direct unit pose mutation.
- A replay run is successful only if the replayed reducer path reaches the expected segment, pose, and state/hash checkpoints. If it drifts, the first divergent event must be reported.

Product invariant:

- Exact replay means: same initial scenario, same ordered player decisions, same deterministic random claims, same reducer-owned movement or charge segments, and same resulting canonical state.
- It does not mean: set `xUd`, `yUd`, or `rotationRadians` directly from the log to match a screenshot.
- Browser automation may still click the UI for smoke tests, but the reusable replay contract must be reducible to game actions so P13 replay/undo can inherit the same direction.

### [x] LOG-10A - Canonical Replay Event Contract

Goal: define a bounded replay contract that separates browser UI events from canonical game actions and captures enough semantic movement payload to reproduce wheel, advance, slide, and charge-start manoeuvres through the real reducer path.

Planned files:

- `LOGGING_todo.md`
- `docs/browser-automation.md`
- `src/debug/browser-repro-contract.js`
- new helper such as `src/debug/canonical-replay-contract.js` or `src/debug/browser-repro-canonicalizer.js`
- `src/debug/browser-repro-recorder.test.js`
- new focused tests for the canonicalizer if split out

Implementation steps:
1. Keep the existing browser repro schema as UI-facing evidence with sequence, action, dataset, active modal, page, and bounded state summary.
2. Add a canonical replay projection for supported event families: navigation/start scenario, round/corps choice, unit selection, movement mode toggle, semantic movement commit, movement confirmation, charge target choice, reaction choice, deterministic roll, handoff acknowledgement, branch selection, and continuation choice.
3. For semantic movement commits, store `unitId`, `commandId`, `segmentIndex`, `basePose` or `basePoseHash`, `distanceUd`, `angleRadians`, `pivotSide`, `side`, `totalDistanceUd`, and whether the commit belongs to normal movement or charge-start manoeuvre.
4. Normalize slide and wheel direction names so replay does not infer side from DOM handle position.
5. Include a schema version and a replay-run correlation id without adding full state dumps.
6. Reject or mark unsupported UI-only entries instead of pretending they are replayable.

Non-goals:

- no generic P13 replay viewer
- no undo UI
- no direct canonical unit-pose patching
- no raw continuous pointer stream by default
- no gameplay legality changes

Validation:

- focused tests that convert current LOG-10 browser repro events into canonical replay events
- tests for wheel, advance, slide, charge-start wheel, roll, branch selection, and unsupported-event diagnostics
- `npm run build`

Manual acceptance:

- User records the current Charge Drill path and the exported log clearly shows both UI repro events and canonical replay projections for the movement/charge decisions.

Stop condition:

- Stop if a required replay step cannot be represented as a real game action without mutating final unit state directly.

Expected result: LOG-10 has an explicit replay contract that can describe the user's exact route as game actions plus semantic movement commits.

Implementation closeout 2026-05-27:

- Added `src/debug/canonical-replay-contract.js` with `adg-canonical-replay-v1`, per-event schema versioning, replay-run correlation ids, supported/unsupported statuses, semantic checkpoints, and projections from bounded browser repro events.
- Wired `window.__ADG_DEBUG__.repro.export()` through `src/debug/browser-repro-recorder.js` so exports now contain the original UI repro events plus a `canonicalReplay` projection.
- Covered start scenario, round/corps, unit selection, charge targeting, movement mode toggles, semantic movement commits, movement confirmation, reaction choice, deterministic roll, handoff acknowledgement, branch selection, adjusted charge roll start, continuation choice, and unsupported UI-only diagnostics.
- Semantic movement commits carry `unitId`, `commandId`, `segmentIndex`, `basePose`/`basePoseHash` placeholders, `distanceUd`, `angleRadians`, normalized `pivotSide`/`side`, `totalDistanceUd`, and `normal-movement` versus `charge-start-manoeuvre` scope. No direct final-pose patching or gameplay reducer behavior was added.
- Added focused tests in `src/debug/canonical-replay-contract.test.js` and extended `src/debug/browser-repro-recorder.test.js` export coverage.
- Validation run: `node --test .\\src\\debug\\canonical-replay-contract.test.js .\\src\\debug\\browser-repro-recorder.test.js` passed. `npm run build` passed with the existing Vite chunk-size warning.
- Manual acceptance remains pending: record the Charge Drill path with `?recordClicks=1`, run `window.__ADG_DEBUG__.repro.export()`, and confirm `events` and `canonicalReplay.events` both appear with movement/charge decisions represented semantically.

### [x] LOG-10B - Canonical Replay Executor For Supported Debug Paths

Goal: add a debug-only executor that replays the LOG-10A canonical events by dispatching real application/reducer actions, so the game reproduces the path rather than Playwright approximating mouse drags.

Planned files:

- `docs/browser-automation.md`
- new helper such as `src/debug/canonical-replay-executor.js`
- `src/debug/browser-debug-logger.js`
- `src/ui/p0-app.js` only if a browser debug hook must expose the executor
- `src/state/p0-state.js` only if action factory access needs a small export seam
- tests under `src/debug/` and, if needed, focused `src/state/` replay tests

Implementation steps:
1. Implement a supported replay executor for the Charge Drill LOG-10 path only: scenario start, round/corps setup, unit selection, normal movement chain, charge declaration, reaction, dice rolls, branch choice, and continuation.
2. Dispatch existing action types or existing UI action handlers; do not call movement engine helpers to apply final poses directly.
3. For semantic movement commits, add the preview value through the same reducer-owned preview actions used by the UI, then confirm normally.
4. Expose a debug helper such as `window.__ADG_DEBUG__.repro.replayCanonical(exportedOrEvents)` that returns a structured result, not just console output.
5. Preserve deterministic random claims by replaying the recorded die-roll actions, not generating new rolls.
6. Report unsupported event families as skipped/blocking with event sequence ids.

Non-goals:

- no whole-game replay engine beyond the current supported debug path
- no multiplayer/server replay
- no replay UI timeline
- no bypass of reducer validation, command costs, charge legality, or reaction gates
- no direct use of logged final poses to correct drift

Validation:

- focused executor tests using a recorded Charge Drill fixture path
- reducer/state assertions that replay reaches the same movement preview segments and confirmed canonical unit state
- browser smoke using `?debug=1&log=charge,ui,perf&level=debug&recordClicks=1`
- `npm run build`

Manual acceptance:

- User records the exact path once, then the executor replays it from a fresh Charge Drill start and reaches the same visible decision/end state without the agent hand-tuning drag pixels.

Stop condition:

- Stop if replay requires a new game action type whose semantics are unclear or would alter gameplay behavior outside debug tooling.

Expected result: the current exact Charge Drill reproduction can be rerun as a deterministic in-game action sequence.

Implementation closeout 2026-05-27:

- Added `src/debug/canonical-replay-executor.js` with a debug-only executor that accepts exported canonical replay payloads, plain canonical replay objects, or raw canonical event arrays and replays only supported events.
- The executor dispatches existing reducer-owned actions only. Supported normal-movement commits are translated into `SET_*_PREVIEW_*` plus `CONFIRM_*` pairs for wheel, advance, and slide; secondary charge reactions preserve their distinct reducer action; `confirm-movement` remains a supported semantic checkpoint, not a gameplay shortcut.
- Charge-start movement commits are now reported as `unsupported` in the canonical contract for LOG-10B rather than being replayed through an invented shortcut. They remain deferred until an exact reducer-owned replay path exists.
- Exposed the helper as `window.__ADG_DEBUG__.repro.replayCanonical(exportedOrEvents)` through `src/debug/browser-debug-logger.js` and wired `src/main.js` so browser replay uses the app's real dispatch path.
- Added focused tests in `src/debug/canonical-replay-executor.test.js` and `src/debug/canonical-replay-contract.test.js` covering reducer-driven Charge Drill movement replay, secondary-reaction dispatch preservation, charge-start-scope blocking, supported movement-commit action mapping, and blocking on unsupported canonical events.
- Validation run: `node --test .\src\debug\canonical-replay-contract.test.js .\src\debug\browser-repro-recorder.test.js .\src\debug\canonical-replay-executor.test.js` passed. `npm run build` passed with the existing Vite chunk-size warning.
- Manual acceptance remains pending: in an external browser session opened with `?debug=1&log=charge,ui,perf&level=debug&recordClicks=1`, record one exact Charge Drill path, run `const exported = window.__ADG_DEBUG__.repro.export();` then `window.__ADG_DEBUG__.repro.replayCanonical(exported);`, and confirm the replay reaches the same visible supported state without drag-pixel hand tuning.

### [x] LOG-10C - Divergence Checks And Replay Diagnostics

Goal: make exact replay self-verifying by checking each canonical replay step against expected semantic checkpoints and reporting the first drift clearly.

Planned files:

- `docs/browser-automation.md`
- `src/debug/browser-repro-contract.js`
- `src/debug/canonical-replay-executor.js` or the chosen executor helper
- new helper such as `src/debug/replay-divergence.js`
- `src/debug/browser-repro-recorder.test.js`
- executor/divergence tests under `src/debug/`

Implementation steps:
1. Define bounded checkpoints for supported replay steps: selected unit, charge status, active modal id, movement preview segment count, last segment command, distance, angle, pivot/side, total distance, charge-start manoeuvre, and deterministic roll result.
2. Add optional pre/post state hash fields where a stable local hash is practical; if a full hash is not ready, use a documented compact semantic hash for the supported debug path.
3. After every replayed canonical event, compare the current semantic checkpoint against the recorded expected checkpoint.
4. Return `ok`, `blocked`, or `drift` with the first event sequence, expected facts, actual facts, and likely owner class: UI selector/hitbox, recorder projection, reducer transition, engine movement geometry, or unsupported event.
5. Keep diagnostics bounded; do not dump full state or DOM snapshots.
6. Add a browser-runbook section for capturing and interpreting replay drift.

Non-goals:

- no screenshot-diff oracle as the primary truth
- no unbounded full-state hashing in browser logs
- no automatic correction of divergent state
- no rule-source decision changes

Validation:

- tests for matching replay checkpoints
- tests for intentional drift on wheel angle, slide side, die roll, and wrong active modal
- browser smoke proving a fresh run reports either `ok` or a concrete first-drift event
- `npm run build`

Manual acceptance:

- User compares the replay result against the original external-browser recording and, if there is mismatch, the tool reports the exact first divergent semantic step instead of requiring visual guesswork.

Stop condition:

- Stop if the current game state lacks enough stable semantic facts to distinguish movement/reducer drift from browser UI drift; route that gap back to Lead / Phase Steward for a replay-state seam decision.

Expected result: LOG-10 stops being a best-effort click replay and becomes a measurable exact-replay diagnostic path.

Implementation closeout 2026-05-27:

- Added `src/debug/replay-divergence.js` with bounded semantic checkpoint normalization, compact checkpoint hashes, mismatch comparison, deterministic action-outcome checks, and first-owner classification for UI selector/hitbox, reducer transition, and engine movement geometry drift.
- Updated `src/debug/canonical-replay-executor.js` so canonical replay now compares recorded pre-action checkpoints before dispatch, checks deterministic post-action outcomes where needed, and returns `ok`, `blocked`, `drift`, or `error` with the first failing step instead of generic replay failure.
- Added focused tests in `src/debug/replay-divergence.test.js` and extended `src/debug/canonical-replay-executor.test.js` to cover matching replay checkpoints plus intentional drift on wheel angle, slide side, die roll, and wrong active modal.
- Kept diagnostics bounded: no full-state dumps, no screenshot oracle, no automatic drift correction, and no new gameplay semantics.
- Validation run: `node --test .\src\debug\canonical-replay-contract.test.js .\src\debug\browser-repro-recorder.test.js .\src\debug\replay-divergence.test.js .\src\debug\canonical-replay-executor.test.js` passed. `npm run build` passed with the existing Vite chunk-size warning.
- Browser smoke status: the shared VS Code page exposed `window.__ADG_DEBUG__.repro.replayCanonical(...)` and returned a structured `blocked` result for an empty replay payload. The shared page also showed stale module-request aborts, so end-to-end manual acceptance remains the external-browser source of truth.
- Manual acceptance remains pending: in the external browser session, record one exact Charge Drill path, replay it from a fresh start, and confirm the result is either `ok` or reports the first concrete drift step with mismatch path and owner class.

Follow-up routing:

- Implementing role/model: Coding Agent with GPT-5.4, executing `LOG-10A` first and stopping after agent validation plus manual acceptance instructions.
- Required review role/model after `LOG-10A` through `LOG-10C`: Reviewer / Rules Agent with GPT-5.4.
- Reviewer focus: confirm the contract and executor replay real user/game actions, keep logging bounded and privacy-aware, and never mutate canonical end state just to match a recording.
- Lead / Phase Steward gate: required again before broadening beyond the supported Charge Drill LOG-10 path or before turning this into the full P13 replay/undo viewer.

### [x] LOG-11 - Deep Direction-Wheel Selected-Branch Analysis After Explicit Branch Choice

Goal: isolate whether the remaining `direction wheel` defect is primarily post-choice solver cost, post-choice path-shape quality, or both, using fresh selected-branch traces plus bounded summary instrumentation before any solver rewrite.

Current motivation 2026-05-27:

- LOG-09 fixed the original visible stall only up to the branch decision point.
- Current observed behavior is now split cleanly:
  - initial prompt is fast
  - `current orientation` continues fast
  - `direction wheel` still produces a long hang after the explicit branch selection
- Fresh browser repro evidence now confirms the user really is selecting `branch-direction-wheel` at the initial evade-branch dialog, so the remaining issue is not hidden inside the earlier roll-to-handoff phase.
- The reported path-quality symptom is also more specific now: the undesirable line is not merely "a wheel branch exists" but a too-late stop / too-late turn pattern that spends straight-line distance early and leaves the downstream obstacle-avoidance wheel solving a cramped remainder.
- This means the remaining hotspot is no longer the initial combined branch solve. The board now needs a selected-branch analysis card, not another generic evade-planning card.

Planned files:

- `LOGGING_todo.md`
- `roadmap.md` only if the LOG support-slice summary should call out this new split explicitly
- `src/engine/charge/evade.js`
- `src/engine/charge/evade-solver.js`
- optional split target such as `src/engine/charge/evade-direction-wheel-analysis.js` or a bounded helper if instrumentation needs isolation
- `src/debug/debug-log-contract.js`
- `src/debug/browser-debug-logger.js` or the narrow adapter that writes charge/perf summaries
- `src/state/p0-state.test.js`
- `src/engine/charge/evade.test.js`
- optional one-off diagnostic script only if kept out of the main runtime surface

Implementation steps:
1. Reproduce the exact slow path with the explicit `branch-direction-wheel` choice and capture fresh reducer/browser evidence. The controlling path is now post-handoff and post-acknowledgement, not the original roll-to-handoff reducer span.
2. Add bounded summary instrumentation around the selected-branch solver path only. Minimum evidence should include: chosen initial branch id, elapsed time per major solver stage, blocker count, candidate-family count, path-avoidance family count, refinement count, retained-candidate count, and final chosen candidate id/type.
3. Distinguish clearly between these possible owners in the summary output:
  - exact-match direction wheel generation
  - later path-avoidance family expansion
  - obstacle-wheel refinement
  - candidate ranking/tie-break reduction
4. Capture enough bounded geometry evidence to tell whether the bad `direction wheel` result comes from candidate generation itself or from budget allocation within an otherwise legal path family. Minimum additional evidence should name: first forced stop point, remaining distance before each later wheel/slide, number of downstream obstacles seen when the first straight segment is committed, and whether the chosen path consumed the one allowed slide before the final obstacle-wheel stage.
5. Compare the evidence against the fast `current orientation` path from the same drill to identify which stage diverges materially and whether that divergence is runtime only, path-shape only, or both.
6. Re-check the chosen fix shape against the supported source envelope before implementation. For this project baseline, the intended follow-up may use: free initial reorientation, optional paid direction wheel, then during the evade move at most one slide plus one or more wheels totalling at most `90 degrees`, all deducted from remaining evade distance. Do not plan a fix that depends on a second slide, an extra quarter-turn/half-turn during the move, or unbounded back-and-forth wheels.
7. If the owner is confirmed inside an already-known function such as `getDirectionWheelCandidates(...)`, `getPathAvoidanceCandidates(...)`, or the downstream ranking/refinement step that commits too much straight distance too early, prepare the next implementation card as one tightly scoped solver change. Preferred next-card shape: a budget-aware stop-and-turn improvement that reserves enough remaining distance for legal downstream wheel/slide avoidance instead of greedily advancing to the latest possible contact point.
8. Keep this card analytical unless the root cause is trivial and local. Do not silently fold a large solver rewrite into the evidence-gathering card.

Non-goals:

- no automatic solver rewrite in the same card unless the defect is trivial, local, and explicitly re-scoped
- no renewed branch-pruning experiment without fresh evidence that pruning is now the right owning fix
- no rule change to initial branch availability or player-facing semantics
- no speculative tournament-style multi-step choreography unless it stays inside the documented evade budget and obstacle-avoidance limits
- no claim that the remaining wheel path is solved just because the initial handoff is now prompt

Logging expectations:

- Required areas: `charge`, `evade`, and `perf`
- Minimum level: `debug`, with optional `trace` only for bounded selected-branch summaries
- Key evidence: selected branch id, solver stage timings, obstacle/candidate/refinement counters, final candidate id/type, and a browser-visible timestamp gap that can be compared against the fast `current orientation` branch
- Permanent instrumentation must remain one bounded summary per selected-branch execution, not a spammy per-angle dump

Validation:

- exact reducer/browser repro for `unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel`
- focused tests or probes that assert the selected branch id and summary counters are emitted on the wheel path
- `npm run build` if runtime instrumentation changes land in shipped code
- board evidence update comparing `current orientation` versus `direction wheel` on the same drill path

Manual acceptance:

1. Reproduce the exact drill path in the browser until the branch dialog appears.
2. Choose `Wheel`.
3. Confirm the new log output identifies the owning slow stage after branch selection rather than only the original roll-to-handoff phase.
4. Compare the selected-branch summary against the same path with `Aktuelle Orientierung` and confirm the logs explain where the timing diverges.

Stop condition:

- Stop when the board can name the owning selected-branch slow stage or path-allocation defect with bounded evidence and can hand Coding Agent one local implementation target.
- Stop and return to Lead / Phase Steward if the remaining path crosses too many solver layers to define one local owner without a larger refactor decision.

Evidence captured 2026-05-27:

- Bounded selected-branch instrumentation is now present in `resolveIsolatedSingleUnitEvadePlan(...)`, `getDirectionWheelCandidates(...)`, and the compact evade rule-log projection.
- Focused validation passed for the touched slice:
  - `node --test --test-name-pattern "records bounded selected-branch analysis" .\src\engine\charge\evade.test.js`
  - `node --test .\src\debug\rule-logging.test.js`
- Exact reducer-only double-blocker replay (`unit 3 -> unit 20 -> evade -> 6 -> explicit branch choice`) now shows a clear divergence between the two initial branches:
  - `branch-current-orientation` stays in the path-avoidance family with `2` generated candidates, resolves to one later `slide`, and completes in about `17.68 ms` in the measured reducer probe.
  - `branch-direction-wheel` also enters the path-avoidance family, but inside the direction-wheel branch it generates `14` path-avoidance candidates, then immediately collapses them to `1` retained candidate in the branch ranking step before player-facing resolution.
  - The retained direction-wheel candidate is not an early-stop slide-first line; it is a `6`-step path with `4` later wheels, `1` later slide, and `firstLaterStepType = obstacle-wheel`, while several generated but discarded candidates already show earlier slide-first shapes.
  - The measured hotspot is therefore not missing candidate generation for early stop/turn lines. The local owner is the post-generation direction-wheel branch ranking / budget-allocation choice that prefers a long downstream obstacle-wheel path after the candidates already exist.
- Local owner conclusion:
  - Primary owner: direction-wheel branch ranking in `getDirectionWheelCandidates(...)` after candidate generation.
  - Secondary symptom: the selected branch effectively overcommits distance budget before later wheels, producing the visible too-late stop / too-late turn pattern.
  - Not supported by this evidence as the main owner: missing candidate generation, or a downstream obstacle-wheel stage that had no earlier legal candidate family to choose from.

Recommended smallest follow-up card:

- Add one local ranking-policy card immediately after LOG-11 that keeps candidate generation intact and changes only the direction-wheel branch retention rule.
- Candidate shape: prefer an earlier legal stop-and-turn profile when downstream blocker clearance remains, using bounded tie-break inputs such as first-later-step type, later-wheel count, and remaining distance reserved before the first later avoidance step, instead of picking purely by farthest-progress distance against the branch reference pose.
- Non-goal for that follow-up: no rewrite of path-avoidance generation, no new manoeuvre types, no extra slide allowance, and no cross-branch semantics change.
- Stop and mark `Needs Source Check` if the only apparent fix would require changing wheel legality, evade manoeuvre budget, or path-ranking semantics beyond the current supported subset.

Expected result: the project no longer just knows that `Wheel` is slow or ugly; it knows exactly which selected-branch solver stage or budget-allocation decision owns the defect, how that differs from `current orientation`, and what the next smallest implementation target is.

Reviewer routing:

- Planning role/model: Lead / Phase Steward with GPT-5.5.
- Implementing role/model after approval: Coding Agent with GPT-5.4.
- Required review role/model after implementation: Reviewer / Rules Agent with GPT-5.4 if the follow-up changes rule-sensitive wheel/path behavior; otherwise normal technical review is sufficient for the pure analysis slice.
- Reviewer focus: confirm the selected-branch evidence is sufficient, bounded, and does not smuggle in unreviewed rule changes.

### [x] LOG-12 - Direction-Wheel Branch Retention Policy For Earlier Legal Stop-And-Turn

Goal: change only the retained-candidate policy inside the already-generated `direction wheel` branch so the solver prefers an earlier legal stop-and-turn profile when that preserves the supported evade budget and yields a more tournament-like escape line without rewriting candidate generation.

Current motivation 2026-05-27:

- LOG-11 showed that the remaining bad `direction wheel` result is owned primarily by post-generation branch ranking / budget allocation, not by missing candidate generation.
- In the exact reducer-only double-blocker drill, the direction-wheel branch already generates earlier slide-first and earlier turn-back shapes, but the ranker collapses them to one retained candidate that spends the path on a later obstacle-wheel-heavy line.
- The next smallest useful change is therefore local: keep the candidate families, change only which candidate survives inside the direction-wheel branch.
- Broader wayfinding replanning is explicitly deferred for now. It becomes required only if this local retention-policy card cannot materially improve the exact browser/reducer repro while staying inside the documented evade manoeuvre budget.

Planned files:

- `LOGGING_todo.md`
- `src/engine/charge/evade-solver.js`
- `src/engine/charge/evade-model.js` only if a bounded helper summary or comparison input is needed
- `src/engine/charge/evade.test.js`
- `src/state/p0-state.test.js` only if the reducer drill needs one exact retained-candidate assertion
- `src/debug/rule-logging.test.js` only if the emitted summary shape changes materially

Implementation steps:
1. Re-read the LOG-11 evidence and keep the local owner fixed: direction-wheel branch retention after candidate generation in `getDirectionWheelCandidates(...)`.
2. Preserve the existing candidate generator and supported evade manoeuvre envelope. Do not widen legal manoeuvre families in this card.
3. Add one bounded ranking-policy layer for the already-generated direction-wheel branch that prefers earlier legal stop-and-turn shapes when downstream obstacle handling is still needed.
4. Candidate-preference inputs may include only bounded, already-supported signals such as:
  - first later step type
  - later wheel count
  - later slide count
  - remaining distance reserved before or after the first later avoidance step
  - resulting distance from the charger
  - whether the candidate returns to or meaningfully trends back toward the original flee alignment without inventing extra manoeuvres
5. Keep the ranking deterministic and local. If two candidates still tie after the new policy inputs, fall back to the existing stable distance/id ordering rather than adding a second planner.
6. Validate that the exact wheel double-blocker repro no longer retains the late-turn multi-wheel line when an earlier legal stop-and-turn candidate already exists in the same branch.
7. If the local ranking policy cannot improve the retained candidate without changing legality assumptions, stop and hand back to Lead / Phase Steward with an explicit recommendation for broader wayfinding brainstorming instead of stretching this card.

Non-goals:

- no rewrite of `getPathAvoidanceCandidates(...)`
- no new manoeuvre types, no second slide allowance, and no extra turn privileges
- no cross-branch semantics change between `current orientation` and `direction wheel`
- no broad pathfinding concept rewrite in the same card
- no claim that the general evade solver is globally optimal after this card

Logging expectations:

- Required areas: `evade` and `perf`
- Minimum level: `debug`
- Key evidence: pre-rank candidate count, retained candidate id/type, retained candidate analysis, and the exact bounded reasons the new retention policy preferred that candidate over the discarded alternatives
- Keep the runtime output bounded to the existing selected-branch summary shape or one comparably small addition; do not add per-candidate verbose dumps in normal runs

Validation:

- focused engine tests for direction-wheel branch retention and tie-break behavior
- exact reducer-only double-blocker probe comparing `branch-current-orientation` versus `branch-direction-wheel`
- `npm run build` if shipped runtime code or debug projections change outside pure tests
- board evidence update stating whether the retained wheel candidate changed from the late-turn multi-wheel line to an earlier legal stop-and-turn line

Manual acceptance:

1. Reproduce the exact drill path in the browser until the initial evade branch dialog appears.
2. Choose `Wheel`.
3. Confirm the visible path no longer delays the main deviation until the cramped downstream obstacle-wheel stage when an earlier legal stop-and-turn line exists.
4. Compare the new `Wheel` path against `Aktuelle Orientierung` and confirm the wheel branch still aims to end far from the charger while trending back toward the original flee direction when legal.

Stop condition:

- Stop when one local ranking-policy change produces a clearly better retained `direction wheel` candidate on the exact repro without changing the supported evade budget.
- Stop and return to Lead / Phase Steward if the only plausible improvement now requires broader pathfinding replanning, a new legality model, or a change to the documented manoeuvre budget.

Expected result:

- The exact `Wheel` repro retains an earlier legal stop-and-turn candidate from the already-generated branch instead of the current late-turn multi-wheel line.
- The next planning decision remains intentionally narrow: broader wayfinding brainstorming is deferred unless this local card fails or reveals a rule/architecture boundary that cannot be solved by branch retention alone.

Reviewer routing:

- Planning role/model: Lead / Phase Steward with GPT-5.5.
- Implementing role/model after approval: Coding Agent with GPT-5.4.
- Required review role/model after implementation: Reviewer / Rules Agent with GPT-5.4.
- Reviewer focus: confirm that the change stayed inside the existing evade budget, changed retention policy rather than candidate legality, and improved the retained path on the exact double-blocker repro.

Implementation outcome 2026-05-27:

- The local change stayed inside `getDirectionWheelCandidates(...)` branch retention and did not alter candidate generation or the supported evade manoeuvre budget.
- The direction-wheel branch now uses a bounded local retention policy before the existing distance fallback, preferring:
  - no later avoidance when available
  - otherwise a first later `slide` ahead of a first later `obstacle-wheel`
  - then fewer later wheels
  - then fewer later steps
  - then more reserve after the first later step / at the end when still tied
  - then the previous distance-based ordering as the stable fallback
- The retained candidate now carries bounded policy metadata through the existing summary path:
  - `branchRankingPolicy = direction-wheel-branch-retention`
  - `branchRankingReasonCodes = [...]`
- Exact reducer-only double-blocker evidence now shows the wheel branch retaining:
  - `direction-wheel-left-0.524-slide-left-0.173-wheel-right-1.220`
  - `3` total steps
  - `firstLaterStepType = slide`
  - `laterWheelCount = 1`
  instead of the earlier retained late-turn line with `6` total steps and `4` later wheels.
- The current-orientation branch remains unchanged in the same probe and still retains `slide-left-1.000`.

Validation run:

- `node --test --test-name-pattern "records bounded selected-branch analysis|initial direction-wheel branch retains an earlier slide-first candidate" .\src\engine\charge\evade.test.js .\src\state\p0-state.test.js`
- exact reducer-only branch comparison probe for `branch-current-orientation` versus `branch-direction-wheel`
- `npm run build`

Current card status:

- Formal Lead decision 2026-05-27: completed but superseded by LOG-13 concept direction.
- LOG-12 remains useful as evidence and as a temporary local experiment, but it is not the accepted long-term rules/design direction.
- Do not spend more implementation effort correcting LOG-12-style retention tuning unless LOG-13 is explicitly rejected or paused later.
- Manual browser acceptance for LOG-12 is superseded by LOG-13/LOG-14 acceptance; do not treat LOG-12 visual behavior as final product acceptance.

### [x] LOG-13 - Evade Wayfinding V2 Concept: Conflict-Based Pattern Planner

Goal: define a new evade-planner direction that replaces the current global micro-manoeuvre search and ranking emphasis with a conflict-based, pattern-driven planner that produces faster, more human-plausible tournament behavior while staying inside the supported evade rules subset.

Current motivation 2026-05-27:

- LOG-09 through LOG-12 improved observability and one narrow retention choice, but the project is still circling around an underlying modeling problem rather than a single remaining comparator bug.
- Current results remain unsatisfactory in two ways:
  - the explicit `direction wheel` branch is still expensive to compute on the exact drill repro
  - even when the retained path improves, the solver still tends to search and reason in a way that produces visibly non-human results such as late cosmetic wheels or micro-adjustment-heavy lines
- For tournament-training use, human-plausible movement behavior is now the preferred design target over strict geometric maximization of final charger distance.
- The agreed design direction is therefore broader replanning, not more LOG-12-style retention tuning on top of the same global micro-manoeuvre model.

Planned files:

- `LOGGING_todo.md`
- `roadmap.md` only if the support-board summary should call out this replanning decision explicitly
- concept target to be decided after approval, likely one or more of:
  - `docs/charge-evade-wayfinding-concept.md`
  - `src/engine/charge/evade-wayfinding.js`
  - `src/engine/charge/evade-patterns.js`
  - `src/engine/charge/evade-legality.js`
  - `src/engine/charge/evade.test.js`
  - `src/state/p0-state.test.js`

Concept scope:

- Replace the current idea of "generate many complete end-state candidates and rank them globally" with a planner that:
  - advances along the flee idea until the next real conflict
  - resolves that conflict using a small fixed library of human-like manoeuvre patterns
  - then advances again and repeats if another conflict appears
- Treat this as an evade-wayfinding concept only for the current supported single-unit evade subset.
- Do not expand this card into a general pathfinding framework for the whole game.
- Keep conform or other later movement families out of implementation scope for this card; they are only mentioned as future consumers of the same general design ideas.

Design principles:

1. Human-plausible tournament behavior is preferred over strict geometric maximization.
2. No overlap is allowed at any point with enemies or impassable terrain; legality must use swept-path checks for advance, slide, and wheel rather than end-pose-only checks.
3. Friendly temporary interpenetration must be handled separately and only where the rules explicitly allow it.
4. The planner should use a small fixed manoeuvre-pattern library rather than unbounded micro-search.
5. Re-alignment toward the original flee direction matters, but is not absolute when little distance remains or when a small residual skew is the cleaner human result.
6. Large late cosmetic wheels are undesirable unless they genuinely improve re-alignment toward the flee direction.
7. Two-wheel obstacle bypass is an explicit supported pattern family.
8. The planner should reason at conflict points, not through many tiny wheel refinements against a single corner.

Allowed manoeuvre patterns V1:

- `straight`
- `slide -> straight`
- `wheel-out -> straight`
- `wheel-out -> straight -> wheel-back`
- `slide -> wheel-out -> straight`
- `slide -> wheel-out -> straight -> wheel-back`
- `wheel-out -> slide -> straight`
- `wheel-out -> slide -> straight -> wheel-back`
- optional low-count extension patterns after approval only if needed for a real drill case, for example:
  - `wheel-out -> short-advance -> wheel-more -> straight`
  - `wheel-out -> short-advance -> wheel-back -> straight`
- Explicit non-pattern behavior for V1:
  - no many-mini-wheel search
  - no free angle refinement ladder that yields seven tiny wheels around a millimeter edge
  - no global candidate explosion only to sort by one scalar score at the end

Legality model:

1. `advance` legality checks the swept footprint corridor, not only the end pose.
2. `slide` legality checks the full lateral displacement path, not only the final shifted pose.
3. `wheel` legality checks the rotating base throughout the rotation arc, not only the final wheel endpoint.
4. Enemies and impassable terrain are hard blockers and may not be overlapped at any intermediate point.
5. Friendly units must be classified separately:
  - legal temporary interpenetration where source-backed rules explicitly allow it
  - non-legal temporary contact treated as a blocker
6. If the current source lock is insufficient for a friendly interpenetration case, the concept should keep V1 conservative rather than silently over-allowing it.

Evaluation order:

1. fully legal manoeuvre sequence under the supported evade budget and swept-path restrictions
2. meaningful progress along the flee idea rather than local geometric thrashing
3. simpler conflict resolution pattern ahead of complex chains
4. better return toward the original flee direction when that return has genuine gameplay value
5. avoidance of large late cosmetic wheels
6. distance from the charger remains relevant, but no longer acts as the sole or always-primary design objective for planner behavior

Non-goals:

- no further narrow LOG-12-style retention tuning as the primary direction
- no immediate implementation of a full general pathfinding engine
- no rule expansion beyond the supported evade subset
- no silent friend-interpenetration liberalization without source-backed legality
- no commitment yet to conform or other movement families using the same planner
- no claim in this card that the new concept is already implemented or source-complete

Validation plan:

- use the existing exact double-blocker drill as the primary first benchmark
- define at least one simple single-obstacle benchmark where a human-like slide or wheel-out decision is obviously expected
- define at least one "return toward flee direction" benchmark where a large cosmetic late wheel should lose against a cleaner earlier pattern
- verify that no selected V1 pattern produces swept-path overlap with enemies or impassable terrain
- verify that any allowed friendly temporary interpenetration case is source-explicit or else remains conservatively blocked
- after implementation planning begins, require focused engine tests plus the exact reducer/browser repro path for `unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel`

Manual acceptance:

1. Review the concept against the current bad browser screenshots and confirm that the prohibited path shape is now explicitly treated as undesirable.
2. Confirm the concept prefers small human-like pattern families over free micro-search.
3. Confirm the legality model explicitly requires swept-path checks against enemies and impassable terrain.
4. Confirm friendly interpenetration is treated as a separate source-sensitive rule block rather than a generic blocker exception.

Stop condition:

- Stop when the board has a precise concept for a conflict-based, pattern-driven evade planner that is specific enough to hand Coding Agent one first implementation slice without reopening the same ranking debate.
- Stop and return to further Lead / Reviewer planning only if source uncertainty around friendly interpenetration or evade selection priorities blocks even a conservative V1 concept.

Expected result:

- The project has a board-approved wayfinding direction that supersedes further LOG-12-style retention tuning as the main line of work.
- The next implementation slice can target a small conflict detector plus a first V1 pattern library rather than continuing to patch global end-candidate ranking.
- Future solver behavior is judged primarily against human-plausible tournament movement and swept-path legality, not against micro-optimized charger-distance outcomes.

Planning decision:

- This concept card supersedes further LOG-12-style retention tuning as the primary forward path.
- LOG-12 remains useful as evidence and as a temporary local experiment, but its comparator-level direction should not continue to absorb design effort while LOG-13 is open.
- Lead approval 2026-05-27: accepted as the official new support-board direction for the evade path-quality problem.
- Roadmap should call out the direction shift because it changes the next coding target from retention tuning to conflict-based pattern planning.

Coding Agent handoff target after concept approval:

- First implementation slice: build a conflict-detection foundation plus one small V1 pattern set for the current supported evade subset.
- Preferred first slice shape:
  - detect the next hard conflict along the flee line using swept-path checks
  - evaluate a minimal pattern set such as `straight`, `slide -> straight`, `wheel-out -> straight`, and `wheel-out -> straight -> wheel-back`
  - keep enemy/impassable hard blockers separate from friendly source-sensitive interpenetration handling
  - prove the exact double-blocker drill no longer depends on global micro-wheel ranking to get a plausible answer

Reviewer routing:

- Planning role/model: Lead / Phase Steward with GPT-5.5 preferred; current draft captured in GPT-5.4 only as a planning placeholder requested by the user.
- Implementing role/model after approval: Coding Agent with GPT-5.4.
- Required review role/model after the first implementation slice: Reviewer / Rules Agent with GPT-5.4.
- Reviewer focus: confirm that the first slice truly uses conflict-based pattern planning, swept-path legality, and separate friendly interpenetration handling instead of quietly reintroducing global micro-search.

### [x] LOG-14 - First Evade Wayfinding V2 Slice: Hard-Conflict Detection + Minimal Patterns

Closeout status 2026-05-27: closed after LOG-15 landed the remaining terrain/wheel-arc follow-up that had kept the original reviewer packet in `Needs Changes`.

Goal: implement the first approved LOG-13 slice for the current supported single-unit evade subset by adding hard-conflict detection along the flee line plus a minimal conflict-based pattern set, without building a full general pathfinder.

Approved scope 2026-05-27:

- This is the first Coding Agent slice released from LOG-13.
- It replaces further LOG-12 comparator tuning as the next implementation target.
- It must be implemented conservatively and locally enough to review before any wider pattern library is attempted.

Planned files:

- `src/engine/charge/evade-wayfinding.js` or a similarly small new helper module if that fits local imports cleanly
- `src/engine/charge/evade-solver.js`
- `src/engine/charge/evade.js` only where needed to route the new planner into the selected branch
- `src/engine/charge/evade-model.js` only if a bounded summary field is needed
- `src/engine/charge/evade.test.js`
- `src/state/p0-state.test.js`
- `LOGGING_todo.md`

Implementation steps:
1. Add a `detectNextConflict` foundation for the current flee line that identifies the first hard blocker encountered by a straight advance.
2. Treat enemies and impassable terrain as hard blockers that must not overlap at any point of the movement.
3. Use swept-path checks for the first slice at least for the straight advance corridor. If full wheel-arc swept checking is too large for this slice, expose that as a named limitation and keep wheel candidates conservative rather than end-pose-only optimistic.
4. Keep friendly units separate from hard blockers. Do not add generic friendly interpenetration permission in this slice; conservatively block or defer friend cases unless an already source-safe helper exists.
5. Evaluate only this minimal V1 pattern set:
  - `straight`
  - `slide -> straight`
  - `wheel-out -> straight`
  - `wheel-out -> straight -> wheel-back`
6. Do not add the larger V1 variants yet (`slide -> wheel-out`, `wheel-out -> slide`, or extension patterns). Those remain follow-ups after the first slice proves the architecture.
7. Add bounded decision-trace evidence showing: conflict distance, blocker ids/types, pattern candidates evaluated, selected pattern id, and why rejected patterns failed.
8. Prefer a human-plausible legal pattern over a late cosmetic wheel outcome when the pattern stays within the supported evade budget and avoids hard-blocker overlap.
9. Stop and return to Lead / Reviewer if the exact double-blocker improvement requires friendly interpenetration assumptions, new manoeuvre legality, or broader pattern search.

Non-goals:

- no full general pathfinding engine
- no many-mini-wheel search or free angle refinement ladder
- no generic friendly interpenetration allowance
- no conform-system implementation
- no broad rewrite of unrelated charge or movement behavior
- no claim that the full V1 pattern library is complete after this slice

Logging expectations:

- Required areas: `evade` and `perf`
- Minimum level: `debug`
- Key evidence: first hard conflict, swept-path blocker classification, evaluated pattern ids, selected pattern id, rejection reasons, and timings for the new wayfinding path
- Keep output bounded to one selected-branch summary and a small pattern-evaluation summary; do not emit per-angle spam

Validation:

- focused engine test for `detectNextConflict` on a simple hard blocker
- focused engine test for a simple single-obstacle case where `slide -> straight` or `wheel-out -> straight` is the obvious human-like legal result
- focused engine or reducer test for a re-alignment case where a large cosmetic late wheel should not win over `wheel-out -> straight -> wheel-back`
- exact reducer-only double-blocker drill for `unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel`
- `npm run build` if runtime routing changes land

Manual acceptance:

1. Reproduce the exact browser drill path until the initial evade branch dialog appears.
2. Choose `Wheel`.
3. Confirm the path uses an earlier conflict-based pattern rather than a late large final wheel or many tiny wheels.
4. Confirm no visible path segment crosses an enemy or impassable obstacle.
5. Confirm friend-overlap behavior is not silently liberalized in this slice.

Stop condition:

- Stop when the first slice proves the new architecture can detect hard conflicts and select one of the four approved minimal patterns on focused tests and the exact drill repro.
- Stop and route back to Lead / Reviewer if the first useful improvement requires source-open friendly interpenetration, a broader pattern list, or a full pathfinding rewrite.

Expected result:

- GPT-5.4 has a narrow implementation target that starts LOG-13 without re-opening LOG-12 ranking debates.
- The project gains a reusable hard-conflict detection and minimal pattern-selection foundation for Evade Wayfinding V2.
- The exact double-blocker repro has a path-quality validation target tied to conflict-based planning rather than global micro-manoeuvre ranking.

Reviewer routing:

- Planning role/model: Lead / Phase Steward with GPT-5.5 approved this slice on 2026-05-27.
- Implementing role/model: Coding Agent with GPT-5.4.
- Required review role/model after implementation: Reviewer / Rules Agent with GPT-5.4.
- Reviewer focus: swept-path hard-blocker legality, conservative friendly treatment, bounded logging, and proof that the implementation uses the four-pattern slice rather than reintroducing global micro-search.

Implementation progress 2026-05-27:

- Added `detectNextHardEvadeConflict(...)` in `src/engine/charge/evade-solver.js` using the existing memoized straight-line swept-path blocker check as the first hard-conflict foundation.
- Added a conservative LOG-14 pattern source inside the direction-wheel branch before legacy fallback. It evaluates only the approved minimal set after a hard conflict: `slide -> straight`, `wheel-out -> straight`, and `wheel-out -> straight -> wheel-back`; the no-conflict `straight` case remains the existing direct branch candidate.
- Kept friendly interpenetration conservative by treating unit blockers as hard blockers unless an existing source-safe allowance is present; no generic friend pass-through was added.
- Added bounded `wayfinding-v2-patterns` decision-trace evidence with conflict id/type, conservative manoeuvre point, evaluated pattern ids, accepted count, rejection reasons, and a named limitation.
- Exact reducer-only double-blocker branch now selects `direction-wheel-left-0.524-wheel-left-1.047` from `generationSource: wayfinding-v2-pattern`, replacing the old late slide-plus-large-wheel fallback for that explicit `Wheel` branch.
- Follow-up on the same date added one local direction-wheel ranking improvement for accepted V2 realignment patterns: when no slide lane exists and both `wheel-out -> straight` and `wheel-out -> straight -> wheel-back` are already legal, the retained branch candidate now prefers the cleaner return toward the branch flee direction instead of keeping the old one-way skew by default.
- Added a focused accepted wheel-back test covering a no-slide geometry where `wheel-out -> straight -> wheel-back` now wins over a one-way wheel-out candidate.
- Additional follow-up on the same date refined accepted V2 pattern start points forward from the conservative manoeuvre buffer to the latest still-legal start along the flee line. This keeps the same legal pattern family but makes the selected path follow the charge direction as long as possible before deviating.
- Additional follow-up on the same date allowed one bounded recursive V2 hard-conflict continuation after an accepted local pattern so the exact drill can handle the second blocker without reopening a broad pathfinder.
- A further exact-drill shaping follow-up then moved accepted V2 wheel-back candidates earlier along the temporary parallel lane instead of forcing the wheel-back to wait until the very end of the remaining distance. The direction-wheel branch ranking was also tightened to prefer fewer later slides and wheel-first local returns when a legal wheel-based re-alignment chain exists.

Current exact-path note:

- The exact double-blocker `Wheel` drill no longer selects the old single wheel-out or the intermediate slide-root chain. The retained branch is now a wheel-first local re-alignment chain with no later slide: `wheel-left-0.524-straight-wheel-right-0.524->wheel-right-0.524-straight`.
- This keeps the evade on a more wheel-parallel / return-to-direction shape through the first blocker before the second local correction, matching the intended `wheel -> advance -> wheel` family better than the earlier red-path drift.

Known limits / reviewer risks:

- Wheel candidates are conservative but not yet fully arc-swept; the trace records `wheel-arc-swept-check-deferred`. This must be reviewed before extending the pattern library.
- Impassable terrain does not yet have a dedicated blocker adapter in this slice; current hard-conflict detection is unit-based plus existing battlefield bounds.
- Full affected-file validation still exposes existing table-exit/source-open expectation failures unrelated to the LOG-14 double-blocker path: table-exit tests currently return `needs-source-check` / `source-open` instead of the older committed removal hook expectation.
- Reviewer result on 2026-05-27: `Needs Changes` on the original slice. This blocker is now resolved by LOG-15 implementation; LOG-14 itself is closed and no longer carries the terrain / wheel-arc follow-up.

Validation 2026-05-27:

- `node --test --test-name-pattern "hard-conflict|LOG-14|minimal wayfinding|bounded selected-branch|double-blocker initial direction-wheel" .\src\engine\charge\evade.test.js .\src\state\p0-state.test.js` passed: 4 tests, 4 pass.
- `npm run build` passed.
- `get_errors` found no errors in `src/engine/charge/evade-solver.js`, `src/engine/charge/evade.test.js`, or `src/state/p0-state.test.js`.
- Wider check `node --test .\src\engine\charge\evade.test.js .\src\state\p0-state.test.js` passed the LOG-14 tests but still failed the four table-exit/source-open expectations listed above; those are recorded as residual, not repaired in LOG-14.
- Follow-up focused validation after the local realignment preference change passed:
  - `node --test --test-name-pattern "wheel-back realignment|minimal wayfinding|hard-conflict|double-blocker initial direction-wheel" .\src\engine\charge\evade.test.js .\src\state\p0-state.test.js`
- Follow-up focused validation after the later-start refinement also passed on the same command.
- Follow-up focused validation after the bounded recursive continuation, early wheel-back, and wheel-first ranking change passed:
  - `node --test --test-name-pattern "hard-conflict|chain one additional local V2 conflict|wheel-back realignment|double-blocker initial direction-wheel" .\src\engine\charge\evade.test.js .\src\state\p0-state.test.js`
- Final build validation after the wheel-first follow-up also passed:
  - `npm run build`

Manual acceptance status:

- Not performed in browser during this coding slice. User/manual acceptance remains: reproduce the exact Charge Drill path, choose `Wheel`, confirm the path uses the earlier V2 pattern rather than a late large final wheel, and confirm no visible hard-blocker crossing.

Reviewer handoff packet:

- Review role/model: Reviewer / Rules Agent with GPT-5.4.
- Exact task: review LOG-14 implementation for whether the first slice genuinely uses conflict-based pattern planning, swept straight-line hard-blocker legality, conservative friendly treatment, and bounded trace evidence without reintroducing global micro-search.
- Key files: `src/engine/charge/evade-solver.js`, `src/engine/charge/evade.test.js`, `src/state/p0-state.test.js`, `LOGGING_todo.md`, `roadmap.md`.
- Expected output: `Approved`, `Needs Changes`, or `Blocked` with concrete findings, especially on the named wheel-arc-sweep and impassable-terrain limitations.

Next card after reviewer follow-up:

### [x] LOG-14A - Bounded Second-Conflict Evade Wayfinding + Straight-Reserve Preference

Closeout status 2026-05-27: implemented as an intermediate shaping step and superseded by the finalized LOG-14B corridor-ranking slice.

Goal: keep the current one-extra-conflict V2 continuation narrow, but refine selection so the exact drill can preserve more straight reserve after re-alignment when a nearby legal wheel-first alternative exists.

Planned files:

- `src/engine/charge/evade-solver.js`
- `src/engine/charge/evade.test.js`
- `src/state/p0-state.test.js`
- `LOGGING_todo.md`

Implementation steps:
1. Keep `EVADE_WAYFINDING_V2_MAX_CONFLICT_DEPTH = 1`; do not expand recursion depth.
2. Keep the conservative one-slide handling from the latest LOG-14 follow-up; no generic second slide path is allowed.
3. In direction-wheel branch ranking, when two wheel-first re-alignment candidates stay within a small alignment tolerance, prefer the one that preserves more final straight reserve after the last avoidance step.
4. Use fewer later wheels and fewer later steps as follow-up tie-breakers inside that alignment-tolerance window.
5. Keep the existing exact-drill path wheel-first; do not re-open slide-root drift while implementing reserve preference.

Non-goals:

- no deeper recursion
- no impassable terrain support
- no wheel-arc sweep closure
- no broad pattern-library expansion

Validation:

- `node --test --test-name-pattern "chain one additional local V2 conflict|wheel-back realignment|double-blocker initial direction-wheel" .\src\engine\charge\evade.test.js .\src\state\p0-state.test.js`
- `npm run build`

Implementation progress 2026-05-27:

- Added a direction-wheel branch refinement in `src/engine/charge/evade-solver.js`: a legal evade-move slide can now beat a wheel-first blocker bypass when it keeps or reduces later maneuver complexity, removing the previous hard anti-slide bias without reopening broad search.
- The exact double-blocker branch now selects `slide-left-straight->wheel-right-0.785-straight`, spending the single evade slide on the first blocker and keeping the later correction as one wheel instead of forcing a pure wheel chain.
- Focused tests were updated so the exact drill asserts the slide-first path plus the branch reason code `prefer-first-later-slide-over-wheel-path`.

Manual acceptance status:

- Pending. Reproduce `unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel` and confirm the path still avoids the old red drift while preserving more end-of-path straight reserve than the previous wheel-dense chain.

### [x] LOG-14B - Evade Corridor Ranking + Post-Slide Wheel-Back Bypass

Closeout status 2026-05-27: implemented, validated, and accepted by the user as the final LOG-14 shaping slice; remaining terrain/wheel-arc work moved into LOG-15.

Goal: replace the current exact-drill path-shaping heuristics with a small corridor-aware scoring layer and a post-slide wheel-back bypass family so the selected evade path feels like a human tabletop move: follow the ideal flee line as long as practical, use one clear slide when it solves a blocker, start the next wheel early enough to avoid a late over-wide turn, and return toward the ideal line with a clear second wheel when legal.

Planning context:

- Current LOG-14A behavior now correctly prefers the first small evade slide, but the follow-up wheel can still swing too far right because the solver has no explicit `slide -> wheel-out -> wheel-back` bypass family.
- Current recursion uses `getPreferredEvadeCandidatesByDistance(...)`, which is generic distance/end-pose ranking and does not carry direction-wheel corridor intent into the second hard conflict.
- The intended behavior is not a broad free-form pathfinder. It is a deterministic, bounded legal-maneuver graph with a corridor cost model.

Planned files:

- `src/engine/charge/evade-solver.js`
- `src/engine/charge/evade.test.js`
- `src/state/p0-state.test.js`
- `LOGGING_todo.md`

Implementation steps:
1. Keep `EVADE_WAYFINDING_V2_MAX_CONFLICT_DEPTH = 1`; do not expand recursion depth in this card.
2. Add an internal flee-corridor context for direction-wheel branch wayfinding: ideal flee-line start pose, target rotation after the initial direction wheel, and total available evade distance.
3. Add corridor scoring signals for accepted candidates, without making them legality checks:
  - maximum lateral deviation from the ideal flee line;
  - final alignment delta from the direction-wheel target rotation;
  - remaining straight distance after the last avoidance step;
  - total maneuver UD spent after the initial direction wheel;
  - largest single wheel angle / wheel UD spend;
  - later step count and clear-maneuver count.
4. Add a post-slide bypass candidate family for the second hard conflict: `slide -> wheel-out -> straight -> wheel-back`, using the existing wheel-back legality pattern where possible instead of duplicating geometry logic.
5. Rank legal direction-wheel branch candidates with corridor intent before generic distance ranking: prefer small lateral deviation, then lower total maneuver UD spend, then smaller largest single wheel, then earlier return toward the target rotation, then more remaining straight distance after the final avoidance step.
6. Add a human-placement guardrail: do not let many tiny wheels beat one or two clear obstacle-bypass maneuvers. Penalize candidates with more than two later obstacle wheels unless they materially improve corridor deviation and UD spend.
7. Keep one evade slide total. Distinguish the single evade-move slide from any future/free `<1 UD` blocker-clearance concept; this card must not introduce a second generic slide.
8. Keep candidate traces bounded: expose only the selected candidate score summary and top rejection/reason codes, not a large search dump.

Non-goals:

- no deeper recursion or global A* / grid search
- no impassable terrain support; that remains LOG-15
- no wheel-arc sweep closure; that remains LOG-15
- no generic friendly interpenetration allowance
- no many-micro-wheel optimization that looks unlike tabletop play
- no source-rule change to slide allowance, wheel budget, or evade distance

Validation:

- Add or update a focused engine test proving the exact drill can select a legal `slide -> wheel-out -> wheel-back` style candidate when it beats the current single late wheel on corridor score.
- Keep the existing wheel-back realignment test green where no slide lane exists.
- Keep the reducer drill `unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel` asserting the selected path is generated by bounded wayfinding, uses exactly one slide, and does not rely on broad fallback search.
- Run `node --test --test-name-pattern "chain one additional local V2 conflict|wheel-back realignment|double-blocker initial direction-wheel" .\src\engine\charge\evade.test.js .\src\state\p0-state.test.js`.
- Run `npm run build`.

Manual acceptance:

1. Open the Charge Drill.
2. Reproduce `unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel`.
3. Confirm the selected path first uses a small slide around blocker 1.
4. Confirm the path then starts a clear wheel before blocker 2 instead of a late over-wide turn.
5. Confirm a second wheel visibly returns the unit toward the flee corridor after blocker 2.
6. Confirm the result still looks like one or two human-placed obstacle maneuvers rather than a chain of tiny micro-wheels.

Stop condition:

- Stop after focused tests and build pass. Do not close LOG-14 overall and do not claim terrain/wheel-arc safety; route to review first.

Expected result:

- The exact drill no longer optimizes only for slide-first or end alignment. It selects a path that better preserves the ideal flee corridor, spends less UD on unnecessary maneuvering when comparable, and avoids visually unnatural late/rightward over-swing.

Implementation progress 2026-05-27:

- Refined recursive direction-wheel V2 selection in `src/engine/charge/evade-solver.js` so bounded second-conflict candidates inside the direction-wheel branch are ranked with the same branch-retention policy instead of falling back to generic distance sorting.
- Allowed post-slide wheel-back probing to start earlier along the remaining flee path, which enables a legal `slide -> wheel-right-0.262 -> wheel-left-0.262` bypass family that was previously accepted in trace but not retained through recursive selection.
- Added bounded corridor-aware ranking signals to the direction-wheel branch: lateral deviation, final lateral return, total later maneuver UD spend, and largest later wheel. The comparator now keeps these subordinate to a human-placement guardrail so minor corridor gains do not justify huge single wheels or micro-wheel chains.
- Expanded realignment-wheel-back detection so slide-root `wheel-out -> wheel-back` candidates count as true return-to-corridor paths.
- The exact double-blocker branch now selects `slide-left-straight->wheel-right-0.262-straight-wheel-left-0.262`, which keeps the first small slide, starts the bypass wheel earlier, and uses one clear return wheel instead of a late larger outward turn.
- Focused tests were updated so the exact drill asserts the new slide-root wheel-back path plus bounded branch-ranking evidence.

Logging expectations:

- Add bounded score evidence under existing evade decision trace entries, including selected corridor score components and reason code such as `prefer-corridor-natural-bypass`.
- Do not let logging decide legality or mutate candidate selection.

Validation 2026-05-27:

- `node --test --test-name-pattern "chain one additional local V2 conflict|wheel-back realignment|double-blocker initial direction-wheel|slide-root wheel-back bypass" .\src\engine\charge\evade.test.js .\src\state\p0-state.test.js` passed: 3 tests, 3 pass.
- `npm run build` passed.

Additional corridor/slide-distance follow-up 2026-05-27:

- Re-checked the remaining exact-drill complaint after LOG-14B and found that the solver already selected a slide-root path, but `evaluateSlidePattern(...)` only tested the first/minimum legal slide distance. The visible result could therefore look like a tiny clearance nudge rather than a genuinely evaluated slide option.
- Updated `evaluateSlidePattern(...)` so accepted slide patterns consider every permitted legal slide distance up to the remaining-distance / 1 UD cap, then let direction-wheel branch ranking choose the best legal result.
- Added bounded branch corridor score evidence to the selected candidate summary via `branchRankingCorridorScore`, including lateral deviation, final lateral return, total later maneuver UD spend, largest later wheel, later step counts, and first later step type.
- Adjusted direction-wheel branch ranking so a slide-first corridor bypass can beat the older no-slide / fewer-later-slide preference when it is no worse on corridor, maneuver spend, and wheel-size signals.
- Strengthened the no-slide-lane wheel-back regression fixture with an added `slide-lane-blocker` so that test continues to cover a true no-slide lane after broader slide-distance generation.
- Exact reducer/engine selected branch remains `slide-left-straight->wheel-right-0.262-straight-wheel-left-0.262`, now with reason code `prefer-slide-first-corridor-bypass` and score evidence showing `firstLaterStepType = slide`, `laterSlideCount = 1`, `laterWheelCount = 2`, and `maxLateralDeviationUd <= 0.3`.
- Larger slide candidates such as `slide-left-0.250`, `0.500`, `0.750`, and `1.000` are now generated and considered; the retained `slide-left-0.175` still wins because it is closest to the ideal flee corridor and spends less maneuver distance. If the product goal changes to prefer visibly larger slides over strict corridor closeness, that needs a separate ranking decision.

Follow-up validation 2026-05-27:

- `node --test --test-name-pattern "chain one additional local V2 conflict|wheel-back realignment|double-blocker initial direction-wheel|slide-root wheel-back bypass|bounded selected-branch" .\src\engine\charge\evade.test.js .\src\state\p0-state.test.js` passed: 4 tests, 4 pass.
- `get_errors` found no diagnostics in `src/engine/charge/evade-solver.js`, `src/engine/charge/evade-model.js`, `src/engine/charge/evade.test.js`, or `src/state/p0-state.test.js`.
- `npm run build` passed with the existing Vite chunk-size warning only.
- Browser replay smoke at `http://127.0.0.1:4175/` passed through `window.__ADG_DEBUG__.repro.replayCanonical(...)`: `39/39` supported events replayed with `status = ok`. This replay is a smoke of the replay/browser path and currently uses `branch-current-orientation`, so it is not exact visual acceptance for the `Wheel` branch.

Manual acceptance status:

- Pending. Browser/manual acceptance remains required for `unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel` to confirm the visible path now looks like one small slide, one earlier bypass wheel, and one clear return wheel without visual over-swing. The current automated browser smoke proves the replay path still runs, but it does not replace this exact Wheel-branch visual check.

Review routing:

- Reviewer / Rules Agent with GPT-5.4 after implementation.
- Review focus: bounded search scope, one-slide discipline, no source-rule drift, no micro-wheel optimization, and whether the new corridor score explains the exact drill without masking LOG-15 blockers.

Reviewer handoff packet:

- Review role/model: Reviewer / Rules Agent with GPT-5.4.
- Exact task: review LOG-14B for whether the new slide-root wheel-back bypass stays bounded, preserves one-slide discipline, restores the existing no-slide-lane wheel-back case, and improves the exact drill without broadening into general path search.
- Key files: `src/engine/charge/evade-solver.js`, `src/engine/charge/evade.test.js`, `src/state/p0-state.test.js`, `LOGGING_todo.md`.
- Expected output: `Approved`, `Needs Changes`, or `Blocked` with concrete findings, especially on corridor-ranking defensibility, micro-wheel guardrails, and any interaction risk with deferred LOG-15 terrain/wheel-arc blockers.

### [x] LOG-15 - Impassable Hard-Blockers + Wheel-Arc Safety Gate For Evade Wayfinding V2

Closeout status 2026-05-27: complete for the current support scope. Wheel-arc safety sampling and blocker threading landed, the exact drill test/build validation passed, and remaining terrain-blocker completeness plus broader browser/manual polish are explicitly deferred until after P16 by user direction.

Agent implementation status 2026-05-27: code landed and focused validation passed; the user accepted LOG-15 for the current scope without reopening terrain-blocker completeness before P16.

Browser automation status 2026-05-27: agent reproduced the exact drill through Charge Drill start, round/corps selection, unit `3`, target `20`, and visible charge-wheel handles for the correct charger. The exact handle-drag commit for the `Wheel` start manoeuvre was not yet completed reliably in this session; this is recorded as deferred polish, not as a blocker for closing LOG-15 in the current support scope.

Goal: close the remaining LOG-14 review blockers by making impassable terrain/setup obstacles participate in V2 hard-conflict detection and by replacing the current wheel-arc safety gap with either conservative legality checks or recorded exact-drill browser acceptance where code changes would be too large for one slice.

User direction 2026-05-27: do not continue terrain-blocker completeness work in LOG0. Any broader terrain/setup blocker modeling or source-backed terrain closure is deferred until after P16.

Planned files:

- `src/engine/charge/evade-solver.js`
- `src/engine/charge/evade.test.js`
- `src/state/p0-state.test.js` only if the reducer drill assertions need one exact terrain-aware case
- `LOGGING_todo.md`
- `roadmap.md`

Implementation steps:
1. [x] Add impassable terrain/setup-object blocker input to the V2 hard-conflict path rather than treating only units plus battlefield bounds as hard blockers.
2. [x] Keep enemies and impassable obstacles as no-overlap blockers throughout straight, slide, and any accepted wheel pattern.
3. [x] Add a conservative sampled wheel-arc blocker check for accepted V2 wheel candidates so the exact drill is not overstated as end-pose-only sweep-safe.
4. [x] Preserve conservative friendly handling; do not widen interpenetration allowances.
5. [x] Keep the bounded trace output small while adding blocker kind detail for impassable terrain when it participates in V2 conflict detection.

Non-goals:

- no full general terrain pathfinder
- no many-angle wheel search expansion
- no generic friendly interpenetration allowance
- no attempt to repair unrelated table-exit/source-open tests in the same card

Validation:

- [x] focused engine test for an impassable-terrain hard-conflict case
- [x] focused engine or reducer test showing an accepted wheel-back or slide path remains legal under the tighter blocker model
- [x] exact drill reducer validation for `unit 3 -> unit 20 -> evade -> 6 -> OK -> Wheel`, including sampled wheel-arc trace evidence
- [x] `npm run build`
- [~] browser/manual acceptance for the exact visible Wheel path deferred as non-blocking polish for the current scope
- [~] Reviewer / Rules Agent review no longer required to keep LOG-15 open; any later review can happen when post-P16 terrain work resumes

Manual acceptance:

1. Reproduce the exact browser drill path.
2. Choose `Wheel`.
3. Confirm the visible path does not cross enemies or impassable obstacles at any point.
4. Confirm the selected path shape is still plausible after the stricter blocker model lands.

Current disposition:

- Deferred. Keep these steps as future regression/polish checks rather than a gate for closing LOG-15 now.

Expected result:

- The V2 planner no longer over-claims unit-only hard-blocker coverage: hard blockers can be threaded into isolated evade solving, reducer setup obstacles are normalized into pseudo-footprints, and V2 trace evidence records blocker kind.
- LOG-14/LOG-15 are closed for the current support scope; any remaining terrain-blocker completeness work is deferred until after P16.

Next exact step:

- Return to the main phase board at `P7B-08 - Validation And Handoff` in `P7B_todo.md`.




