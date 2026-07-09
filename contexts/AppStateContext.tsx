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
  PracticeFilterState,
  PracticeRecord,
  PracticeRecordInput,
  UserProfile,
} from '../types';
import { calculateAnalysisSummary } from '../utils/analyzePracticeRecords';
import {
  defaultPracticeFilterState,
  migrateAppState,
  normalizePracticeFilterState,
  schemaVersion,
} from '../utils/appStateMigration';

const appStateStorageKey = 'DartsSupportApp:appState';
const profileStorageKey = 'DartsSupportApp:userProfile';
const recordsStorageKey = 'DartsSupportApp:practiceRecords';

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

  const getAnalysisSummary = useCallback(
    () => calculateAnalysisSummary(records, 'all', profile),
    [profile, records],
  );

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
