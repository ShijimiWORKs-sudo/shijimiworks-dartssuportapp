import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { Card } from '../../../components/Card';
import { ScreenShell } from '../../../components/ScreenShell';
import { SectionTitle } from '../../../components/SectionTitle';
import { gameLabels, machineLabels } from '../../../constants/labels';
import { levelLabels } from '../../../constants/levels';
import { matchesMachine, practiceMenus } from '../../../constants/practiceMenus';
import { colors } from '../../../constants/theme';
import { useAppState } from '../../../contexts/AppStateContext';
import type { DartMachine, PracticeGame, PracticeMenu, SkillLevelId } from '../../../types';
import { recommendPracticeMenus } from '../../../utils/recommendPracticeMenus';

type LevelFilter = SkillLevelId | 'all';
type MachineFilter = DartMachine | 'all';
type GameFilter = PracticeGame | 'all';

const levelFilters: { label: string; value: LevelFilter }[] = [
  { label: 'すべて', value: 'all' },
  { label: levelLabels.beginner, value: 'beginner' },
  { label: levelLabels.intermediate, value: 'intermediate' },
  { label: levelLabels.advanced, value: 'advanced' },
];

const gameFilters: { label: string; value: GameFilter }[] = [
  { label: 'すべて', value: 'all' },
  { label: gameLabels['COUNT-UP'], value: 'COUNT-UP' },
  { label: gameLabels['01'], value: '01' },
  { label: gameLabels.CRICKET, value: 'CRICKET' },
  { label: gameLabels.OTHER, value: 'OTHER' },
];

const machineFilters: { label: string; value: MachineFilter }[] = [
  { label: 'すべて', value: 'all' },
  { label: machineLabels.DARTSLIVE, value: 'DARTSLIVE' },
  { label: machineLabels.PHOENIX, value: 'PHOENIX' },
  { label: machineLabels.BOTH, value: 'BOTH' },
];

export default function TodayPracticeSelectScreen() {
  const router = useRouter();
  const { profile, records, addTodayPractice, todayPracticeDefaultDurationMinutes, theme } =
    useAppState();
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>(profile?.level ?? 'all');
  const [gameFilter, setGameFilter] = useState<GameFilter>('all');
  const [machineFilter, setMachineFilter] = useState<MachineFilter>(profile?.machineType ?? 'all');
  const recommendation = useMemo(
    () => recommendPracticeMenus(profile, records),
    [profile, records],
  );
  const recommendedIds = useMemo(
    () => new Set(recommendation.todayMenus.map((item) => item.menu.id)),
    [recommendation.todayMenus],
  );

  const filteredMenus = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return practiceMenus
      .filter((menu) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          menu.title.toLowerCase().includes(normalizedQuery) ||
          menu.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
          menu.purpose.toLowerCase().includes(normalizedQuery);
        const matchesLevel = levelFilter === 'all' || menu.level === levelFilter;
        const matchesGame = gameFilter === 'all' || menu.gameTypes.includes(gameFilter);
        const matchesSelectedMachine =
          machineFilter === 'all' || matchesMachine(menu.machineTypes, machineFilter);

        return matchesQuery && matchesLevel && matchesGame && matchesSelectedMachine;
      })
      .sort((a, b) => Number(recommendedIds.has(b.id)) - Number(recommendedIds.has(a.id)))
      .slice(0, 20);
  }, [gameFilter, levelFilter, machineFilter, query, recommendedIds]);

  const handleAdd = async (menu: PracticeMenu) => {
    await addTodayPractice({
      practiceMenuId: menu.id,
      plannedDurationMinutes: menu.durationMinutes || todayPracticeDefaultDurationMinutes,
    });
    router.replace('/practice/today');
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="今日の練習を追加"
        subtitle="おすすめやメニューDBから、今日実施する練習を選びます。"
      />

      <TextInput
        accessibilityLabel="練習メニュー検索"
        value={query}
        onChangeText={setQuery}
        placeholder="メニュー名・タグで検索"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />

      <FilterGroup
        title="レベル"
        items={levelFilters}
        value={levelFilter}
        onChange={setLevelFilter}
      />
      <FilterGroup title="ゲーム" items={gameFilters} value={gameFilter} onChange={setGameFilter} />
      <FilterGroup
        title="機種"
        items={machineFilters}
        value={machineFilter}
        onChange={setMachineFilter}
      />

      <Text style={[styles.resultText, { color: theme.onBackgroundMuted }]}>
        {filteredMenus.length}件表示
      </Text>

      <View style={styles.list}>
        {filteredMenus.map((menu) => (
          <Card key={menu.id} muted={recommendedIds.has(menu.id)}>
            <View style={styles.menuHeader}>
              <View style={styles.menuTextBlock}>
                <Text style={styles.menuTitle}>{menu.title}</Text>
                <Text style={styles.menuMeta}>
                  {levelLabels[menu.level]} / {menu.durationMinutes}分 /{' '}
                  {menu.gameTypes.map((gameType) => gameLabels[gameType]).join('・')}
                </Text>
              </View>
              {recommendedIds.has(menu.id) ? (
                <Text style={styles.recommendedBadge}>おすすめ</Text>
              ) : null}
            </View>
            <Text style={styles.bodyText}>{menu.purpose}</Text>
            <View style={styles.actionRow}>
              <AppButton
                label="今日に追加"
                onPress={() => void handleAdd(menu)}
                accessibilityLabel={`${menu.title}を今日の練習に追加`}
              />
              <AppButton
                label="詳細"
                onPress={() => router.push(`/practice/${menu.id}`)}
                variant="secondary"
              />
            </View>
          </Card>
        ))}
      </View>
    </ScreenShell>
  );
}

type FilterGroupProps<T extends string> = {
  title: string;
  items: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
};

function FilterGroup<T extends string>({ title, items, value, onChange }: FilterGroupProps<T>) {
  const { theme } = useAppState();

  return (
    <View style={styles.filterGroup}>
      <Text style={[styles.filterTitle, { color: theme.onBackground }]}>{title}</Text>
      <View style={styles.chipGrid}>
        {items.map((item) => {
          const selected = item.value === value;

          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              onPress={() => onChange(item.value)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    backgroundColor: colors.surface,
  },
  filterGroup: {
    gap: 8,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  resultText: {
    fontSize: 13,
    fontWeight: '800',
  },
  list: {
    gap: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  menuTextBlock: {
    flex: 1,
  },
  menuTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  menuMeta: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  recommendedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    backgroundColor: colors.primarySoft,
  },
  bodyText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  actionRow: {
    gap: 10,
    marginTop: 14,
  },
});
