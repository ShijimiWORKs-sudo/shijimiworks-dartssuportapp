import type { AppState, LegacyStoredState, PracticeFilterState, PracticeRecord } from '../types';

export const schemaVersion = 2;

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
      profile: legacyState.profile,
      records: sortRecords(legacyState.records),
      favoritePracticeMenuIds: legacyState.favoritePracticeMenuIds ?? [],
      practiceFilterState: normalizePracticeFilterState(legacyState.practiceFilterState),
    };
  }

  return {
    schemaVersion,
    profile: parsedState.profile ?? legacyState.profile,
    records: sortRecords(safeRecords(parsedState.records, legacyState.records)),
    favoritePracticeMenuIds: safeStringArray(parsedState.favoritePracticeMenuIds),
    practiceFilterState: normalizePracticeFilterState(parsedState.practiceFilterState),
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

function sortRecords(records: PracticeRecord[]) {
  return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
