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
import type { AnalysisSummary, PracticeRecord, PracticeRecordInput, UserProfile } from '../types';

const profileStorageKey = 'DartsSupportApp:userProfile';
const recordsStorageKey = 'DartsSupportApp:practiceRecords';

type AppStateContextValue = {
  isLoading: boolean;
  profile: UserProfile | null;
  records: PracticeRecord[];
  saveProfile: (profile: Omit<UserProfile, 'level'>) => Promise<void>;
  addPracticeRecord: (record: PracticeRecordInput) => Promise<void>;
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
        const [storedProfile, storedRecords] = await Promise.all([
          AsyncStorage.getItem(profileStorageKey),
          AsyncStorage.getItem(recordsStorageKey),
        ]);

        if (!mounted) {
          return;
        }

        if (storedProfile) {
          setProfile(JSON.parse(storedProfile) as UserProfile);
        }

        if (storedRecords) {
          const parsedRecords = JSON.parse(storedRecords) as PracticeRecord[];
          setRecords(sortRecords(parsedRecords));
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

  const saveProfile = useCallback(async (profileInput: Omit<UserProfile, 'level'>) => {
    const nextProfile: UserProfile = {
      ...profileInput,
      level: getLevelFromRating(profileInput.rating),
    };

    setProfile(nextProfile);
    await AsyncStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
  }, []);

  const addPracticeRecord = useCallback(
    async (recordInput: PracticeRecordInput) => {
      const nextRecord: PracticeRecord = {
        ...recordInput,
        id: `${Date.now()}`,
        date: new Date().toISOString(),
      };

      const nextRecords = sortRecords([nextRecord, ...records]);
      setRecords(nextRecords);
      await AsyncStorage.setItem(recordsStorageKey, JSON.stringify(nextRecords));
    },
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
