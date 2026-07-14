import assert from 'node:assert/strict';
import test from 'node:test';

import type { ActivePracticeSession, TodayPracticeItem } from '../types';
import {
  addTodayPracticeItem,
  calculateSessionElapsedSeconds,
  calculateTodayPracticeProgress,
  cancelPracticeSession,
  completePracticeSession,
  getTodayPracticeItems,
  pausePracticeSession,
  reorderTodayPracticeItem,
  resumePracticeSession,
  startPracticeSession,
} from '../features/practice/today/application/todayPracticeService';
import { defaultPracticeFilterState, migrateAppState } from '../utils/appStateMigration';

const accountId = '123e4567-e89b-42d3-a456-426614174000';

test('addTodayPracticeItem creates a planned item with order scoped by account and date', () => {
  const item = addTodayPracticeItem([], {
    accountId,
    practiceMenuId: 'beginner-bull-count-up-12',
    practiceDate: '2026-07-14',
    plannedDurationMinutes: 12,
    now: '2026-07-14T09:00:00.000Z',
  });

  assert.equal(item.accountId, accountId);
  assert.equal(item.status, 'planned');
  assert.equal(item.order, 1);
  assert.equal(item.plannedDurationMinutes, 12);
});

test('today practice progress handles empty and completed items without crashing', () => {
  const emptyProgress = calculateTodayPracticeProgress([]);
  const completedItem = buildTodayPracticeItem({
    status: 'completed',
    actualDurationSeconds: 900,
  });
  const progress = calculateTodayPracticeProgress([completedItem]);

  assert.equal(emptyProgress.countProgressRate, 0);
  assert.equal(progress.completedCount, 1);
  assert.equal(progress.totalActualDurationSeconds, 900);
  assert.equal(progress.countProgressRate, 100);
});

test('start, pause, resume, and complete practice session preserve elapsed seconds', () => {
  const item = buildTodayPracticeItem();
  const started = startPracticeSession({
    items: [item],
    sessions: [],
    todayPracticeItemId: item.id,
    activeAccountId: accountId,
    now: '2026-07-14T10:00:00.000Z',
  });
  const session = started.sessions[0] as ActivePracticeSession;

  assert.equal(started.items[0]?.status, 'in_progress');
  assert.equal(calculateSessionElapsedSeconds(session, '2026-07-14T10:05:00.000Z'), 300);

  const paused = pausePracticeSession({
    items: started.items,
    sessions: started.sessions,
    todayPracticeItemId: item.id,
    now: '2026-07-14T10:05:00.000Z',
  });
  assert.equal(paused.items[0]?.status, 'paused');
  assert.equal(paused.sessions[0]?.accumulatedSeconds, 300);

  const resumed = resumePracticeSession({
    items: paused.items,
    sessions: paused.sessions,
    todayPracticeItemId: item.id,
    now: '2026-07-14T10:06:00.000Z',
  });
  const completed = completePracticeSession({
    items: resumed.items,
    sessions: resumed.sessions,
    todayPracticeItemId: item.id,
    result: {
      actualDurationSeconds: 420,
      completedRounds: 3,
      resultScore: 420,
      resultBullCount: 12,
      resultCondition: 'good',
      achievementRate: 80,
      now: '2026-07-14T10:12:00.000Z',
    },
  });

  assert.equal(completed.items[0]?.status, 'completed');
  assert.equal(completed.items[0]?.actualDurationSeconds, 420);
  assert.equal(completed.items[0]?.completedRounds, 3);
  assert.equal(completed.items[0]?.achievementRate, 80);
  assert.equal(completed.sessions.length, 0);
});

test('startPracticeSession can pause an existing running session before starting another item', () => {
  const first = buildTodayPracticeItem({ id: 'item-1', order: 1 });
  const second = buildTodayPracticeItem({ id: 'item-2', order: 2 });
  const firstStarted = startPracticeSession({
    items: [first, second],
    sessions: [],
    todayPracticeItemId: first.id,
    activeAccountId: accountId,
    now: '2026-07-14T10:00:00.000Z',
  });
  const secondStarted = startPracticeSession({
    items: firstStarted.items,
    sessions: firstStarted.sessions,
    todayPracticeItemId: second.id,
    activeAccountId: accountId,
    pauseExisting: true,
    now: '2026-07-14T10:03:00.000Z',
  });

  assert.equal(secondStarted.items.find((item) => item.id === first.id)?.status, 'paused');
  assert.equal(secondStarted.items.find((item) => item.id === second.id)?.status, 'in_progress');
  assert.equal(
    secondStarted.sessions.find((session) => session.todayPracticeItemId === first.id)?.state,
    'paused',
  );
  assert.equal(
    secondStarted.sessions.find((session) => session.todayPracticeItemId === second.id)?.state,
    'running',
  );
});

