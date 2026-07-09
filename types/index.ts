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

export type DartHitArea = 'single' | 'double' | 'triple' | 'singleBull' | 'doubleBull' | 'out';

export type DartHitResult = {
  id: string;
  point: NormalizedPoint;
  number: number | null;
  multiplier: 0 | 1 | 2 | 3;
  area: DartHitArea;
  score: number;
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
};

export type PracticeInputMethod = 'manual' | 'photoTap';

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
  rating: number;
  level: SkillLevelId;
  machineType: DartMachine;
  mainProblems: string[];
};

export type PracticeRecord = {
  id: string;
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
};

export type PracticeRecordInput = Omit<PracticeRecord, 'id' | 'date'>;

export type PracticeFilterState = {
  level?: SkillLevelId | 'all';
  machineType?: DartMachine | 'all';
  gameType?: PracticeGame | 'all';
  problemTag?: string | null;
};

export type AppState = {
  schemaVersion: 7;
  profile: UserProfile | null;
  records: PracticeRecord[];
  favoritePracticeMenuIds: string[];
  practiceFilterState: PracticeFilterState;
  consultHistories: ConsultHistory[];
  uiTheme: UiTheme;
  backgroundTheme: BackgroundTheme;
};

export type LegacyStoredState = {
  profile: UserProfile | null;
  records: PracticeRecord[];
  favoritePracticeMenuIds?: string[];
  practiceFilterState?: PracticeFilterState;
  consultHistories?: ConsultHistory[];
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
