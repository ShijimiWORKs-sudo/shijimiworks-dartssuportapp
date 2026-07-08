import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';

const tabs = [
  { href: '/home', label: 'ホーム' },
  { href: '/practice', label: '練習' },
  { href: '/records', label: '記録' },
  { href: '/analysis', label: '分析' },
  { href: '/consult', label: '相談' },
] as const;

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.nav}>
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || (tab.href === '/records' && pathname.startsWith('/records'));

        return (
          <Pressable
            key={tab.href}
            accessibilityRole="button"
            onPress={() => router.push(tab.href)}
            style={styles.item}
          >
            <Text style={[styles.label, active && styles.active]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  item: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  active: {
    color: colors.primaryDark,
  },
});
