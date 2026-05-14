# Army Builder Design

## Purpose

The Army Builder creates legal AdG V4-style rosters from structured data. It must not hardcode armies, unit limits, costs, options, or allies in application logic. Every roster decision must be validated against JSON data derived from the source army lists, spreadsheet, and errata.

## Source Material

- `Konzepte/ArmyLists1-82.pdf`: printed army list structure, list descriptions, commanders, troop tables, allies, notes, dates, regions, and classification.
- `Konzepte/Army_list_spreadsheet_V4 (1).xlsx`: calculator structure for 100, 200, and 300 point formats; commander/camp/troop budget formulas; `Armies V4` list index.
- `Konzepte/Errata_ADG_V4_English.pdf`: army-list corrections and point/list changes.
- `Konzepte/Rules.pdf`: army budget, commanders, camps, allies, deployment, and optional format rules.

The printed list PDF is image-based in this workspace. Data import must therefore be treated as a controlled data-entry or OCR-assisted pipeline with human verification.

## Design Principles

- Army data is JSON, versioned, and validated by schema.
- Engine code reads generic structures only; it never switches on a specific army name.
- Errata is represented as overlay patches against base lists.
- Every min/max, replacement, option, ally, and point rule produces a validation explanation.
- The same roster validation runs in the UI, import pipeline, tests, and future server.
- Army Builder output creates unit instances from unit definitions and roster selections. It does not copy movement tables, combat factors, or ZOC rules into each unit.

## Standard 200-Point Default

The first production target is the standard 200-point format.

Standard-200 data must define:

- budget: 200 points per army;
- corps structure: three corps, each led by a commander;
- mandatory camp: one camp per army;
- commander and camp budget table for 200-point play;
- fortification and obstacle budget effects;
- army initiative calculation inputs, including command quality and scouting bonus;
- standard battlefield profile link: `standard-200-6-15mm` unless a different scale is selected;
- roster sanity check: approximately 20-30 units expected for many armies, but exact legality is determined by list constraints and points.

Reduced 100-point and big-battle 300/400-point formats should remain data-driven variants, but they should not influence the first complete rules path.

## Data Packages

```text
src/data/armies/
  index.json
  schemas/
    army-list.schema.json
    roster.schema.json
    errata-overlay.schema.json
  lists/
    ancient/
    classical/
    roman/
    dark-ages/
    feudal/
    late-middle-ages/
    america/
  formats/
    reduced-100.json
    standard-200.json
    big-battle-300.json
  errata/
    errata-2024-02.json
```

This structure is a target. It should be created during P8, not during project initialization.

## Core Concepts

Unit catalog:

- canonical troop type and category definitions;
- default base profile and cohesion profile;
- default ability identifiers such as stakes, impact, armour, bow, javelin, support, or other verified rules;
- visual profile reference for rectangle, PNG, atlas, and player-color mask rendering;
- source references and verification status.

Rule tables:

- movement allowances;
- maneuver costs;
- combat factors;
- terrain effects;
- cohesion and outcome tables;
- command costs;
- ZOC and conformation rules.

Rule tables are global data. They are not repeated in army list entries or roster selections.

Army list:

- historical list definition;
- one or more date windows;
- regions and terrain preferences;
- command value;
- allowed commanders and strategists;
- troop entries with min/max and points;
- options, replacements, upgrades, and notes;
- allies and allied corps restrictions;
- camps, fortifications, obstacles, and special restrictions.

Roster:

- player-selected army list;
- game format and point budget;
- selected date/region/options;
- commanders and corps assignment;
- chosen troop quantities and upgrades;
- allies, camps, fortifications, and obstacles;
- validation result and exported game setup units.

Exported game setup units:

- resolve roster selections to `UnitDefinition` and `UnitInstance` data;
- carry current match state such as corps assignment, owner, quality, selected abilities, cohesion, and initial pose;
- derive movement/combat values later from rule tables during validation.

Format:

