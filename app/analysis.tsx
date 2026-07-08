import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { StatCard } from '../components/StatCard';
import { colors } from '../constants/theme';
import { useAppState } from '../contexts/AppStateContext';

export default function AnalysisScreen() {
  const router = useRouter();
  const { getAnalysisSummary } = useAppState();
  const summary = getAnalysisSummary();
  const latestRecord = summary.latestRecord;

  if (summary.practiceCount === 0) {
    return (
      <ScreenShell>
        <SectionTitle title="分析" subtitle="保存済み練習記録から自動集計します。" />
        <Card muted>
          <Text style={styles.emptyTitle}>まだ記録がありません</Text>
          <Text style={styles.bodyText}>
            練習記録を1件保存すると、練習回数、COUNT-UP平均、平均ブル数、改善コメントが表示されます。
          </Text>
        </Card>
        <AppButton label="練習記録を入力する" onPress={() => router.push('/record')} />
        <AppButton
          label="記録一覧を見る"
          onPress={() => router.push('/records')}
          variant="secondary"
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionTitle title="分析" subtitle="保存済み練習記録から改善傾向を確認できます。" />

      <View style={styles.statsRow}>
        <StatCard
          label="練習回数"
          value={`${summary.practiceCount}回`}
          helper={
            summary.latestPracticeDate ? `直近 ${formatDate(summary.latestPracticeDate)}` : '-'
          }
        />
        <StatCard
          label="COUNT-UP平均"
          value={summary.countUpAverageScore === null ? '-' : String(summary.countUpAverageScore)}
          helper="COUNT-UP記録のみ"
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          label="平均ブル数"
          value={summary.averageBullCount === null ? '-' : String(summary.averageBullCount)}
          helper="全記録平均"
        />
        <StatCard
          label="直近練習日"
          value={summary.latestPracticeDate ? formatShortDate(summary.latestPracticeDate) : '-'}
          helper={summary.latestRecord?.gameType ?? '-'}
        />
      </View>

      <Card>
        <SectionTitle title="スコア推移" subtitle="保存済みスコアから棒グラフ風に表示します。" />
        <View style={styles.chart}>
          {summary.chartValues.map((height, index) => (
            <View key={`${height}-${index}`} style={styles.barTrack}>
              <View style={[styles.bar, { height }]} />
            </View>
          ))}
        </View>
      </Card>

      <Card muted>
        <Text style={styles.cardTitle}>直近の改善コメント</Text>
        <Text style={styles.bodyText}>{summary.improvementComment}</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>次にやるべき練習</Text>
        <Text style={styles.nextPractice}>{summary.nextPracticeTitle}</Text>
        <Text style={styles.bodyText}>保存データをもとにした固定ロジックのおすすめです。</Text>
      </Card>
      <AppButton
        label="記録一覧を見る"
        onPress={() => router.push('/records')}
        variant="secondary"
      />
      {latestRecord ? (
        <AppButton
          label="直近練習記録を開く"
          onPress={() => router.push(`/records/${latestRecord.id}`)}
        />
      ) : null}
    </ScreenShell>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(date));
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chart: {
    height: 132,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingVertical: 8,
  },
  barTrack: {
    flex: 1,
    height: 112,
    justifyContent: 'flex-end',
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  bar: {
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  bodyText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  nextPractice: {
    marginTop: 10,
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: '900',
  },
});
