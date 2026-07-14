import type {
  ActivePracticeSession,
  Condition,
  TodayPracticeItem,
  TodayPracticeStatus,
} from '../../../../types';
import { createUuidV4 } from '../../../account/application/accountService';

export type AddTodayPracticeInput = {
  accountId?: string;
  practiceMenuId: string;
  practiceDate?: string;
  plannedDurationMinutes?: number;
  plannedRounds?: number;
  plannedSets?: number;
  note?: string;
  now?: string;
};

export type CompleteTodayPracticeInput = {
  actualDurationSeconds: number;
  completedRounds?: number;
  completedSets?: number;
  resultScore?: number;
  resultBullCount?: number;
  resultCondition?: Condition;
  achievementRate?: number;
  note?: string;
  nextMemo?: string;
  now?: string;
};

export type TodayPracticeProgress = {
  plannedCount: number;
  completedCount: number;
  inProgressCount: number;
  cancelledCount: number;
  totalPlannedDurationMinutes: number;
  totalActualDurationSeconds: number;
  countProgressRate: number;
  timeProgressRate: number;
  nextItem: TodayPracticeItem | null;
};

const activeStatuses: TodayPracticeStatus[] = ['planned', 'in_progress', 'paused'];

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isVisibleForAccount(
  item: Pick<TodayPracticeItem, 'accountId'>,
  activeAccountId: string | null,
) {
  return activeAccountId ? item.accountId === activeAccountId || !item.accountId : !item.accountId;
}

export function getTodayPracticeItems(
  items: TodayPracticeItem[],
  practiceDate = getLocalDateKey(),
  activeAccountId: string | null = null,
) {
  return sortTodayPracticeItemsForDisplay(
    items.filter(
      (item) => item.practiceDate === practiceDate && isVisibleForAccount(item, activeAccountId),
    ),
  );
}

export function sortTodayPracticeItemsForDisplay(items: TodayPracticeItem[]) {
  return [...items].sort((a, b) => {
    const aDone = a.status === 'completed' || a.status === 'cancelled';
    const bDone = b.status === 'completed' || b.status === 'cancelled';

    if (aDone !== bDone) {
      return aDone ? 1 : -1;
    }

    return a.order - b.order;
  });
}

export function calculateTodayPracticeProgress(items: TodayPracticeItem[]): TodayPracticeProgress {
  const targetItems = items.filter((item) => item.status !== 'cancelled');
  const plannedCount = targetItems.length;
  const completedCount = targetItems.filter((item) => item.status === 'completed').length;
  const inProgressCount = items.filter(
    (item) => item.status === 'in_progress' || item.status === 'paused',
  ).length;
  const cancelledCount = items.filter((item) => item.status === 'cancelled').length;
  const totalPlannedDurationMinutes = targetItems.reduce(
    (total, item) => total + item.plannedDurationMinutes,
    0,
  );
  const totalActualDurationSeconds = targetItems.reduce(
    (total, item) => total + item.actualDurationSeconds,
    0,
  );
  const nextItem =
    sortTodayPracticeItemsForDisplay(items).find((item) => activeStatuses.includes(item.status)) ??
    null;

  return {
    plannedCount,
    completedCount,
    inProgressCount,
    cancelledCount,
    totalPlannedDurationMinutes,
    totalActualDurationSeconds,
    countProgressRate: plannedCount === 0 ? 0 : Math.round((completedCount / plannedCount) * 100),
    timeProgressRate:
      totalPlannedDurationMinutes === 0
        ? 0
        : Math.min(
            100,
            Math.round((totalActualDurationSeconds / (totalPlannedDurationMinutes * 60)) * 100),
          ),
    nextItem,
  };
}

export function addTodayPracticeItem(
  items: TodayPracticeItem[],
  input: AddTodayPracticeInput,
): TodayPracticeItem {
  const now = input.now ?? new Date().toISOString();
  const practiceDate = input.practiceDate ?? getLocalDateKey(new Date(now));
  const scopedOrders = items
    .filter(
      (item) =>
        item.practiceDate === practiceDate &&
        (input.accountId ? item.accountId === input.accountId : !item.accountId),
    )
    .map((item) => item.order);

  return {
    id: createUuidV4(),
    accountId: input.accountId,
    practiceMenuId: input.practiceMenuId,
    practiceDate,
    order: scopedOrders.length === 0 ? 1 : Math.max(...scopedOrders) + 1,
    status: 'planned',
    plannedDurationMinutes: clampPositiveInteger(input.plannedDurationMinutes, 20),
    actualDurationSeconds: 0,
    plannedRounds: normalizeOptionalInteger(input.plannedRounds),
    plannedSets: normalizeOptionalInteger(input.plannedSets),
    note: normalizeOptionalText(input.note),
    createdAt: now,
    updatedAt: now,
  };
}

