import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getLevelFromRating } from '../constants/levels';
import type {
  AnalysisSummary,
  AppState,
  LegacyStoredState,
  PracticeFilterState,
  PracticeRecord,
  PracticeRecordInput,
  UserProfile,
} from '../types';

const schemaVersion = 2;
const appStateStorageKey = 'DartsSupportApp:appState';
const profileStorageKey = 'DartsSupportApp:userProfile';
const recordsStorageKey = 'DartsSupportApp:practiceRecords';

export const defaultPracticeFilterState: PracticeFilterState = {
  level: 'all',
  machineType: 'all',
  gameType: 'all',
  problemTag: null,
};

type AppStateContextValue = {
  isLoading: boolean;
  profile: UserProfile | null;
  records: PracticeRecord[];
  favoritePracticeMenuIds: string[];
  practiceFilterState: PracticeFilterState;
  saveProfile: (profile: Omit<UserProfile, 'level'>) => Promise<void>;
  addPracticeRecord: (record: PracticeRecordInput) => Promise<void>;
  updatePracticeRecord: (id: string, record: PracticeRecordInput) => Promise<void>;
  deletePracticeRecord: (id: string) => Promise<void>;
  toggleFavoritePracticeMenu: (id: string) => Promise<void>;
  isFavoritePracticeMenu: (id: string) => boolean;
  savePracticeFilterState: (filterState: PracticeFilterState) => Promise<void>;
  resetPracticeFilterState: () => Promise<void>;
  getRecordById: (id: string) => PracticeRecord | null;
  getRecordsByPracticeMenuId: (id: string) => PracticeRecord[];
  getWeeklyPracticeCount: () => number;
  getLatestRecord: () => PracticeRecord | null;
  getAnalysisSummary: () => AnalysisSummary;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [favoritePracticeMenuIds, setFavoritePracticeMenuIds] = useState<string[]>([]);
  const [practiceFilterState, setPracticeFilterState] = useState<PracticeFilterState>(
    defaultPracticeFilterState,
  );

  useEffect(() => {
    let mounted = true;

    async function loadStoredState() {
      try {
        const [storedAppState, storedProfile, storedRecords] = await Promise.all([
          AsyncStorage.getItem(appStateStorageKey),
          AsyncStorage.getItem(profileStorageKey),
          AsyncStorage.getItem(recordsStorageKey),
        ]);

        if (!mounted) {
          return;
        }

        const migratedState = migrateAppState(storedAppState, {
          profile: storedProfile ? (JSON.parse(storedProfile) as UserProfile) : null,
          records: storedRecords ? (JSON.parse(storedRecords) as PracticeRecord[]) : [],
        });

        setProfile(migratedState.profile);
        setRecords(sortRecords(migratedState.records));
        setFavoritePracticeMenuIds(migratedState.favoritePracticeMenuIds);
        setPracticeFilterState(migratedState.practiceFilterState);

        if (!storedAppState || JSON.parse(storedAppState).schemaVersion !== schemaVersion) {
          await persistAppState(migratedState);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStoredState();

    return () => {
      mounted = false;
    };
  }, []);

  const persistCurrentState = useCallback(
    async (overrides: Partial<Omit<AppState, 'schemaVersion'>>) => {
      const nextState: AppState = {
        schemaVersion,
        profile,
        records,
        favoritePracticeMenuIds,
        practiceFilterState,
        ...overrides,
      };

      await persistAppState(nextState);
    },
    [favoritePracticeMenuIds, practiceFilterState, profile, records],
  );

  const saveProfile = useCallback(
    async (profileInput: Omit<UserProfile, 'level'>) => {
      const nextProfile: UserProfile = {
        ...profileInput,
        level: getLevelFromRating(profileInput.rating),
      };

      setProfile(nextProfile);
      await persistCurrentState({ profile: nextProfile });
    },
    [persistCurrentState],
  );

  const addPracticeRecord = useCallback(
    async (recordInput: PracticeRecordInput) => {
      const nextRecord: PracticeRecord = {
        ...recordInput,
        id: `${Date.now()}`,
        date: new Date().toISOString(),
      };

      const nextRecords = sortRecords([nextRecord, ...records]);
      setRecords(nextRecords);
      await persistCurrentState({ records: nextRecords });
    },
    [persistCurrentState, records],
  );

  const updatePracticeRecord = useCallback(
    async (id: string, recordInput: PracticeRecordInput) => {
      const currentRecord = records.find((record) => record.id === id);

      if (!currentRecord) {
        return;
      }

      const nextRecords = sortRecords(
        records.map((record) =>
          record.id === id
            ? {
                ...recordInput,
                id,
                date: currentRecord.date,
              }
            : record,
        ),
      );

      setRecords(nextRecords);
      await persistCurrentState({ records: nextRecords });
    },
    [persistCurrentState, records],
  );

  const deletePracticeRecord = useCallback(
    async (id: string) => {
      const nextRecords = records.filter((record) => record.id !== id);
      setRecords(nextRecords);
      await persistCurrentState({ records: nextRecords });
    },
    [persistCurrentState, records],
  );

  const toggleFavoritePracticeMenu = useCallback(
    async (id: string) => {
      const nextIds = isFavoritePracticeMenuId(favoritePracticeMenuIds, id)
        ? favoritePracticeMenuIds.filter((favoriteId) => favoriteId !== id)
        : [...favoritePracticeMenuIds, id];

      setFavoritePracticeMenuIds(nextIds);
      await persistCurrentState({ favoritePracticeMenuIds: nextIds });
    },
    [favoritePracticeMenuIds, persistCurrentState],
  );

  const isFavoritePracticeMenu = useCallback(
    (id: string) => isFavoritePracticeMenuId(favoritePracticeMenuIds, id),
    [favoritePracticeMenuIds],
  );

  const savePracticeFilterState = useCallback(
    async (filterState: PracticeFilterState) => {
      const nextFilterState = normalizePracticeFilterState(filterState);
      setPracticeFilterState(nextFilterState);
      await persistCurrentState({ practiceFilterState: nextFilterState });
    },
    [persistCurrentState],
  );

  const resetPracticeFilterState = useCallback(async () => {
    setPracticeFilterState(defaultPracticeFilterState);
    await persistCurrentState({ practiceFilterState: defaultPracticeFilterState });
  }, [persistCurrentState]);

  const getRecordById = useCallback(
    (id: string) => records.find((record) => record.id === id) ?? null,
    [records],
  );

  const getRecordsByPracticeMenuId = useCallback(
    (id: string) => records.filter((record) => record.practiceMenuId === id),
    [records],
  );

  const getWeeklyPracticeCount = useCallback(() => {
    const weekStart = getStartOfWeek(new Date());

    return records.filter((record) => new Date(record.date) >= weekStart).length;
  }, [records]);

  const getLatestRecord = useCallback(() => records[0] ?? null, [records]);

  const getAnalysisSummary = useCallback(() => buildAnalysisSummary(records), [records]);

  const value = useMemo(
    () => ({
      isLoading,
      profile,
      records,
      favoritePracticeMenuIds,
      practiceFilterState,
      saveProfile,
      addPracticeRecord,
      updatePracticeRecord,
      deletePracticeRecord,
      toggleFavoritePracticeMenu,
      isFavoritePracticeMenu,
      savePracticeFilterState,
      resetPracticeFilterState,
      getRecordById,
      getRecordsByPracticeMenuId,
      getWeeklyPracticeCount,
      getLatestRecord,
      getAnalysisSummary,
    }),
    [
      isLoading,
      profile,
      records,
      favoritePracticeMenuIds,
      practiceFilterState,
      saveProfile,
      addPracticeRecord,
      updatePracticeRecord,
      deletePracticeRecord,
      toggleFavoritePracticeMenu,
      isFavoritePracticeMenu,
      savePracticeFilterState,
      resetPracticeFilterState,
      getRecordById,
      getRecordsByPracticeMenuId,
      getWeeklyPracticeCount,
      getLatestRecord,
      getAnalysisSummary,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return context;
}

async function persistAppState(appState: AppState) {
  await AsyncStorage.setItem(
    appStateStorageKey,
    JSON.stringify({
      ...appState,
      records: sortRecords(appState.records),
      practiceFilterState: normalizePracticeFilterState(appState.practiceFilterState),
    }),
  );
}

export function migrateAppState(
  storedAppState: string | null,
  legacyState: LegacyStoredState,
): AppState {
  if (!storedAppState) {
    return {
      schemaVersion,
      profile: legacyState.profile,
      records: sortRecords(legacyState.records),
      favoritePracticeMenuIds: legacyState.favoritePracticeMenuIds ?? [],
      practiceFilterState: normalizePracticeFilterState(legacyState.practiceFilterState),
    };
  }

  const parsedState = JSON.parse(storedAppState) as Partial<AppState> & {
    schemaVersion?: number;
  };

  if (parsedState.schemaVersion === schemaVersion) {
    return {
      schemaVersion,
      profile: parsedState.profile ?? null,
      records: sortRecords(parsedState.records ?? []),
      favoritePracticeMenuIds: parsedState.favoritePracticeMenuIds ?? [],
      practiceFilterState: normalizePracticeFilterState(parsedState.practiceFilterState),
    };
  }

  return {
    schemaVersion,
    profile: parsedState.profile ?? legacyState.profile,
    records: sortRecords(parsedState.records ?? legacyState.records),
    favoritePracticeMenuIds: parsedState.favoritePracticeMenuIds ?? [],
    practiceFilterState: normalizePracticeFilterState(parsedState.practiceFilterState),
  };
}

function normalizePracticeFilterState(filterState?: PracticeFilterState): PracticeFilterState {
  return {
    level: filterState?.level ?? defaultPracticeFilterState.level,
    machineType: filterState?.machineType ?? defaultPracticeFilterState.machineType,
    gameType: filterState?.gameType ?? defaultPracticeFilterState.gameType,
    problemTag: filterState?.problemTag ?? defaultPracticeFilterState.problemTag,
  };
}

function isFavoritePracticeMenuId(favoritePracticeMenuIds: string[], id: string) {
  return favoritePracticeMenuIds.includes(id);
}

function sortRecords(records: PracticeRecord[]) {
  return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildAnalysisSummary(records: PracticeRecord[]): AnalysisSummary {
  if (records.length === 0) {
    return {
      practiceCount: 0,
      countUpAverageScore: null,
      averageBullCount: null,
      latestPracticeDate: null,
      latestRecord: null,
      chartValues: [],
      improvementComment: 'まだ記録がありません。まずは1回分の練習を保存しましょう。',
      nextPracticeTitle: 'ブル位置確認 COUNT-UP',
    };
  }

  const countUpRecords = records.filter((record) => record.gameType === 'COUNT-UP');
  const countUpAverageScore =
    countUpRecords.length > 0
      ? Math.round(average(countUpRecords.map((record) => record.score)))
      : null;
  const averageBullCount = Math.round(average(records.map((record) => record.bullCount)));
  const recentScores = [...records]
    .reverse()
    .slice(-7)
    .map((record) => record.score);
  const latestRecord = records[0];

  return {
    practiceCount: records.length,
    countUpAverageScore,
    averageBullCount,
    latestPracticeDate: latestRecord.date,
    latestRecord,
    chartValues: buildChartValues(recentScores),
    improvementComment: buildImprovementComment(records, countUpAverageScore, averageBullCount),
    nextPracticeTitle: buildNextPracticeTitle(records, averageBullCount),
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildChartValues(scores: number[]) {
  if (scores.length === 0) {
    return [];
  }

  const maxScore = Math.max(...scores, 1);
  return scores.map((score) => Math.max(16, Math.round((score / maxScore) * 104)));
}

function buildImprovementComment(
  records: PracticeRecord[],
  countUpAverageScore: number | null,
  averageBullCount: number,
) {
  const latestScore = records[0]?.score ?? 0;
  const previousScore = records[1]?.score ?? latestScore;

  if (records.length < 3) {
    return '練習回数がまだ少なめです。週3回の短時間練習で傾向を見えるようにしましょう。';
  }

  if (averageBullCount < 8) {
    return 'ブル数が少なめです。次回はCOUNT-UPでブル練習を優先しましょう。';
  }

  if (countUpAverageScore !== null && latestScore >= previousScore) {
    return 'COUNT-UP平均が上向きです。現在の練習を継続しつつ、記録メモも残しましょう。';
  }

  return 'スコアより再現性を優先して、フォームメモとブル数をセットで確認しましょう。';
}

function buildNextPracticeTitle(records: PracticeRecord[], averageBullCount: number) {
  if (records.length < 3 || averageBullCount < 8) {
    return 'ブル位置確認 COUNT-UP';
  }

  const hasCricket = records.some((record) => record.gameType === 'CRICKET');
  return hasCricket ? '19カバードリル' : 'Cricket Count-Up確認';
}
