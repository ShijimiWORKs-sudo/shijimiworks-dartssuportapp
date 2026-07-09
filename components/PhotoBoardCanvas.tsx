import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

import { colors } from '../constants/theme';
import type { BoardCalibration, NormalizedPoint } from '../types';

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
  helperText?: string;
};

export function PhotoBoardCanvas({
  imageUri,
  markers,
  calibration,
  onPressPoint,
  helperText,
}: PhotoBoardCanvasProps) {
  const handlePress = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!onPressPoint) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const x = clamp(locationX / canvasSize, 0, 1);
    const y = clamp(locationY / canvasSize, 0, 1);

    onPressPoint({ x, y });
  };

  return (
    <View>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="ボード写真上の位置を選択"
        onPress={handlePress}
        style={styles.canvas}
      >
        <Image source={{ uri: imageUri }} resizeMode="stretch" style={styles.image} />
        <Svg width={canvasSize} height={canvasSize} style={styles.overlay}>
          {calibration ? <CalibrationOverlay calibration={calibration} /> : null}
          {markers.map((marker) => (
            <MarkerOverlay key={marker.id} marker={marker} />
          ))}
        </Svg>
      </Pressable>
    </View>
  );
}

function CalibrationOverlay({ calibration }: { calibration: BoardCalibration }) {
  const center = toCanvasPoint(calibration.center);
  const top = toCanvasPoint(calibration.topNumberPoint);
  const radius = calibration.outerRadius * canvasSize;

  return (
    <>
      <Circle
        cx={center.x}
        cy={center.y}
        r={radius}
        stroke={colors.primary}
        strokeDasharray="8 7"
        strokeWidth={2}
        fill="transparent"
      />
      <Line
        x1={center.x}
        y1={center.y}
        x2={top.x}
        y2={top.y}
        stroke={colors.warning}
        strokeWidth={2}
      />
    </>
  );
}

function MarkerOverlay({ marker }: { marker: CanvasMarker }) {
  const point = toCanvasPoint(marker.point);
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

function toCanvasPoint(point: NormalizedPoint) {
  return {
    x: point.x * canvasSize,
    y: point.y * canvasSize,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const canvasSize = 320;

const styles = StyleSheet.create({
  canvas: {
    width: canvasSize,
    height: canvasSize,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    width: canvasSize,
    height: canvasSize,
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
});
