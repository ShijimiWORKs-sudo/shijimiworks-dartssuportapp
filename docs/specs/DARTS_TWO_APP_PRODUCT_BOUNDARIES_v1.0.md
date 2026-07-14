# DartsApp / DartsSupportApp 2アプリ役割分担設計書 v1.0

- 文書名: DartsApp / DartsSupportApp 2アプリ役割分担設計書
- 文書バージョン: 1.0
- 基準日: 2026-07-14
- 対象:
  - DartsApp
  - DartsSupportApp
- 廃止する前提:
  - 3アプリ構成
  - 両アプリへの同一ゲーム機能の重複実装
  - DartsAppをiPhone実機だけで正式確認する運用

---

## 1. 正式な2アプリ構成

```text
DartsApp
= 実際に投げる・ゲームする・判定する・実践練習する

DartsSupportApp
= 練習を計画する・管理する・記録する・分析する・相談する
```

両アプリは、別リポジトリ、別UI、別リリース、別QA基準で開発する。

最終的には共通Account IDと共通JSON契約により連携するが、単体完成前に通信・同期を実装しない。

---

## 2. DartsApp

### 2.1 プロダクト目的

実際にダーツを投げる場で利用し、ゲーム、実践練習、カメラ判定、アワード演出を提供する。

### 2.2 短期の正式利用環境

- Windows PC
- Chrome
- Edge
- PC横長画面
- 1280×720以上
- 推奨1920×1080
- マウス
- キーボード
- USB/Webカメラ
- PCスピーカー
- フルスクリーン対応

iPhoneやExpo Goは、DartsAppの正式受入環境ではない。
モバイル表示を確認してもよいが、PC Web確認なしで完了扱いにしない。

### 2.3 DartsAppの責務

#### ゲーム

- 01
  - 301
  - 501
  - 701
  - 901
  - 15ラウンド
  - シングルアウト
  - マスターアウト
  - 将来ダブルアウト
  - ファットブル
  - セパレートブル
- COUNT-UP
  - 8ラウンド固定
- STANDARD CRICKET
  - 15ラウンド
- MATCH
  - 2人対戦専用
  - GAME 1: 501または701
  - GAME 2: STANDARD CRICKET
  - GAME 3: CHOICE
  - CHOICEの01はGAME 1と同じ種別

#### 実践練習

- 道場50ラウンド
- CRICKET COUNT-UP
- ナンバー練習
- ブル練習
- 将来追加する盤面練習モード

#### リアルタイム判定

- カメラ映像取得
- ボード検出
- キャリブレーション
- 盤面座標変換
- ダーツ候補検出
- 得点自動判定
- 候補の手動補正
- 判定確定
- 誤判定取消
- 1投取消
- ターン修正

#### ゲーム進行

- 1P・2P
- プレイヤー交代
- ラウンド管理
- ターン管理
- BUST
- CLOSE
- 得点加算
- 得点減算
- 一時停止
- 再開
- 途中終了
- 結果確定

#### 演出

- SINGLE
- DOUBLE
- TRIPLE
- BULL
- DOUBLE BULL
- LOW TON
- HIGH TON
- HAT TRICK
- THREE IN A BED
- PLAYER CHANGE
- GAME START
- GAME FINISH
- 効果音
- アワード動画

#### 成績・Rating

- ゲーム履歴
- 1投単位の記録
- 総得点
- BULL数・BULL率
- DOUBLE数
- TRIPLE数
- PPD
- 3DA
- MPR
- MATCH勝敗
- DartsApp Rating
- Rating信頼度
- 自動判定・微調整・手動入力の判定元

### 2.4 DartsAppで実装しないもの

- 就寝前・移動中を主用途とする今日の練習管理
- 習慣化を目的とする連続練習日数
- 日常の週間・月間目標管理
- フォーム写真相談
- 悩み入力による固定アドバイス
- 資料ライブラリ
- 練習相談履歴
- iPhone縦画面を主としたサポートUI
- Support用分析ダッシュボードの重複実装

DartsApp内には、その場でゲーム・実践練習を開始するために必要な最小設定と結果表示だけを置く。

---

## 3. DartsSupportApp

### 3.1 プロダクト目的

練習前、練習後、休憩中、移動中、就寝前などに、練習計画、簡易記録、目標、成長、課題、相談を確認する。

### 3.2 短期の正式利用環境

- iPhone
- Expo Go
- 将来Development Build
- 縦画面
- タッチ操作
- モバイル向け下部ナビゲーション
- モバイル向け文字サイズ
- オフライン利用

### 3.3 DartsSupportAppの責務

