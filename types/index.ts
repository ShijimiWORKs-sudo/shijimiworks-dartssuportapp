export type SkillLevelId = 'beginner' | 'intermediate' | 'advanced';

export type DartMachine = 'DARTSLIVE' | 'PHOENIX' | 'BOTH';

export type PracticeGame = 'COUNT-UP' | '01' | 'CRICKET' | 'OTHER';

export type Condition = 'good' | 'normal' | 'bad';

export type PracticeMenu = {
  id: string;
  title: string;
  level: SkillLevelId;
  purpose: string;
  duration: string;
  game: PracticeGame;
  metrics: string[];
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
