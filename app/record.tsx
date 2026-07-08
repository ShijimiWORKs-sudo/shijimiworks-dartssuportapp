import { useRouter } from 'expo-router';

import { PracticeRecordForm } from '../components/PracticeRecordForm';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { useAppState } from '../contexts/AppStateContext';
import type { PracticeRecordInput } from '../types';

export default function RecordScreen() {
  const router = useRouter();
  const { addPracticeRecord } = useAppState();

  const handleSubmit = async (record: PracticeRecordInput) => {
    await addPracticeRecord(record);
    router.push('/analysis');
  };

  return (
    <ScreenShell>
      <SectionTitle
        title="練習記録入力"
        subtitle="保存した内容は端末内に残り、分析と記録一覧に反映されます。"
      />
      <PracticeRecordForm submitLabel="保存して分析へ" onSubmit={handleSubmit} />
    </ScreenShell>
  );
}
