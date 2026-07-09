import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { machineLabels } from '../constants/labels';
import { getLevelFromRating, levelLabels } from '../constants/levels';
import { concerns } from '../constants/mockData';
import { colors } from '../constants/theme';
import { useAppState } from '../contexts/AppStateContext';
import type { DartMachine, UiTheme, UserProfile } from '../types';

const machines: DartMachine[] = ['DARTSLIVE', 'PHOENIX', 'BOTH'];
const uiThemeOptions: { id: UiTheme; label: string }[] = [
  { id: 'gray', label: 'グレー系' },
  { id: 'light', label: '白系' },
];

export default function SettingsScreen() {
  const { isLoading, profile, uiTheme } = useAppState();

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionTitle title="設定を読み込み中" subtitle="保存済みプロフィールを確認しています。" />
      </ScreenShell>
    );
  }

  return (
    <SettingsForm key={`${profileKey(profile)}-${uiTheme}`} profile={profile} uiTheme={uiTheme} />
  );
}

type SettingsFormProps = {
  profile: UserProfile | null;
  uiTheme: UiTheme;
};

function SettingsForm({ profile, uiTheme }: SettingsFormProps) {
  const router = useRouter();
  const { saveProfileAndUiTheme } = useAppState();
  const [ratingText, setRatingText] = useState(profile ? String(profile.rating) : '7');
  const [machine, setMachine] = useState<DartMachine>(profile?.machineType ?? 'DARTSLIVE');
  const [selectedUiTheme, setSelectedUiTheme] = useState<UiTheme>(uiTheme);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(
    profile?.mainProblems.length ? profile.mainProblems : [concerns[1]],
  );
  const [error, setError] = useState('');

  const rating = Number(ratingText);
  const level = useMemo(() => getLevelFromRating(rating), [rating]);

  const handleSave = async () => {
    const normalizedRating = Number(ratingText);

    if (!ratingText.trim() || !Number.isFinite(normalizedRating) || normalizedRating < 1) {
      setError('レーティングは1以上の数字で入力してください。');
      return;
    }

    if (selectedConcerns.length === 0) {
      setError('主な悩みを1つ以上選択してください。');
      return;
    }

    setError('');
    await saveProfileAndUiTheme(
      {
        rating: normalizedRating,
        machineType: machine,
        mainProblems: selectedConcerns,
      },
      selectedUiTheme,
    );
    router.replace('/home');
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="設定を編集"
        subtitle="プロフィールを更新するとホームと練習メニューに反映されます。"
      />

      <Card>
        <SectionTitle title="レーティング" subtitle="変更するとレベルを自動再判定します。" />
        <TextInput
          value={ratingText}
          onChangeText={(value) => setRatingText(value.replace(/[^\d.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="例: 7"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <View style={styles.levelBox}>
          <Text style={styles.levelLabel}>現在レベル</Text>
          <Text style={styles.levelValue}>
            {Number.isFinite(rating) && rating >= 1 ? levelLabels[level] : '未判定'}
          </Text>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>

      <Card>
        <SectionTitle title="利用機種" />
        <View style={styles.chipGrid}>
          {machines.map((item) => (
            <ChoiceChip
              key={item}
              label={machineLabels[item]}
              selected={machine === item}
              onPress={() => setMachine(item)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle title="主な悩み" subtitle="複数選択できます。" />
        <View style={styles.chipGrid}>
          {concerns.map((item) => (
            <ChoiceChip
              key={item}
              label={item}
              selected={selectedConcerns.includes(item)}
              onPress={() =>
                setSelectedConcerns((currentConcerns) =>
                  currentConcerns.includes(item)
                    ? currentConcerns.filter((concern) => concern !== item)
                    : [...currentConcerns, item],
                )
              }
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle title="表示テーマ" subtitle="実機確認しやすい配色を選べます。" />
        <View style={styles.chipGrid}>
          {uiThemeOptions.map((item) => (
            <ChoiceChip
              key={item.id}
              label={item.label}
              selected={selectedUiTheme === item.id}
              onPress={() => setSelectedUiTheme(item.id)}
            />
          ))}
        </View>
      </Card>

      <AppButton label="保存してホームへ" onPress={handleSave} />
      <AppButton label="キャンセル" onPress={() => router.push('/home')} variant="secondary" />
    </ScreenShell>
  );
}

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function ChoiceChip({ label, selected, onPress }: ChoiceChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function profileKey(profile: UserProfile | null) {
  if (!profile) {
    return 'empty-profile';
  }

  return `${profile.rating}-${profile.level}-${profile.machineType}-${profile.mainProblems.join('-')}`;
}

const styles = StyleSheet.create({
  input: {
    marginTop: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    backgroundColor: colors.background,
  },
  levelBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  levelLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  levelValue: {
    marginTop: 4,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
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
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextSelected: {
    color: colors.primaryDark,
  },
  errorText: {
    marginTop: 10,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.74,
  },
});
