import type { LibraryCategory, PracticeMenu } from '../types';

export const concerns = [
  '01が苦手',
  'クリケットが苦手',
  'ブル率が低い',
  'フォームが安定しない',
  'リリースが抜ける',
  'イップス気味',
  '練習方法が分からない',
];

export const practiceMenus: PracticeMenu[] = [
  {
    id: 'beginner-count-up',
    title: 'ブル位置確認 COUNT-UP',
    level: 'beginner',
    purpose: '力まず同じリズムでブル周辺へ集める',
    duration: '12分',
    game: 'COUNT-UP',
    metrics: ['スコア', 'ブル数', '主観メモ'],
  },
  {
    id: 'beginner-01-finish',
    title: '01上がり目メモ練習',
    level: 'beginner',
    purpose: '残り点を見て次の狙いを決める癖を作る',
    duration: '10分',
    game: '01',
    metrics: ['スコア', 'ミスした残り点', '調子'],
  },
  {
    id: 'beginner-release',
    title: '近距離リリース確認',
    level: 'beginner',
    purpose: '抜けや引っかかりをセルフチェックする',
    duration: '8分',
    game: 'OTHER',
    metrics: ['抜け感', 'フォームメモ'],
  },
  {
    id: 'intermediate-cricket-cover',
    title: '19カバードリル',
    level: 'intermediate',
    purpose: '20が詰まった後のカバー精度を上げる',
    duration: '12分',
    game: 'CRICKET',
    metrics: ['19マーク数', '20ミス数', '集中度'],
  },
  {
    id: 'intermediate-bull-rhythm',
    title: 'Bull安定 + 01切り替え',
    level: 'intermediate',
    purpose: 'ブル狙いから01の実戦判断へつなげる',
    duration: '10分',
    game: '01',
    metrics: ['ブル数', 'PPD相当', '調子'],
  },
  {
    id: 'intermediate-cricket-count-up',
    title: 'Cricket Count-Up確認',
    level: 'intermediate',
    purpose: '得意ナンバーと弱点ナンバーを分ける',
    duration: '8分',
    game: 'CRICKET',
    metrics: ['マーク数', '弱点ナンバー'],
  },
  {
    id: 'advanced-pressure-01',
    title: '01プレッシャーセット',
    level: 'advanced',
    purpose: '高い集中状態でアレンジと決定力を確認する',
    duration: '12分',
    game: '01',
    metrics: ['上がり率', 'ミス傾向', 'メンタル'],
  },
  {
    id: 'advanced-cricket-switch',
    title: 'Cricket切り替え判断',
    level: 'advanced',
    purpose: '攻める場面と閉める場面の判断速度を上げる',
    duration: '10分',
    game: 'CRICKET',
    metrics: ['マーク数', '判断メモ'],
  },
  {
    id: 'advanced-form-reset',
    title: 'フォーム再現性チェック',
    level: 'advanced',
    purpose: '試合前に崩れやすい動作を短時間で整える',
    duration: '8分',
    game: 'OTHER',
    metrics: ['違和感', '修正ポイント'],
  },
];

export const analysisBars = [42, 58, 51, 66, 63, 72, 78];

export const fixedAdvice: Record<string, string> = {
  スタンス: '足幅と重心位置を毎回同じにして、1投目の前に肩の向きを確認しましょう。',
  グリップ: '握りを強めず、抜ける瞬間に指が同時に離れる感覚を優先しましょう。',
  テイクバック: '深さよりも再現性を優先し、引く速度を一定にするとリリースが安定します。',
  リリース: '狙いより少し手前で離す意識を持つと、抜けや遅れの確認がしやすくなります。',
  フォロースルー: '投げた後に手首と肘が狙いへ残っているかを1投ずつ確認しましょう。',
  メンタル: '結果ではなく今日の確認項目を1つに絞ると、緊張下でも修正しやすくなります。',
  イップス: '無理に投げ込まず、近距離・低負荷の確認から始めて違和感を言語化しましょう。',
};

export const libraryCategories: LibraryCategory[] = [
  {
    id: 'beginner',
    title: '初級練習',
    articles: [
      {
        id: 'b1',
        title: '最初のCOUNT-UP記録術',
        summary: 'スコアよりブル数と感覚メモを残す方法。',
      },
      { id: 'b2', title: '狙いを1つに絞る練習', summary: '練習ごとのテーマを小さく決める考え方。' },
    ],
  },
  {
    id: 'intermediate',
    title: '中級練習',
    articles: [
      { id: 'm1', title: '19カバーの組み立て', summary: 'クリケットで詰まった時の代替ルート。' },
      { id: 'm2', title: '01とブル練習のつなぎ方', summary: '実戦判断に近づける練習順序。' },
    ],
  },
  {
    id: 'advanced',
    title: '上級練習',
    articles: [
      { id: 'a1', title: 'プレッシャー下の再現性', summary: '本番で崩れやすい動作の点検方法。' },
      { id: 'a2', title: 'セット練習の作り方', summary: '短時間で負荷を上げるメニュー設計。' },
    ],
  },
  {
    id: 'stance',
    title: 'スタンス',
    articles: [
      { id: 's1', title: '重心位置のセルフチェック', summary: '毎投同じ姿勢に戻るための確認。' },
    ],
  },
  {
    id: 'grip',
    title: 'グリップ',
    articles: [
      { id: 'g1', title: '抜ける握りの探し方', summary: '強く握りすぎないための観察ポイント。' },
    ],
  },
  {
    id: 'release',
    title: 'リリース',
    articles: [
      { id: 'r1', title: '遅れと抜けの見分け方', summary: '左右上下のズレを動作に戻して考える。' },
    ],
  },
  {
    id: 'mental',
    title: 'メンタル',
    articles: [
      { id: 'mt1', title: '緊張した時の確認項目', summary: '結果から注意を外す短いルーティン。' },
    ],
  },
  {
    id: 'yips',
    title: 'イップス',
    articles: [
      {
        id: 'y1',
        title: '低負荷で再開する練習',
        summary: '断定せずセルフチェックとして扱う手順。',
      },
    ],
  },
];
