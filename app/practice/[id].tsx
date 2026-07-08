import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { gameLabels, machineLabels } from '../../constants/labels';
import { levelLabels } from '../../constants/levels';
import { getPracticeMenuById } from '../../constants/practiceMenus';
import { colors } from '../../constants/theme';

export default function PracticeMenuDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const menu = id ? getPracticeMenuById(id) : null;

  if (!menu) {
    return (
      <ScreenShell>
        <SectionTitle
          title="練習メニューが見つかりません"
          subtitle="今日の練習からもう一度選択してください。"
        />
        <AppButton label="今日の練習へ戻る" onPress={() => router.replace('/practice')} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionTitle
        title={menu.title}
        subtitle={`${levelLabels[menu.level]} / 難易度 ${menu.difficulty}`}
      />

      <Card muted>
        <DetailText
          label="対応機種"
          value={menu.machineTypes.map((machine) => machineLabels[machine]).join(' / ')}
        />
        <DetailText
          label="対象ゲーム"
          value={menu.gameTypes.map((game) => gameLabels[game]).join(' / ')}
        />
        <DetailText label="目安時間" value={`${menu.durationMinutes}分`} />
        <DetailText label="対象の悩み" value={menu.targetProblems.join(' / ')} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>目的</Text>
        <Text style={styles.bodyText}>{menu.purpose}</Text>
      </Card>

      <DetailList title="手順" items={menu.steps} />
      <DetailList title="記録する項目" items={menu.recordItems} />
      <DetailList title="評価ポイント" items={menu.evaluationPoints} />

      <Card muted>
        <Text style={styles.cardTitle}>改善アドバイス</Text>
        <Text style={styles.bodyText}>{menu.adviceText}</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>タグ</Text>
        <View style={styles.tags}>
          {menu.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      </Card>

      <AppButton
        label="この練習を記録する"
        onPress={() =>
          router.push({
            pathname: '/record',
            params: { practiceMenuId: menu.id },
          })
        }
      />
      <AppButton
        label="今日の練習へ戻る"
        onPress={() => router.push('/practice')}
        variant="secondary"
      />
    </ScreenShell>
  );
}

type DetailTextProps = {
  label: string;
  value: string;
};

function DetailText({ label, value }: DetailTextProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

type DetailListProps = {
  title: string;
  items: string[];
};

function DetailList({ title, items }: DetailListProps) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.list}>
        {items.map((item, index) => (
          <Text key={item} style={styles.bodyText}>
            {index + 1}. {item}
          </Text>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    gap: 4,
    marginBottom: 12,
  },
  detailLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  detailValue: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  list: {
    gap: 8,
    marginTop: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: colors.primarySoft,
  },
});
