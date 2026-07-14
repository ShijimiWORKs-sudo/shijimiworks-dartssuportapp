import assert from 'node:assert/strict';
import test from 'node:test';

import type { LocalAccount } from '../types';
import {
  createCommonOutboxItem,
  createLocalAccount,
  deleteLocalAccount,
  isUuidV4,
  normalizeOptionalEmail,
  updateLocalAccount,
  validateAccountInput,
  validatePin,
} from '../features/account/application/accountService';

const baseAccount: LocalAccount = {
  schemaVersion: 1,
  accountId: '123e4567-e89b-42d3-a456-426614174000',
  userName: 'owner',
  displayName: 'Owner',
  email: 'owner@example.com',
  accountStatus: 'local_active',
  authMode: 'local_no_auth',
  cloudAuthSubject: null,
  createdAt: '2026-07-10T00:00:00.000Z',
  updatedAt: '2026-07-10T00:00:00.000Z',
  deletedAt: null,
};

test('createLocalAccount creates a UUID v4 local account without cloud auth', () => {
  const account = createLocalAccount(
    {
      userName: ' player_one ',
      displayName: ' Player One ',
      email: ' PLAYER@EXAMPLE.COM ',
      pinEnabled: true,
      now: '2026-07-11T00:00:00.000Z',
    },
    [],
  );

  assert.equal(isUuidV4(account.accountId), true);
  assert.equal(account.userName, 'player_one');
  assert.equal(account.displayName, 'Player One');
  assert.equal(account.email, 'player@example.com');
  assert.equal(account.accountStatus, 'local_active');
  assert.equal(account.authMode, 'local_pin');
  assert.equal(account.cloudAuthSubject, null);
});

test('validateAccountInput rejects duplicate active usernames', () => {
  const result = validateAccountInput(
    {
      userName: 'OWNER',
      displayName: 'Duplicate',
      email: 'duplicate@example.com',
    },
    [baseAccount],
  );

  assert.equal(result.isValid, false);
  assert.match(result.errors.join('\n'), /Account/);
});

test('updateLocalAccount preserves id and can switch auth mode', () => {
  const updated = updateLocalAccount(
    baseAccount,
    {
      displayName: 'New Owner',
      email: null,
      authMode: 'local_pin',
      now: '2026-07-12T00:00:00.000Z',
    },
    [baseAccount],
  );

  assert.equal(updated.accountId, baseAccount.accountId);
  assert.equal(updated.displayName, 'New Owner');
  assert.equal(updated.email, null);
  assert.equal(updated.authMode, 'local_pin');
  assert.equal(updated.updatedAt, '2026-07-12T00:00:00.000Z');
});

test('deleteLocalAccount marks local account deleted without removing identity', () => {
  const deleted = deleteLocalAccount(baseAccount, '2026-07-13T00:00:00.000Z');

  assert.equal(deleted.accountId, baseAccount.accountId);
  assert.equal(deleted.accountStatus, 'deleted');
  assert.equal(deleted.deletedAt, '2026-07-13T00:00:00.000Z');
});

test('validatePin accepts only 4 to 8 digit PIN values', () => {
  assert.equal(validatePin('1234'), true);
  assert.equal(validatePin('12345678'), true);
  assert.equal(validatePin('123'), false);
  assert.equal(validatePin('123456789'), false);
  assert.equal(validatePin('12a4'), false);
});

test('normalizeOptionalEmail trims, lowercases, and clears blank email', () => {
  assert.equal(normalizeOptionalEmail(' OWNER@EXAMPLE.COM '), 'owner@example.com');
  assert.equal(normalizeOptionalEmail('   '), null);
});

test('createCommonOutboxItem creates local-only common event metadata', () => {
  const outboxItem = createCommonOutboxItem({
    eventType: 'practice_session_completed',
    accountId: baseAccount.accountId,
    sourceRecordId: 'record-1',
    createdAt: '2026-07-14T00:00:00.000Z',
  });

  assert.equal(isUuidV4(outboxItem.outboxId), true);
  assert.equal(outboxItem.eventVersion, 1);
  assert.equal(outboxItem.syncStatus, 'local_only');
  assert.equal(outboxItem.sourceRecordId, 'record-1');
});
