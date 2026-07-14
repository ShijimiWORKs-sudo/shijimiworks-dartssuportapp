# Architecture

DartsSupportApp MVP v0.1 の構成メモです。

## app/

Expo Router のルート画面を配置します。

- `app/index.tsx`: 初期設定
- `app/home.tsx`: ホーム
- `app/practice*.tsx`: 練習メニューと履歴
- `app/record.tsx`: 練習記録入力
- `app/records*.tsx`: 練習記録一覧/詳細/編集
- `app/photo-score*.tsx`: 写真スコア記録、基準画像登録、候補選択、結果保存
- `app/analysis.tsx`: 分析
- `app/consult*.tsx`: フォーム相談と相談履歴
- `app/library*.tsx`: 資料ライブラリ
- `app/favorites.tsx`: お気に入り練習
- `app/settings.tsx`: 設定編集
- `app/account/*.tsx`: ローカルAccount、PIN、Export/Import

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

- `accounts`
- `activeAccountId`
- `accountLockEnabled`
- `commonOutbox`
- `profile`
- `records`
- `favoritePracticeMenuIds`
- `practiceFilterState`
- `consultHistories`
- `formPhotoAdviceResults`
- `boardReferenceImages`

## utils/

画面から分離したロジックです。

- `analyzePracticeRecords.ts`: 分析集計
- `recommendPracticeMenus.ts`: おすすめ練習
- `generateConsultAdvice.ts`: 相談回答
- `generateFormPhotoAdvice.ts`: フォーム写真3枚相談の固定ロジック助言
- `createConsultHistory.ts`: 相談履歴生成
- `searchKnowledgeBase.ts`: 資料検索
- `detectDartCandidatesFromImage.ts`: 写真スコアの自動候補β検出入口
- `detectDartCandidatesFromDifference.ts`: 基準画像比較候補の入口とフォールバック制御
- `evaluatePhotoDetectionQuality.ts`: 基準画像と現在画像のキャリブレーション品質評価
- `boardCoordinateTransform.ts`: 画像座標とボード正規化座標の変換
- `photoScoreCandidates.ts`: キャリブレーション候補生成、候補マージ、ヒット生成
- `analyzePhotoScoreGrouping.ts`: 写真スコア3点のグルーピング、偏り、散り方、助言生成
- `appStateMigration.ts`: 保存データmigration
- `validateDataIntegrity.ts`: DB参照整合性チェック

## features/account/

共通Account契約とローカル認証の境界です。

