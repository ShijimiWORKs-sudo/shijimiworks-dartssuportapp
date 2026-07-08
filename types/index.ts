export type SkillLevelId = 'beginner' | 'intermediate' | 'advanced';

export type DartMachine = 'DARTSLIVE' | 'PHOENIX' | 'BOTH';

export type PracticeGame = 'COUNT-UP' | '01' | 'CRICKET' | 'OTHER';

export type Condition = 'good' | 'normal' | 'bad';

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
};

export type PracticeRecordInput = Omit<PracticeRecord, 'id' | 'date'>;

export type AppState = {
  schemaVersion: 1;
  profile: UserProfile | null;
  records: PracticeRecord[];
};

export type LegacyStoredState = {
  profile: UserProfile | null;
  records: PracticeRecord[];
};

export type AnalysisSummary = {
  practiceCount: number;
  countUpAverageScore: number | null;
  averageBullCount: number | null;
  latestPracticeDate: string | null;
  latestRecord: PracticeRecord | null;
  chartValues: number[];
  improvementComment: string;
  nextPracticeTitle: string;
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
