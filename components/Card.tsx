import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../constants/theme';

type CardProps = PropsWithChildren<{
  muted?: boolean;
}>;

export function Card({ children, muted = false }: CardProps) {
  return <View style={[styles.card, muted && styles.muted]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
});
