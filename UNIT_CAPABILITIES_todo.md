# UNIT_CAPABILITIES TODO - Unit Profiles + Capability Database

Status: Reconciled support board - current UCD0 support scope is complete for UCD-00 through UCD-04 and UCD-06; UCD-05 and the future canonical UnitDefinition/profile-table split remain deferred until after P7A2 unless the user explicitly reprioritizes support work
Planner: AdG-Rules-Engine-Agent
Preferred future executor: GPT-5.4 after user approval
Recommended review support: GPT-5.5 for the next source-sensitive canonical-definition/table expansion
Master plan: roadmap.md
Primary active dependency: P7A2_todo.md remains active; the current UCD profile spine has already been consumed by CD2/BVR support work, and no new UCD implementation slice should start until P7A2 closes or the user explicitly changes priority
Related boards: CHARGE_DRILL_2_todo.md, P7A2_todo.md, P7B_todo.md, P8 future planning, P11 Army Builder
Existing decisions: P7A-01 introduced `chargeReactionCapability` as the default reaction data path and kept `chargeReactionProfile` only as an explicit drill/test override
Source workspace: docs/rules/, docs/source/Rules_v2.md, docs/source/army-lists.md, docs/source/Ancient_Period.md, docs/source/Classic_Period.md, docs/army-builder.md
Primary source PDFs: Konzepte/Errata_ADG_V4_English.pdf, Konzepte/Rules.pdf, Konzepte/Reglettes.pdf, Konzepte/ArmyLists1-82.pdf, docs/source/new scan/Rules_Color_300DPI.pdf

## Purpose

Create a source-shaped unit capability/profile database so battlefield units behave like real unit families instead of carrying ad hoc hardcoded behavior directly on individual Charge Drill fixtures.

The immediate pressure comes from Charge Drill and P7A2 debugging, but the design must point toward the final game: a unit on the table should reference a definition/profile such as `light-infantry`, `medium-infantry`, `heavy-infantry`, `cavalry`, `cavalry-bow`, `pike`, or `elephant`; rule modules then derive movement, evade, reaction, shooting hooks, combat hooks, base profile, and render profile from shared data.

This board is not a full Army Builder. It is the smallest data spine that prevents test fixtures from drifting away from real game behavior.

## Reconciled Execution State 2026-05-26

This board is no longer a pre-implementation draft. It is the historical support board for the already implemented profile spine plus the future backlog for deeper source/catalog work.

- `src/data/unit-profiles.js` and `src/data/unit-profiles.test.js` now exist as the first representative profile spine for `light-infantry`, `medium-infantry`, `heavy-infantry`, `cavalry`, `cavalry-bow`, `pike`, and `elephant`.
- `src/data/charge-drill-scenarios.js` now assigns `profileId` to the representative Charge Drill lanes and derives default footprint, visual, and reaction-capability facts from that shared profile data.
- Charge reaction resolution and the current light-troop end-half-turn hook now read profile/default ability data first, while explicit scenario/test overrides still win.
- BVR-01/BVR-02 have already covered the render-profile bridge for the accepted current scope: visual descriptors remain inert data, battlefield tokens expose descriptor attributes, and CSS/DOM readable-base symbols stay below rule overlays.
- CD2-05 has already covered the downstream handoff for the accepted current scope: P7B/P8 planning may use the profile-backed Charge Drill anchors as smoke baselines without treating them as army-list legality.
- The remaining UCD work is source-lock closure, Army Builder compatibility, and the later move from representative profiles toward canonical `UnitDefinition` rows plus reusable profile-table modules.
- No open UCD item should block the next P7A2 regression-fix/validation work block.

## Product Invariant

Unit instances store mutable match state. Reusable rule facts live in definitions, profiles, and rule tables.

- `UnitInstance` may store current pose, owner, corps, cohesion/status, selected upgrades, and selected ability IDs.
- `UnitDefinition` / `UnitProfile` stores stable family identity, base profile, default abilities, movement profile, charge reaction capability, evade hooks, shooting hooks, combat hooks, and visual profile references.
- Engine modules ask data helpers for derived capabilities; they do not switch on scenario unit IDs.
- Charge Drill may use artificial scenario placement, but its unit behavior must come from the same profile/capability path as normal units.
- Explicit per-unit overrides are allowed only for labeled fault injection or scenario controls, with tests proving they are exceptions.

## Hardcoding Policy

Allowed:

- scenario role, label, start pose, owner, corps, and fixture placement
- explicit `scenarioOverride` or `testOverride` objects for one-off fault injection
- temporary `needs-source-check` capability placeholders when source data is genuinely incomplete

Not allowed as the normal path:

- `if unit.id === ...` rule behavior
- per-fixture `may-evade` / `must-evade` / `cannot-evade` flags when a source-shaped profile could supply the same fact
- duplicating movement, combat, or reaction tables inside every unit instance
- adding a Charge Drill lane that only works because it bypasses the data spine

## Target Data Shape

First-pass `UnitProfile` or `UnitFamilyProfile` shape:

```js
{
	id,
	label,
	troopFamily,
	baseProfileId,
	movementProfileId,
	chargeReactionCapabilityId,
	evadeProfileId,
	shootingProfileId,
	combatProfileId,
	visualProfileId,
	defaultAbilities,
	keywords,
	sourceRefs,
	verificationStatus
}
```

First-pass unit instance reference:

```js
{
	id,
	owner,
	corpsId,
	definitionId,
	profileId,
	selectedAbilityIds,
	xUd,
	yUd,
	rotationRadians,
	statusHooks
}
```

Implementation should support current flat unit fields while introducing a clear migration path. Do not force a full state-shape migration before the supported tests can pass.

## GPT-5.4 Execution Contract

GPT-5.4 should execute cards sequentially after explicit user approval.

- Before each card, give a PM block brief with exact goal, planned files, scope split, validation commands, manual acceptance steps, and non-goals.
- Keep this board data-foundational. Do not implement full P11 army-list legality.
- If a source fact is uncertain, add `verificationStatus: 'needs-source-check'` and an open verification item instead of guessing.
- Keep profile data small and representative for current phases; do not attempt all AdG unit catalog completeness in one pass.
- Do not modify charge/evade legality except to route existing behavior through profiles and tests.
- After each card, update this board, `CHARGE_DRILL_2_todo.md`, and roadmap status where relevant.

## Recommended Immediate Sequence

At the current project state:

1. Return to the active `P7A2` regression-fix/validation track.
2. Use the already implemented UCD/CD2/BVR support baseline for Charge Drill, P7B, and later P8 smoke references.
3. Keep the remaining source-sensitive blockers explicit: `unit-capabilities.light-troops-family-boundary`, `unit-capabilities.base-profile-family-catalog`, `unit-capabilities.evade-mounted-subfamily-split`, `unit-capabilities.formed-foot-family-split`, `unit-capabilities.missile-family-taxonomy`, and `unit-capabilities.special-ability-catalog`.
4. Only after `P7A2` closes should the next UCD implementation slice move toward canonical `UnitDefinition` rows and reusable profile-table modules instead of broadening the old fixture-specific data path.

This means the next UCD work is now a future source/catalog expansion slice, not a first-spine bootstrap or board-reconciliation slice.

## Non-Goals For This Board

- no full army-list import
- no points or roster legality
- no combat factor table completeness
- no full shooting implementation
- no melee/rout implementation
- no tournament-complete unit catalog claim
- no broad visual asset system beyond stable render profile references

## Execution Cards

### [x] UCD-00 - Troop Capability Taxonomy Source Review

Goal: define a minimal representative capability taxonomy that can support current charge/evade work and future CD2/P7B/P8 smoke tests.

Planned files:

- UNIT_CAPABILITIES_todo.md
- CHARGE_DRILL_2_todo.md
- roadmap.md
- docs/rules/units-and-bases.md
- docs/rules/movement.md
- docs/rules/charge.md
- docs/rules/shooting.md
- docs/rules/open-verification.md
- docs/source/Rules_v2.md
- docs/source/army-lists.md
- docs/source/Ancient_Period.md
- docs/source/Classic_Period.md
- docs/army-builder.md

Implementation steps:
1. Re-check rules/source notes for troop families that materially affect movement, charge reaction, evade, shooting hooks, conformation hooks, and base shape.
2. Define the first supported profiles: `light-infantry`, `medium-infantry`, `heavy-infantry`, `cavalry`, `cavalry-bow`, `pike`, `elephant`, plus any already source-readable family needed by current fixtures.
3. For each profile, record base footprint defaults, movement profile placeholder, charge reaction capability, evade hooks, shooting hooks, visual profile, and source verification status.
4. Mark exact unknowns as open verification items; do not overclaim full troop taxonomy.
5. Ask GPT-5.5 to review the taxonomy before code if available.

Non-goals:

- no code
- no full unit catalog
- no army-list legality

Validation:

- Markdown/docs review.
- GPT-5.5 review returns no blocker for the representative taxonomy.

Manual acceptance:

- User confirms the first supported profiles and priority order.

Stop condition:

- Stop if a currently needed profile cannot be source-checked enough to avoid misleading tests.

Expected result: GPT-5.4 has a source-shaped profile matrix before editing fixture code.

Progress 2026-05-25:

- Re-checked the current source-locked movement and charge docs, the Army Builder data boundary, and current Charge Drill hardcoding. The immediate representative subset is valid as a profile-planning surface, but not as a tournament-complete troop taxonomy.
- Current working rule anchors are: `docs/rules/charge.md` for `may/must/cannot/blocked evade`, adjusted distance, light-troop end-half-turn hook, and missile-capable cavalry exceptions; `docs/rules/movement.md` for movement-family and manoeuvre hooks; `docs/rules/units-and-bases.md` plus `docs/army-builder.md` for the `UnitDefinition` / `BaseProfile` / `UnitInstance` split.
- Shooting/profile-anchor check for this slice is intentionally narrow: `docs/rules/shooting.md` is used only to justify that missile troops and special mounted shooting families need distinct future shooting hooks, not to claim a closed mounted movement taxonomy or a finished shooting catalog.
- Representative period-source evidence was checked at the label/family level only: `docs/source/Ancient_Period.md` and `docs/source/Classic_Period.md` already expose readable anchors such as light infantry bow, light infantry javelin, light cavalry bow, bowmen, and heavier formed-foot families, which is enough to justify the representative profile names for UCD-00 without turning this slice into an army-list import pass.
- Current Charge Drill evidence confirms the need for this slice: `src/data/charge-drill-scenarios.js` still hardcodes `troopType`, `baseShape`, and ad hoc `chargeReactionCapability` values on fixture units instead of routing normal behavior through shared profiles.