test('reorderTodayPracticeItem only reorders active items for the same date and account', () => {
  const first = buildTodayPracticeItem({ id: 'item-1', order: 1 });
  const second = buildTodayPracticeItem({ id: 'item-2', order: 2 });
  const completed = buildTodayPracticeItem({ id: 'item-3', order: 3, status: 'completed' });
  const reordered = reorderTodayPracticeItem([first, second, completed], second.id, 'up');

  assert.equal(reordered.find((item) => item.id === second.id)?.order, 1);
  assert.equal(reordered.find((item) => item.id === first.id)?.order, 2);
  assert.equal(reordered.find((item) => item.id === completed.id)?.order, 3);
});

test('cancelPracticeSession can keep elapsed seconds and removes active session', () => {
  const item = buildTodayPracticeItem();
  const started = startPracticeSession({
    items: [item],
    sessions: [],
    todayPracticeItemId: item.id,
    activeAccountId: accountId,
    now: '2026-07-14T10:00:00.000Z',
  });
  const cancelled = cancelPracticeSession({
    items: started.items,
    sessions: started.sessions,
    todayPracticeItemId: item.id,
    keepElapsed: true,
    now: '2026-07-14T10:02:00.000Z',
  });

  assert.equal(cancelled.items[0]?.status, 'cancelled');
  assert.equal(cancelled.items[0]?.actualDurationSeconds, 120);
  assert.equal(cancelled.sessions.length, 0);
});

test('getTodayPracticeItems filters by date and active account while keeping legacy owner items visible', () => {
  const ownerItem = buildTodayPracticeItem({ id: 'owner-item', accountId: undefined });
  const accountItem = buildTodayPracticeItem({ id: 'account-item' });
  const otherDateItem = buildTodayPracticeItem({ id: 'other-date', practiceDate: '2026-07-15' });
  const visibleItems = getTodayPracticeItems(
    [ownerItem, accountItem, otherDateItem],
    '2026-07-14',
    accountId,
  );

  assert.deepEqual(
    visibleItems.map((item) => item.id),
    ['owner-item', 'account-item'],
  );
});

test('migrateAppState upgrades schemaVersion 10 data with today practice defaults', () => {
  const todayItem = buildTodayPracticeItem();
  const migrated = migrateAppState(
    JSON.stringify({
      schemaVersion: 10,
      accounts: [],
      activeAccountId: null,
      accountLockEnabled: false,
      commonOutbox: [],
      todayPracticeItems: [todayItem],
      activePracticeSessions: [],
      profile: null,
      records: [],
      favoritePracticeMenuIds: [],
      practiceFilterState: defaultPracticeFilterState,
      consultHistories: [],
      formPhotoAdviceResults: [],
      boardReferenceImages: [],
      uiTheme: 'gray',
      backgroundTheme: 'white',
    }),
    {
      profile: null,
      records: [],
    },
  );

  assert.equal(migrated.schemaVersion, 11);
  assert.equal(migrated.todayPracticeItems[0]?.id, todayItem.id);
  assert.deepEqual(migrated.activePracticeSessions, []);
  assert.equal(migrated.todayPracticeDefaultDurationMinutes, 20);
});

function buildTodayPracticeItem(overrides: Partial<TodayPracticeItem> = {}): TodayPracticeItem {
  return {
    id: 'today-item',
    accountId,
    practiceMenuId: 'beginner-bull-count-up-12',
    practiceDate: '2026-07-14',
    order: 1,
    status: 'planned',
    plannedDurationMinutes: 20,
    actualDurationSeconds: 0,
    createdAt: '2026-07-14T09:00:00.000Z',
    updatedAt: '2026-07-14T09:00:00.000Z',
    ...overrides,
  };
}
