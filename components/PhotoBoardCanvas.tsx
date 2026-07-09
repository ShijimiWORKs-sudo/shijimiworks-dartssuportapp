import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

import { colors } from '../constants/theme';
import type { BoardCalibration, NormalizedPoint } from '../types';
import {
  calculateContainedImageRect,
  denormalizePoint,
  normalizeTapPoint,
  type DisplayRect,
  type DisplaySize,
} from '../utils/imageCoordinateMapping';

type CanvasMarker = {
  id: string;
  point: NormalizedPoint;
  label: string;
  color?: string;
};

type PhotoBoardCanvasProps = {
  imageUri: string;
  markers: CanvasMarker[];
  calibration?: BoardCalibration | null;
  onPressPoint?: (point: NormalizedPoint) => void;
  onInvalidPress?: () => void;
  helperText?: string;
  isExpanded?: boolean;
};

export function PhotoBoardCanvas({
  imageUri,
  markers,
  calibration,
  onPressPoint,
  onInvalidPress,
  helperText,
  isExpanded = false,
}: PhotoBoardCanvasProps) {
  const canvasHeight = isExpanded ? expandedCanvasHeight : defaultCanvasHeight;
  const [containerWidth, setContainerWidth] = useState(defaultCanvasWidth);
  const [imageSize, setImageSize] = useState<DisplaySize | null>(null);
  const [hasImageError, setHasImageError] = useState(false);
  const containerSize = useMemo(
    () => ({ width: containerWidth, height: canvasHeight }),
    [canvasHeight, containerWidth],
  );
  const displayedImageRect = useMemo(
    () => calculateContainedImageRect(containerSize, imageSize ?? containerSize),
    [containerSize, imageSize],
  );

  useEffect(() => {
    setHasImageError(false);
    setImageSize(null);

    if (!imageUri) {
      setHasImageError(true);
      return;
    }

    Image.getSize(
      imageUri,
      (width, height) => setImageSize({ width, height }),
      () => setImageSize(null),
    );
  }, [imageUri]);

  const handlePress = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!onPressPoint || hasImageError) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const point = normalizeTapPoint({ x: locationX, y: locationY }, displayedImageRect);

    if (!point) {
      onInvalidPress?.();
      return;
    }

    onPressPoint(point);
  };

  return (
    <View>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="ボード写真上の位置を選択"
        onPress={handlePress}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
        style={[styles.canvas, { height: canvasHeight }]}
      >
        {hasImageError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>写真を表示できませんでした</Text>
            <Text style={styles.errorHelper}>もう一度写真を選択してください。</Text>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: imageUri }}
              resizeMode="contain"
              style={styles.image}
              onError={() => setHasImageError(true)}
            />
            <Svg width={containerSize.width} height={containerSize.height} style={styles.overlay}>
              {calibration ? (
                <CalibrationOverlay calibration={calibration} imageRect={displayedImageRect} />
              ) : null}
              {markers.map((marker) => (
                <MarkerOverlay key={marker.id} marker={marker} imageRect={displayedImageRect} />
              ))}
            </Svg>
          </>
        )}
      </Pressable>
    </View>
  );
}

function CalibrationOverlay({
  calibration,
  imageRect,
}: {
  calibration: BoardCalibration;
  imageRect: DisplayRect;
}) {
  const center = denormalizePoint(calibration.center, imageRect);
  const top = denormalizePoint(calibration.topNumberPoint, imageRect);
  const outer = calibration.outerPoint ? denormalizePoint(calibration.outerPoint, imageRect) : null;
  const radius = outer
    ? Math.hypot(outer.x - center.x, outer.y - center.y)
    : calibration.outerRadius * Math.min(imageRect.width, imageRect.height);

  return (
    <>
      <Circle
        cx={center.x}
        cy={center.y}
        r={radius}
        stroke={colors.warning}
        strokeDasharray="8 7"
        strokeWidth={2}
        fill="transparent"
      />
      <Line
        x1={center.x}
        y1={center.y}
        x2={top.x}
        y2={top.y}
        stroke={colors.info}
        strokeWidth={2}
      />
    </>
  );
}

function MarkerOverlay({ marker, imageRect }: { marker: CanvasMarker; imageRect: DisplayRect }) {
  const point = denormalizePoint(marker.point, imageRect);
  const color = marker.color ?? colors.primary;

  return (
    <>
      <Circle cx={point.x} cy={point.y} r={13} fill={color} opacity={0.88} />
      <Circle
        cx={point.x}
        cy={point.y}
        r={18}
        stroke="#ffffff"
        strokeWidth={2}
        fill="transparent"
      />
      <SvgText
        x={point.x}
        y={point.y + 4}
        fill="#ffffff"
        fontSize="12"
        fontWeight="900"
        textAnchor="middle"
      >
        {marker.label}
      </SvgText>
    </>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  helperText: {
    marginBottom: 10,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  errorHelper: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});

const defaultCanvasWidth = 320;
const defaultCanvasHeight = 390;
const expandedCanvasHeight = 560;
