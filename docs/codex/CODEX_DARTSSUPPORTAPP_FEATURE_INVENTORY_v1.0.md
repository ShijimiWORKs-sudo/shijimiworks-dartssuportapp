# DartsSupportApp 機能棚卸し Codex指示書 v1.0

## 0. 作業種別

今回は調査・棚卸し・文書作成だけを行う。

コード実装、削除、移動、非表示化、リファクタリング、migration、依存追加を行わない。

## 1. 対象

- 対象アプリ: DartsSupportApp
- 対象リポジトリ: `ShijimiWORKs-sudo/shijimiworks-dartssuportapp`
- ローカル想定: `C:\制作データ\10_App\DartsPractisAI`
- 主端末: iPhone
- 正式QA環境: Expo Go / Development Build
- 他方のリポジトリ: DartsAppは変更禁止

## 2. 参照文書

以下を最初から最後まで読む。

```text
docs/specs/DARTS_TWO_APP_PRODUCT_BOUNDARIES_v1.0.md
```

既存のREADME、ARCHITECTURE、ROUTES、MVP_FEATURES、QA_CHECKLIST、Account契約、Backup/Restore仕様、AGENTS.mdも確認する。

## 3. 目的

DartsSupportApp内の全機能、画面、route、component、domain、AppState、migration、test、assetを棚卸しし、2アプリ役割分担設計書に照らして分類する。

## 4. 分類

各項目に次のいずれかを付ける。

- KEEP
- MOVE_LATER
- HIDE
- REMOVE
- SHARED_CONTRACT
- REVIEW

今回は分類だけとし、実際の変更は行わない。

## 5. DartsSupportAppでKEEP候補

以下は原則KEEPとして検証する。

- 今日の練習
- おすすめ練習
- 練習タイマー
- 休憩タイマー
- ラウンド・セット進行
- 簡易記録
- 練習履歴
- 目標管理
- 連続練習日数
- 週別・月別分析
- フォーム相談
- フォーム写真相談
- 写真スコア記録
- グルーピング分析
- 改善コメント
- 資料ライブラリ
- お気に入り
- Account
- PIN
- Export / Import
- Backup / Restore
- CommonEvent / Outbox
- 将来Web分析用domain

## 6. DartsSupportAppで要確認候補

以下が存在する場合は、DartsApp機能の重複を確認する。

- 正式01ゲームエンジン
- STANDARD CRICKET対戦
- MATCH対戦
- 2Pプレイヤー交代
- BUST処理
- CRICKETのCLOSE・得点競争
- アワード動画
- DARTSLIVE風ゲーム画面
- USBカメラ制御
- リアルタイム盤面判定
- DartsApp Rating算出本体
- PCゲーム用横長UI

写真スコア機能はSupport機能として維持可能だが、PCリアルタイム判定と混同しないこと。

## 7. 調査対象

最低限、以下を確認する。

### 構成

- package.json
- app.json / eas.json
- route一覧
- app/
- components/
- contexts/
- constants/
- utils/
- features/
- tests/
- assets/
- docs/

### UI

- Home
- Practice
- Record
- Records
- Analysis
- Consult
- Form Photo
- Photo Score
- Knowledge Library
- Favorites
- Settings
- Account
- Backup
- Restore
- Timer
- Goal
- Streak
- Game関連画面

### データ

- Profile
- Practice Record
- Consult History
- Form Photo Advice
- Photo Score
- Grouping Analysis
- Favorite
- Goal
- Timer Session
- Account
- Outbox
- Backup History

### QA

- iPhone縦画面
- Expo Go
- タッチ
- 文字切れ
- 下部Navigation
- 再起動
- オフライン
- Account未登録時
- PIN
- Backup/Restore
- ダーク系背景
- iOS権限

## 8. 実機確認

可能な範囲でExpoを起動し、iPhone主用途として成立するか確認する。

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd test
npm.cmd run validate:data
npm.cmd run start:lan
```

Tunnelは必須ではない。
実機操作が必要な項目は、人間確認項目として分離する。

確認結果:

- Expo起動
- iPhone表示
- 縦画面
- タッチ領域
- Navigation
- 文字色
- 背景テーマ
- 既存記録保持
- DartsAppゲーム機能の混入

## 9. 成果物

以下を新規作成する。

```text
docs/audit/DARTSSUPPORTAPP_FEATURE_INVENTORY_v1.0.md
docs/audit/DARTSSUPPORTAPP_BOUNDARY_GAPS_v1.0.md
docs/audit/DARTSSUPPORTAPP_NEXT_ACTIONS_v1.0.md
```

### FEATURE_INVENTORY

| ID | 機能/画面/データ | パス | 現在状態 | 分類 | 根拠 | 依存 | 次工程 |
|---|---|---|---|---|---|---|---|

### BOUNDARY_GAPS

- 本来必要だが未実装のSupport機能
- 混入した正式ゲーム機能
- 写真スコアとリアルタイム判定の境界
- 今日の練習・タイマー・目標・Streakの不足
- iPhone QA不足
- 将来Web分析へ流用できるdomain
- 共通契約にすべき項目
- 仕様書と実装の不一致

### NEXT_ACTIONS

優先度:

- P0: 境界違反・データ破損・秘密情報
- P1: 次機能前に修正
- P2: iPhone単体完成まで
- P3: Web版・連携前

各Actionに、対象ファイル、目的、変更範囲、禁止範囲、QAを記載する。

## 10. 特に確認する境界

### 写真スコア

KEEP条件:

- 写真選択または撮影
- 候補表示
- 手動微調整
- スコア・グルーピング分析
- 練習記録へ保存

DartsAppへ移す対象ではない。

ただし以下はDartsSupportAppで実装しない:

- USBカメラ常時映像
- 投擲ごとの差分リアルタイム検出
- ゲーム進行への自動入力
- アワード再生

### 練習メニュー

KEEP条件:

- 計画
- タイマー
- ラウンド・セット進行
- 簡易結果
- 目標との関連

正式01・CRICKET・MATCHルールは実装しない。

## 11. 重要ルール

- コードを変更しない
- ファイルを削除しない
- routeを変更しない
- 機能を隠さない
- migrationを追加しない
- AppStateを書き換えない
- packageを追加しない
- mainへマージしない
- DartsAppへ触れない
- 推測だけでREMOVE判定しない
- 不明点はREVIEWにする

## 12. Git

推奨ブランチ:

```text
codex/audit-dartssupportapp-product-boundary-v1
```

commit:

```text
Audit DartsSupportApp product boundaries
```

調査文書だけをcommitし、Draft PRを作成する。
mainへマージしない。

## 13. 完了報告

1. 調査したファイル・route・AppState項目数
2. KEEP件数
3. MOVE_LATER件数
4. HIDE件数
5. REMOVE件数
6. SHARED_CONTRACT件数
7. REVIEW件数
8. DartsSupportAppへ混入している可能性がある正式ゲーム機能
9. 不足している今日の練習・Timer・Goal・Streak
10. 写真スコア境界の判定
11. Expo起動結果
12. 人間側実機確認項目
13. P0・P1の次Action
14. 変更ファイル
15. コード変更なしの確認
16. DartsApp未変更の確認
17. branch
18. commit hash
19. Draft PR URL