Taxonomy expansion note after user review 2026-05-25:

- The current seven-profile subset is acceptable only as a first representative drill spine. It is not a sufficient long-term unit taxonomy.
- The long-term model should not explode directly into one flat profile ID per printed troop string. It should separate at least these rule-relevant axes:
	1. movement/base family
	2. troop family identity
	3. weapon or missile package
	4. protection and quality
	5. special abilities
- `medium infantry` and `heavy infantry` remain important generic anchors because movement and some base/mobility hooks attach at that level even before weapon/package distinctions are added.
- Weapon/package distinctions such as `medium swordsmen`, `medium spearmen`, `heavy swordsmen`, `heavy spearmen`, `javelinmen`, `bowmen`, `crossbowmen`, `handgunners`, `light cavalry bow`, `light cavalry javelin`, `light cavalry impact`, `light camelry`, `medium camelry`, `cataphracts`, `knights`, `war wagons`, and artillery grades should be modeled as explicit family rows or capability bundles only where the rules/supporting sources justify distinct behavior.

Working long-term taxonomy layers for UCD planning:

| Layer | Purpose | Current planning direction |
| --- | --- | --- |
| `baseProfileId` | legal width/depth/shape | keep shared and source-checked; do not duplicate in roster or UI |
| `movementProfileId` | movement allowance and manoeuvre family | attach generic MI/HI/LI/LH/Cv/Ct/Kn/Art/WWg hooks here instead of burying them in render labels |
| `troopFamilyId` | stable family identity used by charge, shooting, melee, and roster mapping | allow rows such as `javelinmen`, `bowmen`, `medium-swordsmen`, `heavy-spearmen`, `pikemen`, `war-wagons`, `artillery-light`, `artillery-medium`, `artillery-heavy` |
| `missileProfileId` | range, shot zone, target rules, special missile handling | keep `bow`, `crossbow`, `handgun`, `sling`, `javelin`, artillery, and wagon fire as explicit rule hooks rather than UI-only tags |
| `protectionProfileId` | armour / heavy armour and similar protection facts | separate from troop family so one family can vary by protection where sources allow |
| `quality/defaultCohesion` | elite / ordinary / mediocre and related defaults | treat as stable unit-definition facts, not as render hints |
| `abilityIds` | special rules layered over family/package | hold `impact`, `impetuous`, `furious-charge`, `two-handed-weapon`, `polearm`, `pavise`, `stakes`, `expendables`, `missile-support`, `mixed-units`, `panic`, `incendiary`, etc. |

Canonical ID matrix draft for long-term UCD planning:

This is a planning namespace proposal, not a claim that every row is already source-closed or implementation-ready.

Recommended ID families:

| Namespace | Purpose | Naming rule | Example IDs |
| --- | --- | --- | --- |
| `baseProfileId` | legal footprint family | `bp-*` | `bp-foot-light`, `bp-foot-formed`, `bp-foot-deep`, `bp-mounted-light`, `bp-mounted-formed`, `bp-elephant`, `bp-artillery-heavy`, `bp-war-wagon` |
| `movementProfileId` | movement allowance and manoeuvre family | `mp-*` | `mp-light-foot`, `mp-light-medium-foot`, `mp-medium-foot`, `mp-heavy-foot`, `mp-pike-foot`, `mp-light-mounted`, `mp-formed-mounted`, `mp-camelry-light`, `mp-camelry-formed`, `mp-cataphract`, `mp-knight`, `mp-light-chariot`, `mp-scythed-chariot`, `mp-elephant`, `mp-war-wagon`, `mp-artillery-light`, `mp-artillery-medium`, `mp-artillery-heavy` |
| `troopFamilyId` | stable troop identity | `tf-*` | `tf-light-infantry`, `tf-javelinmen`, `tf-bowmen`, `tf-crossbowmen`, `tf-handgunners`, `tf-medium-swordsmen`, `tf-medium-spearmen`, `tf-heavy-swordsmen`, `tf-heavy-spearmen`, `tf-foot-knights`, `tf-pikemen`, `tf-levy`, `tf-light-cavalry`, `tf-cavalry`, `tf-camelry-light`, `tf-camelry-medium`, `tf-cataphracts`, `tf-knights`, `tf-light-chariots`, `tf-scythed-chariots`, `tf-elephants`, `tf-war-wagons`, `tf-artillery` |
| `missileProfileId` | missile weapon/range/support package | `msp-*` | `msp-none`, `msp-javelin`, `msp-sling`, `msp-bow`, `msp-crossbow`, `msp-handgun`, `msp-mounted-bow`, `msp-mounted-crossbow`, `msp-light-chariot-bow`, `msp-light-chariot-javelin`, `msp-war-wagon`, `msp-artillery-light`, `msp-artillery-medium`, `msp-artillery-heavy` |
| `protectionProfileId` | protection tier | `pp-*` | `pp-none`, `pp-armour`, `pp-heavy-armour`, `pp-pavise` |
| `qualityProfileId` | stable quality/default baseline | `qp-*` | `qp-mediocre`, `qp-ordinary`, `qp-elite` |
| `abilityId` | layered special rules | `ab-*` | `ab-impact`, `ab-impetuous`, `ab-furious-charge`, `ab-two-handed-weapon`, `ab-polearm`, `ab-light-troops`, `ab-panic`, `ab-incendiary`, `ab-stakes`, `ab-expendables`, `ab-missile-support`, `ab-mixed-units` |

Recommended first canonical rows by axis:

| User-facing family | `troopFamilyId` | Baseline `movementProfileId` | Baseline `missileProfileId` | Common layered notes |
| --- | --- | --- | --- | --- |
| Light infantry bow | `tf-light-infantry` | `mp-light-foot` | `msp-bow` | often also `ab-light-troops` |
| Light infantry sling | `tf-light-infantry` | `mp-light-foot` | `msp-sling` | often also `ab-light-troops` |
| Light infantry javelin | `tf-light-infantry` | `mp-light-foot` | `msp-javelin` | often also `ab-light-troops` |
| Javelinmen | `tf-javelinmen` | `mp-light-medium-foot` | `msp-javelin` | distinct from LI; exact family boundary remains source-open |
| Bowmen | `tf-bowmen` | `mp-light-medium-foot` | `msp-bow` | formed or semi-formed missile foot anchor |
| Crossbowmen | `tf-crossbowmen` | `mp-light-medium-foot` | `msp-crossbow` | keep separate from generic bow hook |
| Handgunners | `tf-handgunners` | `mp-light-medium-foot` | `msp-handgun` | later-period explicit shooting family |
| Medium infantry baseline | `tf-medium-infantry` | `mp-medium-foot` | `msp-none` | movement/control anchor only |
| Medium swordsmen | `tf-medium-swordsmen` | `mp-medium-foot` | `msp-none` | may later add `ab-two-handed-weapon` or similar |
| Medium spearmen | `tf-medium-spearmen` | `mp-medium-foot` | `msp-none` | contact/combat split from swordsmen |
| Heavy infantry baseline | `tf-heavy-infantry` | `mp-heavy-foot` | `msp-none` | movement/control anchor only |
| Heavy swordsmen | `tf-heavy-swordsmen` | `mp-heavy-foot` | `msp-none` | may later layer armour/2HW/etc. |
| Heavy spearmen | `tf-heavy-spearmen` | `mp-heavy-foot` | `msp-none` | separate from heavy swordsmen |
| Foot knights | `tf-foot-knights` | `mp-heavy-foot` | `msp-none` | distinct formed heavy foot family |
| Pikemen | `tf-pikemen` | `mp-pike-foot` | `msp-none` | separate deep-foot family |
| Levy | `tf-levy` | `mp-light-medium-foot` | `msp-none` | family-specific morale/combat implications later |
| Light cavalry bow | `tf-light-cavalry` | `mp-light-mounted` | `msp-mounted-bow` | mounted evade-capable light family |
| Light cavalry javelin | `tf-light-cavalry` | `mp-light-mounted` | `msp-javelin` | same family, different missile package |
| Light cavalry lance/impact | `tf-light-cavalry` | `mp-light-mounted` | `msp-none` | likely layered `ab-impact` |
| Light camelry bow | `tf-camelry-light` | `mp-camelry-light` | `msp-mounted-bow` | later camel panic interactions |
| Light camelry javelin | `tf-camelry-light` | `mp-camelry-light` | `msp-javelin` | same family, different package |
| Medium cavalry | `tf-cavalry` | `mp-formed-mounted` | `msp-none` | protection/impact handled separately |
| Medium cavalry bow | `tf-cavalry` | `mp-formed-mounted` | `msp-mounted-bow` | same family, different missile package |
| Heavy cavalry | `tf-cavalry` | `mp-formed-mounted` | `msp-none` | protection tier likely differs |
| Medium camelry | `tf-camelry-medium` | `mp-camelry-formed` | `msp-none` | keep camelry separate from horse cavalry |
| Cataphracts | `tf-cataphracts` | `mp-cataphract` | `msp-none` | maneuver and protection exceptions justify own family |
| Knights medium | `tf-knights` | `mp-knight` | `msp-none` | quality/protection split above same family |
| Knights heavy | `tf-knights` | `mp-knight` | `msp-none` | quality/protection split above same family |
| Light chariots bow | `tf-light-chariots` | `mp-light-chariot` | `msp-light-chariot-bow` | family-specific movement rules |
| Light chariots javelin | `tf-light-chariots` | `mp-light-chariot` | `msp-light-chariot-javelin` | same family, different package |
| Scythed chariots | `tf-scythed-chariots` | `mp-scythed-chariot` | `msp-none` | unique special-move family |
| Elephants | `tf-elephants` | `mp-elephant` | `msp-none` | panic/contact special family |
| War wagons | `tf-war-wagons` | `mp-war-wagon` | `msp-war-wagon` | own movement/shooting/conformation anchor |
| Artillery light | `tf-artillery` | `mp-artillery-light` | `msp-artillery-light` | same troop family, graded movement/shooting profile |
| Artillery medium | `tf-artillery` | `mp-artillery-medium` | `msp-artillery-medium` | same troop family, graded profile |
| Artillery heavy | `tf-artillery` | `mp-artillery-heavy` | `msp-artillery-heavy` | same troop family, graded profile |

