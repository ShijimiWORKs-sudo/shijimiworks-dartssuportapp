import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../constants/theme';
import type { Condition, DartMachine, PracticeGame } from '../types';

const machines: DartMachine[] = ['DARTSLIVE', 'PHOENIX'];
const games: PracticeGame[] = ['COUNT-UP', '01', 'CRICKET', 'OTHER'];
const conditions: { label: string; value: Condition }[] = [
  { label: '良い', value: 'good' },
  { label: '普通', value: 'normal' },
  { label: '悪い', value: 'bad' },
];

export default function RecordScreen() {
  const router = useRouter();
  const [machine, setMachine] = useState<DartMachine>('DARTSLIVE');
  const [game, setGame] = useState<PracticeGame>('COUNT-UP');
  const [condition, setCondition] = useState<Condition>('normal');

  return (
    <ScreenShell>
      <SectionTitle title="練習記録入力" subtitle="保存ボタンで疑似的に分析画面へ遷移します。" />
      <Card>
        <TextInputField label="練習メニュー名" placeholder="例: 19カバードリル" />
        <ChoiceGroup title="機種" items={machines} value={machine} onChange={setMachine} />
        <ChoiceGroup title="ゲーム種別" items={games} value={game} onChange={setGame} />
        <TextInputField label="スコア入力" placeholder="例: 560" keyboardType="number-pad" />
        <TextInputField label="ブル数" placeholder="例: 12" keyboardType="number-pad" />
        <TextInputField label="クリケットマーク数" placeholder="例: 43" keyboardType="number-pad" />
        <TextInputField label="主観メモ" placeholder="2ラウンド目から力みが出た" multiline />
        <ChoiceGroup
          title="調子"
          items={conditions.map((item) => item.value)}
          value={condition}
          getLabel={(item) =>
            conditions.find((conditionItem) => conditionItem.value === item)?.label ?? item
          }
          onChange={setCondition}
        />
      </Card>
      <AppButton label="保存して分析へ" onPress={() => router.push('/analysis')} />
    </ScreenShell>
  );
}

type TextInputFieldProps = {
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
};

function TextInputField({
  label,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}: TextInputFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.memoInput]}
      />
    </View>
  );
}

type ChoiceGroupProps<T extends string> = {
  title: string;
  items: T[];
  value: T;
  getLabel?: (item: T) => string;
  onChange: (value: T) => void;
};

function ChoiceGroup<T extends string>({
  title,
  items,
  value,
  getLabel,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{title}</Text>
      <View style={styles.chipRow}>
        {items.map((item) => {
          const selected = item === value;

          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => onChange(item)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {getLabel ? getLabel(item) : item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
    marginBottom: 16,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    backgroundColor: colors.background,
  },
  memoInput: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
});
