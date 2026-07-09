import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '../components/AppButton';
import { PracticeRecordForm } from '../components/PracticeRecordForm';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { getPracticeMenuById } from '../constants/practiceMenus';
import { useAppState } from '../contexts/AppStateContext';
import type { PracticeRecordInput } from '../types';

export default function RecordScreen() {
  const router = useRouter();
  const { practiceMenuId } = useLocalSearchParams<{ practiceMenuId?: string }>();
  const { addPracticeRecord } = useAppState();
  const selectedMenu = practiceMenuId ? getPracticeMenuById(practiceMenuId) : null;

  const handleSubmit = async (record: PracticeRecordInput) => {
    await addPracticeRecord(record);
    router.push('/analysis');
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="練習記録入力"
        subtitle={
          selectedMenu
            ? `${selectedMenu.title} の記録を残します。`
            : '保存した内容は端末内に残り、分析と記録一覧に反映されます。'
        }
      />
      <AppButton
        label="写真からスコア記録"
        onPress={() => router.push('/photo-score')}
        variant="secondary"
      />
      <PracticeRecordForm
        initialPracticeMenu={selectedMenu}
        submitLabel="保存して分析へ"
        onSubmit={handleSubmit}
      />
    </ScreenShell>
  );
}
