import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { knowledgeBase } from '../constants/knowledgeBase';
import { practiceMenus } from '../constants/practiceMenus';
import { colors } from '../constants/theme';

const categoryLabels: Record<string, string> = {
  all: 'すべて',
  stance: 'スタンス',
  grip: 'グリップ',
  release: 'リリース',
  mental: 'メンタル',
  yips: 'イップス',
  countUp: 'COUNT-UP',
  cricket: 'CRICKET',
  zeroOne: '01',
  routine: 'ルーティン',
  practicePlan: '練習計画',
};

export default function LibraryScreen() {
  const router = useRouter();
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(knowledgeBase.map((article) => article.category)))],
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState('all');
  const selectedArticles = useMemo(
    () =>
      selectedCategory === 'all'
        ? knowledgeBase
        : knowledgeBase.filter((article) => article.category === selectedCategory),
    [selectedCategory],
  );

  return (
    <ScreenShell>
      <SectionTitle
        title="資料ライブラリ"
        subtitle="フォーム相談と練習メニューに紐づく基礎資料です。"
      />

      <View style={styles.categoryGrid}>
        {categories.map((category) => {
          const selected = category === selectedCategory;

          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              onPress={() => setSelectedCategory(category)}
              style={[styles.categoryButton, selected && styles.categoryButtonSelected]}
            >
              <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                {categoryLabels[category] ?? category}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle
        title={categoryLabels[selectedCategory] ?? selectedCategory}
        subtitle={`${selectedArticles.length}件の記事`}
      />
      {selectedArticles.map((article) => (
        <Card key={article.id}>
          <Text style={styles.articleTitle}>{article.title}</Text>
          <Text style={styles.articleSummary}>{article.summary}</Text>
          <View style={styles.tags}>
            {article.tags.slice(0, 4).map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
          <View style={styles.cardAction}>
            <AppButton
              label="記事を読む"
              onPress={() => router.push(`/library/${article.id}`)}
              variant="secondary"
            />
          </View>
        </Card>
      ))}

      <SectionTitle
        title="練習メニューから探す"
        subtitle="資料と練習メニューの連携準備用一覧です。"
      />
      {practiceMenus.slice(0, 8).map((menu) => (
        <Pressable
          key={menu.id}
          accessibilityRole="button"
          onPress={() => router.push(`/practice/${menu.id}`)}
          style={({ pressed }) => [styles.practiceMenuRow, pressed && styles.pressed]}
        >
          <Text style={styles.practiceMenuTitle}>{menu.title}</Text>
          <Text style={styles.practiceMenuSummary}>
            {menu.tags.slice(0, 3).join(' / ')} / {menu.durationMinutes}分
          </Text>
        </Pressable>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  categoryTextSelected: {
    color: colors.primaryDark,
  },
  articleTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  articleSummary: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: colors.primarySoft,
  },
  cardAction: {
    marginTop: 14,
  },
  practiceMenuRow: {
    minHeight: 68,
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  practiceMenuTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  practiceMenuSummary: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.72,
  },
});
