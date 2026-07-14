import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { getPracticeMenuById } from '../../constants/practiceMenus';
import { colors } from '../../constants/theme';
import { useAppState } from '../../contexts/AppStateContext';
import type { TodayPracticeItem } from '../../types';

export default function TodayPracticeScreen() {
  const router = useRouter();
  const {
    theme,
    getTodayPracticeItemsForDate,
    getTodayPracticeProgressForDate,
    reorderTodayPractice,
    startTodayPractice,
    pauseTodayPractice,
    resumeTodayPractice,
    cancelTodayPractice,
    getRunningTodayPracticeSession,
  } = useAppState();
  const items = getTodayPracticeItemsForDate();
  const progress = getTodayPracticeProgressForDate();
  const runningSession = getRunningTodayPracticeSession();

  const handleStart = async (item: TodayPracticeItem) => {
    const session = await startTodayPractice(item.id, true);

    if (session) {
      router.push(`/practice/session/${item.id}`);
    }
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="今日の練習"
        subtitle="メニューを並べて、実施・中断・完了まで管理します。正式ゲーム進行ではなく練習管理用です。"
      />

      <Card muted>
        <View style={styles.progressRow}>
          <ProgressItem
            label="完了"
            value={`${progress.completedCount}/${progress.plannedCount}`}
          />
          <ProgressItem
            label="時間"
            value={`${Math.floor(progress.totalActualDurationSeconds / 60)}分`}
          />
          <ProgressItem label="達成率" value={`${progress.countProgressRate}%`} />
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${progress.countProgressRate}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>
        {progress.nextItem ? (
          <Text style={styles.bodyText}>
            次は「{getPracticeMenuById(progress.nextItem.practiceMenuId)?.title ?? '練習メニュー'}」
            です。
          </Text>
        ) : (
          <Text style={styles.bodyText}>
            今日の練習はまだ空です。おすすめやメニューDBから追加できます。
          </Text>
        )}
      </Card>

      <View style={styles.actionRow}>
        <AppButton label="練習を追加" onPress={() => router.push('/practice/today/select')} />
        <AppButton
          label="メニューDBを見る"
          onPress={() => router.push('/practice')}
          variant="secondary"
        />
      </View>

      {items.length === 0 ? (
        <Card>
          <SectionTitle
            title="今日の練習は未作成"
            subtitle="まずは1つ追加して、短時間で進められるメニューにしましょう。"
            tone="card"
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const menu = getPracticeMenuById(item.practiceMenuId);
            const isRunningElsewhere =
              runningSession && runningSession.todayPracticeItemId !== item.id;

            return (
              <Card key={item.id}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleBlock}>
                    <Text style={styles.orderText}>#{item.order}</Text>
                    <Text style={styles.cardTitle}>{menu?.title ?? '練習メニュー'}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.bodyText}>
                  目安 {item.plannedDurationMinutes}分
                  {item.plannedRounds ? ` / ${item.plannedRounds}R` : ''}
                  {item.plannedSets ? ` / ${item.plannedSets}セット` : ''}
                </Text>
                {item.note ? <Text style={styles.bodyText}>メモ: {item.note}</Text> : null}
                {isRunningElsewhere ? (
                  <Text style={styles.warningText}>
                    別の練習が実施中です。開始すると先に実施中の練習を一時停止します。
                  </Text>
                ) : null}

                <View style={styles.buttonGrid}>
                  {item.status === 'in_progress' ? (
                    <AppButton
                      label="一時停止"
                      onPress={() => void pauseTodayPractice(item.id)}
                      variant="secondary"
                    />
                  ) : (
                    <AppButton
                      label={item.status === 'paused' ? '再開' : '開始'}
                      onPress={() =>
                        item.status === 'paused'
                          ? void resumeTodayPractice(item.id)
                          : void handleStart(item)
                      }
                      disabled={item.status === 'completed' || item.status === 'cancelled'}
                    />
                  )}
                  <AppButton
                    label="実施画面"
                    onPress={() => router.push(`/practice/session/${item.id}`)}
                    variant="secondary"
                    disabled={item.status === 'cancelled'}
                  />
                </View>
                <View style={styles.miniActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void reorderTodayPractice(item.id, 'up')}
                    style={styles.textAction}
                  >
                    <Text style={styles.textActionLabel}>上へ</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void reorderTodayPractice(item.id, 'down')}
                    style={styles.textAction}
                  >
                    <Text style={styles.textActionLabel}>下へ</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void cancelTodayPractice(item.id, true)}
                    style={styles.textAction}
                  >
                    <Text style={[styles.textActionLabel, styles.cancelText]}>キャンセル</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScreenShell>
  );
}

function ProgressItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.progressItem}>
      <Text style={styles.progressValue}>{value}</Text>
      <Text style={styles.progressLabel}>{label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: TodayPracticeItem['status'] }) {
  const labels: Record<TodayPracticeItem['status'], string> = {
    planned: '予定',
    in_progress: '実施中',
    paused: '一時停止',
    completed: '完了',
    cancelled: '中止',
  };

  return (
    <View style={[styles.statusBadge, status === 'completed' && styles.statusDone]}>
      <Text style={styles.statusLabel}>{labels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    gap: 10,
  },
  progressItem: {
    flex: 1,
    minHeight: 66,
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  progressValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  progressLabel: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 10,
    marginTop: 14,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
  },
  bodyText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  warningText: {
    marginTop: 10,
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  actionRow: {
    gap: 10,
  },
  list: {
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitleBlock: {
    flex: 1,
  },
  orderText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  cardTitle: {
    marginTop: 4,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  statusDone: {
    backgroundColor: '#DCFCE7',
  },
  statusLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  buttonGrid: {
    gap: 10,
    marginTop: 14,
  },
  miniActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  textAction: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  textActionLabel: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  cancelText: {
    color: colors.danger,
  },
});
