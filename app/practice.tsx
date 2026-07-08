import { useRouter } from 'expo-router';

import { PracticeMenuCard } from '../components/PracticeMenuCard';
import { ScreenShell } from '../components/ScreenShell';
import { SectionTitle } from '../components/SectionTitle';
import { practiceMenus } from '../constants/mockData';

export default function PracticeScreen() {
  const router = useRouter();
  const menus = practiceMenus.filter((menu) => menu.level === 'intermediate');

  return (
    <ScreenShell>
      <SectionTitle
        title="今日の練習"
        subtitle="中級RT6〜9向けのモックメニューを3件表示しています。"
      />
      {menus.map((menu) => (
        <PracticeMenuCard key={menu.id} menu={menu} onStart={() => router.push('/record')} />
      ))}
    </ScreenShell>
  );
}
