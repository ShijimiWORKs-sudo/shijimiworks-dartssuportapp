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
  PracticeRecord,
  PracticeRecordInput,
  UserProfile,
} from '../types';

const schemaVersion = 1;
const appStateStorageKey = 'DartsSupportApp:appState';
const profileStorageKey = 'DartsSupportApp:userProfile';
const recordsStorageKey = 'DartsSupportApp:practiceRecords';

type AppStateContextValue = {
  isLoading: boolean;
  profile: UserProfile | null;
  records: PracticeRecord[];
  saveProfile: (profile: Omit<UserProfile, 'level'>) => Promise<void>;
  addPracticeRecord: (record: PracticeRecordInput) => Promise<void>;
  updatePracticeRecord: (id: string, record: PracticeRecordInput) => Promise<void>;
  deletePracticeRecord: (id: string) => Promise<void>;
  getRecordById: (id: string) => PracticeRecord | null;
  getWeeklyPracticeCount: () => number;
  getLatestRecord: () => PracticeRecord | null;
  getAnalysisSummary: () => AnalysisSummary;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<PracticeRecord[]>([]);

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

        if (!storedAppState) {
          await persistAppState(migratedState.profile, migratedState.records);
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

  const saveProfile = useCallback(
    async (profileInput: Omit<UserProfile, 'level'>) => {
      const nextProfile: UserProfile = {
        ...profileInput,
        level: getLevelFromRating(profileInput.rating),
      };

      setProfile(nextProfile);
      await persistAppState(nextProfile, records);
    },
    [records],
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
      await persistAppState(profile, nextRecords);
    },
    [profile, records],
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
      await persistAppState(profile, nextRecords);
    },
    [profile, records],
  );

  const deletePracticeRecord = useCallback(
    async (id: string) => {
      const nextRecords = records.filter((record) => record.id !== id);
      setRecords(nextRecords);
      await persistAppState(profile, nextRecords);
    },
    [profile, records],
  );

  const getRecordById = useCallback(
    (id: string) => records.find((record) => record.id === id) ?? null,
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
      saveProfile,
      addPracticeRecord,
      updatePracticeRecord,
      deletePracticeRecord,
      getRecordById,
      getWeeklyPracticeCount,
      getLatestRecord,
      getAnalysisSummary,
    }),
    [
      isLoading,
      profile,
      records,
      saveProfile,
      addPracticeRecord,
      updatePracticeRecord,
      deletePracticeRecord,
      getRecordById,
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

async function persistAppState(profile: UserProfile | null, records: PracticeRecord[]) {
  const appState: AppState = {
    schemaVersion,
    profile,
    records: sortRecords(records),
  };

  await AsyncStorage.setItem(appStateStorageKey, JSON.stringify(appState));
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
    };
  }

  const parsedState = JSON.parse(storedAppState) as Partial<AppState>;

  if (parsedState.schemaVersion === schemaVersion) {
    return {
      schemaVersion,
      profile: parsedState.profile ?? null,
      records: sortRecords(parsedState.records ?? []),
    };
  }

  return {
    schemaVersion,
    profile: parsedState.profile ?? legacyState.profile,
    records: sortRecords(parsedState.records ?? legacyState.records),
  };
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
