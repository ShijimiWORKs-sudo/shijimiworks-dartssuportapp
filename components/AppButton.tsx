import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../constants/theme';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  accessibilityLabel?: string;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  accessibilityLabel,
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.78,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryLabel: {
    color: colors.primaryDark,
  },
});
