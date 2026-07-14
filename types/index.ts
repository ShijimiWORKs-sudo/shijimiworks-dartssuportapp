export type SkillLevelId = 'beginner' | 'intermediate' | 'advanced';

export type DartMachine = 'DARTSLIVE' | 'PHOENIX' | 'BOTH';

export type PracticeGame = 'COUNT-UP' | '01' | 'CRICKET' | 'OTHER';

export type Condition = 'good' | 'normal' | 'bad';

export type ConsultCategory =
  | 'stance'
  | 'grip'
  | 'takeback'
  | 'release'
  | 'followThrough'
  | 'aiming'
  | 'rhythm'
  | 'mental'
  | 'yips'
  | 'practicePlan'
  | 'other';

export type ConsultSeverity = 'light' | 'normal' | 'serious';

export type AnalysisPeriod = 'last7Days' | 'last30Days' | 'last90Days' | 'all';

export type TrendDirection = 'up' | 'down' | 'flat' | 'unknown';

export type UiTheme = 'light' | 'gray';

export type BackgroundTheme = 'black' | 'brown' | 'purple' | 'orange' | 'white';

export type AccountStatus =
  'local_active' | 'cloud_pending' | 'cloud_active' | 'suspended' | 'deleted';

export type AuthMode = 'local_pin' | 'local_no_auth' | 'email_password' | 'apple' | 'google';

export type SyncStatus = 'local_only' | 'pending' | 'synced' | 'conflict' | 'failed' | 'deleted';

