import assert from 'node:assert/strict';
import test from 'node:test';

import { defaultPracticeFilterState, migrateAppState } from '../utils/appStateMigration';
import { validateDataIntegrity } from '../utils/validateDataIntegrity';
import { buildProfile, buildRecord } from './testHelpers';

test('validateDataIntegrity passes for bundled constants', () => {
  const result = validateDataIntegrity();

  assert.equal(result.isValid, true, result.errors.join('\n'));
  assert.deepEqual(result.errors, []);
});

test('migrateAppState upgrades schemaVersion 1 data to schemaVersion 2', () => {
  const profile = buildProfile();
  const record = buildRecord();
  const migrated = migrateAppState(
    JSON.stringify({
      schemaVersion: 1,
      profile,
      records: [record],
    }),
    {
      profile: null,
      records: [],
    },
  );

  assert.equal(migrated.schemaVersion, 2);
  assert.deepEqual(migrated.favoritePracticeMenuIds, []);
  assert.deepEqual(migrated.practiceFilterState, defaultPracticeFilterState);
  assert.deepEqual(migrated.profile, profile);
  assert.equal(migrated.records.length, 1);
});

test('migrateAppState preserves existing favorites and filters when present', () => {
  const migrated = migrateAppState(
    JSON.stringify({
      schemaVersion: 2,
      profile: buildProfile(),
      records: [],
      favoritePracticeMenuIds: ['beginner-bull-count-up-12'],
      practiceFilterState: {
        level: 'beginner',
        machineType: 'PHOENIX',
        gameType: 'COUNT-UP',
        problemTag: 'ブル練習',
      },
    }),
    {
      profile: null,
      records: [],
    },
  );

  assert.deepEqual(migrated.favoritePracticeMenuIds, ['beginner-bull-count-up-12']);
  assert.equal(migrated.practiceFilterState.level, 'beginner');
  assert.equal(migrated.practiceFilterState.machineType, 'PHOENIX');
});

test('migrateAppState falls back for broken stored data without crashing', () => {
  const legacyProfile = buildProfile({ rating: 5, level: 'beginner' });
  const legacyRecord = buildRecord({ id: 'legacy' });
  const migrated = migrateAppState('{broken json', {
    profile: legacyProfile,
    records: [legacyRecord],
  });

  assert.equal(migrated.schemaVersion, 2);
  assert.deepEqual(migrated.profile, legacyProfile);
  assert.equal(migrated.records[0]?.id, 'legacy');
  assert.deepEqual(migrated.practiceFilterState, defaultPracticeFilterState);
});

test('migrateAppState fills missing fields from safe defaults', () => {
  const migrated = migrateAppState(
    JSON.stringify({
      schemaVersion: 2,
      records: 'not-records',
      favoritePracticeMenuIds: 'not-array',
    }),
    {
      profile: null,
      records: [buildRecord({ id: 'fallback-record' })],
    },
  );

  assert.equal(migrated.records[0]?.id, 'fallback-record');
  assert.deepEqual(migrated.favoritePracticeMenuIds, []);
  assert.deepEqual(migrated.practiceFilterState, defaultPracticeFilterState);
});
