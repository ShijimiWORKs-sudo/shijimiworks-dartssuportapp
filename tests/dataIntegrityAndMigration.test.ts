import assert from 'node:assert/strict';
import test from 'node:test';

import { defaultPracticeFilterState, migrateAppState } from '../utils/appStateMigration';
import { createConsultHistory } from '../utils/createConsultHistory';
import { validateDataIntegrity } from '../utils/validateDataIntegrity';
import { buildProfile, buildRecord } from './testHelpers';

test('validateDataIntegrity passes for bundled constants', () => {
  const result = validateDataIntegrity();

  assert.equal(result.isValid, true, result.errors.join('\n'));
  assert.deepEqual(result.errors, []);
});

test('migrateAppState upgrades schemaVersion 1 data to schemaVersion 3', () => {
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

  assert.equal(migrated.schemaVersion, 3);
  assert.deepEqual(migrated.favoritePracticeMenuIds, []);
  assert.deepEqual(migrated.practiceFilterState, defaultPracticeFilterState);
  assert.deepEqual(migrated.consultHistories, []);
  assert.deepEqual(migrated.profile, profile);
  assert.equal(migrated.records.length, 1);
});

test('migrateAppState upgrades schemaVersion 2 data and preserves existing fields', () => {
  const profile = buildProfile();
  const record = buildRecord();
  const migrated = migrateAppState(
    JSON.stringify({
      schemaVersion: 2,
      profile,
      records: [record],
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
  assert.deepEqual(migrated.profile, profile);
  assert.equal(migrated.records[0]?.id, record.id);
  assert.deepEqual(migrated.consultHistories, []);
});

test('migrateAppState falls back for broken stored data without crashing', () => {
  const legacyProfile = buildProfile({ rating: 5, level: 'beginner' });
  const legacyRecord = buildRecord({ id: 'legacy' });
  const migrated = migrateAppState('{broken json', {
    profile: legacyProfile,
    records: [legacyRecord],
  });

  assert.equal(migrated.schemaVersion, 3);
  assert.deepEqual(migrated.profile, legacyProfile);
  assert.equal(migrated.records[0]?.id, 'legacy');
  assert.deepEqual(migrated.practiceFilterState, defaultPracticeFilterState);
  assert.deepEqual(migrated.consultHistories, []);
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
  assert.deepEqual(migrated.consultHistories, []);
});

test('createConsultHistory builds a history with required fields', () => {
  const history = createConsultHistory({
    category: 'release',
    severity: 'normal',
    userText: 'リリースで指に引っかかる',
    result: {
      mainAdvice: [
        {
          id: 'release-003',
          category: 'release',
          title: '指離れがばらつく',
          problemKeywords: ['指'],
          symptoms: [],
          possibleCauses: [],
          adviceSummary: '確認します。',
          checkPoints: [],
          recommendedPracticeMenuIds: [],
          relatedKnowledgeIds: [],
        },
      ],
      causes: ['力み'],
      checkPoints: ['手の残り方を見る'],
      recommendedPracticeMenus: [
        {
          id: 'intermediate-release-line',
          title: 'リリースライン再現',
          level: 'intermediate',
          machineTypes: ['BOTH'],
          gameTypes: ['COUNT-UP'],
          targetProblems: ['リリースが抜ける'],
          durationMinutes: 12,
          purpose: '腕の出る方向をそろえる。',
          steps: [],
          recordItems: [],
          evaluationPoints: [],
          adviceText: '',
          difficulty: 3,
          tags: [],
        },
      ],
      relatedArticles: [
        {
          id: 'kb-release-line',
          category: 'release',
          title: 'リリースラインの見方',
          summary: '',
          body: '',
          tags: [],
          relatedPracticeMenuIds: [],
          relatedAdviceIds: [],
        },
      ],
      cautionText: '無理をしないでください。',
      nextAction: '短く確認する',
    },
  });

  assert.equal(history.category, 'release');
  assert.equal(history.severity, 'normal');
  assert.equal(history.mainAdvice, '指離れがばらつく');
  assert.deepEqual(history.recommendedPracticeMenuIds, ['intermediate-release-line']);
  assert.deepEqual(history.relatedKnowledgeIds, ['kb-release-line']);
});
