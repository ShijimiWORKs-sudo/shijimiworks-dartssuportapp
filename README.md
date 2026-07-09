# DartsSupportApp

DartsSupportApp は、iPhone でソフトダーツの練習メニュー、記録、分析、フォーム相談を確認するための Expo + React Native MVP です。

MVP v0.1 では実データ連携やAI連携は行わず、端末内ローカル保存と固定ロジックで、主要な画面遷移と練習支援の体験を確認できる状態にしています。

## MVPでできること

- 初期設定: レーティング、利用機種、主な悩みを保存
- 練習メニュー: レベル、悩み、ゲーム種別に応じたメニュー表示
- おすすめ練習: プロフィールと記録に基づく固定ロジック推薦
- 練習記録: 入力、一覧、詳細、編集、削除
- 写真スコア記録: 写真上の手動タップで3本分のスコアを判定して保存
- 分析: 期間別集計、ゲーム別集計、簡易グラフ、改善コメント
- フォーム相談: カテゴリ別の固定アドバイス表示
- 相談履歴: 相談結果の保存、一覧、詳細、削除
- 資料ライブラリ: 知識記事の検索、カテゴリ/タグ絞り込み
- お気に入り: よく使う練習メニューの保存
- 表示設定: 白/グレー系テーマと背景色の切り替え

## 技術スタック

- Expo
- React Native
- TypeScript
- Expo Router
- React Context
- AsyncStorage
- Node.js built-in test runner
- ESLint / Prettier

## Requirements

- Node.js 22 以上
- npm
- iPhone 実機、または iOS Simulator
- iPhone 実機で確認する場合は Expo Go

## Setup

```bash
npm install
```

## Start

```bash
npx expo start
```

起動後、ターミナルに表示されるQRコードを Expo Go で読み取ります。

よく使う起動コマンド:

```bash
npm run start:lan
npm run start:tunnel
```

## iPhone Expo Goで確認する

1. iPhone に Expo Go をインストールします。
2. PC と iPhone を同じネットワークに接続します。
3. `npx expo start` を実行します。
4. Expo Go でQRコードを読み取ります。
5. 初期設定、ホーム、練習記録、分析、相談履歴、資料検索を確認します。

Expo Goで確認している間は、画面上部に「コードスキャナー」などExpo Go側の表示が出ることがあります。これは開発確認用アプリのUIで、TestFlightやstandalone buildでは表示されません。

iOS Simulator が使える環境では、起動中のターミナルで `i` を押すか、次を実行します。

```bash
npm run ios
```

## EAS Build準備

Expo Goは開発確認用アプリ上でJavaScriptを読み込む確認方法です。TestFlightやApp Store配布では、EAS BuildでiOSアプリ本体を作成します。

EAS CLIはグローバルインストールせず、`npx eas-cli` でも利用できます。

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli build:configure
```

このリポジトリには `eas.json` を追加済みです。

```bash
npm run eas:build:preview
npm run eas:build:production
npm run eas:submit:ios
```

Apple Developer Program未加入の場合、iOS配布ビルド、証明書作成、TestFlight提出の段階で止まる可能性があります。Apple Team ID、EAS projectId、App Store Connect情報は実行後に確定するため、架空値は入れていません。

## TestFlightへ進む前に必要なもの

- Apple Developer Programへの加入
- App Store Connectでの新規アプリ作成
- Bundle ID: `com.shijimiworks.dartssupportapp`
- App Store Connect用のPrivacy Policy URL
- サポートURL
- TestFlight用スクリーンショット
- 内部テスター設定

## Legal pages

アプリ内に公開前確認用ページを追加しています。

- `/legal/privacy`
- `/legal/terms`
- `/legal/credits`

v0.1.0時点ではログイン、クラウド同期、AI API連携、公式API連携はなく、入力データは端末内AsyncStorageに保存されます。外部送信は行っていません。

写真スコア記録MVPでは、画像そのものの永続保存は必須にしていません。練習記録には、ボードキャリブレーション、タップ座標、判定結果、合計スコアなどを保存します。

## Display settings

設定画面から表示テーマと背景色を選択できます。

- 背景色: 黒 `#040000`
- 背景色: ブラウン `#955629`
- 背景色: 紫 `#A64A97`
- 背景色: オレンジ `#F6AD3C`
- 背景色: 白 `#FFFFFF`

## Quality checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run validate:data
```

## App identity

- App name: `DartsSupportApp`
- Expo slug: `darts-support-app`
- Version: `0.1.0`
- iOS bundle identifier: `com.shijimiworks.dartssupportapp`
- Logo path: `assets/images/logo.png`
- Icon path: `assets/images/icon.png`
- Splash path: `assets/images/splash.png`

## 現在未対応のこと

- DARTSLIVE / PHOENIX 公式API連携
- AI API連携
- クラウド同期
- ログイン
- 外部グラフライブラリ
- 本番向けデータバックアップ

## 注意

- DARTSLIVE / PHOENIX の公式ロゴ、公式画像、公式APIは使用していません。
- 機種名は文字ラベルとしてのみ使用しています。
- 練習・相談内容は一般化したプロトタイプ用情報です。
- 医療的な診断や治療を目的としたものではありません。

## Docs

- `docs/MVP_FEATURES.md`
- `docs/ROUTES.md`
- `docs/ARCHITECTURE.md`
- `docs/EAS_BUILD_GUIDE.md`
- `docs/TESTFLIGHT_PREP.md`
- `docs/APP_STORE_METADATA_DRAFT.md`
- `docs/QA_CHECKLIST.md`
- `docs/RELEASE_NOTES_v0.1.md`
- `docs/design/README.md`
