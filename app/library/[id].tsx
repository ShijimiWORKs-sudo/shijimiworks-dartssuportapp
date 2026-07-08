import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { consultAdvice } from '../../constants/consultAdvice';
import { getKnowledgeArticleById } from '../../constants/knowledgeBase';
import { getPracticeMenuById } from '../../constants/practiceMenus';
import { colors } from '../../constants/theme';

const categoryLabels: Record<string, string> = {
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

export default function KnowledgeArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const article = id ? getKnowledgeArticleById(id) : null;

  if (!article) {
    return (
      <ScreenShell>
        <SectionTitle
          title="記事が見つかりません"
          subtitle="資料ライブラリからもう一度選択してください。"
        />
        <AppButton label="資料ライブラリへ戻る" onPress={() => router.replace('/library')} />
      </ScreenShell>
    );
  }

  const relatedMenus = article.relatedPracticeMenuIds
    .map((practiceMenuId) => getPracticeMenuById(practiceMenuId))
    .filter((menu): menu is NonNullable<typeof menu> => menu !== null);
  const relatedAdvice = consultAdvice.filter((advice) =>
    article.relatedAdviceIds.includes(advice.id),
  );

  return (
    <ScreenShell>
      <SectionTitle
        title={article.title}
        subtitle={categoryLabels[article.category] ?? article.category}
      />

      <Card muted>
        <Text style={styles.summary}>{article.summary}</Text>
        <View style={styles.tags}>
          {article.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>本文</Text>
        <Text style={styles.bodyText}>{article.body}</Text>
      </Card>

      <SectionTitle title="関連練習メニュー" />
      {relatedMenus.length ? (
        relatedMenus.map((menu) => (
          <Card key={menu.id}>
            <Text style={styles.itemTitle}>{menu.title}</Text>
            <Text style={styles.bodyText}>{menu.purpose}</Text>
            <View style={styles.actionStack}>
              <AppButton
                label="関連練習を開く"
                onPress={() => router.push(`/practice/${menu.id}`)}
                variant="secondary"
              />
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.bodyText}>関連練習メニューはまだ設定されていません。</Text>
        </Card>
      )}

      <SectionTitle title="関連相談アドバイス" />
      {relatedAdvice.map((advice) => (
        <Card key={advice.id}>
          <Text style={styles.itemTitle}>{advice.title}</Text>
          <Text style={styles.bodyText}>{advice.adviceSummary}</Text>
        </Card>
      ))}

      <Card muted>
        <Text style={styles.cardTitle}>sourceNotes</Text>
        <View style={styles.list}>
          {article.sourceNotes?.map((note) => (
            <Text key={note} style={styles.bodyText}>
              - {note}
            </Text>
          ))}
        </View>
      </Card>

      <AppButton
        label="相談画面へ戻る"
        onPress={() => router.push('/consult')}
        variant="secondary"
      />
      <AppButton label="資料ライブラリへ戻る" onPress={() => router.push('/library')} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  summary: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 23,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  itemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  bodyText: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
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
  actionStack: {
    marginTop: 14,
  },
  list: {
    gap: 4,
  },
});
