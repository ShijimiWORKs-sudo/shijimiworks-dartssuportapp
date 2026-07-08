import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { libraryCategories } from '../constants/mockData';
import { practiceMenus } from '../constants/practiceMenus';
import { colors } from '../constants/theme';

export default function LibraryScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(libraryCategories[0].id);
  const selectedCategory = useMemo(
    () => libraryCategories.find((category) => category.id === selectedId) ?? libraryCategories[0],
    [selectedId],
  );

  return (
    <ScreenShell>
      <SectionTitle
        title="資料ライブラリ"
        subtitle="カテゴリを選ぶと仮の記事カードを表示します。"
      />

      <View style={styles.categoryGrid}>
        {libraryCategories.map((category) => {
          const selected = category.id === selectedId;

          return (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              onPress={() => setSelectedId(category.id)}
              style={[styles.categoryButton, selected && styles.categoryButtonSelected]}
            >
              <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                {category.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title={selectedCategory.title} subtitle="記事本文は次工程で追加予定です。" />
      {selectedCategory.articles.map((article) => (
        <Card key={article.id}>
          <Text style={styles.articleTitle}>{article.title}</Text>
          <Text style={styles.articleSummary}>{article.summary}</Text>
          <Text style={styles.articleMeta}>仮記事 / 要約カード</Text>
        </Card>
      ))}

      {selectedCategory.id === 'practice-menus' ? (
        <>
          <SectionTitle
            title="練習メニューから探す"
            subtitle="関連資料との紐づけ準備用の一覧です。"
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
        </>
      ) : null}
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
  articleMeta: {
    marginTop: 12,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
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
