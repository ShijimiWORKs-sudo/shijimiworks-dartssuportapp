# DartsSupportApp Boundary Gaps v1.0

- 対象ブランチ: `codex/audit-dartssupportapp-product-boundary-v1`
- 参照仕様:
  - `docs/specs/DARTS_TWO_APP_PRODUCT_BOUNDARIES_v1.0.md`
  - `docs/codex/CODEX_DARTSSUPPORTAPP_FEATURE_INVENTORY_v1.0.md`
- 作業種別: 調査・文書作成のみ

## Executive Summary

DartsSupportApp内に、正式な01ゲームエンジン、STANDARD CRICKET対戦、MATCH、2P交代、BUST、CLOSE得点競争、アワード動画、PC用USBカメラ制御は確認されませんでした。

一方で、Support側の主責務として仕様にある以下は不足しています。

- 今日の予定、実施済み管理、次にやる練習の明確な進行
- 練習タイマー/休憩タイマー
- 練習メニュー用のラウンド・セット進行
- 週間/月間目標
- 連続練習日数
- 月別分析UI
- Backup/Restoreとしてのユーザー向け説明と復元ガードの磨き込み

Account/PIN/Export/Import/CommonEvent/OutboxはPR #1 merge後の`origin/main`へ反映済みです。

## Formal Game Leakage Check

| 確認項目                | 判定     | 根拠                                                                                                | 対応                           |
| ----------------------- | -------- | --------------------------------------------------------------------------------------------------- | ------------------------------ |
| 正式な01ゲームエンジン  | 混入なし | `01`は`PracticeGame`、練習メニュー、記録種別として使われるのみ。301/501/701/901進行、残点、BUSTなし | KEEP。ただし正式ゲーム化しない |
| STANDARD CRICKET対戦    | 混入なし | CRICKETは記録種別・練習メニュー・分析カテゴリ。CLOSE/得点競争/対戦進行なし                          | KEEP。ただしCLOSEを入れない    |
| MATCH・2P対戦           | 混入なし | route/state/logicにMATCH、2P交代なし                                                                | 変更不要                       |
| BUST処理                | 混入なし | BUST keyword/残点管理なし                                                                           | 変更不要                       |
| プレイヤー交代処理      | 混入なし | 1P/2P turn managerなし                                                                              | 変更不要                       |
| アワード動画            | 混入なし | video assetやaward再生なし                                                                          | 変更不要                       |
| PC用USBカメラ制御       | 混入なし | `expo-image-picker`による写真選択/撮影のみ                                                          | KEEP                           |
| DARTSLIVE風ゲーム画面   | 混入なし | ゲームUIではなく練習管理UI                                                                          | 変更不要                       |
| DartsApp Rating算出本体 | 混入なし | ratingは自己申告/level判定のみ                                                                      | KEEP                           |

## Photo Score Boundary

判定: `KEEP`

写真スコア機能はSupport用途の範囲に収まっています。

Supportとして妥当な点:

- 写真を選択または撮影する
- 中心、20方向、外周を手動キャリブレーションする
- 候補表示はβであり、自動確定しない
- ユーザーが3本の刺さり先端を選択・微調整する
- スコア、Bull/Triple/Double数、グルーピング分析を練習記録へ保存する
- 記録後に分析・フォーム相談へ接続する

DartsSupportAppで実装しない境界:

- USB/Webカメラ常時映像
- 投擲ごとのリアルタイム差分検出
- ゲーム進行への自動入力
- 誤判定取消/ターン修正
- アワード再生
- PC横長ゲームUI

注意点:

- `calculateDartScore.ts` は盤面座標から3本の得点を出す補助ロジックであり、正式ゲーム進行ではない。
- ただし将来、ラウンド進行や残点管理と結合するとDartsApp領域へ寄るため、Supportでは「写真から簡易記録」に留める。

## Today Practice Gaps

現在状態:

- `/practice` に今日のおすすめ3件と補助3件がある。
- `recommendPracticeMenus` がプロフィール、悩み、記録数、ブル数、CRICKET記録不足を見て推薦する。
- `/home` におすすめ練習カードがある。

不足:

- 今日の予定として固定する機能がない
- 今日実施済み/未実施の管理がない
- 複数メニューを1日のセッションとして束ねる機能がない
- 「次にやる練習」の進行状態がない
- タイマー、ラウンド、セット、達成度入力との接続がない
- 週/月目標との接続がない

境界判定:

- 推薦・計画としては`KEEP`
- 実施済み管理や進行は`MOVE_LATER`

## Timer / Round / Goal / Streak Gaps

| 項目         | 現在状態                                 | 分類       | 次工程                              |
| ------------ | ---------------------------------------- | ---------- | ----------------------------------- |
| 練習タイマー | route/stateなし                          | MOVE_LATER | P1でPracticeSession Timerとして追加 |
| 休憩タイマー | route/stateなし                          | MOVE_LATER | P2で追加                            |
| ラウンド進行 | メニューstepsに説明はあるが進行stateなし | MOVE_LATER | P1でSupport用練習進行として追加     |
| セット進行   | メニュー文言に存在。実行UIなし           | MOVE_LATER | P1で追加                            |
| 練習時間保存 | PracticeRecordにdurationなし             | MOVE_LATER | P1でrecord拡張検討                  |
| 週間目標     | 未実装                                   | MOVE_LATER | P1でGoal型追加                      |
| 月間目標     | 未実装                                   | MOVE_LATER | P2で追加                            |
| 連続練習日数 | 未実装                                   | MOVE_LATER | P2でrecordsから算出またはstate追加  |

