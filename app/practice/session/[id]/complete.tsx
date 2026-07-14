import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../../../components/AppButton';
import { Card } from '../../../../components/Card';
import { ScreenShell } from '../../../../components/ScreenShell';
import { SectionTitle } from '../../../../components/SectionTitle';
import { conditionLabels } from '../../../../constants/labels';
import { getPracticeMenuById } from '../../../../constants/practiceMenus';
import { colors } from '../../../../constants/theme';
import { useAppState } from '../../../../contexts/AppStateContext';
import { calculateSessionElapsedSeconds } from '../../../../features/practice/today/application/todayPracticeService';
import type { Condition } from '../../../../types';

const conditions: Condition[] = ['good', 'normal', 'bad'];

export default function PracticeSessionCompleteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getTodayPracticeItemById,
    getActivePracticeSessionByItemId,
    completeTodayPractice,
    theme,
  } = useAppState();
  const item = id ? getTodayPracticeItemById(id) : null;
  const session = id ? getActivePracticeSessionByItemId(id) : null;
  const menu = item ? getPracticeMenuById(item.practiceMenuId) : null;
  const initialDurationSeconds = useMemo(
    () => (session ? calculateSessionElapsedSeconds(session) : (item?.actualDurationSeconds ?? 0)),
    [item?.actualDurationSeconds, session],
  );
  const [durationMinutes, setDurationMinutes] = useState(
    `${Math.max(1, Math.round(initialDurationSeconds / 60) || item?.plannedDurationMinutes || 20)}`,
  );
  const [completedRounds, setCompletedRounds] = useState('');
  const [completedSets, setCompletedSets] = useState('');
  const [score, setScore] = useState('');
  const [bullCount, setBullCount] = useState('');
  const [achievementRate, setAchievementRate] = useState('');
  const [condition, setCondition] = useState<Condition>('normal');
  const [note, setNote] = useState(item?.note ?? '');
  const [nextMemo, setNextMemo] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!item || !menu) {
    return (
      <ScreenShell>
        <SectionTitle
          title="練習が見つかりません"
          subtitle="今日の練習一覧から選び直してください。"
        />
        <AppButton label="今日の練習へ戻る" onPress={() => router.replace('/practice/today')} />
      </ScreenShell>
    );
  }

  const handleSave = async () => {
    setError('');
    const durationValue = parseInteger(durationMinutes);
    const achievementValue = achievementRate.trim() ? parseInteger(achievementRate) : undefined;

    if (!durationValue || durationValue <= 0) {
      setError('実施時間を1分以上で入力してください。');
      return;
    }

    if (achievementValue !== undefined && (achievementValue < 0 || achievementValue > 100)) {
      setError('達成率は0〜100で入力してください。');
      return;
    }

    setIsSaving(true);
    const savedRecord = await completeTodayPractice(item.id, {
      actualDurationSeconds: durationValue * 60,
      completedRounds: optionalInteger(completedRounds),
      completedSets: optionalInteger(completedSets),
      resultScore: optionalInteger(score),
      resultBullCount: optionalInteger(bullCount),
      resultCondition: condition,
      achievementRate: achievementValue,
      note,
      nextMemo,
    });
    setIsSaving(false);

    if (savedRecord) {
      router.replace('/analysis');
    } else {
      setError('保存できませんでした。今日の練習一覧から状態を確認してください。');
    }
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="練習完了入力"
        subtitle="実施結果を保存すると、練習記録と分析に反映されます。"
      />

      <Card>
        <SectionTitle title={menu.title} subtitle="今日の練習から保存します。" tone="card" />
        <InputField
          label="実施時間（分）"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
        />
        <View style={styles.twoColumns}>
          <InputField label="完了R" value={completedRounds} onChangeText={setCompletedRounds} />
          <InputField label="完了セット" value={completedSets} onChangeText={setCompletedSets} />
        </View>
        <View style={styles.twoColumns}>
          <InputField label="スコア" value={score} onChangeText={setScore} />
          <InputField label="Bull数" value={bullCount} onChangeText={setBullCount} />
        </View>
        <InputField
          label="達成率（0〜100）"
          value={achievementRate}
          onChangeText={setAchievementRate}
        />

        <Text style={styles.label}>調子</Text>
        <View style={styles.chipRow}>
          {conditions.map((itemCondition) => {
            const selected = itemCondition === condition;

            return (
              <Pressable
                key={itemCondition}
                accessibilityRole="button"
                onPress={() => setCondition(itemCondition)}
                style={[styles.chip, selected && { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {conditionLabels[itemCondition]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <InputField label="メモ" value={note} onChangeText={setNote} multiline />
        <InputField label="次回メモ" value={nextMemo} onChangeText={setNextMemo} multiline />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>

      <View style={styles.actions}>
        <AppButton
          label={isSaving ? '保存中...' : 'この内容で保存'}
          onPress={() => void handleSave()}
          disabled={isSaving}
        />
        <AppButton
          label="位置を戻る"
          onPress={() => router.push(`/practice/session/${item.id}`)}
          variant="secondary"
        />
      </View>
    </ScreenShell>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType={multiline ? 'default' : 'numeric'}
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalInteger(value: string) {
  return value.trim() ? parseInteger(value) : undefined;
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
    marginTop: 14,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: colors.surface,
  },
  textArea: {
    minHeight: 86,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  errorText: {
    marginTop: 14,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  actions: {
    gap: 10,
  },
});