Working ID design rules:

- Keep `troopFamilyId` stable and relatively coarse; do not create a new troop family just because a unit gains one optional upgrade.
- Put weapon-package differences in `missileProfileId` where shooting geometry or missile legality changes.
- Put movement differences in `movementProfileId` even when two units look similar visually.
- Put armour, heavy armour, pavise, elite, and mediocre outside the troop-family string so one list entry can vary without cloning the whole family record.
- Use `abilityIds` for explicit rule hooks, not for every ordinary family distinction already captured by troop/movement/missile/protection profiles.
- When a printed list combines `1/2` troop types into one actual mixed unit, model that as a structural unit-definition flag such as `ab-mixed-units` plus explicit component references later, not as a render-only note.

Target UnitDefinition schema sketch after split review:

The long-term catalog should aim at a `UnitDefinition` shape that keeps family identity, movement identity, missile identity, protection, quality, and special abilities separate.

Planning sketch:

```js
{
	id: 'ud-thureophoroi',
	label: 'Thureophoroi',
	troopFamilyId: 'tf-medium-spearmen',
	baseProfileId: 'bp-foot-formed',
	movementProfileId: 'mp-medium-foot',
	missileProfileId: 'msp-none',
	protectionProfileId: 'pp-armour',
	qualityProfileId: 'qp-ordinary',
	defaultCohesionProfileId: 'coh-ordinary-foot',
	abilityIds: [],
	visualProfileId: 'vp-medium-foot',
	keywords: ['formed-foot', 'spearmen'],
	componentProfiles: [],
	sourceRefs: ['docs/source/Classic_Period.md'],
	verificationStatus: 'needs-source-check'
}
```

Recommended field intent:

| Field | Meaning | Why it stays separate |
| --- | --- | --- |
| `troopFamilyId` | stable troop identity such as `tf-medium-spearmen` or `tf-light-cavalry` | roster/import and combat identity should not be inferred from movement or art |
| `baseProfileId` | legal footprint family | legality geometry must stay render-independent |
| `movementProfileId` | movement allowance and manoeuvre family | MI/HI/LH/Cv/Ct/WWg/Art exceptions belong here |
| `missileProfileId` | missile weapon package | shooting zone/range/support logic belongs here |
| `protectionProfileId` | armour/heavy armour/pavise-like protection tier | protection should not clone whole troop families |
| `qualityProfileId` | elite/ordinary/mediocre baseline | quality is a stable catalog fact, not a free-text note |
| `defaultCohesionProfileId` | later cohesion baseline hook | keep future cohesion tables out of troop-name parsing |
| `abilityIds` | explicit special rules | impact, impetuous, two-handed weapon, missile support, mixed units, etc. |
| `visualProfileId` | render hint only | UI consumes it without owning legality |
| `componentProfiles` | true mixed-formation support | needed for units that are structurally `1/2` plus `1/2`, not just upgraded |

Planning examples derived from the current matrix:

```js
{
	id: 'ud-light-infantry-bow',
	troopFamilyId: 'tf-light-infantry',
	baseProfileId: 'bp-foot-light',
	movementProfileId: 'mp-light-foot',
	missileProfileId: 'msp-bow',
	protectionProfileId: 'pp-none',
	qualityProfileId: 'qp-ordinary',
	abilityIds: ['ab-light-troops'],
	visualProfileId: 'vp-light-foot'
}

{
	id: 'ud-light-cavalry-javelin',
	troopFamilyId: 'tf-light-cavalry',
	baseProfileId: 'bp-mounted-light',
	movementProfileId: 'mp-light-mounted',
	missileProfileId: 'msp-javelin',
	protectionProfileId: 'pp-none',
	qualityProfileId: 'qp-ordinary',
	abilityIds: [],
	visualProfileId: 'vp-cavalry'
}

{
	id: 'ud-galatian-heavy-swordsmen',
	troopFamilyId: 'tf-heavy-swordsmen',
	baseProfileId: 'bp-foot-formed',
	movementProfileId: 'mp-heavy-foot',
	missileProfileId: 'msp-none',
	protectionProfileId: 'pp-none',
	qualityProfileId: 'qp-ordinary',
	abilityIds: ['ab-impetuous'],
	visualProfileId: 'vp-heavy-foot'
}

{
	id: 'ud-war-wagon',
	troopFamilyId: 'tf-war-wagons',
	baseProfileId: 'bp-war-wagon',
	movementProfileId: 'mp-war-wagon',
	missileProfileId: 'msp-war-wagon',
	protectionProfileId: 'pp-none',
	qualityProfileId: 'qp-ordinary',
	abilityIds: [],
	visualProfileId: 'vp-war-wagon'
}

{
	id: 'ud-archers-with-light-spear-and-pavise',
	troopFamilyId: 'tf-bowmen',
	baseProfileId: 'bp-foot-formed',
	movementProfileId: 'mp-light-medium-foot',
	missileProfileId: 'msp-bow',
	protectionProfileId: 'pp-pavise',
	qualityProfileId: 'qp-ordinary',
	abilityIds: ['ab-mixed-units'],
	componentProfiles: [
		{ troopFamilyId: 'tf-medium-swordsmen', ratio: '1/2' },
		{ troopFamilyId: 'tf-bowmen', ratio: '1/2' }
	],
	visualProfileId: 'vp-medium-foot'
}
```

Schema rules for later implementation:

- A `UnitDefinition` should never need free-text parsing such as `if label includes bow` to derive rule behavior.
- Army-list imports should map printed rows and upgrades into this schema by setting IDs and overlays, not by inventing new one-off code paths.
- Upgrades such as `elite`, `add armour`, `add impact`, or `add pavise` should usually modify `qualityProfileId`, `protectionProfileId`, or `abilityIds`, not replace the entire base family.
- Replacement rows should usually swap `troopFamilyId` and related profiles while preserving list-slot bookkeeping in roster data.
- `componentProfiles` should only be used for true mixed formations, not for every row that merely offers multiple alternatives in one shared army-list slot.

First canonical starter catalog draft:

This is the first small working set that would be large enough to support meaningful future implementation and small enough to stay reviewable. It is still planning-only.

Recommended first tranche size:

- `12-20` `UnitDefinition` rows, not the full game catalog.
- Cover one anchor from each major rule-relevant bucket: light foot, formed foot, deep foot, mounted light, mounted formed, camelry, elephant, war wagon/artillery, and one mixed unit.

Proposed first canonical starter rows:

| Definition ID | Label | Core IDs | Why this row belongs in tranche one | Source posture |
| --- | --- | --- | --- | --- |
| `ud-light-infantry-bow` | Light Infantry Bow | `tf-light-infantry` / `mp-light-foot` / `msp-bow` | baseline LI missile and light-troop anchor | supported representative anchor |
| `ud-light-infantry-sling` | Light Infantry Sling | `tf-light-infantry` / `mp-light-foot` / `msp-sling` | distinct missile package without changing family | supported representative anchor |
| `ud-light-infantry-javelin` | Light Infantry Javelin | `tf-light-infantry` / `mp-light-foot` / `msp-javelin` | charge/evade boundary anchor for LI variants | supported representative anchor |
| `ud-javelinmen` | Javelinmen | `tf-javelinmen` / `mp-light-medium-foot` / `msp-javelin` | distinct from LI and already explicit in lists and charge planning | supported as separate family, some rule hooks open |
| `ud-bowmen` | Bowmen | `tf-bowmen` / `mp-light-medium-foot` / `msp-bow` | formed/semi-formed missile foot anchor | supported as separate family |
| `ud-medium-swordsmen` | Medium Swordsmen | `tf-medium-swordsmen` / `mp-medium-foot` / `msp-none` | formed-foot combat-family anchor | supported as separate family |
| `ud-medium-spearmen` | Medium Spearmen | `tf-medium-spearmen` / `mp-medium-foot` / `msp-none` | formed-foot combat-family anchor distinct from swordsmen | supported as separate family |
| `ud-heavy-swordsmen` | Heavy Swordsmen | `tf-heavy-swordsmen` / `mp-heavy-foot` / `msp-none` | heavy-foot combat-family anchor | supported as separate family |
| `ud-heavy-spearmen` | Heavy Spearmen | `tf-heavy-spearmen` / `mp-heavy-foot` / `msp-none` | hoplite/spear heavy-foot anchor | supported as separate family |
| `ud-pikemen` | Pikemen | `tf-pikemen` / `mp-pike-foot` / `msp-none` | deep-foot movement and contact anchor | supported as separate family |
| `ud-levy` | Levy | `tf-levy` / `mp-light-medium-foot` / `msp-none` | rout/pursuit and roster-distinct low-grade family | supported as separate family |
| `ud-light-cavalry-bow` | Light Cavalry Bow | `tf-light-cavalry` / `mp-light-mounted` / `msp-mounted-bow` | mounted evade/missile anchor | supported as separate family |
| `ud-light-cavalry-javelin` | Light Cavalry Javelin | `tf-light-cavalry` / `mp-light-mounted` / `msp-javelin` | mounted light skirmish split from bow | supported as separate family |
| `ud-medium-cavalry` | Medium Cavalry | `tf-cavalry` / `mp-formed-mounted` / `msp-none` | formed cavalry baseline anchor | supported as representative family |
| `ud-medium-cavalry-bow` | Medium Cavalry Bow | `tf-cavalry` / `mp-formed-mounted` / `msp-mounted-bow` | mounted missile split without changing broad cavalry family | supported as separate list anchor |
| `ud-light-camelry-bow` | Light Camelry Bow | `tf-camelry-light` / `mp-camelry-light` / `msp-mounted-bow` | camel panic and light mounted split anchor | supported as separate family |
| `ud-cataphracts` | Cataphracts | `tf-cataphracts` / `mp-cataphract` / `msp-none` | movement-exception family explicitly named by movement source lock | rule-doc anchored, list catalog still broader-open |
| `ud-scythed-chariot` | Scythed Chariot | `tf-scythed-chariots` / `mp-scythed-chariot` / `msp-none` | special move/rout/contact family | supported as separate family |
| `ud-elephant` | Elephant | `tf-elephants` / `mp-elephant` / `msp-none` | panic/contact/rout special family | supported as separate family |
| `ud-heavy-artillery` | Heavy Artillery | `tf-artillery` / `mp-artillery-heavy` / `msp-artillery-heavy` | movement/shooting/conformation exception anchor | strongly source-anchored |

