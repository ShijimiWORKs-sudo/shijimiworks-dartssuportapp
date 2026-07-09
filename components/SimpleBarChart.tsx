import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';

export type SimpleBarChartItem = {
  label: string;
  value: number;
  color?: string;
};

type SimpleBarChartProps = {
  data: SimpleBarChartItem[];
  emptyMessage?: string;
  maxValue?: number;
};

export function SimpleBarChart({
  data,
  emptyMessage = 'まだグラフを表示できる記録がありません',
  maxValue,
}: SimpleBarChartProps) {
  const visibleData = data.filter((item) => Number.isFinite(item.value));
  const chartMax = Math.max(maxValue ?? 0, ...visibleData.map((item) => item.value), 1);

  if (visibleData.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.chart}>
      {visibleData.map((item, index) => {
        const height = Math.max(12, Math.round((item.value / chartMax) * 104));

        return (
          <View key={`${item.label}-${index}`} style={styles.item}>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: item.color ?? colors.primary,
                  },
                ]}
              />
            </View>
            <Text numberOfLines={1} style={styles.value}>
              {item.value}
            </Text>
            <Text numberOfLines={1} style={styles.label}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    minHeight: 164,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  item: {
    flex: 1,
    minWidth: 24,
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 112,
    justifyContent: 'flex-end',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  value: {
    marginTop: 6,
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  label: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyBox: {
    minHeight: 96,
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