export type LocalAccount = {
  schemaVersion: 1;
  accountId: string;
  userName: string;
  displayName: string;
  email: string | null;
  accountStatus: AccountStatus;
  authMode: AuthMode;
  cloudAuthSubject: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CommonOutboxEventType =
  | 'account_created'
  | 'account_profile_updated'
  | 'today_practice_planned'
  | 'practice_session_started'
  | 'practice_session_paused'
  | 'practice_session_resumed'
  | 'practice_session_completed'
  | 'practice_session_cancelled'
  | 'consultation_saved'
  | 'record_deleted';

export type CommonOutboxItem = {
  outboxId: string;
  eventType: CommonOutboxEventType;
  eventVersion: 1;
  accountId: string;
  sourceRecordId: string | null;
  occurredAt: string;
  createdAt: string;
  syncStatus: SyncStatus;
  payload: Record<string, unknown>;
};

export type CommonContractEnvelope<T> = {
  contractName: 'darts_common_data';
  contractVersion: 1;
  exportId: string;
  exportedAt: string;
  sourceApp: 'darts_app' | 'darts_support_app';
  sourceAppVersion: string;
  accountId: string;
  payload: T;
};

export type BoardType = 'DARTSLIVE_ZERO' | 'QUIET_SOFT' | 'CORK' | 'OTHER';

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type BoardCalibration = {
  boardType: BoardType;
  center: NormalizedPoint;
  topNumberPoint: NormalizedPoint;
  outerPoint?: NormalizedPoint;
  outerRadius: number;
  ringPreset: 'soft' | 'steelLike' | 'custom';
};

export type BoardReferenceImage = {
  id: string;
  boardType: BoardType;
  imageUri: string;
  calibration: BoardCalibration;
  createdAt: string;
  note?: string;
  imageWidth?: number;
  imageHeight?: number;
};

export type DartHitArea = 'single' | 'double' | 'triple' | 'singleBull' | 'doubleBull' | 'out';

export type PhotoScoreDetectionSource =
  'autoCandidate' | 'imageAnalysisCandidate' | 'manualTap' | 'adjusted';

export type PhotoScoreCandidate = {
  id: string;
  point: NormalizedPoint;
  confidence: number;
  reason: string;
  selected: boolean;
  source?: Extract<PhotoScoreDetectionSource, 'autoCandidate' | 'imageAnalysisCandidate'>;
};

export type PhotoScoreDetectionMode = 'manual' | 'semiAuto';

export type PhotoDetectionQuality = {
  isUsable: boolean;
  centerDistance: number;
  radiusDifference: number;
  rotationDifferenceDegrees: number;
  aspectRatioDifference: number;
  scaleDifference: number;
  brightnessDifference?: number;
  warnings: string[];
};

export type DifferenceDetectionResult = {
  candidates: PhotoScoreCandidate[];
  quality: PhotoDetectionQuality;
  detectionMethod: 'referenceDifference' | 'singleImageHeuristic' | 'calibrationFallback';
  warnings: string[];
};

export type PhotoDetectionFeedback = {
  quality: PhotoDetectionQuality;
  detectionMethod: DifferenceDetectionResult['detectionMethod'];
  warnings: string[];
};

export type PhotoScoreVerticalBias = 'high' | 'low' | 'centered' | 'unknown';

export type PhotoScoreHorizontalBias = 'left' | 'right' | 'centered' | 'unknown';

export type PhotoScoreSpreadPattern = 'tight' | 'vertical' | 'horizontal' | 'wide' | 'unknown';

export type PhotoScoreGroupingQuality = 'good' | 'normal' | 'needsWork' | 'unknown';

export type PhotoScoreAdviceCategory =
  'release' | 'stance' | 'followThrough' | 'grip' | 'aiming' | 'rhythm' | 'mental' | 'practicePlan';

export type PhotoScoreGroupingAnalysis = {
  centerPoint: NormalizedPoint;
  spreadRadius: number;
  averageDistanceFromBoardCenter: number;
  verticalBias: PhotoScoreVerticalBias;
  horizontalBias: PhotoScoreHorizontalBias;
  spreadPattern: PhotoScoreSpreadPattern;
  groupingQuality: PhotoScoreGroupingQuality;
  summaryText: string;
  adviceTexts: string[];
  adviceCategories: PhotoScoreAdviceCategory[];
  recommendedPracticeMenuIds: string[];
};

export type DartHitResult = {
  id: string;
  point: NormalizedPoint;
  number: number | null;
  multiplier: 0 | 1 | 2 | 3;
  area: DartHitArea;
  score: number;
  detectionSource?: PhotoScoreDetectionSource;
  candidateId?: string;
  confidence?: number;
};

export type PhotoScoreEntry = {
  imageUri?: string;
  boardType: BoardType;
  calibration: BoardCalibration;
  hits: DartHitResult[];
  totalScore: number;
  bullCount: number;
  tripleCount: number;
  doubleCount: number;
  groupingAnalysis?: PhotoScoreGroupingAnalysis;
  detectionFeedback?: PhotoDetectionFeedback;
};

export type PracticeInputMethod = 'manual' | 'photoTap';

export type FormPhotoType = 'front' | 'side' | 'releaseAfter';

export type ThrowingHand = 'right' | 'left';

export type FormSelfCheckAnswer = 'yes' | 'no' | 'unknown';

export type FormSelfCheck = {
  stanceFeelsStable: FormSelfCheckAnswer;
  shoulderLineFeelsAligned: FormSelfCheckAnswer;
  elbowHeightFeelsStable: FormSelfCheckAnswer;
  releaseFeelsClean: FormSelfCheckAnswer;
  followThroughGoesToTarget: FormSelfCheckAnswer;
  bodyOpensEarly: FormSelfCheckAnswer;
  gripFeelsTooStrong: FormSelfCheckAnswer;
  feelsRushed: FormSelfCheckAnswer;
};

export type FormPhotoEntry = {
  type: FormPhotoType;
  imageUri?: string;
  note?: string;
};

export type FormAdviceCategory =
  | 'stance'
  | 'shoulderLine'
  | 'elbow'
  | 'release'
  | 'followThrough'
  | 'grip'
  | 'rhythm'
  | 'aiming'
  | 'practicePlan';

export type FormPhotoAdviceResult = {
  id: string;
  date: string;
  throwingHand: ThrowingHand;
  photos: FormPhotoEntry[];
  selfCheck: FormSelfCheck;
  linkedPracticeRecordId?: string;
  linkedPhotoScoreSummary?: string;
  adviceCategories: FormAdviceCategory[];
  summaryText: string;
  adviceTexts: string[];
  checkPoints: string[];
  recommendedPracticeMenuIds: string[];
};

export type PracticeMenu = {
  id: string;
  title: string;
  level: SkillLevelId;
  machineTypes: DartMachine[];
  gameTypes: PracticeGame[];
  targetProblems: string[];
  durationMinutes: number;
  purpose: string;
  steps: string[];
  recordItems: string[];
  evaluationPoints: string[];
  adviceText: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  sourceNotes?: string[];
  relatedKnowledgeIds?: string[];
};

export type UserProfile = {
  accountId?: string;
  rating: number;
  level: SkillLevelId;
  machineType: DartMachine;
  mainProblems: string[];
};

export type PracticeRecord = {
  id: string;
  accountId?: string;
  date: string;
  practiceMenuId: string;
  practiceMenuName: string;
  machineType: Exclude<DartMachine, 'BOTH'>;
  gameType: PracticeGame;
  score: number;
  bullCount: number;
  cricketMarks: number;
  condition: Condition;
  memo: string;
  inputMethod?: PracticeInputMethod;
  photoScore?: PhotoScoreEntry;
  durationSeconds?: number;
  completedRounds?: number;
  completedSets?: number;
  achievementRate?: number;
  nextMemo?: string;
  todayPracticeItemId?: string;
};

export type PracticeRecordInput = Omit<PracticeRecord, 'id' | 'date'>;

export type PracticeFilterState = {
  level?: SkillLevelId | 'all';
  machineType?: DartMachine | 'all';
  gameType?: PracticeGame | 'all';
  problemTag?: string | null;
};

export type TodayPracticeStatus = 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

export type TodayPracticeItem = {
  id: string;
  accountId?: string;
  practiceMenuId: string;
  practiceDate: string;
  order: number;
  status: TodayPracticeStatus;
  plannedDurationMinutes: number;
  actualDurationSeconds: number;
  plannedRounds?: number;
  plannedSets?: number;
  completedRounds?: number;
  completedSets?: number;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  note?: string;
  resultScore?: number;
  resultBullCount?: number;
  resultCondition?: Condition;
  achievementRate?: number;
  nextMemo?: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivePracticeSession = {
  id: string;
  todayPracticeItemId: string;
  accountId?: string;
  startedAt: string;
  lastResumedAt: string;
  accumulatedSeconds: number;
  state: 'running' | 'paused';
};

export type AppState = {
  schemaVersion: 11;
  accounts: LocalAccount[];
  activeAccountId: string | null;
  accountLockEnabled: boolean;
  commonOutbox: CommonOutboxItem[];
  todayPracticeItems: TodayPracticeItem[];
  activePracticeSessions: ActivePracticeSession[];
  todayPracticeDefaultDurationMinutes?: number;
  profile: UserProfile | null;
  records: PracticeRecord[];
  favoritePracticeMenuIds: string[];
  practiceFilterState: PracticeFilterState;
  consultHistories: ConsultHistory[];
  formPhotoAdviceResults: FormPhotoAdviceResult[];
  boardReferenceImages: BoardReferenceImage[];
  uiTheme: UiTheme;
  backgroundTheme: BackgroundTheme;
};

export type LegacyStoredState = {
  profile: UserProfile | null;
  records: PracticeRecord[];
  accounts?: LocalAccount[];
  activeAccountId?: string | null;
  accountLockEnabled?: boolean;
  commonOutbox?: CommonOutboxItem[];
  todayPracticeItems?: TodayPracticeItem[];
  activePracticeSessions?: ActivePracticeSession[];
  todayPracticeDefaultDurationMinutes?: number;
  favoritePracticeMenuIds?: string[];
  practiceFilterState?: PracticeFilterState;
  consultHistories?: ConsultHistory[];
  formPhotoAdviceResults?: FormPhotoAdviceResult[];
  boardReferenceImages?: BoardReferenceImage[];
  uiTheme?: UiTheme;
  backgroundTheme?: BackgroundTheme;
};

export type AnalysisSummary = {
  period: AnalysisPeriod;
  totalPracticeCount: number;
  countUpAverage: number | null;
  bullAverage: number | null;
  cricketMarksAverage: number | null;
  bestScore: number | null;
  latestPracticeDate: string | null;
  conditionCounts: Record<Condition, number>;
  gameTypeCounts: Record<PracticeGame, number>;
  machineTypeCounts: Record<Exclude<DartMachine, 'BOTH'>, number>;
  trendDirection: TrendDirection;
  improvementComments: string[];
  recommendedPracticeMenuIds: string[];
};

export type GameTypeSummary = {
  gameType: PracticeGame;
  count: number;
  averageScore: number | null;
  averageBullCount: number | null;
  averageCricketMarks: number | null;
};

export type WeeklySummary = {
  weekLabel: string;
  practiceCount: number;
  averageScore: number | null;
  averageBullCount: number | null;
};

export type LibraryCategory = {
  id: string;
  title: string;
  articles: {
    id: string;
    title: string;
    summary: string;
  }[];
};

export type ConsultAdvice = {
  id: string;
  category: ConsultCategory;
  title: string;
  problemKeywords: string[];
  symptoms: string[];
  possibleCauses: string[];
  adviceSummary: string;
  checkPoints: string[];
  recommendedPracticeMenuIds: string[];
  relatedKnowledgeIds: string[];
  cautionText?: string;
  severity?: ConsultSeverity;
};

export type KnowledgeArticle = {
  id: string;
  category: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  relatedPracticeMenuIds: string[];
  relatedAdviceIds: string[];
  sourceNotes?: string[];
};

export type ConsultHistory = {
  id: string;
  date: string;
  category: ConsultCategory;
  severity: ConsultSeverity;
  userText: string;
  mainAdvice: string;
  causes: string[];
  checkPoints: string[];
  recommendedPracticeMenuIds: string[];
  relatedKnowledgeIds: string[];
  cautionText?: string;
  nextAction: string;
  memo?: string;
};
