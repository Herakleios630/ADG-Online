# Battlefield Visual Contract

## Purpose

This document defines the first readable-base visual contract for AdG Online before any token-art implementation starts.

It is a rendering contract only. It does not change legal footprint geometry, charge contact, ZOC, conformation, command range, or any other engine-owned rule fact.

The visual direction may take inspiration from the rulebook's tabletop-style example presentation, but it must not copy copyrighted figure art or scan fragments. First-pass visuals must be generated from simple shapes, silhouettes, CSS primitives, SVG-like DOM fragments, or project-owned atlas output.

## Product Goals

First-pass battlefield tokens should help the player distinguish the following families at normal play zoom without opening the side panel first:

- light foot
- medium foot
- heavy foot
- cavalry
- cavalry bow
- pike
- elephant
- commander

The visual layer should make the Charge Drill and later battlefield phases easier to scan, especially when multiple test anchors are split across corps.

## Current Data Anchors

The existing profile spine already provides inert visual references through `visualProfileId` on representative unit profiles in `src/data/unit-profiles.js`.

Current visual-profile descriptors already name stable hints for the supported first families:

- `light-foot`: `baseSilhouette=loose-foot`, `figureSilhouette=skirmishers`, `formationHint=open-order-foot`
- `medium-foot`: `baseSilhouette=formed-foot`, `figureSilhouette=ranked-infantry`, `formationHint=medium-formed-foot`
- `heavy-foot`: `baseSilhouette=formed-foot`, `figureSilhouette=dense-infantry`, `formationHint=heavy-formed-foot`
- `cavalry`: `baseSilhouette=mounted`, `figureSilhouette=horsemen`, `formationHint=mounted-line`
- `cavalry-bow`: `baseSilhouette=mounted`, `figureSilhouette=horse-archers`, `formationHint=mounted-missile-line`
- `pike`: `baseSilhouette=deep-foot`, `figureSilhouette=pike-block`, `formationHint=deep-formed-foot`
- `elephant`: `baseSilhouette=elephant`, `figureSilhouette=elephant`, `formationHint=single-large-target`
- `commander`: `baseSilhouette=commander`, `figureSilhouette=leader`, `formationHint=command-stand`

These descriptors are planning anchors and visual hints only. They are not rule facts.

## Visual Contract

Every unit token may eventually expose four visual layers:

1. footprint layer
2. figure/silhouette layer
3. facing marker layer
4. state accent layer

The footprint layer communicates unit family and general base type.

- `loose-foot`: lighter, more open footprint treatment
- `formed-foot`: compact rectangular/square formed footprint
- `deep-foot`: deeper pike-style footprint treatment
- `mounted`: wider mounted footprint treatment
- `elephant`: large heavy target footprint treatment
- `commander`: circular or clearly leader-specific footprint treatment

The figure/silhouette layer communicates the family identity inside the legal base footprint.

- `skirmishers`: sparse light-foot marks
- `ranked-infantry`: ordered foot marks
- `dense-infantry`: denser heavy-foot marks
- `horsemen`: mounted figures
- `horse-archers`: mounted figures plus a missile cue
- `pike-block`: dense foot body plus long forward pike cue
- `elephant`: single large animal mass cue
- `commander`: leader mark distinct from formed units

The facing marker layer communicates front orientation without replacing current overlays.

- It should remain readable when the token rotates.
- It must not obscure charge contact-side markers, selected-target markers, command links, or future conformation ghosts.

The state accent layer communicates owner color, selection, hover, blocked/eligible target highlighting, and later preview states.

- Owner color remains a support accent, not the only family cue.
- Selection and legality highlights must stay more prominent than decorative art.

## Interaction Contract

The interactive surface remains the existing DOM button token.

- `data-action="select-unit"` remains the authoritative hit target.
- `data-automation-id="unit-..."` remains stable.
- Accessibility text, titles, and DOM button semantics stay on the token button, not on a separate art-only child.
- Decorative inner visual layers must not intercept pointer events.

The visual layer must not require replacing current charge overlays, contact markers, selected-target borders, command-range links, or future conformation ghosts.

## Implementation Ladder

The preferred implementation ladder is incremental:

1. CSS/DOM readable-base prototype inside the current token button
2. richer DOM/SVG-like primitives only if the CSS pass still preserves clarity
3. optional pre-rendered atlas/cache output if it improves readability without destabilizing overlays or selection

The project must not jump directly to a canvas battlefield renderer just to improve token art.

## Atlas And Fallback Contract

If a later slice evaluates cached atlas rendering, the atlas remains a decoration source only.

- DOM button tokens remain the interactive and accessibility surface.
- Atlas output may be cached by render profile, owner accent, device pixel ratio, and a small set of state variants.
- If `OffscreenCanvas` is unavailable, fall back to either an in-document canvas cache or the CSS/DOM prototype.
- If cached art performs worse than CSS/DOM primitives or reduces overlay readability, keep the CSS/DOM path as the default.

## Non-Goals

- no copyrighted scan extraction or figure copying
- no legal geometry changes
- no new rule behavior
- no full battlefield canvas rewrite
- no per-frame painter that owns token state
- no hidden dependence on player text labels for family recognition

## First-Pass Readability Priorities

The first implementation slice should optimize for quick battlefield recognition in the current Charge Drill and early future phase smoke:

1. commander distinct from formed troops
2. mounted distinct from foot
3. cavalry bow distinct from generic cavalry
4. pike distinct from other foot
5. elephant distinct from all other targets
6. light foot distinct from formed foot

## Rules-Relevant Symbol Policy

Additional UI symbols should only be introduced when they map to a rule-relevant distinction that the data/capability spine can name explicitly.

Use this filter before adding any new token mark:

- The distinction must affect or anchor a real rule surface such as shooting, evade category, charge reaction, movement family, contact/conformation behavior, or another verified capability hook.
- The distinction must be representable as stable profile/capability data, not inferred ad hoc from CSS alone.
- If the rule/capability split is still open, do not invent a decorative symbol just because it would look clearer.

Current matrix for future symbol planning:

| Visual distinction | Why it is rule-relevant | Current status |
| --- | --- | --- |
| mounted vs foot | movement family, footprint, evade/reaction anchors | supported |
| cavalry bow vs generic cavalry | mounted missile/shooting hook and reaction identity | supported |
| light foot vs formed foot | loose-order versus formed baseline and light-troop recognition | supported |
| pike vs other foot | deep formation and future contact/conformation hooks | supported |
| elephant vs other targets | special target family and future contact hooks | supported |
| commander vs troop stand | command identity, not a troop combat stand | supported |
| foot missile cue such as bow or javelin | shooting/reaction relevance when capability split exists | deferred pending sharper profile split |
| light cavalry vs cavalry | mounted subfamily evade/mobility distinction | deferred pending source-checked capability split |
| heavy infantry weapon cue such as spear or heavy weapon | contact/combat relevance when modeled in stable data | deferred pending capability matrix |
| medium infantry weapon cue such as spear or javelin | contact/shooting relevance when modeled in stable data | deferred pending capability matrix |
| artillery grade or war-wagon marker | movement/shooting/conformation restrictions when the catalog is explicit | deferred pending capability matrix |
| cataphract / knight / camelry cue | movement, protection, panic, or impact distinctions when the catalog is explicit | deferred pending capability matrix |

This means the next planning step after the accepted BVR-02 baseline is not richer art. It is a compact feature matrix that states which additional symbols are justified by verified rule-facing data and which must wait.

## Open Review Gate

BVR-00 is not complete until the visual architecture is reviewed externally at the planned GPT-5.5 gate and the user confirms the direction.