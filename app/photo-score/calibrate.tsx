import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { PhotoBoardCanvas } from '../../components/PhotoBoardCanvas';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { boardTypeLabels } from '../../constants/photoScore';
import { colors } from '../../constants/theme';
import type { BoardCalibration, BoardType, NormalizedPoint } from '../../types';
import { getDistance } from '../../utils/calculateDartScore';

const steps = [
  {
    title: '中心をタップ',
    helper: 'ブルの中心をタップしてください。',
  },
  {
    title: '20方向をタップ',
    helper: '20の中心方向、または20セクターの真ん中をタップしてください。',
  },
  {
    title: '外周をタップ',
    helper: 'ダブル外側の外周位置をタップしてください。',
  },
] as const;

export default function PhotoScoreCalibrateScreen() {
  const router = useRouter();
  const { boardType, imageUri } = useLocalSearchParams<{
    boardType?: BoardType;
    imageUri?: string;
  }>();
  const [points, setPoints] = useState<NormalizedPoint[]>([]);
  const currentStep = steps[Math.min(points.length, steps.length - 1)];
  const normalizedBoardType = boardType ?? 'OTHER';
  const normalizedImageUri = imageUri ?? '';
  const calibration = useMemo<BoardCalibration | null>(() => {
    if (points.length < 3) {
      return null;
    }

    return {
      boardType: normalizedBoardType,
      center: points[0],
      topNumberPoint: points[1],
      outerRadius: getDistance(points[0], points[2]),
      ringPreset: 'soft',
    };
  }, [normalizedBoardType, points]);

  const markers = points.map((point, index) => ({
    id: `calibration-${index}`,
    point,
    label: index === 0 ? '中心' : index === 1 ? '20' : '外',
    color: index === 0 ? colors.primary : index === 1 ? colors.warning : colors.info,
  }));

  const handlePoint = (point: NormalizedPoint) => {
    if (points.length >= 3) {
      return;
    }

    setPoints((currentPoints) => [...currentPoints, point]);
  };

  const goNext = () => {
    if (!calibration) {
      return;
    }

    router.push({
      pathname: '/photo-score/mark',
      params: {
        imageUri: normalizedImageUri,
        calibration: JSON.stringify(calibration),
      },
    });
  };

  if (!normalizedImageUri) {
    return (
      <ScreenShell>
        <SectionTitle
          title="写真がありません"
          subtitle="写真スコア記録を最初からやり直してください。"
        />
        <AppButton label="写真選択へ戻る" onPress={() => router.replace('/photo-score')} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionTitle
        title="ボード設定"
        subtitle={`${boardTypeLabels[normalizedBoardType]} / ${points.length}/3 点を設定`}
      />

      <Card>
        <Text style={styles.stepTitle}>{currentStep.title}</Text>
        <PhotoBoardCanvas
          imageUri={normalizedImageUri}
          markers={markers}
          calibration={calibration}
          onPressPoint={handlePoint}
          helperText={currentStep.helper}
        />
      </Card>

      <Card muted>
        <Text style={styles.bodyText}>
          タップを間違えた場合は「1つ戻す」で修正できます。外周半径は中心から外周タップ位置までの距離で計算します。
        </Text>
      </Card>

      <View style={styles.actionStack}>
        <AppButton
          label="1つ戻す"
          onPress={() => setPoints((currentPoints) => currentPoints.slice(0, -1))}
          variant="secondary"
        />
        <AppButton label="3本の位置をタップへ" onPress={goNext} />
        <AppButton
          label="写真選択へ戻る"
          onPress={() => router.replace('/photo-score')}
          variant="secondary"
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stepTitle: {
    marginBottom: 10,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  actionStack: {
    gap: 10,
  },
});
