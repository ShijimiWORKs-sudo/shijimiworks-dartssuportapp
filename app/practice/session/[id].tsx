import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { Card } from '../../../components/Card';
import { ScreenShell } from '../../../components/ScreenShell';
import { SectionTitle } from '../../../components/SectionTitle';
import { getPracticeMenuById } from '../../../constants/practiceMenus';
import { colors } from '../../../constants/theme';
import { useAppState } from '../../../contexts/AppStateContext';
import { calculateSessionElapsedSeconds } from '../../../features/practice/today/application/todayPracticeService';

export default function PracticeSessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getTodayPracticeItemById,
    getActivePracticeSessionByItemId,
    startTodayPractice,
    pauseTodayPractice,
    resumeTodayPractice,
    cancelTodayPractice,
    theme,
  } = useAppState();
  const item = id ? getTodayPracticeItemById(id) : null;
  const session = id ? getActivePracticeSessionByItemId(id) : null;
  const menu = item ? getPracticeMenuById(item.practiceMenuId) : null;
  const [elapsedSeconds, setElapsedSeconds] = useState(
    session ? calculateSessionElapsedSeconds(session) : (item?.actualDurationSeconds ?? 0),
  );

  useEffect(() => {
    setElapsedSeconds(
      session ? calculateSessionElapsedSeconds(session) : (item?.actualDurationSeconds ?? 0),
    );

    const intervalId = setInterval(() => {
      setElapsedSeconds(
        session ? calculateSessionElapsedSeconds(session) : (item?.actualDurationSeconds ?? 0),
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, [item?.actualDurationSeconds, session]);

  const progressRate = useMemo(() => {
    const plannedSeconds = (item?.plannedDurationMinutes ?? 0) * 60;

    return plannedSeconds === 0
      ? 0
      : Math.min(100, Math.round((elapsedSeconds / plannedSeconds) * 100));
  }, [elapsedSeconds, item?.plannedDurationMinutes]);

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

  const canComplete = item.status !== 'completed' && item.status !== 'cancelled';

  return (
    <ScreenShell>
      <SectionTitle
        title="練習実施"
        subtitle="練習用タイマーです。正式ゲーム進行や対戦処理は行いません。"
      />

      <Card muted>
        <Text style={styles.menuTitle}>{menu.title}</Text>
        <Text style={styles.bodyText}>{menu.purpose}</Text>
        <View style={styles.timerBlock}>
          <Text style={styles.timerValue}>{formatDuration(elapsedSeconds)}</Text>
          <Text style={styles.timerLabel}>
            目安 {item.plannedDurationMinutes}分 / 進捗 {progressRate}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${progressRate}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle
          title="手順"
          subtitle="画面を見ながら、手元のボードで実施してください。"
          tone="card"
        />
        <View style={styles.steps}>
          {menu.steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <Text style={styles.stepIndex}>{index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.actions}>
        {!session || session.state === 'paused' ? (
          <AppButton
            label={item.status === 'paused' ? '再開' : '開始'}
            onPress={() =>
              item.status === 'paused'
                ? void resumeTodayPractice(item.id)
                : void startTodayPractice(item.id, true)
            }
            disabled={!canComplete}
          />
        ) : (
          <AppButton
            label="一時停止"
            onPress={() => void pauseTodayPractice(item.id)}
            variant="secondary"
            disabled={!canComplete}
          />
        )}
        <AppButton
          label="完了入力へ"
          onPress={() => router.push(`/practice/session/${item.id}/complete`)}
          disabled={!canComplete}
        />
        <AppButton
          label="今日の練習へ戻る"
          onPress={() => router.push('/practice/today')}
          variant="secondary"
        />
        <AppButton
          label="この練習を中止"
          onPress={() => void cancelTodayPractice(item.id, true)}
          variant="danger"
          disabled={!canComplete}
        />
      </View>
    </ScreenShell>
  );
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;

  return `${minutes}:${`${restSeconds}`.padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  menuTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  bodyText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  timerBlock: {
    alignItems: 'center',
    marginTop: 22,
  },
  timerValue: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '900',
  },
  timerLabel: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 12,
    marginTop: 18,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  progressBar: {
    height: '100%',
  },
  steps: {
    gap: 10,
    marginTop: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 24,
    textAlign: 'center',
    backgroundColor: colors.primary,
  },
  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    gap: 10,
  },
});
