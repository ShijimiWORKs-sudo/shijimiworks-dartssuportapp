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
- `detectDartCandidatesFromImage.ts`: 写真スコアの画像解析候補検出入口
- `photoScoreCandidates.ts`: キャリブレーション候補生成、候補マージ、ヒット生成
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
  schemaVersion: 7,
  profile: UserProfile | null,
  records: PracticeRecord[], // photoScore?: PhotoScoreEntry を含む場合あり
  favoritePracticeMenuIds: string[],
  practiceFilterState: PracticeFilterState,
  consultHistories: ConsultHistory[],
  uiTheme: 'light' | 'gray',
  backgroundTheme: 'black' | 'brown' | 'purple' | 'orange' | 'white'
}
```

## schemaVersion 7

現在は相談履歴保存の `consultHistories`、実機表示調整用の `uiTheme`、背景色選択用の `backgroundTheme`、写真スコア記録用の `PracticeRecord.photoScore` を扱います。

初期値:

- `uiTheme`: `gray`
- `backgroundTheme`: `white`

Migration方針:

- schemaVersion 1〜6 は `consultHistories: []`、`uiTheme: 'gray'`、`backgroundTheme: 'white'` を必要に応じて補完
- 既存のプロフィール、練習記録、お気に入り、フィルタ条件、相談履歴、写真スコア関連データは維持
- 壊れたJSONはクラッシュさせず、legacy/default値へフォールバック
- 複雑な破損データ修復はMVP範囲外

写真スコアMVP:

- 画像そのものの永続保存は必須にしない
- `BoardCalibration`、タップ座標、`DartHitResult[]`、合計スコア、Bull/Triple/Double数を保存
- `DartHitResult` には `detectionSource`、`candidateId`、`confidence` をoptionalで保存
- `detectionSource` は `imageAnalysisCandidate`、`autoCandidate`、`manualTap`、`adjusted` を扱う
- 分析画面は既存の `score` / `bullCount` を使うため、大きな変更なしで反映される

写真スコア候補フロー:

1. `detectDartCandidatesFromImage` が画像URIとキャリブレーションを受け取り、画像解析候補を返す
2. Expo Goでは安定したピクセル取得を行わず、失敗時は空配列で返す
3. `generateCalibrationBasedCandidates` がボード幾何ベースの補助候補を返す
4. `mergePhotoScoreCandidates` が画像解析候補を優先し、近い候補を重複除去して最大件数へ制限する
5. ユーザーが候補を選択し、必要に応じて写真上でドラッグ微調整する
6. 将来OpenCV、ML Kit、Vision系へ移行する場合は `detectDartCandidatesFromImage` の内部を差し替える
