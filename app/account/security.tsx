import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { colors } from '../../constants/theme';
import { useAppState } from '../../contexts/AppStateContext';
import { validatePin } from '../../features/account/application/accountService';

export default function AccountSecurityScreen() {
  const router = useRouter();
  const { changePin, disablePinLock, enablePinLock, getActiveAccount, lockSession } = useAppState();
  const activeAccount = getActiveAccount();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');

  if (!activeAccount) {
    return (
      <ScreenShell>
        <SectionTitle title="Account未登録" subtitle="PIN設定にはAccount登録が必要です。" />
        <AppButton label="Account登録へ" onPress={() => router.replace('/account/register')} />
      </ScreenShell>
    );
  }

  const pinEnabled = activeAccount.authMode === 'local_pin';

  const validateNewPin = () => {
    if (!validatePin(newPin) || newPin !== confirmPin) {
      setMessage('新しいPINは4〜8桁の数字で、確認用PINと一致させてください。');
      return false;
    }

    return true;
  };

  const handleEnable = async () => {
    if (!validateNewPin()) {
      return;
    }

    try {
      await enablePinLock(activeAccount.accountId, newPin);
      resetFields('PINロックを有効にしました。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'PIN設定に失敗しました。');
    }
  };

  const handleChange = async () => {
    if (!validateNewPin()) {
      return;
    }

    const ok = await changePin(activeAccount.accountId, currentPin, newPin);
    resetFields(ok ? 'PINを変更しました。' : '現在のPINが違います。');
  };

  const handleDisable = async () => {
    const ok = await disablePinLock(activeAccount.accountId, currentPin);
    resetFields(ok ? 'PINロックを解除しました。' : '現在のPINが違います。');
  };

  const resetFields = (nextMessage: string) => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setMessage(nextMessage);
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="Accountセキュリティ"
        subtitle="PINは端末内ロック用です。クラウド認証ではありません。"
      />

      <Card>
        <SectionTitle title="PIN状態" tone="card" />
        <Text style={styles.bodyText}>現在: {pinEnabled ? '有効' : '無効'}</Text>
        <Text style={styles.bodyText}>
          PINはSecureStoreへ保存します。AsyncStorage、AppState、Export JSONには保存しません。
        </Text>
      </Card>

      <Card>
        <SectionTitle title={pinEnabled ? 'PIN変更 / 解除' : 'PIN設定'} tone="card" />
        {pinEnabled ? (
          <PinInput label="現在のPIN" value={currentPin} onChangeText={setCurrentPin} />
        ) : null}
        <PinInput label="新しいPIN" value={newPin} onChangeText={setNewPin} />
        <PinInput label="新しいPIN確認" value={confirmPin} onChangeText={setConfirmPin} />
      </Card>

      {message ? <Text style={styles.messageText}>{message}</Text> : null}

      <View style={styles.actionStack}>
        {pinEnabled ? (
          <>
            <AppButton label="PINを変更" onPress={() => void handleChange()} />
            <AppButton
              label="PINロックを解除"
              onPress={() => void handleDisable()}
              variant="danger"
            />
            <AppButton
              label="今すぐロック"
              onPress={() => {
                lockSession();
                router.push('/account/unlock');
              }}
              variant="secondary"
            />
          </>
        ) : (
          <AppButton label="PINロックを有効にする" onPress={() => void handleEnable()} />
        )}
        <AppButton
          label="Accountへ戻る"
          onPress={() => router.push('/account')}
          variant="secondary"
        />
      </View>
    </ScreenShell>
  );
}

function PinInput({
  label,
  onChangeText,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(nextValue) => onChangeText(nextValue.replace(/[^\d]/g, '').slice(0, 8))}
        placeholder="4〜8桁"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        secureTextEntry
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  inputBlock: {
    marginTop: 14,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  input: {
    minHeight: 50,
    marginTop: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  messageText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  actionStack: {
    gap: 10,
  },
});