## Analysis Gaps

現在状態:

- 期間フィルタ: 7日、30日、90日、全期間
- COUNT-UP平均
- Bull平均
- Cricket marks平均
- gameType別集計
- condition counts
- trend direction
- weekly summary util

不足:

- 月別分析UI
- 週別分析UIの明示表示
- 練習時間分析
- 目標達成率
- 移動平均
- BULL周辺集中率
- Web版向け詳細フィルター
- CSV出力

境界判定:

- 現在の分析は`KEEP`
- PC Web詳細分析へ流用するdomainは`SHARED_CONTRACT`
- 月別/週別UI拡張は`MOVE_LATER`

## Account / PIN / Export / Import Status

現在状態:

- `docs/specs/Darts_Common_Account_Data_Contract_v1.0.md` と `docs/codex/CODEX_SUPPORT_ACCOUNT_CONTRACT_v1.0.md` は存在する。
- 現在ブランチの`types/index.ts`は `schemaVersion: 10`。
- `AppState` に `accounts`、`activeAccountId`、`accountLockEnabled`、`commonOutbox` がある。
- `UserProfile` と `PracticeRecord` に optional `accountId` がある。
- 新規練習記録は `activeAccountId` があれば `accountId` を保存する。
- 既存練習記録は `accountId` 未設定でも読める互換処理を維持している。
- `app/account/export.tsx`、`import.tsx`、`index.tsx`、`profile.tsx`、`register.tsx`、`security.tsx`、`unlock.tsx` がある。
- `expo-secure-store` dependency と `features/account/application/pinService.ts` がある。
- PINはSecureStoreへ保存し、AppState、AsyncStorage内のAppState JSON、Export JSONには保存しない設計。
- CommonEvent/Outboxは `CommonOutboxItem` と `commonOutbox` としてローカル保持される。

判定:

- Account画面、PIN、Export/Import UIは`KEEP`
- account_id、activeAccountId、PracticeRecord.accountId、CommonEvent/Outbox、共通JSONは`SHARED_CONTRACT`
- Account実装状況確認は完了し、P0から除外済み

Import MVP仕様と既知制限:

- JSON parse、contractVersion、account_id、秘密情報混入を検証し、preview後にImportする。
- 同一recordはskipし、差分があるrecordはconflict扱いにするMVP。
- 画像URI、PIN、hash、token、secret、SecureStore keyはExport対象外。
- クラウド同期、Supabase、Apple/Google Login、API通信、複数端末同期は未実装。
- ImportはローカルMVPであり、DartsAppとの自動通信や双方向同期は行わない。

## Shared Contract Candidates

DartsAppと共通契約にすべきデータ:

- `account_id`
- `player_id` / OWNER profile
- `practice_record_id`
- `practice_menu_id`
- `game_session_id`
- `match_session_id`
- `game_type`
- `practice_type`
- ISO 8601 UTC datetime
- BULL/DOUBLE/TRIPLE集計
- COUNT-UP score
- CRICKET marks
- PPD/3DA/MPR
- Rating profile
- normalized throw coordinate
- board calibration
- detection source
- photo score grouping metrics
- CommonEvent
- Outbox
- sync_status
- JSON contract version

## Domain Reusable for Future PC Web Analysis

将来PC Web分析へ流用できるdomain:

- `utils/analyzePracticeRecords.ts`
- `utils/analyzePhotoScoreGrouping.ts`
- `utils/recommendPracticeMenus.ts`
- `utils/searchKnowledgeBase.ts`
- `utils/generateConsultAdvice.ts`
- `utils/generateFormPhotoAdvice.ts`
- `utils/boardCoordinateTransform.ts`
- `utils/calculateDartScore.ts`
- `types` のAnalysis系、PhotoScore系、PracticeRecord系
- `constants/practiceMenus.ts`
- `constants/knowledgeBase.ts`

注意:

- UI、navigation、BottomNav、iPhone向けカードレイアウトは共通化しない。
- DartsAppのゲームエンジンやPCカメラ処理とは共通化しない。

## Spec / Implementation Mismatches

| 項目                | 仕様                            | 現実装           | 分類       |
| ------------------- | ------------------------------- | ---------------- | ---------- |
| Account             | 共通account_id、ローカルAccount | 実装済み         | KEEP       |
| PIN                 | SecureStore保存                 | 実装済み         | KEEP       |
| Export/Import       | 共通JSON                        | MVP実装済み      | KEEP       |
| Backup/Restore      | Support主機能                   | Account配下にMVP | KEEP       |
| 今日の予定/実施済み | Support主機能                   | 推薦のみ         | MOVE_LATER |
| Timer               | Support主機能                   | 未実装           | MOVE_LATER |
| Round/Set進行       | Support主機能                   | 未実装           | MOVE_LATER |
| Goal/Streak         | Support主機能                   | 未実装           | MOVE_LATER |
| 月別分析            | Support主機能                   | 明示UIなし       | MOVE_LATER |

## Boundary Conclusion

現時点のDartsSupportAppは、練習管理・簡易記録・写真スコア・分析・相談のSupportアプリとして概ね境界内です。
正式ゲームエンジンの混入は確認されませんでした。

最優先のギャップは、今日の練習を「推薦」から「実施管理」へ進めることと、練習タイマー/ラウンド/目標をSupport用PracticeSessionとして整理することです。
