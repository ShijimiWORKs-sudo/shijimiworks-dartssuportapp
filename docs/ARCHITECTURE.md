# Architecture

DartsSupportApp MVP v0.1 の構成メモです。

## app/

Expo Router のルート画面を配置します。

- `app/index.tsx`: 初期設定
- `app/home.tsx`: ホーム
- `app/practice*.tsx`: 練習メニューと履歴
- `app/record.tsx`: 練習記録入力
- `app/records*.tsx`: 練習記録一覧/詳細/編集
- `app/analysis.tsx`: 分析
- `app/consult*.tsx`: フォーム相談と相談履歴
- `app/library*.tsx`: 資料ライブラリ
- `app/favorites.tsx`: お気に入り練習
- `app/settings.tsx`: 設定編集

## components/

画面間で使う共通UIです。

- `AppButton`: 共通ボタン
- `Card`: カード表示
- `ScreenShell`: SafeArea + ScrollView + BottomNav
- `BottomNav`: 主要5画面へのタブ導線
- `PracticeMenuCard`: 練習メニューカード
- `PracticeRecordForm`: 練習記録フォーム
- `SimpleBarChart`: 軽量バーグラフ
- `StatCard`: 統計カード

## constants/

アプリ内固定データです。

- `practiceMenus.ts`: 練習メニューDB
- `consultAdvice.ts`: 悩み別アドバイスDB
- `knowledgeBase.ts`: 知識記事DB
- `labels.ts`: ラベル定義
- `levels.ts`: レベル判定
- `theme.ts`: 色と余白

## contexts/

`AppStateContext.tsx` が AsyncStorage とReact Contextを接続します。

保持する主な状態:

- `profile`
- `records`
- `favoritePracticeMenuIds`
- `practiceFilterState`
- `consultHistories`

## utils/

画面から分離したロジックです。

- `analyzePracticeRecords.ts`: 分析集計
- `recommendPracticeMenus.ts`: おすすめ練習
- `generateConsultAdvice.ts`: 相談回答
- `createConsultHistory.ts`: 相談履歴生成
- `searchKnowledgeBase.ts`: 資料検索
- `appStateMigration.ts`: 保存データmigration
- `validateDataIntegrity.ts`: DB参照整合性チェック

## tests/

Node.js built-in test runner で pure TypeScript ロジックを検証します。

- 分析ロジック
- おすすめ練習ロジック
- 相談回答ロジック
- migration
- データ整合性
- 資料検索

## 保存データ構造

AsyncStorage key:

- `DartsSupportApp:appState`
- 旧互換用:
  - `DartsSupportApp:userProfile`
  - `DartsSupportApp:practiceRecords`

現在の `AppState`:

```ts
{
  schemaVersion: 4,
  profile: UserProfile | null,
  records: PracticeRecord[],
  favoritePracticeMenuIds: string[],
  practiceFilterState: PracticeFilterState,
  consultHistories: ConsultHistory[],
  uiTheme: 'light' | 'gray'
}
```

## schemaVersion 4

v0.1 では相談履歴保存の `consultHistories` に加えて、実機表示調整用の `uiTheme` を追加しました。初期値は `gray` です。

Migration方針:

- schemaVersion 1/2/3 は `consultHistories: []` と `uiTheme: 'gray'` を必要に応じて補完
- 既存のプロフィール、練習記録、お気に入り、フィルタ条件は維持
- 壊れたJSONはクラッシュさせず、legacy/default値へフォールバック
- 複雑な破損データ修復はMVP範囲外