- point budget;
- table size assumptions;
- corps count constraints;
- commander/camp budget adjustments;
- optional reduced or big-battle rules.

Standard-200 format fixture:

```json
{
  "formatId": "standard-200",
  "label": "Standard 200 points",
  "pointsBudget": 200,
  "defaultCorpsCount": 3,
  "mandatoryCamp": true,
  "defaultBattlefieldProfileId": "standard-200-6-15mm",
  "sourceRefs": ["Rules.pdf#budget", "Army_list_spreadsheet_V4 (1).xlsx#Standard format (200 pts)"]
}
```

## Army List JSON Schema

Draft shape:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://adg-online.local/schemas/army-list.schema.json",
  "type": "object",
  "required": ["schemaVersion", "listId", "name", "period", "command", "entries"],
  "properties": {
    "schemaVersion": { "type": "string" },
    "source": {
      "type": "object",
      "properties": {
        "document": { "type": "string" },
        "pageStart": { "type": "integer" },
        "pageEnd": { "type": "integer" },
        "verifiedBy": { "type": "string" },
        "verifiedAt": { "type": "string" }
      }
    },
    "listId": { "type": "integer", "minimum": 1 },
    "name": { "type": "string" },
    "period": { "type": "string" },
    "classification": {
      "type": "object",
      "properties": {
        "era": { "type": "string" },
        "regionGroup": { "type": "string" },
        "regions": { "type": "array", "items": { "type": "string" } }
      }
    },
    "dateRange": {
      "type": "object",
      "properties": {
        "start": { "type": "integer" },
        "end": { "type": "integer" },
        "calendar": { "enum": ["BC", "AD", "mixed"] }
      }
    },
    "terrain": {
      "type": "array",
      "items": { "type": "string" }
    },
    "command": {
      "type": "object",
      "required": ["value"],
      "properties": {
        "value": { "type": "integer" },
        "strategists": { "type": "array", "items": { "type": "string" } },
        "notes": { "type": "array", "items": { "type": "string" } }
      }
    },
    "entries": {
      "type": "array",
      "items": { "$ref": "#/$defs/unitEntry" }
    },
    "allies": {
      "type": "array",
      "items": { "$ref": "#/$defs/allyOption" }
    },
    "notes": { "type": "array", "items": { "type": "string" } }
  },
  "$defs": {
    "unitEntry": {
      "type": "object",
      "required": ["entryId", "label", "troopType", "points", "limits"],
      "properties": {
        "entryId": { "type": "string" },
        "groupLabel": { "type": "string" },
        "label": { "type": "string" },
        "troopType": { "type": "string" },
        "quality": { "enum": ["Mediocre", "Ordinary", "Elite", "Variable"] },
        "points": { "type": "integer" },
        "limits": {
          "type": "object",
          "required": ["min", "max"],
          "properties": {
            "min": { "type": "integer", "minimum": 0 },
            "max": { "type": ["integer", "string"] },
            "scope": { "enum": ["army", "corps", "option", "dateWindow", "ally"] }
          }
        },
        "abilities": { "type": "array", "items": { "type": "string" } },
        "upgrades": { "type": "array", "items": { "$ref": "#/$defs/upgrade" } },
        "replacements": { "type": "array", "items": { "$ref": "#/$defs/replacement" } },
        "requires": { "type": "array", "items": { "$ref": "#/$defs/condition" } },
        "forbids": { "type": "array", "items": { "$ref": "#/$defs/condition" } },
        "sourceNote": { "type": "string" }
      }
    },
    "upgrade": {
      "type": "object",
      "required": ["upgradeId", "label", "pointsDelta"],
      "properties": {
        "upgradeId": { "type": "string" },
        "label": { "type": "string" },
        "pointsDelta": { "type": "integer" },
        "max": { "type": ["integer", "string"] },
        "addsAbilities": { "type": "array", "items": { "type": "string" } },
        "setsQuality": { "type": "string" },
        "conditions": { "type": "array", "items": { "$ref": "#/$defs/condition" } }
      }
    },
    "replacement": {
      "type": "object",
      "required": ["replacementId", "replaceEntryId", "withEntryId"],
      "properties": {
        "replacementId": { "type": "string" },
        "replaceEntryId": { "type": "string" },
        "withEntryId": { "type": "string" },
        "ratio": { "type": "string" },
        "minAffected": { "type": "integer" },
        "maxAffected": { "type": ["integer", "string"] },
        "conditions": { "type": "array", "items": { "$ref": "#/$defs/condition" } }
      }
    },
    "allyOption": {
      "type": "object",
      "required": ["allyListId", "name"],
      "properties": {
        "allyListId": { "type": "integer" },
        "name": { "type": "string" },
        "dateRange": { "type": "object" },
        "mandatory": { "type": "boolean" },
        "conditions": { "type": "array", "items": { "$ref": "#/$defs/condition" } }
      }
    },
    "condition": {
      "type": "object",
      "required": ["type", "value"],
      "properties": {
        "type": { "type": "string" },
        "value": {}
      }
    }
  }
}
```

## Example Army List Fragment

This is illustrative data shape, not verified production data:

```json
{
  "schemaVersion": "0.1.0",
  "listId": 1,
  "name": "Sumer and Akkad",
  "period": "Ancient",
  "classification": {
    "era": "Ancient Period",
    "regionGroup": "Sumer and Babylon",
    "regions": ["Plain"]
  },
  "dateRange": { "start": -3000, "end": -2004, "calendar": "BC" },
  "terrain": ["Plain"],
  "command": { "value": 4, "strategists": ["King Agga", "Sargon of Akkad"] },
  "entries": [
    {
      "entryId": "four-wheeled-battle-cars",
      "label": "4-wheeled battle cars",
      "troopType": "heavy-chariot",
      "quality": "Ordinary",
      "points": 9,
      "limits": { "min": 2, "max": 4, "scope": "army" },
      "abilities": [],
      "upgrades": [
        { "upgradeId": "elite", "label": "Upgrade to elite", "pointsDelta": 2, "max": 4 }
      ]
    }
  ],
  "notes": ["Data must be verified against the printed army list before use."]
}
```

## Roster JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://adg-online.local/schemas/roster.schema.json",
  "type": "object",
  "required": ["schemaVersion", "formatId", "armyListId", "corps"],
  "properties": {
    "schemaVersion": { "type": "string" },
    "formatId": { "type": "string" },
    "armyListId": { "type": "integer" },
    "selectedDate": { "type": "integer" },
    "selectedOptions": { "type": "array", "items": { "type": "string" } },
    "commanders": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["commanderId", "quality", "corpsId"],
        "properties": {
          "commanderId": { "type": "string" },
          "name": { "type": "string" },
          "quality": { "enum": ["Unreliable", "Ordinary", "Competent", "Brilliant", "Strategist"] },
          "corpsId": { "type": "string" },
          "includedInUnitId": { "type": ["string", "null"] }
        }
      }
    },
    "corps": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["corpsId", "unitSelections"],
        "properties": {
          "corpsId": { "type": "string" },
          "commanderId": { "type": "string" },
          "unitSelections": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["selectionId", "entryId", "quantity"],
              "properties": {
                "selectionId": { "type": "string" },
                "entryId": { "type": "string" },
                "quantity": { "type": "integer", "minimum": 0 },
                "upgradeIds": { "type": "array", "items": { "type": "string" } },
                "replacementIds": { "type": "array", "items": { "type": "string" } }
              }
            }
          }
        }
      }
    },
    "camp": {
      "type": "object",
      "properties": {
        "type": { "enum": ["standard", "fortified", "sacred"] },
        "fortifications": { "type": "integer", "minimum": 0 },
        "obstacles": { "type": "integer", "minimum": 0 }
      }
    },
    "allies": { "type": "array", "items": { "type": "object" } }
  }
}
```

