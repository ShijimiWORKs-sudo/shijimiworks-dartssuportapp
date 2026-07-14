import { useMemo, useState } from 'react';
import { Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { SectionTitle } from '../../components/SectionTitle';
import { colors } from '../../constants/theme';
import { useAppState } from '../../contexts/AppStateContext';
import { createCommonExportEnvelope } from '../../features/account/application/commonContractMapper';

const appVersion = '0.1.0';

export default function AccountExportScreen() {
  const {
    commonOutbox,
    consultHistories,
    favoritePracticeMenuIds,
    formPhotoAdviceResults,
    getActiveAccount,
    practiceFilterState,
    profile,
    records,
  } = useAppState();
  const activeAccount = getActiveAccount();
  const [jsonText, setJsonText] = useState('');
  const exportSummary = useMemo(() => {
    if (!activeAccount) {
      return null;
    }

    return {
      records: records.length,
      consultHistories: consultHistories.length,
      formPhotoAdviceResults: formPhotoAdviceResults.length,
      favorites: favoritePracticeMenuIds.length,
      outbox: commonOutbox.length,
    };
  }, [
    activeAccount,
    commonOutbox.length,
    consultHistories.length,
    favoritePracticeMenuIds.length,
    formPhotoAdviceResults.length,
    records.length,
  ]);

  const createExportJson = () => {
    if (!activeAccount) {
      return;
    }

    const envelope = createCommonExportEnvelope({
      account: activeAccount,
      profile,
      records,
      consultHistories,
      formPhotoAdviceResults,
      favoritePracticeMenuIds,
      practiceFilterState,
      commonOutbox,
      appVersion,
    });

    setJsonText(JSON.stringify(envelope, null, 2));
  };

  const shareJson = async () => {
    if (!jsonText) {
      return;
    }

    await Share.share({
      title: 'DartsSupportApp Export JSON',
      message: jsonText,
    });
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="JSON Export"
        subtitle="共通JSON Contract v1形式で、秘密情報を含めずに出力します。"
      />

      {!activeAccount ? (
        <Card>
          <Text style={styles.bodyText}>ExportにはローカルAccount登録が必要です。</Text>
        </Card>
      ) : (
        <>
          <Card>
            <SectionTitle
              title={activeAccount.displayName}
              subtitle={activeAccount.accountId}
              tone="card"
            />
            {exportSummary ? (
              <View style={styles.countGrid}>
                <CountLine label="練習記録" value={exportSummary.records} />
                <CountLine label="相談履歴" value={exportSummary.consultHistories} />
                <CountLine label="フォーム写真相談" value={exportSummary.formPhotoAdviceResults} />
                <CountLine label="お気に入り" value={exportSummary.favorites} />
                <CountLine label="Outbox" value={exportSummary.outbox} />
              </View>
            ) : null}
          </Card>

          <Card muted>
            <SectionTitle title="含まれない情報" tone="card" />
            <Text style={styles.bodyText}>
              PIN、PIN hash、SecureStore key、token、secret、写真/動画本体、画像URIはExport
              JSONに含めません。
            </Text>
          </Card>

          <View style={styles.actionStack}>
            <AppButton label="JSONを生成" onPress={createExportJson} />
            <AppButton
              label="共有"
              onPress={() => void shareJson()}
              disabled={!jsonText}
              variant="secondary"
            />
          </View>

          {jsonText ? (
            <Card>
              <SectionTitle
                title="Export JSON"
                subtitle="必要に応じて内容を確認できます。"
                tone="card"
              />
              <TextInput value={jsonText} editable={false} multiline style={styles.jsonBox} />
            </Card>
          ) : null}
        </>
      )}
    </ScreenShell>
  );
}

function CountLine({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.countLine}>
      <Text style={styles.countLabel}>{label}</Text>
      <Text style={styles.countValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  countGrid: {
    gap: 8,
    marginTop: 12,
  },
  countLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  countLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  countValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  actionStack: {
    gap: 10,
  },
  jsonBox: {
    maxHeight: 280,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
