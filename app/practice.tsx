import { useRouter } from 'expo-router';

import { PracticeMenuCard } from '../components/PracticeMenuCard';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { levelLabels } from '../constants/levels';
import { practiceMenus } from '../constants/mockData';
import { useAppState } from '../contexts/AppStateContext';

export default function PracticeScreen() {
  const router = useRouter();
  const { profile } = useAppState();
  const level = profile?.level ?? 'intermediate';
  const menus = practiceMenus.filter((menu) => menu.level === level);

  return (
    <ScreenShell>
      <SectionTitle
        title="今日の練習"
        subtitle={`${levelLabels[level]}向けのおすすめメニューを3件表示しています。`}
      />
      {menus.map((menu) => (
        <PracticeMenuCard key={menu.id} menu={menu} onStart={() => router.push('/record')} />
      ))}
    </ScreenShell>
  );
}
