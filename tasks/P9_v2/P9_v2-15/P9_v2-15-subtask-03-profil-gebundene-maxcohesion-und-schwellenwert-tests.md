# Subtask - Profil-getriebene maxCohesion-Bindung und Rout-Schwellenwert-Tests

## Goal
- Sicherstellen, dass die `maxCohesion`-Werte aus den unit-profiles deterministisch in das `cohesionAccount`-Modell übernommen werden, und testen, dass die `remainingCohesion`-Schwellenwerte korrekte Status-Übergänge (`good-order` → `disordered` → `routed-pending-removal`) auslösen.

## Scope
- Nur die Integration der Profildaten (`defaultCohesion`) aus `src/data/unit-profiles.js` in `cohesionAccount` bei Initialisierung.
- Nur Tests für profilgesteuerte Schwellenwertlogik: Verlust führt zu `disordered`, Totalverlust zu `routed-pending-removal`.
- Keine UI-Änderungen, keine Marker-Rendering.

## Files
- src/data/unit-profiles.js (ggf. Konsistenzprüfung)
- src/state/p0-state.js (Bindung bei `initializeUnitCohesion`)
- src/state/p0-state-cohesion.test.js (neu, fokussiert auf Schwellenwerte)

## Steps
1. Stelle sicher, dass `initializeUnitCohesion(unit, profile)` in `p0-state.js` die `maxCohesion` aus dem Profil extrahiert (z. B. `profile.cohesion.defaultCohesion`) und in `cohesionAccount.maxCohesion` schreibt.
2. Initialisiere `remainingCohesion = maxCohesion` und `status = 'good-order'`.
3. Implementiere eine Hilfsfunktion `checkAndUpdateStatus(unitId)`, die bei jeder committed Änderung die Schwellenwerte prüft:
   - `remainingCohesion / maxCohesion` Verhältnis: z. B. <= 0.5 → `disordered`; == 0 → `routed-pending-removal`.
   - Diese Schwellenwerte basieren auf den Regelquellen (markieren als *source-open* falls nicht abschließend geklärt).
4. Schreibe Tests in `src/state/p0-state-cohesion.test.js`:
   - a) Initialisierung mit verschiedenen Profilen liefert korrekte `maxCohesion`.
   - b) `queueDelta` + `commitBatch` lässt `remainingCohesion` unter 50 % → Status wird `disordered`.
   - c) `remainingCohesion` auf 0 → Status wird `routed-pending-removal`.
   - d) Von `routed-pending-removal` kann kein weiterer Cohesion-Verlust eintreten.
5. Logge Profil-Bindungsfehler auf `error`-Level und Schwellenwert-Übergänge auf `debug`-Level.

## Validation
- `node --test src/state/p0-state-cohesion.test.js` – alle Tests bestehen.
- `node --test src/data/unit-profiles.test.js` – existierende Profiltests weiterhin erfolgreich.

## Stop condition
- Stoppen, wenn ein Profil keinen deterministischen `defaultCohesion`-Wert liefert (z. B. Commander ohne Quelle).
- Stoppen, wenn Schwellenwerte nicht zweifelsfrei aus Regelquellen ableitbar sind (dann als *source-open* kennzeichnen und weitere Arbeit blockieren).

## Status
- todo