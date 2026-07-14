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
import {
  backgroundThemeColors,
  defaultBackgroundTheme,
  getOnBackgroundMutedTextColor,
  getOnBackgroundTextColor,
  type ThemeColors,
  themes,
} from '../constants/theme';
import { getPracticeMenuById } from '../constants/practiceMenus';
import type {
  ActivePracticeSession,
  AnalysisSummary,
  AppState,
  BackgroundTheme,
  BoardReferenceImage,
  BoardType,
  CommonOutboxItem,
  CommonOutboxEventType,
  ConsultHistory,
  DartMachine,
  FormPhotoAdviceResult,
  LocalAccount,
  PracticeFilterState,
  PracticeRecord,
  PracticeRecordInput,
  TodayPracticeItem,
  UiTheme,
  UserProfile,
} from '../types';
import {
  createCommonOutboxItem,
  createLocalAccount,
  deleteLocalAccount,
  type RegisterLocalAccountInput,
  updateLocalAccount,
  type UpdateLocalAccountInput,
} from '../features/account/application/accountService';
import {
  mapCommonImportAccount,
  mapCommonImportPracticeRecords,
  mergeImportedPracticeRecords,
  parseCommonImportJson,
  type CommonImportApplyResult,
} from '../features/account/application/commonContractImport';
import {
  deleteAccountPin,
  setAccountPin,
  verifyAccountPin,
} from '../features/account/application/pinService';
import { calculateAnalysisSummary } from '../utils/analyzePracticeRecords';
import {
  defaultPracticeFilterState,
  defaultTodayPracticeDurationMinutes,
  migrateAppState,
  normalizePracticeFilterState,
  schemaVersion,
} from '../utils/appStateMigration';
import {
  addFormPhotoAdviceHistory,
  deleteFormPhotoAdviceHistory,
  sortFormPhotoAdviceHistories,
} from '../utils/formPhotoAdviceHistory';
import {
  addTodayPracticeItem,
  calculateTodayPracticeProgress,
  cancelPracticeSession,
  completePracticeSession,
  getLocalDateKey,
  getRunningPracticeSession,
  getTodayPracticeItems,
  pausePracticeSession,
  reorderTodayPracticeItem,
  resumePracticeSession,
  startPracticeSession,
  type AddTodayPracticeInput,
  type CompleteTodayPracticeInput,
  type TodayPracticeProgress,
} from '../features/practice/today/application/todayPracticeService';

const appStateStorageKey = 'DartsSupportApp:appState';
const profileStorageKey = 'DartsSupportApp:userProfile';
const recordsStorageKey = 'DartsSupportApp:practiceRecords';

