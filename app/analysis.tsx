import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { StatCard } from '../components/StatCard';
import { analysisBars } from '../constants/mockData';
import { colors } from '../constants/theme';

export default function AnalysisScreen() {
  return (
    <ScreenShell>
      <SectionTitle title="分析" subtitle="モックデータで改善傾向を確認できます。" />

      <View style={styles.statsRow}>
        <StatCard label="COUNT-UP平均" value="612" helper="+28 / 2週" />
        <StatCard label="ブル率" value="34%" helper="+4pt" />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="練習回数" value="3回" helper="今週" />
        <StatCard label="記録メモ" value="7件" helper="直近14日" />
      </View>

      <Card>
        <SectionTitle title="14日トレンド" subtitle="棒グラフ風の簡易表示です。" />
        <View style={styles.chart}>
          {analysisBars.map((height, index) => (
            <View key={`${height}-${index}`} style={styles.barTrack}>
              <View style={[styles.bar, { height }]} />
            </View>
          ))}
        </View>
      </Card>

      <Card muted>
        <Text style={styles.cardTitle}>直近の改善コメント</Text>
        <Text style={styles.bodyText}>
          COUNT-UP平均とブル率は上向きです。クリケットの19で落ちやすいので、次回は20を追いすぎず
          19カバーへ切り替える練習を優先しましょう。
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>次にやるべき練習</Text>
        <Text style={styles.nextPractice}>19カバードリル</Text>
        <Text style={styles.bodyText}>目的: 20が詰まった後のカバー精度を上げる。</Text>
      </Card>
    </ScreenShell>
  );
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
