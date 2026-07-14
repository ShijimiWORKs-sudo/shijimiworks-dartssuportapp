import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mapCommonImportAccount,
  mapCommonImportPracticeRecords,
  mergeImportedPracticeRecords,
  parseCommonImportJson,
} from '../features/account/application/commonContractImport';
import { buildRecord } from './testHelpers';

const accountId = '123e4567-e89b-42d3-a456-426614174000';
const otherAccountId = '323e4567-e89b-42d3-a456-426614174000';

function buildEnvelope(recordScore = 501) {
  return {
    contractName: 'darts_common_data',
    contractVersion: 1,
    accountId,
    payload: {
      account: {
        account_id: accountId,
        user_name: 'owner',
        display_name: 'Owner',
        email: 'owner@example.com',
        account_status: 'local_active',
        created_at: '2026-07-10T00:00:00.000Z',
        updated_at: '2026-07-10T00:00:00.000Z',
      },
      practice_records: [
        {
          record_id: 'record-1',
          source_record_id: 'record-1',
          account_id: accountId,
          game_type: 'COUNT_UP',
          machine_type: 'DARTSLIVE',
          played_at: '2026-07-11T00:00:00.000Z',
          score: recordScore,
          bull_count: 8,
          cricket_marks: 0,
          condition: 'good',
          memo: 'Imported practice',
        },
      ],
      consult_histories: [],
      form_photo_advice_results: [],
    },
  };
}

test('parseCommonImportJson previews valid common contract JSON', () => {
  const parsed = parseCommonImportJson(JSON.stringify(buildEnvelope()), null);

  assert.equal(parsed.isValid, true, parsed.errors.join('\n'));
  assert.equal(parsed.preview?.accountId, accountId);
  assert.equal(parsed.preview?.accountDisplayName, 'Owner');
  assert.equal(parsed.preview?.practiceRecordCount, 1);
  assert.equal(parsed.preview?.isDifferentAccount, false);
});

test('parseCommonImportJson detects different account preview', () => {
  const parsed = parseCommonImportJson(JSON.stringify(buildEnvelope()), otherAccountId);

  assert.equal(parsed.isValid, true, parsed.errors.join('\n'));
  assert.equal(parsed.preview?.isDifferentAccount, true);
});

test('parseCommonImportJson rejects broken JSON without throwing', () => {
  const parsed = parseCommonImportJson('{broken json', null);

  assert.equal(parsed.isValid, false);
  assert.equal(parsed.envelope, null);
  assert.match(parsed.errors.join('\n'), /JSON/);
});

test('mapCommonImportAccount imports as local no-auth account without PIN restoration', () => {
  const account = mapCommonImportAccount(buildEnvelope());

  assert.equal(account.accountId, accountId);
  assert.equal(account.displayName, 'Owner');
  assert.equal(account.authMode, 'local_no_auth');
  assert.equal(account.cloudAuthSubject, null);
});

test('mapCommonImportPracticeRecords converts common records into local practice records', () => {
  const records = mapCommonImportPracticeRecords(buildEnvelope(602));

  assert.equal(records.length, 1);
  assert.equal(records[0]?.id, 'record-1');
  assert.equal(records[0]?.accountId, accountId);
  assert.equal(records[0]?.gameType, 'COUNT-UP');
  assert.equal(records[0]?.score, 602);
});

test('mergeImportedPracticeRecords adds new, skips identical, and preserves conflicts', () => {
  const imported = mapCommonImportPracticeRecords(buildEnvelope(501));
  const identicalCurrent = imported[0];
  const conflictCurrent = buildRecord({
    id: 'record-1',
    accountId,
    score: 100,
  });
  const added = mergeImportedPracticeRecords([], imported);
  const skipped = mergeImportedPracticeRecords([identicalCurrent], imported);
  const conflicted = mergeImportedPracticeRecords([conflictCurrent], imported);

  assert.equal(added.result.recordAddedCount, 1);
  assert.equal(added.records.length, 1);
  assert.equal(skipped.result.skippedRecordCount, 1);
  assert.equal(skipped.records.length, 1);
  assert.equal(conflicted.result.conflictRecordCount, 1);
  assert.equal(conflicted.records[0]?.score, 100);
});