Optional tranche-one-plus rows if the first set proves too narrow:

- `ud-crossbowmen`
- `ud-handgunners`
- `ud-foot-knights`
- `ud-war-wagon`
- `ud-medium-camelry`
- `ud-mixed-medium-swordsmen-bowmen`

Why these stay optional for the first code slice:

- They are important long-term, but the initial data spine can already prove the axis model with the twenty rows above.
- `crossbowmen`, `handgunners`, and `war wagons` especially need later shooting/combat ordering work to avoid pretending their full rules are already closed.
- `foot knights` and some mixed-unit forms benefit from the same schema, but they need less pressure than the anchor rows above for the first implementation pass.

Recommended implementation order when the board moves from planning to code:

1. light-foot trio: bow, sling, javelin
2. formed-foot core: javelinmen, bowmen, medium swordsmen, medium spearmen, heavy swordsmen, heavy spearmen
3. deep/special foot: pikemen, levy
4. mounted core: light cavalry bow, light cavalry javelin, medium cavalry, medium cavalry bow
5. special movers: light camelry bow, cataphracts, scythed chariot, elephant, heavy artillery

Expected payoff of this starter catalog:

- enough rows to stop future phases from falling back to `generic infantry` and `generic cavalry`
- enough variation to prove that the axis model really handles foot/mounted/missile/protection/ability separation
- still small enough that every row can carry explicit `sourceRefs` and `verificationStatus` without becoming a stealth army-list import

Starter profile tables draft for tranche one:

These are planning starter tables only. They define what each profile namespace is supposed to mean before any implementation data file is created.

Starter `movementProfile` table:

| ID | Intended family scope | Planning meaning | Current source posture |
| --- | --- | --- | --- |
| `mp-light-foot` | LI and close light troops | loose-foot movement anchor; light-troop turn/evade hooks stay ability-gated | source-backed planning anchor |
| `mp-light-medium-foot` | javelinmen, bowmen, crossbowmen, handgunners, levy-like lighter formed foot | lighter foot family that is not simply LI and not full MI/HI | planning anchor; exact allowance split still open |
| `mp-medium-foot` | medium spearmen / medium swordsmen / generic MI | formed medium-foot movement anchor | source-backed planning anchor |
| `mp-heavy-foot` | heavy spearmen / heavy swordsmen / generic HI / foot knights | formed heavy-foot movement anchor; current heavy-in-open and charge-adjust anchor | source-backed planning anchor |
| `mp-pike-foot` | pikemen | deep-foot exception family | source-backed planning anchor |
| `mp-light-mounted` | LH and similar light mounted | light mounted evade/mobility anchor | source-backed planning anchor |
| `mp-formed-mounted` | medium/heavy cavalry baseline | formed cavalry movement anchor | planning anchor; exact mounted split still open |
| `mp-camelry-light` | light camelry | light camel mounted anchor | planning anchor with open source details |
| `mp-camelry-formed` | medium camelry | formed camel mounted anchor | planning anchor with open source details |
| `mp-cataphract` | cataphracts | heavy maneuver-restricted mounted exception family | rule-doc anchored |
| `mp-knight` | knights | formed knight family, likely ability/protection-driven above movement | planning anchor with open source details |
| `mp-light-chariot` | light chariots | light chariot movement/shooting family | source-backed planning anchor |
| `mp-scythed-chariot` | scythed chariots | special simple-move family | rule-doc anchored |
| `mp-elephant` | elephants | elephant movement family | planning anchor |
| `mp-war-wagon` | war wagons | `45 degrees` wheel and exception-layer movement family | rule-doc anchored |
| `mp-artillery-heavy` | heavy artillery | artillery move/shoot exception family | rule-doc anchored |

Starter `baseProfile` table:

| ID | Intended family scope | Planning meaning | Current source posture |
| --- | --- | --- | --- |
| `bp-foot-light` | LI and similarly shallow light foot | light-foot legal footprint anchor | planning anchor; exact catalog still open |
| `bp-foot-formed` | most formed MI/HI foot | standard formed-foot legal footprint anchor | planning anchor; exact catalog still open |
| `bp-foot-deep` | pikemen and other deep-foot cases | deep-foot legal footprint anchor | planning anchor; exact catalog still open |
| `bp-mounted-light` | LH and light camelry | lighter mounted legal footprint anchor | planning anchor; exact catalog still open |
| `bp-mounted-formed` | formed cavalry and similar mounted | formed mounted legal footprint anchor | planning anchor; exact catalog still open |
| `bp-elephant` | elephants | elephant legal footprint anchor | planning anchor; exact catalog still open |
| `bp-war-wagon` | war wagons | wagon legal footprint anchor | rule-significant family; exact size still open |
| `bp-artillery-heavy` | heavy artillery | heavy-artillery legal footprint anchor | rule-significant family; exact size still open |

Starter `missileProfile` table:

| ID | Intended family scope | Planning meaning | Current source posture |
| --- | --- | --- | --- |
| `msp-none` | non-shooting baseline | no shooting package | safe baseline |
| `msp-javelin` | LI javelin, javelinmen, LH javelin, some camelry/chariots | javelin-capable missile hook | source-backed planning anchor |
| `msp-sling` | LI sling families | sling-capable missile hook | source-backed planning anchor |
| `msp-bow` | bowmen and LI bow | foot bow package | source-backed planning anchor |
| `msp-crossbow` | crossbow families | foot crossbow package | rule-doc anchored; catalog examples later-period/open |
| `msp-handgun` | handgunner families | firearm package | rule-doc anchored; catalog examples later-period/open |
| `msp-mounted-bow` | LH bow, medium cavalry bow, some camelry bow | mounted missile package | source-backed planning anchor |
| `msp-mounted-crossbow` | mounted crossbow families if needed later | mounted crossbow package | future/open |
| `msp-light-chariot-bow` | light chariots bow | chariot missile package with special shooting zone | source-backed planning anchor |
| `msp-light-chariot-javelin` | light chariots javelin | chariot javelin package | source-backed planning anchor |
| `msp-war-wagon` | war wagons | wagon shooting package | rule-doc anchored |
| `msp-artillery-heavy` | heavy artillery | heavy artillery range/eligibility package | rule-doc anchored |

Starter `protectionProfile` table:

| ID | Planning meaning | Typical use |
| --- | --- | --- |
| `pp-none` | no special protection baseline | most LI, javelinmen, many swordsmen |
| `pp-armour` | armour-tier protection | armoured spearmen, some heavy swordsmen, some cavalry |
| `pp-heavy-armour` | heavier protection tier | cataphracts, heavy knights, some elite heavy families |
| `pp-pavise` | pavise-like protection state | pavise bowmen or spear-supported archers |

Starter `qualityProfile` table:

| ID | Planning meaning | Typical use |
| --- | --- | --- |
| `qp-mediocre` | lower-grade baseline | mediocre levy, mediocre pikes, downgraded missile or cavalry rows |
| `qp-ordinary` | default baseline | most core army-list rows |
| `qp-elite` | higher-grade baseline | hypaspists, elite guards, elite cavalry options |

Starter `cohesionProfile` table:

| ID | Intended family scope | Planning meaning |
| --- | --- | --- |
| `coh-light-foot` | LI and similar loose light troops | light-foot cohesion baseline placeholder for later rule tables |
| `coh-light-medium-foot` | javelinmen, bowmen, lighter formed foot, levy-like families | lighter formed-foot cohesion baseline placeholder |
| `coh-medium-foot` | medium spearmen / medium swordsmen | medium formed-foot cohesion baseline placeholder |
| `coh-heavy-foot` | heavy spearmen / heavy swordsmen / foot knights | heavy formed-foot cohesion baseline placeholder |
| `coh-pike-foot` | pikemen | deep-foot cohesion baseline placeholder |
| `coh-light-mounted` | LH and light camelry | light mounted cohesion baseline placeholder |
| `coh-formed-mounted` | formed cavalry | formed mounted cohesion baseline placeholder |
| `coh-elephant` | elephants | elephant cohesion baseline placeholder |
| `coh-artillery` | artillery | artillery cohesion baseline placeholder |

Starter table design rules:

- `movementProfile` should describe movement-family behavior only. It should not smuggle missile or armour meaning into the movement row name.
- `baseProfile` should describe legal footprint family only. It should not silently encode movement, quality, or weapon package.
- `missileProfile` should describe shooting package only. It should not decide whether a unit is light troops, impact, or impetuous.
- `protectionProfile` and `qualityProfile` should stay small and reusable so upgrades can switch them without cloning entire `UnitDefinition` rows.
- `cohesionProfile` is a placeholder join point for later combat/rout tables, not a freeform note field on each definition.
- If a future row differs only by ability overlay, reuse the same family and profile IDs and change `abilityIds` only.
- If a future row differs by both movement and missile behavior, prefer two profile references over inventing a new opaque troop-family string.

Worked example `UnitDefinition` starter records:

These examples are the first planning-grade records that show how the schema, starter catalog, and starter profile tables fit together. They are still not implementation data.

