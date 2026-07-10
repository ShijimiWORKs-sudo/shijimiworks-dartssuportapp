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
import { detectDartCandidatesFromImage } from '../../utils/detectDartCandidatesFromImage';
import {
  buildPhotoScoreHit,
  generateCalibrationBasedCandidates,
  mergePhotoScoreCandidates,
} from '../../utils/photoScoreCandidates';

export default function PhotoScoreMarkScreen() {
  const router = useRouter();
  const {
    calibration,
    hits: hitsParam,
    imageUri,
  } = useLocalSearchParams<{
    calibration?: string;
    hits?: string;
    imageUri?: string;
  }>();
  const normalizedImageUri = imageUri ?? '';
  const parsedCalibration = useMemo(() => parseCalibration(calibration), [calibration]);
  const initialHits = useMemo(() => parseHits(hitsParam), [hitsParam]);
  const [hits, setHits] = useState<DartHitResult[]>(initialHits);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tapMessage, setTapMessage] = useState('');
  const [detectionMode, setDetectionMode] = useState<PhotoScoreDetectionMode>('semiAuto');
  const [activeHitId, setActiveHitId] = useState<string | null>(null);
  const [imageCandidates, setImageCandidates] = useState<PhotoScoreCandidate[]>([]);
  const [isDetectingCandidates, setIsDetectingCandidates] = useState(false);
  const [candidateMessage, setCandidateMessage] = useState('');
  const summary = calculatePhotoScoreSummary(hits);
  const selectedCandidateIds = hits
    .map((hit) => hit.candidateId)
    .filter((candidateId): candidateId is string => Boolean(candidateId));
  const calibrationCandidates = useMemo(
    () =>
      parsedCalibration
        ? generateCalibrationBasedCandidates(parsedCalibration, selectedCandidateIds)
        : [],
    [parsedCalibration, selectedCandidateIds],
  );
  const candidates = useMemo(
    () =>
      mergePhotoScoreCandidates(imageCandidates, calibrationCandidates, {
        maxCandidates: 8,
        selectedCandidateIds,
      }),
    [calibrationCandidates, imageCandidates, selectedCandidateIds],
  );
  const markers = hits.map((hit, index) => ({
    id: hit.id,
    point: hit.point,
    label: String(index + 1),
    selected: hit.id === activeHitId,
    color: getHitMarkerColor(hit),
  }));
  const candidateMarkers =
    detectionMode === 'semiAuto'
      ? candidates.map((candidate, index) => ({
          id: candidate.id,
          point: candidate.point,
          label: `候補${index + 1}`,
          selected: candidate.selected,
          color: candidate.source === 'imageAnalysisCandidate' ? '#A64A97' : colors.info,
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
      candidate.source ?? 'autoCandidate',
      candidate,
    );

    setTapMessage('');
    setActiveHitId(nextId);
    setHits((currentHits) => [...currentHits, nextHit]);
  };

  const detectImageCandidates = async () => {
    if (!parsedCalibration || isDetectingCandidates) {
      return;
    }

    setIsDetectingCandidates(true);
    setCandidateMessage('候補生成中...');

    const detectedCandidates = await detectDartCandidatesFromImage(
      normalizedImageUri,
      parsedCalibration,
      {
        maxCandidates: 8,
        minConfidence: 0.35,
        enableHeuristicFallback: true,
      },
    );

    setImageCandidates(detectedCandidates);
    setIsDetectingCandidates(false);

    if (detectedCandidates.length === 0) {
      setCandidateMessage(
        '画像から候補を検出できませんでした。キャリブレーション候補または手動追加を使ってください。',
      );
      return;
    }

    setCandidateMessage(
      '画像解析候補を表示しました。候補が外れる場合はドラッグ調整または手動追加してください。',
    );
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
        subtitle="候補から選ぶ、写真上を手動タップする、選択点をドラッグ調整する、の順で進めます。"
      />

      <Card muted>
        <Text style={styles.progressTitle}>{hits.length} / 3本 選択済み</Text>
        <Text style={styles.modeHelper}>
          {hits.length < 3
            ? '3本選択すると結果へ進めます。候補が違う場合は手動で写真上をタップしてください。'
            : '3本揃いました。必要なら点を選んでドラッグ調整してから結果へ進みます。'}
        </Text>
      </Card>

      <Card>
        <Text style={styles.summaryTitle}>入力モード</Text>
        <View style={styles.modeRow}>
          <ModeChip
            label="画像候補から選ぶ"
            selected={detectionMode === 'semiAuto'}
            onPress={() => setDetectionMode('semiAuto')}
          />
          <ModeChip
            label="手動で追加"
            selected={detectionMode === 'manual'}
            onPress={() => setDetectionMode('manual')}
          />
          <ModeChip
            label="選択点を調整"
            selected={Boolean(activeHitId)}
            onPress={() => {
              const latestHit = hits[hits.length - 1];
              if (latestHit) {
                setActiveHitId(latestHit.id);
              }
            }}
          />
        </View>
        <Text style={styles.modeHelper}>
          画像解析候補を探すか、キャリブレーション候補を使います。候補を選んだ後、選択中の本を写真上でドラッグして微調整できます。
        </Text>
        <View style={styles.detectActions}>
          <AppButton
            label={isDetectingCandidates ? '候補生成中...' : '画像から候補を探す'}
            onPress={() => void detectImageCandidates()}
            variant="secondary"
            disabled={isDetectingCandidates}
          />
          <AppButton
            label="候補をリセット"
            onPress={() => {
              setImageCandidates([]);
              setCandidateMessage(
                '画像候補をリセットしました。キャリブレーション候補を表示します。',
              );
            }}
            variant="secondary"
            disabled={imageCandidates.length === 0}
          />
        </View>
        {candidateMessage ? <Text style={styles.modeHelper}>{candidateMessage}</Text> : null}
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
              ? 'ドラッグで調整できます。動かすと再判定され、微調整済みとして表示します。'
              : '候補を選ぶか、ダーツが刺さった先端位置をタップしてください。'
          }
          isExpanded={isExpanded}
        />
        {tapMessage ? <Text style={styles.warningText}>{tapMessage}</Text> : null}
      </Card>

      {detectionMode === 'semiAuto' ? (
        <Card muted>
          <Text style={styles.summaryTitle}>画像解析候補 / キャリブレーション候補</Text>
          <Text style={styles.modeHelper}>
            候補が外れる場合は、選択後に写真上でドラッグ調整するか、写真上を直接タップして手動追加してください。
          </Text>
          <View style={styles.candidateList}>
            {candidates.length === 0 ? (
              <Text style={styles.warningText}>
                候補を検出できませんでした。手動で位置を追加してください。
              </Text>
            ) : (
              candidates.map((candidate, index) => (
                <Pressable
                  key={candidate.id}
                  accessibilityRole="button"
                  disabled={candidate.selected || hits.length >= 3}
                  onPress={() => selectCandidate(candidate)}
                  style={[styles.candidateRow, candidate.selected && styles.candidateRowSelected]}
                >
                  <View style={styles.candidateMain}>
                    <Text style={styles.candidateTitle}>
                      {candidate.source === 'imageAnalysisCandidate' ? '画像候補' : '補助候補'}
                      {index + 1}
                    </Text>
                    <Text style={styles.candidateReason}>{candidate.reason}</Text>
                  </View>
                  <Text style={styles.candidateConfidence}>
                    {candidate.selected
                      ? '選択済み'
                      : `信頼度 ${Math.round(candidate.confidence * 100)}%`}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
          {candidates.length >= 3 ? (
            <Text style={styles.modeHelper}>
              正しい3本を選び、必要ならドラッグで位置を調整してください。
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card muted>
        <Text style={styles.summaryTitle}>選択済みの3本</Text>
        <Text style={styles.summaryText}>
          合計 {summary.totalScore} / Bull {summary.bullCount} / Triple {summary.tripleCount} /
          Double {summary.doubleCount}
        </Text>
        <View style={styles.hitList}>
          {hits.length === 0 ? (
            <Text style={styles.hitText}>まだ選択されていません。</Text>
          ) : (
            hits.map((hit, index) => (
              <Pressable
                key={hit.id}
                accessibilityRole="button"
                onPress={() => setActiveHitId(hit.id)}
                style={[styles.hitRow, activeHitId === hit.id && styles.hitRowSelected]}
              >
                <Text style={styles.hitText}>
                  {index + 1}本目：{formatHit(hit)}
                </Text>
                <Text style={styles.hitSource}>{formatSource(hit)}</Text>
              </Pressable>
            ))
          )}
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
        {hits.length !== 3 ? (
          <Text style={styles.warningText}>3本選択すると結果へ進めます。</Text>
        ) : null}
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

function parseHits(value: string | undefined): DartHitResult[] {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value) as DartHitResult[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function formatHit(hit: DartHitResult) {
  if (hit.area === 'singleBull' || hit.area === 'doubleBull' || hit.area === 'out') {
    return `${dartHitAreaLabels[hit.area]} / ${hit.score}点`;
  }

  return `${hit.number} ${dartHitAreaLabels[hit.area]} / ${hit.score}点`;
}

function formatSource(hit: DartHitResult) {
  if (hit.detectionSource === 'imageAnalysisCandidate') {
    return hit.confidence
      ? `画像解析候補 / 信頼度 ${Math.round(hit.confidence * 100)}%`
      : '画像解析候補';
  }

  if (hit.detectionSource === 'autoCandidate') {
    return hit.confidence
      ? `キャリブレーション候補 / 信頼度 ${Math.round(hit.confidence * 100)}%`
      : 'キャリブレーション候補';
  }

  if (hit.detectionSource === 'adjusted') {
    return `調整済み：${formatHit(hit)}`;
  }

  return '手動追加';
}

function getHitMarkerColor(hit: DartHitResult) {
  if (hit.area === 'out') {
    return colors.danger;
  }

  if (hit.detectionSource === 'adjusted') {
    return colors.warning;
  }

  if (hit.detectionSource === 'imageAnalysisCandidate') {
    return '#A64A97';
  }

  if (hit.detectionSource === 'autoCandidate') {
    return colors.info;
  }

  return colors.primary;
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
  progressTitle: {
    color: colors.primaryDark,
    fontSize: 20,
    fontWeight: '900',
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
  detectActions: {
    gap: 10,
    marginTop: 12,
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
