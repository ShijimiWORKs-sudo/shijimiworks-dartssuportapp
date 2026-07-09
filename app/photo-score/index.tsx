import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { boardTypeLabels, boardTypes } from '../../constants/photoScore';
import { colors } from '../../constants/theme';
import type { BoardType } from '../../types';

export default function PhotoScoreStartScreen() {
  const router = useRouter();
  const [boardType, setBoardType] = useState<BoardType>('DARTSLIVE_ZERO');
  const [imageUri, setImageUri] = useState('');
  const [error, setError] = useState('');

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('写真ライブラリへのアクセスを許可してください。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled) {
      setError('');
      setImageUri(result.assets[0]?.uri ?? '');
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError('カメラへのアクセスを許可してください。');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled) {
      setError('');
      setImageUri(result.assets[0]?.uri ?? '');
    }
  };

  const startCalibration = () => {
    if (!imageUri) {
      setError('ボード写真を撮影または選択してください。');
      return;
    }

    router.push({
      pathname: '/photo-score/calibrate',
      params: {
        boardType,
        imageUri,
      },
    });
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="写真スコア記録"
        subtitle="写真上で中心、20方向、外周、3本の刺さり位置をタップして記録します。"
      />

      <Card>
        <Text style={styles.cardTitle}>対象ボード</Text>
        <View style={styles.chipGrid}>
          {boardTypes.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setBoardType(item)}
              style={[styles.chip, boardType === item && styles.chipSelected]}
            >
              <Text style={[styles.chipText, boardType === item && styles.chipTextSelected]}>
                {boardTypeLabels[item]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>ボード写真</Text>
        <Text style={styles.bodyText}>
          MVPでは画像自体の永続保存は行わず、タップ座標、キャリブレーション、判定結果を保存します。
        </Text>
        {imageUri ? (
          <Image source={{ uri: imageUri }} resizeMode="cover" style={styles.preview} />
        ) : null}
        <View style={styles.actionStack}>
          <AppButton label="写真を選択" onPress={() => void pickImage()} variant="secondary" />
          <AppButton label="カメラで撮影" onPress={() => void takePhoto()} variant="secondary" />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>

      <AppButton label="キャリブレーションへ" onPress={startCalibration} />
      <AppButton
        label="記録入力へ戻る"
        onPress={() => router.push('/record')}
        variant="secondary"
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  bodyText: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
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
    paddingHorizontal: 12,
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
    fontSize: 12,
    fontWeight: '800',
  },
  chipTextSelected: {
    color: colors.primaryDark,
  },
  preview: {
    width: '100%',
    height: 180,
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  actionStack: {
    gap: 10,
    marginTop: 14,
  },
  errorText: {
    marginTop: 10,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
});
