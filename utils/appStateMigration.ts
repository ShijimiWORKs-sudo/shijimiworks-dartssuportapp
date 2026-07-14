import type {
  AppState,
  ActivePracticeSession,
  BackgroundTheme,
  BoardReferenceImage,
  CommonOutboxItem,
  ConsultHistory,
  FormPhotoAdviceResult,
  LegacyStoredState,
  LocalAccount,
  PracticeFilterState,
  PracticeRecord,
  TodayPracticeItem,
  UiTheme,
} from '../types';
import { defaultBackgroundTheme, defaultUiTheme } from '../constants/theme';
import { sortFormPhotoAdviceHistories } from './formPhotoAdviceHistory';

export const schemaVersion = 11;
export const defaultTodayPracticeDurationMinutes = 20;

export const defaultPracticeFilterState: PracticeFilterState = {
  level: 'all',
  machineType: 'all',
  gameType: 'all',
  problemTag: null,
};

export function migrateAppState(
  storedAppState: string | null,
  legacyState: LegacyStoredState,
): AppState {
  const parsedState = parseStoredAppState(storedAppState);

  if (!parsedState) {
    return {
      schemaVersion,
      accounts: sortAccounts(legacyState.accounts ?? []),
      activeAccountId: safeActiveAccountId(legacyState.activeAccountId),
      accountLockEnabled: legacyState.accountLockEnabled ?? false,
      commonOutbox: sortCommonOutbox(legacyState.commonOutbox ?? []),
      todayPracticeItems: sortTodayPracticeItems(legacyState.todayPracticeItems ?? []),
      activePracticeSessions: sortActivePracticeSessions(legacyState.activePracticeSessions ?? []),
      todayPracticeDefaultDurationMinutes: safePositiveNumber(
        legacyState.todayPracticeDefaultDurationMinutes,
        defaultTodayPracticeDurationMinutes,
      ),
      profile: legacyState.profile,
      records: sortRecords(legacyState.records),
      favoritePracticeMenuIds: legacyState.favoritePracticeMenuIds ?? [],
      practiceFilterState: normalizePracticeFilterState(legacyState.practiceFilterState),
      consultHistories: sortConsultHistories(legacyState.consultHistories ?? []),
      formPhotoAdviceResults: sortFormPhotoAdviceHistories(
        legacyState.formPhotoAdviceResults ?? [],
      ),
      boardReferenceImages: sortBoardReferenceImages(legacyState.boardReferenceImages ?? []),
      uiTheme: safeUiTheme(legacyState.uiTheme),
      backgroundTheme: safeBackgroundTheme(legacyState.backgroundTheme),
    };
  }

  return {
    schemaVersion,
    accounts: sortAccounts(safeAccounts(parsedState.accounts)),
    activeAccountId: safeActiveAccountId(parsedState.activeAccountId),
    accountLockEnabled: parsedState.accountLockEnabled === true,
    commonOutbox: sortCommonOutbox(safeCommonOutbox(parsedState.commonOutbox)),
    todayPracticeItems: sortTodayPracticeItems(
      safeTodayPracticeItems(parsedState.todayPracticeItems),
    ),
    activePracticeSessions: sortActivePracticeSessions(
      safeActivePracticeSessions(parsedState.activePracticeSessions),
    ),
    todayPracticeDefaultDurationMinutes: safePositiveNumber(
      parsedState.todayPracticeDefaultDurationMinutes,
      defaultTodayPracticeDurationMinutes,
    ),
    profile: parsedState.profile ?? legacyState.profile,
    records: sortRecords(safeRecords(parsedState.records, legacyState.records)),
    favoritePracticeMenuIds: safeStringArray(parsedState.favoritePracticeMenuIds),
    practiceFilterState: normalizePracticeFilterState(parsedState.practiceFilterState),
    consultHistories: sortConsultHistories(safeConsultHistories(parsedState.consultHistories)),
    formPhotoAdviceResults: sortFormPhotoAdviceHistories(
      safeFormPhotoAdviceResults(parsedState.formPhotoAdviceResults),
    ),
    boardReferenceImages: sortBoardReferenceImages(
      safeBoardReferenceImages(parsedState.boardReferenceImages),
    ),
    uiTheme: safeUiTheme(parsedState.uiTheme),
    backgroundTheme: safeBackgroundTheme(parsedState.backgroundTheme),
  };
}

export function normalizePracticeFilterState(
  filterState?: PracticeFilterState,
): PracticeFilterState {
  return {
    level: filterState?.level ?? defaultPracticeFilterState.level,
    machineType: filterState?.machineType ?? defaultPracticeFilterState.machineType,
    gameType: filterState?.gameType ?? defaultPracticeFilterState.gameType,
    problemTag: filterState?.problemTag ?? defaultPracticeFilterState.problemTag,
  };
}

