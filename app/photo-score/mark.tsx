import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { PhotoBoardCanvas } from '../../components/PhotoBoardCanvas';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { dartHitAreaLabels } from '../../constants/photoScore';
import { colors } from '../../constants/theme';
import type {
  BoardCalibration,
  DartHitResult,
  NormalizedPoint,
  PhotoScoreCandidate,
  PhotoScoreDetectionMode,
} from '../../types';
import { calculatePhotoScoreSummary } from '../../utils/calculateDartScore';
import { buildPhotoScoreHit, generatePhotoScoreCandidates } from '../../utils/photoScoreCandidates';

export default function PhotoScoreMarkScreen() {
  const router = useRouter();
  const { calibration, imageUri } = useLocalSearchParams<{
    calibration?: string;
    imageUri?: string;
  }>();
  const normalizedImageUri = imageUri ?? '';
  const parsedCalibration = useMemo(() => parseCalibration(calibration), [calibration]);
  const [hits, setHits] = useState<DartHitResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tapMessage, setTapMessage] = useState('');
  const [detectionMode, setDetectionMode] = useState<PhotoScoreDetectionMode>('semiAuto');
  const [activeHitId, setActiveHitId] = useState<string | null>(null);
  const summary = calculatePhotoScoreSummary(hits);
  const selectedCandidateIds = hits
    .map((hit) => hit.candidateId)
    .filter((candidateId): candidateId is string => Boolean(candidateId));
  const candidates = useMemo(
    () =>
      parsedCalibration
        ? generatePhotoScoreCandidates(parsedCalibration, selectedCandidateIds)
        : [],
    [parsedCalibration, selectedCandidateIds],
  );
  const markers = hits.map((hit, index) => ({
    id: hit.id,
    point: hit.point,
    label: String(index + 1),
    selected: hit.id === activeHitId,
    color:
      hit.area === 'out' ? colors.danger : hit.area === 'triple' ? colors.warning : colors.primary,
  }));
  const candidateMarkers =
    detectionMode === 'semiAuto'
      ? candidates.map((candidate, index) => ({
          id: candidate.id,
          point: candidate.point,
          label: `候補${index + 1}`,
          selected: candidate.selected,
          color: colors.info,
        }))
      : [];

  const handlePoint = (point: NormalizedPoint) => {
    if (!parsedCalibration || hits.length >= 3) {
      return;
    }

    const nextId = `dart-${hits.length + 1}`;
    const nextHit = buildPhotoScoreHit(parsedCalibration, point, nextId, 'manualTap');
    setTapMessage('');
    setActiveHitId(nextId);
    setHits((currentHits) => [...currentHits, nextHit]);
  };

  const selectCandidate = (candidate: PhotoScoreCandidate) => {
    if (!parsedCalibration || hits.length >= 3 || candidate.selected) {
      return;
    }

    const nextId = `dart-${hits.length + 1}`;
    const nextHit = buildPhotoScoreHit(
      parsedCalibration,
      candidate.point,
      nextId,
      'autoCandidate',
      candidate,
    );

    setTapMessage('');
    setActiveHitId(nextId);
    setHits((currentHits) => [...currentHits, nextHit]);
  };

  const adjustActiveHit = (point: NormalizedPoint) => {
    if (!parsedCalibration || !activeHitId) {
      return;
    }

    setHits((currentHits) =>
      currentHits.map((hit) => {
        if (hit.id !== activeHitId) {
          return hit;
        }

        return {
          ...buildPhotoScoreHit(parsedCalibration, point, hit.id, 'adjusted', {
            id: hit.candidateId ?? hit.id,
            confidence: hit.confidence ?? 0.5,
          }),
          candidateId: hit.candidateId,
        };
      }),
    );
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
        title="刺さった位置を選択"
        subtitle={`半自動候補を選ぶか、写真上を手動タップします。3本中 ${hits.length} 本を記録しました。`}
      />

      <Card>
        <Text style={styles.summaryTitle}>入力モード</Text>
        <View style={styles.modeRow}>
          <ModeChip
            label="半自動候補"
            selected={detectionMode === 'semiAuto'}
            onPress={() => setDetectionMode('semiAuto')}
          />
          <ModeChip
            label="手動タップ"
            selected={detectionMode === 'manual'}
            onPress={() => setDetectionMode('manual')}
          />
        </View>
        <Text style={styles.modeHelper}>
          候補はキャリブレーション済みボード座標から表示します。候補を選んだ後、選択中の本を写真上でドラッグして微調整できます。
        </Text>
      </Card>

      <Card>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>
            {hits.length >= 3 ? '3本のタップ完了' : `${hits.length + 1}本目をタップしてください`}
          </Text>
          <Text style={styles.stepCount}>{hits.length}/3</Text>
        </View>
        <PhotoBoardCanvas
          imageUri={normalizedImageUri}
          markers={markers}
          candidateMarkers={candidateMarkers}
          calibration={parsedCalibration}
          onPressPoint={handlePoint}
          onDragActiveMarker={adjustActiveHit}
          onInvalidPress={() => setTapMessage('写真の上をタップしてください。')}
          helperText={
            activeHitId
              ? '選択中の番号を写真上でドラッグすると位置を微調整できます。手動追加する場合は刺さった先端位置をタップしてください。'
              : '候補を選ぶか、ダーツが刺さった先端位置をタップしてください。'
          }
          isExpanded={isExpanded}
        />
        {tapMessage ? <Text style={styles.warningText}>{tapMessage}</Text> : null}
      </Card>

      {detectionMode === 'semiAuto' ? (
        <Card muted>
          <Text style={styles.summaryTitle}>自動候補</Text>
          <View style={styles.candidateList}>
            {candidates.map((candidate, index) => (
              <Pressable
                key={candidate.id}
                accessibilityRole="button"
                disabled={candidate.selected || hits.length >= 3}
                onPress={() => selectCandidate(candidate)}
                style={[styles.candidateRow, candidate.selected && styles.candidateRowSelected]}
              >
                <View style={styles.candidateMain}>
                  <Text style={styles.candidateTitle}>候補{index + 1}</Text>
                  <Text style={styles.candidateReason}>{candidate.reason}</Text>
                </View>
                <Text style={styles.candidateConfidence}>
                  {candidate.selected ? '選択済み' : `${Math.round(candidate.confidence * 100)}%`}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      <Card muted>
        <Text style={styles.summaryTitle}>現在の判定</Text>
        <Text style={styles.summaryText}>
          合計 {summary.totalScore} / Bull {summary.bullCount} / Triple {summary.tripleCount} /
          Double {summary.doubleCount}
        </Text>
        <View style={styles.hitList}>
          {hits.map((hit, index) => (
            <Pressable
              key={hit.id}
              accessibilityRole="button"
              onPress={() => setActiveHitId(hit.id)}
              style={[styles.hitRow, activeHitId === hit.id && styles.hitRowSelected]}
            >
              <Text style={styles.hitText}>
                {index + 1}. {formatHit(hit)}
              </Text>
              <Text style={styles.hitSource}>{formatSource(hit)}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <View style={styles.actionStack}>
        <AppButton
          label={isExpanded ? '通常表示に戻す' : '大きく表示'}
          onPress={() => setIsExpanded((currentValue) => !currentValue)}
          variant="secondary"
        />
        <AppButton
          label="1本戻す"
          onPress={() => {
            setTapMessage('');
            setHits((currentHits) => currentHits.slice(0, -1));
            setActiveHitId(null);
          }}
          variant="secondary"
          disabled={hits.length === 0}
        />
        <AppButton
          label="リセット"
          onPress={() => {
            setTapMessage('');
            setHits([]);
            setActiveHitId(null);
          }}
          variant="secondary"
          disabled={hits.length === 0}
        />
        <AppButton label="結果を見る" onPress={goResult} disabled={hits.length !== 3} />
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

function formatSource(hit: DartHitResult) {
  if (hit.detectionSource === 'autoCandidate') {
    return '候補から選択';
  }

  if (hit.detectionSource === 'adjusted') {
    return '手動微調整済み';
  }

  return '手動タップ';
}

function ModeChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.modeChip, selected && styles.modeChipSelected]}
    >
      <Text style={[styles.modeChipText, selected && styles.modeChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  stepCount: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '900',
  },
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
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  modeChip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  modeChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
  },
  modeChipTextSelected: {
    color: colors.primaryDark,
  },
  modeHelper: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  candidateList: {
    gap: 8,
    marginTop: 12,
  },
  candidateRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  candidateRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  candidateMain: {
    flex: 1,
    gap: 4,
  },
  candidateTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  candidateReason: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  candidateConfidence: {
    color: colors.info,
    fontSize: 12,
    fontWeight: '900',
  },
  hitList: {
    gap: 6,
    marginTop: 12,
  },
  hitRow: {
    gap: 4,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  hitRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  hitText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  hitSource: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  warningText: {
    marginTop: 10,
    color: colors.warning,
    fontSize: 13,
    fontWeight: '800',
  },
  actionStack: {
    gap: 10,
  },
});