type AppStateContextValue = {
  isLoading: boolean;
  profile: UserProfile | null;
  records: PracticeRecord[];
  accounts: LocalAccount[];
  activeAccountId: string | null;
  accountLockEnabled: boolean;
  isAccountSessionLocked: boolean;
  commonOutbox: CommonOutboxItem[];
  todayPracticeItems: TodayPracticeItem[];
  activePracticeSessions: ActivePracticeSession[];
  todayPracticeDefaultDurationMinutes: number;
  favoritePracticeMenuIds: string[];
  practiceFilterState: PracticeFilterState;
  consultHistories: ConsultHistory[];
  formPhotoAdviceResults: FormPhotoAdviceResult[];
  boardReferenceImages: BoardReferenceImage[];
  uiTheme: UiTheme;
  backgroundTheme: BackgroundTheme;
  theme: ThemeColors;
  saveProfile: (profile: Omit<UserProfile, 'level'>) => Promise<void>;
  saveProfileAndUiTheme: (profile: Omit<UserProfile, 'level'>, uiTheme: UiTheme) => Promise<void>;
  saveProfileAndDisplaySettings: (
    profile: Omit<UserProfile, 'level'>,
    uiTheme: UiTheme,
    backgroundTheme: BackgroundTheme,
  ) => Promise<void>;
  saveUiTheme: (uiTheme: UiTheme) => Promise<void>;
  saveBackgroundTheme: (backgroundTheme: BackgroundTheme) => Promise<void>;
  registerLocalAccount: (input: RegisterLocalAccountInput, pin?: string) => Promise<LocalAccount>;
  updateLocalAccountProfile: (accountId: string, input: UpdateLocalAccountInput) => Promise<void>;
  deleteLocalAccountById: (accountId: string) => Promise<void>;
  setActiveLocalAccount: (accountId: string) => Promise<void>;
  enablePinLock: (accountId: string, pin: string) => Promise<void>;
  verifyPin: (accountId: string, pin: string) => Promise<boolean>;
  changePin: (accountId: string, oldPin: string, newPin: string) => Promise<boolean>;
  disablePinLock: (accountId: string, pin: string) => Promise<boolean>;
  lockSession: () => void;
  unlockSession: (accountId: string, pin: string) => Promise<boolean>;
  importCommonEnvelopeJson: (jsonText: string) => Promise<CommonImportApplyResult>;
  addTodayPractice: (input: Omit<AddTodayPracticeInput, 'accountId'>) => Promise<TodayPracticeItem>;
  reorderTodayPractice: (id: string, direction: 'up' | 'down' | 'first' | 'last') => Promise<void>;
  startTodayPractice: (
    id: string,
    pauseExisting?: boolean,
  ) => Promise<ActivePracticeSession | null>;
  pauseTodayPractice: (id: string) => Promise<void>;
  resumeTodayPractice: (id: string) => Promise<void>;
  completeTodayPractice: (
    id: string,
    input: CompleteTodayPracticeInput,
  ) => Promise<PracticeRecord | null>;
  cancelTodayPractice: (id: string, keepElapsed: boolean) => Promise<void>;
  getTodayPracticeItemsForDate: (practiceDate?: string) => TodayPracticeItem[];
  getTodayPracticeProgressForDate: (practiceDate?: string) => TodayPracticeProgress;
  getTodayPracticeItemById: (id: string) => TodayPracticeItem | null;
  getActivePracticeSessionByItemId: (id: string) => ActivePracticeSession | null;
  getRunningTodayPracticeSession: () => ActivePracticeSession | null;
  addPracticeRecord: (record: PracticeRecordInput) => Promise<void>;
  updatePracticeRecord: (id: string, record: PracticeRecordInput) => Promise<void>;
  deletePracticeRecord: (id: string) => Promise<void>;
  addConsultHistory: (history: ConsultHistory) => Promise<void>;
  deleteConsultHistory: (id: string) => Promise<void>;
  addFormPhotoAdviceResult: (result: FormPhotoAdviceResult) => Promise<void>;
  deleteFormPhotoAdviceResult: (id: string) => Promise<void>;
  saveBoardReferenceImage: (referenceImage: BoardReferenceImage) => Promise<void>;
  deleteBoardReferenceImage: (id: string) => Promise<void>;
  toggleFavoritePracticeMenu: (id: string) => Promise<void>;
  isFavoritePracticeMenu: (id: string) => boolean;
  savePracticeFilterState: (filterState: PracticeFilterState) => Promise<void>;
  resetPracticeFilterState: () => Promise<void>;
  getRecordById: (id: string) => PracticeRecord | null;
  getRecordsByPracticeMenuId: (id: string) => PracticeRecord[];
  getWeeklyPracticeCount: () => number;
  getLatestRecord: () => PracticeRecord | null;
  getAnalysisSummary: () => AnalysisSummary;
  getActiveAccount: () => LocalAccount | null;
  getConsultHistoryById: (id: string) => ConsultHistory | null;
  getFormPhotoAdviceResultById: (id: string) => FormPhotoAdviceResult | null;
  getBoardReferenceImageByBoardType: (boardType: BoardType) => BoardReferenceImage | null;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [activeAccountId, setActiveAccountIdState] = useState<string | null>(null);
  const [accountLockEnabled, setAccountLockEnabled] = useState(false);
  const [isAccountSessionLocked, setIsAccountSessionLocked] = useState(false);
  const [commonOutbox, setCommonOutbox] = useState<CommonOutboxItem[]>([]);
  const [todayPracticeItems, setTodayPracticeItems] = useState<TodayPracticeItem[]>([]);
  const [activePracticeSessions, setActivePracticeSessions] = useState<ActivePracticeSession[]>([]);
  const [todayPracticeDefaultDurationMinutes] = useState(defaultTodayPracticeDurationMinutes);
  const [favoritePracticeMenuIds, setFavoritePracticeMenuIds] = useState<string[]>([]);
  const [consultHistories, setConsultHistories] = useState<ConsultHistory[]>([]);
  const [formPhotoAdviceResults, setFormPhotoAdviceResults] = useState<FormPhotoAdviceResult[]>([]);
  const [boardReferenceImages, setBoardReferenceImages] = useState<BoardReferenceImage[]>([]);
  const [uiTheme, setUiTheme] = useState<UiTheme>('gray');
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>(defaultBackgroundTheme);
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
        setAccounts(sortAccounts(migratedState.accounts));
        setActiveAccountIdState(migratedState.activeAccountId);
        setAccountLockEnabled(migratedState.accountLockEnabled);
        setCommonOutbox(sortCommonOutbox(migratedState.commonOutbox));
        setTodayPracticeItems(sortTodayPracticeItems(migratedState.todayPracticeItems));
        setActivePracticeSessions(sortActivePracticeSessions(migratedState.activePracticeSessions));
        setIsAccountSessionLocked(
          Boolean(
            migratedState.accountLockEnabled &&
            migratedState.activeAccountId &&
            migratedState.accounts.find(
              (account) =>
                account.accountId === migratedState.activeAccountId &&
                account.authMode === 'local_pin',
            ),
          ),
        );
        setFavoritePracticeMenuIds(migratedState.favoritePracticeMenuIds);
        setPracticeFilterState(migratedState.practiceFilterState);
        setConsultHistories(sortConsultHistories(migratedState.consultHistories));
        setFormPhotoAdviceResults(
          sortFormPhotoAdviceHistories(migratedState.formPhotoAdviceResults),
        );
        setBoardReferenceImages(sortBoardReferenceImages(migratedState.boardReferenceImages));
        setUiTheme(migratedState.uiTheme);
        setBackgroundTheme(migratedState.backgroundTheme);

        if (getStoredSchemaVersion(storedAppState) !== schemaVersion) {
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
        accounts,
        activeAccountId,
        accountLockEnabled,
        commonOutbox,
        todayPracticeItems,
        activePracticeSessions,
        todayPracticeDefaultDurationMinutes,
        profile,
        records,
        favoritePracticeMenuIds,
        practiceFilterState,
        consultHistories,
        formPhotoAdviceResults,
        boardReferenceImages,
        uiTheme,
        backgroundTheme,
        ...overrides,
      };

      await persistAppState(nextState);
    },
    [
      accounts,
      activeAccountId,
      accountLockEnabled,
      activePracticeSessions,
      backgroundTheme,
      boardReferenceImages,
      commonOutbox,
      consultHistories,
      favoritePracticeMenuIds,
      formPhotoAdviceResults,
      practiceFilterState,
      profile,
      records,
      todayPracticeDefaultDurationMinutes,
      todayPracticeItems,
      uiTheme,
    ],
  );

  const saveProfile = useCallback(
    async (profileInput: Omit<UserProfile, 'level'>) => {
      const nextProfile: UserProfile = {
        ...profileInput,
        accountId: profile?.accountId,
        level: getLevelFromRating(profileInput.rating),
      };

      setProfile(nextProfile);
      await persistCurrentState({ profile: nextProfile });
    },
    [persistCurrentState, profile?.accountId],
  );

  const saveProfileAndUiTheme = useCallback(
    async (profileInput: Omit<UserProfile, 'level'>, nextUiTheme: UiTheme) => {
      const nextProfile: UserProfile = {
        ...profileInput,
        accountId: profile?.accountId,
        level: getLevelFromRating(profileInput.rating),
      };

      setProfile(nextProfile);
      setUiTheme(nextUiTheme);
      await persistCurrentState({ profile: nextProfile, uiTheme: nextUiTheme });
    },
    [persistCurrentState, profile?.accountId],
  );

  const saveProfileAndDisplaySettings = useCallback(
    async (
      profileInput: Omit<UserProfile, 'level'>,
      nextUiTheme: UiTheme,
      nextBackgroundTheme: BackgroundTheme,
    ) => {
      const nextProfile: UserProfile = {
        ...profileInput,
        accountId: profile?.accountId,
        level: getLevelFromRating(profileInput.rating),
      };

      setProfile(nextProfile);
      setUiTheme(nextUiTheme);
      setBackgroundTheme(nextBackgroundTheme);
      await persistCurrentState({
        profile: nextProfile,
        uiTheme: nextUiTheme,
        backgroundTheme: nextBackgroundTheme,
      });
    },
    [persistCurrentState, profile?.accountId],
  );

  const saveUiTheme = useCallback(
    async (nextUiTheme: UiTheme) => {
      setUiTheme(nextUiTheme);
      await persistCurrentState({ uiTheme: nextUiTheme });
    },
    [persistCurrentState],
  );

  const saveBackgroundTheme = useCallback(
    async (nextBackgroundTheme: BackgroundTheme) => {
      setBackgroundTheme(nextBackgroundTheme);
      await persistCurrentState({ backgroundTheme: nextBackgroundTheme });
    },
    [persistCurrentState],
  );

  const registerLocalAccount = useCallback(
    async (input: RegisterLocalAccountInput, pin?: string) => {
      const nextAccount = createLocalAccount(input, accounts);

      if (input.pinEnabled) {
        if (!pin) {
          throw new Error('PINを入力してください。');
        }

        await setAccountPin(nextAccount.accountId, pin);
      }

      const nextAccounts = sortAccounts([nextAccount, ...accounts]);
      const nextProfile = profile
        ? {
            ...profile,
            accountId: nextAccount.accountId,
          }
        : profile;
      const nextOutbox = sortCommonOutbox([
        createCommonOutboxItem({
          eventType: 'account_created',
          accountId: nextAccount.accountId,
          payload: { userName: nextAccount.userName },
        }),
        ...commonOutbox,
      ]);

      setAccounts(nextAccounts);
      setActiveAccountIdState(nextAccount.accountId);
      setProfile(nextProfile);
      setAccountLockEnabled(input.pinEnabled);
      setIsAccountSessionLocked(false);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({
        accounts: nextAccounts,
        activeAccountId: nextAccount.accountId,
        accountLockEnabled: input.pinEnabled,
        profile: nextProfile,
        commonOutbox: nextOutbox,
      });

      return nextAccount;
    },
    [accounts, commonOutbox, persistCurrentState, profile],
  );

  const updateLocalAccountProfile = useCallback(
    async (accountId: string, input: UpdateLocalAccountInput) => {
      const targetAccount = accounts.find((account) => account.accountId === accountId);

      if (!targetAccount) {
        return;
      }

      const nextAccount = updateLocalAccount(targetAccount, input, accounts);
      const nextAccounts = sortAccounts(
        accounts.map((account) => (account.accountId === accountId ? nextAccount : account)),
      );
      const nextOutbox = sortCommonOutbox([
        createCommonOutboxItem({
          eventType: 'account_profile_updated',
          accountId,
          payload: { userName: nextAccount.userName },
        }),
        ...commonOutbox,
      ]);

      setAccounts(nextAccounts);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({ accounts: nextAccounts, commonOutbox: nextOutbox });
    },
    [accounts, commonOutbox, persistCurrentState],
  );

  const deleteLocalAccountById = useCallback(
    async (accountId: string) => {
      const targetAccount = accounts.find((account) => account.accountId === accountId);

      if (!targetAccount) {
        return;
      }

      await deleteAccountPin(accountId);

      const nextAccounts = sortAccounts(
        accounts.map((account) =>
          account.accountId === accountId ? deleteLocalAccount(account) : account,
        ),
      );
      const nextOutbox = sortCommonOutbox([
        createCommonOutboxItem({
          eventType: 'record_deleted',
          accountId,
          payload: { entity: 'account', logicalDelete: true },
        }),
        ...commonOutbox,
      ]);
      const nextActiveAccountId = activeAccountId === accountId ? null : activeAccountId;

      setAccounts(nextAccounts);
      setActiveAccountIdState(nextActiveAccountId);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({
        accounts: nextAccounts,
        activeAccountId: nextActiveAccountId,
        commonOutbox: nextOutbox,
      });
    },
    [accounts, activeAccountId, commonOutbox, persistCurrentState],
  );

  const setActiveLocalAccount = useCallback(
    async (accountId: string) => {
      const nextActiveAccount = accounts.find((account) => account.accountId === accountId);

      if (!nextActiveAccount || nextActiveAccount.deletedAt) {
        return;
      }

      setActiveAccountIdState(accountId);
      setIsAccountSessionLocked(accountLockEnabled && nextActiveAccount.authMode === 'local_pin');
      await persistCurrentState({ activeAccountId: accountId });
    },
    [accountLockEnabled, accounts, persistCurrentState],
  );

  const enablePinLock = useCallback(
    async (accountId: string, pin: string) => {
      await setAccountPin(accountId, pin);
      await updateLocalAccountProfile(accountId, { authMode: 'local_pin' });
      setAccountLockEnabled(true);
      setIsAccountSessionLocked(false);
      await persistCurrentState({ accountLockEnabled: true });
    },
    [persistCurrentState, updateLocalAccountProfile],
  );

  const verifyPin = useCallback(
    async (accountId: string, pin: string) => verifyAccountPin(accountId, pin),
    [],
  );

  const changePin = useCallback(async (accountId: string, oldPin: string, newPin: string) => {
    const isVerified = await verifyAccountPin(accountId, oldPin);

    if (!isVerified) {
      return false;
    }

    await setAccountPin(accountId, newPin);
    return true;
  }, []);

  const disablePinLock = useCallback(
    async (accountId: string, pin: string) => {
      const isVerified = await verifyAccountPin(accountId, pin);

      if (!isVerified) {
        return false;
      }

      await deleteAccountPin(accountId);
      await updateLocalAccountProfile(accountId, { authMode: 'local_no_auth' });
      setAccountLockEnabled(false);
      setIsAccountSessionLocked(false);
      await persistCurrentState({ accountLockEnabled: false });
      return true;
    },
    [persistCurrentState, updateLocalAccountProfile],
  );

  const lockSession = useCallback(() => {
    if (activeAccountId && accountLockEnabled) {
      setIsAccountSessionLocked(true);
    }
  }, [accountLockEnabled, activeAccountId]);

  const unlockSession = useCallback(async (accountId: string, pin: string) => {
    const isVerified = await verifyAccountPin(accountId, pin);

    if (isVerified) {
      setIsAccountSessionLocked(false);
    }

    return isVerified;
  }, []);

  const importCommonEnvelopeJson = useCallback(
    async (jsonText: string): Promise<CommonImportApplyResult> => {
      const parsedImport = parseCommonImportJson(jsonText, activeAccountId);

      if (!parsedImport.isValid || !parsedImport.envelope) {
        throw new Error(parsedImport.errors.join('\n'));
      }

      const importedAccount = mapCommonImportAccount(parsedImport.envelope);
      const importedRecords = mapCommonImportPracticeRecords(parsedImport.envelope);
      const existingAccount = accounts.find(
        (account) => account.accountId === importedAccount.accountId,
      );
      const nextAccounts = existingAccount
        ? accounts
        : sortAccounts([importedAccount, ...accounts]);
      const mergedRecords = mergeImportedPracticeRecords(records, importedRecords);
      const nextActiveAccountId = activeAccountId ?? importedAccount.accountId;

      setAccounts(nextAccounts);
      setRecords(sortRecords(mergedRecords.records));
      setActiveAccountIdState(nextActiveAccountId);
      await persistCurrentState({
        accounts: nextAccounts,
        records: sortRecords(mergedRecords.records),
        activeAccountId: nextActiveAccountId,
      });

      return {
        accountAdded: !existingAccount,
        ...mergedRecords.result,
      };
    },
    [accounts, activeAccountId, persistCurrentState, records],
  );

  const addTodayPractice = useCallback(
    async (input: Omit<AddTodayPracticeInput, 'accountId'>) => {
      const nextItem = addTodayPracticeItem(todayPracticeItems, {
        ...input,
        accountId: activeAccountId ?? undefined,
      });
      const nextItems = sortTodayPracticeItems([...todayPracticeItems, nextItem]);
      const nextOutbox = nextItem.accountId
        ? sortCommonOutbox([
            createCommonOutboxItem({
              eventType: 'today_practice_planned',
              accountId: nextItem.accountId,
              sourceRecordId: nextItem.id,
              payload: {
                todayPracticeItemId: nextItem.id,
                practiceMenuId: nextItem.practiceMenuId,
              },
            }),
            ...commonOutbox,
          ])
        : commonOutbox;

      setTodayPracticeItems(nextItems);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({ todayPracticeItems: nextItems, commonOutbox: nextOutbox });

      return nextItem;
    },
    [activeAccountId, commonOutbox, persistCurrentState, todayPracticeItems],
  );

  const reorderTodayPractice = useCallback(
    async (id: string, direction: 'up' | 'down' | 'first' | 'last') => {
      const nextItems = sortTodayPracticeItems(
        reorderTodayPracticeItem(todayPracticeItems, id, direction),
      );

      setTodayPracticeItems(nextItems);
      await persistCurrentState({ todayPracticeItems: nextItems });
    },
    [persistCurrentState, todayPracticeItems],
  );

  const startTodayPractice = useCallback(
    async (id: string, pauseExisting = false) => {
      const result = startPracticeSession({
        items: todayPracticeItems,
        sessions: activePracticeSessions,
        todayPracticeItemId: id,
        activeAccountId,
        pauseExisting,
      });
      const nextItems = sortTodayPracticeItems(result.items);
      const nextSessions = sortActivePracticeSessions(result.sessions);
      const session = nextSessions.find((item) => item.todayPracticeItemId === id) ?? null;
      const targetItem = nextItems.find((item) => item.id === id);
      const nextOutbox =
        targetItem?.accountId && session
          ? sortCommonOutbox([
              createCommonOutboxItem({
                eventType: 'practice_session_started',
                accountId: targetItem.accountId,
                sourceRecordId: targetItem.id,
                payload: {
                  todayPracticeItemId: targetItem.id,
                  practiceMenuId: targetItem.practiceMenuId,
                },
              }),
              ...commonOutbox,
            ])
          : commonOutbox;

      setTodayPracticeItems(nextItems);
      setActivePracticeSessions(nextSessions);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({
        todayPracticeItems: nextItems,
        activePracticeSessions: nextSessions,
        commonOutbox: nextOutbox,
      });

      return session;
    },
    [
      activeAccountId,
      activePracticeSessions,
      commonOutbox,
      persistCurrentState,
      todayPracticeItems,
    ],
  );

  const pauseTodayPractice = useCallback(
    async (id: string) => {
      const result = pausePracticeSession({
        items: todayPracticeItems,
        sessions: activePracticeSessions,
        todayPracticeItemId: id,
      });
      const nextItems = sortTodayPracticeItems(result.items);
      const nextSessions = sortActivePracticeSessions(result.sessions);
      const targetItem = nextItems.find((item) => item.id === id);
      const nextOutbox = appendTodayPracticeOutbox(
        commonOutbox,
        targetItem,
        'practice_session_paused',
      );

      setTodayPracticeItems(nextItems);
      setActivePracticeSessions(nextSessions);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({
        todayPracticeItems: nextItems,
        activePracticeSessions: nextSessions,
        commonOutbox: nextOutbox,
      });
    },
    [activePracticeSessions, commonOutbox, persistCurrentState, todayPracticeItems],
  );

  const resumeTodayPractice = useCallback(
    async (id: string) => {
      const result = resumePracticeSession({
        items: todayPracticeItems,
        sessions: activePracticeSessions,
        todayPracticeItemId: id,
      });
      const nextItems = sortTodayPracticeItems(result.items);
      const nextSessions = sortActivePracticeSessions(result.sessions);
      const targetItem = nextItems.find((item) => item.id === id);
      const nextOutbox = appendTodayPracticeOutbox(
        commonOutbox,
        targetItem,
        'practice_session_resumed',
      );

      setTodayPracticeItems(nextItems);
      setActivePracticeSessions(nextSessions);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({
        todayPracticeItems: nextItems,
        activePracticeSessions: nextSessions,
        commonOutbox: nextOutbox,
      });
    },
    [activePracticeSessions, commonOutbox, persistCurrentState, todayPracticeItems],
  );

  const completeTodayPractice = useCallback(
    async (id: string, input: CompleteTodayPracticeInput) => {
      const result = completePracticeSession({
        items: todayPracticeItems,
        sessions: activePracticeSessions,
        todayPracticeItemId: id,
        result: input,
      });
      const nextItems = sortTodayPracticeItems(result.items);
      const nextSessions = sortActivePracticeSessions(result.sessions);
      const completedItem = nextItems.find((item) => item.id === id);
      const menu = completedItem ? getPracticeMenuById(completedItem.practiceMenuId) : null;

      if (!completedItem || !menu) {
        return null;
      }

      const completedAt = completedItem.completedAt ?? new Date().toISOString();
      const nextRecord: PracticeRecord = {
        id: `${Date.now()}`,
        accountId: completedItem.accountId ?? activeAccountId ?? undefined,
        date: completedAt,
        practiceMenuId: menu.id,
        practiceMenuName: menu.title,
        machineType: getRecordMachineType(profile?.machineType, menu.machineTypes),
        gameType: menu.gameTypes[0] ?? 'OTHER',
        score: completedItem.resultScore ?? 0,
        bullCount: completedItem.resultBullCount ?? 0,
        cricketMarks: 0,
        condition: completedItem.resultCondition ?? 'normal',
        memo: buildTodayPracticeMemo(completedItem),
        durationSeconds: completedItem.actualDurationSeconds,
        completedRounds: completedItem.completedRounds,
        completedSets: completedItem.completedSets,
        achievementRate: completedItem.achievementRate,
        nextMemo: completedItem.nextMemo,
        todayPracticeItemId: completedItem.id,
      };
      const nextRecords = sortRecords([nextRecord, ...records]);
      const nextOutbox = appendTodayPracticeOutbox(
        commonOutbox,
        completedItem,
        'practice_session_completed',
        nextRecord.id,
      );

      setTodayPracticeItems(nextItems);
      setActivePracticeSessions(nextSessions);
      setRecords(nextRecords);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({
        todayPracticeItems: nextItems,
        activePracticeSessions: nextSessions,
        records: nextRecords,
        commonOutbox: nextOutbox,
      });

      return nextRecord;
    },
    [
      activeAccountId,
      activePracticeSessions,
      commonOutbox,
      persistCurrentState,
      profile?.machineType,
      records,
      todayPracticeItems,
    ],
  );

  const cancelTodayPractice = useCallback(
    async (id: string, keepElapsed: boolean) => {
      const result = cancelPracticeSession({
        items: todayPracticeItems,
        sessions: activePracticeSessions,
        todayPracticeItemId: id,
        keepElapsed,
      });
      const nextItems = sortTodayPracticeItems(result.items);
      const nextSessions = sortActivePracticeSessions(result.sessions);
      const targetItem = nextItems.find((item) => item.id === id);
      const nextOutbox = appendTodayPracticeOutbox(
        commonOutbox,
        targetItem,
        'practice_session_cancelled',
      );

      setTodayPracticeItems(nextItems);
      setActivePracticeSessions(nextSessions);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({
        todayPracticeItems: nextItems,
        activePracticeSessions: nextSessions,
        commonOutbox: nextOutbox,
      });
    },
    [activePracticeSessions, commonOutbox, persistCurrentState, todayPracticeItems],
  );

  const getTodayPracticeItemsForDate = useCallback(
    (practiceDate = getLocalDateKey()) =>
      getTodayPracticeItems(todayPracticeItems, practiceDate, activeAccountId),
    [activeAccountId, todayPracticeItems],
  );

  const getTodayPracticeProgressForDate = useCallback(
    (practiceDate = getLocalDateKey()) =>
      calculateTodayPracticeProgress(
        getTodayPracticeItems(todayPracticeItems, practiceDate, activeAccountId),
      ),
    [activeAccountId, todayPracticeItems],
  );

  const getTodayPracticeItemById = useCallback(
    (id: string) => todayPracticeItems.find((item) => item.id === id) ?? null,
    [todayPracticeItems],
  );

  const getActivePracticeSessionByItemId = useCallback(
    (id: string) =>
      activePracticeSessions.find((session) => session.todayPracticeItemId === id) ?? null,
    [activePracticeSessions],
  );

  const getRunningTodayPracticeSession = useCallback(
    () => getRunningPracticeSession(activePracticeSessions, activeAccountId),
    [activeAccountId, activePracticeSessions],
  );

  const addPracticeRecord = useCallback(
    async (recordInput: PracticeRecordInput) => {
      const nextRecord: PracticeRecord = {
        ...recordInput,
        accountId: recordInput.accountId ?? activeAccountId ?? undefined,
        id: `${Date.now()}`,
        date: new Date().toISOString(),
      };

      const nextRecords = sortRecords([nextRecord, ...records]);
      const nextOutbox =
        activeAccountId && nextRecord.accountId
          ? sortCommonOutbox([
              createCommonOutboxItem({
                eventType: 'practice_session_completed',
                accountId: nextRecord.accountId,
                sourceRecordId: nextRecord.id,
                occurredAt: nextRecord.date,
                payload: { practiceMenuName: nextRecord.practiceMenuName },
              }),
              ...commonOutbox,
            ])
          : commonOutbox;
      setRecords(nextRecords);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({ records: nextRecords, commonOutbox: nextOutbox });
    },
    [activeAccountId, commonOutbox, persistCurrentState, records],
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
                accountId: recordInput.accountId ?? currentRecord.accountId,
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
      const targetRecord = records.find((record) => record.id === id);
      const nextRecords = records.filter((record) => record.id !== id);
      const nextOutbox =
        (targetRecord?.accountId ?? activeAccountId)
          ? sortCommonOutbox([
              createCommonOutboxItem({
                eventType: 'record_deleted',
                accountId: targetRecord?.accountId ?? activeAccountId ?? '',
                sourceRecordId: id,
                payload: { recordType: 'practice' },
              }),
              ...commonOutbox,
            ])
          : commonOutbox;
      setRecords(nextRecords);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({ records: nextRecords, commonOutbox: nextOutbox });
    },
    [activeAccountId, commonOutbox, persistCurrentState, records],
  );

  const addConsultHistory = useCallback(
    async (history: ConsultHistory) => {
      const nextHistories = sortConsultHistories([history, ...consultHistories]);
      const nextOutbox = activeAccountId
        ? sortCommonOutbox([
            createCommonOutboxItem({
              eventType: 'consultation_saved',
              accountId: activeAccountId,
              sourceRecordId: history.id,
              occurredAt: history.date,
              payload: { category: history.category },
            }),
            ...commonOutbox,
          ])
        : commonOutbox;
      setConsultHistories(nextHistories);
      setCommonOutbox(nextOutbox);
      await persistCurrentState({ consultHistories: nextHistories, commonOutbox: nextOutbox });
    },
    [activeAccountId, commonOutbox, consultHistories, persistCurrentState],
  );

  const deleteConsultHistory = useCallback(
    async (id: string) => {
      const nextHistories = consultHistories.filter((history) => history.id !== id);
      setConsultHistories(nextHistories);
      await persistCurrentState({ consultHistories: nextHistories });
    },
    [consultHistories, persistCurrentState],
  );

  const addFormPhotoAdviceResult = useCallback(
    async (result: FormPhotoAdviceResult) => {
      const nextResults = addFormPhotoAdviceHistory(formPhotoAdviceResults, result);
      setFormPhotoAdviceResults(nextResults);
      await persistCurrentState({ formPhotoAdviceResults: nextResults });
    },
    [formPhotoAdviceResults, persistCurrentState],
  );

  const deleteFormPhotoAdviceResult = useCallback(
    async (id: string) => {
      const nextResults = deleteFormPhotoAdviceHistory(formPhotoAdviceResults, id);
      setFormPhotoAdviceResults(nextResults);
      await persistCurrentState({ formPhotoAdviceResults: nextResults });
    },
    [formPhotoAdviceResults, persistCurrentState],
  );

  const saveBoardReferenceImage = useCallback(
    async (referenceImage: BoardReferenceImage) => {
      const nextReferenceImages = sortBoardReferenceImages([
        referenceImage,
        ...boardReferenceImages.filter(
          (item) => item.id !== referenceImage.id && item.boardType !== referenceImage.boardType,
        ),
      ]);

      setBoardReferenceImages(nextReferenceImages);
      await persistCurrentState({ boardReferenceImages: nextReferenceImages });
    },
    [boardReferenceImages, persistCurrentState],
  );

  const deleteBoardReferenceImage = useCallback(
    async (id: string) => {
      const nextReferenceImages = boardReferenceImages.filter((item) => item.id !== id);
      setBoardReferenceImages(nextReferenceImages);
      await persistCurrentState({ boardReferenceImages: nextReferenceImages });
    },
    [boardReferenceImages, persistCurrentState],
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

  const getActiveAccount = useCallback(
    () => accounts.find((account) => account.accountId === activeAccountId) ?? null,
    [accounts, activeAccountId],
  );

  const getConsultHistoryById = useCallback(
    (id: string) => consultHistories.find((history) => history.id === id) ?? null,
    [consultHistories],
  );

  const getFormPhotoAdviceResultById = useCallback(
    (id: string) => formPhotoAdviceResults.find((result) => result.id === id) ?? null,
    [formPhotoAdviceResults],
  );

  const getBoardReferenceImageByBoardType = useCallback(
    (boardType: BoardType) =>
      boardReferenceImages.find((referenceImage) => referenceImage.boardType === boardType) ?? null,
    [boardReferenceImages],
  );

  const theme = useMemo(
    () => ({
      ...themes[uiTheme],
      background: backgroundThemeColors[backgroundTheme],
      onBackground: getOnBackgroundTextColor(backgroundTheme),
      onBackgroundMuted: getOnBackgroundMutedTextColor(backgroundTheme),
    }),
    [backgroundTheme, uiTheme],
  );

  const value = useMemo(
    () => ({
      isLoading,
      profile,
      records,
      accounts,
      activeAccountId,
      accountLockEnabled,
      isAccountSessionLocked,
      commonOutbox,
      todayPracticeItems,
      activePracticeSessions,
      todayPracticeDefaultDurationMinutes,
      favoritePracticeMenuIds,
      practiceFilterState,
      consultHistories,
      formPhotoAdviceResults,
      boardReferenceImages,
      uiTheme,
      backgroundTheme,
      theme,
      saveProfile,
      saveProfileAndUiTheme,
      saveProfileAndDisplaySettings,
      saveUiTheme,
      saveBackgroundTheme,
      registerLocalAccount,
      updateLocalAccountProfile,
      deleteLocalAccountById,
      setActiveLocalAccount,
      enablePinLock,
      verifyPin,
      changePin,
      disablePinLock,
      lockSession,
      unlockSession,
      importCommonEnvelopeJson,
      addTodayPractice,
      reorderTodayPractice,
      startTodayPractice,
      pauseTodayPractice,
      resumeTodayPractice,
      completeTodayPractice,
      cancelTodayPractice,
      getTodayPracticeItemsForDate,
      getTodayPracticeProgressForDate,
      getTodayPracticeItemById,
      getActivePracticeSessionByItemId,
      getRunningTodayPracticeSession,
      addPracticeRecord,
      updatePracticeRecord,
      deletePracticeRecord,
      addConsultHistory,
      deleteConsultHistory,
      addFormPhotoAdviceResult,
      deleteFormPhotoAdviceResult,
      saveBoardReferenceImage,
      deleteBoardReferenceImage,
      toggleFavoritePracticeMenu,
      isFavoritePracticeMenu,
      savePracticeFilterState,
      resetPracticeFilterState,
      getRecordById,
      getRecordsByPracticeMenuId,
      getWeeklyPracticeCount,
      getLatestRecord,
      getAnalysisSummary,
      getActiveAccount,
      getConsultHistoryById,
      getFormPhotoAdviceResultById,
      getBoardReferenceImageByBoardType,
    }),
    [
      isLoading,
      profile,
      records,
      accounts,
      activeAccountId,
      accountLockEnabled,
      isAccountSessionLocked,
      commonOutbox,
      todayPracticeItems,
      activePracticeSessions,
      todayPracticeDefaultDurationMinutes,
      favoritePracticeMenuIds,
      practiceFilterState,
      consultHistories,
      formPhotoAdviceResults,
      boardReferenceImages,
      uiTheme,
      backgroundTheme,
      theme,
      saveProfile,
      saveProfileAndUiTheme,
      saveProfileAndDisplaySettings,
      saveUiTheme,
      saveBackgroundTheme,
      registerLocalAccount,
      updateLocalAccountProfile,
      deleteLocalAccountById,
      setActiveLocalAccount,
      enablePinLock,
      verifyPin,
      changePin,
      disablePinLock,
      lockSession,
      unlockSession,
      importCommonEnvelopeJson,
      addTodayPractice,
      reorderTodayPractice,
      startTodayPractice,
      pauseTodayPractice,
      resumeTodayPractice,
      completeTodayPractice,
      cancelTodayPractice,
      getTodayPracticeItemsForDate,
      getTodayPracticeProgressForDate,
      getTodayPracticeItemById,
      getActivePracticeSessionByItemId,
      getRunningTodayPracticeSession,
      addPracticeRecord,
      updatePracticeRecord,
      deletePracticeRecord,
      addConsultHistory,
      deleteConsultHistory,
      addFormPhotoAdviceResult,
      deleteFormPhotoAdviceResult,
      saveBoardReferenceImage,
      deleteBoardReferenceImage,
      toggleFavoritePracticeMenu,
      isFavoritePracticeMenu,
      savePracticeFilterState,
      resetPracticeFilterState,
      getRecordById,
      getRecordsByPracticeMenuId,
      getWeeklyPracticeCount,
      getLatestRecord,
      getAnalysisSummary,
      getActiveAccount,
      getConsultHistoryById,
      getFormPhotoAdviceResultById,
      getBoardReferenceImageByBoardType,
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
      accounts: sortAccounts(appState.accounts),
      commonOutbox: sortCommonOutbox(appState.commonOutbox),
      todayPracticeItems: sortTodayPracticeItems(appState.todayPracticeItems),
      activePracticeSessions: sortActivePracticeSessions(appState.activePracticeSessions),
      records: sortRecords(appState.records),
      consultHistories: sortConsultHistories(appState.consultHistories),
      formPhotoAdviceResults: sortFormPhotoAdviceHistories(appState.formPhotoAdviceResults),
      boardReferenceImages: sortBoardReferenceImages(appState.boardReferenceImages),
      practiceFilterState: normalizePracticeFilterState(appState.practiceFilterState),
    }),
  );
}

