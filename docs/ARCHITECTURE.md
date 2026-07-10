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
- `formPhotoAdviceResults`

## utils/

画面から分離したロジックです。

- `analyzePracticeRecords.ts`: 分析集計
- `recommendPracticeMenus.ts`: おすすめ練習
- `generateConsultAdvice.ts`: 相談回答
- `generateFormPhotoAdvice.ts`: フォーム写真3枚相談の固定ロジック助言
- `createConsultHistory.ts`: 相談履歴生成
- `searchKnowledgeBase.ts`: 資料検索
- `detectDartCandidatesFromImage.ts`: 写真スコアの自動候補β検出入口
- `photoScoreCandidates.ts`: キャリブレーション候補生成、候補マージ、ヒット生成
- `analyzePhotoScoreGrouping.ts`: 写真スコア3点のグルーピング、偏り、散り方、助言生成
- `appStateMigration.ts`: 保存データmigration
- `validateDataIntegrity.ts`: DB参照整合性チェック

## tests/

Node.js built-in test runner で pure TypeScript ロジックを検証します。

- 分析ロジック
- おすすめ練習ロジック
- 相談回答ロジック
- フォーム写真相談ロジック
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
  schemaVersion: 8,
  profile: UserProfile | null,
  records: PracticeRecord[], // photoScore?: PhotoScoreEntry を含む場合あり
  favoritePracticeMenuIds: string[],
  practiceFilterState: PracticeFilterState,
  consultHistories: ConsultHistory[],
  formPhotoAdviceResults: FormPhotoAdviceResult[],
  uiTheme: 'light' | 'gray',
  backgroundTheme: 'black' | 'brown' | 'purple' | 'orange' | 'white'
}
```

## schemaVersion 8

現在は相談履歴保存の `consultHistories`、フォーム写真相談結果の `formPhotoAdviceResults`、実機表示調整用の `uiTheme`、背景色選択用の `backgroundTheme`、写真スコア記録用の `PracticeRecord.photoScore` を扱います。

初期値:

- `uiTheme`: `gray`
- `backgroundTheme`: `white`

Migration方針:

- schemaVersion 1〜7 は `consultHistories: []`、`formPhotoAdviceResults: []`、`uiTheme: 'gray'`、`backgroundTheme: 'white'` を必要に応じて補完
- 既存のプロフィール、練習記録、お気に入り、フィルタ条件、相談履歴、フォーム写真相談結果、写真スコア関連データは維持
- 壊れたJSONはクラッシュさせず、legacy/default値へフォールバック
- 複雑な破損データ修復はMVP範囲外

写真スコアMVP:

- 画像そのものの永続保存は必須にしない
- `BoardCalibration`、タップ座標、`DartHitResult[]`、合計スコア、Bull/Triple/Double数を保存
- `PhotoScoreGroupingAnalysis` はグループ中心、まとまり半径、上下左右の偏り、縦散り/横散り、助言をoptionalで保存
- `DartHitResult` には `detectionSource`、`candidateId`、`confidence` をoptionalで保存
- `detectionSource` は `imageAnalysisCandidate`、`autoCandidate`、`manualTap`、`adjusted` を扱う
- 分析画面は既存の `score` / `bullCount` を使うため、大きな変更なしで反映される

写真スコア候補フロー:

1. `detectDartCandidatesFromImage` が画像URIとキャリブレーションを受け取り、自動候補βを返す
2. Expo Goでは安定したピクセル取得を行わず、現在は軽量な候補生成とフォールバックを使う
3. `generateCalibrationBasedCandidates` がボード幾何ベースの補助候補を返す
4. `mergePhotoScoreCandidates` が自動候補βと補助候補を統合し、近い候補を重複除去して最大件数へ制限する
5. ユーザーが候補を選択するか、手動で刺さった先端位置を追加し、ドラッグまたは十字ボタンで微調整する
6. 最終的な採点は、ユーザーが選択・調整した3点だけで行う
7. 将来OpenCV、ML Kit、TensorFlow Lite、Core ML / Visionへ移行する場合は `detectDartCandidatesFromImage` の内部を差し替える
8. 本格的な画像認識を使う場合は、Expo Goではなく EAS Development Build でネイティブ依存を検証する

現在の自動候補βは、Expo Goで動く軽量な候補表示であり、完全な画像認識ではありません。
候補が外れる前提で、手動追加、ドラッグ調整、十字微調整を主導線にしています。

フォーム写真3枚相談MVP:

- `FormPhotoAdviceResult` として、利き手、3枚写真の種類、自己チェック、直近写真スコア連携、助言、確認ポイント、おすすめ練習IDを保存
- `formPhotoAdviceResults` は `AppState` 内の配列として AsyncStorage に保存し、履歴一覧・詳細・削除で利用する
- MVPでは画像そのものの永続保存は必須にせず、結果保存時は写真タイプとメモを中心に残す
- 画像AIによる骨格推定や自動フォーム診断は行わない
- `generateFormPhotoAdvice` が自己チェックと直近 `PracticeRecord.photoScore.groupingAnalysis` を組み合わせて固定ロジックで助言する
- 将来的に Vision、ML Kit、MediaPipe、MoveNet、OpenCV へ拡張する場合は、写真解析層を追加し、`generateFormPhotoAdvice` の入力に姿勢特徴量を渡す構造へ拡張する
- ネイティブ画像解析を使う場合は Expo Go ではなく EAS Development Build で検証する
