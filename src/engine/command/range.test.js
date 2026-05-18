import test from 'node:test';
import assert from 'node:assert/strict';

import { degreesToRadians } from '../geometry/index.js';
import {
  evaluateCommandRange,
  getFootprintCommandRangeMeasurement,
  getGroupCommandRangeMeasurement,
} from './index.js';

test('circle commander measures to nearest point on a rectangle base', () => {
  const measurement = getFootprintCommandRangeMeasurement(
    { xUd: 0, yUd: 0, widthUd: 1, depthUd: 1, rotationRadians: 0, baseShape: 'circle' },
    { xUd: 4, yUd: 0, widthUd: 1, depthUd: 0.75, rotationRadians: 0, baseShape: 'rectangle' },
  );

  assert.equal(Number(measurement.distanceUd.toFixed(3)), 3);
  assert.deepEqual(measurement.sourcePoint, { x: 0.5, y: 0 });
  assert.deepEqual(measurement.targetPoint, { x: 3.5, y: 0 });
});

test('rectangle commander uses nearest-point straight line to a rotated rectangle target', () => {
  const measurement = getFootprintCommandRangeMeasurement(
    { xUd: 0, yUd: 0, widthUd: 1, depthUd: 0.75, rotationRadians: 0, baseShape: 'rectangle' },
    { xUd: 3, yUd: 1, widthUd: 1, depthUd: 1, rotationRadians: degreesToRadians(45), baseShape: 'rectangle' },
  );

  assert.ok(measurement.distanceUd > 1.4);
  assert.ok(measurement.distanceUd < 2.5);
});

test('group measurement picks the nearest unit deterministically', () => {
  const commander = {
    id: 'general-1',
    xUd: 0,
    yUd: 0,
    widthUd: 1,
    depthUd: 1,
    rotationRadians: 0,
    baseShape: 'circle',
  };
  const measurement = getGroupCommandRangeMeasurement(commander, [
    {
      id: 'unit-far',
      xUd: 8,
      yUd: 0,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
      baseShape: 'rectangle',
    },
    {
      id: 'unit-near',
      xUd: 3,
      yUd: 0,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
      baseShape: 'rectangle',
    },
  ]);

  assert.equal(measurement.targetUnitId, 'unit-near');
  assert.equal(Number(measurement.distanceUd.toFixed(3)), 2);
});

test('command range evaluation treats the exact boundary as out of range', () => {
  const evaluation = evaluateCommandRange(
    {
      id: 'general-1',
      xUd: 0,
      yUd: 0,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
      baseShape: 'circle',
      commandRangeUd: 3,
    },
    {
      id: 'unit-1',
      xUd: 4,
      yUd: 0,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
      baseShape: 'rectangle',
    },
  );

  assert.equal(Number(evaluation.distanceUd.toFixed(3)), 3);
  assert.equal(evaluation.inRange, false);
});

test('command range evaluation treats just-inside distance as in range', () => {
  const evaluation = evaluateCommandRange(
    {
      id: 'general-1',
      xUd: 0,
      yUd: 0,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
      baseShape: 'circle',
      commandRangeUd: 3,
    },
    {
      id: 'unit-1',
      xUd: 3.99,
      yUd: 0,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
      baseShape: 'rectangle',
    },
  );

  assert.ok(evaluation.distanceUd < 3);
  assert.equal(evaluation.inRange, true);
});

test('overlapping footprints report zero command distance', () => {
  const measurement = getFootprintCommandRangeMeasurement(
    { xUd: 0, yUd: 0, widthUd: 1, depthUd: 1, rotationRadians: 0, baseShape: 'circle' },
    { xUd: 0.4, yUd: 0, widthUd: 1, depthUd: 1, rotationRadians: 0, baseShape: 'rectangle' },
  );

  assert.equal(measurement.distanceUd, 0);
});