
---
name: ADG Global
---

- Work in small, explicit steps.
- Never invent game rules or source facts.

- Rules hierarchy:
  - Errata > Rules PDF > source docs > project docs
  - If unclear → mark as source-open, do NOT guess

- Always separate:
  - engine logic
  - state
  - UI
  - data
  - tests

- Prefer small, focused changes over broad refactors.

- Always state:
  - result
  - current status (done / blocked / needs review)
  - next exact step

- === Task / Card Workflow ===

- Work ONLY via tasks ("Arbeitskarten").
- Never work on undefined scope.

- Each task must:
  - have a clear goal
  - define scope
  - define affected files
  - define validation

- Large TODO files MUST NOT be processed fully.
- Always extract a single task before working.

- Task files must:
  - live in /tasks/<phase>/
  - be referenced by full path (@file)
  - be small and self-contained


- Task extraction naming rules:

- Task IDs follow pattern: P<phase>V<version>-<number> (e.g. P9V2-15)

- From a task ID, derive:
  - phase folder: p<phase>v<version> → p9v2
  - task folder: lowercase task id → p9v2-15
  - task file: same as folder → p9v2-15.md

- Final path format:
  tasks/<phase>/<task-folder>/<task-file>

Example:
P9V2-15 → tasks/p9v2/p9v2-15/p9v2-15.md

- Never guess paths if task ID is unclear
- Ask or mark blocked instead

- === Context usage ===

- Prefer @file, @currentFile over large inputs.
- Do NOT load full boards into context.

- === Platform ===

- The user is on Windows.
- Do not use Linux/macOS terminal commands.
