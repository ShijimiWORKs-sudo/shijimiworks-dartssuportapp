import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../constants/theme';
import { concerns } from '../constants/mockData';
import { getLevelFromRating, levelLabels } from '../constants/levels';
import type { DartMachine } from '../types';

const logo = require('../assets/images/logo.png');

const machines: { label: string; value: DartMachine }[] = [
  { label: 'DARTSLIVE', value: 'DARTSLIVE' },
  { label: 'PHOENIX', value: 'PHOENIX' },
  { label: '両方', value: 'BOTH' },
];

export default function SetupScreen() {
  const router = useRouter();
  const [ratingText, setRatingText] = useState('7');
  const [machine, setMachine] = useState<DartMachine>('DARTSLIVE');
  const [concern, setConcern] = useState(concerns[1]);

  const rating = Number(ratingText) || 1;
  const level = useMemo(() => getLevelFromRating(rating), [rating]);

  return (
    <ScreenShell showNav={false}>
      <View style={styles.hero}>
        <Image source={logo} resizeMode="contain" style={styles.logo} />
        <View style={styles.heroText}>
          <Text style={styles.appName}>DartsSupportApp</Text>
          <Text style={styles.lead}>まずは練習メニューを出すための初期設定をします。</Text>
        </View>
      </View>

      <Card>
        <SectionTitle title="レーティング" subtitle="数字を入れるとレベルを自動判定します。" />
        <TextInput
          value={ratingText}
          onChangeText={setRatingText}
          keyboardType="decimal-pad"
          placeholder="例: 7"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <View style={styles.levelBox}>
          <Text style={styles.levelLabel}>現在レベル</Text>
          <Text style={styles.levelValue}>{levelLabels[level]}</Text>
        </View>
      </Card>

      <Card>
        <SectionTitle title="利用機種" />
        <View style={styles.chipGrid}>
          {machines.map((item) => (
            <ChoiceChip
              key={item.value}
              label={item.label}
              selected={machine === item.value}
              onPress={() => setMachine(item.value)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle title="主な悩み" subtitle="MVPでは1つだけ選択します。" />
        <View style={styles.chipGrid}>
          {concerns.map((item) => (
            <ChoiceChip
              key={item}
              label={item}
              selected={concern === item}
              onPress={() => setConcern(item)}
            />
          ))}
        </View>
      </Card>

      <AppButton
        label="はじめる"
        onPress={() =>
          router.push({
            pathname: '/home',
            params: { rating: String(rating), level, machine, concern },
          })
        }
      />
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

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 76,
    height: 76,
  },
  heroText: {
    flex: 1,
    gap: 6,
  },
  appName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  lead: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
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
  pressed: {
    opacity: 0.74,
  },
});