```js
export const STARTER_UNIT_DEFINITION_EXAMPLES = [
	{
		id: 'ud-light-infantry-bow',
		label: 'Light Infantry Bow',
		troopFamilyId: 'tf-light-infantry',
		baseProfileId: 'bp-foot-light',
		movementProfileId: 'mp-light-foot',
		missileProfileId: 'msp-bow',
		protectionProfileId: 'pp-none',
		qualityProfileId: 'qp-ordinary',
		defaultCohesionProfileId: 'coh-light-foot',
		abilityIds: ['ab-light-troops'],
		visualProfileId: 'vp-light-foot',
		keywords: ['light-foot', 'bow'],
		componentProfiles: [],
		sourceRefs: ['docs/source/Classic_Period.md'],
		verificationStatus: 'needs-source-check',
	},
	{
		id: 'ud-javelinmen',
		label: 'Javelinmen',
		troopFamilyId: 'tf-javelinmen',
		baseProfileId: 'bp-foot-light',
		movementProfileId: 'mp-light-medium-foot',
		missileProfileId: 'msp-javelin',
		protectionProfileId: 'pp-none',
		qualityProfileId: 'qp-ordinary',
		defaultCohesionProfileId: 'coh-light-medium-foot',
		abilityIds: [],
		visualProfileId: 'vp-light-foot',
		keywords: ['javelinmen', 'missile-foot'],
		componentProfiles: [],
		sourceRefs: ['docs/source/Classic_Period.md', 'docs/source/Ancient_Period.md'],
		verificationStatus: 'needs-source-check',
	},
	{
		id: 'ud-medium-spearmen',
		label: 'Medium Spearmen',
		troopFamilyId: 'tf-medium-spearmen',
		baseProfileId: 'bp-foot-formed',
		movementProfileId: 'mp-medium-foot',
		missileProfileId: 'msp-none',
		protectionProfileId: 'pp-none',
		qualityProfileId: 'qp-ordinary',
		defaultCohesionProfileId: 'coh-medium-foot',
		abilityIds: [],
		visualProfileId: 'vp-medium-foot',
		keywords: ['formed-foot', 'spearmen'],
		componentProfiles: [],
		sourceRefs: ['docs/source/Classic_Period.md', 'docs/source/Ancient_Period.md'],
		verificationStatus: 'needs-source-check',
	},
	{
		id: 'ud-heavy-spearmen',
		label: 'Heavy Spearmen',
		troopFamilyId: 'tf-heavy-spearmen',
		baseProfileId: 'bp-foot-formed',
		movementProfileId: 'mp-heavy-foot',
		missileProfileId: 'msp-none',
		protectionProfileId: 'pp-armour',
		qualityProfileId: 'qp-ordinary',
		defaultCohesionProfileId: 'coh-heavy-foot',
		abilityIds: [],
		visualProfileId: 'vp-heavy-foot',
		keywords: ['formed-foot', 'heavy-foot', 'spearmen'],
		componentProfiles: [],
		sourceRefs: ['docs/source/Classic_Period.md', 'docs/source/Ancient_Period.md'],
		verificationStatus: 'needs-source-check',
	},
	{
		id: 'ud-pikemen',
		label: 'Pikemen',
		troopFamilyId: 'tf-pikemen',
		baseProfileId: 'bp-foot-deep',
		movementProfileId: 'mp-pike-foot',
		missileProfileId: 'msp-none',
		protectionProfileId: 'pp-none',
		qualityProfileId: 'qp-ordinary',
		defaultCohesionProfileId: 'coh-pike-foot',
		abilityIds: [],
		visualProfileId: 'vp-pike',
		keywords: ['deep-foot', 'pike'],
		componentProfiles: [],
		sourceRefs: ['docs/source/Classic_Period.md'],
		verificationStatus: 'needs-source-check',
	},
	{
		id: 'ud-light-cavalry-javelin',
		label: 'Light Cavalry Javelin',
		troopFamilyId: 'tf-light-cavalry',
		baseProfileId: 'bp-mounted-light',
		movementProfileId: 'mp-light-mounted',
		missileProfileId: 'msp-javelin',
		protectionProfileId: 'pp-none',
		qualityProfileId: 'qp-ordinary',
		defaultCohesionProfileId: 'coh-light-mounted',
		abilityIds: [],
		visualProfileId: 'vp-cavalry',
		keywords: ['light-mounted', 'javelin'],
		componentProfiles: [],
		sourceRefs: ['docs/source/Classic_Period.md'],
		verificationStatus: 'needs-source-check',
	},
	{
		id: 'ud-medium-cavalry-bow',
		label: 'Medium Cavalry Bow',
		troopFamilyId: 'tf-cavalry',
		baseProfileId: 'bp-mounted-formed',
		movementProfileId: 'mp-formed-mounted',
		missileProfileId: 'msp-mounted-bow',
		protectionProfileId: 'pp-none',
		qualityProfileId: 'qp-ordinary',
		defaultCohesionProfileId: 'coh-formed-mounted',
		abilityIds: [],
		visualProfileId: 'vp-cavalry-bow',
		keywords: ['formed-mounted', 'bow'],
		componentProfiles: [],
		sourceRefs: ['docs/source/Ancient_Period.md'],
		verificationStatus: 'needs-source-check',
	},
	{
		id: 'ud-light-camelry-bow',
		label: 'Light Camelry Bow',
		troopFamilyId: 'tf-camelry-light',
		baseProfileId: 'bp-mounted-light',
		movementProfileId: 'mp-camelry-light',
		missileProfileId: 'msp-mounted-bow',
		protectionProfileId: 'pp-none',
		qualityProfileId: 'qp-mediocre',
		defaultCohesionProfileId: 'coh-light-mounted',
		abilityIds: ['ab-panic'],
		visualProfileId: 'vp-cavalry-bow',
		keywords: ['camelry', 'light-mounted', 'bow'],
		componentProfiles: [],
		sourceRefs: ['docs/source/Classic_Period.md', 'docs/source/Ancient_Period.md'],
		verificationStatus: 'needs-source-check',
	},
	{
		id: 'ud-elephant',
		label: 'Elephant',
		troopFamilyId: 'tf-elephants',
		baseProfileId: 'bp-elephant',
		movementProfileId: 'mp-elephant',
		missileProfileId: 'msp-none',
		protectionProfileId: 'pp-none',
		qualityProfileId: 'qp-ordinary',
		defaultCohesionProfileId: 'coh-elephant',
		abilityIds: ['ab-panic'],
		visualProfileId: 'vp-elephant',
		keywords: ['elephant'],
		componentProfiles: [],
		sourceRefs: ['docs/source/Classic_Period.md'],
		verificationStatus: 'needs-source-check',
	},
	{
		id: 'ud-heavy-artillery',
		label: 'Heavy Artillery',
		troopFamilyId: 'tf-artillery',
		baseProfileId: 'bp-artillery-heavy',
		movementProfileId: 'mp-artillery-heavy',
		missileProfileId: 'msp-artillery-heavy',
		protectionProfileId: 'pp-none',
		qualityProfileId: 'qp-ordinary',
		defaultCohesionProfileId: 'coh-artillery',
		abilityIds: [],
		visualProfileId: 'vp-artillery',
		keywords: ['artillery', 'heavy-artillery'],
		componentProfiles: [],
		sourceRefs: ['docs/source/Classic_Period.md'],
		verificationStatus: 'needs-source-check',
	},
	{
		id: 'ud-archers-with-light-spear-and-pavise',
		label: 'Archers With Light Spear And Pavise',
		troopFamilyId: 'tf-bowmen',
		baseProfileId: 'bp-foot-formed',
		movementProfileId: 'mp-light-medium-foot',
		missileProfileId: 'msp-bow',
		protectionProfileId: 'pp-pavise',
		qualityProfileId: 'qp-ordinary',
		defaultCohesionProfileId: 'coh-light-medium-foot',
		abilityIds: ['ab-mixed-units'],
		visualProfileId: 'vp-medium-foot',
		keywords: ['mixed-unit', 'bowmen', 'pavise'],
		componentProfiles: [
			{ troopFamilyId: 'tf-medium-swordsmen', ratio: '1/2' },
			{ troopFamilyId: 'tf-bowmen', ratio: '1/2' },
		],
		sourceRefs: ['docs/source/Ancient_Period.md'],
		verificationStatus: 'needs-source-check',
	},
]
```

Why these examples are the right first worked set:

- They touch every major axis the schema is supposed to separate: light foot, formed foot, deep foot, mounted light, mounted formed, camelry, elephant, artillery, protection, quality, missile package, and true mixed units.
- They keep the records small enough to inspect manually while still proving that the model does not need label parsing.
- They expose where the next real implementation would still need starter profile tables for base and cohesion IDs such as `bp-mounted-light`, `bp-mounted-formed`, `bp-artillery-heavy`, `coh-light-foot`, `coh-heavy-foot`, and `coh-artillery`.

Target `src/data` module layout sketch:

When this planning surface eventually turns into code, the data should be split by responsibility rather than collapsed into one oversized catalog file.

Recommended first target layout:

```text
src/data/
	unit-definitions.js
	unit-profile-tables.js
	unit-definition-helpers.js
	unit-definitions.test.js
	unit-profile-tables.test.js
```

Recommended responsibility split:

| File | Purpose | What belongs there | What does not belong there |
| --- | --- | --- | --- |
| `unit-definitions.js` | canonical `UnitDefinition` rows | `ud-*` records, source refs, verification status, component profile references, starter catalog rows | derived movement/shooting logic, UI rendering code, army-list slot limits |
| `unit-profile-tables.js` | reusable profile namespaces | `bp-*`, `mp-*`, `msp-*`, `pp-*`, `qp-*`, `coh-*`, and later ability metadata if needed | scenario fixture positions, roster exports, reducer logic |
| `unit-definition-helpers.js` | strict lookup and composition helpers | `getUnitDefinition`, `getMovementProfile`, `getMissileProfile`, validation helpers, loud unknown-ID failures | rule solvers, UI selectors, scenario-specific overrides |
| `unit-definitions.test.js` | catalog integrity tests | required IDs, serializability, cross-reference coverage, unknown-ID failure tests | gameplay behavior tests |
| `unit-profile-tables.test.js` | profile table integrity tests | namespace completeness for tranche-one rows, no dangling references, profile-shape assertions | scenario layout or browser tests |

Planned export shape:

```js
// unit-profile-tables.js
export const BASE_PROFILE_IDS = { ... }
export const MOVEMENT_PROFILE_IDS = { ... }
export const MISSILE_PROFILE_IDS = { ... }
export const PROTECTION_PROFILE_IDS = { ... }
export const QUALITY_PROFILE_IDS = { ... }
export const COHESION_PROFILE_IDS = { ... }

export const BASE_PROFILES = { ... }
export const MOVEMENT_PROFILES = { ... }
export const MISSILE_PROFILES = { ... }
export const PROTECTION_PROFILES = { ... }
export const QUALITY_PROFILES = { ... }
export const COHESION_PROFILES = { ... }

// unit-definitions.js
export const UNIT_DEFINITION_IDS = { ... }
export const UNIT_DEFINITIONS = { ... }

// unit-definition-helpers.js
export function getUnitDefinition(unitDefinitionId) { ... }
export function getBaseProfile(baseProfileId) { ... }
export function getMovementProfile(movementProfileId) { ... }
export function getMissileProfile(missileProfileId) { ... }
export function getProtectionProfile(protectionProfileId) { ... }
export function getQualityProfile(qualityProfileId) { ... }
export function getCohesionProfile(cohesionProfileId) { ... }
```

