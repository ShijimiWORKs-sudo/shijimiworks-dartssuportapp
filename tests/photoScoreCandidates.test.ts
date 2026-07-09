import assert from 'node:assert/strict';
import test from 'node:test';

import type { BoardCalibration } from '../types';
import { buildPhotoScoreHit, generatePhotoScoreCandidates } from '../utils/photoScoreCandidates';

const calibration: BoardCalibration = {
  boardType: 'DARTSLIVE_ZERO',
  center: { x: 0.5, y: 0.5 },
  topNumberPoint: { x: 0.5, y: 0.1 },
  outerRadius: 0.4,
  ringPreset: 'soft',
};

test('generatePhotoScoreCandidates returns selectable candidates in normalized bounds', () => {
  const candidates = generatePhotoScoreCandidates(calibration);

  assert.ok(candidates.length >= 6);
  candidates.forEach((candidate) => {
    assert.ok(candidate.point.x >= 0 && candidate.point.x <= 1);
    assert.ok(candidate.point.y >= 0 && candidate.point.y <= 1);
    assert.ok(candidate.confidence > 0 && candidate.confidence <= 1);
    assert.equal(candidate.selected, false);
  });
});

test('generatePhotoScoreCandidates marks selected candidate ids', () => {
  const candidates = generatePhotoScoreCandidates(calibration, ['candidate-bull']);
  const bullCandidate = candidates.find((candidate) => candidate.id === 'candidate-bull');

  assert.equal(bullCandidate?.selected, true);
});

test('buildPhotoScoreHit preserves auto candidate metadata', () => {
  const [candidate] = generatePhotoScoreCandidates(calibration);
  const hit = buildPhotoScoreHit(
    calibration,
    candidate.point,
    'dart-1',
    'autoCandidate',
    candidate,
  );

  assert.equal(hit.detectionSource, 'autoCandidate');
  assert.equal(hit.candidateId, candidate.id);
  assert.equal(hit.confidence, candidate.confidence);
});

test('buildPhotoScoreHit supports adjusted source', () => {
  const hit = buildPhotoScoreHit(calibration, { x: 0.52, y: 0.5 }, 'dart-1', 'adjusted');

  assert.equal(hit.detectionSource, 'adjusted');
  assert.equal(hit.id, 'dart-1');
});