export function reorderTodayPracticeItem(
  items: TodayPracticeItem[],
  id: string,
  direction: 'up' | 'down' | 'first' | 'last',
) {
  const target = items.find((item) => item.id === id);

  if (!target || target.status === 'completed' || target.status === 'cancelled') {
    return items;
  }

  const movableItems = items
    .filter(
      (item) =>
        item.practiceDate === target.practiceDate &&
        item.accountId === target.accountId &&
        item.status !== 'completed' &&
        item.status !== 'cancelled',
    )
    .sort((a, b) => a.order - b.order);
  const currentIndex = movableItems.findIndex((item) => item.id === id);

  if (currentIndex < 0) {
    return items;
  }

  const nextItems = [...movableItems];
  const [removed] = nextItems.splice(currentIndex, 1);
  const nextIndex = getNextIndex(currentIndex, nextItems.length, direction);
  nextItems.splice(nextIndex, 0, removed);
  const orderMap = new Map(nextItems.map((item, index) => [item.id, index + 1]));
  const now = new Date().toISOString();

  return items.map((item) =>
    orderMap.has(item.id)
      ? { ...item, order: orderMap.get(item.id) ?? item.order, updatedAt: now }
      : item,
  );
}

export function getRunningPracticeSession(
  sessions: ActivePracticeSession[],
  activeAccountId: string | null,
) {
  return (
    sessions.find(
      (session) =>
        session.state === 'running' &&
        (activeAccountId ? session.accountId === activeAccountId : !session.accountId),
    ) ?? null
  );
}

export function startPracticeSession(input: {
  items: TodayPracticeItem[];
  sessions: ActivePracticeSession[];
  todayPracticeItemId: string;
  activeAccountId: string | null;
  pauseExisting?: boolean;
  now?: string;
}) {
  const now = input.now ?? new Date().toISOString();
  const targetItem = input.items.find((item) => item.id === input.todayPracticeItemId);

  if (!targetItem) {
    return input;
  }

  const existingRunning = getRunningPracticeSession(input.sessions, input.activeAccountId);

  if (existingRunning && existingRunning.todayPracticeItemId !== input.todayPracticeItemId) {
    if (!input.pauseExisting) {
      return input;
    }

    const paused = pausePracticeSession({
      items: input.items,
      sessions: input.sessions,
      todayPracticeItemId: existingRunning.todayPracticeItemId,
      now,
    });

    return startPracticeSession({
      ...input,
      items: paused.items,
      sessions: paused.sessions,
      pauseExisting: false,
      now,
    });
  }

  const currentSession = input.sessions.find(
    (session) => session.todayPracticeItemId === input.todayPracticeItemId,
  );
  const session: ActivePracticeSession = currentSession
    ? { ...currentSession, state: 'running', lastResumedAt: now }
    : {
        id: createUuidV4(),
        todayPracticeItemId: input.todayPracticeItemId,
        accountId: targetItem.accountId,
        startedAt: targetItem.startedAt ?? now,
        lastResumedAt: now,
        accumulatedSeconds: 0,
        state: 'running',
      };

  return {
    items: input.items.map((item) =>
      item.id === input.todayPracticeItemId
        ? {
            ...item,
            status: 'in_progress' as const,
            startedAt: item.startedAt ?? now,
            pausedAt: undefined,
            updatedAt: now,
          }
        : item,
    ),
    sessions: [session, ...input.sessions.filter((item) => item.id !== session.id)],
  };
}

export function pausePracticeSession(input: {
  items: TodayPracticeItem[];
  sessions: ActivePracticeSession[];
  todayPracticeItemId: string;
  now?: string;
}) {
  const now = input.now ?? new Date().toISOString();

  return {
    items: input.items.map((item) =>
      item.id === input.todayPracticeItemId
        ? { ...item, status: 'paused' as const, pausedAt: now, updatedAt: now }
        : item,
    ),
    sessions: input.sessions.map((session) =>
      session.todayPracticeItemId === input.todayPracticeItemId && session.state === 'running'
        ? {
            ...session,
            accumulatedSeconds: calculateSessionElapsedSeconds(session, now),
            state: 'paused' as const,
          }
        : session,
    ),
  };
}

