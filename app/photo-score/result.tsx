import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { PhotoBoardCanvas } from '../../components/PhotoBoardCanvas';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { boardTypeLabels, dartHitAreaLabels } from '../../constants/photoScore';
import { colors } from '../../constants/theme';
import { useAppState } from '../../contexts/AppStateContext';
import type { BoardCalibration, DartHitResult, PracticeRecordInput } from '../../types';
import { calculatePhotoScoreSummary } from '../../utils/calculateDartScore';

export default function PhotoScoreResultScreen() {
  const router = useRouter();
  const { addPracticeRecord, profile } = useAppState();
  const { calibration, hits, imageUri } = useLocalSearchParams<{
    calibration?: string;
    hits?: string;
    imageUri?: string;
  }>();
  const parsedCalibration = useMemo(() => parseJson<BoardCalibration>(calibration), [calibration]);
  const parsedHits = useMemo(() => parseJson<DartHitResult[]>(hits) ?? [], [hits]);
  const summary = calculatePhotoScoreSummary(parsedHits);
  const [isSaving, setIsSaving] = useState(false);
  const normalizedImageUri = imageUri ?? '';
  const markers = parsedHits.map((hit, index) => ({
    id: hit.id,
    point: hit.point,
    label: String(index + 1),
    color:
      hit.area === 'out' ? colors.danger : hit.area === 'triple' ? colors.warning : colors.primary,
  }));

  const saveRecord = async () => {
    if (!parsedCalibration || parsedHits.length !== 3 || isSaving) {
      return;
    }

    setIsSaving(true);

    const record: PracticeRecordInput = {
      practiceMenuId: 'photo-score-round',
      practiceMenuName: '写真スコア記録',
      machineType: profile?.machineType === 'PHOENIX' ? 'PHOENIX' : 'DARTSLIVE',
      gameType: 'COUNT-UP',
      score: summary.totalScore,
      bullCount: summary.bullCount,
      cricketMarks: 0,
      condition: 'normal',
      memo: `写真スコア記録: ${parsedHits.map(formatHitShort).join(' / ')}`,
      inputMethod: 'photoTap',
      photoScore: {
        boardType: parsedCalibration.boardType,
        calibration: parsedCalibration,
        hits: parsedHits,
        totalScore: summary.totalScore,
        bullCount: summary.bullCount,
        tripleCount: summary.tripleCount,
        doubleCount: summary.doubleCount,
      },
    };

    await addPracticeRecord(record);
    router.replace('/analysis');
  };

  if (!parsedCalibration || parsedHits.length !== 3) {
    return (
      <ScreenShell>
        <SectionTitle
          title="判定結果がありません"
          subtitle="写真スコア記録を最初からやり直してください。"
        />
        <AppButton label="写真選択へ戻る" onPress={() => router.replace('/photo-score')} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionTitle
        title="写真スコア結果"
        subtitle={`${boardTypeLabels[parsedCalibration.boardType]} / 3本の判定結果`}
      />

      {normalizedImageUri ? (
        <Card>
          <PhotoBoardCanvas
            imageUri={normalizedImageUri}
            markers={markers}
            calibration={parsedCalibration}
            helperText="保存時には画像そのものではなく、座標と判定結果を練習記録へ保存します。"
          />
        </Card>
      ) : null}

      <View style={styles.statsRow}>
        <ResultStat label="合計" value={`${summary.totalScore}`} />
        <ResultStat label="Bull" value={`${summary.bullCount}`} />
      </View>
      <View style={styles.statsRow}>
        <ResultStat label="Triple" value={`${summary.tripleCount}`} />
        <ResultStat label="Double" value={`${summary.doubleCount}`} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>1本ごとの判定</Text>
        <View style={styles.hitList}>
          {parsedHits.map((hit, index) => (
            <Text key={hit.id} style={styles.hitText}>
              {index + 1}. {formatHit(hit)}
            </Text>
          ))}
        </View>
      </Card>

      <AppButton
        label={isSaving ? '保存中...' : '練習記録へ保存'}
        onPress={() => void saveRecord()}
      />
      <AppButton
        label="やり直す"
        onPress={() => router.replace('/photo-score')}
        variant="secondary"
      />
    </ScreenShell>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Card>
  );
}

function parseJson<T>(value: string | undefined): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function formatHit(hit: DartHitResult) {
  if (hit.area === 'singleBull' || hit.area === 'doubleBull' || hit.area === 'out') {
    return `${dartHitAreaLabels[hit.area]} / ${hit.score}点`;
  }

  return `${hit.number} ${dartHitAreaLabels[hit.area]} / ${hit.score}点`;
}

function formatHitShort(hit: DartHitResult) {
  if (hit.area === 'singleBull') {
    return 'SBULL';
  }

  if (hit.area === 'doubleBull') {
    return 'DBULL';
  }

  if (hit.area === 'out') {
    return 'OUT';
  }

  return `${hit.number} ${dartHitAreaLabels[hit.area]}`;
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  statValue: {
    marginTop: 6,
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  hitList: {
    gap: 8,
    marginTop: 12,
  },
  hitText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
  },
});
