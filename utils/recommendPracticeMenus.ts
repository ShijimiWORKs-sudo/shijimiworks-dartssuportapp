import { matchesMachine, practiceMenus } from '../constants/practiceMenus';
import type { DartMachine, PracticeMenu, PracticeRecord, UserProfile } from '../types';

export type PracticeRecommendation = {
  todayMenus: PracticeMenu[];
  supportMenus: PracticeMenu[];
  reasonText: string;
};

export function recommendPracticeMenus(
  profile: UserProfile | null,
  records: PracticeRecord[],
): PracticeRecommendation {
  const machineType: DartMachine = profile?.machineType ?? 'BOTH';
  const weeklyCount = getWeeklyPracticeCount(records);
  const averageBullCount = average(records.map((record) => record.bullCount));
  const hasFewCricketRecords = records.filter((record) => record.gameType === 'CRICKET').length < 2;
  const hasFewCountUpRecords =
    records.filter((record) => record.gameType === 'COUNT-UP').length < 2;

  const scoredMenus = practiceMenus
    .map((menu) => ({
      menu,
      score: scorePracticeMenu(menu, {
        profile,
        machineType,
        weeklyCount,
        averageBullCount,
        hasFewCricketRecords,
        hasFewCountUpRecords,
      }),
    }))
    .sort((a, b) => b.score - a.score || a.menu.durationMinutes - b.menu.durationMinutes);

  const todayMenus = uniqueMenus(scoredMenus.slice(0, 3).map((item) => item.menu));
  const supportMenus = uniqueMenus(
    scoredMenus
      .filter((item) => !todayMenus.some((menu) => menu.id === item.menu.id))
      .slice(0, 3)
      .map((item) => item.menu),
  );

  return {
    todayMenus,
    supportMenus,
    reasonText: buildReasonText(records, weeklyCount, averageBullCount, hasFewCricketRecords),
  };
}

function scorePracticeMenu(
  menu: PracticeMenu,
  context: {
    profile: UserProfile | null;
    machineType: DartMachine;
    weeklyCount: number;
    averageBullCount: number;
    hasFewCricketRecords: boolean;
    hasFewCountUpRecords: boolean;
  },
) {
  let score = 0;

  if (context.profile?.level === menu.level) {
    score += 50;
  }

  if (matchesMachine(menu.machineTypes, context.machineType)) {
    score += 24;
  }

  const problemMatches =
    context.profile?.mainProblems.filter((problem) => menu.targetProblems.includes(problem))
      .length ?? 0;
  score += problemMatches * 18;

  if (
    context.averageBullCount > 0 &&
    context.averageBullCount < 8 &&
    menu.tags.includes('ブル練習')
  ) {
    score += 16;
  }

  if (context.hasFewCricketRecords && menu.gameTypes.includes('CRICKET')) {
    score += 12;
  }

  if (context.hasFewCountUpRecords && menu.gameTypes.includes('COUNT-UP')) {
    score += 8;
  }

  if (context.weeklyCount < 3 && menu.durationMinutes <= 12) {
    score += 12;
  }

  return score - menu.difficulty;
}

function buildReasonText(
  records: PracticeRecord[],
  weeklyCount: number,
  averageBullCount: number,
  hasFewCricketRecords: boolean,
) {
  if (records.length === 0) {
    return 'まだ記録が少ないため、短時間で結果と感覚を残しやすい練習を優先します。';
  }

  if (averageBullCount < 8) {
    return 'ブル数が少なめなので、まずはCOUNT-UPでブル率を安定させる練習を優先します。';
  }

  if (hasFewCricketRecords) {
    return 'クリケット記録が少ないため、15〜20のナンバー練習を追加します。';
  }

  if (weeklyCount < 3) {
    return '今週の練習回数が少ないため、短時間で完了できるメニューを優先します。';
  }

  return '直近の記録バランスを見て、得点練習とフォーム確認を組み合わせます。';
}

function uniqueMenus(menus: PracticeMenu[]) {
  const seen = new Set<string>();
  return menus.filter((menu) => {
    if (seen.has(menu.id)) {
      return false;
    }

    seen.add(menu.id);
    return true;
  });
}

function getWeeklyPracticeCount(records: PracticeRecord[]) {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return records.filter((record) => new Date(record.date) >= start).length;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