export function resumePracticeSession(input: {
  items: TodayPracticeItem[];
  sessions: ActivePracticeSession[];
  todayPracticeItemId: string;
  now?: string;
}) {
  const now = input.now ?? new Date().toISOString();

  return {
    items: input.items.map((item) =>
      item.id === input.todayPracticeItemId
        ? { ...item, status: 'in_progress' as const, pausedAt: undefined, updatedAt: now }
        : item,
    ),
    sessions: input.sessions.map((session) =>
      session.todayPracticeItemId === input.todayPracticeItemId
        ? { ...session, state: 'running' as const, lastResumedAt: now }
        : session,
    ),
  };
}

export function completePracticeSession(input: {
  items: TodayPracticeItem[];
  sessions: ActivePracticeSession[];
  todayPracticeItemId: string;
  result: CompleteTodayPracticeInput;
}) {
  const now = input.result.now ?? new Date().toISOString();

  return {
    items: input.items.map((item) =>
      item.id === input.todayPracticeItemId
        ? {
            ...item,
            status: 'completed' as const,
            actualDurationSeconds: Math.max(0, Math.floor(input.result.actualDurationSeconds)),
            completedRounds: normalizeOptionalInteger(input.result.completedRounds),
            completedSets: normalizeOptionalInteger(input.result.completedSets),
            resultScore: normalizeOptionalInteger(input.result.resultScore),
            resultBullCount: normalizeOptionalInteger(input.result.resultBullCount),
            resultCondition: input.result.resultCondition,
            achievementRate: clampPercent(input.result.achievementRate),
            note: normalizeOptionalText(input.result.note) ?? item.note,
            nextMemo: normalizeOptionalText(input.result.nextMemo),
            completedAt: now,
            updatedAt: now,
          }
        : item,
    ),
    sessions: input.sessions.filter(
      (session) => session.todayPracticeItemId !== input.todayPracticeItemId,
    ),
  };
}

export function cancelPracticeSession(input: {
  items: TodayPracticeItem[];
  sessions: ActivePracticeSession[];
  todayPracticeItemId: string;
  keepElapsed: boolean;
  now?: string;
}) {
  const now = input.now ?? new Date().toISOString();
  const session = input.sessions.find(
    (item) => item.todayPracticeItemId === input.todayPracticeItemId,
  );
  const elapsed = session ? calculateSessionElapsedSeconds(session, now) : 0;

  return {
    items: input.items.map((item) =>
      item.id === input.todayPracticeItemId
        ? {
            ...item,
            status: 'cancelled' as const,
            actualDurationSeconds: input.keepElapsed ? elapsed : item.actualDurationSeconds,
            cancelledAt: now,
            updatedAt: now,
          }
        : item,
    ),
    sessions: input.sessions.filter(
      (item) => item.todayPracticeItemId !== input.todayPracticeItemId,
    ),
  };
}

export function calculateSessionElapsedSeconds(session: ActivePracticeSession, nowIso?: string) {
  if (session.state === 'paused') {
    return Math.max(0, Math.floor(session.accumulatedSeconds));
  }

  const now = nowIso ? new Date(nowIso).getTime() : Date.now();
  const lastResumedAt = new Date(session.lastResumedAt).getTime();
  const elapsedSinceResume = Number.isFinite(lastResumedAt)
    ? Math.max(0, Math.floor((now - lastResumedAt) / 1000))
    : 0;

  return Math.max(0, Math.floor(session.accumulatedSeconds + elapsedSinceResume));
}

export function adjustCounter(value: number | undefined, delta: number) {
  return Math.max(0, (value ?? 0) + delta);
}

function getNextIndex(
  currentIndex: number,
  remainingLength: number,
  direction: 'up' | 'down' | 'first' | 'last',
) {
  switch (direction) {
    case 'first':
      return 0;
    case 'last':
      return remainingLength;
    case 'up':
      return Math.max(0, currentIndex - 1);
    case 'down':
      return Math.min(remainingLength, currentIndex + 1);
  }
}

function clampPositiveInteger(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function normalizeOptionalInteger(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : undefined;
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

function clampPercent(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(100, Math.floor(value)));
}