Module design rules:

- Keep `unit-definitions.js` declarative. No rule decision code should be hidden inside definition records beyond explicit IDs and metadata.
- Keep profile tables generic enough that many definitions can share them; otherwise the schema has failed to reduce duplication.
- Keep helper functions strict and noisy on unknown IDs so later army-list import or fixture wiring cannot silently degrade to generic infantry/cavalry fallbacks.
- Keep UI-facing visual descriptors outside the legality-owning profile tables unless they are just stable references such as `visualProfileId`.
- Keep army-list import mapping as a later layer. `unit-definitions.js` should model canonical reusable unit definitions, not printed list slots or upgrade bookkeeping.

Recommended next implementation seam after this planning board:

1. create `unit-profile-tables.js` with the starter namespaces and table records
2. create `unit-definitions.js` with the first `12-20` starter definitions
3. create strict lookup helpers and tests before any reducer or scenario starts consuming the new data
4. only then migrate Charge Drill or future roster import to the new `UnitDefinition` path

User-priority long-term family matrix for UCD planning:

| Planning bucket | User-priority family examples | Why it must stay distinct | Current source posture |
| --- | --- | --- | --- |
| Light foot families | `light infantry bow`, `light infantry sling`, `light infantry javelin` | evade/light-troop identity plus missile-weapon split | supported as representative source anchors |
| Light-medium / close missile foot | `javelinmen`, `bowmen`, `crossbowmen`, `handgunners` | these are not just LI reskins; shooting and sometimes movement/contact hooks differ | supported as family names; some rule hooks remain later-phase/open |
| Medium foot families | `medium infantry`, `medium swordsmen`, `medium spearmen` | generic medium-foot movement matters even before weapon split; swords/spear package matters later for combat/contact | representative anchor plus explicit follow-up split required |
| Heavy foot families | `heavy infantry`, `heavy swordsmen`, `heavy spearmen`, `foot knights`, `pikemen`, `levies` | generic heavy-foot movement matters; weapon/protection split matters later; pike already merits its own family | representative anchor plus explicit follow-up split required |
| Wagon / artillery families | `war wagons`, `artillery-light`, `artillery-medium`, `artillery-heavy` | movement, wheel limits, shooting, and conformation restrictions differ materially | family names supported; exact capability split still source-open |
| Light mounted families | `light cavalry bow`, `light cavalry javelin`, `light cavalry impact`, `light camelry bow`, `light camelry javelin` | evade family, missile package, and panic/camel interaction make this more than one generic mounted row | source-supported as a needed future split |
| Formed mounted families | `cavalry`, `medium cavalry`, `heavy cavalry`, `medium cavalry bow`, `medium camelry`, `cataphracts`, `knights medium`, `knights heavy` | movement family, evade boundary, impact/impetuous/armour differences all matter | source-supported as a needed future split |
| Chariot and elephant families | `light chariots`, `scythed chariots`, `elephants` | unique movement/contact/panic exceptions justify separate identities | source-supported as separate families |

Working principle after this review:

- Prefer a layered data model where `medium infantry` and `heavy infantry` can still exist as movement/control anchors, while weaponed families and special missile families are added as explicit rule-facing rows instead of decorative UI variants.
- Do not let the current seven-profile Charge Drill subset harden into the final unit catalog.
- Do not let the later catalog become a flat string-matching list with duplicated movement, missile, and ability facts on every row.

Sharpened source-lock baseline after split review 2026-05-25:

- `formed foot split`: the corpus already supports a real distinction between generic movement anchors and later combat-facing foot families. `docs/rules/movement.md` still justifies keeping generic `medium infantry` and `heavy infantry` movement families, while `docs/source/Ancient_Period.md` and `docs/source/Classic_Period.md` repeatedly expose separate rows for `medium swordsmen`, `medium spearmen`, `heavy swordsmen`, `heavy spearmen`, `pikemen`, and `levy`. The planning-safe conclusion is: movement anchor and troop-family identity must remain separate axes.
- `missile taxonomy`: `docs/rules/shooting.md` already confirms that missile-bearing troops are not one uniform bucket. Special shooting zones apply to `light cavalry`, `light chariots`, `war wagons`, and `artillery`; ordered shooting modifiers explicitly mention `crossbows`, `firearms`, `incendiary`, and `pavise`; the period corpora repeatedly expose `javelinmen`, `bowmen`, `light infantry bow`, `light infantry sling`, `light infantry javelin`, mounted bow families, and mixed bow formations. The planning-safe conclusion is: missile package must be its own data surface, not an ornament on troop labels.
- `mounted split`: `docs/rules/charge.md` already forces a meaningful evade-family distinction among `light cavalry`, `javelinmen`, missile-capable cavalry cases, and other `cavalry`, `camelry`, or `light chariots` without `Impact` or `Impetuous`. `docs/rules/movement.md` separately calls out `cataphracts`, `war wagons`, `heavy artillery`, `pikemen`, and `scythed chariots` as movement-exception families, while the period corpora already expose `light cavalry bow`, `light cavalry javelin`, `medium cavalry bow`, `light camelry bow`, `medium camelry bow`, and `scythed chariot`. The planning-safe conclusion is: mounted movement family, mounted troop family, and mounted missile package cannot be collapsed into one generic cavalry row.

Planning-safe source conclusions from that review:

| Split area | Safe conclusion now | Still open |
| --- | --- | --- |
| Formed foot | keep generic `medium/heavy infantry` movement anchors, but model `swordsmen`, `spearmen`, `pikemen`, `levy`, and `foot knights` as separate troop-family rows when rules need them | exact combat/ability mapping for each family |
| Missile families | keep `javelin`, `sling`, `bow`, `crossbow`, `handgun`, artillery, wagon fire, and mounted missile cases as separate missile-profile candidates | exact ordered modifier stack and full weapon-family closure |
| Mounted families | split at least `light cavalry`, `formed cavalry`, `camelry`, `cataphracts`, `knights`, `light chariots`, `scythed chariots`, and `elephants` at planning level | exact evade/default-capability boundaries and full movement-table closure |

First-pass representative profile matrix for UCD-01/UCD-03:

| Profile ID | Representative family | Base profile default | Movement profile placeholder | Charge / evade hook | Shooting hook | Visual profile | Verification status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `light-infantry` | Light infantry and close light-troop foot families used for mandatory or optional evade tests | `bp-foot-light` | `mp-light-foot` | Evade-capable; current source-locked baseline supports `must-evade` in open terrain vs heavy troops and the light-troop end-half-turn hook, but exact family boundary stays open | `sp-light-missile-foot` placeholder | `vp-light-foot` | `needs-source-check` | Use as the first profile for `must-evade`, light-troop half-turn, blocked-evade-by-ZoC, and table-exit drills. Exact inclusion of all light-troop subfamilies remains open. |
| `medium-infantry` | Baseline formed-foot control anchor for the first data spine | `bp-foot-formed` | `mp-medium-foot` | Default `cannot-evade` unless a later source-backed subfamily overrides it | `sp-none` placeholder | `vp-medium-foot` | `provisional-anchor` | Use as the safest current control profile for formed foot blockers and ordinary support/contact lanes. This is not yet a closed catalog bucket for all non-light foot. |
| `heavy-infantry` | Heavy-foot control anchor, including the charge-distance exception and anti-LI pressure case | `bp-foot-formed` | `mp-heavy-foot` | Default `cannot-evade`; heavy-charge anchor for the `light infantry in open terrain must evade` case; heavy infantry is exempt from charge `-1 UD` on adjusted distance | `sp-none` placeholder | `vp-heavy-foot` | `provisional-anchor` | Required for CD2/P7B smoke because heavy infantry materially changes the all-targets-evade charge branch, but its shared base/default record is still provisional until the base catalog is checked. |
| `cavalry` | Baseline mounted non-bow cavalry | `bp-mounted` | `mp-mounted` | Evade-capable when non-impact and non-impetuous under the current source-locked subset; heavy-charge or light-charge behavior should come from abilities/capability data, not the profile ID alone | `sp-none` placeholder | `vp-cavalry` | `needs-source-check` | Keep this as the main current Charge Drill mounted baseline. Impact, impetuous, and heavy-charge are capability fields, not separate profile IDs yet. |
| `cavalry-bow` | Representative missile-mounted anchor for the current drill and reaction branch | `bp-mounted` | `mp-mounted-provisional` | Evade-capable in the current source-locked subset and explicitly exercises the missile-capable cavalry branch | `sp-mounted-bow` placeholder | `vp-cavalry-bow` | `provisional-anchor` | Needed so Charge Drill can stop pretending all mounted evade cases are generic cavalry. Its movement-profile split stays explicitly provisional until the mounted family boundary is source-checked. |
| `pike` | Pike family for later conformation/contact and manoeuvre restriction smoke | `bp-foot-deep` | `mp-pike-foot` | Default `cannot-evade`; inherits movement-turn exception pressure from the movement chapter and is primarily a contact/conformation anchor for future boards | `sp-none` placeholder | `vp-pike` | `needs-source-check` | Include now as a profile ID even though P7A/P7A2 do not yet need pike-specific reaction code; it prevents CD2/P7B from inventing pike later. |
| `elephant` | Elephant family for future special contact and light-troop exception smoke | `bp-elephant` | `mp-elephant` | Default `cannot-evade`; currently important because elephants are named in the `light infantry need not must-evade into elephant melee` exception boundary | `sp-none` placeholder | `vp-elephant` | `needs-source-check` | Include as a profile anchor now; do not claim full elephant rules beyond the explicit charge/evade exception touchpoint. |

Representative ability / capability guidance for the first pass:

- Keep `chargeReactionCapability` as the near-term compatibility surface, but make it derived from profile data by default in `UCD-02`.
- Treat `impact`, `impetuous`, `bow`, `crossbow`, `double-bow`, `double-crossbow`, `light-troops`, and `heavy-charge` as ability/capability fields layered on top of the family profile, not as bespoke fixture booleans on individual units.
- Treat `javelinmen`, `light cavalry`, `camelry`, and `light chariot` as follow-up representative profiles only when a current drill lane or accepted rules slice actually needs them; they are already visible in the current reaction logic and source corpus, but not required to start the data spine.

Expanded long-term ability guidance after user review:

- Treat these as explicit capability families or ordered rule hooks, not as visual-only adornments: `javelin`, `sling`, `bow`, `crossbow`, `handgun`, `artillery-fire`, `wagon-fire`, `armour`, `heavy-armour`, `two-handed-weapon`, `polearm`, `furious-charge`, `impact`, `impetuous`, `incendiary`, `panic`, `pavise`, `stakes`, `expendables`, `missile-support`, and `mixed-units`.
- `elite` and `mediocre` should remain unit-definition quality/protection/cohesion inputs, not free-floating combat tags.
- Mixed units should stay an explicit structural unit-definition capability because the source corpus already contains true mixed entries such as formed `1/2` foot plus `1/2` bow combinations.

Open verification carried by this matrix:

- Exact `light troops` family boundary for the free end-half-turn and any other movement/evade hooks still needs direct errata/source confirmation.
- Exact shared base-profile catalog by family remains open; the first-pass IDs above are planning anchors, not yet measured tournament-ready base tables.
- Pike and elephant remain included as profile anchors because they already matter to future contact/conformation and to the current `must-evade` exception wording, but their full special-rule surfaces are not closed by UCD-00.
- The full formed-foot split between generic `medium/heavy infantry` movement anchors and later `swordsmen/spearmen/foot-knights/levy` combat families remains open and must be modeled without duplicating rule tables.
- The mounted split between `light cavalry`, `cavalry`, `camelry`, `cataphracts`, `knights`, and chariot families remains open and must be source-checked before default evade and movement hooks are frozen.
- The long-term missile taxonomy for `sling`, `bow`, `crossbow`, `handgun`, artillery grades, war wagons, and missile support remains open and must be kept separate from visual cues.

Verification-status note for this matrix:

- `provisional-anchor` means the representative family split is judged narrow enough for UCD-01 planning, but the eventual profile record still depends on unresolved shared base-catalog or exact family-boundary checks.
- `mp-mounted-provisional` is a deliberate placeholder name, not a closed light-mounted movement class. UCD-01 must keep mounted movement-family resolution open until the representative mounted split is source-checked.
- `needs-source-check` means the row already sits directly on an unresolved rule-family boundary and must stay explicitly open until the cited source check is complete.

Completion state 2026-05-26:

- `UCD-00` is closed for the current representative baseline that fed `UCD-01` through `UCD-03` and the accepted CD2 support slice.
- The representative baseline is still deliberately narrow. It is not a closed tournament taxonomy and it does not settle the open verification IDs listed above.
- Future taxonomy expansion must be treated as a new source-sensitive UCD slice with fresh user approval.

Validation update 2026-05-25:

- Markdown diagnostics are clean for `UNIT_CAPABILITIES_todo.md`, `CHARGE_DRILL_2_todo.md`, `roadmap.md`, and `docs/rules/open-verification.md`.
- Preferred GPT-5.5 review was not available in this session cost tier, so the review gate was run with GPT-5.4 as the closest available fallback.
- The review approved the representative taxonomy with the existing caveats: keep `light-infantry` as a representative anchor rather than a closed `light troops` family, keep `medium-infantry`, `heavy-infantry`, and `cavalry-bow` provisional, and keep mounted edge cases ability-driven rather than profile-ID-driven.
- Manual acceptance/reality state: the representative seven-profile set was subsequently consumed by completed `UCD-01` through `UCD-03` work and accepted CD2 support work. Future expansion beyond those profiles still requires explicit user approval.

### [x] UCD-01 - Unit Profile Data Spine

Goal: add a small, test-backed profile database for representative unit families.

Planned files:

- src/data/unit-profiles.js or src/data/unit-families.js
- src/data/unit-profiles.test.js or src/data/unit-families.test.js
- src/data/charge-drill-scenarios.js only for low-risk wiring if needed
- docs/architecture.md if the data contract needs a durable note
- UNIT_CAPABILITIES_todo.md

Implementation steps:
1. Create profile records for the `UCD-00` approved families.
2. Include source references and verification status on every profile.
3. Add helper functions such as `getUnitProfile(profileId)` and `getUnitProfileForUnit(unit)`.
4. Ensure unknown profile IDs produce explicit diagnostics or thrown test failures, not silent default behavior.
5. Add tests for required profile IDs, required fields, serializability, and unknown profile handling.
6. Keep profile data independent from UI rendering code.

Non-goals:

- no reaction solver changes yet
- no Charge Drill layout expansion
- no Army Builder import

Validation:

- `node --test src/data/unit-profiles.test.js`
- `npm run build`
- editor diagnostics on touched files

Manual acceptance:

- none for data-only behavior; summarize profile IDs for user review.

Stop condition:

- Stop if the profile shape conflicts with `docs/army-builder.md` unit definition/export direction.

Expected result: the repo has a reusable capability/profile data source for current and future fixtures.

Progress 2026-05-25:

- Added `src/data/unit-profiles.js` as the first standalone profile data spine for the approved representative families: `light-infantry`, `medium-infantry`, `heavy-infantry`, `cavalry`, `cavalry-bow`, `pike`, and `elephant`.
- The module now exports strict lookup helpers `getUnitProfile(profileId)` and `getUnitProfileForUnit(unit)` plus stable profile-family constants for base, movement, charge-reaction, evade, shooting, combat, and visual profile IDs.
- Every profile record includes `sourceRefs` and `verificationStatus`, and the data keeps the UCD-00 caveats explicit instead of silently defaulting unknown or still-open family boundaries.
- Unknown profile IDs and units without `profileId` now fail loudly instead of falling back to legacy `troopType` heuristics.
- This card deliberately did not wire Charge Drill units to `profileId` yet; that migration remains owned by `UCD-03` so UCD-01 stays data-foundational.

Validation update 2026-05-25:

- `node --test src/data/unit-profiles.test.js` passes `5/5`.
- `npm run build` passes.
- Editor diagnostics are clean on the touched data and board files.

Manual acceptance summary:

- Exposed profile IDs: `light-infantry`, `medium-infantry`, `heavy-infantry`, `cavalry`, `cavalry-bow`, `pike`, `elephant`.
- Deliberately provisional data remains explicit: `light-infantry` stays `needs-source-check`; `medium-infantry`, `heavy-infantry`, and `cavalry-bow` remain `provisional-anchor`; mounted movement for `cavalry-bow` remains `mp-mounted-provisional` until the mounted family split is source-checked.

Next exact card after UCD-01 validation: `UCD-02 - Charge Reaction And Evade Capability Resolver`.

### [x] UCD-02 - Charge Reaction And Evade Capability Resolver

Goal: make charge reaction/evade capability resolution derive from profiles by default while preserving labeled explicit overrides.

Planned files:

- src/data/unit-profiles.js
- src/engine/charge/reaction.js
- src/engine/charge/reaction.test.js
- src/engine/charge/evade.js only if light-troop hook lookup must use profiles
- src/engine/charge/evade.test.js if hook lookup changes
- UNIT_CAPABILITIES_todo.md

Implementation steps:
1. Add a resolver that combines unit instance selected ability IDs, profile defaults, and explicit scenario/test overrides.
2. Prefer profile-derived `chargeReactionCapability` when no explicit `chargeReactionProfile` override is present.
3. Keep explicit overrides but require a reason field such as `scenarioOverrideReason` for new fixture overrides.
4. Route light-troop end-half-turn eligibility through the profile/default ability path once source wording is locked enough for the current subset.
5. Add diagnostics for missing profile, missing capability, and source-open family boundaries.
6. Preserve existing P7A/P7A2 behavior unless tests intentionally prove the profile path fixes a hardcoded mismatch.

Non-goals:

- no full shooting/combat behavior
- no roster or points data
- no new Charge Drill lanes yet

Validation:

- `node --test src/engine/charge/reaction.test.js src/engine/charge/evade.test.js src/data/unit-profiles.test.js`
- `npm run build`

Manual acceptance:

- none unless browser behavior changes unexpectedly.

Stop condition:

- Stop if profile resolution changes current accepted P7A/P7A2 behavior without a clear source-backed reason.

Expected result: unit family/profile data is the normal route for charge reaction and evade capability.

Progress 2026-05-25:

- Added a first profile-backed capability resolver in `src/data/unit-profiles.js` so profile data can expose default `chargeReactionCapability` records and derive a capability object from `profileId`, `defaultAbilities`, and `selectedAbilityIds`.
- `src/engine/charge/reaction.js` now prefers profile-derived capability data when the defender has no explicit `chargeReactionProfile` override and no explicit `chargeReactionCapability` override.
- Explicit overrides still win: explicit `chargeReactionProfile` remains the top override for scenario/test control, and explicit `chargeReactionCapability` still overrides profile-derived defaults.
- The same profile-backed capability helper is now used for the charging unit when a heavy-charge check is needed and the charger exposes `profileId` but no explicit capability object.
- Missing or unknown `profileId` on a profile-backed resolver path now escalates to `needs-source-check` with an explicit diagnostic instead of silently falling back to legacy heuristics.
- The light-troop end-half-turn hook in `src/engine/charge/evade.js` now resolves through `profileId` plus profile/default ability data first, with a narrow legacy fallback kept only for not-yet-migrated units.
- Charge Drill fixture migration still remains owned by `UCD-03`; UCD-02 only closes the resolver path.

Validation update 2026-05-25:

- `node --test src/engine/charge/reaction.test.js src/data/unit-profiles.test.js` passes `26/26`.
- `node --test src/engine/charge/evade.test.js src/data/unit-profiles.test.js` passes `45/45`.
- `npm run build` passes.
- Editor diagnostics are clean on the touched resolver, data, test, and board files.

Completion note:

- `UCD-02` is complete for the approved resolver scope: profile data is now the default charge reaction / evade capability path, explicit overrides still win, and missing profile data surfaces diagnostics instead of silent guesses.
- Future explicit scenario/test overrides should carry a reason field such as `scenarioOverrideReason`, but the actual fixture-data migration and normalization of legacy overrides belong to `UCD-03`.