function parseStoredAppState(storedAppState: string | null) {
  if (!storedAppState) {
    return null;
  }

  try {
    return JSON.parse(storedAppState) as Partial<AppState> & {
      schemaVersion?: number;
    };
  } catch {
    return null;
  }
}

function safeRecords(
  records: PracticeRecord[] | undefined,
  fallbackRecords: PracticeRecord[],
): PracticeRecord[] {
  return Array.isArray(records) ? records : fallbackRecords;
}

function safeStringArray(value: string[] | undefined) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function safeConsultHistories(value: ConsultHistory[] | undefined) {
  return Array.isArray(value) ? value : [];
}

function safeFormPhotoAdviceResults(value: FormPhotoAdviceResult[] | undefined) {
  return Array.isArray(value) ? value : [];
}

function safeBoardReferenceImages(value: BoardReferenceImage[] | undefined) {
  return Array.isArray(value) ? value.filter(isBoardReferenceImageLike) : [];
}

function safeAccounts(value: LocalAccount[] | undefined) {
  return Array.isArray(value) ? value.filter(isLocalAccountLike) : [];
}

function safeCommonOutbox(value: CommonOutboxItem[] | undefined) {
  return Array.isArray(value) ? value.filter(isCommonOutboxItemLike) : [];
}

function safeTodayPracticeItems(value: TodayPracticeItem[] | undefined) {
  return Array.isArray(value) ? value.filter(isTodayPracticeItemLike) : [];
}

function safeActivePracticeSessions(value: ActivePracticeSession[] | undefined) {
  return Array.isArray(value) ? value.filter(isActivePracticeSessionLike) : [];
}

function safePositiveNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function safeActiveAccountId(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function safeUiTheme(value: unknown): UiTheme {
  return value === 'light' || value === 'gray' ? value : defaultUiTheme;
}

function safeBackgroundTheme(value: unknown): BackgroundTheme {
  return value === 'black' ||
    value === 'brown' ||
    value === 'purple' ||
    value === 'orange' ||
    value === 'white'
    ? value
    : defaultBackgroundTheme;
}

function sortRecords(records: PracticeRecord[]) {
  return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function sortConsultHistories(histories: ConsultHistory[]) {
  return [...histories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function sortBoardReferenceImages(images: BoardReferenceImage[]) {
  return [...images].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function sortAccounts(accounts: LocalAccount[]) {
  return [...accounts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function sortCommonOutbox(items: CommonOutboxItem[]) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function sortTodayPracticeItems(items: TodayPracticeItem[]) {
  return [...items].sort((a, b) => {
    if (a.practiceDate !== b.practiceDate) {
      return b.practiceDate.localeCompare(a.practiceDate);
    }

    return a.order - b.order;
  });
}

function sortActivePracticeSessions(items: ActivePracticeSession[]) {
  return [...items].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

function isBoardReferenceImageLike(value: BoardReferenceImage) {
  return Boolean(
    value &&
    typeof value.id === 'string' &&
    typeof value.imageUri === 'string' &&
    typeof value.createdAt === 'string' &&
    value.calibration &&
    value.boardType === value.calibration.boardType,
  );
}

function isLocalAccountLike(value: LocalAccount) {
  return Boolean(
    value &&
    value.schemaVersion === 1 &&
    typeof value.accountId === 'string' &&
    typeof value.userName === 'string' &&
    typeof value.displayName === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string',
  );
}

function isCommonOutboxItemLike(value: CommonOutboxItem) {
  return Boolean(
    value &&
    typeof value.outboxId === 'string' &&
    typeof value.accountId === 'string' &&
    typeof value.createdAt === 'string' &&
    value.eventVersion === 1,
  );
}

function isTodayPracticeItemLike(value: TodayPracticeItem) {
  return Boolean(
    value &&
    typeof value.id === 'string' &&
    typeof value.practiceMenuId === 'string' &&
    typeof value.practiceDate === 'string' &&
    typeof value.order === 'number' &&
    typeof value.status === 'string' &&
    typeof value.plannedDurationMinutes === 'number' &&
    typeof value.actualDurationSeconds === 'number' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string',
  );
}

function isActivePracticeSessionLike(value: ActivePracticeSession) {
  return Boolean(
    value &&
    typeof value.id === 'string' &&
    typeof value.todayPracticeItemId === 'string' &&
    typeof value.startedAt === 'string' &&
    typeof value.lastResumedAt === 'string' &&
    typeof value.accumulatedSeconds === 'number' &&
    (value.state === 'running' || value.state === 'paused'),
  );
}