#### 今日の練習

- 今日のおすすめ
- 今日の予定
- お気に入り練習
- 実施済み管理
- 次にやる練習
- 悩み・目標・最近の傾向からの推薦

#### 練習タイマー

- 練習タイマー
- 休憩タイマー
- 開始
- 一時停止
- 再開
- 終了
- 実施時間保存

#### 練習進行

これは正式ゲームエンジンではなく、練習メニュー進行である。

例:

- ブル練習 10ラウンド × 3投
- ナンバー20練習 5セット × 3投
- フォーム確認 3セット
- 近距離リリース確認 10分

必要機能:

- 現在ラウンド
- 現在セット
- 残り投数
- 完了
- 中断
- 再開
- 簡易達成入力

#### 簡易記録

- 練習メニュー
- 実施日時
- 実施時間
- ラウンド数
- セット数
- BULL本数
- 任意スコア
- 調子
- 達成度
- 感覚メモ
- 使用機種
- 写真スコア・相談結果との関連

#### 目標・習慣

- 週間目標
- 月間目標
- 練習回数目標
- 練習時間目標
- BULL目標
- 達成率
- 連続練習日数
- 今週の練習回数
- 今月の練習回数
- 総練習時間
- 最終練習日

#### 分析・相談

- 練習記録分析
- 週別分析
- 月別分析
- COUNT-UP推移
- BULL推移
- CRICKET marks推移
- グルーピング分析
- フォーム写真相談
- 写真スコア記録
- 改善コメント
- おすすめ練習
- 資料ライブラリ
- 相談履歴
- フォーム相談履歴
- 将来AI/RAG相談

#### Account・データ管理

- 共通account_id
- ローカルAccount
- PIN
- Export
- Import
- Backup
- Restore
- 将来クラウド同期

### 3.4 DartsSupportAppで実装しないもの

- 正式な01ゲームエンジン
- STANDARD CRICKET対戦
- MATCH対戦
- 2Pプレイヤー交代
- BUST判定
- CLOSE・得点競争を含む正式CRICKET進行
- PC用USBカメラ制御
- リアルタイム盤面自動判定
- アワード動画
- DARTSLIVE風ゲーム画面
- DartsApp Ratingの算出本体

DartsSupportAppはDartsAppの結果を将来表示・分析できるが、同じゲームエンジンを持たない。

---

## 4. 機能分担表

| 機能 | DartsApp | DartsSupportApp |
|---|---|---|
| 01正式ゲーム | 主機能 | 実装しない |
| COUNT-UP正式ゲーム | 主機能 | 結果確認・分析 |
| STANDARD CRICKET | 主機能 | 実装しない |
| MATCH | 主機能 | 結果確認 |
| 道場50R | 主機能 | 計画・履歴確認 |
| CRICKET COUNT-UP | 主機能 | 計画・履歴確認 |
| ナンバー練習 | 実践実行 | 計画・簡易記録 |
| ブル練習 | 実践実行 | 計画・簡易記録 |
| リアルタイム判定 | 主機能 | 実装しない |
| 手動補正 | 主機能 | 写真分析のみ |
| アワード演出 | 主機能 | 実装しない |
| Rating算出 | 主機能 | 表示・推移分析 |
| 今日の練習 | 最小導線 | 主機能 |
| タイマー | 補助 | 主機能 |
| 目標管理 | 最小限 | 主機能 |
| 連続練習日数 | 不要 | 主機能 |
| 練習記録 | ゲーム結果 | 主機能 |
| フォーム相談 | 実装しない | 主機能 |
| 資料ライブラリ | 実装しない | 主機能 |
| 詳細分析 | 元データ生成 | 主機能 |
| Account | 実装 | 実装 |
| Backup/Restore | 将来または最小 | 主機能 |
| クラウド同期 | 最終工程 | 最終工程 |

---

## 5. 共通化するデータ契約

共通化するのはデータ契約であり、画面やエンジンではない。

- account_id
- player_id
- practice_menu_id
- game_session_id
- match_session_id
- practice_record_id
- rating_profile_id
- ISO 8601 UTC日時
- game_type
- practice_type
- BULL・DOUBLE・TRIPLE集計
- PPD・3DA・MPR
- Rating形式
- 投擲座標
- 判定元
- CommonEvent
- Outbox
- JSON contract
- sync_status

---

## 6. 共通化しないもの

- UI
- Navigation
- Route
- ゲームエンジン
- カメラ処理
- 練習タイマーUI
- 目標管理UI
- 分析ダッシュボード
- 端末別レイアウト
- リポジトリ
- リリース番号
- テスト環境
- App Store / Web配布手順

