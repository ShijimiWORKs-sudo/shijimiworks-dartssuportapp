import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { fixedAdvice } from '../constants/mockData';
import { colors } from '../constants/theme';

const categories = [
  'スタンス',
  'グリップ',
  'テイクバック',
  'リリース',
  'フォロースルー',
  'メンタル',
  'イップス',
];

export default function ConsultScreen() {
  const [category, setCategory] = useState(categories[3]);
  const [hasAsked, setHasAsked] = useState(false);

  return (
    <ScreenShell>
      <SectionTitle title="フォーム相談" subtitle="AI連携前の固定アドバイス表示です。" />

      <Card>
        <Text style={styles.label}>相談カテゴリ</Text>
        <View style={styles.chipGrid}>
          {categories.map((item) => {
            const selected = item === category;

            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => {
                  setCategory(item);
                  setHasAsked(false);
                }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>悩み入力</Text>
        <TextInput
          multiline
          placeholder="例: 右に抜けることが多く、3投目だけ力みます。"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </Card>

      <AppButton label="相談する" onPress={() => setHasAsked(true)} />

      {hasAsked ? (
        <Card muted>
          <Text style={styles.answerTitle}>{category}の固定アドバイス</Text>
          <Text style={styles.answerBody}>{fixedAdvice[category]}</Text>
        </Card>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: 4,
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 18,
  },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  chipTextSelected: {
    color: colors.primaryDark,
  },
  input: {
    minHeight: 120,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    textAlignVertical: 'top',
    backgroundColor: colors.background,
  },
  answerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  answerBody: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});