- `accountService.ts`: UUID v4生成、ローカルAccount作成/更新/論理削除、PIN形式検証、CommonEvent生成
- `pinService.ts`: `expo-secure-store` を使ったPIN保存/確認/削除
- `commonContractMapper.ts`: Darts共通JSON Export形式への変換、秘密情報除外、Import envelope検証
- `commonContractImport.ts`: Import JSON preview、Account/練習記録の変換、既存記録とのmerge

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
  schemaVersion: 10,
  accounts: LocalAccount[],
  activeAccountId: string | null,
  accountLockEnabled: boolean,
  commonOutbox: CommonOutboxItem[],
  profile: UserProfile | null,
  records: PracticeRecord[], // photoScore?: PhotoScoreEntry を含む場合あり
  favoritePracticeMenuIds: string[],
  practiceFilterState: PracticeFilterState,
  consultHistories: ConsultHistory[],
  formPhotoAdviceResults: FormPhotoAdviceResult[],
  boardReferenceImages: BoardReferenceImage[],
  uiTheme: 'light' | 'gray',
  backgroundTheme: 'black' | 'brown' | 'purple' | 'orange' | 'white'
}
```

## schemaVersion 10

schemaVersion 10 では、Darts共通Accountデータ契約 v1.0 へ向けて以下を追加しています。

- `LocalAccount`: UUID v4形式の `accountId`、`userName`、`displayName`、任意email、status、authMode
- `activeAccountId`: 端末内で現在使うAccount
- `UserProfile.accountId`: OWNERプロフィールとの紐付け
- `PracticeRecord.accountId`: 新規記録の所有Account。既存記録では未設定を許容
- `accountLockEnabled`: PINロック設定状態
- `CommonOutboxItem[]`: 将来同期用のlocal-onlyイベント

PIN値やPIN関連秘密情報は AppState / AsyncStorage / Export JSON には保存しません。
`pinService.ts` が `expo-secure-store` の `darts_support_account_pin_v1:{accountId}` キーにPINを保存します。
このPINは端末内ロック用であり、クラウド認証済みとは扱いません。

CommonEvent / Outbox:

- `account_created`
- `account_profile_updated`
- `practice_session_completed`
- `consultation_saved`
- `record_deleted`

現時点の `syncStatus` は `local_only` です。DartsApp通信、Supabase、クラウド同期、API送信は未実装です。

Common JSON Export / Import:

- Export envelopeは `contractName: darts_common_data`、`contractVersion: 1`、`sourceApp: darts_support_app`
- `account`、OWNER `profile`、`practice_records`、相談/フォーム写真履歴、お気に入り、filter、outboxを含める
- PIN、hash、token、secret、SecureStore情報、画像URIは除外
- ImportはJSON構文、contract、version、UUID v4、payload形状、秘密情報混入を検証する
- Import preview後、同一record ID同一内容はskip、同一ID別内容はconflict、異なるIDは追加する
- ImportされたAccountはPINを復元せず `local_no_auth` として扱う

Migration方針:

- schemaVersion 1〜9 は `accounts: []`、`activeAccountId: null`、`accountLockEnabled: false`、`commonOutbox: []` を補完
- 既存のプロフィール、練習記録、相談履歴、写真スコア、フォーム写真相談、基準画像は維持
- Account未登録でも既存機能は利用可能
- migrationは前進・冪等で、壊れたJSONはlegacy/default値へフォールバック

## schemaVersion 9 and earlier

schemaVersion 9までは相談履歴保存の `consultHistories`、フォーム写真相談結果の `formPhotoAdviceResults`、写真スコア基準画像の `boardReferenceImages`、実機表示調整用の `uiTheme`、背景色選択用の `backgroundTheme`、写真スコア記録用の `PracticeRecord.photoScore` を扱います。

初期値:

- `uiTheme`: `gray`
- `backgroundTheme`: `white`
- `boardReferenceImages`: `[]`

Migration方針:

- schemaVersion 1〜9 は `consultHistories: []`、`formPhotoAdviceResults: []`、`boardReferenceImages: []`、`uiTheme: 'gray'`、`backgroundTheme: 'white'`、Account関連初期値を必要に応じて補完
- 既存のプロフィール、練習記録、お気に入り、フィルタ条件、相談履歴、フォーム写真相談結果、写真スコア関連データは維持
- 壊れたJSONはクラッシュさせず、legacy/default値へフォールバック
- 複雑な破損データ修復はMVP範囲外

写真スコアMVP:

- 画像そのものの永続保存は必須にしない
- `BoardCalibration`、タップ座標、`DartHitResult[]`、合計スコア、Bull/Triple/Double数を保存
- `PhotoScoreGroupingAnalysis` はグループ中心、まとまり半径、上下左右の偏り、縦散り/横散り、助言をoptionalで保存
- `DartHitResult` には `detectionSource`、`candidateId`、`confidence` をoptionalで保存
- `detectionSource` は `imageAnalysisCandidate`、`autoCandidate`、`manualTap`、`adjusted` を扱う
- `BoardReferenceImage` は空のボード写真URI、ボード種別、キャリブレーション、撮影メモ、画像サイズを保存する
- 分析画面は既存の `score` / `bullCount` を使うため、大きな変更なしで反映される

写真スコア候補フロー:

1. `detectDartCandidatesFromDifference` が基準画像、現在画像URI、現在キャリブレーションを受け取る
2. `evaluatePhotoDetectionQuality` が中心差、外周半径差、20方向角度差、縦横比差を評価する
3. MVPでは実ピクセル差分は未実装のため、`detectDifferenceCandidates` は差し替え用の境界として空配列を返す
4. 差分候補がない場合、`fallbackToSingleImageCandidates` が `detectDartCandidatesFromImage` の自動候補βへフォールバックする
5. 画像候補が作れない場合、`generateCalibrationBasedCandidates` がボード幾何ベースの補助候補を返す
6. `mergePhotoScoreCandidates` が画像候補βと補助候補を統合し、近い候補を重複除去して最大件数へ制限する
7. ユーザーが候補を選択するか、手動で刺さった先端位置を追加し、ドラッグまたは十字ボタンで微調整する
8. 最終的な採点は、ユーザーが選択・調整した3点だけで行う
9. 将来OpenCV、ML Kit、TensorFlow Lite、Core ML / Visionへ移行する場合は `detectDifferenceCandidates` または `detectDartCandidatesFromImage` の内部を差し替える
10. 本格的な画像認識を使う場合は、Expo Goではなく EAS Development Build でネイティブ依存を検証する

現在の自動候補βは、Expo Goで動く軽量な候補表示であり、完全な画像認識ではありません。
候補が外れる前提で、手動追加、ドラッグ調整、十字微調整を主導線にしています。

基準画像比較フェーズ1:

- `/photo-score/reference` でボード種別ごとに空のボード基準画像を管理する
- `/photo-score/reference/register` で空ボード写真、中心、20方向、外周、撮影条件メモを保存する
- `/photo-score/mark` では登録済み基準画像がある場合に「基準画像と比較して候補を探す」を表示する
- 現在は品質評価とフォールバックの導線を完成させ、実ピクセル差分は未実装
- `PhotoDetectionQuality` と `DifferenceDetectionResult` は将来の画像差分/AI検出結果を同じUIに流し込むための境界

フォーム写真3枚相談MVP:

- `FormPhotoAdviceResult` として、利き手、3枚写真の種類、自己チェック、直近写真スコア連携、助言、確認ポイント、おすすめ練習IDを保存
- `formPhotoAdviceResults` は `AppState` 内の配列として AsyncStorage に保存し、履歴一覧・詳細・削除で利用する
- MVPでは画像そのものの永続保存は必須にせず、結果保存時は写真タイプとメモを中心に残す
- 画像AIによる骨格推定や自動フォーム診断は行わない
- `generateFormPhotoAdvice` が自己チェックと直近 `PracticeRecord.photoScore.groupingAnalysis` を組み合わせて固定ロジックで助言する
- 将来的に Vision、ML Kit、MediaPipe、MoveNet、OpenCV へ拡張する場合は、写真解析層を追加し、`generateFormPhotoAdvice` の入力に姿勢特徴量を渡す構造へ拡張する
- ネイティブ画像解析を使う場合は Expo Go ではなく EAS Development Build で検証する
