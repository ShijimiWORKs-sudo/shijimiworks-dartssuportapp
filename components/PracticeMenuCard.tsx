import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import type { PracticeMenu } from '../types';
import { AppButton } from './AppButton';
import { Card } from './Card';

type PracticeMenuCardProps = {
  menu: PracticeMenu;
  onStart: () => void;
};

export function PracticeMenuCard({ menu, onStart }: PracticeMenuCardProps) {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>{menu.title}</Text>
        <Text style={styles.badge}>{menu.game}</Text>
      </View>
      <Text style={styles.purpose}>{menu.purpose}</Text>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>目安時間</Text>
        <Text style={styles.detailText}>{menu.duration}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>記録する項目</Text>
        <Text style={styles.detailText}>{menu.metrics.join(' / ')}</Text>
      </View>
      <AppButton label="この練習を開始" onPress={onStart} variant="secondary" />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: colors.primarySoft,
  },
  purpose: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  detailRow: {
    marginTop: 10,
    gap: 3,
  },
  detailLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  detailText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
