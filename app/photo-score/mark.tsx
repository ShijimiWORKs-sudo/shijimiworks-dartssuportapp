import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { PhotoBoardCanvas } from '../../components/PhotoBoardCanvas';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { dartHitAreaLabels } from '../../constants/photoScore';
import { colors } from '../../constants/theme';
import type { BoardCalibration, DartHitResult, NormalizedPoint } from '../../types';
import { calculateDartHit, calculatePhotoScoreSummary } from '../../utils/calculateDartScore';

export default function PhotoScoreMarkScreen() {
  const router = useRouter();
  const { calibration, imageUri } = useLocalSearchParams<{
    calibration?: string;
    imageUri?: string;
  }>();
  const normalizedImageUri = imageUri ?? '';
  const parsedCalibration = useMemo(() => parseCalibration(calibration), [calibration]);
  const [hits, setHits] = useState<DartHitResult[]>([]);
  const summary = calculatePhotoScoreSummary(hits);
  const markers = hits.map((hit, index) => ({
    id: hit.id,
    point: hit.point,
    label: String(index + 1),
    color:
      hit.area === 'out' ? colors.danger : hit.area === 'triple' ? colors.warning : colors.primary,
  }));

  const handlePoint = (point: NormalizedPoint) => {
    if (!parsedCalibration || hits.length >= 3) {
      return;
    }

    const nextHit = calculateDartHit(parsedCalibration, point, `dart-${hits.length + 1}`);
    setHits((currentHits) => [...currentHits, nextHit]);
  };

  const goResult = () => {
    if (!parsedCalibration || hits.length !== 3) {
      return;
    }

    router.push({
      pathname: '/photo-score/result',
      params: {
        imageUri: normalizedImageUri,
        calibration: JSON.stringify(parsedCalibration),
        hits: JSON.stringify(hits),
      },
    });
  };

  if (!normalizedImageUri || !parsedCalibration) {
    return (
      <ScreenShell>
        <SectionTitle
          title="設定がありません"
          subtitle="写真スコア記録を最初からやり直してください。"
        />
        <AppButton label="写真選択へ戻る" onPress={() => router.replace('/photo-score')} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionTitle
        title="刺さった位置をタップ"
        subtitle={`3本中 ${hits.length} 本を記録しました。タップした順に1〜3で表示します。`}
      />

      <Card>
        <PhotoBoardCanvas
          imageUri={normalizedImageUri}
          markers={markers}
          calibration={parsedCalibration}
          onPressPoint={handlePoint}
          helperText="ダーツが刺さった先端位置をタップしてください。間違えた場合は1つ戻せます。"
        />
      </Card>

      <Card muted>
        <Text style={styles.summaryTitle}>現在の判定</Text>
        <Text style={styles.summaryText}>
          合計 {summary.totalScore} / Bull {summary.bullCount} / Triple {summary.tripleCount} /
          Double {summary.doubleCount}
        </Text>
        <View style={styles.hitList}>
          {hits.map((hit, index) => (
            <Text key={hit.id} style={styles.hitText}>
              {index + 1}. {formatHit(hit)}
            </Text>
          ))}
        </View>
      </Card>

      <View style={styles.actionStack}>
        <AppButton
          label="1つ戻す"
          onPress={() => setHits((currentHits) => currentHits.slice(0, -1))}
          variant="secondary"
        />
        <AppButton label="結果を見る" onPress={goResult} />
        <AppButton
          label="キャリブレーションへ戻る"
          onPress={() => router.replace('/photo-score')}
          variant="secondary"
        />
      </View>
    </ScreenShell>
  );
}

function parseCalibration(value: string | undefined): BoardCalibration | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as BoardCalibration;
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

const styles = StyleSheet.create({
  summaryTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  summaryText: {
    marginTop: 8,
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 21,
  },
  hitList: {
    gap: 6,
    marginTop: 12,
  },
  hitText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  actionStack: {
    gap: 10,
  },
});