Next exact card after UCD-02 validation: `UCD-03 - Charge Drill De-Hardcoding Migration`.

### [x] UCD-03 - Charge Drill De-Hardcoding Migration

Goal: migrate current Charge Drill units to profile IDs and remove normal-path per-unit capability duplication.

Planned files:

- src/data/charge-drill-scenarios.js
- src/data/charge-drill-scenarios.test.js
- src/data/unit-profiles.js
- src/engine/charge/reaction.test.js
- src/state/p0-state.test.js
- UNIT_CAPABILITIES_todo.md
- CHARGE_DRILL_2_todo.md

Implementation steps:
1. Add `profileId` or `definitionId` to Charge Drill units where behavior is meant to represent a real family.
2. Replace direct repeated capability objects with profile-derived defaults where possible.
3. Keep scenario placement, labels, roles, and regression IDs stable.
4. Keep explicit overrides only for test/fault-injection cases and label them clearly in the fixture data.
5. Add tests proving key Charge Drill units derive expected capabilities from profile IDs.
6. Add tests that new Charge Drill units cannot omit profile/capability data unless intentionally marked source-open or override-only.
7. Update `CHARGE_DRILL_2_todo.md` so future lanes must use profiles.

Non-goals:

- no new large fixture matrix yet
- no visual-base rendering changes
- no P7B implementation

Validation:

- `node --test src/data/charge-drill-scenarios.test.js src/engine/charge/reaction.test.js src/state/p0-state.test.js`
- `npm run build`

Manual acceptance:

- User confirms current drill behavior still feels the same, but fixture data is now profile-driven.

Progress 2026-05-25:

- `src/data/charge-drill-scenarios.js` now assigns `profileId` by default to current representative Charge Drill families instead of hardcoding per-unit default capability logic in the scenario file.
- Normal-path cavalry and medium-infantry drill units now derive `chargeReactionCapability` from the shared profile spine at scenario creation time.
- The remaining explicit non-profile path is intentional and labeled: the commander stays outside the first representative family set, and the light-troop hook lane keeps its explicit override with `scenarioOverrideReason` because it is a deliberate scenario-control lane.
- Stable IDs, labels, positions, and lane roles were preserved; the migration changed the data source, not the fixture layout.

Validation update 2026-05-25:

- `node --test src/data/charge-drill-scenarios.test.js` passes `1/1`.
- `npm run build` passes.
- Editor diagnostics are clean on the touched scenario, data, test, and board files.

Manual acceptance summary:

- Current drill units representing approved families are now profile-backed by default.
- The commander remains a legacy special case rather than a fake family profile.
- The `light-troop-hook-target` lane remains an explicit labeled override to preserve its drill-specific reaction pause and half-turn coverage.

Execution state after `UCD-03`:

- `CD2-00` through `CD2-05` have already consumed this profile-backed drill/data path for the accepted support scope.
- `BVR-01` and `BVR-02` have already consumed the inert visual-profile bridge for the accepted support scope.
- The next active work is P7A2 regression repair, not another UCD bootstrap card.

Stop condition:

- Stop if migrating fixture data would hide a current P7A2 bug; preserve an explicit regression lane and document it.

Expected result: Charge Drill stops being a pile of bespoke unit behavior and becomes a realistic test surface.

### [x] UCD-04 - Render Profile And Readable Unit Identity Bridge

Goal: prepare battlefield rendering to show unit family identity without coupling visuals to rule logic.

Planned files:

- src/data/unit-profiles.js
- src/data/unit-render-profiles.js if separated
- src/data/unit-profiles.test.js
- src/ui/p0-battlefield.js only for data attributes if needed
- src/ui/p0-battlefield.test.js if attributes change
- UNIT_CAPABILITIES_todo.md
- CHARGE_DRILL_2_todo.md

Implementation steps:
1. Add `visualProfileId` / `renderProfileId` to unit profiles.
2. Add stable labels and optional battlefield data attributes so browser tests can identify `light-infantry`, `cavalry-bow`, `pike`, etc.
3. Keep the actual visual art/silhouette work in `CHARGE_DRILL_2_todo.md` BVR cards unless explicitly reprioritized.
4. Add tests that profiles expose render references without changing rule behavior.

Non-goals:

- no full visual asset system
- no canvas atlas
- no new rule behavior

Validation:

- `node --test src/data/unit-profiles.test.js src/ui/p0-battlefield.test.js`
- `npm run build`

Manual acceptance:

- none unless visible battlefield labels/attributes change.

Stop condition:

- Stop if render metadata starts duplicating rule facts instead of referencing profiles.

Expected result: later readable-base work can consume profile metadata cleanly.

Completion note 2026-05-26:

- Covered by the accepted BVR-01/BVR-02 support work rather than by a separate UCD-only implementation pass.
- `src/data/unit-profiles.js` now carries inert visual descriptors through the existing `VISUAL_PROFILES` spine and `getVisualProfileForUnit(unit)` helper.
- `src/data/charge-drill-scenarios.js` attaches `visualProfileId` through profile defaults, with the commander handled by an explicit visual-profile override.
- `src/ui/p0-battlefield.js` exposes token-owned descriptor data attributes so rendering can consume visual identity without reading troop-rule fields directly.
- The CSS/DOM readable-base prototype is accepted only as a rule-relevant recognition baseline; richer art and optional atlas work remain deferred to BVR-03+.

### [ ] UCD-05 - Army Builder Compatibility And Source Hooks

Goal: ensure the capability database can later be fed by real army-list/roster data without redesign.

Planned files:

- docs/army-builder.md
- docs/architecture.md
- docs/rules/open-verification.md
- UNIT_CAPABILITIES_todo.md
- P11 planning notes if present later

Implementation steps:
1. Cross-check profile fields against the Army Builder design: unit catalog, roster export, selected abilities, source refs, and errata overlays.
2. Add notes for how P11 will map army-list entries to unit definitions and profile IDs.
3. Record which current profiles are representative training profiles versus eventual catalog definitions.
4. Keep open verification for profile fields still sourced from incomplete OCR/manual checks.

Non-goals:

- no P11 implementation
- no army-list JSON import

Validation:

- docs review

Manual acceptance:

- User confirms the direction matches the desired final army-list/capability workflow.

Stop condition:

- Stop if profile schema would force a future army-list migration to duplicate rules again.

Expected result: today’s profile work points toward the real unit catalog instead of becoming another temporary shortcut.

### [x] UCD-06 - Handoff To CD2, P7B, And P8

Goal: make downstream boards depend on the profile data spine instead of adding hardcoded lanes.

Planned files:

- CHARGE_DRILL_2_todo.md
- P7B_todo.md
- roadmap.md
- future P8_todo.md if it exists by then
- UNIT_CAPABILITIES_todo.md

Implementation steps:
1. Update CD2 so fixture expansion starts from profile IDs and capability resolver tests.
2. Update P7B to prefer profile-backed unit families for conformation smoke anchors.
3. Update P8 planning so bow/cavalry-bow lanes use profile shooting hooks, not bespoke fixture flags.
4. Record what remains representative versus tournament-complete.
5. Stop for user manual acceptance before claiming the data spine is ready for downstream smoke.

Non-goals:

- no conformation implementation
- no shooting implementation
- no visual-base implementation

Validation:

- Markdown/docs review
- existing profile and Charge Drill tests still pass after wording updates if code has already changed

Manual acceptance:

- User accepts the profile-backed fixture direction as the baseline for upcoming CD2/P7B/P8 work.

Stop condition:

- Stop if downstream wording implies legal army-list completeness.

Expected result: future work uses real-ish unit families by default and reserves hardcoded overrides for explicit test controls.

Completion note 2026-05-26:

- Covered by accepted CD2-05 support-board handoff.
- `CHARGE_DRILL_2_todo.md` now treats the profile-backed matrix as the default fixture baseline and keeps later symbols constrained to rule-relevant distinctions.
- `P7B_todo.md` records the current Charge Drill anchors as support smoke baselines while still gating P7B implementation on P7A2 acceptance.
- Future P8 use is recorded in board/roadmap wording because no dedicated `P8_todo.md` exists yet.
- This handoff does not claim legal army-list completeness.

### [ ] UCD-07 - Canonical UnitDefinition And Profile Table Split

Goal: turn the planning sketch into a small canonical data-module split after P7A2 closes, without widening the current representative support spine into a stealth army-list import.

Planned files:

- src/data/unit-definitions.js
- src/data/unit-profile-tables.js
- src/data/unit-definition-helpers.js
- src/data/unit-definitions.test.js
- src/data/unit-profile-tables.test.js
- UNIT_CAPABILITIES_todo.md
- docs/army-builder.md if the import/roster contract needs a durable note
- docs/rules/open-verification.md for any unresolved source-lock blockers

Implementation steps:
1. Create reusable profile-table modules for `bp-*`, `mp-*`, `msp-*`, `pp-*`, `qp-*`, and `coh-*` starter rows already planned above.
2. Create `12-20` starter `UnitDefinition` rows from the approved planning tranche, each with source refs and verification status.
3. Add strict lookup helpers that fail loudly on missing or dangling IDs.
4. Add integrity tests for required fields, serializability, cross-reference closure, namespace shape, and unknown-ID failures.
5. Do not migrate reducers, scenario fixtures, or roster import to the new `UnitDefinition` path until the data/table tests are green and the user approves the next consuming slice.
6. Keep all source-open family boundaries explicit instead of collapsing them into generic fallback profiles.

Non-goals:

- no P11 army-list import
- no points or roster legality
- no broad fixture expansion
- no shooting/combat implementation
- no UI rendering work

Validation:

- `node --test src/data/unit-definitions.test.js src/data/unit-profile-tables.test.js`
- `npm run build`
- editor diagnostics on touched files

Manual acceptance:

- User reviews the starter definition/profile-table IDs and confirms that the slice should become the canonical future catalog seam.

Stop condition:

- Stop if a planned starter row cannot carry a clear `sourceRefs` and `verificationStatus` pair without pretending the source question is closed.

Expected result: future Army Builder, Charge Drill, P7B, and P8 work can consume canonical reusable definitions/tables instead of growing the temporary representative profile spine forever.