---

## 7. 将来のDartsSupportApp Web版

DartsSupportAppは、中長期でPC Webへ展開する。

### iPhone版

- 今日の練習
- タイマー
- 簡易記録
- 目標
- 最近の分析
- 短時間確認

### PC Web版

- 日別・週別・月別推移
- 3か月・6か月・全期間
- 移動平均
- 複数指標比較
- COUNT-UP平均
- BULL率
- BULL周辺集中率
- TRIPLE率
- DOUBLE率
- CRICKET marks
- 練習時間
- 目標達成率
- グルーピング分析
- CSV出力
- 詳細フィルター

同じデータと分析ロジックを共有し、UIだけをデバイスに最適化する。

---

## 8. BULL・グルーピング分析の定義

```text
BULL率
= BULLに入った本数 ÷ 総投数

BULL周辺集中率
= 設定したBULL周辺範囲に入った本数 ÷ 総投数

グルーピング品質
= 投擲座標のまとまりの小ささ

平均中心距離
= 各投擲位置から狙い中心までの平均距離
```

「BULLに入らなかったが周辺にまとまった」上達も評価できるようにする。

---

## 9. リポジトリ境界

### DartsApp

```text
ShijimiWORKs-sudo/shijimiworks-DartsApp_Web
```

役割:

- PC Webゲーム
- 実践練習
- カメラ判定
- Rating算出
- アワード

### DartsSupportApp

```text
ShijimiWORKs-sudo/shijimiworks-dartssuportapp
```

役割:

- iPhone練習管理
- 簡易記録
- 目標
- 習慣
- 分析
- 相談
- Backup/Restore

Codexは一度の工程で片方のリポジトリだけを変更する。

---

## 10. 機能棚卸し分類

既存機能は以下で分類する。

```text
KEEP
正しいアプリにあり、今後も維持する

MOVE_LATER
現在動いているため削除せず、将来適切な場所へ移動または共通化を検討する

HIDE
データ・コードは残すが、現時点の主要導線から外す

REMOVE
明確に不要。ただし棚卸し工程では削除しない

SHARED_CONTRACT
実装は各アプリで異なるが、ID・型・JSON契約を共通化する

REVIEW
情報不足で判断できず、人間確認が必要
```

棚卸し工程は調査と報告だけとし、コード削除・移動・改修をしない。

---

## 11. QA境界

### DartsApp QA

必須:

- PC Chrome
- PC Edge
- 1280×720
- 1920×1080
- マウス
- キーボード
- フルスクリーン
- USB/Webカメラ
- スピーカー
- 1P
- 2P

PCブラウザ確認ができていなければ完了扱いにしない。

### DartsSupportApp QA

必須:

- iPhone実機
- Expo GoまたはDevelopment Build
- 縦画面
- タッチ
- 再起動
- オフライン
- 文字切れ
- 下部Navigation
- Account・PIN
- Backup/Restore

---

## 12. ロードマップ

### DartsApp

1. Account・Rating基盤
2. COUNT-UP
3. 01
4. CRICKET
5. MATCH
6. PC横長ゲームUI
7. アワード・効果音
8. カメラ映像・キャリブレーション
9. リアルタイム判定
10. 手動補正
11. 道場50R
12. CRICKET COUNT-UP
13. ナンバー・ブル練習
14. 単体完成
15. DartsSupportApp連携

### DartsSupportApp

1. 既存練習記録・分析・相談
2. Account・PIN
3. Backup/Restore
4. 今日の練習
5. 練習タイマー
6. ラウンド・セット進行
7. 目標管理
8. 連続練習日数
9. 週別・月別分析
10. PC Web版詳細分析
11. AI/RAG
12. 単体完成
13. DartsApp連携

---

## 13. 今後のCodex指示書の必須ヘッダー

各指示書の冒頭に必ず記載する。

```text
対象アプリ:
対象リポジトリ:
主端末:
今回の目的:
変更可能範囲:
変更禁止範囲:
正式QA環境:
他方のリポジトリ変更禁止:
```

---

## 14. 受入条件

- 2アプリ構成が正式文書化されている
- DartsAppがPC Web主用途として定義されている
- DartsSupportAppがiPhone主用途として定義されている
- ゲームエンジンがDartsSupportAppへ重複実装されない
- Support機能がDartsAppへ無制限に追加されない
- 共通化対象がデータ契約に限定されている
- 両リポジトリの棚卸しが削除なしで行われる
- 各機能にKEEP等の分類と根拠が付く
- 次工程の修正候補が優先順位付きで整理される
