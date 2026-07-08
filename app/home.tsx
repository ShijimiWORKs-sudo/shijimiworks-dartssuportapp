import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { StatCard } from '../components/StatCard';
import { conditionLabels, gameLabels, machineLabels } from '../constants/labels';
import { levelLabels } from '../constants/levels';
import { practiceMenus } from '../constants/mockData';
import { colors } from '../constants/theme';
import { useAppState } from '../contexts/AppStateContext';

const logo = require('../assets/images/logo.png');

const menuLinks = [
  { label: '今日の練習', href: '/practice', helper: 'レベル別メニュー' },
  { label: '練習記録', href: '/records', helper: '一覧・詳細・編集' },
  { label: '分析', href: '/analysis', helper: '改善コメントを見る' },
  { label: 'フォーム相談', href: '/consult', helper: '固定アドバイス確認' },
  { label: '資料ライブラリ', href: '/library', helper: '仮の記事カード' },
  { label: '設定を編集', href: '/settings', helper: 'RTと悩みを更新' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { isLoading, profile, getWeeklyPracticeCount, getLatestRecord } = useAppState();

  const weeklyPracticeCount = getWeeklyPracticeCount();
  const latestRecord = getLatestRecord();
  const recommended =
    practiceMenus.find((menu) => menu.level === profile?.level) ??
    practiceMenus.find((menu) => menu.level === 'intermediate') ??
    practiceMenus[0];

  return (
    <ScreenShell>
      <View style={styles.header}>
        <Image source={logo} resizeMode="contain" style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={styles.appName}>DartsSupportApp</Text>
          <Text style={styles.meta}>
            {profile ? levelLabels[profile.level] : 'プロフィール未設定'}
          </Text>
        </View>
      </View>

      {!isLoading && !profile ? (
        <Card muted>
          <SectionTitle
            title="初期設定がまだありません"
            subtitle="レーティングと利用機種を保存すると、ホームと分析に反映されます。"
          />
          <View style={styles.setupAction}>
            <AppButton label="初期設定へ戻る" onPress={() => router.push('/')} />
          </View>
        </Card>
      ) : null}

      <View style={styles.statsRow}>
        <StatCard
          label="現在レーティング"
          value={profile ? `RT ${profile.rating}` : '-'}
          helper={profile ? machineLabels[profile.machineType] : '未設定'}
        />
        <StatCard
          label="今週の練習回数"
          value={`${weeklyPracticeCount}回`}
          helper={
            weeklyPracticeCount >= 3 ? 'いいペース' : `目標まであと${3 - weeklyPracticeCount}回`
          }
        />
      </View>

      <Card muted>
        <SectionTitle
          title="今日のおすすめ練習"
          subtitle={profile?.mainProblems.join(' / ') ?? '初期設定後に悩みが表示されます'}
        />
        <Text style={styles.recommendTitle}>{recommended.title}</Text>
        <Text style={styles.recommendBody}>{recommended.purpose}</Text>
        <View style={styles.recommendFooter}>
          <Text style={styles.pill}>{recommended.duration}</Text>
          <Text style={styles.pill}>{recommended.game}</Text>
        </View>
      </Card>

      {latestRecord ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/records/${latestRecord.id}`)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Card>
            <SectionTitle title="最新の練習記録" subtitle="タップで詳細を開きます。" />
            <Text style={styles.latestTitle}>{latestRecord.practiceMenuName}</Text>
            <Text style={styles.latestBody}>
              {formatDate(latestRecord.date)} / {gameLabels[latestRecord.gameType]} / スコア{' '}
              {latestRecord.score}
            </Text>
            <Text style={styles.latestBody}>
              Bull {latestRecord.bullCount} / Cricket {latestRecord.cricketMarks} /{' '}
              {conditionLabels[latestRecord.condition]}
            </Text>
          </Card>
        </Pressable>
      ) : (
        <Card>
          <SectionTitle title="最新の練習記録" />
          <Text style={styles.latestBody}>
            まだ練習記録がありません。記録入力から1件保存しましょう。
          </Text>
        </Card>
      )}

      <SectionTitle title="主要メニュー" />
      <View style={styles.menuGrid}>
        {menuLinks.map((item) => (
          <Pressable
            key={item.href}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]}
          >
            <Text style={styles.menuTitle}>{item.label}</Text>
            <Text style={styles.menuHelper}>{item.helper}</Text>
          </Pressable>
        ))}
      </View>
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 64,
    height: 64,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  appName: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  setupAction: {
    marginTop: 14,
  },
  recommendTitle: {
    marginTop: 14,
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  latestTitle: {
    marginTop: 12,
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  latestBody: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  recommendBody: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  recommendFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: colors.surface,
  },
  menuGrid: {
    gap: 10,
  },
  menuCard: {
    minHeight: 72,
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  menuTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  menuHelper: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.72,
  },
});
