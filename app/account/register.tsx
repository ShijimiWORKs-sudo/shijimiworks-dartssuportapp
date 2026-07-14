import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { colors } from '../../constants/theme';
import { useAppState } from '../../contexts/AppStateContext';
import { validatePin } from '../../features/account/application/accountService';

export default function AccountRegisterScreen() {
  const router = useRouter();
  const { registerLocalAccount } = useAppState();
  const [userName, setUserName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [pinEnabled, setPinEnabled] = useState(true);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (pinEnabled && (!validatePin(pin) || pin !== pinConfirm)) {
      setError('PINは4〜8桁の数字で、確認用PINと一致させてください。');
      return;
    }

    try {
      setError('');
      await registerLocalAccount(
        {
          userName,
          displayName,
          email,
          pinEnabled,
        },
        pinEnabled ? pin : undefined,
      );
      router.replace('/account/profile');
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Account登録に失敗しました。');
    }
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="ローカルAccount登録"
        subtitle="UUID v4形式の共通account_idを作成します。登録は任意です。"
      />

      <Card>
        <SectionTitle title="Account情報" tone="card" />
        <LabeledInput
          label="userName"
          value={userName}
          onChangeText={setUserName}
          placeholder="yousuke"
        />
        <LabeledInput
          label="displayName"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Yousuke"
        />
        <LabeledInput
          label="email 任意"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
        />
      </Card>

      <Card>
        <SectionTitle title="PINロック" subtitle="PINはSecureStoreに保存します。" tone="card" />
        <Pressable
          accessibilityRole="button"
          onPress={() => setPinEnabled((current) => !current)}
          style={[styles.toggle, pinEnabled && styles.toggleSelected]}
        >
          <Text style={[styles.toggleText, pinEnabled && styles.toggleTextSelected]}>
            {pinEnabled ? 'PINを設定する' : 'PINなしで登録する'}
          </Text>
        </Pressable>
        {pinEnabled ? (
          <>
            <LabeledInput
              label="PIN"
              value={pin}
              onChangeText={(value) => setPin(value.replace(/[^\d]/g, '').slice(0, 8))}
              placeholder="4〜8桁"
              keyboardType="number-pad"
              secureTextEntry
            />
            <LabeledInput
              label="PIN確認"
              value={pinConfirm}
              onChangeText={(value) => setPinConfirm(value.replace(/[^\d]/g, '').slice(0, 8))}
              placeholder="もう一度入力"
              keyboardType="number-pad"
              secureTextEntry
            />
          </>
        ) : null}
        <Text style={styles.bodyText}>
          PINは端末内ロック用で、クラウド認証や本人確認ではありません。Export JSONには含まれません。
        </Text>
      </Card>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <AppButton label="登録する" onPress={handleRegister} />
      <AppButton
        label="Accountへ戻る"
        onPress={() => router.push('/account')}
        variant="secondary"
      />
    </ScreenShell>
  );
}

function LabeledInput({
  keyboardType,
  label,
  onChangeText,
  placeholder,
  secureTextEntry,
  value,
}: {
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputBlock: {
    marginTop: 14,
  },
  inputLabel: {
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
  toggle: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
  },
  toggleTextSelected: {
    color: colors.primaryDark,
  },
  bodyText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
});
