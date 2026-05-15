# Planning Review: Tournament-Ready AdG Online

Status: planning update after deeper source review.

This review checks the project against the intended product: a complete 200-point tournament-training game for two players first, with a possible AI opponent later. It is not implementation work.

## Main Findings

## 1. Standard 200 Points Must Be The Default

The project should treat standard 200-point play as the default profile, not as one selectable format among equals during early design.

Required planning changes:

- default format: 200 points per army;
- standard structure: three corps, each led by a commander;
- mandatory camp per army;
- standard table profile for 6-15 mm: 120 x 80 cm, UD = 4 cm;
- 20-30 units is a useful sanity expectation, not a hard legality rule;
- reduced 100-point and big-battle 300/400-point variants remain later optional modes.

## 2. Pre-Battle Setup Is A Full Rule System

The rules do not begin with movement. A tournament-training app must model the official setup sequence.

Required systems:

- initiative calculation and roll;
- attacker/defender choice and consequences;
- region choice;
- compulsory terrain;
- terrain selection quotas;
- terrain placement order;
- river/coastal-zone checks;
- village placement;
- road placement last;
- terrain adjustment rolls and strategist bonus;
- camps, fortifications, and obstacles;
- battle plan declarations;
- ambush markers and fake ambushes;
- corps deployment zones;
- dismounting choices;
- transition into first battle turn.

This should become a state machine, not a wizard that skips validation.

## 3. Hidden Information Is Core Local Gameplay

Hidden information is not only a multiplayer problem. Hotseat/local two-player play already needs private information.

Required systems:

- private battle plans;
- ambush contents and fake markers;
- flank march declarations and arrival flank;
- visibility-scoped state views;
- reveal triggers;
- replay logs that can hide or reveal private information depending on viewer mode;
- AI opponent guardrails so AI cannot use hidden information unfairly.

## 4. Command Context Must Exist Before Serious Movement

Movement is corps-, commander-, command-range-, CP-, and active-corps-dependent. A pure geometry movement phase is fine for P0, but any claim of legal AdG movement needs at least a command context skeleton.

Required before rule-valid movement:

- active player;
- active corps;
- commander identity and quality;
- command range profile;
- in-command/out-of-command facts;
- CP availability placeholder or real CP calculation;
- free commander CP rules identified for later validation.

## 5. Terrain Needs Data, Not Drawing Tools

Terrain placement is rule-bound. The engine must model terrain as data with source references and validation.

Required terrain fields:

- terrain type;
- region availability;
- compulsory status;
- selection quota;
- placement step;
- legal table sectors or edge constraints;
- size bounds in UD;
- passability and category;
- cover and shooting effects;
- ambush permissions;
- movement/combat effects;
- adjustment behavior;
- road interaction;
- source references.

## 6. Tournament Training Mode Needs Stronger Rules

Training should help the player learn official play, not make the game easier by changing legality.

Recommended modes:

- Tournament Training: strict legality, official sequence, limited undo after confirmation, hidden information respected, explanations available.
- Study Mode: full explanations, debug overlays, replay branches, broad undo, source references.
- Sandbox/Dev Mode: incomplete features and debug fixtures clearly marked as not tournament-complete.

## 7. AI Opponent Must Be An Engine Client

Later AI must submit the same legal actions as a human player. It must not own rules, bypass validation, or use hidden information outside its player view.

AI guardrails:

- AI proposes actions only through the engine action API;
- AI sees only the visibility-scoped state for its side;
- AI evaluations can use heuristics, but legality comes only from validators;
- AI explanations should show why an action is legal and strategically useful;
- AI test fixtures must include hidden-info fairness cases.

## 8. Agent Standardization Should Be Workspace-Wide

The AdG-Rules-Engine-Agent can be the specialist default, but the repository should also contain general Copilot instructions so any agent entering the workspace follows the same phase gates, rule-source priority, standard-200 default, and no-simplification policy.

## Recommended Document Changes

- Update `docs/architecture.md` with a standard-200 profile, pre-battle state machine, hidden-information model, tournament modes, and AI guardrails.
- Update `roadmap.md` so P1 blocks on rule extraction for standard-200, sequence, terrain/setup, command context, deployment, and hidden information.
- Update P3 to be tournament setup, terrain, battle plan, deployment, and hidden-info foundation rather than only terrain placement.
- Update P4 so movement cannot claim official legality without command context.
- Update `docs/army-builder.md` with standard-200 invariants and sanity checks.
- Update the custom agent and workspace instructions to act as rule guardian by default.

## Current Risk Register

- High: Image-only PDFs can lead to missed rules unless extracts are created before implementation.
- High: Hidden information can be hard to retrofit if state visibility is not designed early.
- High: Movement can become wrong if built before command context exists.
- Medium: Terrain placement may become a drawing feature instead of a rule system.
- Medium: Optional formats can distract from the 200-point tournament target.
- Medium: AI opponent work can accidentally become omniscient unless visibility rules are planned now.
