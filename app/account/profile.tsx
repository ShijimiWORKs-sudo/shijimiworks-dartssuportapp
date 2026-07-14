import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { colors } from '../../constants/theme';
import { useAppState } from '../../contexts/AppStateContext';

export default function AccountProfileScreen() {
  const router = useRouter();
  const { deleteLocalAccountById, getActiveAccount, records, updateLocalAccountProfile } =
    useAppState();
  const activeAccount = getActiveAccount();
  const [userName, setUserName] = useState(activeAccount?.userName ?? '');
  const [displayName, setDisplayName] = useState(activeAccount?.displayName ?? '');
  const [email, setEmail] = useState(activeAccount?.email ?? '');
  const [message, setMessage] = useState('');

  if (!activeAccount) {
    return (
      <ScreenShell>
        <SectionTitle title="Account未登録" subtitle="先にローカルAccountを登録してください。" />
        <AppButton label="登録へ" onPress={() => router.replace('/account/register')} />
      </ScreenShell>
    );
  }

  const handleSave = async () => {
    try {
      await updateLocalAccountProfile(activeAccount.accountId, {
        userName,
        displayName,
        email,
      });
      setMessage('Accountプロフィールを更新しました。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '更新できませんでした。');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Accountを論理削除しますか？',
      '練習記録、相談履歴、写真スコア記録は物理削除しません。PINはSecureStoreから削除します。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '論理削除',
          style: 'destructive',
          onPress: () => void deleteLocalAccountById(activeAccount.accountId),
        },
      ],
    );
  };

  return (
    <ScreenShell>
      <SectionTitle title="Accountプロフィール" subtitle="ローカルAccount情報を編集できます。" />

      <Card>
        <Text style={styles.label}>Account ID</Text>
        <Text selectable style={styles.accountId}>
          {activeAccount.accountId}
        </Text>
        <LabeledInput label="userName" value={userName} onChangeText={setUserName} />
        <LabeledInput label="displayName" value={displayName} onChangeText={setDisplayName} />
        <LabeledInput label="email 任意" value={email} onChangeText={setEmail} />
        <Text style={styles.bodyText}>status: {activeAccount.accountStatus}</Text>
        <Text style={styles.bodyText}>authMode: {activeAccount.authMode}</Text>
        <Text style={styles.bodyText}>createdAt: {activeAccount.createdAt}</Text>
      </Card>

      <Card muted>
        <SectionTitle title="削除時の扱い" tone="card" />
        <Text style={styles.bodyText}>
          初期仕様ではAccountを論理削除しても、既存の練習記録 {records.length}
          件や相談履歴は物理削除しません。
        </Text>
      </Card>

      {message ? <Text style={styles.messageText}>{message}</Text> : null}
      <View style={styles.actionStack}>
        <AppButton label="保存" onPress={handleSave} />
        <AppButton
          label="セキュリティ"
          onPress={() => router.push('/account/security')}
          variant="secondary"
        />
        <AppButton label="Accountを論理削除" onPress={confirmDelete} variant="danger" />
        <AppButton
          label="Accountへ戻る"
          onPress={() => router.push('/account')}
          variant="secondary"
        />
      </View>
    </ScreenShell>
  );
}

function LabeledInput({
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
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  accountId: {
    marginTop: 4,
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  bodyText: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
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
