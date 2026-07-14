import assert from 'node:assert/strict';
import test from 'node:test';

import type { CommonOutboxItem, LocalAccount } from '../types';
import {
  createCommonExportEnvelope,
  sanitizeExportValue,
  validateCommonImportEnvelope,
} from '../features/account/application/commonContractMapper';
import { buildProfile, buildRecord } from './testHelpers';

const account: LocalAccount = {
  schemaVersion: 1,
  accountId: '123e4567-e89b-42d3-a456-426614174000',
  userName: 'owner',
  displayName: 'Owner',
  email: null,
  accountStatus: 'local_active',
  authMode: 'local_pin',
  cloudAuthSubject: null,
  createdAt: '2026-07-10T00:00:00.000Z',
  updatedAt: '2026-07-10T00:00:00.000Z',
  deletedAt: null,
};

const outboxItem: CommonOutboxItem = {
  outboxId: '223e4567-e89b-42d3-a456-426614174000',
  eventType: 'practice_session_completed',
  eventVersion: 1,
  accountId: account.accountId,
  sourceRecordId: 'record-1',
  occurredAt: '2026-07-11T00:00:00.000Z',
  createdAt: '2026-07-11T00:00:00.000Z',
  syncStatus: 'local_only',
  payload: {
    practiceMenuName: 'Bull',
    pinHash: 'must-not-export',
    imageUri: 'file://must-not-export.jpg',
  },
};

test('createCommonExportEnvelope exports common contract v1 without secrets or image URIs', () => {
  const record = buildRecord({
    id: 'record-1',
    accountId: account.accountId,
    memo: 'local note',
    inputMethod: 'photoTap',
    photoScore: {
      imageUri: 'file://local-photo.jpg',
      boardType: 'DARTSLIVE_ZERO',
      calibration: {
        boardType: 'DARTSLIVE_ZERO',
        center: { x: 0.5, y: 0.5 },
        topNumberPoint: { x: 0.5, y: 0.1 },
        outerRadius: 0.4,
        ringPreset: 'soft',
      },
      hits: [],
      totalScore: 50,
      bullCount: 1,
      tripleCount: 0,
      doubleCount: 0,
    },
  });

  const envelope = createCommonExportEnvelope({
    account,
    profile: { ...buildProfile(), accountId: account.accountId },
    records: [record],
    consultHistories: [],
    formPhotoAdviceResults: [
      {
        id: 'form-photo-1',
        date: '2026-07-11T00:00:00.000Z',
        throwingHand: 'right',
        photos: [{ type: 'front', imageUri: 'file://front.jpg' }],
        selfCheck: {
          stanceFeelsStable: 'unknown',
          shoulderLineFeelsAligned: 'unknown',
          elbowHeightFeelsStable: 'unknown',
          releaseFeelsClean: 'unknown',
          followThroughGoesToTarget: 'unknown',
          bodyOpensEarly: 'unknown',
          gripFeelsTooStrong: 'unknown',
          feelsRushed: 'unknown',
        },
        adviceCategories: [],
        summaryText: 'summary',
        adviceTexts: [],
        checkPoints: [],
        recommendedPracticeMenuIds: [],
      },
    ],
    favoritePracticeMenuIds: [],
    practiceFilterState: {
      level: 'all',
      machineType: 'all',
      gameType: 'all',
      problemTag: null,
    },
    commonOutbox: [outboxItem],
    appVersion: '0.1.0',
  });
  const exportedText = JSON.stringify(envelope);

  assert.equal(envelope.contractName, 'darts_common_data');
  assert.equal(envelope.contractVersion, 1);
  assert.equal(envelope.sourceApp, 'darts_support_app');
  assert.equal(envelope.accountId, account.accountId);
  assert.equal(envelope.payload.account.account_id, account.accountId);
  assert.equal(envelope.payload.profile?.player_type, 'owner');
  assert.equal(envelope.payload.practice_records[0]?.account_id, account.accountId);
  assert.doesNotMatch(exportedText, /pinHash|must-not-export|imageUri|image_uri|file:\/\//);
});

test('sanitizeExportValue recursively removes secret-like keys', () => {
  const sanitized = sanitizeExportValue({
    keep: 'ok',
    pin: '1234',
    nested: {
      secureStoreKey: 'secret',
      tokenValue: 'token',
      imageUri: 'file://local.jpg',
    },
  }) as Record<string, unknown>;

  assert.equal(sanitized.keep, 'ok');
  assert.equal('pin' in sanitized, false);
  assert.deepEqual(sanitized.nested, {});
});

test('validateCommonImportEnvelope accepts valid common contract payload', () => {
  const result = validateCommonImportEnvelope({
    contractName: 'darts_common_data',
    contractVersion: 1,
    accountId: account.accountId,
    payload: {
      account: {
        account_id: account.accountId,
        user_name: 'owner',
        display_name: 'Owner',
      },
      practice_records: [],
    },
  });

  assert.equal(result.isValid, true, result.errors.join('\n'));
});

test('validateCommonImportEnvelope rejects invalid contract and secret payloads', () => {
  const result = validateCommonImportEnvelope({
    contractName: 'unknown',
    contractVersion: 99,
    accountId: 'not-uuid',
    payload: {
      account: {
        account_id: 'not-uuid',
      },
      practice_records: [],
      pinHash: 'secret',
    },
  });

  assert.equal(result.isValid, false);
  assert.match(result.errors.join('\n'), /contract/);
  assert.match(result.errors.join('\n'), /UUID/);
  assert.match(result.errors.join('\n'), /秘密情報/);
});
