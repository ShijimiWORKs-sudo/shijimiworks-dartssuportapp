import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { colors } from '../../constants/theme';
import { useAppState } from '../../contexts/AppStateContext';

export default function AccountScreen() {
  const router = useRouter();
  const { activeAccountId, accounts, getActiveAccount, isAccountSessionLocked } = useAppState();
  const activeAccount = getActiveAccount();

  return (
    <ScreenShell>
      <SectionTitle
        title="Account"
        subtitle="DartsSupportApp内だけで使うローカルAccountです。クラウド同期はまだ行いません。"
      />

      {!activeAccount ? (
        <Card muted>
          <SectionTitle
            title="Account未登録"
            subtitle="未登録でも練習記録、分析、相談はそのまま利用できます。"
            tone="card"
          />
          <Text style={styles.bodyText}>
            Accountを登録すると、将来DartsAppと共通で使えるUUID
            v4形式のaccount_idを先に確保できます。
          </Text>
          <View style={styles.actionStack}>
            <AppButton
              label="ローカルAccountを登録"
              onPress={() => router.push('/account/register')}
            />
          </View>
        </Card>
      ) : (
        <Card>
          <SectionTitle
            title={activeAccount.displayName}
            subtitle={activeAccount.userName}
            tone="card"
          />
          <Text style={styles.label}>Account ID</Text>
          <Text selectable style={styles.accountId}>
            {activeAccount.accountId}
          </Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusPill}>{activeAccount.accountStatus}</Text>
            <Text style={styles.statusPill}>{activeAccount.authMode}</Text>
            {isAccountSessionLocked ? <Text style={styles.lockPill}>LOCKED</Text> : null}
          </View>
          <Text style={styles.bodyText}>
            PINは端末内ロック用です。クラウド認証や本人確認ではありません。
          </Text>
          <View style={styles.actionStack}>
            <AppButton label="プロフィール" onPress={() => router.push('/account/profile')} />
            <AppButton
              label="セキュリティ"
              onPress={() => router.push('/account/security')}
              variant="secondary"
            />
            <AppButton
              label="JSON Export"
              onPress={() => router.push('/account/export')}
              variant="secondary"
            />
            <AppButton
              label="JSON Import"
              onPress={() => router.push('/account/import')}
              variant="secondary"
            />
          </View>
        </Card>
      )}

      <Card>
        <SectionTitle title="ローカルAccount状態" tone="card" />
        <Text style={styles.bodyText}>登録済みAccount: {accounts.length}件</Text>
        <Text style={styles.bodyText}>activeAccountId: {activeAccountId ?? '未設定'}</Text>
      </Card>

      <AppButton label="設定へ戻る" onPress={() => router.push('/settings')} variant="secondary" />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  label: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  accountId: {
    marginTop: 4,
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    color: colors.primaryDark,
    backgroundColor: colors.primarySoft,
    fontSize: 12,
    fontWeight: '900',
  },
  lockPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    color: '#ffffff',
    backgroundColor: colors.danger,
    fontSize: 12,
    fontWeight: '900',
  },
  actionStack: {
    gap: 10,
    marginTop: 14,
  },
});