function getStoredSchemaVersion(storedAppState: string | null) {
  if (!storedAppState) {
    return null;
  }

  try {
    return (JSON.parse(storedAppState) as Partial<AppState>).schemaVersion ?? null;
  } catch {
    return null;
  }
}

function isFavoritePracticeMenuId(favoritePracticeMenuIds: string[], id: string) {
  return favoritePracticeMenuIds.includes(id);
}

function sortRecords(records: PracticeRecord[]) {
  return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function sortConsultHistories(histories: ConsultHistory[]) {
  return [...histories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function sortBoardReferenceImages(referenceImages: BoardReferenceImage[]) {
  return [...referenceImages].sort(
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

function sortActivePracticeSessions(sessions: ActivePracticeSession[]) {
  return [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

function appendTodayPracticeOutbox(
  commonOutbox: CommonOutboxItem[],
  item: TodayPracticeItem | undefined,
  eventType: CommonOutboxEventType,
  sourceRecordId?: string,
) {
  if (!item?.accountId) {
    return commonOutbox;
  }

  const event = createCommonOutboxItem({
    eventType,
    accountId: item.accountId,
    sourceRecordId: sourceRecordId ?? item.id,
    occurredAt: item.updatedAt,
    payload: {
      todayPracticeItemId: item.id,
      practiceMenuId: item.practiceMenuId,
    },
  });

  return sortCommonOutbox([
    {
      ...event,
      payload: {
        ...event.payload,
        eventId: event.outboxId,
      },
    },
    ...commonOutbox,
  ]);
}

function getRecordMachineType(
  profileMachineType: DartMachine | undefined,
  menuMachineTypes: DartMachine[],
): Exclude<DartMachine, 'BOTH'> {
  if (profileMachineType && profileMachineType !== 'BOTH') {
    return profileMachineType;
  }

  return menuMachineTypes.find((machineType) => machineType !== 'BOTH') ?? 'DARTSLIVE';
}

function buildTodayPracticeMemo(item: TodayPracticeItem) {
  const fragments = [
    item.note ? `メモ: ${item.note}` : null,
    item.achievementRate !== undefined ? `達成率: ${item.achievementRate}%` : null,
    item.nextMemo ? `次回: ${item.nextMemo}` : null,
  ].filter(Boolean);

  return fragments.length > 0 ? fragments.join('\n') : '今日の練習から保存';
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}