## Point Calculation

Point calculation is a pure function over roster selections and format rules.

```text
totalPoints = commanderPoints
            + campPoints
            + fortificationPoints
            + obstaclePoints
            + sum(unit quantity * finalUnitCost)
            + allyCosts
```

Final unit cost is:

```text
base troop cost + selected upgrade deltas + replacement cost changes
```

Validation must distinguish:

- budget overrun;
- missing minimum unit count;
- exceeding maximum unit count;
- illegal upgrade quantity;
- illegal date or option dependency;
- invalid ally choice;
- invalid commander quality or strategist selection;
- illegal camp/fortification/obstacle selection;
- format-specific restrictions.

## Unit Limits

Limits must support:

- fixed ranges such as `0-4`, `2-8`, or `1-3`;
- `All` replacement requirements;
- `max half`, `max one third`, or similar proportional limits;
- max values shared across several entries;
- date-dependent min/max changes;
- option-dependent replacements;
- allied corps reduced min/max rules;
- format-dependent list minima/maxima for 100/200/300 point games.

Represent shared and derived limits as named constraint objects, not comments.

```json
{
  "constraintId": "elite-chariots-total-max-4",
  "type": "sumMax",
  "entryIds": ["light-chariot-bow-elite", "heavy-chariot-impact-elite"],
  "max": 4,
  "explanation": "Only a combined maximum of 4 chariots may be upgraded to elite."
}
```

