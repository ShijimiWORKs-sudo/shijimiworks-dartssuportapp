import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { colors } from '../../constants/theme';
import { useAppState } from '../../contexts/AppStateContext';

export default function AccountUnlockScreen() {
  const router = useRouter();
  const { getActiveAccount, unlockSession } = useAppState();
  const activeAccount = getActiveAccount();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    if (!activeAccount) {
      router.replace('/account');
      return;
    }

    const ok = await unlockSession(activeAccount.accountId, pin);

    if (!ok) {
      setError('PINが違います。');
      return;
    }

    router.replace('/account');
  };

  return (
    <ScreenShell>
      <SectionTitle title="Accountロック解除" subtitle="ローカルPINでAccount画面を解除します。" />
      <Card>
        <SectionTitle title={activeAccount?.displayName ?? 'Account'} tone="card" />
        <Text style={styles.bodyText}>
          PINは端末内ロック用です。クラウド認証や本人確認ではありません。
        </Text>
        <TextInput
          value={pin}
          onChangeText={(value) => setPin(value.replace(/[^\d]/g, '').slice(0, 8))}
          placeholder="PIN"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          secureTextEntry
          style={styles.input}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>
      <AppButton label="解除" onPress={() => void handleUnlock()} />
      <AppButton
        label="Accountへ戻る"
        onPress={() => router.push('/account')}
        variant="secondary"
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  input: {
    minHeight: 50,
    marginTop: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
  errorText: {
    marginTop: 10,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
});
