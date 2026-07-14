import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { colors } from '../../constants/theme';
import { useAppState } from '../../contexts/AppStateContext';
import { parseCommonImportJson } from '../../features/account/application/commonContractImport';

export default function AccountImportScreen() {
  const { activeAccountId, importCommonEnvelopeJson } = useAppState();
  const [jsonText, setJsonText] = useState('');
  const [message, setMessage] = useState('');
  const parsed = useMemo(
    () => parseCommonImportJson(jsonText, activeAccountId),
    [activeAccountId, jsonText],
  );

  const handleImport = async () => {
    if (!parsed.isValid) {
      setMessage(parsed.errors.join('\n'));
      return;
    }

    try {
      const result = await importCommonEnvelopeJson(jsonText);
      setMessage(
        `Import完了: Account追加 ${result.accountAdded ? 'あり' : 'なし'} / 追加 ${
          result.recordAddedCount
        }件 / skip ${result.skippedRecordCount}件 / conflict ${result.conflictRecordCount}件`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Importに失敗しました。');
    }
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="JSON Import"
        subtitle="共通JSON Contract v1を検証してから取り込みます。"
      />

      <Card muted>
        <SectionTitle title="安全ルール" tone="card" />
        <Text style={styles.bodyText}>
          PIN、画像URI、秘密情報は復元しません。不正JSONや必須項目不足の場合は既存データを変更しません。
        </Text>
      </Card>

      <Card>
        <SectionTitle title="JSONを貼り付け" tone="card" />
        <TextInput
          value={jsonText}
          onChangeText={setJsonText}
          placeholder="Export JSONを貼り付け"
          placeholderTextColor={colors.textMuted}
          multiline
          style={styles.jsonBox}
        />
      </Card>

      {jsonText ? (
        <Card>
          <SectionTitle title={parsed.isValid ? 'Importプレビュー' : '検証エラー'} tone="card" />
          {parsed.preview ? (
            <View style={styles.previewList}>
              <PreviewLine label="Account ID" value={parsed.preview.accountId} />
              <PreviewLine label="Account名" value={parsed.preview.accountDisplayName} />
              <PreviewLine label="練習記録" value={`${parsed.preview.practiceRecordCount}件`} />
              <PreviewLine label="相談履歴" value={`${parsed.preview.consultHistoryCount}件`} />
              <PreviewLine
                label="フォーム写真相談"
                value={`${parsed.preview.formPhotoAdviceResultCount}件`}
              />
              <PreviewLine
                label="現在Accountとの差"
                value={parsed.preview.isDifferentAccount ? '別Account' : '同一または未設定'}
              />
            </View>
          ) : (
            parsed.errors.map((error) => (
              <Text key={error} style={styles.errorText}>
                ・{error}
              </Text>
            ))
          )}
        </Card>
      ) : null}

      {message ? <Text style={styles.messageText}>{message}</Text> : null}

      <AppButton
        label="検証済みJSONをImport"
        onPress={() => void handleImport()}
        disabled={!parsed.isValid}
      />
    </ScreenShell>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewLine}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  jsonBox: {
    minHeight: 180,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlignVertical: 'top',
  },
  previewList: {
    gap: 8,
    marginTop: 10,
  },
  previewLine: {
    gap: 4,
  },
  previewLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  previewValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 8,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  messageText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
});