## Errata Overlay Strategy

Errata should be a patch layer loaded after base list data.

```json
{
  "schemaVersion": "0.1.0",
  "errataId": "adg-v4-2024-02",
  "patches": [
    {
      "target": { "listId": 48, "entryId": "light-chariots" },
      "operation": "replace",
      "path": "/points",
      "value": 7,
      "source": "Errata_ADG_V4_English.pdf"
    }
  ]
}
```

Patch operations should include `add`, `replace`, `remove`, and `appendNote`. Applied patches must be visible in validation explanations.

## Extension Strategy

Adding a new army later requires only data changes:

1. Add a JSON file under the correct period folder.
2. Add or update entries in `index.json`.
3. Add source verification metadata.
4. Add errata overlay patches if needed.
5. Run schema validation.
6. Run roster validation tests for minimum, maximum, all-upgrade, over-budget, ally, and date cases.
7. Review with AdG-Rules-Engine-Agent before making it selectable.

No engine module should be edited to add a new army.

## Import Pipeline

The source PDFs are not reliably text-extractable, so P8 should use a cautious import pipeline:

1. Render source pages for the target army lists.
2. OCR or manually transcribe troop tables.
3. Normalize troop labels against the canonical unit catalog.
4. Encode min/max, options, replacements, allies, dates, and notes as JSON.
5. Apply errata overlays.
6. Validate with schemas.
7. Compare totals against the spreadsheet calculator.
8. Human-review each list before marking it verified.

## Army Builder UI Model

The UI should be compact and validation-driven:

- format selector;
- army search and period filters;
- date/option selector;
- corps tabs;
- commander controls;
- unit rows with quantity steppers and upgrade toggles;
- live points summary;
- validation panel with rule explanations;
- export button enabled only for legal rosters.

The UI should never contain army-specific conditional logic. It reads schema-driven controls and displays validation results.

## Test Strategy

Army builder tests must include:

- schema validation for every army file;
- point total tests from spreadsheet fixtures;
- min/max boundary tests for each entry;
- replacement and upgrade exclusivity tests;
- date option tests;
- ally selection tests;
- errata patch application tests;
- export-to-game setup tests.

## P8 Definition Of Done

- At least one fully verified army list exists as JSON.
- Roster validation catches min, max, points, date, upgrade, and ally violations.
- Points match spreadsheet expectations for selected fixtures.
- UI can create a legal roster without hardcoded list logic.
- Illegal roster explanations cite data constraints and source metadata.
