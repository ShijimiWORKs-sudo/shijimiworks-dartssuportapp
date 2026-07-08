import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { StatCard } from '../components/StatCard';
import { levelLabels } from '../constants/levels';
import { practiceMenus } from '../constants/mockData';
import { colors } from '../constants/theme';
import type { SkillLevelId } from '../types';

const logo = require('../assets/images/logo.png');

const menuLinks = [
  { label: '今日の練習', href: '/practice', helper: 'レベル別メニュー' },
  { label: '練習記録', href: '/record', helper: 'スコアと感覚を残す' },
  { label: '分析', href: '/analysis', helper: '改善コメントを見る' },
  { label: 'フォーム相談', href: '/consult', helper: '固定アドバイス確認' },
  { label: '資料ライブラリ', href: '/library', helper: '仮の記事カード' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rating?: string;
    level?: SkillLevelId;
    machine?: string;
    concern?: string;
  }>();

  const rating = params.rating ?? '7';
  const level = params.level ?? 'intermediate';
  const recommended = practiceMenus.find((menu) => menu.level === level) ?? practiceMenus[0];

  return (
    <ScreenShell>
      <View style={styles.header}>
        <Image source={logo} resizeMode="contain" style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={styles.appName}>DartsSupportApp</Text>
          <Text style={styles.meta}>{levelLabels[level]}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="現在レーティング"
          value={`RT ${rating}`}
          helper={params.machine ?? 'DARTSLIVE'}
        />
        <StatCard label="今週の練習回数" value="3回" helper="目標まであと2回" />
      </View>

      <Card muted>
        <SectionTitle title="今日のおすすめ練習" subtitle={params.concern ?? 'クリケットが苦手'} />
        <Text style={styles.recommendTitle}>{recommended.title}</Text>
        <Text style={styles.recommendBody}>{recommended.purpose}</Text>
        <View style={styles.recommendFooter}>
          <Text style={styles.pill}>{recommended.duration}</Text>
          <Text style={styles.pill}>{recommended.game}</Text>
        </View>
      </Card>

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
  recommendTitle: {
    marginTop: 14,
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
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
